# Email Verification Setup Guide

## Overview
The email verification system now routes through your backend using **nodemailer** and **Gmail**. This allows reliable email delivery for verification links.

---

## Setup Steps

### 1. Get Gmail App Password

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. If prompted, complete 2-factor authentication
3. Select **Mail** and **Windows Computer** (or your device)
4. Google will generate a 16-character app password
5. Copy this password

### 2. Set Environment Variables

On your backend server, set these environment variables:

```bash
# Option A: Set in terminal (for development)
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASSWORD="your-16-char-password"
node server.js

# Option B: Create .env file in /backend directory
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-password

# Then load it before running server:
source .env
node server.js
```

### 3. Update Backend Configuration

Edit `/backend/server.js` and verify the transporter is configured:

```javascript
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

Currently uses:
- **From**: noreply.violess@gmail.com (update as needed)
- **Service**: Gmail (SMTP)
- **Credentials**: Environment variables

### 4. Test Email Sending

```bash
curl -X POST http://localhost:5000/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-user-id",
    "email": "your-test-email@gmail.com"
  }'
```

Expected response:
```json
{"success": true, "message": "Verification email sent"}
```

---

## Mobile App Flow

When a user registers:

1. **Step 0**: User enters account details → Backend creates account in "users" collection
2. **Firebase Account**: Mobile creates Firebase auth user
3. **Email Sent**: Backend generates verification link and sends email
4. **Step 1**: User clicks verification link in email → Email verified
5. **Step 2**: User completes profile → Account ready

---

## Troubleshooting

### Email Not Arriving

**Check 1: Gmail App Password**
- Verify you're using a Gmail app password, NOT your regular password
- 16-character password from [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

**Check 2: Environment Variables**
```bash
echo $EMAIL_USER
echo $EMAIL_PASSWORD
```
Both should show values (not empty)

**Check 3: Backend Logs**
```bash
tail -f /tmp/server.log
```
Look for errors like "Invalid login" or "SMTP error"

**Check 4: Gmail Account Settings**
- "Less secure app access" is NOT needed for app passwords
- 2-factor authentication MUST be enabled first
- Check Gmail's "Security" → "Devices and security" page

### "Invalid email or password" Error

This means the environment variables are not set correctly:
- `EMAIL_USER` is not a valid Gmail address
- `EMAIL_PASSWORD` is not a valid app password

Solution:
1. Get new app password from Gmail
2. Set both environment variables
3. Restart backend: `pkill -f "node server.js"` then `node server.js`

### "SMTP Error" in Logs

**Error**: SMTP 535-5.7.8 Username and password not accepted
- Check that app password is exactly 16 characters (may have spaces)
- Ensure EMAIL_USER is the full Gmail address

---

## Alternative Email Services

If you don't want to use Gmail, you can switch providers:

### SendGrid Example
```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});
```

### Mailgun Example
```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.mailgun.org",
  port: 587,
  auth: {
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_PASSWORD,
  },
});
```

---

## Security Notes

- **Never commit credentials** to git
- Always use environment variables
- Use app passwords, not email passwords
- Keep logs private (don't share `/tmp/server.log`)
- For production, use a dedicated email service account

---

## API Endpoint Reference

### Send Verification Email

```
POST /send-verification-email
Content-Type: application/json

{
  "uid": "user-firebase-uid",
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Verification email sent"
}
```

---

**Last Updated**: 2026-04-04
**Status**: Ready for deployment with Gmail setup

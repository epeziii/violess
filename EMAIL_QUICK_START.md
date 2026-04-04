# Email Verification - Quick Start

## ✅ What's Fixed
The email verification system now works! Users will receive verification emails during registration.

## ⚙️ What You Need to Do

### 1️⃣ Set Up Gmail (Required for emails to send)

Get Gmail App Password:
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Choose **Mail** + **Windows Computer**
3. Create app password (16 characters)
4. Copy it

### 2️⃣ Configure Backend

Set environment variables on your backend server:

```bash
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASSWORD="copy-paste-the-16-char-password-here"
node server.js
```

### 3️⃣ Test It Works

```bash
# Test the email endpoint
curl -X POST http://localhost:5000/send-verification-email \
  -H "Content-Type: application/json" \
  -d '{"uid": "test", "email": "your-email@gmail.com"}'
```

Should see: `{"success": true, "message": "Verification email sent"}`

### 4️⃣ Test Mobile Registration

1. Rebuild mobile app
2. Create new account
3. Check your inbox for verification email
4. Click the verification link
5. Continue registration

## 📁 Documentation

- **EMAIL_SETUP_GUIDE.md** - Detailed setup instructions
- **EMAIL_VERIFICATION_FIX.md** - What was fixed and why
- **FINAL_CHECKLIST.md** - All remaining deployment tasks

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Email not arriving | Check Gmail app password is correct (not regular password) |
| Server error on email | Verify EMAIL_USER and EMAIL_PASSWORD are set |
| Still not working | See EMAIL_SETUP_GUIDE.md troubleshooting section |

## 📊 Registration Flow (Now Working)

```
User Registration
    ↓
Account Created (backend)
    ↓
Firebase User Created
    ↓
Verification Email Sent ✅ (NEW - Backend sends this)
    ↓
User Clicks Link in Email
    ↓
Email Verified ✅
    ↓
Profile Completed
    ↓
Registration Complete! 🎉
```

---

**Next Steps**: Follow the steps above, then test the registration flow on your mobile app.

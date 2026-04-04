# ⚡ Firebase Email Verification - SIMPLE FIX

## What's Wrong
Firebase's email verification needs to be enabled in Firebase Console. It's OFF by default.

## What to Do (2 Minutes)

### 1. Open Firebase Console
https://console.firebase.google.com

### 2. Select Your Project
Click **violess-4e542**

### 3. Go to Authentication
Left sidebar → **Authentication**

### 4. Click "Sign-in method" Tab
Should show different providers

### 5. Find "Email/Password"
Look for the row with email icon

### 6. Click It
If it says "Disabled" - click to enable

### 7. Toggle ON
Turn on Email/Password provider

### 8. Save
Button at bottom right

### 9. Rebuild Mobile App
Stop and restart the app build

### 10. Test Creating Account
Create new account → should now send verification email

---

## That's It!
Your Firebase now has email verification enabled. Users will get emails when they register.

## Still Not Working?

### Check 1: Verify It's Enabled
- Go back to Authentication → Sign-in method
- Email/Password should have a **checkmark ✓**

### Check 2: Look at Email Templates
- In Sign-in method page
- Scroll to **Email Templates**
- Should say "Email Verification"
- If nothing there, templates need setup (rare)

### Check 3: Test Email
- Use real email (gmail, outlook, etc)
- Not test@example.com
- Check spam folder

### Check 4: Rebuild App
- Stop current build
- `npm start` or `expo start` fresh
- Try again

---

Done! ✅

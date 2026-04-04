# Violess Platform Separation Deployment Guide

## 📋 Current Status

✅ **Backend**: Running on port 5000 with mobile user endpoints
✅ **Mobile App**: Updated to use new backend API endpoints
✅ **Security Rules**: Created in `/backend/firestore.rules`

---

## 🚀 Step 1: Configure Email Verification (NEW)

Email verification is now handled by the backend. Follow the setup:

1. Open `/EMAIL_SETUP_GUIDE.md` for detailed instructions
2. Get Gmail app password from [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Set environment variables:
   ```bash
   export EMAIL_USER="your-gmail@gmail.com"
   export EMAIL_PASSWORD="your-16-char-app-password"
   ```
4. Restart backend to load new credentials

**Without this**: Users can register but won't receive verification emails.

---

## 🚀 Step 2: Deploy Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project **violess-4e542**
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the contents of `/backend/firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ─── STAFF COLLECTION (Web-only) ────────────────────────────────
    // Only staff members can read/write their own profiles
    // Only backend with Admin SDK can create/update staff accounts
    match /staff/{uid} {
      // Authenticated users can only read their own staff profile
      allow read: if request.auth.uid == uid;
      // Staff cannot write their own profiles (only backend/admin can update)
      allow write: if false;
    }

    // ─── USERS COLLECTION (Mobile users) ────────────────────────────
    // Mobile users can CRUD their own profiles
    match /users/{uid} {
      // Authenticated users can read and write their own profile
      allow read: if request.auth.uid == uid;
      allow create: if request.auth.uid == uid &&
                       request.resource.data.keys().hasAll(['firstName', 'lastName', 'email', 'phone']);
      allow update: if request.auth.uid == uid;
      allow delete: if request.auth.uid == uid;
    }

    // ─── DEFAULT DENY ──────────────────────────────────
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

5. Click **Publish**

### Option B: Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

---

## 🧪 Step 3: Test Mobile App Configuration

### For Android Emulator:
- API URL is set to `http://10.0.2.2:5000` ✅
- This is the standard way to access host machine from Android emulator

### For iOS Simulator:
- Change in `/mobile/src/config/api.js`:
```javascript
export const API_BASE_URL = 'http://localhost:5000';
```

### For Physical Device:
- Find your machine's IP: `ifconfig` or `ipconfig`
- Update `/mobile/src/config/api.js`:
```javascript
export const API_BASE_URL = 'http://192.168.x.x:5000'; // Replace with your IP
```

---

## ✅ Step 4: Verify Everything Works

### Test Backend:
```bash
curl -X POST http://localhost:5000/register-user \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "TestPass123",
    "phone": "09123456789",
    "barangay": "Test Barangay"
  }'
```

Expected response:
```json
{"success": true, "uid": "user-uid-here"}
```

### Test Platform Separation:

1. **Register a new mobile user** in the app (not staff)
   - This creates account in "users" collection

2. **Try to login with staff account** (from web portal)
   - Should FAIL - staff accounts not in "users" collection
   - Error: "Invalid email or password" or "User profile not found"

3. **Login with new mobile user**
   - Should SUCCESS - account in "users" collection

---

## 🔧 API Endpoint Reference

### Send Verification Email ✨ NEW
```
POST /send-verification-email
Body: {
  "uid": "string",
  "email": "string"
}
Response: { "success": true, "message": "Verification email sent" }
```

### Register Mobile User
```
POST /register-user
Body: {
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "barangay": "string (optional)"
}
Response: { "success": true, "uid": "uid" }
```

### Login Mobile User
```
POST /login-user
Body: {
  "email": "string",
  "password": "string"
}
Response: {
  "success": true,
  "uid": "uid",
  "email": "email",
  "profile": { ...user profile... }
}
```

### Update User Profile
```
POST /update-user
Body: {
  "uid": "string",
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "phone": "string (optional)",
  "barangay": "string (optional)",
  "avatar": "string (optional)"
}
Response: { "success": true }
```

### Get User Profile
```
GET /user/:uid
Response: { "success": true, "user": { ...profile... } }
```

---

## 📱 Mobile Integration Summary

### Updated Files:
- ✅ `/mobile/src/screens/auth/LoginScreen.js` - Uses backend `/login-user`
- ✅ `/mobile/src/screens/auth/RegisterScreen.js` - Uses backend endpoints
- ✅ `/mobile/src/navigation/AppNavigator.js` - Verifies "users" collection membership
- ✅ `/mobile/src/config/api.js` - Shared API configuration

### Flow:
1. User registers → Backend creates entry in "users" collection
2. User verifies email → Allowed to enter step 2
3. User completes profile → Backend saves to "users" collection
4. User logs in → Mobile checks "users" collection, rejects if staff

---

## 🚨 Platform Separation Enforcement

**3 layers of protection:**
1. **Backend**: `/login-user` only checks "users" collection
2. **Firestore Rules**: "users" collection read/write by user only
3. **Mobile App**: AppNavigator verifies user exists in "users" collection before allowing access

---

## ❌ Troubleshooting

### Issue: "Network request failed"
- Check backend is running: `ps aux | grep "node server.js"`
- Verify API URL in `/mobile/src/config/api.js`
- For emulator, use `10.0.2.2` not `localhost`

### Issue: "All required fields are required"
- Ensure you're sending: firstName, lastName, email, password, phone

### Issue: "Email already registered"
- Use a different email for each test

### Issue: Staff can still login on mobile
- Verify Firestore rules are published
- Clear app cache/reinstall
- Check user NOT in "users" collection


# ✅ Supabase Migration Setup Complete

**Status**: Environment files created ✅ | Backend server ready ✅ | Schema pending manual application ⏳

---

## 📋 WHAT'S BEEN DONE

### 1. ✅ Environment Files Created

**Backend** (`backend/.env`):
```
SUPABASE_URL=https://usjeipxsrpplsjmabvei.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_6h3yhv6XsUXMgBJjUjYrjw_TzLFitil
FIREBASE_API_KEY=AIzaSyBJWEhVnf3s3fhXcMXs9-9rxlSZjQdvt6w
FIREBASE_AUTH_DOMAIN=violess-4e542.firebaseapp.com
FIREBASE_PROJECT_ID=violess-4e542
FIREBASE_STORAGE_BUCKET=violess-4e542.appspot.com
FIREBASE_MESSAGING_SENDER_ID=825405098932
FIREBASE_APP_ID=1:825405098932:web:41e61e6c0b3c5c6e7f8g9h
PORT=5000
NODE_ENV=development
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Web** (`web/.env.local`):
```
REACT_APP_SUPABASE_URL=https://usjeipxsrpplsjmabvei.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_3Drqr2HBt4dqV3jRrLvhqw_-nKuMyw8
REACT_APP_FIREBASE_API_KEY=AIzaSyBJWEhVnf3s3fhXcMXs9-9rxlSZjQdvt6w
REACT_APP_FIREBASE_AUTH_DOMAIN=violess-4e542.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=violess-4e542
REACT_APP_FIREBASE_STORAGE_BUCKET=violess-4e542.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=825405098932
REACT_APP_FIREBASE_APP_ID=1:825405098932:web:41e61e6c0b3c5c6e7f8g9h
REACT_APP_BACKEND_URL=http://localhost:5000
```

**Mobile** (`mobile/.env`):
```
SUPABASE_URL=https://usjeipxsrpplsjmabvei.supabase.co
SUPABASE_ANON_KEY=sb_publishable_3Drqr2HBt4dqV3jRrLvhqw_-nKuMyw8
FIREBASE_API_KEY=AIzaSyBJWEhVnf3s3fhXcMXs9-9rxlSZjQdvt6w
FIREBASE_AUTH_DOMAIN=violess-4e542.firebaseapp.com
FIREBASE_PROJECT_ID=violess-4e542
FIREBASE_STORAGE_BUCKET=violess-4e542.appspot.com
FIREBASE_MESSAGING_SENDER_ID=825405098932
FIREBASE_APP_ID=1:825405098932:web:41e61e6c0b3c5c6e7f8g9h
BACKEND_URL=http://localhost:5000
```

### 2. ✅ Backend Server Verified
- Server starts successfully on port 5000
- Supabase client initializes without errors
- All API endpoints are ready

### 3. ✅ Dependencies Installed
```bash
✓ @supabase/supabase-js@2.112.3
✓ @supabase/ssr@0.12.4
```

---

## 🔄 NEXT STEPS: Apply SQL Schema to Supabase

### Option A: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Console**:
   - Open https://app.supabase.com
   - Select your project: `violess-4e542`

2. **Apply the Schema**:
   - Navigate to **SQL Editor** (left sidebar)
   - Click **"New Query"**
   - Open file: `backend/supabase_schema.sql`
   - Copy the entire SQL content
   - Paste it into the SQL Editor
   - Click **"Run"**

3. **Verify Tables Created**:
   - Go to **Table Editor** (left sidebar)
   - You should see these tables:
     - `staff` ✓
     - `users` ✓
     - `cases` ✓
     - `messages` ✓
     - `notifications` ✓
     - `help_centers` ✓
     - `activity_logs` ✓
     - `resolutions` ✓
     - `evidence_files` ✓
     - `access_logs` ✓
     - `communications` ✓

### Option B: Via PostgreSQL Connection String

If you have PostgreSQL installed locally:

```bash
# Get connection string from Supabase Dashboard:
# Settings → Database → Connection string (PostgreSQL)

psql "postgresql://postgres:[password]@[host]:[port]/postgres" < backend/supabase_schema.sql
```

---

## ✅ Testing the Backend

Once the schema is applied:

```bash
# 1. Start the backend server
cd /home/jhef/codebase/violess1/backend
node server.js

# 2. In another terminal, test registration
curl -X POST http://localhost:5000/register-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User",
    "phone": "09123456789"
  }'

# 3. Test login
curl -X POST http://localhost:5000/login-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# 4. Get user profile
curl http://localhost:5000/user/[USER_UID_FROM_LOGIN_RESPONSE]
```

---

## 🔒 Security Notes

✅ **Service Role Key Handling**:
- Service role key is stored in `backend/.env` only
- Never commit this file to git
- Use environment variables in production
- Publicly-safe keys in web/mobile use ANON key with RLS enabled

✅ **Environment Variables Best Practices**:
- `SUPABASE_SERVICE_ROLE_KEY` (server-only) - backend/.env
- `REACT_APP_SUPABASE_ANON_KEY` (public) - web/.env.local
- `SUPABASE_ANON_KEY` (public) - mobile/.env

---

## 📦 Database Schema Summary

| Table | Purpose | Rows |
|-------|---------|------|
| `staff` | Staff/officer profiles | 0 (manual add) |
| `users` | Mobile app users | Create via /register-user |
| `cases` | Violence/abuse cases | Create via /submit-report |
| `messages` | Case communications | Create via /case/:id/send-message |
| `notifications` | User notifications | Create via /notify-new-case |
| `help_centers` | Resource centers | Manual add |
| `activity_logs` | Case activity tracking | Auto-created |
| `resolutions` | Case resolutions | Created via /submit-resolution |
| `evidence_files` | Evidence attachments | Stored in Cloudinary |
| `access_logs` | Evidence access audit | Auto-created |
| `communications` | Generic referrals | Created via API |

---

## 🚀 Deployment Checklist

- [ ] Schema applied to Supabase
- [ ] Backend server tested with /register-user endpoint
- [ ] Web app connecting to backend
- [ ] Mobile app connecting to backend
- [ ] Email configuration (optional)
- [ ] Deploy backend to Vercel/Railway
- [ ] Deploy web to Vercel
- [ ] Deploy mobile to App Store/Play Store

---

## 📝 Files Modified

- ✅ `backend/.env` - Supabase credentials added
- ✅ `web/.env.local` - Supabase credentials added
- ✅ `mobile/.env` - Supabase credentials added
- ✅ `backend/supabase_schema.sql` - Ready to apply

---

## ⚠️ Important: Remove Service Role Key

After testing is complete, either:

1. **Option 1**: Keep it in backend/.env with gitignore protection (current)
2. **Option 2**: Remove it and use environment variables on your server
3. **Option 3**: Rotate the key in Supabase Settings → API

**Never commit service role key to git repository!**

# Vercel Deployment Checklist

## Pre-Deployment: Local Setup

### 1. Get Firebase Credentials
```bash
cd backend
cat violess-4e542-firebase-adminsdk-fbsvc-78fd8f52d9.json | tr '\n' ' ' | xclip -selection clipboard
```
This converts the JSON to a single line and copies it to clipboard.

### 2. Verify Code Changes
- ✅ `backend/server.js` - Now uses `process.env.FIREBASE_CREDENTIALS`
- ✅ `backend/vercel.json` - Created
- ✅ `web/src/config/api.js` - Created with API_BASE_URL config
- ✅ `web/src/pages/AccountManagementPage.jsx` - Updated API calls
- ✅ `web/src/pages/CasesPage.jsx` - Updated API calls
- ✅ `web/src/pages/CommunicationsPage.jsx` - Updated API calls
- ✅ `web/vercel.json` - Created
- ✅ `web/package.json` - Added `vercel-build` script

## Deployment Steps

### Step 1: Create Backend Project on Vercel
1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your repository
4. Select root directory: `/backend`
5. Click "Deploy"
6. Note the deployment URL (e.g., `https://your-backend.vercel.app`)

### Step 2: Add Backend Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `FIREBASE_CREDENTIALS` | *Paste the JSON string from Step 1* |
| `EMAIL_USER` | noreply.violess@gmail.com |
| `EMAIL_PASSWORD` | qgft xplp ytct yimj |

Deploy again by pushing to main.

### Step 3: Create Web Project on Vercel
1. Click "Add New" → "Project"
2. Import your repository
3. Select root directory: `/web`
4. Click "Deploy"
5. Note the deployment URL

### Step 4: Add Web Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `REACT_APP_API_BASE_URL` | https://your-backend.vercel.app |

Deploy again.

### Step 5: Test
1. Visit web app URL and test staff creation/login
2. Check if email verification works
3. Test case management
4. Verify mobile app with updated API URL in `mobile/src/config/api.js`

## Important Notes

⚠️ **Do NOT commit the Firebase credentials JSON file**

✅ **DO commit:**
- All modified `.jsx` files
- `backend/server.js` (updated to use env vars)
- `backend/vercel.json` and `.vercelignore`
- `web/vercel.json`, `web/src/config/api.js`, `web/.env.example`

## Troubleshooting

**Backend 500 errors:**
- Check Vercel logs: https://vercel.com → Project → Deployments → View Function Logs
- Verify `FIREBASE_CREDENTIALS` is set and valid

**CORS errors:**
- Already configured in backend, should work fine

**API calls failing:**
- Verify `REACT_APP_API_BASE_URL` matches your backend URL exactly

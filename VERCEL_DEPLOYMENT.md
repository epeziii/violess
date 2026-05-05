# Vercel Deployment Guide

## Overview
- **Backend**: Node.js Express server deployed to Vercel
- **Web**: React app deployed to Vercel
- **Database**: Firebase (unchanged)

## Step 1: Prepare Firebase Credentials

### Backend: Convert Firebase Service Account to Environment Variable

1. You currently have: `backend/violess-4e542-firebase-adminsdk-fbsvc-78fd8f52d9.json`
2. Convert this JSON to a single-line string and set as `FIREBASE_CREDENTIALS` environment variable

**To convert:**
```bash
# Run this in your backend directory
cat violess-4e542-firebase-adminsdk-fbsvc-78fd8f52d9.json | tr '\n' ' '
```

Copy the output - you'll paste it as an env var in Step 3.

### Backend: Update server.js to Use Environment Variable

Replace this line in `backend/server.js`:
```javascript
const serviceAccount = require("./violess-4e542-firebase-adminsdk-fbsvc-78fd8f52d9.json");
```

With:
```javascript
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
```

## Step 2: Setup Vercel Projects

### Create Backend Project
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository (or upload manually)
4. Select the `backend` folder as the root directory
5. Keep default settings and deploy

After deployment, note the backend URL (e.g., `https://your-backend.vercel.app`)

### Create Web Project
1. Click "Add New..." → "Project" again
2. Import your repository
3. Select the `web` folder as the root directory
4. In Build Settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. Deploy

## Step 3: Set Environment Variables

### Backend Environment Variables
In Vercel dashboard for backend project:
1. Go to Settings → Environment Variables
2. Add these variables:

| Key | Value |
|-----|-------|
| `FIREBASE_CREDENTIALS` | Paste the JSON string from Step 1 |
| `EMAIL_USER` | Your Gmail address (e.g., noreply.violess@gmail.com) |
| `EMAIL_PASSWORD` | Your Gmail app password |
| `NODE_ENV` | production |

### Web Environment Variables
In Vercel dashboard for web project:
1. Go to Settings → Environment Variables
2. Add these variables:

| Key | Value |
|-----|-------|
| `REACT_APP_API_BASE_URL` | `https://your-backend.vercel.app` (replace with your backend URL) |

## Step 4: Update Web App API Calls

You need to update the hardcoded `http://localhost:5000` URLs in your web app to use the new config file.

Files to update:
- `web/src/pages/AccountManagementPage.jsx`
- `web/src/pages/CasesPage.jsx`
- `web/src/pages/CommunicationsPage.jsx`

**Example change:**
```javascript
// Before
const res = await fetch("http://localhost:5000/create-staff", {

// After
import API_BASE_URL from "../config/api";
const res = await fetch(`${API_BASE_URL}/create-staff`, {
```

## Step 5: Update Mobile App API Config

In `mobile/src/config/api.js`, update:
```javascript
const API_BASE_URL = "https://your-backend.vercel.app";
```

## Step 6: Redeploy

After making changes:

1. **Backend**: If you updated Firebase credentials handling, commit and push
2. **Web**: Update all API endpoints to use the config, commit and push
3. Both will automatically redeploy on Vercel

## Testing

1. Test the web app at your Vercel URL
2. Test mobile app with the updated API config
3. Verify:
   - User registration/login works
   - Email verification sends emails
   - Cases are created and visible on dashboard

## Troubleshooting

**Backend 500 errors:**
- Check Vercel logs: Settings → Functions
- Verify FIREBASE_CREDENTIALS environment variable is set correctly
- Verify EMAIL_USER and EMAIL_PASSWORD are correct

**Web app 404 errors:**
- Check that REACT_APP_API_BASE_URL is set correctly
- Test the backend URL directly in browser

**CORS errors:**
- Backend already has CORS enabled, should be fine
- Verify your Vercel URL matches the origin

## Important Notes

⚠️ **Do NOT commit:**
- `backend/violess-4e542-firebase-adminsdk-fbsvc-78fd8f52d9.json` (use env var instead)
- `.env` files with secrets

✅ **DO commit:**
- `backend/server.js` (updated to use env var)
- `web/src/config/api.js` (updated config file)
- `vercel.json` files in both backend and web

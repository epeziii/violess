Vercel: Set `FIREBASE_CREDENTIALS` to point backend at `violess1`

1) Open the service account JSON file in this repo:

   backend/violess1-firebase-adminsdk-fbsvc-40e5923784.json

2) Copy the entire file contents (the JSON block).

3) In Vercel Dashboard for the backend project (violess-backend-dll4gtnp4-...):
   - Project -> Settings -> Environment Variables -> Add
     - Name: `FIREBASE_CREDENTIALS`
     - Value: paste the entire JSON from step 1
     - Environment: select `Preview` and `Production` (and `Development` if used)
   - Save and Redeploy the project.

4) CLI alternative (requires Vercel CLI and login):

   # Add env variable (production)
   vercel env add FIREBASE_CREDENTIALS production
   # When prompted, paste the full JSON and submit.

   # Also add for preview if needed
   vercel env add FIREBASE_CREDENTIALS preview

   # Trigger a production redeploy
   vercel --prod --confirm

5) After redeploy, test:

   curl -X POST https://violess-backend-dll4gtnp4-202310785-1931s-projects.vercel.app/create-staff \
     -H "Content-Type: application/json" \
     -d '{"fullName":"Admin User","username":"admin","password":"VioLess!Admin2026","role":"admin"}'

6) If the response returns `success: true`, the backend is now using `violess1` and is functional.

Notes:
- Do NOT commit service account JSON to git. Keep it safe.
- If you want, I can attempt the Vercel CLI commands from this environment, but I need a Vercel personal token set in `VERCEL_TOKEN` environment variable (do not paste the token here; run locally or in CI).

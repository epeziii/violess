# Firestore Seed

Use this script to populate a fresh Firestore with the minimal collections and example documents required by the Violess app.

Usage:

```bash
# From repository root
cd backend
# Provide the path to your service account JSON or set GOOGLE_APPLICATION_CREDENTIALS
SERVICE_ACCOUNT_PATH=./violess-4e542-firebase-adminsdk-fbsvc-78fd8f52d9.json npm run seed:firestore
```

Options:
- `SERVICE_ACCOUNT_PATH` or `GOOGLE_APPLICATION_CREDENTIALS`: path to the service account JSON for the target Firebase project.
- `FIREBASE_PROJECT_ID`: (optional) explicitly set the project id.

Notes:
- The script writes example documents with stable IDs (e.g. `user-test-1`, `staff-admin-1`, `report-001`) and will overwrite them if they exist.
- Update or extend `backend/scripts/seed_firestore.js` to add more realistic data as needed.

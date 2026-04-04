# Users Collection Implementation

## Overview
The "users" collection has been created to store mobile user accounts, separate from the existing "staff" collection which is for web-only staff accounts.

## Collection Structure

### **staff** (Web-only)
- **Platform**: Web portal only
- **Created by**: Backend/Admin SDK only
- **Read by**: Authenticated staff member (their own profile)
- **Write by**: Backend/Admin SDK only

**Schema:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "role": "admin" | "officer",
  "status": "active" | "inactive",
  "lastLogin": "timestamp | null",
  "cases": "number",
  "color": "string"
}
```

### **users** (Mobile-only)
- **Platform**: Mobile app only
- **Created by**: Mobile app (self-registration) or via API
- **Read by**: Authenticated user (their own profile)
- **Write by**: Authenticated user (their own profile)

**Schema:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "barangay": "string",
  "status": "active" | "inactive",
  "accountCreated": "timestamp",
  "lastLogin": "timestamp | null",
  "avatar": "string | null"
}
```

## New API Endpoints

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

## Security Rules

The Firestore security rules in `firestore.rules` enforce:

1. **Staff Collection**: Read-only access for authenticated staff (their own record). Write access only via Admin SDK.
2. **Users Collection**: Read/write access for authenticated users (their own record only).
3. **Default**: All other access denied.

## How to Deploy

1. Deploy the updated `server.js` to your backend
2. Update Firestore security rules in Firebase Console with contents from `firestore.rules`
3. Mobile app can now use these new endpoints for user registration and authentication

## Key Differences

| Feature | Staff (Web) | Users (Mobile) |
|---------|-----------|---------------|
| Registration | Admin creates via dashboard | Self-registration via API |
| Login Portal | Web dashboard | Mobile app |
| Profile Fields | firstName, lastName, email, role, status, lastLogin, cases, color | firstName, lastName, email, phone, barangay, status, accountCreated, lastLogin, avatar |
| Write Access | Admin only | User owns profile |
| Read Access | Staff member (own) | User (own) |

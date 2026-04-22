# Report Submission Network Error - Diagnostic Guide

## Quick Checklist

### 1. Backend Server Status
```bash
# Check if server is running on port 5000
lsof -i :5000
curl -X GET http://localhost:5000/user/test
```

### 2. Verify API Configuration
Current setting in `/mobile/src/config/api.js`:
- **Android Emulator**: `http://10.0.2.2:5000` ✓
- **iOS Simulator**: Should be `http://localhost:5000`
- **Physical Device**: Should be `http://<YOUR_MACHINE_IP>:5000`

### 3. Backend Endpoint Check
The `/submit-report` endpoint requires:
```json
{
  "uid": "user_firebase_uid",
  "incidentType": "domestic|harassment|bullying|abuse|threats|other",
  "description": "incident description (required)",
  "location": "location (optional)",
  "datetime": "date/time (optional)",
  "isAnonymous": true/false
}
```

### 4. Test from Backend Directory
```bash
cd /home/jhef/codebase/violess/backend
npm start
# Then test with:
curl -X POST http://localhost:5000/submit-report \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-uid",
    "incidentType": "domestic",
    "description": "Test report",
    "isAnonymous": true
  }'
```

## Common Causes & Fixes

| Error | Cause | Solution |
|-------|-------|----------|
| Network request failed | Backend not running | Start server: `cd backend && npm start` |
| Network request failed | Wrong API URL | Update `/mobile/src/config/api.js` |
| Network request failed | Firewall/Network | Ensure device can reach backend server |
| CORS error | (shouldn't happen - CORS enabled) | Check backend has `app.use(cors())` |

## Environment-Specific Setup

### For Android Emulator:
- API URL: `http://10.0.2.2:5000` (already set)
- Backend can run on `localhost:5000`

### For iOS Simulator:
- Change API URL to: `http://localhost:5000`
- Backend must run on `localhost:5000`

### For Physical Device:
- Change API URL to: `http://<YOUR_COMPUTER_IP>:5000`
- Get your IP: `ifconfig | grep inet` (macOS/Linux) or `ipconfig` (Windows)
- Ensure device is on same network as backend

## Next Steps

1. ✅ Start backend server: `cd backend && npm start`
2. ✅ Confirm it's running: `curl http://localhost:5000/user/test`
3. ✅ Update API URL in `/mobile/src/config/api.js` if needed
4. ✅ Test report submission again

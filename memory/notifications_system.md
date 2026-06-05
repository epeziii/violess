---
name: Web Notifications System
description: Real-time notification system for case assignments (officers) and new cases (admins)
type: project
---

## Implementation Complete
Real-time notification system implemented with:
- Backend endpoints for notifications CRUD in `/backend/server.js`
- `useNotifications` hook for real-time Firestore listener in `web/src/hooks/useNotifications.js`
- `NotificationDropdown` component with bell icon and dropdown menu
- Automatic notifications when:
  - Admin assigns case to officer → officer gets "Case Assigned" notification
  - New case filed → all active admins get "New Case Filed" notification
- Mark single notification or all as read
- Notifications collection in Firestore with read status tracking

## How to apply:
When testing the notification system:
1. Create/assign cases from web portal
2. Check that officers/admins receive real-time notifications in bell dropdown
3. Verify mark-as-read functionality works
4. Monitor `/notifications/:uid` endpoint and `mark-notification-read` endpoints in backend logs

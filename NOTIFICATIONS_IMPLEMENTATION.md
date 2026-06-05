# Web Notifications Implementation

## Summary
A real-time notification system for the web portal has been implemented to notify:
- **Officers**: When a case is assigned to them by an admin
- **Admins**: When new cases are filed

## Components Added

### Backend (`/backend/server.js`)
1. **`createNotification()` helper** - Creates notification documents in Firestore
2. **Updated `/update-case` endpoint** - Now creates notifications when an officer is assigned to a case
3. **New `/notifications/:uid` GET endpoint** - Retrieves all notifications for a user (real-time via Firestore)
4. **New `/mark-notification-read` POST endpoint** - Marks a single notification as read
5. **New `/mark-all-notifications-read` POST endpoint** - Marks all unread notifications as read
6. **New `/notify-new-case` POST endpoint** - Notifies all active admins about a new case

### Frontend - Web App
1. **`useNotifications` hook** (`web/src/hooks/useNotifications.js`)
   - Real-time listener for notifications in Firestore
   - Returns notifications array and unreadCount
   - Automatically filters by current user UID

2. **`NotificationDropdown` component** (`web/src/components/NotificationDropdown.jsx`)
   - Displays bell icon with unread count badge
   - Dropdown shows all notifications with timestamps
   - Click notifications to mark as read
   - "Mark all as read" button
   - Shows emoji based on notification type (📋 for assignment, 🆕 for new case)

3. **Updated `App.jsx`**
   - Imports and uses useNotifications hook
   - Replaces hardcoded bell icon with NotificationDropdown
   - Updates alert banner to show latest notification

4. **Updated `CasesPage.jsx`**
   - Detects new cases and automatically calls `/notify-new-case`
   - Only triggers for admin users
   - Tracks notified cases to avoid duplicate notifications

## Notification Flow

### When Admin Assigns Case to Officer
1. Admin updates case status and assigns officer in CasesPage
2. Frontend calls `/update-case` endpoint
3. Backend verifies officer name and creates notification in "notifications" collection
4. Frontend's `useNotifications` hook receives real-time update
5. Bell icon badge updates, dropdown shows new notification

### When New Case is Filed
1. New case appears in CasesPage (from Firestore listener)
2. CasesPage detects new case and calls `/notify-new-case` endpoint
3. Backend queries all active admins and creates notifications for each
4. Each admin's `useNotifications` hook receives real-time update
5. Bell icon badges update for each admin

## Testing Checklist

- [ ] Create a new case from mobile app
- [ ] Verify all admins receive "New Case Filed" notification in web portal
- [ ] Assign case to an officer in web portal
- [ ] Verify officer receives "Case Assigned" notification (if officer has web access)
- [ ] Click bell icon to open notification dropdown
- [ ] Click "Mark all as read" button
- [ ] Verify notification count decreases
- [ ] Verify notifications show proper timestamps
- [ ] Test notification emojis display correctly
- [ ] Test on mobile web browser for responsive layout

## Firestore Collections Updated

### `notifications` (New)
```
{
  notifId: string (auto),
  recipientUid: string,
  type: "case_assigned" | "new_case",
  title: string,
  message: string,
  caseId: string | null,
  caseData: object | null,
  read: boolean,
  createdAt: timestamp,
  readAt: timestamp | null
}
```

## Future Enhancements

- [ ] Add browser push notifications (PWA)
- [ ] Add email notifications for critical cases
- [ ] Add notification preferences/settings
- [ ] Add notification history/archive
- [ ] Add in-app sound/desktop alerts
- [ ] Add Firestore Cloud Function triggers for automatic new case notifications

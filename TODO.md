# TODO

## Feature: show Assigned Date/Time for officer’s assigned cases (Web Communications)

- [x] Update backend `/update-case` so when `assignedOfficer` changes it stores an `assignedAt` (Date/Firestore timestamp) on the case.
- [x] Update `web/src/pages/CommunicationsPage.jsx` to display `assignedAt` (date + time) in the Assigned Cases list and case details modal.
- [x] Ensure Firestore reads map `assignedAt` to the UI (handle both `Timestamp` and `Date`).
- [ ] Run web lint/build/tests if available.




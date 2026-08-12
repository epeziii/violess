/*
Firestore seeding script for Violess platform.
Usage:
  SERVICE_ACCOUNT_PATH=./violess-4e542-firebase-adminsdk-fbsvc-78fd8f52d9.json node scripts/seed_firestore.js
Or set GOOGLE_APPLICATION_CREDENTIALS env var to a service account JSON path.
Optionally set FIREBASE_PROJECT_ID to the target project id.

The script creates the following collections with example documents:
- users
- staff
- reports
- referrals
- notifications
- access_logs
- messages (parent docs with subcollection 'messages')

This script is idempotent for the provided example IDs (it will overwrite those docs).
*/

const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', 'violess-4e542-firebase-adminsdk-fbsvc-78fd8f52d9.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account file not found at', serviceAccountPath);
  console.error('Set SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS to the service account JSON for the target project.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
});

const db = admin.firestore();

async function seed() {
  try {
    console.log('Starting Firestore seed...');

    const batch = db.batch();

    // USERS
    const users = [
      {
        id: 'user-test-1',
        data: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test.user@example.com',
          phone: '+639171234567',
          barangay: 'Brgy. 123',
          status: 'active',
          accountCreated: admin.firestore.FieldValue.serverTimestamp(),
          lastLogin: null,
          avatar: null,
          registrationComplete: true,
        },
      },
    ];

    users.forEach((u) => {
      const ref = db.collection('users').doc(u.id);
      batch.set(ref, u.data, { merge: true });
    });

    // STAFF
    const staff = [
      {
        id: 'staff-admin-1',
        data: {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          role: 'admin',
          status: 'active',
          lastLogin: admin.firestore.FieldValue.serverTimestamp(),
          cases: 0,
          color: 'av-pink',
        },
      },
      {
        id: 'staff-officer-1',
        data: {
          firstName: 'Officer',
          lastName: 'One',
          email: 'officer1@example.com',
          role: 'officer',
          status: 'active',
          lastLogin: null,
          cases: 0,
          color: 'av-blue',
        },
      },
    ];

    staff.forEach((s) => {
      const ref = db.collection('staff').doc(s.id);
      batch.set(ref, s.data, { merge: true });
    });

    // REPORTS (cases)
    const reports = [
      {
        id: 'report-001',
        data: {
          caseId: '#VIO-001',
          incidentType: 'Harassment',
          reporterName: 'Anonymous',
          reporterUid: 'user-test-1',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'reviewing',
          assignedOfficer: '',
          location: 'Brgy. 123',
        },
      },
      {
        id: 'report-002',
        data: {
          caseId: '#VIO-002',
          incidentType: 'Domestic Abuse',
          reporterName: 'Maria D.',
          reporterUid: 'user-test-1',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'urgent',
          assignedOfficer: 'Officer One',
          location: 'Brgy. 456',
        },
      },
    ];

    reports.forEach((r) => {
      const ref = db.collection('reports').doc(r.id);
      batch.set(ref, r.data, { merge: true });
    });

    // REFERRALS
    const referrals = [
      {
        id: 'referral-001',
        data: {
          caseId: 'report-001',
          caseNumber: '#VIO-001',
          reportDocId: 'report-001',
          referredTo: 'Local Station',
          reason: 'Needs investigation',
          status: 'reviewing',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: 'staff-admin-1',
          createdByName: 'Admin User',
        },
      },
    ];

    referrals.forEach((r) => {
      const ref = db.collection('referrals').doc(r.id);
      batch.set(ref, r.data, { merge: true });
    });

    // NOTIFICATIONS
    const notifications = [
      {
        id: 'notif-1',
        data: {
          recipientUid: 'staff-admin-1',
          type: 'new_case',
          title: 'New Case Filed',
          message: 'A new case #VIO-001 has been filed.',
          caseId: 'report-001',
          caseData: { caseId: '#VIO-001' },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          readAt: null,
        },
      },
    ];

    notifications.forEach((n) => {
      const ref = db.collection('notifications').doc(n.id);
      batch.set(ref, n.data, { merge: true });
    });

    // ACCESS LOGS
    const accessLogs = [
      {
        id: 'access-1',
        data: {
          adminId: 'staff-admin-1',
          adminEmail: 'admin@example.com',
          action: 'download_evidence',
          details: 'Downloaded evidence for case report-001',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
    ];

    accessLogs.forEach((a) => {
      const ref = db.collection('access_logs').doc(a.id);
      batch.set(ref, a.data, { merge: true });
    });

    // MESSAGES: create parent doc per case with a subcollection 'messages'
    const messagesParentId = 'report-001';
    const parentRef = db.collection('messages').doc(messagesParentId);
    batch.set(parentRef, { caseId: messagesParentId, createdAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

    const messageDocRef = db.collection('messages').doc(messagesParentId).collection('messages').doc('msg-1');
    batch.set(messageDocRef, {
      from: 'reporter',
      reporterUid: 'user-test-1',
      reporterName: 'Test User',
      text: 'Initial message for case.',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Commit batch
    await batch.commit();

    console.log('Seed commit complete.');
    console.log('Collections seeded: users, staff, reports, referrals, notifications, access_logs, messages');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

seed();

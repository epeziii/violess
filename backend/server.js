const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const nodemailer = require("nodemailer");

// 🔑 Firebase Admin SDK service account
const serviceAccount = process.env.FIREBASE_CREDENTIALS ? JSON.parse(process.env.FIREBASE_CREDENTIALS) : null;

if (!serviceAccount) {
  console.error('FIREBASE_CREDENTIALS environment variable is not set or invalid');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

// 📧 Email transporter setup
// Using Gmail - for production, use environment variables
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "noreply.violess@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "qgft xplp ytct yimj", // Gmail app password
  },
});

// ─── CREATE STAFF ACCOUNT ──────────────────────────────────────────────
app.post("/create-staff", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    if (!firstName || !lastName || !email || !password || !role)
      return res.status(400).json({ error: "All fields are required" });

    const userRecord = await admin.auth().createUser({ email, password });
    if (!userRecord?.uid) return res.status(500).json({ error: "UID missing" });

    await db.collection("staff").doc(userRecord.uid).set({
      firstName,
      lastName,
      email,
      role,
      status: "active",
      lastLogin: null,
      cases: 0,
      color: "pink",
    });

    res.json({ success: true, uid: userRecord.uid });
  } catch (error) {
    console.error("Error creating staff:", error);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});

// ─── UPDATE STAFF INFO ──────────────────────────────────────────────
app.post("/update-staff", async (req, res) => {
  try {
    const { uid, firstName, lastName, role, status } = req.body;
    if (!uid || !firstName || !lastName || !role || !status)
      return res.status(400).json({ error: "All fields are required" });

    await db.collection("staff").doc(uid).update({ firstName, lastName, role, status });
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating staff:", err);
    res.status(500).json({ error: err.message || "Failed to update staff" });
  }
});

// ─── UPDATE STAFF STATUS ──────────────────────────────────────────────
app.post("/update-staff-status", async (req, res) => {
  try {
    const { uid, status } = req.body;
    if (!uid || !status) return res.status(400).json({ error: "UID and status required" });

    await db.collection("staff").doc(uid).update({ status });
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ error: err.message || "Failed to update status" });
  }
});

// ─── UPDATE CASE (with officer assignment) ────────────────────────────
app.post("/update-case", async (req, res) => {
  try {
    const { uid, caseId, status, priorityLevel, assignedOfficer } = req.body;
    if (!uid || !caseId) return res.status(400).json({ error: "uid and caseId are required" });

    // Verify user is admin
    const staffSnap = await db.collection("staff").doc(uid).get();
    if (!staffSnap.exists) {
      return res.status(403).json({ error: "Unauthorized: user not found" });
    }

    const staffData = staffSnap.data();
    if (staffData.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: only admins can update cases" });
    }

    // Get the current case to check previous assignment
    const caseRef = db.collection("reports").doc(caseId);
    const caseSnap = await caseRef.get();

    if (!caseSnap.exists) {
      return res.status(404).json({ error: "Case not found" });
    }

    const caseData = caseSnap.data();
    const oldAssignedOfficer = caseData.assignedOfficer || "";
    const newAssignedOfficer = assignedOfficer || "";

    // Update the case
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (priorityLevel !== undefined) updateData.priorityLevel = priorityLevel;
    if (assignedOfficer !== undefined) updateData.assignedOfficer = assignedOfficer || "";
    updateData.updatedAt = new Date();

    // Handle officer assignment changes
    if (oldAssignedOfficer !== newAssignedOfficer) {
      // Decrement old officer's case count
      if (oldAssignedOfficer) {
        const staffSnapshot = await db.collection("staff").where("firstName", "!=", "").get();
        let oldOfficerFound = false;

        for (const doc of staffSnapshot.docs) {
          const staffData = doc.data();
          const fullName = `${staffData.firstName} ${staffData.lastName}`.trim();
          if (fullName === oldAssignedOfficer) {
            const newCount = Math.max(0, (staffData.cases || 0) - 1);
            await db.collection("staff").doc(doc.id).update({ cases: newCount });
            oldOfficerFound = true;
            break;
          }
        }
      }

      // Increment new officer's case count
      if (newAssignedOfficer) {
        const staffSnapshot = await db.collection("staff").where("firstName", "!=", "").get();
        let newOfficerFound = false;

        for (const doc of staffSnapshot.docs) {
          const staffData = doc.data();
          const fullName = `${staffData.firstName} ${staffData.lastName}`.trim();
          if (fullName === newAssignedOfficer) {
            const newCount = (staffData.cases || 0) + 1;
            await db.collection("staff").doc(doc.id).update({ cases: newCount });
            newOfficerFound = true;
            break;
          }
        }
      }
    }

    await caseRef.update(updateData);
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating case:", err);
    res.status(500).json({ error: err.message || "Failed to update case" });
  }
});

// ─── HELPER: Create activity log entry ─────────────────────────────────
async function createActivityLog(caseId, action, actionBy, actionByName, fromStatus, toStatus, notes = "") {
  try {
    const logId = db.collection("reports").doc().id; // Generate ID
    await db.collection("reports").doc(caseId).collection("activityLog").doc(logId).set({
      logId,
      timestamp: new Date(),
      action,
      actionBy,
      actionByName,
      fromStatus: fromStatus || null,
      toStatus: toStatus || null,
      notes,
      metadata: {}
    });
  } catch (error) {
    console.error("Error creating activity log:", error);
  }
}

// ─── SUBMIT RESOLUTION (Officer submits resolution for review) ─────────
app.post("/submit-resolution", async (req, res) => {
  try {
    const { uid, caseId, notes, completionDate } = req.body;
    if (!uid || !caseId || !notes) {
      return res.status(400).json({ error: "uid, caseId, and notes are required" });
    }

    // Verify user is officer
    const staffSnap = await db.collection("staff").doc(uid).get();
    if (!staffSnap.exists) {
      return res.status(403).json({ error: "Unauthorized: user not found" });
    }

    const staffData = staffSnap.data();
    if (staffData.role !== "officer") {
      return res.status(403).json({ error: "Unauthorized: only officers can submit resolutions" });
    }

    // Get the case
    const caseRef = db.collection("reports").doc(caseId);
    const caseSnap = await caseRef.get();

    if (!caseSnap.exists) {
      return res.status(404).json({ error: "Case not found" });
    }

    const caseData = caseSnap.data();

    // Verify officer is assigned to case
    const officerFullName = `${staffData.firstName} ${staffData.lastName}`.trim();
    if (caseData.assignedOfficer !== officerFullName) {
      return res.status(403).json({ error: "Unauthorized: you are not assigned to this case" });
    }

    // Create resolution document
    const resolutionId = db.collection("reports").doc().id;
    await db.collection("reports").doc(caseId).collection("resolutions").doc(resolutionId).set({
      resolutionId,
      submittedBy: uid,
      submittedByName: officerFullName,
      submittedAt: new Date(),
      notes,
      completionDate: completionDate || null,
      evidenceUrls: [],
      status: "pending",
      reviewedBy: null,
      reviewedByName: null,
      reviewedAt: null,
      reviewComments: "",
      caseId,
      reporterName: caseData.reporterName
    });

    // Update case status to pending_admin_review
    await caseRef.update({
      status: "pending_admin_review",
      updatedAt: new Date()
    });

    // Create activity log
    await createActivityLog(caseId, "resolution_submitted", uid, officerFullName, caseData.status, "pending_admin_review", notes);

    res.json({ success: true, resolutionId });
  } catch (error) {
    console.error("Error submitting resolution:", error);
    res.status(500).json({ error: error.message || "Failed to submit resolution" });
  }
});

// ─── APPROVE RESOLUTION (Admin approves officer's resolution) ──────────
app.post("/approve-resolution", async (req, res) => {
  try {
    const { uid, caseId, resolutionId, comments } = req.body;
    if (!uid || !caseId || !resolutionId) {
      return res.status(400).json({ error: "uid, caseId, and resolutionId are required" });
    }

    // Verify user is admin
    const staffSnap = await db.collection("staff").doc(uid).get();
    if (!staffSnap.exists) {
      return res.status(403).json({ error: "Unauthorized: user not found" });
    }

    const staffData = staffSnap.data();
    if (staffData.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: only admins can approve resolutions" });
    }

    const adminFullName = `${staffData.firstName} ${staffData.lastName}`.trim();

    // Get the resolution
    const resolutionSnap = await db.collection("reports").doc(caseId).collection("resolutions").doc(resolutionId).get();
    if (!resolutionSnap.exists) {
      return res.status(404).json({ error: "Resolution not found" });
    }

    // Update resolution to approved
    await db.collection("reports").doc(caseId).collection("resolutions").doc(resolutionId).update({
      status: "approved",
      reviewedBy: uid,
      reviewedByName: adminFullName,
      reviewedAt: new Date(),
      reviewComments: comments || ""
    });

    // Update case status to closed
    const caseRef = db.collection("reports").doc(caseId);
    await caseRef.update({
      status: "closed",
      updatedAt: new Date()
    });

    // Create activity log
    await createActivityLog(caseId, "resolution_approved", uid, adminFullName, "pending_admin_review", "closed", `Approved by ${adminFullName}. ${comments || ""}`);

    res.json({ success: true });
  } catch (error) {
    console.error("Error approving resolution:", error);
    res.status(500).json({ error: error.message || "Failed to approve resolution" });
  }
});

// ─── REJECT RESOLUTION (Admin rejects officer's resolution) ────────────
app.post("/reject-resolution", async (req, res) => {
  try {
    const { uid, caseId, resolutionId, comments } = req.body;
    if (!uid || !caseId || !resolutionId) {
      return res.status(400).json({ error: "uid, caseId, and resolutionId are required" });
    }

    // Verify user is admin
    const staffSnap = await db.collection("staff").doc(uid).get();
    if (!staffSnap.exists) {
      return res.status(403).json({ error: "Unauthorized: user not found" });
    }

    const staffData = staffSnap.data();
    if (staffData.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized: only admins can reject resolutions" });
    }

    const adminFullName = `${staffData.firstName} ${staffData.lastName}`.trim();

    // Get the resolution
    const resolutionSnap = await db.collection("reports").doc(caseId).collection("resolutions").doc(resolutionId).get();
    if (!resolutionSnap.exists) {
      return res.status(404).json({ error: "Resolution not found" });
    }

    // Update resolution to rejected
    await db.collection("reports").doc(caseId).collection("resolutions").doc(resolutionId).update({
      status: "rejected",
      reviewedBy: uid,
      reviewedByName: adminFullName,
      reviewedAt: new Date(),
      reviewComments: comments || ""
    });

    // Update case status back to in_progress
    const caseRef = db.collection("reports").doc(caseId);
    await caseRef.update({
      status: "in_progress",
      updatedAt: new Date()
    });

    // Create activity log
    await createActivityLog(caseId, "resolution_rejected", uid, adminFullName, "pending_admin_review", "in_progress", `Rejected by ${adminFullName}. Reason: ${comments || "No reason provided"}`);

    res.json({ success: true });
  } catch (error) {
    console.error("Error rejecting resolution:", error);
    res.status(500).json({ error: error.message || "Failed to reject resolution" });
  }
});


app.post("/register-user", async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, barangay } = req.body;
    if (!firstName || !lastName || !email || !password || !phone)
      return res.status(400).json({ error: "All required fields are required" });

    const userRecord = await admin.auth().createUser({ email, password });
    if (!userRecord?.uid) return res.status(500).json({ error: "UID missing" });

    await db.collection("users").doc(userRecord.uid).set({
      firstName,
      lastName,
      email,
      phone,
      barangay: barangay || "",
      status: "active",
      accountCreated: new Date().toISOString(),
      lastLogin: null,
      avatar: null,
    });

    res.json({ success: true, uid: userRecord.uid });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});

// ─── LOGIN MOBILE USER ──────────────────────────────────────────────
app.post("/login-user", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const cred = await admin.auth().getUserByEmail(email);
    const snap = await db.collection("users").doc(cred.uid).get();

    if (!snap.exists) {
      return res.status(401).json({ error: "User profile not found" });
    }

    const profile = snap.data();
    await db.collection("users").doc(cred.uid).update({
      lastLogin: new Date().toISOString()
    });

    res.json({
      success: true,
      uid: cred.uid,
      email: cred.email,
      profile
    });
  } catch (error) {
    console.error("Error logging in user:", error.code, error.message);
    res.status(401).json({ error: error.message || "Invalid email or password" });
  }
});

// ─── UPDATE USER PROFILE ──────────────────────────────────────────────
app.post("/update-user", async (req, res) => {
  try {
    const { uid, firstName, lastName, phone, barangay, avatar } = req.body;
    if (!uid) return res.status(400).json({ error: "UID is required" });

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (barangay) updateData.barangay = barangay;
    if (avatar) updateData.avatar = avatar;

    await db.collection("users").doc(uid).update(updateData);
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: err.message || "Failed to update user" });
  }
});

// ─── GET USER PROFILE ──────────────────────────────────────────────
app.get("/user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const snap = await db.collection("users").doc(uid).get();

    if (!snap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, user: snap.data() });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: err.message || "Failed to fetch user" });
  }
});

// ─── SEND VERIFICATION EMAIL ──────────────────────────────────────────────
app.post("/send-verification-email", async (req, res) => {
  try {
    const { uid, email } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: "UID and email are required" });
    }

    // Wait a moment to ensure user is created in Firebase
    await new Promise(resolve => setTimeout(resolve, 200));

    // Generate verification link using Firebase Admin SDK
    let verificationLink;
    try {
      verificationLink = await admin.auth().generateEmailVerificationLink(email);
    } catch (linkError) {
      console.warn('Could not generate verification link:', linkError.message);
      // Fallback: generate a custom verification link
      verificationLink = `https://firebaseapp.com/verify?email=${encodeURIComponent(email)}&uid=${uid}`;
    }

    // Send verification email
    const mailOptions = {
      from: "noreply.violess@gmail.com",
      to: email,
      subject: "🕊 Verify Your Vio-less Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #c2185b 0%, #e91e63 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">🕊 Vio-less</h1>
          </div>
          <div style="background: white; padding: 40px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Click the button below to verify your email address and complete your registration:
            </p>
            <a href="${verificationLink}" style="display: inline-block; background: #c2185b; color: white; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold; margin: 20px 0;">
              Verify Email
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Or copy this link: <br/>
              <code style="background: #f5f5f5; padding: 8px; display: block; margin-top: 10px; word-break: break-all; font-size: 11px;">${verificationLink}</code>
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              This link expires in 24 hours. If you didn't request this, ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Verification email sent" });
  } catch (err) {
    console.error("Error sending verification email:", err);
    res.status(500).json({ error: err.message || "Failed to send verification email" });
  }
});

// ─── SUBMIT INCIDENT REPORT ──────────────────────────────────────────────
app.post("/submit-report", async (req, res) => {
  try {
    const { uid, incidentType, description, location, datetime, isAnonymous } = req.body;
    if (!uid || !incidentType || !description)
      return res.status(400).json({ error: "uid, incidentType, and description are required" });

    const currentYear = new Date().getFullYear();
    const reportsRef = db.collection("reports");

    // Generate case ID: VIO-YYYY-NNN
    // Query reports created this year
    const yearStart = new Date(`${currentYear}-01-01T00:00:00Z`);
    const yearEnd = new Date(`${currentYear}-12-31T23:59:59Z`);

    const reportsQuery = await reportsRef
      .where("createdAt", ">=", yearStart)
      .where("createdAt", "<=", yearEnd)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    let caseNumber = 1;
    if (!reportsQuery.empty) {
      const lastReport = reportsQuery.docs[0].data();
      const lastCaseId = lastReport.caseId || `VIO-${currentYear}-000`;
      const lastNumber = parseInt(lastCaseId.split('-')[2], 10) || 0;
      caseNumber = lastNumber + 1;
    }

    const caseId = `VIO-${currentYear}-${String(caseNumber).padStart(3, '0')}`;

    // Get user info (for reporter name if not anonymous)
    let reporterName = "Anonymous";
    if (!isAnonymous) {
      const userSnap = await db.collection("users").doc(uid).get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        reporterName = `${userData.firstName} ${userData.lastName}`;
      }
    }

    // Create report document
    const reportData = {
      caseId,
      uid: uid,  // Always store uid so user can retrieve their cases (even if anonymous)
      incidentType,
      description,
      location: location || "",
      datetime: datetime || "",
      isAnonymous,
      reporterName,
      status: "pending",
      priorityLevel: "normal",
      assignedOfficer: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await reportsRef.add(reportData);

    res.json({
      success: true,
      caseId,
      message: "Report submitted successfully"
    });
  } catch (err) {
    console.error("Error submitting report:", err);
    res.status(500).json({ error: err.message || "Failed to submit report" });
  }
});

// ─── GET USER'S CASES ──────────────────────────────────────────────
app.get("/user/:uid/cases", async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ error: "UID is required" });

    const reportsRef = db.collection("reports");
    const snapshot = await reportsRef
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      return res.json({ success: true, cases: [] });
    }

    const cases = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
      updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
    }));

    res.json({ success: true, cases });
  } catch (err) {
    console.error("Error fetching user cases:", err);
    res.status(500).json({ error: err.message || "Failed to fetch cases" });
  }
});

// ─── GET MESSAGES FOR A CASE ──────────────────────────────────────────────
app.get("/case/:caseId/messages", async (req, res) => {
  try {
    const { caseId } = req.params;
    const authUid = req.headers["x-user-id"]; // Get user ID from header (mobile app sends this)

    if (!caseId || !authUid) {
      return res.status(400).json({ error: "caseId and user ID are required" });
    }

    // Verify the user filed this case
    const reportsRef = db.collection("reports");
    const caseSnapshot = await reportsRef
      .where("caseId", "==", caseId)
      .where("uid", "==", authUid)
      .get();

    if (caseSnapshot.empty) {
      return res.status(403).json({ error: "Unauthorized: user did not file this case" });
    }

    // Fetch messages from subcollection
    const messagesRef = db.collection("messages").doc(caseId).collection("messages");
    const messagesSnapshot = await messagesRef.orderBy("timestamp", "asc").get();

    const messages = messagesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || data.timestamp,
      };
    });

    res.json({ success: true, messages });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: err.message || "Failed to fetch messages" });
  }
});

// ─── SEND MESSAGE ──────────────────────────────────────────────────────────
app.post("/case/:caseId/send-message", async (req, res) => {
  try {
    const { caseId } = req.params;
    const { text } = req.body;
    const authUid = req.headers["x-user-id"]; // Get user ID from header

    if (!caseId || !text || !authUid) {
      return res.status(400).json({ error: "caseId, text, and user ID are required" });
    }

    // Verify the user filed this case
    const reportsRef = db.collection("reports");
    const caseSnapshot = await reportsRef
      .where("caseId", "==", caseId)
      .where("uid", "==", authUid)
      .get();

    if (caseSnapshot.empty) {
      return res.status(403).json({ error: "Unauthorized: user did not file this case" });
    }

    // Get user info for the message
    const userSnap = await db.collection("users").doc(authUid).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User profile not found" });
    }

    const userData = userSnap.data();
    const reporterName = `${userData.firstName} ${userData.lastName}`.trim();

    // Create message in subcollection
    const messagesRef = db.collection("messages").doc(caseId).collection("messages");
    const docRef = await messagesRef.add({
      from: 'reporter',
      reporterUid: authUid,
      reporterName: reporterName,
      text,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      messageId: docRef.id,
      message: "Message sent successfully"
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: err.message || "Failed to send message" });
  }
});


// ─── GET ALL HELP CENTERS ──────────────────────────────────────────────
app.get("/help-centers", async (req, res) => {
  try {
    const snapshot = await db.collection("helpCenters").get();
    const centers = [];
    snapshot.forEach(doc => {
      centers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    res.json({ success: true, centers });
  } catch (err) {
    console.error("Error fetching help centers:", err);
    res.status(500).json({ error: err.message || "Failed to fetch help centers" });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));

require("dotenv").config();
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// 🔑 Firebase Admin SDK service account
// Prefer FIREBASE_CREDENTIALS env var. Fallback to local service account json for dev.
const serviceAccount = (() => {
  if (process.env.FIREBASE_CREDENTIALS) {
    try {
      return JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } catch (e) {
      console.warn('Invalid FIREBASE_CREDENTIALS JSON:', e);
    }
  }
  try {
    // eslint-disable-next-line import/no-unresolved
    return require('./violess-4e542-firebase-adminsdk-fbsvc-78fd8f52d9.json');
  } catch (e) {
    return {};
  }
})();

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

cloudinary.config({
  cloud_name: "dgxznfcgr",
  api_key: "445697225715821",
  api_secret: "eE-vMLo6pBoBRNZvn9mO0CHoi6c",
  secure: true,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload-evidence", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Evidence file is required" });

    const fileBuffer = req.file.buffer;
    const fileBase64 = fileBuffer.toString("base64");
    const dataUri = `data:${req.file.mimetype};base64,${fileBase64}`;

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: "violess/reports",
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
    });

    res.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      resourceType: uploadResult.resource_type,
      originalName: req.file.originalname,
    });
  } catch (err) {
    console.error("Evidence upload failed:", err);
    res.status(500).json({ error: err.message || "Failed to upload evidence" });
  }
});

app.post("/delete-evidence", async (req, res) => {
  try {
    const { publicId, resourceType } = req.body;
    console.log('Delete request received. publicId:', publicId, 'resourceType:', resourceType);

    if (!publicId) return res.status(400).json({ error: "publicId is required" });

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType || 'auto',
    });
    console.log('Cloudinary destroy result:', result);

    if (result.result === 'ok') {
      res.json({ success: true, message: "Evidence deleted" });
    } else {
      console.warn('Cloudinary delete returned non-ok result:', result);
      res.json({ success: true, message: "Evidence deleted", cloudinaryResult: result });
    }
  } catch (err) {
    console.error("Evidence deletion failed:", err);
    res.status(500).json({ error: err.message || "Failed to delete evidence" });
  }
});

function splitName(fullName) {
  if (typeof fullName !== "string") return { firstName: "", lastName: "", fullName: "" };
  const normalized = fullName.trim().replace(/\s+/g, " ");
  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "", fullName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "", fullName: parts[0] };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
    fullName: normalized,
  };
}

// ─── CREATE STAFF ACCOUNT ──────────────────────────────────────────────
app.post("/create-staff", async (req, res) => {
  try {
    const { firstName, lastName, fullName, email, username, password, role } = req.body;
    const staffUsername = username || email;
    const nameFromFull = splitName(fullName || "");

    let resolvedFirstName = firstName || nameFromFull.firstName;
    let resolvedLastName = lastName || nameFromFull.lastName;
    let resolvedFullName = (fullName || "").trim();

    if (!resolvedFirstName && staffUsername) {
      resolvedFirstName = String(staffUsername).replace(/\d+$/, "");
    }
    if (!resolvedFullName) {
      resolvedFullName = `${resolvedFirstName || ""} ${resolvedLastName || ""}`.trim();
    }

    const missing = [];
    if (!staffUsername) missing.push("username or email");
    if (!password) missing.push("password");
    if (!role) missing.push("role");
    if (!resolvedFullName) missing.push("fullName");

    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
    }

    const looksLikeEmail = typeof staffUsername === "string" && staffUsername.includes("@");
    const firebaseEmail = looksLikeEmail
      ? staffUsername
      : `${staffUsername}@username.violess.local`;

    const userRecord = await admin.auth().createUser({ email: firebaseEmail, password });
    if (!userRecord?.uid) return res.status(500).json({ error: "UID missing" });

    const staffColor = role === "admin" ? "blue" : "pink";

    await db.collection("staff").doc(userRecord.uid).set({
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      fullName: resolvedFullName,
      username: staffUsername,
      email: looksLikeEmail ? staffUsername : null,
      role,
      status: "active",
      lastLogin: null,
      cases: 0,
      color: staffColor,
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
    const { uid, firstName, lastName, fullName, role, status } = req.body;
    if (!uid || !role || !status) return res.status(400).json({ error: "All fields are required" });

    const nameFromFull = splitName(fullName || "");
    const updateData = { role, status, fullName: fullName?.trim() || `${firstName || nameFromFull.firstName} ${lastName || nameFromFull.lastName}`.trim() };
    if (firstName || nameFromFull.firstName) updateData.firstName = firstName || nameFromFull.firstName;
    if (lastName || nameFromFull.lastName) updateData.lastName = lastName || nameFromFull.lastName;

    await db.collection("staff").doc(uid).update(updateData);
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
      // Decrement old officer's case count and send reassignment notification
      if (oldAssignedOfficer) {
        const staffSnapshot = await db.collection("staff").where("firstName", "!=", "").get();
        let oldOfficerFound = false;

        for (const doc of staffSnapshot.docs) {
          const staffData = doc.data();
          const fullName = `${staffData.firstName} ${staffData.lastName}`.trim();
          if (fullName === oldAssignedOfficer) {
            const newCount = Math.max(0, (staffData.cases || 0) - 1);
            await db.collection("staff").doc(doc.id).update({ cases: newCount });

            // Send reassignment notification to old officer
            await createNotification(
              doc.id,
              "case_reassigned",
              "Case Reassigned",
              `Case #${caseData.caseId} has been reassigned to another officer`,
              caseId,
              {
                caseId: caseData.caseId,
                incidentType: caseData.incidentType,
                priorityLevel: caseData.priorityLevel
              }
            );
            oldOfficerFound = true;
            break;
          }
        }
      }

      // Increment new officer's case count and send notification
      if (newAssignedOfficer) {
        const staffSnapshot = await db.collection("staff").where("firstName", "!=", "").get();
        let newOfficerFound = false;

        for (const doc of staffSnapshot.docs) {
          const staffData = doc.data();
          const fullName = `${staffData.firstName} ${staffData.lastName}`.trim();
          if (fullName === newAssignedOfficer) {
            const newCount = (staffData.cases || 0) + 1;
            await db.collection("staff").doc(doc.id).update({ cases: newCount });

            // Create notification for the assigned officer
            await createNotification(
              doc.id,
              "case_assigned",
              "Case Assigned",
              `You have been assigned to case #${caseData.caseId}`,
              caseId,
              {
                caseId: caseData.caseId,
                incidentType: caseData.incidentType,
                priorityLevel: status || caseData.priorityLevel
              }
            );
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

// ─── HELPER: Create notification ─────────────────────────────────
async function createNotification(recipientUid, type, title, message, caseId = null, caseData = null) {
  try {
    const notifId = db.collection("notifications").doc().id;
    await db.collection("notifications").doc(notifId).set({
      notifId,
      recipientUid,
      type, // "case_assigned", "new_case"
      title,
      message,
      caseId: caseId || null,
      caseData: caseData || null,
      read: false,
      createdAt: new Date(),
      readAt: null
    });
  } catch (error) {
    console.error("Error creating notification:", error);
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
    const { uid, incidentType, description, location, datetime, isAnonymous, suspectDescription, evidence } = req.body;
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
      suspectDescription: suspectDescription || "",
      evidence: evidence || [],
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

// ─── GET NOTIFICATIONS FOR USER ──────────────────────────────────────────────
app.get("/notifications/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ error: "UID is required" });

    const snapshot = await db.collection("notifications")
      .where("recipientUid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const notifications = [];
    snapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      });
    });

    res.json({ success: true, notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: err.message || "Failed to fetch notifications" });
  }
});

// ─── MARK NOTIFICATION AS READ ──────────────────────────────────────────────
app.post("/mark-notification-read", async (req, res) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) return res.status(400).json({ error: "notificationId is required" });

    await db.collection("notifications").doc(notificationId).update({
      read: true,
      readAt: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ error: err.message || "Failed to mark notification" });
  }
});

// ─── MARK ALL NOTIFICATIONS AS READ ──────────────────────────────────────────────
app.post("/mark-all-notifications-read", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: "uid is required" });

    const snapshot = await db.collection("notifications")
      .where("recipientUid", "==", uid)
      .where("read", "==", false)
      .get();

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, {
        read: true,
        readAt: new Date()
      });
    });
    await batch.commit();

    res.json({ success: true });
  } catch (err) {
    console.error("Error marking notifications as read:", err);
    res.status(500).json({ error: err.message || "Failed to mark notifications" });
  }
});

// ─── NOTIFY ADMINS OF NEW CASE (called when a new case is filed) ──────────────────────────────────────────────
app.post("/notify-new-case", async (req, res) => {
  try {
    const { caseId, incidentType, priorityLevel } = req.body;
    if (!caseId) return res.status(400).json({ error: "caseId is required" });

    // Get all active admins
    const adminsSnapshot = await db.collection("staff")
      .where("role", "==", "admin")
      .where("status", "==", "active")
      .get();

    // Create notification for each admin
    for (const adminDoc of adminsSnapshot.docs) {
      await createNotification(
        adminDoc.id,
        "new_case",
        "New Case Filed",
        `A new ${incidentType} case has been filed`,
        caseId,
        {
          caseId,
          incidentType,
          priorityLevel
        }
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error notifying admins:", err);
    res.status(500).json({ error: err.message || "Failed to notify admins" });
  }
});

// ─── CHECK AND NOTIFY ADMINS ABOUT ALL NEW CASES ──────────────────────────────────────────────
// This endpoint checks for recently created cases and ensures admins are notified
app.post("/check-and-notify-new-cases", async (req, res) => {
  try {
    const { uid } = req.body;
    console.log("[check-and-notify-new-cases] Called with uid:", uid);

    if (!uid) return res.status(400).json({ error: "uid is required" });

    // Verify user is admin
    const staffSnap = await db.collection("staff").doc(uid).get();
    console.log("[check-and-notify-new-cases] Staff exists:", staffSnap.exists);
    if (!staffSnap.exists) {
      console.log("[check-and-notify-new-cases] Staff not found");
      return res.status(403).json({ error: "Staff not found" });
    }

    const staffData = staffSnap.data();
    console.log("[check-and-notify-new-cases] Staff role:", staffData.role);

    if (staffData.role !== "admin") {
      console.log("[check-and-notify-new-cases] User is not admin, role:", staffData.role);
      return res.status(403).json({ error: "Only admins can check notifications" });
    }

    // Get cases created in the last 24 hours (only notify about recent cases)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const casesSnapshot = await db.collection("reports")
      .where("createdAt", ">=", oneDayAgo)
      .get();

    console.log("[check-and-notify-new-cases] Cases created in last 24h:", casesSnapshot.size);

    const allCaseIds = new Set();
    casesSnapshot.forEach(doc => {
      allCaseIds.add(doc.id);
    });

    // Get all existing notifications for new cases
    const existingNotifs = await db.collection("notifications")
      .where("type", "==", "new_case")
      .where("recipientUid", "==", uid)
      .get();

    console.log("[check-and-notify-new-cases] Existing new_case notifications:", existingNotifs.size);

    const notifiedCaseIds = new Set();
    existingNotifs.forEach(doc => {
      notifiedCaseIds.add(doc.data().caseId);
    });

    // Find cases that haven't been notified yet
    const unnotifiedCases = Array.from(allCaseIds).filter(caseId => !notifiedCaseIds.has(caseId));
    console.log('[check-and-notify-new-cases] Unnotified cases:', unnotifiedCases.length, unnotifiedCases);

    // Create notifications for unnotified cases
    for (const caseId of unnotifiedCases) {
      const caseSnap = await db.collection("reports").doc(caseId).get();
      if (caseSnap.exists) {
        const caseData = caseSnap.data();
        console.log('[check-and-notify-new-cases] Creating notification for case:', caseId, 'type:', caseData.incidentType);

        await createNotification(
          uid,
          "new_case",
          "New Case Filed",
          `A new ${caseData.incidentType} case has been filed`,
          caseId,
          {
            caseId: caseData.caseId,
            incidentType: caseData.incidentType,
            priorityLevel: caseData.priorityLevel
          }
        );
      }
    }

    console.log('[check-and-notify-new-cases] Success, notified:', unnotifiedCases.length);
    res.json({
      success: true,
      notifiedCount: unnotifiedCases.length
    });
  } catch (err) {
    console.error("[check-and-notify-new-cases] Error:", err);
    res.status(500).json({ error: err.message || "Failed to check notifications" });
  }
});

// ─── LIST AVAILABLE GEMINI MODELS ────────────────────────────────────────
app.get("/available-models", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Failed to fetch models" });
    }

    const modelList = data.models.map(model => ({
      name: model.name,
      displayName: model.displayName,
      supportedGenerationMethods: model.supportedGenerationMethods,
    }));

    res.json({
      success: true,
      models: modelList
    });
  } catch (err) {
    console.error("[list-models] Error:", err);
    res.status(500).json({ error: err.message || "Failed to list models" });
  }
});

// ─── AI CHAT ENDPOINT ─────────────────────────────────────────────────────
app.post("/ai-chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      `You are SafeTalk AI, a compassionate and supportive assistant designed to listen and help people who have experienced trauma or violence. You provide emotional support, safety resources, and guidance. You are confidential and non-judgmental. Keep responses warm, empathetic, and concise (2-3 sentences).\n\nUser message: ${message}`
    ]);

    const botMessage = result.response.text() || "I'm here to support you. How can I help?";

    res.json({
      success: true,
      message: botMessage
    });
  } catch (err) {
    console.error("[ai-chat] Error:", err);
    res.status(500).json({ error: err.message || "Failed to process AI chat" });
  }
});

// ─── ANALYTICS: AGE GROUP AFFECTED (donut source of truth) ─────────────
// NOTE: Uses Firestore Admin SDK to aggregate users.role.
// Frontend expects: { success: true, data: [{ key, label, color, pct }, ...] }
app.get('/analytics/age-group-affected', async (req, res) => {
  try {
    const usersSnap = await db.collection('users').get();

    const roleCounts = new Map();
    usersSnap.forEach((doc) => {
      const data = doc.data() || {};
      const role = data.role;
      if (!role) return;
      const normalized = String(role).toLowerCase();
      roleCounts.set(normalized, (roleCounts.get(normalized) || 0) + 1);
    });

    const buckets = [
      {
        key: 'women_18_35',
        label: 'Women 18–35',
        color: 'var(--primary)',
        roleKeys: ['women_18_35', 'women', 'adult_women', 'women_18plus', 'adult'],
      },
      {
        key: 'youth_13_17',
        label: 'Youth 13–17',
        color: '#6A1B9A',
        roleKeys: ['youth', 'youth_13_17', 'teen', 'teens', '13_17'],
      },
      {
        key: 'children_lt_13',
        label: 'Children <13',
        color: 'var(--info)',
        roleKeys: ['children', 'child', 'children_lt_13', 'kids', '<13', 'under_13', 'kid'],
      },
    ];

    const bucketCounts = buckets.map((b) => ({ ...b, count: 0 }));
    let otherCount = 0;

    for (const [roleKey, c] of roleCounts.entries()) {
      const matched = bucketCounts.find((b) => b.roleKeys.includes(roleKey));
      if (matched) matched.count += c;
      else otherCount += c;
    }

    const total = Array.from(roleCounts.values()).reduce((a, b) => a + b, 0);
    const safeTotal = total || 1;

    const data = [
      ...bucketCounts.map((b) => ({
        key: b.key,
        label: b.label,
        color: b.color,
        pct: (b.count / safeTotal) * 100,
      })),
      {
        key: 'other',
        label: 'Other',
        color: '#F8F0F5',
        pct: (otherCount / safeTotal) * 100,
      },
    ];

    res.json({ success: true, data });
  } catch (err) {
    console.error('[analytics/age-group-affected] failed:', err);
    res.status(500).json({ success: false, data: [], error: err.message || 'Failed to load analytics' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));


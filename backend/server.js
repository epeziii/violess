require("dotenv").config();
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { supabase } = require('./supabaseClient');

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

// Use Supabase-backed shim for Firestore-like operations
const db = require('./supabaseFirestoreShim');
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

function normalizeDateTimeInput(value) {
  if (value === null || value === undefined || value === "") {
    return new Date().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "number") {
    return new Date(value).toISOString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return new Date().toISOString();

    const cleaned = trimmed
      .replace(/\s*\([^)]*\)\s*$/, "")
      .replace(/GMT([+-])(\d{2})(\d{2})/i, "GMT$1$2:$3")
      .replace(/\s+/g, " ");

    const parsed = new Date(cleaned);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    const isoCandidate = trimmed.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/i);
    if (isoCandidate) {
      return new Date(isoCandidate[0]).toISOString();
    }
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return new Date().toISOString();
}

function toTitleCaseName(input) {
  const normalized = (input || "").trim().replace(/\s+/g, " ");
  if (!normalized) return "";

  return normalized
    .split(" ")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function splitName(fullName) {
  if (typeof fullName !== "string") return { firstName: "", middleName: "", lastName: "", fullName: "" };

  const normalized = toTitleCaseName(fullName);
  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length === 0) return { firstName: "", middleName: "", lastName: "", fullName: "" };

  if (parts.length === 1) {
    return { firstName: parts[0], middleName: "", lastName: "", fullName: parts[0] };
  }

  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  const middleName = parts.slice(1, -1).join(" ");

  return {
    firstName: parts.length === 2 ? firstName : `${firstName} ${middleName}`.trim(),
    middleName,
    lastName,
    fullName: normalized,
  };
}


// ─── CREATE STAFF ACCOUNT ──────────────────────────────────────────────
app.post("/record-staff-login", async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: "UID is required" });

    const staffRef = db.collection("staff").doc(uid);
    const staffSnap = await staffRef.get();
    if (!staffSnap.exists) return res.status(404).json({ error: "Staff user not found" });

    await staffRef.update({ lastLogin: new Date().toISOString() });
    res.json({ success: true });
  } catch (error) {
    console.error("Error recording staff login:", error);
    res.status(500).json({ error: error.message || "Failed to record staff login" });
  }
});

app.post("/create-staff", async (req, res) => {
  try {
    const { firstName, lastName, fullName, email, username, password, role, status } = req.body;
    const staffUsername = String(username || email || "").trim();

    if (!staffUsername || !password) {
      return res.status(400).json({ error: "Username/email and password are required" });
    }

    const timestamp = Date.now();
    const staffEmail = String(email || `${staffUsername.toLowerCase()}_${timestamp}@staff.local`).trim();
    const nameFromFull = splitName(fullName || `${firstName || ""} ${lastName || ""}`.trim());

    let resolvedFirstName = String(firstName || nameFromFull.firstName || "").trim();
    let resolvedLastName = String(lastName || nameFromFull.lastName || "").trim();
    let resolvedFullName = String(fullName || "").trim();
    resolvedFullName = toTitleCaseName(resolvedFullName || `${resolvedFirstName || ""} ${resolvedLastName || ""}`.trim());

    if (!resolvedFirstName && resolvedFullName) {
      const parsed = splitName(resolvedFullName);
      resolvedFirstName = parsed.firstName || "";
      resolvedLastName = parsed.lastName || "";
    }

    if (!resolvedLastName && resolvedFullName) {
      const parsed = splitName(resolvedFullName);
      resolvedLastName = parsed.lastName || "";
    }

    if (!resolvedFirstName && staffUsername) {
      resolvedFirstName = String(staffUsername).replace(/\d+$/, "");
    }

    const normalizedRole = String(role || "officer").trim();
    const normalizedStatus = String(status || "active").trim();

    const missing = [];
    if (!staffUsername) missing.push("username");
    if (!password) missing.push("password");
    if (!normalizedRole) missing.push("role");
    if (!resolvedFirstName) missing.push("firstName");
    if (!resolvedLastName) missing.push("lastName");

    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
    }

    let authUserId = null;
    if (supabase?.auth?.admin?.createUser) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: staffEmail,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: resolvedFirstName,
          last_name: resolvedLastName,
          full_name: resolvedFullName,
          username: staffUsername,
          role: normalizedRole,
        },
      });

      if (authError) {
        throw new Error(authError.message || "Failed to create Supabase auth user");
      }

      authUserId = authData?.user?.id;
    } else {
      const userRecord = await admin.auth().createUser({ email: staffEmail, password });
      authUserId = userRecord?.uid;
    }

    if (!authUserId) {
      return res.status(500).json({ error: "UID missing after auth user creation" });
    }

    const staffColor = normalizedRole === "admin" ? "blue" : "pink";
    const staffRecord = {
      id: authUserId,
      username: staffUsername,
      email: staffEmail,
      first_name: resolvedFirstName,
      last_name: resolvedLastName,
      full_name: resolvedFullName,
      role: normalizedRole,
      status: normalizedStatus,
      color: staffColor,
      last_login: null,
      cases: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase.from("staff").upsert([staffRecord], { onConflict: ["id"] });
    if (upsertError) throw upsertError;

    res.json({ success: true, uid: authUserId, email: staffEmail });
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
    const rawFull = (fullName || "").trim() || `${firstName || nameFromFull.firstName || ""} ${lastName || nameFromFull.lastName || ""}`.trim();
    const computedFullName = toTitleCaseName(rawFull);
    const resolvedFirst = firstName || nameFromFull.firstName || undefined;
    const resolvedLast = lastName || nameFromFull.lastName || undefined;

    const updateData = {
      role,
      first_name: resolvedFirst || undefined,
      last_name: resolvedLast || undefined,
      full_name: computedFullName,
      status,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("staff").update(updateData).eq("id", uid);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating staff:", err);
    res.status(500).json({ error: err.message || "Failed to update staff" });
  }
});

// ─── REQUEST PASSWORD RESET FOR STAFF ─────────────────────────────────
app.post("/request-password-reset", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || !String(username).trim()) {
      return res.status(400).json({ error: "Username is required" });
    }

    const normalizedUsername = String(username).trim();
    const usernameQuery = await db.collection("staff")
      .where("username", "==", normalizedUsername)
      .limit(1)
      .get();

    if (usernameQuery.empty) {
      return res.status(404).json({ error: "No account found for that username." });
    }

    const staffDoc = usernameQuery.docs[0];
    const staffData = staffDoc.data();
    const staffFullName = `${staffData.firstName || ""} ${staffData.lastName || ""}`.trim() || staffData.fullName || normalizedUsername;

    const adminsSnapshot = await db.collection("staff")
      .where("role", "==", "admin")
      .where("status", "==", "active")
      .get();

    if (adminsSnapshot.empty) {
      return res.status(404).json({ error: "No active admin account found to receive the password reset request." });
    }

    await Promise.all(adminsSnapshot.docs.map(async (adminDoc) => {
      await createNotification(
        adminDoc.id,
        "password_reset_request",
        "Password Reset Request",
        `${staffFullName} (${normalizedUsername}) requested a password reset. Please update their account password.`,
        null,
        {
          requestType: "password_reset",
          username: normalizedUsername,
          requestedUid: staffDoc.id,
          requestedFullName: staffFullName,
        }
      );
    }));

    res.json({ success: true });
  } catch (err) {
    console.error("Error requesting password reset:", err);
    res.status(500).json({ error: err.message || "Failed to request password reset" });
  }
});

// Resolve staff by username or email (used by web client when direct DB access is restricted)
app.post('/resolve-staff', async (req, res) => {
  try {
    const { username, email, identifier } = req.body;
    const lookupValue = String(username || email || identifier || '').trim();
    if (!lookupValue) return res.status(400).json({ error: 'Username or email is required' });

    const normalizedLookup = lookupValue.trim();

    const usernameQuery = await db.collection('staff').where('username', '==', normalizedLookup).limit(1).get();
    if (!usernameQuery.empty) {
      const staffDoc = usernameQuery.docs[0];
      const staffData = staffDoc.data();
      return res.json({ uid: staffDoc.id, email: staffData.email || null, profile: staffData });
    }

    if (normalizedLookup.includes('@')) {
      const emailQuery = await db.collection('staff').where('email', '==', normalizedLookup.toLowerCase()).limit(1).get();
      if (!emailQuery.empty) {
        const staffDoc = emailQuery.docs[0];
        const staffData = staffDoc.data();
        return res.json({ uid: staffDoc.id, email: staffData.email || null, profile: staffData });
      }
    }

    return res.status(404).json({ error: 'No account found for that username or email.' });
  } catch (err) {
    console.error('Error resolving staff by username/email:', err);
    res.status(500).json({ error: err.message || 'Failed to resolve staff' });
  }
});

// Get staff profile by uid
app.get('/staff/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ error: 'UID is required' });
    const staffRef = db.collection('staff').doc(uid);
    const snap = await staffRef.get();
    if (!snap.exists()) return res.status(404).json({ error: 'Staff not found' });
    return res.json({ uid: snap.id, profile: snap.data() });
  } catch (err) {
    console.error('Error fetching staff profile:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch staff profile' });
  }
});

// ─── UPDATE STAFF PASSWORD ────────────────────────────────────────────
app.post("/change-staff-password", async (req, res) => {
  try {
    const { uid, email, password } = req.body;
    const targetUid = String(uid || "").trim();
    const targetEmail = String(email || "").trim().toLowerCase();

    if (!targetUid && !targetEmail) {
      return res.status(400).json({ error: "UID or email is required" });
    }

    if (!password || String(password).trim().length < 8) {
      return res.status(400).json({ error: "A password of at least 8 characters is required" });
    }

    let authUserId = targetUid;

    if (!authUserId && targetEmail) {
      const { data: staffRow, error: staffError } = await supabase
        .from("staff")
        .select("id")
        .eq("email", targetEmail)
        .maybeSingle();

      if (staffError) throw staffError;
      if (!staffRow) {
        return res.status(404).json({ error: "No staff account found for that email." });
      }

      authUserId = staffRow.id;
    }

    if (supabase?.auth?.admin?.updateUserById) {
      const { data, error } = await supabase.auth.admin.updateUserById(authUserId, {
        password: String(password),
      });

      if (error) {
        throw new Error(error.message || "Failed to update password");
      }

      return res.json({ success: true, uid: data?.user?.id || authUserId });
    }

    await admin.auth().updateUser(authUserId, { password: String(password) });
    res.json({ success: true, uid: authUserId });
  } catch (err) {
    console.error("Error changing staff password:", err);
    res.status(500).json({ error: err.message || "Failed to update password" });
  }
});

// ─── UPDATE STAFF STATUS ──────────────────────────────────────────────
app.post("/update-staff-status", async (req, res) => {
  try {
    const { uid, status } = req.body;
    if (!uid || !status) return res.status(400).json({ error: "UID and status required" });

    const normalizedStatus = String(status).trim();
    const { error } = await supabase.from("staff").update({
      status: normalizedStatus,
      updated_at: new Date().toISOString(),
    }).eq("id", uid);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ error: err.message || "Failed to update status" });
  }
});

// ─── UPDATE CASE (with officer assignment) ────────────────────────────
app.post("/update-case", async (req, res) => {
  try {
    const { uid, caseId, status, priorityLevel, assignedOfficer, assignedOfficerUid } = req.body;
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

    // Canonical fields (recommended): assignedOfficerUid + assignedOfficer
    // Backward compat: if assignedOfficerUid isn't provided, we fall back to name-based assignment.
    const oldAssignedOfficerUid = caseData.assignedOfficerUid || null;
    const oldAssignedOfficerName = caseData.assignedOfficer || null;

    const newAssignedOfficerUid = assignedOfficerUid !== undefined ? (assignedOfficerUid || null) : oldAssignedOfficerUid;
    const newAssignedOfficerName = assignedOfficer !== undefined ? (assignedOfficer || null) : oldAssignedOfficerName;

    // Update the case
    const updateData = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === "referred") {
        updateData.referredAt = new Date();
      }
      if (status === "resolved" || status === "closed") {
        updateData.resolvedAt = new Date();
      }
    }
    if (priorityLevel !== undefined) updateData.priorityLevel = priorityLevel;
    // Canonical assignment
    if (assignedOfficerUid !== undefined) updateData.assignedOfficerUid = assignedOfficerUid || "";

    // Keep name field for backward compat + UI display (optional). Prefer uid as source of truth.
    if (assignedOfficer !== undefined) updateData.assignedOfficer = assignedOfficer || "";
    updateData.updatedAt = new Date();

    // Handle officer assignment changes only when assignment info is explicitly included.
    const hasUidChange = assignedOfficerUid !== undefined && oldAssignedOfficerUid !== newAssignedOfficerUid;
    const hasNameChange = assignedOfficer !== undefined && oldAssignedOfficerName !== newAssignedOfficerName;

    if (hasUidChange || hasNameChange) {
      // When assigned officer changes, record assignment timestamp
      const hasNewOfficer = assignedOfficerUid !== undefined
        ? newAssignedOfficerUid !== null
        : newAssignedOfficerName !== null;
      if (hasNewOfficer) {
        updateData.assignedAt = new Date();
      } else {
        updateData.assignedAt = null;
      }

      // Decrement old officer's case count and send reassignment notification
      if (oldAssignedOfficerUid || oldAssignedOfficerName) {
        let oldOfficerUid = oldAssignedOfficerUid;

        // Backward compat: resolve uid from name if needed
        if (!oldOfficerUid && oldAssignedOfficerName) {
          const staffSnapshot = await db.collection("staff").where("firstName", "!=", "").get();
          for (const doc of staffSnapshot.docs) {
            const staffData = doc.data();
            const fullName = `${staffData.firstName} ${staffData.lastName}`.trim();
            if (fullName === oldAssignedOfficerName) {
              oldOfficerUid = doc.id;
              break;
            }
          }
        }

        if (oldOfficerUid) {
          const oldStaffSnap = await db.collection("staff").doc(oldOfficerUid).get();
          const oldStaffData = oldStaffSnap.data() || {};
          const newCount = Math.max(0, (oldStaffData.cases || 0) - 1);
          await db.collection("staff").doc(oldOfficerUid).update({ cases: newCount });

          await createNotification(
            oldOfficerUid,
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
        }
      }

      // Increment new officer's case count and send notification
      if (newAssignedOfficerUid || newAssignedOfficerName) {
        let newOfficerUid = newAssignedOfficerUid;

        // Backward compat: resolve uid from name if needed
        if (!newOfficerUid && newAssignedOfficerName) {
          const staffSnapshot = await db.collection("staff").where("firstName", "!=", "").get();
          for (const doc of staffSnapshot.docs) {
            const staffData = doc.data();
            const fullName = `${staffData.firstName} ${staffData.lastName}`.trim();
            if (fullName === newAssignedOfficerName) {
              newOfficerUid = doc.id;
              break;
            }
          }
        }

        if (newOfficerUid) {
          const newStaffSnap = await db.collection("staff").doc(newOfficerUid).get();
          const newStaffData = newStaffSnap.data() || {};
          const newCount = (newStaffData.cases || 0) + 1;
          await db.collection("staff").doc(newOfficerUid).update({ cases: newCount });

          await createNotification(
            newOfficerUid,
            "case_assigned",
            "New Case Assigned",
            `You have been assigned to case #${caseData.caseId}`,
            caseId,
            {
              caseId: caseData.caseId,
              incidentType: caseData.incidentType,
              priorityLevel: status || caseData.priorityLevel
            }
          );
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
    const logId = db.collection("cases").doc().id; // Generate ID
    await db.collection("activity_logs").doc(logId).set({
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
      id: notifId,
      recipient_uid: recipientUid,
      actor_uid: null,
      title,
      body: message,
      payload: { caseId, caseData, type },
      read: false,
      created_at: new Date()
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
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

    const officerFullName = `${staffData.firstName} ${staffData.lastName}`.trim();

    // Get the case
    const caseRef = db.collection("reports").doc(caseId);
    const caseSnap = await caseRef.get();

    if (!caseSnap.exists) {
      return res.status(404).json({ error: "Case not found" });
    }

    const caseData = caseSnap.data();

    // Verify officer is assigned to case (canonical: assignedOfficerUid)
    const caseOfficerUid = caseData.assignedOfficerUid || null;

    if (caseOfficerUid) {
      if (caseOfficerUid !== uid) {
        return res.status(403).json({ error: "Unauthorized: you are not assigned to this case" });
      }
    } else {
      // Backward compat: fallback to name string match
      if (caseData.assignedOfficer !== officerFullName) {
        return res.status(403).json({ error: "Unauthorized: you are not assigned to this case" });
      }
    }

    // Create resolution document
    const resolutionId = db.collection("cases").doc().id;
    await db.collection("resolutions").doc(resolutionId).set({
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

    // Update case status to resolved and store resolution timestamp
    await caseRef.update({
      status: "resolved",
      resolvedAt: new Date(),
      updatedAt: new Date()
    });

    // Notify all admins about the new resolution request
    const adminsQuery = db.collection("staff")
      .where("role", "==", "admin")
      .where("status", "==", "active");
    const adminsSnapshot = await adminsQuery.get();
    const adminNotifications = adminsSnapshot.docs.map(async (adminDoc) => {
      const adminUid = adminDoc.id;
      const caseLabel = caseData?.caseId || caseId;
      const caseType = caseData?.incidentType ? ` (${caseData.incidentType})` : "";
      return createNotification(
        adminUid,
        "resolution_submitted",
        "New Resolution Request",
        `${officerFullName} submitted a resolution for case ${caseLabel}${caseType}. Please review and approve or reject it.`,
        caseId,
        caseData || null
      );
    });
    await Promise.all(adminNotifications);

    // Create activity log
    await createActivityLog(caseId, "resolution_submitted", uid, officerFullName, caseData.status, "resolved", notes);

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
    const resolutionRef = db.collection("reports").doc(caseId).collection("resolutions").doc(resolutionId);
    const resolutionSnap = await resolutionRef.get();
    if (!resolutionSnap.exists) {
      return res.status(404).json({ error: "Resolution not found" });
    }
    const resolutionData = resolutionSnap.data();

    // Update case status to closed
    const caseRef = db.collection("reports").doc(caseId);
    await caseRef.update({
      status: "closed",
      updatedAt: new Date()
    });

    const caseSnap = await caseRef.get();
    const caseData = caseSnap.exists ? caseSnap.data() : null;
    const recipientUid = resolutionData?.submittedBy;

    if (recipientUid) {
      await createNotification(
        recipientUid,
        "resolution_approved",
        "Resolution Approved",
        `Your resolution request for case ${caseId} has been approved and the case is now closed.`,
        caseId,
        caseData || null
      );
    }

    // Delete the resolution document from Firestore
    await resolutionRef.delete();
    const deletedResolutionSnap = await resolutionRef.get();
    if (deletedResolutionSnap.exists) {
      console.warn(`Resolution document ${resolutionId} still exists after delete attempt for case ${caseId}`);
      await resolutionRef.delete();
    }

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
    const resolutionRef = db.collection("reports").doc(caseId).collection("resolutions").doc(resolutionId);
    const resolutionSnap = await resolutionRef.get();
    if (!resolutionSnap.exists) {
      return res.status(404).json({ error: "Resolution not found" });
    }
    const resolutionData = resolutionSnap.data();

    // Update case status back to reviewing
    const caseRef = db.collection("reports").doc(caseId);
    await caseRef.update({
      status: "reviewing",
      updatedAt: new Date()
    });

    const caseSnap = await caseRef.get();
    const caseData = caseSnap.exists ? caseSnap.data() : null;
    const recipientUid = resolutionData?.submittedBy;

    if (recipientUid) {
      await createNotification(
        recipientUid,
        "resolution_rejected",
        "Resolution Rejected",
        `Your resolution request for case ${caseId} has been rejected. Please review the comments and resubmit.`,
        caseId,
        caseData || null
      );
    }

    // Delete the resolution document from Firestore
    await resolutionRef.delete();
    const deletedResolutionSnap = await resolutionRef.get();
    if (deletedResolutionSnap.exists) {
      console.warn(`Resolution document ${resolutionId} still exists after delete attempt for case ${caseId}`);
      await resolutionRef.delete();
    }

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
      first_name: firstName,
      last_name: lastName,
      email,
      contact_number: phone,
      barangay: barangay || "",
      status: "active",
      registration_complete: false,
      last_login: null,
      profile: { avatar: null },
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
      last_login: new Date().toISOString()
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
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (phone) updateData.contact_number = phone;
    if (barangay) updateData.barangay = barangay;
    if (avatar) updateData.profile = { avatar };

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
    const { uid, incidentType, caseType, description, location, datetime, isAnonymous, suspectDescription, evidence, contactNumber: bodyContactNumber, emergencyContact: bodyEmergencyContact } = req.body;
    const typeValue = incidentType || caseType; // Accept both field names
    if (!uid || !typeValue || !description)
      return res.status(400).json({ error: "uid, incidentType (or caseType), and description are required" });

    const normalizedIncidentDate = normalizeDateTimeInput(datetime);
    const currentYear = new Date().getFullYear();
    const casesRef = db.collection("cases");

    // Generate case ID: VIO-YYYY-NNN
    // Query cases created this year
    const yearStart = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0));
    const yearEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59));

    const casesQuery = await casesRef
      .where("created_at", ">=", yearStart)
      .where("created_at", "<=", yearEnd)
      .orderBy("created_at", "desc")
      .limit(1)
      .get();

    let caseNumber = 1;
    if (!casesQuery.empty) {
      const lastCase = casesQuery.docs[0].data();
      const lastCaseId = lastCase.case_number || `VIO-${currentYear}-000`;
      const lastNumber = parseInt(lastCaseId.split('-')[2], 10) || 0;
      caseNumber = lastNumber + 1;
    }

    const caseNumber_val = `VIO-${currentYear}-${String(caseNumber).padStart(3, '0')}`;

    // Get user info (for reporter name, contact number, and emergency contact if not anonymous)
    let reporterName = "Anonymous";
    let contactNumber = "";
    let emergencyContact = "";
    if (!isAnonymous) {
      const userSnap = await db.collection("users").doc(uid).get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        reporterName = `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || "Anonymous";
        contactNumber = bodyContactNumber?.toString()?.trim() || userData.contact_number || userData.phone || userData.phoneNumber || "";
        emergencyContact = bodyEmergencyContact?.toString()?.trim() || userData.emergency || userData.emergencyContact || "";
      }
    }

    // Create case document
    const caseData = {
      case_number: caseNumber_val,
      reporter: uid,  // Always store uid so user can retrieve their cases (even if anonymous)
      type: typeValue,
      description,
      location: location || "",
      status: "pending",
      metadata: {
        suspect_description: suspectDescription || "",
        evidence: evidence || [],
        incident_date: normalizedIncidentDate,
        is_anonymous: isAnonymous,
        reporter_name: reporterName,
        contact_number: contactNumber,
        emergency_contact: emergencyContact,
        priority_level: "normal",
        assigned_officer: ""
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newCaseRef = await casesRef.add(caseData);
    const createdCaseId = newCaseRef.id;

    // Notify all active admins immediately when a new case is filed.
    const adminsSnapshot = await db.collection("staff")
      .where("role", "==", "admin")
      .where("status", "==", "active")
      .get();

    for (const adminDoc of adminsSnapshot.docs) {
      await createNotification(
        adminDoc.id,
        "new_case",
        "New Case Filed",
        `A new ${typeValue} case has been filed: ${caseNumber_val}`,
        createdCaseId,
        {
          caseId: createdCaseId,
          incidentType,
          priorityLevel: reportData.priorityLevel
        }
      );
    }

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

    const casesRef = db.collection("cases");
    const snapshot = await casesRef
      .where("reporter", "==", uid)
      .orderBy("created_at", "desc")
      .get();

    if (snapshot.empty) {
      return res.json({ success: true, cases: [] });
    }

    const cases = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        assignedAt: data.assignedAt?.toDate?.() || data.assignedAt || null,
        resolvedAt: data.resolvedAt?.toDate?.() || data.resolvedAt || null,
        referredAt: data.referredAt?.toDate?.() || data.referredAt || null,
      };
    });

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
    const snapshot = await db.collection("help_centers").get();
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
      .where("recipient_uid", "==", uid)
      .orderBy("created_at", "desc")
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
      .where("recipient_uid", "==", uid)
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
        `A new ${incidentType} case has been filed: ${caseId}`,
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
    const casesSnapshot = await db.collection("cases")
      .where("createdAt", ">=", oneDayAgo)
      .get();

    console.log("[check-and-notify-new-cases] Cases created in last 24h:", casesSnapshot.size);

    const allCaseIds = new Set();
    casesSnapshot.forEach(doc => {
      const caseData = doc.data();
      if (caseData?.caseId) {
        allCaseIds.add(caseData.caseId);
      } else {
        allCaseIds.add(doc.id);
      }
    });

    // Get all existing notifications for new cases
    const existingNotifs = await db.collection("notifications")
      .where("type", "==", "new_case")
      .where("recipient_uid", "==", uid)
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
      const caseSnap = await db.collection("cases").doc(caseId).get();
      if (!caseSnap.empty) {
        const caseDoc = caseSnap.docs[0];
        const caseData = caseDoc.data();
        console.log('[check-and-notify-new-cases] Creating notification for case:', caseId, 'type:', caseData.incidentType);

        await createNotification(
          uid,
          "new_case",
          "New Case Filed",
          `A new ${caseData.incidentType} case has been filed: ${caseData.caseId}`,
          caseId,
          {
            caseId: caseData.caseId,
            incidentType: caseData.incidentType,
            priorityLevel: caseData.priorityLevel
          }
        );
      } else {
        console.warn('[check-and-notify-new-cases] Could not find report document for caseId:', caseId);
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
        // Firestore data has had historical inconsistencies like `woman` vs `women`.
        // Include both to ensure correct bucket mapping.
        roleKeys: ['women_18_35', 'women', 'woman', 'adult_women', 'women_18plus', 'adult_women', 'adult'],
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
        count: b.count,
      })),
      {
        key: 'other',
        label: 'Other',
        color: '#F8F0F5',
        pct: (otherCount / safeTotal) * 100,
        count: otherCount,
      },
    ];

    res.json({ success: true, data });
  } catch (err) {
    console.error('[analytics/age-group-affected] failed:', err);
    res.status(500).json({ success: false, data: [], error: err.message || 'Failed to load analytics' });
  }
});

// ─── ANALYTICS: MONTHLY CASES ───────────────────────────────────────
// Returns case counts per month for a given year.
// Query params:
//   - year (optional, default = current year)
// Output shape for frontend:
//   { success: true, data: [{ month: 'Jan', cases: 0 }, ...] }
app.get('/analytics/monthly-cases', async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();

    const yearParam = req.query?.year;
    const year = yearParam ? Number(yearParam) : currentYear;

    if (!Number.isFinite(year)) {
      return res.status(400).json({ success: false, error: 'Invalid year' });
    }

    const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

    // Month keys in JS Date are 0..11
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts = Array.from({ length: 12 }, () => 0);

    const reportsSnap = await db.collection('reports')
      .where('createdAt', '>=', yearStart)
      .where('createdAt', '<=', yearEnd)
      .get();

    reportsSnap.forEach((doc) => {
      const data = doc.data() || {};
      const createdAt = data.createdAt;
      const dt = createdAt?.toDate ? createdAt.toDate() : createdAt;
      if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) return;

      const monthIndex = dt.getMonth();
      if (monthIndex >= 0 && monthIndex <= 11) counts[monthIndex] += 1;
    });

    const data = counts.map((c, idx) => ({
      month: monthNames[idx],
      cases: c,
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error('[analytics/monthly-cases] failed:', err);
    res.status(500).json({ success: false, data: [], error: err.message || 'Failed to load analytics' });
  }
});

// ─── ANALYTICS: MOST COMMON ABUSE TYPE ──────────────────────────────
// Computes the most common incidentType from Firestore `reports`.
// Output shape for frontend:
//   { success: true, data: [{ label, count, pct, color }, ...] }
app.get('/analytics/most-common-abuse-type', async (req, res) => {
  try {
    // Colors should match the frontend widget styling.
    const colorMap = {
      Domestic: process.env.ABUSE_COLOR_DOMESTIC || 'var(--primary)',
      Harassment: process.env.ABUSE_COLOR_HARASSMENT || '#7B2D8B',
      Bullying: process.env.ABUSE_COLOR_BULLYING || 'var(--info)',
      Threats: process.env.ABUSE_COLOR_THREATS || 'var(--warn)',
      Other: process.env.ABUSE_COLOR_OTHER || 'var(--text-muted)',
    };

    // Normalize incident types we expect.
    // If Firestore has inconsistent naming, we map known variants.
    const normalizeIncidentType = (raw) => {
      if (!raw) return null;
      const s = String(raw).trim().toLowerCase();
      const map = [
        { keys: ['domestic', 'domestic violence', 'dv'], label: 'Domestic' },
        { keys: ['harassment', 'harass'], label: 'Harassment' },
        { keys: ['bullying', 'bully'], label: 'Bullying' },
        { keys: ['threats', 'threat', 'threatening'], label: 'Threats' },
      ];
      const found = map.find((m) => m.keys.includes(s));
      return found?.label || null;
    };

    const reportsSnap = await db.collection('cases').get();

    const counts = new Map();
    let otherCount = 0;

    reportsSnap.forEach((doc) => {
      const data = doc.data() || {};
      const normalized = normalizeIncidentType(data.incidentType);
      if (normalized) counts.set(normalized, (counts.get(normalized) || 0) + 1);
      else otherCount += 1;
    });

    const labelsInOrder = ['Domestic', 'Harassment', 'Bullying', 'Threats', 'Other'];

    const total = labelsInOrder.reduce((acc, label) => {
      if (label === 'Other') return acc + otherCount;
      return acc + (counts.get(label) || 0);
    }, 0);

    const safeTotal = total || 1;

    const data = labelsInOrder.map((label) => {
      const count = label === 'Other' ? otherCount : (counts.get(label) || 0);
      return {
        key: label,
        label,
        count,
        pct: (count / safeTotal) * 100,
        color: colorMap[label] || 'var(--text-muted)',
      };
    });

    // Sort within categories? For the widget we keep fixed order.
    // If you want top-N sorting later, we can adjust.

    res.json({ success: true, data });
  } catch (err) {
    console.error('[analytics/most-common-abuse-type] failed:', err);
    res.status(500).json({ success: false, data: [], error: err.message || 'Failed to load analytics' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));





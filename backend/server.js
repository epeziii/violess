const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const nodemailer = require("nodemailer");

// 🔑 Firebase Admin SDK service account
const serviceAccount = require("./violess-4e542-firebase-adminsdk-fbsvc-78fd8f52d9.json");

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

// ─── REGISTER MOBILE USER ──────────────────────────────────────────────
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
      uid: isAnonymous ? null : uid,
      incidentType,
      description,
      location: location || "",
      datetime: datetime || "",
      isAnonymous,
      reporterName,
      status: "pending",
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

// ─── START SERVER ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
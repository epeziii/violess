const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

// 🔑 Firebase Admin SDK service account
const serviceAccount = require("./violess-4e542-firebase-adminsdk-fbsvc-78fd8f52d9.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

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

// ─── START SERVER ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
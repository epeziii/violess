// src/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "./firebase";
import app from "./firebase"; // your firebase config and supabase adapter
import API_BASE_URL from "./config/api";

// ─── Role permissions map ────────────────────────────────────────────────────
export const PERMISSIONS = {
  admin: {
    dashboard:        true,
    cases:            true,
    referrals:        true,
    communications:   true,
    analytics:        true,
    evidence:         true,
    accountManagement:true,
    systemSettings:   true,
    deleteRecords:    true,
    exportData:       true,
  },
  officer: {
    dashboard:        true,
    cases:            false,
    referrals:        true,
    communications:   true,
    analytics:        "view",
    evidence:         true,
    accountManagement:false,
    systemSettings:   true,
    deleteRecords:    false,
    exportData:       false,
  },
};

// ─── Auth Context ────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = getAuth(app);
  const db = {}; // placeholder db object for compatibility with collection/doc helpers

  const [user, setUser] = useState(null); // { uid, name, email, role, barangay, avatar }
  const [loading, setLoading] = useState(true);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user profile from Firestore
        const snap = await getDoc(doc(db, "staff", firebaseUser.uid));
        if (snap.exists()) {
          const profile = snap.data();
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...profile });
          sessionStorage.setItem("violess_user", JSON.stringify({ uid: firebaseUser.uid, email: firebaseUser.email, ...profile }));
        } else {
          setUser(null);
          sessionStorage.removeItem("violess_user");
        }
      } else {
        setUser(null);
        sessionStorage.removeItem("violess_user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  // Firebase login
  const login = async (identifier, password) => {
    // Identifier may be an email or a username. Resolve to Firebase email when needed.
    let emailToUse = identifier;
    if (typeof identifier === "string" && !identifier.includes("@")) {
      // Resolve username to email via backend (avoids anon DB/RLS issues)
      const resp = await fetch(`${API_BASE_URL}/resolve-staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: identifier }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "No user found for that username");
      }
      const json = await resp.json();
      // Ensure we have an email address to pass to Firebase
      if (!json.email || !String(json.email).includes("@")) {
        throw new Error("No email address found for that username. Contact your administrator.");
      }
      emailToUse = json.email;
    }

    // Attempt Firebase sign-in, map common errors to friendly messages
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, emailToUse, password);
    } catch (err) {
      const code = err?.code || err?.message || String(err);
      if (code.includes("auth/wrong-password") || code.includes("auth/invalid-credential") || /wrong-password/i.test(code)) {
        throw new Error("Invalid username or password.");
      }
      if (code.includes("auth/user-not-found") || /user-not-found/i.test(code)) {
        throw new Error("No account found for that email.");
      }
      throw err;
    }
    const staffRef = doc(db, "staff", cred.user.uid);
    const snap = await getDoc(staffRef);
    if (!snap.exists()) throw new Error("No user profile found");

    try {
      await fetch(`${API_BASE_URL}/record-staff-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: cred.user.uid }),
      });
    } catch (err) {
      console.warn("Failed to record lastLogin via backend API:", err);
    }

    const updatedSnap = await getDoc(staffRef);
    const profile = updatedSnap.data();
    setUser({ uid: cred.user.uid, email: cred.user.email, ...profile });
    sessionStorage.setItem("violess_user", JSON.stringify({ uid: cred.user.uid, email: cred.user.email, ...profile }));
    return { uid: cred.user.uid, email: cred.user.email, ...profile };
  };

  // Logout
  const logoutUser = async () => {
    await signOut(auth);
    setUser(null);
    sessionStorage.removeItem("violess_user");
  };

  // Permission checker
  const can = (permission) => {
    if (!user) return false;
    return !!PERMISSIONS[user.role]?.[permission];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout: logoutUser, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
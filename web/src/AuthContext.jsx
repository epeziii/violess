// src/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, getFirestore } from "firebase/firestore";
import app from "./firebase"; // your firebase config

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
    systemSettings:   false,
    deleteRecords:    false,
    exportData:       false,
  },
};

// ─── Auth Context ────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = getAuth(app);
  const db   = getFirestore(app);

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
      // lookup staff by username
      const q = query(collection(db, "staff"), where("username", "==", identifier));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("No user found for that username");
      const profile = snap.docs[0].data();
      emailToUse = profile.email || `${identifier}@username.violess.local`;
    }

    const cred = await signInWithEmailAndPassword(auth, emailToUse, password);
    const snap = await getDoc(doc(db, "staff", cred.user.uid));
    if (!snap.exists()) throw new Error("No user profile found");
    const profile = snap.data();
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
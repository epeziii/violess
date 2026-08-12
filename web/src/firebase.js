// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ─── Your Firebase config ────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCPUF_3qHa5IS5e35ENSl1ctMkgNOEQHjY",
  authDomain: "violess1.firebaseapp.com",
  projectId: "violess1",
  storageBucket: "violess1.firebasestorage.app",
  messagingSenderId: "861878035958",
  appId: "1:861878035958:web:f9c8321a0d4fb28c87d3d7",
  measurementId: "G-1EBXCSKC9E"
};

// ─── Initialize Firebase ────────────────────────────────────────────────
const app = initializeApp(firebaseConfig);

// Optional analytics
const analytics = getAnalytics(app);

// ─── Firebase services ─────────────────────────────────────────────────
const auth = getAuth(app);       // For authentication
const db   = getFirestore(app);  // For Firestore database

// ─── Export app and services ────────────────────────────────────────────
export { app, auth, db };
export default app;
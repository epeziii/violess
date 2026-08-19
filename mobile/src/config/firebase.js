// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCPUF_3qHa5IS5e35ENSl1ctMkgNOEQHjY",
  authDomain: "violess1.firebaseapp.com",
  projectId: "violess1",
  storageBucket: "violess1.firebasestorage.app",
  messagingSenderId: "861878035958",
  appId: "1:861878035958:web:f9c8321a0d4fb28c87d3d7",
  measurementId: "G-1EBXCSKC9E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);
// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC5mRFHNtXwzH5BKS0U7sIPOVwX4bil1K8",
  authDomain: "violess-4e542.firebaseapp.com",
  projectId: "violess-4e542",
  storageBucket: "violess-4e542.appspot.com",
  messagingSenderId: "990954954375",
  appId: "1:990954954375:web:3d140db136ea354a0e2222",
  measurementId: "G-L2K067VNZ6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);
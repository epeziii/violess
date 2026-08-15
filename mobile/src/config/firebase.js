// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from "./supabase";

// Your Firebase config (kept for auth init)
const firebaseConfig = {
  apiKey: "AIzaSyC5mRFHNtXwzH5BKS0U7sIPOVwX4bil1K8",
  authDomain: "violess-4e542.firebaseapp.com",
  projectId: "violess-4e542",
  storageBucket: "violess-4e542.appspot.com",
  messagingSenderId: "990954954375",
  appId: "1:990954954375:web:3d140db136ea354a0e2222",
  measurementId: "G-L2K067VNZ6"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// db placeholder for compatibility
export const db = {};

// Minimal Firestore-like helpers for mobile, backed by Supabase
export function collection(_db, name) { return { table: name }; }
export function doc(a, b, c) {
  if (a && a.table && typeof b !== 'undefined') return { table: a.table, id: String(b) };
  return { table: String(b), id: String(c) };
}
export function where(field, op, value) { return { type: 'where', field, op, value }; }
export function orderBy(field, dir = 'asc') { return { type: 'orderBy', field, dir }; }
export function limit(n) { return { type: 'limit', n }; }
export function query(colRef, ...constraints) { return { table: colRef.table, constraints }; }

export async function getDocs(queryRef) {
  const table = queryRef.table;
  let builder = supabase.from(table).select('*');
  for (const c of (queryRef.constraints || [])) {
    if (c.type === 'where') {
      switch (c.op) {
        case '==': builder = builder.eq(c.field, c.value); break;
        case '!=': builder = builder.neq(c.field, c.value); break;
        case '>': builder = builder.gt(c.field, c.value); break;
        case '>=': builder = builder.gte(c.field, c.value); break;
        case '<': builder = builder.lt(c.field, c.value); break;
        case '<=': builder = builder.lte(c.field, c.value); break;
        default: builder = builder.eq(c.field, c.value);
      }
    } else if (c.type === 'orderBy') {
      builder = builder.order(c.field, { ascending: c.dir === 'asc' });
    } else if (c.type === 'limit') {
      builder = builder.limit(c.n);
    }
  }
  const { data, error } = await builder;
  if (error) throw error;
  const docs = (data || []).map((row) => ({ id: String(row.id || row.uid || ''), data: () => row }));
  return { docs };
}

export async function getDoc(docRef) {
  const { data, error } = await supabase.from(docRef.table).select('*').eq('id', docRef.id).maybeSingle();
  if (error) throw error;
  if (!data) return { exists: () => false, data: () => null };
  return { exists: () => true, data: () => data };
}

export async function addDoc(colRef, data) {
  const { data: inserted, error } = await supabase.from(colRef.table).insert([data]).select().single();
  if (error) throw error;
  return { id: String(inserted.id || '') };
}

export async function setDoc(docRef, data, options = {}) {
  const payload = { ...data, id: docRef.id };
  const { error } = await supabase.from(docRef.table).upsert([payload], { onConflict: ['id'] });
  if (error) throw error;
}

export async function updateDoc(docRef, data) {
  const { error } = await supabase.from(docRef.table).update(data).eq('id', docRef.id);
  if (error) throw error;
}

export function onSnapshot(queryRef, callback, onError) {
  let active = true;
  const callNow = async () => {
    try {
      const snap = await getDocs(queryRef);
      if (!active) return;
      callback(snap);
    } catch (e) {
      if (onError) onError(e);
    }
  };
  callNow();
  const id = setInterval(callNow, 3000);
  return () => { active = false; clearInterval(id); };
}

export const serverTimestamp = () => new Date();
export const Timestamp = { now: () => new Date() };
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { supabase } from "./supabase";

// Keep Firebase Auth for now (migration focuses on Firestore -> Supabase)
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
const analytics = getAnalytics(app);
const auth = getAuth(app);

// --- Minimal Firestore-like adapter backed by Supabase ---

const db = {}; // compatibility placeholder for `getFirestore(app)` usage

function collection(_db, name) {
  return { table: name };
}

function doc(a, b, c) {
  // Supports both doc(collectionRef, id) and doc(db, "collection", id)
  if (a && a.table && typeof b !== 'undefined') {
    return { table: a.table, id: String(b) };
  }
  // assume form doc(db, "collectionName", id)
  return { table: String(b), id: String(c) };
}

function where(field, op, value) {
  return { type: 'where', field, op, value };
}

function orderBy(field, dir = 'asc') {
  return { type: 'orderBy', field, dir };
}

function limit(n) {
  return { type: 'limit', n };
}

function query(colRef, ...constraints) {
  return { table: colRef.table, constraints };
}

async function getDocs(queryRef) {
  const table = queryRef.table;
  let builder = supabase.from(table).select('*');

  for (const c of (queryRef.constraints || [])) {
    if (c.type === 'where') {
      switch (c.op) {
        case '==':
          builder = builder.eq(c.field, c.value);
          break;
        case '!=':
        case '<>':
          builder = builder.neq(c.field, c.value);
          break;
        case '>':
          builder = builder.gt(c.field, c.value);
          break;
        case '>=':
          builder = builder.gte(c.field, c.value);
          break;
        case '<':
          builder = builder.lt(c.field, c.value);
          break;
        case '<=':
          builder = builder.lte(c.field, c.value);
          break;
        case 'array-contains':
          builder = builder.contains(c.field, [c.value]);
          break;
        default:
          builder = builder.eq(c.field, c.value);
      }
    } else if (c.type === 'orderBy') {
      builder = builder.order(c.field, { ascending: c.dir === 'asc' });
    } else if (c.type === 'limit') {
      builder = builder.limit(c.n);
    }
  }

  const { data, error } = await builder;
  if (error) throw error;

  // Mimic Firestore snapshot.docs array of { id, data() }
  const docs = (data || []).map((row) => ({ id: String(row.id || row.uid || row.uuid || row._id || ''), data: () => row }));
  return { docs };
}

async function getDoc(docRef) {
  const { data, error } = await supabase.from(docRef.table).select('*').eq('id', docRef.id).maybeSingle();
  if (error) throw error;
  if (!data) return { exists: () => false, data: () => null };
  return { exists: () => true, data: () => data };
}

async function addDoc(colRef, data) {
  const { data: inserted, error } = await supabase.from(colRef.table).insert([data]).select().single();
  if (error) throw error;
  return { id: String(inserted.id || '') };
}

async function setDoc(docRef, data, options = {}) {
  const payload = { ...data, id: docRef.id };
  const { error } = await supabase.from(docRef.table).upsert([payload], { onConflict: ['id'] });
  if (error) throw error;
}

async function updateDoc(docRef, data) {
  const { error } = await supabase.from(docRef.table).update(data).eq('id', docRef.id);
  if (error) throw error;
}

function onSnapshot(queryRef, callback, onError) {
  // Simple polling-based subscription: fetch immediately and then poll every 3s.
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

  return () => {
    active = false;
    clearInterval(id);
  };
}

const serverTimestamp = () => new Date();

const Timestamp = {
  now: () => new Date(),
};

export {
  app,
  auth,
  supabase,
  db,
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
};

export default app;
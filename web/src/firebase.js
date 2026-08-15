// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { supabase } from "./supabase";

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

const TABLE_ALIASES = {
  reports: "cases",
  report: "cases",
};

const FIELD_ALIASES = {
  recipientUid: "recipient_uid",
  createdAt: "created_at",
  caseId: "case_id",
  assignedOfficer: "assigned_officer",
  assignedOfficerUid: "assigned_officer_uid",
  firstName: "first_name",
  lastName: "last_name",
  fullName: "full_name",
  updatedAt: "updated_at",
  reporter: "reporter",
  caseNumber: "case_number",
  assignedAt: "assigned_at",
  resolvedAt: "resolved_at",
  submittedAt: "submitted_at",
  reviewedAt: "reviewed_at",
  created_at: "created_at",
  recipient_uid: "recipient_uid",
  case_id: "case_id",
};

const db = {}; // compatibility placeholder

function normalizeTableName(name) {
  return TABLE_ALIASES[name] || name;
}

function normalizeFieldName(field) {
  return FIELD_ALIASES[field] || field;
}

function collection(_db, name) {
  return { table: normalizeTableName(name) };
}

function doc(a, b, c) {
  if (a && a.table && typeof b !== "undefined") {
    return { table: normalizeTableName(a.table), id: String(b) };
  }
  return { table: normalizeTableName(String(b)), id: String(c) };
}

function where(field, op, value) {
  return { type: "where", field: normalizeFieldName(field), op, value };
}

function orderBy(field, dir = "asc") {
  return { type: "orderBy", field: normalizeFieldName(field), dir };
}

function limit(n) {
  return { type: "limit", n };
}

function query(colRef, ...constraints) {
  return { table: normalizeTableName(colRef.table), constraints };
}

async function getDocs(queryRef) {
  const table = normalizeTableName(queryRef.table);
  let builder = supabase.from(table).select("*");

  for (const c of (queryRef.constraints || [])) {
    if (c.type === "where") {
      const field = normalizeFieldName(c.field);
      switch (c.op) {
        case "==":
          builder = builder.eq(field, c.value);
          break;
        case "!=":
        case "<>":
          builder = builder.neq(field, c.value);
          break;
        case ">":
          builder = builder.gt(field, c.value);
          break;
        case ">=":
          builder = builder.gte(field, c.value);
          break;
        case "<":
          builder = builder.lt(field, c.value);
          break;
        case "<=":
          builder = builder.lte(field, c.value);
          break;
        case "array-contains":
          builder = builder.contains(field, [c.value]);
          break;
        default:
          builder = builder.eq(field, c.value);
      }
    } else if (c.type === "orderBy") {
      builder = builder.order(normalizeFieldName(c.field), { ascending: c.dir === "asc" });
    } else if (c.type === "limit") {
      builder = builder.limit(c.n);
    }
  }

  const { data, error } = await builder;
  if (error) throw error;

  const docs = (data || []).map((row) => ({ id: String(row.id || row.uid || row.uuid || row._id || ""), data: () => row }));
  return { docs };
}

async function getDoc(docRef) {
  const table = normalizeTableName(docRef.table);
  const { data, error } = await supabase.from(table).select("*").eq("id", docRef.id).maybeSingle();
  if (error) throw error;
  if (!data) return { exists: () => false, data: () => null };
  return { exists: () => true, data: () => data };
}

async function addDoc(colRef, data) {
  const table = normalizeTableName(colRef.table);
  const { data: inserted, error } = await supabase.from(table).insert([data]).select().single();
  if (error) throw error;
  return { id: String(inserted.id || "") };
}

async function setDoc(docRef, data, options = {}) {
  const payload = { ...data, id: docRef.id };
  const table = normalizeTableName(docRef.table);
  const { error } = await supabase.from(table).upsert([payload], { onConflict: ["id"] });
  if (error) throw error;
}

async function updateDoc(docRef, data) {
  const table = normalizeTableName(docRef.table);
  const { error } = await supabase.from(table).update(data).eq("id", docRef.id);
  if (error) throw error;
}

function onSnapshot(queryRef, callback, onError) {
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
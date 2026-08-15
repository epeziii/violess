/*
  Supabase-backed shim that implements a minimal subset of the
  Firestore Admin API used by `server.js`.

  This is intentionally narrow: it supports the patterns used in
  server.js such as:
    - db.collection(name).doc(id).get()/set()/update()/delete()
    - db.collection(name).add(data)
    - db.collection(name).where(...).orderBy(...).limit(n).get()
    - db.collection(name).doc().id  (generate id)
    - db.batch() with update operations
    - subcollections for reports: activityLog, resolutions, messages

  Note: For production you should migrate to explicit SQL queries tailored
  to your schema. This shim is to accelerate the migration by keeping
  server.js logic mostly unchanged.
*/

const { supabase } = require('./supabaseClient');
const crypto = require('crypto');

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

// Serialize Date objects and other non-serializable types
function serializeData(obj) {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeData);
  if (typeof obj === 'object') {
    const serialized = {};
    for (const key in obj) {
      serialized[key] = serializeData(obj[key]);
    }
    return serialized;
  }
  return obj;
}

// Map Firestore "collection" and subcollections to Supabase tables
const subcollectionMap = {
  activityLog: 'activity_logs',
  resolutions: 'resolutions',
  messages: 'messages',
};

class DocSnapshot {
  constructor(id, row) {
    this._id = id;
    this._row = row;
  }
  get id() { return this._id; }
  exists() { return !!this._row; }
  data() { return this._row; }
}

class QuerySnapshot {
  constructor(rows) {
    this.docs = (rows || []).map(r => ({ id: String(r.id), data: () => r }));
    this.size = this.docs.length;
    this.empty = this.docs.length === 0;
  }
  forEach(fn) { this.docs.forEach(d => fn(d)); }
}

class DocRef {
  constructor(table, id) {
    this.table = table;
    this.id = id || generateId();
  }
  async get() {
    const { data, error } = await supabase.from(this.table).select('*').eq('id', this.id).maybeSingle();
    if (error) throw error;
    return new DocSnapshot(this.id, data || null);
  }
  async set(payload) {
    const row = { ...serializeData(payload), id: this.id };
    console.log(`[Shim] Upserting to ${this.table}:`, JSON.stringify(row, null, 2));
    const { data, error } = await supabase.from(this.table).upsert([row], { onConflict: ['id'] });
    console.log(`[Shim] Upsert result - error: ${error ? error.message : 'none'}, data:`, data);
    if (error) throw error;
    return { id: this.id };
  }
  async update(payload) {
    const { error } = await supabase.from(this.table).update(serializeData(payload)).eq('id', this.id);
    if (error) throw error;
  }
  async delete() {
    const { error } = await supabase.from(this.table).delete().eq('id', this.id);
    if (error) throw error;
  }
  collection(subName) {
    const mapped = subcollectionMap[subName];
    if (!mapped) {
      // fallback: name the table `${this.table}__${subName}`
      return new CollectionRef(`${this.table}__${subName}`, { caseId: this.id });
    }
    return new CollectionRef(mapped, { caseId: this.id });
  }
}

class CollectionRef {
  constructor(table, opts = {}) {
    this.table = table;
    this._opts = opts; // for subcollections (e.g., { caseId })
    this._wheres = [];
    this._order = null;
    this._limit = null;
  }
  doc(id) {
    if (!id) return new DocRef(this.table, generateId());
    return new DocRef(this.table, id);
  }
  async add(payload) {
    const id = generateId();
    const row = { ...serializeData(payload), id };
    // attach caseId for subcollection writes
    if (this._opts.caseId) row.case_id = this._opts.caseId;
    const { data, error } = await supabase.from(this.table).insert([row]).select().single();
    if (error) throw error;
    return { id: String(data.id) };
  }
  where(field, op, val) {
    this._wheres.push({ field, op, val });
    return this;
  }
  orderBy(field, dir = 'asc') {
    this._order = { field, dir };
    return this;
  }
  limit(n) {
    this._limit = n;
    return this;
  }
  async get() {
    let builder = supabase.from(this.table).select('*');
    // If this is a subcollection with caseId, filter automatically
    if (this._opts.caseId) builder = builder.eq('case_id', this._opts.caseId);
    for (const w of this._wheres) {
      switch (w.op) {
        case '==': builder = builder.eq(w.field, w.val); break;
        case '!=': builder = builder.neq(w.field, w.val); break;
        case '>': builder = builder.gt(w.field, w.val); break;
        case '>=': builder = builder.gte(w.field, w.val); break;
        case '<': builder = builder.lt(w.field, w.val); break;
        case '<=': builder = builder.lte(w.field, w.val); break;
        default: builder = builder.eq(w.field, w.val);
      }
    }
    if (this._order) builder = builder.order(this._order.field, { ascending: this._order.dir === 'asc' });
    if (this._limit) builder = builder.limit(this._limit);
    const { data, error } = await builder;
    if (error) throw error;
    return new QuerySnapshot(data || []);
  }
}

function batch() {
  const ops = [];
  return {
    update(ref, payload) { ops.push({ type: 'update', ref, payload }); },
    set(ref, payload) { ops.push({ type: 'set', ref, payload }); },
    async commit() {
      for (const op of ops) {
        if (op.type === 'update') {
          await supabase.from(op.ref.table).update(op.payload).eq('id', op.ref.id);
        } else if (op.type === 'set') {
          const row = { ...op.payload, id: op.ref.id };
          await supabase.from(op.ref.table).upsert([row], { onConflict: ['id'] });
        }
      }
    }
  };
}

module.exports = {
  collection: (name) => new CollectionRef(name),
  batch,
};

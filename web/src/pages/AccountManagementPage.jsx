import { useState, useEffect } from "react";
import { getAuth, createUserWithEmailAndPassword, updatePassword } from "firebase/auth";
import { getFirestore, collection, getDocs, onSnapshot } from "firebase/firestore";
import { app } from "../firebase"; // Make sure your firebase.js exports initialized app
import API_BASE_URL from "../config/api";

const auth = getAuth(app);
const db = getFirestore(app);

const ROLE_LABELS  = { admin: "Admin", officer: "Officer" };
const ROLE_CLASSES = { admin: "badge-admin", officer: "badge-officer" };
const STATUS_CLASS = { active: "badge-active", inactive: "badge-inactive", suspended: "badge-suspended" };
const AVATAR_COLOR = { pink: "av-pink", blue: "av-blue", green: "av-green", purple: "av-purple", amber: "av-amber" };
const EMPTY_FORM = { fullName: "", username: "", role: "", password: "", confirmPassword: "" };

function toTitleCaseName(input) {
  const normalized = (input || "").trim().replace(/\s+/g, " ");
  if (!normalized) return "";

  // Title Case each word: "dela" -> "Dela", "CRUZ" -> "Cruz"
  return normalized
    .split(" ")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function splitFullName(fullName) {
  const titleCased = toTitleCaseName(fullName);
  const normalized = titleCased.trim().replace(/\s+/g, " ");
  const parts = normalized.split(" ").filter(Boolean);

  if (parts.length === 0) return { firstName: "", lastName: "", fullName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "", fullName: normalized };

  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(" ");
  return { firstName, lastName, fullName: normalized };
}




// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCards({ accounts }) {
  const total     = accounts.length;
  const officers  = accounts.filter(a => a.role === "officer").length;
  const suspended = accounts.filter(a => a.status === "suspended").length;

  return (
    <div className="stat-grid">
      <div className="stat-card pink">
        <div className="stat-label">Total Staff</div>
        <div className="stat-value" style={{ color: "var(--primary)" }}>{total}</div>
        <div className="stat-change">Active staff members</div>
      </div>
      <div className="stat-card blue">
        <div className="stat-label">Officers</div>
        <div className="stat-value" style={{ color: "var(--info)" }}>{officers}</div>
        <div className="stat-change">VAWC &amp; barangay</div>
      </div>
      <div className="stat-card amber">
        <div className="stat-label">Suspended</div>
        <div className="stat-value" style={{ color: "var(--warn)" }}>{suspended}</div>
        <div className="stat-change">Pending review</div>
      </div>
    </div>
  );
}

function formatLastLogin(timestamp) {
  if (!timestamp) return "—";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    year: "numeric",
  }).format(date);
}

function AccountRow({ account, onEdit, onSuspend, onActivate }) {
  const isDisabled = account.status !== "active";
  const fullName = account.fullName || `${account.firstName || ""} ${account.lastName || ""}`.trim();
  const parts = fullName.split(" ").filter(Boolean);
  const initials = parts.length > 0
    ? (parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : "")).toUpperCase()
    : "";

  return (
    <tr>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            className={`staff-avatar ${AVATAR_COLOR[account.color] || "av-pink"}`}
            style={{ opacity: isDisabled ? 0.45 : 1 }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: isDisabled ? "var(--text-muted)" : "var(--text)" }}>
              {fullName}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
              {account.username || account.email}
            </div>
          </div>
        </div>
      </td>
      <td><span className={`badge ${ROLE_CLASSES[account.role]}`}>{ROLE_LABELS[account.role]}</span></td>
      <td><span className={`badge ${STATUS_CLASS[account.status]}`}>{account.status.charAt(0).toUpperCase() + account.status.slice(1)}</span></td>
      <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{formatLastLogin(account.lastLogin)}</td>
      <td style={{ fontSize: 12 }}>{account.cases !== null ? account.cases : "—"}</td>
      <td>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(account)}>Edit</button>
        </div>
      </td>
    </tr>
  );
}

// ─── Create/Edit Modals ─────────────────────────────────────────────────────────
function CreateModal({ onClose, refreshAccounts }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const errors = validatePasswordStrength(form.password);
    if (errors.length > 0) {
      alert("Password must have " + errors.join(", ") + ".");
      return;
    }

    try {
      const nameData = splitFullName(form.fullName);
      const res = await fetch(`${API_BASE_URL}/create-staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nameData,
          fullName: nameData.fullName,
          username: form.username,
          password: form.password,
          role: form.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create staff");
      if (!data.uid) throw new Error("UID missing from server response");

      refreshAccounts();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create staff account: " + err.message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Add Staff Account</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Full name</label>
            <input
              className="form-input"
              placeholder="Enter full name"
              value={form.fullName}
onChange={e => set("fullName", toTitleCaseName(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="Enter Username"
              value={form.username}
              onChange={e => set("username", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select className="form-select" value={form.role} onChange={e => set("role", e.target.value)}>
              <option value="">Select a role</option>
              <option value="admin">Admin</option>
              <option value="officer">Officer</option>
            </select>
          </div>
          <div className="form-group">
            <label>Temporary password</label>
            <input className="form-input" type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => set("password", e.target.value)} />
            <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>Staff must change this on first login</p>
          </div>
          <div className="form-group">
            <label>Confirm password</label>
            <input className="form-input" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} />
          </div>
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Password must have:</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
              • at least 8 characters<br />
              • one uppercase letter<br />
              • one lowercase letter<br />
              • one number<br />
              • one special character
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>Create Account</button>
        </div>
      </div>
    </div>
  );
}

// ─── EditModal and ConfirmModal remain the same, using doc(db, "staff", account.id) ───

function validatePasswordStrength(password) {
  const trimmed = String(password || "");
  const failures = [];

  if (trimmed.length < 8) failures.push("at least 8 characters");
  if (!/[A-Z]/.test(trimmed)) failures.push("one uppercase letter");
  if (!/[a-z]/.test(trimmed)) failures.push("one lowercase letter");
  if (!/\d/.test(trimmed)) failures.push("one number");
  if (!/[^A-Za-z0-9]/.test(trimmed)) failures.push("one special character");

  return failures;
}

function ChangePasswordModal({ account, onClose, refreshAccounts }) {
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const setPassword = (k, v) => setPasswordForm(f => ({ ...f, [k]: v }));

  const handleChangePassword = async () => {
    if (!passwordForm.password || !passwordForm.confirmPassword) {
      alert("Please enter and confirm a new password.");
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const errors = validatePasswordStrength(passwordForm.password);
    if (errors.length > 0) {
      alert("Password must have " + errors.join(", ") + ".");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/change-staff-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: account.id,
          password: passwordForm.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      setPasswordForm({ password: "", confirmPassword: "" });
      refreshAccounts();
      alert("Password changed successfully.");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update password: " + err.message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 460 }}>
        <div className="modal-header">
          <span className="modal-title">Change Password</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>New password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Min. 6 characters"
              value={passwordForm.password}
              onChange={e => setPassword("password", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Confirm password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Repeat new password"
              value={passwordForm.confirmPassword}
              onChange={e => setPassword("confirmPassword", e.target.value)}
            />
          </div>
          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Password must have:</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
              • at least 8 characters<br />
              • one uppercase letter<br />
              • one lowercase letter<br />
              • one number<br />
              • one special character
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleChangePassword}>Update Password</button>
        </div>
      </div>
    </div>
  );
}

// ─── EditModal ───────────────────────────────────────────────────────────────
function EditModal({ account, onClose, refreshAccounts }) {
  const [form, setForm] = useState({
    role: account.role,
    status: account.status,
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/update-staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: account.id,
          role: form.role,
          status: form.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update staff");

      refreshAccounts();
      alert("Staff account updated successfully.");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save changes: " + err.message);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Edit Staff Account</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <select className="form-select" value={form.role} onChange={e => set("role", e.target.value)}>
                <option value="">Select a role</option>
                <option value="admin">Admin</option>
                <option value="officer">Officer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-select" value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="">Select a status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <button className="btn btn-secondary" onClick={() => setShowChangePassword(true)}>Change Password</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
          </div>
        </div>
      </div>

      {showChangePassword && (
        <ChangePasswordModal account={account} onClose={() => setShowChangePassword(false)} refreshAccounts={refreshAccounts} />
      )}
    </div>
  );
}


function ConfirmModal({ type, account, onClose, refreshAccounts }) {
  const isSuspend = type === "suspend";
  const handleConfirm = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/update-staff-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: account.id,
          status: isSuspend ? "suspended" : "active",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      refreshAccounts();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update staff status. " + err.message);
    }
  };
  const name = `${account.firstName} ${account.lastName}`;

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 380 }}>
        <div className="modal-body" style={{ padding: "32px 24px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: isSuspend ? "var(--sos-light)" : "var(--safe-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            {isSuspend ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C62828" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00695C" strokeWidth="2" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
            {isSuspend ? "Suspend staff?" : "Activate staff?"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {isSuspend ? `You are about to suspend ${name}.` : `You are about to restore access for ${name}.`}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className={isSuspend ? "btn btn-danger" : "btn btn-primary"} onClick={handleConfirm}>
            {isSuspend ? "Suspend Account" : (account.status === "suspended" ? "Restore Account" : "Activate Account")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AccountManagementPage() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(null);

  const fetchAccounts = async () => {
    const snapshot = await getDocs(collection(db, "staff"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAccounts(data);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "staff"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAccounts(data);
    }, (error) => {
      console.error("Failed to subscribe to staff accounts:", error);
      fetchAccounts();
    });

    return () => unsubscribe();
  }, []);

  const filtered = accounts.filter(a => {
    const fullName = (a.fullName || `${a.firstName || ""} ${a.lastName || ""}`).toLowerCase();
    const matchSearch = !search || fullName.includes(search.toLowerCase()) || (a.username || a.email || "").toLowerCase().includes(search.toLowerCase());
    const matchTab = tabFilter === "all" ? true : tabFilter === "inactive" ? a.status === "inactive" : a.role === tabFilter;
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchTab && matchStatus;
  });

  const TABS = [
    { id: "all", label: "All" },
    { id: "admin", label: "Admin" },
    { id: "officer", label: "Officers" },
    { id: "inactive", label: "Inactive" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: -0.5 }}>Staff Management</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>Manage staff accounts, roles, and access for Barangay 123</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ type: "create" })}>+ Add Staff Account</button>
      </div>

      {/* Stat cards */}
      <StatCards accounts={accounts} />

      {/* Table card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Staff Accounts</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{accounts.length} total staff</span>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, padding: "0 18px", borderBottom: "0.5px solid var(--border)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTabFilter(t.id)} style={{
              padding: "10px 14px", fontSize: 12, fontWeight: 600,
              color: tabFilter === t.id ? "var(--primary)" : "var(--text-muted)",
              border: "none", background: "transparent", cursor: "pointer",
              borderBottom: tabFilter === t.id ? "2px solid var(--primary)" : "2px solid transparent",
              marginBottom: -0.5, transition: "all .15s", fontFamily: "inherit",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Search + filter */}
        <div style={{ display: "flex", gap: 8, padding: "6px 16px", borderBottom: "0.5px solid var(--border)", alignItems: "center" }}>
          <input
            className="form-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 280, height: 34, paddingTop: 7, paddingBottom: 7 }}
          />
          <select
            className="form-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: 140, height: 34 }}
          >

            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Table */}
        {filtered.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last login</th>
                <th>Cases assigned</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <AccountRow
                  key={a.id}
                  account={a}
                  onEdit={acc => setModal({ type: "edit", account: acc })}
                  onSuspend={acc => setModal({ type: "suspend", account: acc })}
                  onActivate={acc => setModal({ type: "activate", account: acc })}
                />
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>No staff found</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Try adjusting your search or filter.</div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "create"  && <CreateModal onClose={() => setModal(null)} refreshAccounts={fetchAccounts} />}
      {modal?.type === "edit"    && <EditModal account={modal.account} onClose={() => setModal(null)} refreshAccounts={fetchAccounts} />}
      {(modal?.type === "suspend" || modal?.type === "activate") && <ConfirmModal type={modal.type} account={modal.account} onClose={() => setModal(null)} refreshAccounts={fetchAccounts} />}
    </div>
  );
}
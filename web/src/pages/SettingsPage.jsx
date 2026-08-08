import { useState } from "react";
import { useAuth } from "../AuthContext";
import API_BASE_URL from "../config/api";

function ChangePasswordModal({ uid, onClose }) {
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const updateField = (key, value) => setPasswordForm(f => ({ ...f, [key]: value }));

  const handleChangePassword = async () => {
    if (!passwordForm.password || !passwordForm.confirmPassword) {
      alert("Please enter and confirm a new password.");
      return;
    }

    if (passwordForm.password !== passwordForm.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (passwordForm.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/change-staff-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          password: passwordForm.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      setPasswordForm({ password: "", confirmPassword: "" });
      onClose();
      alert("Password changed successfully.");
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
              onChange={e => updateField("password", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Confirm password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Repeat new password"
              value={passwordForm.confirmPassword}
              onChange={e => updateField("confirmPassword", e.target.value)}
            />
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

export default function SettingsPage() {
  const { user } = useAuth();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: -0.5 }}>Settings</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3 }}>
            Manage your account profile and security.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Account Settings</span>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>
                {user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Officer"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                username: {user?.username || user?.email || "Staff Account"}
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => setPasswordModalVisible(true)}>
              Change Password
            </button>
          </div>
        </div>
      </div>

      {passwordModalVisible && (
        <ChangePasswordModal uid={user?.uid} onClose={() => setPasswordModalVisible(false)} />
      )}
    </div>
  );
}

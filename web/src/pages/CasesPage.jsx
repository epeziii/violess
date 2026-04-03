// CasesPage.jsx
import { useState } from "react";
import Badge from "./Badge";

export default function CasesPage() {
  const [activeCase, setActiveCase] = useState("VIO-001");
  const [status, setStatus] = useState("reviewing");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState([
    { by: "Officer Reyes", time: "Feb 12, 11:30 AM", text: "Reviewed initial report. Victim confirmed details. Scheduled follow-up interview for Feb 14." },
    { by: "Social Worker Ana", time: "Feb 13, 9:00 AM", text: "Conducted preliminary assessment. Recommending counseling referral." },
  ]);

  const addNote = () => {
    if (!note.trim()) return;
    setNotes(n => [...n, { by: "Officer Reyes", time: "Just now", text: note }]);
    setNote("");
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>Case Management</h1>
      </div>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Case detail */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Case #VIO-001 — Harassment</span>
              <Badge status="reviewing" />
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid-2">
                <div><div className="form-label">Reporter</div><div style={{ fontSize: 13, fontWeight: 600 }}>Anonymous</div></div>
                <div><div className="form-label">Date Filed</div><div style={{ fontSize: 13, fontWeight: 600 }}>Feb 12, 2025</div></div>
                <div><div className="form-label">Location</div><div style={{ fontSize: 13, fontWeight: 600 }}>Brgy. 123, Manila</div></div>
                <div><div className="form-label">Assigned To</div><div style={{ fontSize: 13, fontWeight: 600 }}>Officer Reyes</div></div>
              </div>
              <div>
                <div className="form-label">Description</div>
                <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 12, color: 'var(--text)', lineHeight: 1.6, border: '0.5px solid var(--border)' }}>
                  Victim reports repeated verbal harassment near the market area. Incident occurred over 3 weeks. Victim has evidence (photos, messages).
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm">Update Status</button>
                <button className="btn btn-secondary btn-sm">Assign Officer</button>
                <button className="btn btn-ghost btn-sm">Refer Case</button>
              </div>
            </div>
          </div>

          {/* Case Notes */}
          
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Update status */}
          <div className="card">
            <div className="card-header"><span className="card-title">Update Case</span></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Case Status</label>
                <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="reviewing">Under Review</option>
                  <option value="referred">Referred</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Case Closed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assign Officer</label>
                <select className="form-select">
                  <option>Officer Reyes (assigned)</option>
                  <option>Social Worker Ana</option>
                  <option>Counselor Cruz</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <select className="form-select">
                  <option>Normal</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }}>Save Changes</button>
            </div>
          </div>

          {/* Timeline */}
          
        </div>
      </div>
    </div>
  );
}
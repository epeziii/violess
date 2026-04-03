// ReferralPage.jsx
import { useState } from "react";
import Badge from "./Badge";

export default function ReferralPage() {
  const [referrals, setReferrals] = useState([
    { id: '#VIO-001', to: 'Social Worker Ana', status: 'reviewing', date: 'Feb 13' },
    { id: '#VIO-002', to: 'PNP Station 6', status: 'urgent', date: 'Feb 13' },
    { id: '#VIO-003', to: 'Guidance Counselor', status: 'referred', date: 'Feb 14' },
    { id: '#VIO-005', to: 'DSWD Office', status: 'resolved', date: 'Feb 11' },
  ]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>Referral Tracking</h1>
      </div>

      {/* Workflow */}
      

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Active Referrals</span></div>
          <table className="data-table">
            <thead><tr><th>Case</th><th>Referred To</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {referrals.map(r => (
                <tr key={r.id}>
                  <td className="bold">{r.id}</td>
                  <td>{r.to}</td>
                  <td><Badge status={r.status} /></td>
                  <td>{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">New Referral</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Case</label>
              <select className="form-select">
                <option>#VIO-001 — Harassment</option>
                <option>#VIO-002 — Domestic Abuse</option>
                <option>#VIO-004 — Threats</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Refer to</label>
              <select className="form-select">
                <option>Social Worker</option>
                <option>PNP Station</option>
                <option>DSWD</option>
                <option>Hospital / Medical</option>
                <option>Counselor</option>
                <option>Legal Aid</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Reason for Referral</label>
              <textarea className="form-textarea" placeholder="Explain why this case is being referred..." />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }}>Create Referral</button>
          </div>
        </div>
      </div>
    </div>
  );
}
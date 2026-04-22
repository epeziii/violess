// DashboardPage.jsx
import { useState, useEffect } from "react";
import Badge from "./Badge";
import { db } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

const SAMPLE_CASES = [
  { id: "#VIO-001", type: "Harassment", reporter: "Anonymous", location: "Brgy. 123", status: "reviewing", date: "Feb 12" },
  { id: "#VIO-002", type: "Domestic Abuse", reporter: "Maria D.", location: "Brgy. 456", status: "urgent", date: "Feb 13" },
  { id: "#VIO-003", type: "Bullying", reporter: "Anonymous", location: "School Zone", status: "referred", date: "Feb 14" },
  { id: "#VIO-004", type: "Threats", reporter: "Ana L.", location: "Brgy. 123", status: "pending", date: "Feb 15" },
  { id: "#VIO-005", type: "Harassment", reporter: "Anonymous", location: "Market Area", status: "resolved", date: "Feb 10" },
];

const getStatusFromString = (status) => {
  if (status === "pending") return "pending";
  if (status === "urgent") return "urgent";
  if (status === "resolved") return "resolved";
  if (status === "reviewing") return "reviewing";
  if (status === "referred") return "referred";
  return "pending";
};

const formatDate = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : date.toDate?.();
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function DashboardPage({ onNavigate }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Real-time listener for reports collection
      const q = query(
        collection(db, "reports"),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reportsData = snapshot.docs.map((doc) => ({
          id: doc.data().caseId,
          type: doc.data().incidentType,
          reporter: doc.data().reporterName,
          location: doc.data().location || "N/A",
          status: getStatusFromString(doc.data().status),
          date: formatDate(doc.data().createdAt),
        }));
        setReports(reportsData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports(SAMPLE_CASES);
      setLoading(false);
    }
  }, []);

  const displayReports = loading ? SAMPLE_CASES : (reports.length > 0 ? reports : SAMPLE_CASES);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Monday, February 17, 2025 · Brgy. 123, Manila</p>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {[
          { label: 'Total Reports', value: '47', change: '+5 this week', cls: 'up', variant: 'pink' },
          { label: 'Urgent Cases', value: '8', change: 'Needs attention', cls: 'up', variant: 'red' },
          { label: 'Active Cases', value: '19', change: 'In progress', cls: 'neutral', variant: 'blue' },
          { label: 'Resolved', value: '20', change: '+3 this week', cls: 'ok', variant: 'green' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.variant}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.variant === 'pink' ? 'var(--primary)' : s.variant === 'red' ? 'var(--sos)' : s.variant === 'blue' ? 'var(--info)' : 'var(--safe)' }}>
              {s.value}
            </div>
            <div className={`stat-change ${s.cls}`}>{s.change}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Recent reports table */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <span className="card-title">Recent Reports</span>
            <button className="card-action" onClick={() => onNavigate("cases")}>View all →</button>
          </div>
          <div style={{ padding: '10px 16px 0', display: 'flex', gap: 8 }}>
            <input className="form-input" placeholder="Search cases..." style={{ maxWidth: 260 }} />
            <select className="form-select" style={{ width: 140 }}>
              <option>All status</option>
              <option>Pending</option>
              <option>Urgent</option>
              <option>Resolved</option>
            </select>
          </div>
          <table className="data-table" style={{ margin: 0 }}>
            <thead>
              <tr><th>Case ID</th><th>Type</th><th>Reporter</th><th>Location</th><th>Status</th><th>Date</th><th>Action</th></tr>
            </thead>
            <tbody>
              {displayReports.map(c => (
                <tr key={c.id}>
                  <td className="bold">{c.id}</td>
                  <td>{c.type}</td>
                  <td>{c.reporter}</td>
                  <td>{c.location}</td>
                  <td><Badge status={c.status} /></td>
                  <td>{c.date}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => onNavigate("cases")}>Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Cases by Type</span></div>
          <div className="card-body">
            <div className="bar-chart">
              {[
                { label: 'Domestic abuse', count: 15, pct: 78, color: 'var(--primary)' },
                { label: 'Harassment', count: 12, pct: 62, color: '#7B2D8B' },
                { label: 'Bullying', count: 8, pct: 41, color: 'var(--info)' },
                { label: 'Threats', count: 6, pct: 31, color: 'var(--warn)' },
                { label: 'Other', count: 3, pct: 15, color: 'var(--text-muted)' },
              ].map(b => (
                <div key={b.label} className="bar-row">
                  <span className="bar-label">{b.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${b.pct}%`, background: b.color }}>{b.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Age Group Affected</span></div>
          <div className="card-body" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="42" fill="none" stroke="#F8F0F5" strokeWidth="18"/>
              <circle cx="55" cy="55" r="42" fill="none" stroke="var(--primary)" strokeWidth="18" strokeDasharray="99 165" strokeDashoffset="0"/>
              <circle cx="55" cy="55" r="42" fill="none" stroke="#6A1B9A" strokeWidth="18" strokeDasharray="56 165" strokeDashoffset="-99"/>
              <circle cx="55" cy="55" r="42" fill="none" stroke="var(--info)" strokeWidth="18" strokeDasharray="42 165" strokeDashoffset="-155"/>
              <text x="55" y="59" textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--text)">47</text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { color: 'var(--primary)', label: 'Women 18–35', pct: '38%' },
                { color: '#6A1B9A', label: 'Youth 13–17', pct: '22%' },
                { color: 'var(--info)', label: 'Children <13', pct: '16%' },
                { color: '#F8F0F5', label: 'Other', pct: '24%' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0, border: l.color === '#F8F0F5' ? '1px solid #DDD' : 'none' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{l.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginLeft: 'auto' }}>{l.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
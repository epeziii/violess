// DashboardPage.jsx
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, onSnapshot } from "firebase/firestore";

export default function DashboardPage({ onNavigate }) {
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    active: 0,
    resolved: 0
  });

  // Fetch statistics from all reports
  useEffect(() => {
    try {
      const q = query(collection(db, "reports"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        let totalCount = 0;
        let urgentCount = 0;
        let activeCount = 0;
        let resolvedCount = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const status = data.status;
          const priorityLevel = data.priorityLevel;

          totalCount++;

          if (status === "resolved") {
            resolvedCount++;
} else if (priorityLevel === "urgent") {
            urgentCount++;
          } else if (status === "pending" || status === "reviewing" || status === "referred") {
            activeCount++;
          }
        });

        setStats({
          total: totalCount,
          urgent: urgentCount,
          active: activeCount,
          resolved: resolvedCount
        });
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Monday, February 17, 2025 · Brgy. 123, Manila</p>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {[
          { label: 'Total Reports', value: stats.total.toString(), change: 'All reports', cls: 'neutral', variant: 'pink' },
          { label: 'Urgent Cases', value: stats.urgent.toString(), change: 'Needs attention', cls: 'up', variant: 'red' },
          { label: 'Active Cases', value: stats.active.toString(), change: 'In progress', cls: 'neutral', variant: 'blue' },
          { label: 'Resolved', value: stats.resolved.toString(), change: 'Completed', cls: 'ok', variant: 'green' },
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
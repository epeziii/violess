// AnalyticsPage.jsx
export default function AnalyticsPage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>Analytics</h1>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Avg Response Time', value: '2.4h', change: 'Target: under 4h', cls: 'ok', variant: 'green' },
          { label: 'Cases This Month', value: '18', change: '+6 vs last month', cls: 'up', variant: 'pink' },
          { label: 'Resolution Rate', value: '74%', change: 'Up 5%', cls: 'ok', variant: 'blue' },
          { label: 'Pending Referrals', value: '6', change: 'Needs follow-up', cls: 'neutral', variant: 'red' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.variant}`}>
            <div className="stat-label">{s.label}</div>
            <div
              className="stat-value"
              style={{
                color:
                  s.variant === 'pink' ? 'var(--primary)' :
                  s.variant === 'red' ? 'var(--sos)' :
                  s.variant === 'blue' ? 'var(--info)' :
                  'var(--safe)'
              }}
            >
              {s.value}
            </div>
            <div className={`stat-change ${s.cls}`}>{s.change}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><span className="card-title">Monthly Cases (2025)</span></div>
          <div className="card-body">
            <div className="bar-chart">
              {[
                ['January', 12, 60],
                ['February', 18, 90],
                ['March', 7, 35],
                ['April', 4, 20]
              ].map(([month, count, pct]) => (
                <div key={month} className="bar-row">
                  <span className="bar-label">{month}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%`, background: 'var(--primary)' }}>{count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Most Common Abuse Type</span></div>
          <div className="card-body">
            <div className="bar-chart">
              {[
                ['Domestic', 15, 80, 'var(--primary)'],
                ['Harassment', 12, 63, '#7B2D8B'],
                ['Bullying', 8, 42, 'var(--info)'],
                ['Threats', 6, 31, 'var(--warn)'],
                ['Other', 3, 15, 'var(--text-muted)']
              ].map(([label, count, pct, color]) => (
                <div key={label} className="bar-row">
                  <span className="bar-label">{label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%`, background: color }}>{count}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Timeline Overview */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header"><span className="card-title">Resolution Timeline Overview</span></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              ['1.2d', 'Avg. first response', 'var(--primary)'],
              ['4.5d', 'Avg. referral time', 'var(--info)'],
              ['12d', 'Avg. case resolution', 'var(--safe)'],
              ['3', 'Reopen requests', 'var(--warn)']
            ].map(([value, label, color]) => (
              <div key={label} style={{ textAlign: 'center', flex: 1, minWidth: 80 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
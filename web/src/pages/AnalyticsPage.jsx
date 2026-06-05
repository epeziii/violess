// AnalyticsPage.jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
          <div className="card-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { month: 'January', cases: 12 },
                  { month: 'February', cases: 18 },
                  { month: 'March', cases: 7 },
                  { month: 'April', cases: 4 }
                ]}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px' }} />
                <Bar dataKey="cases" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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

      {/* MOVED FROM DASHBOARD: Charts */}
      <div className="grid-2" style={{ marginTop: 16 }}>
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

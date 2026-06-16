// AnalyticsPage.jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import API_BASE_URL from '../config/api';

export default function AnalyticsPage() {
  const [ageGroupData, setAgeGroupData] = useState([]);
  const [loadingAgeGroup, setLoadingAgeGroup] = useState(true);

  const [monthlyCasesData, setMonthlyCasesData] = useState([]);
  const [loadingMonthlyCases, setLoadingMonthlyCases] = useState(true);

  const currentYear = new Date().getFullYear();


  useEffect(() => {
    let cancelled = false;

    async function loadAgeGroup() {
      setLoadingAgeGroup(true);
      try {
        const res = await fetch(`${API_BASE_URL}/analytics/age-group-affected`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'omit',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          if (Array.isArray(json?.data)) {
            setAgeGroupData(json.data);
          } else {
            console.warn('Unexpected analytics response shape for age-group-affected:', json);
            setAgeGroupData([]);
          }
        }

      } catch (e) {
        console.error('Failed to load Age Group Affected analytics:', e);
        if (!cancelled) setAgeGroupData([]);
      } finally {
        if (!cancelled) setLoadingAgeGroup(false);
      }
    }

    loadAgeGroup();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMonthlyCases() {
      setLoadingMonthlyCases(true);
      try {
        const res = await fetch(`${API_BASE_URL}/analytics/monthly-cases?year=${currentYear}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'omit',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const apiData = Array.isArray(json?.data) ? json.data : [];

        // Always render 12 months in order.
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const map = new Map(apiData.map((d) => [d.month, Number(d.cases) || 0]));
        const normalized = monthOrder.map((m) => ({ month: m, cases: map.get(m) ?? 0 }));

        if (!cancelled) setMonthlyCasesData(normalized);
      } catch (e) {
        console.error('Failed to load Monthly Cases analytics:', e);
        if (!cancelled) {
          const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          setMonthlyCasesData(monthOrder.map((m) => ({ month: m, cases: 0 })));
        }
      } finally {
        if (!cancelled) setLoadingMonthlyCases(false);
      }
    }

    loadMonthlyCases();

    return () => {
      cancelled = true;
    };
  }, [currentYear]);


  const donut = useMemo(() => {
    const fallback = [

      { key: 'women_18_35', label: 'Women 18–35', color: 'var(--primary)', pct: 38 },
      { key: 'youth_13_17', label: 'Youth 13–17', color: '#6A1B9A', pct: 22 },
      { key: 'children_lt_13', label: 'Children <13', color: 'var(--info)', pct: 16 },
      { key: 'other', label: 'Other', color: '#F8F0F5', pct: 24 },
    ];

    const data = ageGroupData;
    if (!data) return fallback;
    if (data.length === 0) return fallback;

    // Backend returns pct that already sums to 100 (computed from Firestore counts).
    // Still guard against invalid sums.
    const withPct = data.map((d) => ({
      key: d.key || d.label,

      label: d.label,
      color: d.color,
      pct: Number(d.pct) || 0,
    }));

    const sum = withPct.reduce((a, b) => a + b.pct, 0);
    if (sum <= 0) return fallback;

    // Normalize to 100 for rendering correctness.
    return withPct.map((d) => ({ ...d, pct: (d.pct / sum) * 100 }));
  }, [ageGroupData]);

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
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.variant}`}>
            <div className="stat-label">{s.label}</div>
            <div
              className="stat-value"
              style={{
                color:
                  s.variant === 'pink'
                    ? 'var(--primary)'
                    : s.variant === 'red'
                      ? 'var(--sos)'
                      : s.variant === 'blue'
                        ? 'var(--info)'
                        : 'var(--safe)',
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
          <div className="card-header">
            <span className="card-title">Monthly Cases ({new Date().getFullYear()})</span>
          </div>
          <div className="card-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyCasesData}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" />
                <YAxis
                  stroke="var(--text-muted)"
                  tickFormatter={(value) => {
                    const n = Number(value);
                    if (!Number.isFinite(n)) return value;
                    // Avoid truncating fractional ticks into the same label (e.g., 0.4 -> 0, 0.8 -> 0)
                    return Number.isInteger(n) ? String(n) : String(Math.round(n));
                  }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px' }}
                  formatter={(value) => {
                    const n = Number(value);
                    return Number.isFinite(n) ? Math.trunc(n) : value;
                  }}
                />
                <Bar dataKey="cases" fill="var(--primary)" radius={[8, 8, 0, 0]} />

              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


        <div className="card">
          <div className="card-header">
            <span className="card-title">Most Common Abuse Type</span>
          </div>
          <div className="card-body">
            <div className="bar-chart">
              {[
                ['Domestic', 15, 80, 'var(--primary)'],
                ['Harassment', 12, 63, '#7B2D8B'],
                ['Bullying', 8, 42, 'var(--info)'],
                ['Threats', 6, 31, 'var(--warn)'],
                ['Other', 3, 15, 'var(--text-muted)'],
              ].map(([label, _count, pct, color]) => (
                <div key={label} className="bar-row">
                  <span className="bar-label">{label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%`, background: color }}>
                      {_count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Timeline Overview */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <span className="card-title">Resolution Timeline Overview</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              ['1.2d', 'Avg. first response', 'var(--primary)'],
              ['4.5d', 'Avg. referral time', 'var(--info)'],
              ['12d', 'Avg. case resolution', 'var(--safe)'],
              ['3', 'Reopen requests', 'var(--warn)'],
            ].map(([value, label]) => {
              const color = ['1.2d', '4.5d', '12d', '3'].includes(value)
                ? label === 'Avg. first response'
                  ? 'var(--primary)'
                  : label === 'Avg. referral time'
                    ? 'var(--info)'
                    : label === 'Avg. case resolution'
                      ? 'var(--safe)'
                      : 'var(--warn)'
                : 'var(--text)';
              return (
                <div key={label} style={{ textAlign: 'center', flex: 1, minWidth: 80 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MOVED FROM DASHBOARD: Charts */}
      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Cases by Type</span>
          </div>
          <div className="card-body">
            <div className="bar-chart">
              {[
                { label: 'Domestic abuse', count: 15, pct: 78, color: 'var(--primary)' },
                { label: 'Harassment', count: 12, pct: 62, color: '#7B2D8B' },
                { label: 'Bullying', count: 8, pct: 41, color: 'var(--info)' },
                { label: 'Threats', count: 6, pct: 31, color: 'var(--warn)' },
                { label: 'Other', count: 3, pct: 15, color: 'var(--text-muted)' },
              ].map((b) => (
                <div key={b.label} className="bar-row">
                  <span className="bar-label">{b.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${b.pct}%`, background: b.color }}>
                      {b.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Age Group Affected</span>
          </div>
          <div className="card-body" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 120, height: 120 }}>
              {loadingAgeGroup ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: '120px', textAlign: 'center' }}>Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donut.map((d) => ({ name: d.label, value: d.pct, color: d.color }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={60}
                      paddingAngle={0}
                      isAnimationActive={false}
                    >
                      {donut.map((d) => (
                        <Cell key={d.key} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {donut.map((l) => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: l.color,
                      flexShrink: 0,
                      border: l.color === '#F8F0F5' ? '1px solid #DDD' : 'none',
                    }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{l.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginLeft: 'auto' }}>{`${Math.round(l.pct)}%`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


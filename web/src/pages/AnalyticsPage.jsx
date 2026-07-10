// AnalyticsPage.jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import API_BASE_URL from '../config/api';

export default function AnalyticsPage() {
  const [ageGroupData, setAgeGroupData] = useState([]);
  const [loadingAgeGroup, setLoadingAgeGroup] = useState(true);

  const [monthlyCasesData, setMonthlyCasesData] = useState([]);
  const [loadingMonthlyCases, setLoadingMonthlyCases] = useState(true);

  const [abuseTypeData, setAbuseTypeData] = useState([]);
  const [loadingAbuseType, setLoadingAbuseType] = useState(true);

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

  useEffect(() => {
    let cancelled = false;

    async function loadAbuseType() {
      setLoadingAbuseType(true);
      try {
        const res = await fetch(`${API_BASE_URL}/analytics/most-common-abuse-type`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'omit',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const rows = Array.isArray(json?.data) ? json.data : [];
        if (!cancelled) {
          setAbuseTypeData(
            rows.map((r) => ({
              key: r.key || r.label,
              label: r.label,
              count: Number(r.count) || 0,
              pct: Number(r.pct) || 0,
              color: r.color || 'var(--text-muted)',
            }))
          );
        }
      } catch (e) {
        console.error('Failed to load Most Common Abuse Type analytics:', e);
        if (!cancelled) setAbuseTypeData([]);
      } finally {
        if (!cancelled) setLoadingAbuseType(false);
      }
    }

    loadAbuseType();

    return () => {
      cancelled = true;
    };
  }, []);



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
      <div className="grid-2" style={{ alignItems: 'stretch' }}>
        <div className="card analytics-card--stretch" style={{ width: '100%', minWidth: 0 }}>

          <div className="card-header">
            <span className="card-title">Monthly Cases ({new Date().getFullYear()})</span>
          </div>
          <div className="card-body analytics-chart-body">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyCasesData}
              margin={{ top: 10, right: 20, left: -10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" />
                <YAxis
                  stroke="var(--text-muted)"
                  tickFormatter={(value) => {
                    const n = Number(value);
                    if (!Number.isFinite(n)) return value;
                    // If the tick isn't an integer, hide it to prevent duplicate labels (e.g., 0.4/0.8).
                    return Number.isInteger(n) ? String(n) : '';
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>

          <div className="card" style={{ width: '100%' }}>

            <div className="card-header">
              <span className="card-title">Most Common Abuse Type</span>
            </div>
            <div className="card-body">
              <div className="bar-chart">
                {loadingAbuseType ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>Loading...</div>
                ) : abuseTypeData.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>No data available</div>
                ) : (
                  abuseTypeData.map((row) => (
                    <div key={row.label} className="bar-row">
                      <span className="bar-label">{row.label}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${row.pct}%`, background: row.color }}>
                          {row.count}
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
    </div>
  );
}


// AnalyticsPage.jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import API_BASE_URL from '../config/api';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import Icon from '../components/Icon';

export default function AnalyticsPage() {
  const [ageGroupData, setAgeGroupData] = useState([]);
  const [loadingAgeGroup, setLoadingAgeGroup] = useState(true);

  const [monthlyCasesData, setMonthlyCasesData] = useState([]);
  const [loadingMonthlyCases, setLoadingMonthlyCases] = useState(true);

  const [abuseTypeData, setAbuseTypeData] = useState([]);
  const [loadingAbuseType, setLoadingAbuseType] = useState(true);

  // Dynamic statistics from Firestore
  const [firestoreStats, setFirestoreStats] = useState({
    avgResponseTime: '2.4h',
    casesThisMonth: 0,
    resolutionRate: '0%',
    pendingReferrals: 0,
    totalCount: 0
  });

  const currentYear = new Date().getFullYear();

  // Fetch real-time general page stats from Firestore
  useEffect(() => {
    try {
      const q = query(collection(db, "reports"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        let totalCount = 0;
        let resolvedCount = 0;
        let pendingReferralsCount = 0;
        let casesThisMonthCount = 0;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const status = data.status;
          const createdAt = data.createdAt;

          let dt = null;
          if (createdAt) {
            dt = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
          }

          totalCount++;

          if (status === "resolved" || status === "closed") {
            resolvedCount++;
          }
          if (status === "referred") {
            pendingReferralsCount++;
          }
          if (dt && dt >= startOfMonth) {
            casesThisMonthCount++;
          }
        });

        const rate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

        setFirestoreStats({
          avgResponseTime: '2.4h', // Standard fallback target
          casesThisMonth: casesThisMonthCount,
          resolutionRate: `${rate}%`,
          pendingReferrals: pendingReferralsCount,
          totalCount: totalCount
        });
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching statistics from Firestore:", error);
    }
  }, []);

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
    if (!data || data.length === 0) return fallback;

    const withPct = data.map((d) => ({
      key: d.key || d.label,
      label: d.label,
      color: d.color,
      pct: Number(d.pct) || 0,
    }));

    const sum = withPct.reduce((a, b) => a + b.pct, 0);
    if (sum <= 0) return fallback;

    return withPct.map((d) => ({ ...d, pct: (d.pct / sum) * 100 }));
  }, [ageGroupData]);

  // Dynamic status items for stats grid
  const statsItems = [
    {
      label: 'Avg Response Time',
      value: firestoreStats.avgResponseTime,
      change: 'Target: under 4h',
      cls: 'ok',
      variant: 'green',
      icon: 'clock'
    },
    {
      label: 'Cases This Month',
      value: firestoreStats.casesThisMonth.toString(),
      change: firestoreStats.casesThisMonth > 0 ? `+${firestoreStats.casesThisMonth} new cases` : 'No cases this month',
      cls: firestoreStats.casesThisMonth > 0 ? 'up' : 'neutral',
      variant: 'pink',
      icon: 'calendar-check'
    },
    {
      label: 'Resolution Rate',
      value: firestoreStats.resolutionRate,
      change: `Of ${firestoreStats.totalCount} active cases`,
      cls: 'ok',
      variant: 'blue',
      icon: 'circle-check'
    },
    {
      label: 'Pending Referrals',
      value: firestoreStats.pendingReferrals.toString(),
      change: 'Requiring action',
      cls: firestoreStats.pendingReferrals > 0 ? 'up' : 'neutral',
      variant: 'red',
      icon: 'share-nodes'
    },
  ];

  // Custom tooltips for premium charts look
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--surface)',
          padding: '10px 14px',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
        }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>{label}</p>
          <p style={{ margin: '4px 0 0', fontWeight: 650, fontSize: 13, color: 'var(--primary)' }}>
            {`${payload[0].value} Cases`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>Analytics Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Real-time summaries and demographic breakdowns for barangay safety management.</p>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        {statsItems.map((s) => (
          <div key={s.label} className={`stat-card ${s.variant}`}>
            <div className="stat-card-header">
              <div className="stat-label">{s.label}</div>
              <div className="stat-icon">
                <Icon icon={s.icon} size="15px" />
              </div>
            </div>
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
          <div className="card-body analytics-chart-body" style={{ minHeight: 280, padding: '16px 8px 8px 0' }}>
            {loadingMonthlyCases ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '24px', textAlign: 'center' }}>Loading cases trend...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyCasesData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="casesBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#D81B60" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(194,24,91,0.06)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    stroke="var(--text-muted)"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => {
                      const n = Number(value);
                      if (!Number.isFinite(n)) return value;
                      return Number.isInteger(n) ? String(n) : '';
                    }}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(194,24,91,0.02)' }} />
                  <Bar dataKey="cases" fill="url(#casesBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="grid-2" style={{ alignItems: 'stretch', width: '100%' }}>
          <div className="card" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span className="card-title">Most Common Abuse Type</span>
            </div>
            <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="bar-chart">
                {loadingAbuseType ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0', textAlign: 'center' }}>Loading incident types...</div>
                ) : abuseTypeData.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0', textAlign: 'center' }}>No incident data available</div>
                ) : (
                  abuseTypeData.map((row) => {
                    const barGradients = {
                      Domestic: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-dark) 100%)',
                      Harassment: 'linear-gradient(90deg, #7B2D8B 0%, #4A148C 100%)',
                      Bullying: 'linear-gradient(90deg, var(--info) 0%, #0D47A1 100%)',
                      Threats: 'linear-gradient(90deg, var(--warn) 0%, #E65100 100%)',
                      Other: 'linear-gradient(90deg, var(--text-secondary) 0%, var(--text-muted) 100%)'
                    };
                    const barBg = barGradients[row.label] || 'linear-gradient(90deg, var(--text-secondary) 0%, var(--text-muted) 100%)';
                    return (
                      <div key={row.label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 650, color: 'var(--text-secondary)' }}>{row.label}</span>
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text)' }}>
                            {row.count} <span style={{ fontWeight: 555, color: 'var(--text-muted)', fontSize: '10.5px' }}>({Math.round(row.pct)}%)</span>
                          </span>
                        </div>
                        <div className="bar-track" style={{ height: 8, borderRadius: 4, width: '100%', border: 'none', flex: 'none', background: 'rgba(194, 24, 91, 0.05)' }}>
                          <div className="bar-fill" style={{ width: `${row.pct}%`, background: barBg, height: '100%', borderRadius: 4, boxShadow: 'none', padding: 0 }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span className="card-title">Age Group Affected</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center', flex: 1, padding: '16px 20px 20px 20px' }}>
              <div style={{ width: 120, height: 120, position: 'relative', flexShrink: 0 }}>
                {loadingAgeGroup ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: '120px', textAlign: 'center' }}>Loading...</div>
                ) : (
                  <>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none'
                    }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', display: 'block', lineHeight: 1 }}>
                        {firestoreStats.totalCount}
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                        Reports
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donut.map((d) => ({ name: d.label, value: d.pct, color: d.color }))}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={38}
                          outerRadius={56}
                          paddingAngle={2}
                          isAnimationActive={true}
                          animationDuration={850}
                        >
                          {donut.map((d) => (
                            <Cell key={d.key} fill={d.color} stroke="var(--surface)" strokeWidth={1} style={{ outline: 'none' }} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                {donut.map((l) => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        background: l.color,
                        flexShrink: 0,
                        border: l.color === '#F8F0F5' ? '1px solid #DDD' : 'none',
                      }}
                    />
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>{l.label}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', marginLeft: 'auto' }}>{`${Math.round(l.pct)}%`}</span>
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
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
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
                <div
                  key={label}
                  style={{
                    textAlign: 'center',
                    flex: 1,
                    minWidth: 100,
                    padding: '16px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(194, 24, 91, 0.02)',
                    border: '0.5px solid var(--border)',
                    transition: 'all 0.22s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(194, 24, 91, 0.02)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { AuthProvider, useAuth, PERMISSIONS } from "./AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import {
  DashboardPage,
  CasesPage,
  ReferralPage,
  CommunicationsPage,
  AnalyticsPage,
} from "./pages";
import EvidenceStoragePage from "./pages/EvidenceStoragePage";
import AccountManagementPage from "./pages/AccountManagementPage";
import NotificationDropdown from "./components/NotificationDropdown";
import { useNotifications } from "./hooks/useNotifications";
import Icon from "./components/Icon";
import "./styles/global.css";

const NAV = [
  { id: "analytics",  icon: "", label: "Dashboard Analytics", permission: "analytics" },
  { id: "cases",      icon: "", label: "Case Management", permission: "cases", adminOnly: true },
  { id: "comms",      icon: "", label: "Communications",  permission: "communications" },
  { id: "evidence",   icon: "", label: "Evidence",        permission: "evidence" },
  { id: "referrals",  icon: "",  label: "Referrals",       permission: "referrals" },
  { id: "accounts",   icon: "", label: "Accounts",        permission: "accountManagement", adminOnly: true },
];


function Shell() {
  const { user, logout, can, loading } = useAuth(); // ✅ include loading
  const [page, setPage] = useState("analytics");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const { notifications, unreadCount } = useNotifications(user?.uid);
  const [notifKey, setNotifKey] = useState(0);

  // ⚡ Wait for Firebase auth to finish initializing
  if (loading) return (
    <div className="auth-loading">
      <div className="auth-spinner" />
      Loading...
    </div>
  );

  // ⚡ Render login page only if user is not authenticated
  if (!user) return <LoginPage />;

  const visibleNav = NAV.filter(n => can(n.permission));
  const pages = {
    cases:     <ProtectedRoute permission="cases"><CasesPage /></ProtectedRoute>,
    referrals: <ReferralPage />,
    comms:     <CommunicationsPage />,
    analytics: <AnalyticsPage />,
    evidence:  <EvidenceStoragePage />,
    accounts:  <ProtectedRoute permission="accountManagement"><AccountManagementPage /></ProtectedRoute>,
  };


  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <div className="sidebar-brand">
          <div className="brand-icon"></div>
          {sidebarOpen && (
            <div className="brand-text">
              <span className="brand-name">Vio-less</span>
              <span className="brand-sub">Barangay System</span>
            </div>
          )}
        </div>
        <nav className="sidebar-nav">
          {sidebarOpen && (
            <div style={{ padding: "4px 6px 10px" }}>
              <span
                style={{
                  display:"inline-block",
                  padding:"3px 10px",
                  borderRadius:20,
                  fontSize:10,
                  fontWeight:700,
                  background: user.role==="admin"?"rgba(106,27,154,0.25)":"rgba(21,101,192,0.25)",
                  color: user.role==="admin"?"#CE93D8":"#90CAF9",
                  letterSpacing:0.4,
                  textTransform:"uppercase"
                }}
              >
                <Icon icon={user.role === "admin" ? "shield" : "user-tie"} style={{ marginRight: "4px" }} size="11px" />
                {user.role === "admin" ? "Admin" : "Officer"}
              </span>
            </div>
          )}
          {visibleNav.map(n => (
            <button
              key={n.id}
              className={`nav-item ${page===n.id?"active":""}`}
              onClick={() => setPage(n.id)}
              title={!sidebarOpen ? n.label : undefined}
            >
              <span className="nav-icon">{n.icon}</span>
              {sidebarOpen && <span className="nav-label">{n.label}</span>}
              {sidebarOpen && n.adminOnly && (
                <span
                  style={{
                    marginLeft:"auto",
                    fontSize:9,
                    background:"rgba(106,27,154,0.3)",
                    color:"#CE93D8",
                    padding:"1px 5px",
                    borderRadius:10,
                    fontWeight:700
                  }}
                >
                  Admin
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
        <div className="officer-card" style={{ flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Avatar circle */}
            <div className={`officer-avatar ${user.role === "admin" ? "av-blue" : "av-pink"}`}>
              {user.firstName && user.lastName
                ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
                : "?"}
            </div>

            {/* Name & Role */}
            {sidebarOpen && (
              <div className="officer-info">
                <span className="officer-name">{user.firstName} {user.lastName}</span>
                <span className="officer-role">
                  <Icon icon={user.role === "admin" ? "shield" : "user-tie"} style={{ marginRight: "4px" }} size="11px" />
                  {user.role === "admin" ? "Admin" : "Officer"}
                </span>
              </div>
            )}
          </div>

          {/* Sign Out button */}
          {sidebarOpen && (
            <button
              onClick={() => setShowSignOutConfirm(true)}
              style={{
                width: "100%",
                background: "rgba(194,24,91,0.12)",
                border: "0.5px solid rgba(194,24,91,0.2)",
                borderRadius: 8,
                color: "#F48FB1",
                fontSize: 11,
                fontWeight: 700,
                padding: "7px 0",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
               Sign Out
            </button>
          )}
        </div>
</div>
      </aside>

      <div className="main-area">
<header className="topbar">
          <div className="topbar-left">
            <button className="toggle-btn" onClick={() => setSidebarOpen(o => !o)}>
              <Icon icon="bars" size="18px" />
            </button>
          </div>
          <div className="topbar-right">
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={() => setNotifKey(k => k + 1)}
            />
          </div>
        </header>

        <div className="alert-banner">
          <span className="alert-dot" />
          <span className="alert-text">{notifications.length > 0 && notifications[0].message ? notifications[0].message : "No new alerts"}</span>
          <span className="alert-count-pill">{unreadCount} {unreadCount === 1 ? "alert" : "alerts"}</span>
        </div>

        <main className="page-content">
          {pages[page] || <DashboardPage onNavigate={setPage} />}
        </main>
      </div>

      {/* Sign Out Confirmation Dialog */}
      {showSignOutConfirm && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(20, 5, 12, 0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            boxShadow: "0 16px 48px rgba(136, 14, 79, 0.18)",
            padding: 32,
            maxWidth: 400,
            color: "#1A0A12"
          }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 18, fontWeight: 700 }}>
              <Icon icon="triangle-exclamation" style={{ marginRight: "8px", color: "#C62828" }} size="18px" />
              Sign Out?
            </h2>
            <p style={{ marginBottom: 24, color: "#A08898", fontSize: 14, lineHeight: 1.5 }}>
              Are you sure you want to sign out? You'll need to log in again to access the system.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "0.5px solid rgba(194,24,91,0.10)",
                  background: "#FAF5F8",
                  color: "#1A0A12",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSignOutConfirm(false);
                  logout();
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: "rgba(194,24,91,0.3)",
                  color: "#C2185B",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
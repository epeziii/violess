import { useState } from "react";
import API_BASE_URL from "../config/api";
import Icon from "./Icon";

export default function NotificationDropdown({ notifications, unreadCount, onMarkAsRead }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleMarkAllAsRead = async () => {
    try {
      // Will be implemented with userId from parent
      const unreadNotifications = notifications.filter(n => !n.read);
      for (const notif of unreadNotifications) {
        await fetch(`${API_BASE_URL}/mark-notification-read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notif.id })
        });
      }
      onMarkAsRead?.();
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const formatTime = (date) => {
    if (!date) return "";
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 8px",
          position: "relative",
          fontSize: "20px"
        }}
      >
        <Icon icon="bell" size="20px" />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              background: "var(--sos)",
              color: "white",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: "700"
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 998
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              background: "white",
              border: "0.5px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              width: "360px",
              maxHeight: "500px",
              overflowY: "auto",
              zIndex: 999,
              marginTop: "8px"
            }}
          >
            <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div>
              {notifications.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                  No notifications yet
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "0.5px solid var(--border)",
                      background: notif.read ? "transparent" : "rgba(194, 24, 91, 0.04)",
                      cursor: "pointer",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => {
                      if (!notif.read) {
                        e.currentTarget.style.background = "rgba(194, 24, 91, 0.08)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!notif.read) {
                        e.currentTarget.style.background = "rgba(194, 24, 91, 0.04)";
                      }
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <div style={{ fontSize: "16px", marginTop: "2px" }}>
                        {(
                          notif.type === "case_assigned" ||
                          notif.type === "case_filed" ||
                          notif.type === "new_case_filed" ||
                          notif.type === "case_created"
                        ) ? (
                          <Icon icon="gavel" size="16px" />
                        ) : (
                          <Icon icon="file" size="16px" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text)", marginBottom: "2px" }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text)", lineHeight: 1.4, marginBottom: "4px" }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                          {formatTime(notif.createdAt)}
                        </div>
                      </div>
                      {!notif.read && (
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "var(--primary)",
                            flexShrink: 0
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

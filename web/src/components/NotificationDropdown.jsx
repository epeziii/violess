import { useState, useEffect } from "react";
import API_BASE_URL from "../config/api";
import Icon from "./Icon";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../AuthContext";

export default function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onNavigateToCommunications,
  onNavigateToCase,
}) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [selectedNotificationCase, setSelectedNotificationCase] = useState(null);
  const [loadingCaseDetails, setLoadingCaseDetails] = useState(false);
  const [caseReassignedError, setCaseReassignedError] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount);

  useEffect(() => {
    setLocalNotifications(notifications);
    setLocalUnreadCount(unreadCount);
  }, [notifications, unreadCount]);

  useEffect(() => {
    if (caseReassignedError && notificationModalOpen) {
      alert("⚠️ Case Reassigned\n\nThis case has been reassigned to another officer and is no longer assigned to you.");
    }
  }, [caseReassignedError, notificationModalOpen]);

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = localNotifications.filter(n => !n.read);
      for (const notif of unreadNotifications) {
        await fetch(`${API_BASE_URL}/mark-notification-read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notif.id })
        });
      }
      setLocalNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      setLocalUnreadCount(0);
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

  const extractCaseId = (message) => {
    const match = message.match(/#([A-Z0-9-]+)/);
    return match ? match[1] : null;
  };

  const fetchCaseDetails = async (caseId) => {
    setLoadingCaseDetails(true);
    setCaseReassignedError(false);
    try {
      const q = query(collection(db, "reports"), where("caseId", "==", caseId));
      const snapshot = await getDocs(q);

      if (snapshot.docs.length > 0) {
        const doc = snapshot.docs[0];
        const data = doc.data();

        const currentOfficerName = `${user.firstName} ${user.lastName}`.trim();
        const assignedOfficer = data.assignedOfficer || "";

        // Check if case is no longer assigned to current officer
        if (assignedOfficer !== currentOfficerName) {
          setCaseReassignedError(true);
          setSelectedNotificationCase(null);
        } else {
          setCaseReassignedError(false);
          setSelectedNotificationCase({
            id: data.caseId,
            type: data.incidentType,
            reporter: data.reporterName,
            status: data.status || "pending",
            priority: data.priorityLevel || "normal",
            docId: doc.id,
            uid: data.uid,
            location: data.location || "N/A",
            datetime: data.datetime || "",
            description: data.description || "",
            suspectDescription: data.suspectDescription || "",
            assignedOfficer: data.assignedOfficer || "",
            createdAt: data.createdAt || "",
          });
        }
        setNotificationModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching case details:", error);
    } finally {
      setLoadingCaseDetails(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    // Mark notification as read
    try {
      await fetch(`${API_BASE_URL}/mark-notification-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notif.id })
      });
      setLocalNotifications((prev) => prev.map((item) => item.id === notif.id ? { ...item, read: true } : item));
      setLocalUnreadCount((count) => Math.max(0, count - (notif.read ? 0 : 1)));
      onMarkAsRead?.();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }

    const caseId = notif.caseId || notif.caseData?.caseId || extractCaseId(notif.message);
    if (caseId) {
      setIsOpen(false);
      const wantsComms = notif.type === "case_assigned" || notif.type === "case_reassigned";
      if (wantsComms && typeof onNavigateToCommunications === "function") {
        onNavigateToCommunications(caseId, { openCaseDetailsModal: true });
        return;
      }
      if (typeof onNavigateToCase === "function") {
        onNavigateToCase(caseId);
        return;
      }
    }

    // Fetch case details for other notification types or fallback behavior.
    if (caseId) {
      await fetchCaseDetails(caseId);
    }
  };

  const closeNotificationModal = () => {
    setNotificationModalOpen(false);
    setSelectedNotificationCase(null);
    setCaseReassignedError(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Notification Case Details Modal */}
      {notificationModalOpen && selectedNotificationCase && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeNotificationModal();
          }}
        >
          <div className="modal" style={{ width: 540, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <div style={{ flex: 1 }}>
                <div className="modal-title">{caseReassignedError ? "Case Reassigned" : selectedNotificationCase?.id + " — " + (selectedNotificationCase?.type || "").replace(/^[-\s]+/, "")}</div>
              </div>
              <button type="button" className="modal-close" onClick={closeNotificationModal} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="modal-body">
              {caseReassignedError ? (
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>
                    <i className="fas fa-info-circle" style={{ color: "var(--warn)" }}></i>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                    Case Reassigned
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
                    This case has been reassigned to another officer and is no longer assigned to you.
                  </div>
                </div>
              ) : (
                <>
              {/* People Section */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>
                  <i className="fas fa-users" style={{ marginRight: 6 }}></i> People
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      background: "var(--bg)",
                      border: "0.5px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>Reporter</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{selectedNotificationCase?.reporter}</div>
                  </div>
                  <div
                    style={{
                      background: "var(--bg)",
                      border: "0.5px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>Assigned to</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                      {selectedNotificationCase?.assignedOfficer || "Unassigned"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Time Section */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>
                  <i className="fas fa-map-marker-alt" style={{ marginRight: 6 }}></i> Location & Time
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      background: "var(--bg)",
                      border: "0.5px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>Location</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{selectedNotificationCase?.location}</div>
                  </div>
                  <div
                    style={{
                      background: "var(--bg)",
                      border: "0.5px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>Date & time of incident</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                      {selectedNotificationCase?.datetime
                        ? new Date(selectedNotificationCase.datetime).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                        : "Not recorded"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Incident Description Section */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>
                  <i className="fas fa-file-alt" style={{ marginRight: 6 }}></i> Incident Description
                </div>
                <div
                  style={{
                    background: "var(--bg)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px",
                    fontSize: 12,
                    color: "var(--text)",
                    lineHeight: 1.6,
                    border: "0.5px solid var(--border)",
                  }}
                >
                  {selectedNotificationCase?.description || "Not recorded"}
                </div>
              </div>

              {/* Suspect Description Section */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>
                  <i className="fas fa-search" style={{ marginRight: 6 }}></i> Suspect Description
                </div>
                <div
                  style={{
                    background: "var(--bg)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px",
                    fontSize: 12,
                    color: "var(--text)",
                    lineHeight: 1.6,
                    border: "0.5px solid var(--border)",
                  }}
                >
                  {selectedNotificationCase?.suspectDescription || "Not recorded"}
                </div>
              </div>
              </>
              )}
            </div>
            {!caseReassignedError && selectedNotificationCase && (
            <div className="modal-footer" style={{ gap: 10 }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: "100%" }}
                onClick={() => {
                  const caseId = selectedNotificationCase?.id;
                  closeNotificationModal();
                  if (caseId && typeof onNavigateToCommunications === "function") {
                    onNavigateToCommunications(caseId);
                  }
                }}
              >
                <i className="fas fa-comment" style={{ marginRight: 6 }}></i> Message reporter
              </button>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Bell */}
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
        {localUnreadCount > 0 && (
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
            {localUnreadCount > 9 ? "9+" : localUnreadCount}
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
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 1,
                padding: "12px 16px",
                borderBottom: "0.5px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "white"
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>
                Notifications {localUnreadCount > 0 && `(${localUnreadCount})`}
              </div>
              {localUnreadCount > 0 && (
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
              {localNotifications.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                  No notifications yet
                </div>
              ) : (
                localNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "0.5px solid var(--border)",
                      background: notif.read ? "transparent" : "rgba(194, 24, 91, 0.16)",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = notif.read ? "rgba(194, 24, 91, 0.08)" : "rgba(194, 24, 91, 0.24)";
                      e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(194, 24, 91, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = notif.read ? "transparent" : "rgba(194, 24, 91, 0.16)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <div style={{ fontSize: "16px", marginTop: "2px" }}>
                        {(
                          notif.type === "case_assigned" ||
                          notif.type === "case_filed" ||
                          notif.type === "new_case" ||
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

// CommunicationsPage.jsx
import { useState, useEffect } from "react";
import { DesktopTimePicker } from "@mui/x-date-pickers/DesktopTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format } from "date-fns";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext";

export default function CommunicationsPage() {
  const { user } = useAuth();
  const [selectedCase, setSelectedCase] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [assignedCases, setAssignedCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeValue, setSelectedTimeValue] = useState(null);
  const [interviewMode, setInterviewMode] = useState(
    "Barangay Hall (private room)"
  );
  const [scheduling, setScheduling] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [caseFilter, setCaseFilter] = useState("all");
  const [detailTab, setDetailTab] = useState("messages");
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [caseDetailsModalOpen, setCaseDetailsModalOpen] = useState(false);
  const [selectedCaseDetails, setSelectedCaseDetails] = useState(null);

  useEffect(() => {
    if (!user) return;
    const officerName = `${user.firstName} ${user.lastName}`.trim();
    const q = query(collection(db, "reports"), where("assignedOfficer", "==", officerName));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cases = snapshot.docs.map((doc) => ({
        id: doc.data().caseId,
        type: doc.data().incidentType,
        reporter: doc.data().reporterName,
        status: doc.data().status || "pending",
        priority: doc.data().priorityLevel || "normal",
        docId: doc.id,
        uid: doc.data().uid,
        location: doc.data().location || "N/A",
        datetime: doc.data().datetime || "",
        description: doc.data().description || "",
        suspectDescription: doc.data().suspectDescription || "",
        assignedOfficer: doc.data().assignedOfficer || "",
        createdAt: doc.data().createdAt || "",
      }));
      setAssignedCases(cases);
      setLoadingCases(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!selectedCase) {
      setMsgs([]);
      setQuickActionOpen(false);
      return;
    }

    setLoadingMessages(true);

    const messagesQuery = query(
      collection(db, "messages", selectedCase.id, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMsgs(messages);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [selectedCase]);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const openScheduleModal = () => {
    if (!selectedCase) return;
    setScheduleModalOpen(true);
  };

  const closeScheduleModal = () => {
    setScheduleModalOpen(false);
    // keep selections as-is, so user can reopen without losing work
  };

  const scheduleInterview = async () => {
    if (!selectedCase || !selectedDate || !selectedTimeValue || scheduling) return;

    try {
      setScheduling(true);
      setScheduleMessage("");

      const interviewDateTime = new Date(selectedDate);
      interviewDateTime.setHours(
        selectedTimeValue.getHours(),
        selectedTimeValue.getMinutes(),
        0,
        0
      );

      await addDoc(
        collection(db, `reports/${selectedCase.docId}/interviews`),
        {
          caseId: selectedCase.id,
          reporterUid: selectedCase.uid,
          reporterName: selectedCase.reporter,
          officerUid: user.uid,
          officerName: `${user.firstName} ${user.lastName}`,
          dateTime: interviewDateTime,
          mode: interviewMode,
          status: "scheduled",
          createdAt: serverTimestamp(),
        }
      );

      setScheduleMessage("Interview scheduled successfully!");

      const officerName = `${user.firstName} ${user.lastName}`;
      const formattedDateTime = format(
        interviewDateTime,
        "MMM dd, yyyy h:mm aa"
      );
      const messageText = `📅 Interview scheduled for ${formattedDateTime} (${interviewMode}) by ${officerName}. Reply ACCEPT to confirm or state your reason:`;

      await addDoc(collection(db, "messages", selectedCase.id, "messages"), {
        reporterUid: selectedCase.uid,
        officerUid: user.uid,
        officerName,
        reporterName: selectedCase.reporter,
        from: "officer",
        text: messageText,
        timestamp: new Date(),
      });

      setSelectedDate(null);
      setSelectedTimeValue(null);
      setInterviewMode("Barangay Hall (private room)");
    } catch (error) {
      console.error("Error scheduling interview:", error);
      setScheduleMessage("Failed to schedule interview. Please try again.");
    } finally {
      setScheduling(false);
    }
  };

  const send = async () => {
    if (!input.trim() || !selectedCase || sending) return;

    try {
      setSending(true);
      await addDoc(collection(db, "messages", selectedCase.id, "messages"), {
        reporterUid: selectedCase.uid,
        officerUid: user.uid,
        officerName: `${user.firstName} ${user.lastName}`,
        reporterName: selectedCase.reporter,
        from: "officer",
        text: input,
        timestamp: new Date(),
      });
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const getFilteredCases = () => {
    if (caseFilter === "all") return assignedCases;

    // Urgent cases are stored as a priority level, not as a status.
    if (caseFilter === "urgent") {
      return assignedCases.filter((c) => {
        const p = (c.priority ?? "").toString().trim().toLowerCase();
        return p === "urgent";
      });
    }

    return assignedCases.filter((c) => c.status === caseFilter);
  };

  const getStatusDot = (status) => {
    const colors = {
      reviewing: "#1565c0",
      pending: "#e65100",
      closed: "#c2185b",
      urgent: "#c62828",
    };
    return colors[status] || "#888";
  };

  const openCaseDetailsModal = (caseItem) => {
    setSelectedCaseDetails(caseItem);
    setCaseDetailsModalOpen(true);
  };

  const closeCaseDetailsModal = () => {
    setCaseDetailsModalOpen(false);
    setSelectedCaseDetails(null);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        // Offset `.page-content { padding: 24px; }` from App.jsx so this page fills the available area.
        margin: "-24px -24px 0 -24px",
        height: "calc(100% + 24px)",
        overflow: "hidden",
      }}
    >
      {/* Case Details Modal */}
      {caseDetailsModalOpen && selectedCaseDetails && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeCaseDetailsModal();
          }}
        >
          <div className="modal" style={{ width: 540, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
<div style={{ flex: 1 }}>
                <div className="modal-title">{selectedCaseDetails.id} — {(selectedCaseDetails.type || "").replace(/^[-\s]+/, "")}</div>

                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Filed{" "}
                  {selectedCaseDetails.createdAt
                    ? (() => {
                        const date = selectedCaseDetails.createdAt.toDate
                          ? selectedCaseDetails.createdAt.toDate()
                          : new Date(selectedCaseDetails.createdAt);
                        return date.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        });
                      })()
                    : ""}
                </div>
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "4px 12px",
                  borderRadius: "20px",
                  backgroundColor:
                    selectedCaseDetails.status === "reviewing"
                      ? "#e3f2fd"
                      : selectedCaseDetails.status === "pending"
                        ? "#fff3e0"
                        : "#ffe0e6",
                  color:
                    selectedCaseDetails.status === "reviewing"
                      ? "#1565c0"
                      : selectedCaseDetails.status === "pending"
                        ? "#e65100"
                        : "#c2185b",
                  textTransform: "capitalize",
                  marginRight: 8,
                }}
              >
                {selectedCaseDetails.status}
              </span>
              <button type="button" className="modal-close" onClick={closeCaseDetailsModal} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="modal-body">
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
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{selectedCaseDetails.reporter}</div>
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
                      {selectedCaseDetails.assignedOfficer || "Unassigned"}
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
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{selectedCaseDetails.location}</div>
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
                      {selectedCaseDetails.datetime
                        ? new Date(selectedCaseDetails.datetime).toLocaleString("en-US", {
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
                  {selectedCaseDetails.description || "Not recorded"}
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
                  {selectedCaseDetails.suspectDescription || "Not recorded"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MIDDLE: Case List Panel (40%) */}
      <div
        style={{
          width: "40%",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          borderRight: "0.5px solid var(--border)",
        }}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div
            className="card-header"
            style={{ borderBottom: "0.5px solid var(--border)", padding: "14px 18px 12px" }}
          >
            <span className="card-title">Assigned Cases</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {assignedCases.length} cases
            </span>
          </div>

          {/* Filter Tabs */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "0.5px solid var(--border)",
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {['all', 'urgent', 'reviewing', 'closed'].map((filter) => (
              <button
                key={filter}
                onClick={() => setCaseFilter(filter)}
                className={`btn ${caseFilter === filter ? 'btn-primary' : 'btn-ghost'}`}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  textTransform: 'capitalize',
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Case List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
            {loadingCases ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                Loading...
              </div>
            ) : getFilteredCases().length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No cases found
              </div>
            ) : (
              getFilteredCases().map((caseItem) => (
                <div
                  key={caseItem.id}
                  onClick={() => setSelectedCase(caseItem)}
                  title={`${caseItem.id}\n${caseItem.type}\nReporter: ${caseItem.reporter}\nStatus: ${caseItem.status}\nPriority: ${caseItem.priority}`}
                  onMouseEnter={(e) => {
                    if (selectedCase?.id !== caseItem.id) {
                      e.currentTarget.style.backgroundColor = "rgba(194, 24, 91, 0.06)";
                      e.currentTarget.style.border = "1px solid rgba(194, 24, 91, 0.22)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCase?.id !== caseItem.id) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.border = "1px solid transparent";
                    }
                  }}
                  style={{
                    padding: "12px",
                    marginBottom: 8,
                    borderRadius: "6px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedCase?.id === caseItem.id ? "rgba(194, 24, 91, 0.1)" : "transparent",
                    border:
                      selectedCase?.id === caseItem.id
                        ? "1px solid rgba(194, 24, 91, 0.3)"
                        : "1px solid transparent",
                    transition: "all 0.2s",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: getStatusDot(caseItem.status),
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                        {caseItem.id} — {caseItem.type}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                        {caseItem.reporter}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            backgroundColor:
                              caseItem.status === "reviewing"
                                ? "#e3f2fd"
                                : caseItem.status === "pending"
                                  ? "#fff3e0"
                                  : "#ffe0e6",
                            color:
                              caseItem.status === "reviewing"
                                ? "#1565c0"
                                : caseItem.status === "pending"
                                  ? "#e65100"
                                  : "#c2185b",
                            textTransform: "capitalize",
                          }}
                        >
                          {caseItem.status}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            backgroundColor:
                              caseItem.priority === "urgent"
                                ? "#ffebee"
                                : caseItem.priority === "high"
                                  ? "#fff9c4"
                                  : "#e8f5e9",
                            color:
                              caseItem.priority === "urgent"
                                ? "#c62828"
                                : caseItem.priority === "high"
                                  ? "#f57f17"
                                  : "#2e7d32",
                            textTransform: "capitalize",
                          }}
                        >
                          {caseItem.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCaseDetailsModal(caseItem);
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "var(--primary)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--primary-dark)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--primary)";
                    }}
                  >
                    View Details
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Case Detail Panel (60%) */}
      <div
        style={{
          width: "60%",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          minHeight: 0,
        }}
      >

        {scheduleModalOpen && (
          <div
            className="modal-backdrop"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeScheduleModal();
            }}
          >
            <div className="modal">
              <div className="modal-header">
                <div className="modal-title">Schedule Interview</div>
                <button type="button" className="modal-close" onClick={closeScheduleModal} aria-label="Close">
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => setSelectedDate(e.target.valueAsDate || null)}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Time</label>
                  <div style={{ width: "100%" }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DesktopTimePicker
                        value={selectedTimeValue}
                        onChange={(newValue) => setSelectedTimeValue(newValue)}
                        sx={{ width: "100%" }}
                      />
                    </LocalizationProvider>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mode</label>
                  <select
                    className="form-select"
                    value={interviewMode}
                    onChange={(e) => setInterviewMode(e.target.value)}
                  >
                    <option>Barangay Hall (private room)</option>
                    <option>Video call (secure)</option>
                    <option>Home visit</option>
                  </select>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  onClick={scheduleInterview}
                  disabled={!selectedDate || !selectedTimeValue || scheduling}
                >
                  {scheduling ? "Scheduling..." : "Schedule Interview"}
                </button>

                {scheduleMessage && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: "8px 12px",
                      borderRadius: "var(--radius-md)",
                      fontSize: 13,
                      textAlign: "center",
                      backgroundColor: scheduleMessage.includes("successfully")
                        ? "#d4edda"
                        : "#f8d7da",
                      color: scheduleMessage.includes("successfully") ? "#155724" : "#721c24",
                    }}
                  >
                    {scheduleMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!selectedCase ? (
          <div className="card" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
              Select a case to view details
            </div>
          </div>
        ) : (

          <>
            {/* Case Header */}
            <div
              className="card"
              style={{
                marginBottom: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
              }}
            >
              <div style={{ padding: "16px" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                  {selectedCase.id} — {selectedCase.type}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
                  Reporter: {selectedCase.reporter} · Assigned to: {user.firstName} {user.lastName}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                height: "100%",
                overflow: "hidden",
              }}
            >

                <div
                  style={{
                    margin: 0,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                    paddingBottom: 0,
                    overflow: "hidden",
                    background: "transparent",
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    justifyContent: "center",
                  }}
                >
                  <div
                    className="chat-messages"
                    style={{
                      flex: 1,
                      minHeight: 0,
                      borderRadius: 0,
                      maxHeight: "none",
                      overflowY: "auto",
                    }}
                  >
                    {loadingMessages ? (
                      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                        Loading messages...
                      </div>
                    ) : msgs.length === 0 ? (
                      <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      msgs.map((m) => (
                        <div key={m.id} className={`msg-row ${m.from === 'officer' ? 'me' : ''}`}>
                          <div className="msg-avatar" style={{ background: m.from === 'officer' ? 'var(--primary)' : '#888' }}>
                            {m.from === 'officer' ? 'OF' : 'RP'}
                          </div>
                          <div className={`msg-bubble ${m.from === 'officer' ? 'msg-me' : 'msg-them'}`}>
                            {m.from !== 'officer' && <div className="msg-name">{m.reporterName}</div>}
                            <div className={m.from === 'officer' ? 'msg-text-me' : 'msg-text'}>{m.text}</div>
                            {m.fileUrl && m.text.includes('📎') && (
                              <a
                                href={m.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-block',
                                  marginTop: '6px',
                                  padding: '4px 8px',
                                  backgroundColor: m.from === 'officer' ? 'rgba(255,255,255,0.2)' : 'var(--primary)',
                                  color: m.from === 'officer' ? '#fff' : 'white',
                                  borderRadius: '4px',
                                  textDecoration: 'none',
                                  fontSize: '12px',
                                  fontWeight: '600'
                                }}
                              >
                                [View Evidence]
                              </a>
                            )}
                            <div className={m.from === 'officer' ? 'msg-time-me' : 'msg-time'}>
                              {m.timestamp?.toDate
                                ? m.timestamp.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                                : new Date(m.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="chat-input-row" style={{ padding: '12px 16px 12px 16px', marginTop: 0, gap: 8, position: 'relative' }}>
                    <button
                      className="chat-action-plus"
                      type="button"
                      title="Quick actions"
                      disabled={!selectedCase}
                      onClick={() => setQuickActionOpen((o) => !o)}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        border: '0.5px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--primary)',
                        fontSize: 20,
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--surface)';
                      }}
                    >
                      +
                    </button>

                    {quickActionOpen && selectedCase && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 16,
                          bottom: 52,
                          background: 'var(--surface)',
                          border: '0.5px solid var(--border)',
                          borderRadius: 12,
                          boxShadow: 'var(--shadow-sm)',
                          zIndex: 50,
                          minWidth: 220,
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setQuickActionOpen(false);
                            openScheduleModal();
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--text)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          📅 Schedule Interview
                        </button>
                      </div>
                    )}

                    <input
                      className="chat-input"
                      placeholder="Type a message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !sending && send()}
                      disabled={sending}
                    />

                    <button className="chat-send" onClick={send} disabled={sending || !input.trim()}>
                      ➤
                    </button>
                  </div>
                </div>

              {/* Schedule tab removed (not needed); scheduling is handled via the quick action modal */}

            </div>
          </>
        )}
      </div>
    </div>
  );
}


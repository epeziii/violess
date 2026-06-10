// CasesPage.jsx
import { useState, useEffect } from "react";
import Badge from "./Badge";
import { db } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { useAuth } from "../AuthContext";
import API_BASE_URL from "../config/api";
import Icon from "../components/Icon";

const SAMPLE_CASES = [
  { id: "#VIO-001", type: "Harassment", reporter: "Anonymous", location: "Brgy. 123", status: "reviewing", date: "Feb 12" },
  { id: "#VIO-002", type: "Domestic Abuse", reporter: "Maria D.", location: "Brgy. 456", status: "urgent", date: "Feb 13" },
  { id: "#VIO-003", type: "Bullying", reporter: "Anonymous", location: "School Zone", status: "referred", date: "Feb 14" },
  { id: "#VIO-004", type: "Threats", reporter: "Ana L.", location: "Brgy. 123", status: "pending", date: "Feb 15" },
  { id: "#VIO-005", type: "Harassment", reporter: "Anonymous", location: "Market Area", status: "resolved", date: "Feb 10" },
];

const getStatusFromString = (status) => {
  if (status === "pending") return "pending";
  if (status === "urgent") return "urgent";
  if (status === "resolved") return "resolved";
  if (status === "reviewing") return "reviewing";
  if (status === "referred") return "referred";
  return "pending";
};

const formatDate = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : date.toDate?.();
  if (!d) return "";

  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

};

const formatIncidentDateTime = (value) => {
  if (!value) return "";

  const d = new Date(value);
  if (isNaN(d)) return value;

  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export default function CasesPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    active: 0,
    resolved: 0
  });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [status, setStatus] = useState("reviewing");
  const [assignedOfficer, setAssignedOfficer] = useState("");
  const [priorityLevel, setPriorityLevel] = useState("normal");
  const [note, setNote] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [officers, setOfficers] = useState([]);
  const [notes, setNotes] = useState([
    { by: "Officer Reyes", time: "Feb 12, 11:30 AM", text: "Reviewed initial report. Victim confirmed details. Scheduled follow-up interview for Feb 14." },
    { by: "Social Worker Ana", time: "Feb 13, 9:00 AM", text: "Conducted preliminary assessment. Recommending counseling referral." },
  ]);
  const [pendingResolution, setPendingResolution] = useState(null);
  const [approvalComments, setApprovalComments] = useState("");
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [actionMode, setActionMode] = useState("none"); // "none", "update", "resolution"

  useEffect(() => {
    // Check and notify admin about any new cases on page load
    if (user?.role === "admin" && user?.uid) {
      console.log("[CasesPage] Admin detected, checking for new cases. UID:", user.uid);
      fetch(`${API_BASE_URL}/check-and-notify-new-cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid })
      })
        .then(res => res.json())
        .then(data => console.log("[CasesPage] Check-and-notify response:", data))
        .catch(error => console.error("[CasesPage] Error checking new cases:", error));
    }
  }, [user?.uid, user?.role]);

  useEffect(() => {
    try {
      // Real-time listener for reports collection
      const q = query(
        collection(db, "reports"),
        orderBy("createdAt", "desc"),
        limit(10)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reportsData = snapshot.docs.map((doc) => ({
          id: doc.data().caseId,
          type: doc.data().incidentType,
          reporter: doc.data().reporterName,
          location: doc.data().location || "N/A",
          status: getStatusFromString(doc.data().status),
          date: formatDate(doc.data().createdAt),
          incidentDateTime: formatIncidentDateTime(doc.data().datetime),
          priority: doc.data().priorityLevel || "normal",
          assignedOfficer: doc.data().assignedOfficer || "",
          description: doc.data().description || "",
          suspectDescription: doc.data().suspectDescription || "",
          createdAt: doc.data().createdAt,
          docId: doc.id,
        }));
        setReports(reportsData);

        // Update selectedCase if it exists and matches a case in the updated reports
        if (selectedCase) {
          const updatedCase = reportsData.find(c => c.docId === selectedCase.docId);
          if (updatedCase) {
            setSelectedCase(updatedCase);
            // Don't overwrite user's current dropdown selections while editing.
            if (actionMode !== "update") {
              setStatus(updatedCase.status);
              setAssignedOfficer(updatedCase.assignedOfficer || "");
              setPriorityLevel(updatedCase.priority || "normal");
            }
          }
        }

        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching reports:", error);
      setReports(SAMPLE_CASES);
      setLoading(false);
    }
  }, [selectedCase]);

  useEffect(() => {
    try {
      // Fetch active officers from staff collection
      const q = query(
        collection(db, "staff"),
        where("role", "==", "officer"),
        where("status", "==", "active")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const officersData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
          };
        });
        setOfficers(officersData);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching officers:", error);
      setOfficers([]);
    }
  }, []);

  const displayReports = loading ? SAMPLE_CASES : (reports.length > 0 ? reports : SAMPLE_CASES);

  const filteredReports = displayReports.filter(c => {
    // Search filter
    const searchTerm = searchInput.toLowerCase();
    const matchesSearch = !searchTerm ||
      c.id.toLowerCase().includes(searchTerm) ||
      c.type.toLowerCase().includes(searchTerm) ||
      c.reporter.toLowerCase().includes(searchTerm) ||
      c.location.toLowerCase().includes(searchTerm);

    // Status/Priority filter
    let matchesFilter = filterType === 'all';
    if (filterType === 'pending') matchesFilter = c.status === 'pending';
    else if (filterType === 'reviewing') matchesFilter = c.status === 'reviewing';
    else if (filterType === 'in_progress') matchesFilter = c.status === 'in_progress';
    else if (filterType === 'pending_admin_review') matchesFilter = c.status === 'pending_admin_review';
    else if (filterType === 'referred') matchesFilter = c.status === 'referred';
    else if (filterType === 'resolved') matchesFilter = c.status === 'resolved';
    else if (filterType === 'closed') matchesFilter = c.status === 'closed';
    else if (filterType === 'urgent') matchesFilter = c.priority === 'urgent';
    else if (filterType === 'high') matchesFilter = c.priority === 'high';
    else if (filterType === 'normal') matchesFilter = c.priority === 'normal';

    return matchesSearch && matchesFilter;
  });

  const handleViewCase = (caseData) => {
    setSelectedCase(caseData);
    setStatus(caseData.status);
    setAssignedOfficer(caseData.assignedOfficer || "");
    setPriorityLevel(caseData.priority || "normal");
  };

  const handleSaveChanges = async () => {
    if (!selectedCase || !selectedCase.docId) {
      console.error("No case selected");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/update-case`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          caseId: selectedCase.docId,
          status: status,
          priorityLevel: priorityLevel,
          assignedOfficer: assignedOfficer || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update case");

      console.log("Case updated successfully");
      alert("Case updated successfully");
    } catch (error) {
      console.error("Error updating case:", error);
      alert(`Error updating case: ${error.message}`);
    }
  };

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

  // Fetch pending resolution for selected case
  useEffect(() => {
    if (!selectedCase) {
      setPendingResolution(null);
      return;
    }

    try {
      const resolutionQuery = query(
        collection(db, "reports", selectedCase.docId, "resolutions"),
        where("status", "==", "pending")
      );

      const unsubscribe = onSnapshot(resolutionQuery, (snapshot) => {
        if (snapshot.docs.length > 0) {
          setPendingResolution(snapshot.docs[0].data());
        } else {
          setPendingResolution(null);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching resolution:", error);
    }
  }, [selectedCase]);

  // Keep dropdown values from being overwritten while the user is editing.
  const isEditingUpdate = actionMode === "update";

  const handleApproveResolution = async () => {
    if (!selectedCase || !pendingResolution || approving) return;

    try {
      setApproving(true);

      const res = await fetch(`${API_BASE_URL}/approve-resolution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          caseId: selectedCase.docId,
          resolutionId: pendingResolution.resolutionId,
          comments: approvalComments
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to approve");
      }

      alert("Resolution approved! Case is now closed.");
      setApprovalComments("");
    } catch (error) {
      console.error("Error approving resolution:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setApproving(false);
    }
  };

  const handleRejectResolution = async () => {
    if (!selectedCase || !pendingResolution || rejecting) return;

    try {
      setRejecting(true);

      const res = await fetch(`${API_BASE_URL}/reject-resolution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          caseId: selectedCase.docId,
          resolutionId: pendingResolution.resolutionId,
          comments: approvalComments
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to reject");
      }

      alert("Resolution rejected! Case returned to officer for revision.");
      setApprovalComments("");
    } catch (error) {
      console.error("Error rejecting resolution:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>Case Management</h1>
      </div>

      {/* Stat cards - MOVED FROM DASHBOARD */}
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
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Case detail */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">{selectedCase ? `${selectedCase.id} — ${selectedCase.type}` : "Case Details"}</span>
              {selectedCase && <Badge status={selectedCase.status} />}
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {selectedCase ? (
                <>
                  <div className="grid-2">
                    <div><div className="form-label">Reporter</div><div style={{ fontSize: 13, fontWeight: 600 }}>{selectedCase.reporter}</div></div>
                    <div><div className="form-label">Date Filed</div><div style={{ fontSize: 13, fontWeight: 600 }}>{selectedCase.date}</div></div>
                    <div><div className="form-label">Location</div><div style={{ fontSize: 13, fontWeight: 600 }}>{selectedCase.location}</div></div>
                    <div><div className="form-label">Assigned To</div><div style={{ fontSize: 13, fontWeight: 600 }}>{assignedOfficer || "Unassigned"}</div></div>
                    <div><div className="form-label">Date & Time of Incident</div><div style={{ fontSize: 13, fontWeight: 600 }}>{selectedCase.incidentDateTime || "Not recorded"}</div></div>
                  </div>
                  <div>
                    <div className="form-label">Incident Description</div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 12, color: 'var(--text)', lineHeight: 1.6, border: '0.5px solid var(--border)' }}>
                      {selectedCase.description}
                    </div>
                  </div>
                  <div>
                    <div className="form-label">Suspect Description</div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 12, color: 'var(--text)', lineHeight: 1.6, border: '0.5px solid var(--border)' }}>
                      {selectedCase.suspectDescription || "Not recorded"}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost btn-sm">Refer Case</button>
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px' }}>Select a case to view details</div>
              )}
            </div>
          </div>

          {/* Case Notes */}
          
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Case Actions - Consolidated with Dropdown */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Case Actions</span>
            </div>
            <div className="card-body">
              {selectedCase ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Select Action</label>
<select
                      className="form-select"
                      value={actionMode}
                      onChange={(e) => setActionMode(e.target.value)}
                    >
                      <option value="none">-- Select Action --</option>
                      <option value="update">Update Case</option>
                      <option value="resolution">Resolution Approvals</option>
                    </select>
                  </div>

                  {actionMode === "update" && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Case Status</label>
                        <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                          <option value="pending">Pending</option>
                          <option value="reviewing">Under Review</option>
                          <option value="referred">Referred</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Case Closed</option>
                        </select>
                      </div>
<div className="form-group">
                        <label className="form-label">Assign Officer</label>
                        <select className="form-select" value={assignedOfficer} onChange={e => setAssignedOfficer(e.target.value)} disabled={status === "pending"} style={status === "pending" ? { opacity: 0.5, cursor: "not-allowed", backgroundColor: "var(--bg)" } : {}}>
                          <option value="">-- Unassigned --</option>
                          {officers.map((officer) => (
                            <option key={officer.id} value={officer.name}>{officer.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Priority Level</label>
                        <select className="form-select" value={priorityLevel} onChange={e => setPriorityLevel(e.target.value)}>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSaveChanges}>Save Changes</button>
                    </>
                  )}

                  {actionMode === "resolution" && (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Submitted By</div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{pendingResolution?.submittedByName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {pendingResolution?.submittedAt?.toDate ? pendingResolution.submittedAt.toDate().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A'}
                        </div>
                      </div>

                      <div style={{ marginBottom: 16, padding: 12, backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Officer's Summary</div>
                        <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{pendingResolution?.notes}</div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Your Review Comments (Optional)</label>
                        <textarea
                          className="form-input"
                          placeholder="Comments visible to officer if rejected..."
                          value={approvalComments}
                          onChange={(e) => setApprovalComments(e.target.value)}
                          style={{ minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-primary"
                          style={{ flex: 1 }}
                          onClick={handleApproveResolution}
                          disabled={approving || !pendingResolution}
                        >
                          <Icon icon="check" style={{ marginRight: "6px" }} size="14px" />
                          {approving ? 'Approving...' : 'Approve & Close'}
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{ flex: 1 }}
                          onClick={handleRejectResolution}
                          disabled={rejecting || !pendingResolution}
                        >
                          <Icon icon="xmark" style={{ marginRight: "6px" }} size="14px" />
                          {rejecting ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </>
                  )}

                  {actionMode === "none" && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px' }}>
                      Select "Update Case" or "Resolution Approvals" to proceed
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px' }}>
                  Select a case first
                </div>
              )}
            </div>
          </div>



        </div>
      </div>

      {/* Reports table */}
      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <span className="card-title">Reports</span>
          </div>
          <div style={{ padding: '10px 16px 0', display: 'flex', gap: 8 }}>
            <input className="form-input" placeholder="Search cases..." style={{ maxWidth: 260 }} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <select className="form-select" style={{ width: 140 }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_admin_review">Pending Review</option>
              <option value="referred">Referred</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <table className="data-table" style={{ margin: 0 }}>
<thead>
              <tr><th>Case ID</th><th>Type</th><th>Reporter</th><th>Location</th><th>Status</th><th>Priority</th><th>Date Filed</th></tr>
            </thead>
<tbody>
              {filteredReports.map(c => (
                <tr 
                  key={c.id} 
                  onClick={() => handleViewCase(c)}
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: selectedCase?.docId === c.docId ? 'var(--bg-muted)' : 'transparent',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCase?.docId !== c.docId) {
                      e.currentTarget.style.backgroundColor = 'var(--bg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCase?.docId !== c.docId) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <td className="bold">{c.id}</td>
                  <td>{c.type}</td>
                  <td>{c.reporter}</td>
                  <td>{c.location}</td>
                  <td><Badge status={c.status} /></td>
                  <td>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: c.priority === 'urgent' ? '#ffebee' : c.priority === 'high' ? '#fff9c4' : '#e8f5e9',
                      color: c.priority === 'urgent' ? '#c62828' : c.priority === 'high' ? '#f57f17' : '#2e7d32'
                    }}>
                      {c.priority || "normal"}
                    </span>
                  </td>
                  <td>{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
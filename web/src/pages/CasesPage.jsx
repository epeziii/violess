// CasesPage.jsx
import { useState, useEffect } from "react";
import Badge from "./Badge";
import { db } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";

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
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [status, setStatus] = useState("reviewing");
  const [assignedOfficer, setAssignedOfficer] = useState("");
  const [priorityLevel, setPriorityLevel] = useState("normal");
  const [note, setNote] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [notes, setNotes] = useState([
    { by: "Officer Reyes", time: "Feb 12, 11:30 AM", text: "Reviewed initial report. Victim confirmed details. Scheduled follow-up interview for Feb 14." },
    { by: "Social Worker Ana", time: "Feb 13, 9:00 AM", text: "Conducted preliminary assessment. Recommending counseling referral." },
  ]);

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
          createdAt: doc.data().createdAt,
          docId: doc.id,
        }));
        setReports(reportsData);

        // Update selectedCase if it exists and matches a case in the updated reports
        if (selectedCase) {
          const updatedCase = reportsData.find(c => c.docId === selectedCase.docId);
          if (updatedCase) {
            setSelectedCase(updatedCase);
            setStatus(updatedCase.status);
            setAssignedOfficer(updatedCase.assignedOfficer || "");
            setPriorityLevel(updatedCase.priority || "normal");
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
      const caseRef = doc(db, "reports", selectedCase.docId);
      await updateDoc(caseRef, {
        status: status,
        priorityLevel: priorityLevel,
        assignedOfficer: assignedOfficer || "",
        updatedAt: new Date(),
      });
      console.log("Case updated successfully");
      alert("Case updated successfully");
    } catch (error) {
      console.error("Error updating case:", error);
      alert(`Error updating case: ${error.message}`);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>Case Management</h1>
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
                    <div className="form-label">Description</div>
                    <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 12, color: 'var(--text)', lineHeight: 1.6, border: '0.5px solid var(--border)' }}>
                      {selectedCase.description}
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
          {/* Update status */}
          <div className="card">
            <div className="card-header"><span className="card-title">Update Case</span></div>
            <div className="card-body">
              {selectedCase ? (
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
                    <select className="form-select" value={assignedOfficer} onChange={e => setAssignedOfficer(e.target.value)}>
                      <option value="">-- Unassigned --</option>
                      <option value="Officer Reyes">Officer Reyes</option>
                      <option value="Social Worker Ana">Social Worker Ana</option>
                      <option value="Counselor Cruz">Counselor Cruz</option>
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
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px' }}>Select a case to view details</div>
              )}
            </div>
          </div>

          {/* Timeline */}

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
              <tr><th>Case ID</th><th>Type</th><th>Reporter</th><th>Location</th><th>Status</th><th>Priority</th><th>Date Filed</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filteredReports.map(c => (
                <tr key={c.id}>
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
                  <td><button className="btn btn-ghost btn-sm" onClick={() => handleViewCase(c)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
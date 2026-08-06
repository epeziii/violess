// CasesPage.jsx
import { useState, useEffect } from "react";
import Badge from "./Badge";
import { db } from "../firebase";
import { collection, query, orderBy, limit, onSnapshot, where, addDoc, serverTimestamp, getDocs, updateDoc, doc } from "firebase/firestore";
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
  if (status === "pending_admin_review") return "pending_admin_review";
  if (status === "urgent") return "urgent";
  if (status === "resolved") return "resolved";
  if (status === "reviewing") return "reviewing";
  if (status === "referred") return "referred";
  if (status === "closed") return "closed";
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
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [status, setStatus] = useState("reviewing");
  const [assignedOfficer, setAssignedOfficer] = useState("");
  const [assignedOfficerUid, setAssignedOfficerUid] = useState("");
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
  const [pendingResolutionProcessing, setPendingResolutionProcessing] = useState(false);
  const [actionMode, setActionMode] = useState("update"); // default to "update" (settings tab)
  const [evidence, setEvidence] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCase, setReferralCase] = useState(null);
  const [referralCaseId, setReferralCaseId] = useState("");
  const [referralTo, setReferralTo] = useState("Social Worker");
  const [referralReason, setReferralReason] = useState("");
  const currentCaseStatus = status || selectedCase?.status || "pending";

  // Sorting and Pagination states
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);


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
          assignedOfficerUid: doc.data().assignedOfficerUid || "",
          referredTo: doc.data().referredTo || "",
          referralReason: doc.data().referralReason || "",
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
      const q = query(
        collection(db, "referrals"),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const referralsData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: data.caseNumber || data.caseId || doc.id,
            caseId: data.caseId || data.caseNumber || "",
            to: data.referredTo || "",
            status: getStatusFromString(data.status),
            date: formatDate(data.createdAt),
            createdAt: data.createdAt,
            reason: data.reason || "",
            reportDocId: data.reportDocId || "",
            docId: doc.id,
          };
        });
        setReferrals(referralsData);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching referrals:", error);
      setReferrals([]);
    }
  }, []);

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

  const filteredReferrals = referrals.filter((referral) => {
    const searchTerm = searchInput.toLowerCase();
    return !searchTerm ||
      referral.id.toLowerCase().includes(searchTerm) ||
      referral.to.toLowerCase().includes(searchTerm) ||
      referral.status.toLowerCase().includes(searchTerm) ||
      referral.date.toLowerCase().includes(searchTerm);
  });

  const filteredReports = displayReports.filter(c => {
    // Search filter
    const searchTerm = searchInput.toLowerCase();
    const matchesSearch = !searchTerm ||
      c.id.toLowerCase().includes(searchTerm) ||
      c.type.toLowerCase().includes(searchTerm) ||
      c.reporter.toLowerCase().includes(searchTerm) ||
      (c.assignedOfficer || "").toLowerCase().includes(searchTerm);


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

  const handleViewCase = async (caseData) => {
    setSelectedCase(caseData);
    setStatus(caseData.status);
    setAssignedOfficer(caseData.assignedOfficer || "");
    setAssignedOfficerUid(caseData.assignedOfficerUid || "");
    setPriorityLevel(caseData.priority || "normal");

    // If case is referred, fetch referral details
    if (caseData.status === "referred") {
      try {
        const referralsRef = collection(db, "referrals");
        const q = query(referralsRef, where("reportDocId", "==", caseData.docId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const referralData = snap.docs[0].data();
          setSelectedCase(prev => ({
            ...prev,
            referredTo: referralData.referredTo || prev.referredTo || "",
            referralReason: referralData.reason || prev.referralReason || ""
          }));
        } else {
          setSelectedCase(prev => ({
            ...prev,
            referredTo: prev.referredTo || "",
            referralReason: prev.referralReason || ""
          }));
        }
      } catch (error) {
        console.error("Error fetching referral details:", error);
      }
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getPriorityWeight = (priority) => {
    if (priority === "urgent") return 3;
    if (priority === "high") return 2;
    if (priority === "normal") return 1;
    return 0;
  };

  const getStatusWeight = (status) => {
    switch (status) {
      case "urgent": return 5;
      case "pending": return 4;
      case "reviewing": return 3;
      case "referred": return 2;
      case "resolved": return 1;
      case "closed": return 0;
      default: return 0;
    }
  };

  // Sort filtered reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === "date") {
      valA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      valB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
    } else if (sortField === "priority") {
      valA = getPriorityWeight(a.priority);
      valB = getPriorityWeight(b.priority);
    } else if (sortField === "status") {
      valA = getStatusWeight(a.status);
      valB = getStatusWeight(b.status);
    }

    if (valA === valB) return 0;
    if (valA == null) return 1;
    if (valB == null) return -1;

    let comparison = 0;
    if (valA instanceof Date && valB instanceof Date) {
      comparison = valA - valB;
    } else if (typeof valA === "string" && typeof valB === "string") {
      comparison = valA.localeCompare(valB);
    } else {
      comparison = valA > valB ? 1 : -1;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedReports.length / rowsPerPage) || 1;

  // Reset page if it exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [sortedReports.length, rowsPerPage, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, sortedReports.length);
  const paginatedReports = sortedReports.slice(startIndex, startIndex + rowsPerPage);

  const renderSortHeader = (label, field) => {
    const isSorted = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        style={{
          position: "sticky",
          top: 0,
          background: "#FDFAFC",
          zIndex: 10,
          cursor: "pointer",
          userSelect: "none",
          transition: "background-color 0.2s",
          boxShadow: "inset 0 -1.5px 0 var(--border)",
          padding: "10px 16px"
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(194, 24, 91, 0.04)" }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FDFAFC" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>{label}</span>
          <Icon
            icon={isSorted ? (sortDirection === "asc" ? "arrow-up" : "arrow-down") : "sort"}
            size="10px"
            color={isSorted ? "var(--primary)" : "var(--text-muted)"}
            style={{ opacity: isSorted ? 1 : 0.4 }}
          />
        </div>
      </th>
    );
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
          assignedOfficerUid: assignedOfficerUid || "",
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

  // Fetch evidence files and messages from chat
  useEffect(() => {
    if (!selectedCase || !selectedCase.docId) {
      setEvidence([]);
      setMessages([]);
      return;
    }

    try {
      const unsubscribe = onSnapshot(
        collection(db, "messages", selectedCase.docId, "messages"),
        (snapshot) => {
          const evidenceItems = [];
          const messageItems = [];
          snapshot.forEach((doc) => {
            const msg = doc.data();
            messageItems.push({
              id: doc.id,
              from: msg.from,
              text: msg.text,
              reporterName: msg.reporterName,
              fileUrl: msg.fileUrl,
              fileName: msg.fileName,
              timestamp: msg.timestamp
            });
            if (msg.fileUrl && msg.fileName) {
              evidenceItems.push({
                id: doc.id,
                fileName: msg.fileName,
                fileUrl: msg.fileUrl,
                uploadedBy: msg.reporterName,
                timestamp: msg.timestamp
              });
            }
          });
          setMessages(messageItems.sort((a, b) => {
            const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
            const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
            return timeA - timeB;
          }));
          setEvidence(evidenceItems);
        }
      );
      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching evidence and messages:", error);
    }
  }, [selectedCase]);

  // Keep dropdown values from being overwritten while the user is editing.
  const isEditingUpdate = actionMode === "update";

  const handleApproveResolution = async () => {
    if (!selectedCase || !pendingResolution || approving) return;

    try {
      setApproving(true);
      setPendingResolutionProcessing(true);

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

      // Clear pending resolution from UI immediately and update status locally
      setPendingResolution(null);
      setStatus("closed");
      setSelectedCase(prev => prev ? { ...prev, status: "closed" } : prev);
      alert("Resolution approved! Case is now closed.");
      setApprovalComments("");
    } catch (error) {
      console.error("Error approving resolution:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setApproving(false);
      setPendingResolutionProcessing(false);
    }
  };

  const handleRejectResolution = async () => {
    if (!selectedCase || !pendingResolution || rejecting) return;

    try {
      setRejecting(true);
      setPendingResolutionProcessing(true);

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

      // Clear pending resolution from UI immediately and update status locally
      setPendingResolution(null);
      setStatus("reviewing");
      setSelectedCase(prev => prev ? { ...prev, status: "reviewing" } : prev);
      alert("Resolution rejected! Case returned to officer for revision.");
      setApprovalComments("");
    } catch (error) {
      console.error("Error rejecting resolution:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setRejecting(false);
      setPendingResolutionProcessing(false);
    }
  };

  const openReferralModal = () => {
    setReferralCase(selectedCase);
    setReferralTo("Social Worker");
    setReferralReason("");
    setSelectedCase(null);
    setShowReferralModal(true);
  };

  const handleCreateReferral = async () => {
    if (!referralCase) {
      alert("No case selected for referral.");
      return;
    }

    try {
      // Create referral record
      await addDoc(collection(db, "referrals"), {
        caseId: referralCase.id || referralCase.caseId || "",
        caseNumber: referralCase.id || referralCase.caseId || "",
        reportDocId: referralCase.docId || "",
        referredTo: referralTo,
        reason: referralReason,
        status: "reviewing",
        createdAt: serverTimestamp(),
        createdBy: user?.uid || "",
        createdByName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
      });

      // Update case status to "referred" and store the referralTo info
      if (referralCase.docId) {
        const caseDocRef = doc(db, "reports", referralCase.docId);
        await updateDoc(caseDocRef, {
          status: "referred",
          referredTo: referralTo,
          referralReason: referralReason,
          updatedAt: serverTimestamp()
        });
      }

      setShowReferralModal(false);
      setReferralCase(null);
      setReferralTo("Social Worker");
      setReferralReason("");
      setStatus("referred");
      setSelectedCase(prev => prev ? {
        ...prev,
        status: "referred",
        referredTo: referralTo,
        referralReason: referralReason
      } : prev);
      alert("Referral created successfully. Case status updated to Referred.");
    } catch (error) {
      console.error("Error creating referral:", error);
      alert("Failed to create referral.");
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
      {/* Reports table - full width */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title">Reports</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Click a row to view details</span>
        </div>
        <div style={{ padding: '6px 16px 0', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input className="form-input" placeholder="Search cases..." style={{ maxWidth: 220, height: 34 }} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <select className="form-select" style={{ width: 128, height: 34 }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
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
        <div style={{ maxHeight: '420px', overflowY: 'auto', position: 'relative' }}>
          <table className="data-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {renderSortHeader("Case ID", "id")}
                {renderSortHeader("Type", "type")}
                {renderSortHeader("Reporter", "reporter")}
                {renderSortHeader("Assigned/Referred To", "assignedOfficer")}
                {renderSortHeader("Status", "status")}
                {renderSortHeader("Priority", "priority")}
                {renderSortHeader("Date Filed", "date")}
              </tr>
            </thead>
            <tbody>
              {paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    <Icon icon="circle-info" size="24px" color="var(--text-muted)" style={{ marginBottom: 8, display: 'block', marginLeft: 'auto', marginRight: 'auto', opacity: 0.6 }} />
                    No reports match the filter or search criteria.
                  </td>
                </tr>
              ) : (
                paginatedReports.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => handleViewCase(c)}
                    style={{ cursor: 'pointer', backgroundColor: 'transparent', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td className="bold">{c.id}</td>
                    <td>{c.type}</td>
                    <td>{c.reporter}</td>
                    <td>{c.status === 'referred' ? c.referredTo || 'Pending' : (c.assignedOfficer || "Unassigned")}</td>

                    <td><Badge status={c.status} /></td>
                    <td>
                      <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'capitalize', padding: '3px 8px', borderRadius: '12px', backgroundColor: c.priority === 'urgent' ? 'var(--sos-light)' : c.priority === 'high' ? 'var(--warn-light)' : 'var(--safe-light)', color: c.priority === 'urgent' ? 'var(--sos)' : c.priority === 'high' ? 'var(--warn)' : 'var(--safe)', border: `0.5px solid ${c.priority === 'urgent' ? 'rgba(198,40,40,0.2)' : c.priority === 'high' ? 'rgba(230,81,0,0.2)' : 'rgba(0,105,92,0.2)'}`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon icon="flag" size="8px" />
                        {c.priority || "normal"}
                      </span>
                    </td>
                    <td>{c.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '0.5px solid var(--border)', backgroundColor: '#FDFAFC', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Show</span>
            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="form-select" style={{ width: '70px', padding: '4px 8px', height: '30px', fontSize: '12.5px' }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {sortedReports.length > 0 ? `Showing ${startIndex + 1} to ${Math.min(endIndex, sortedReports.length)} of ${sortedReports.length} entries` : 'Showing 0 to 0 of 0 entries'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="btn btn-ghost" style={{ height: '30px', padding: '0 10px', fontSize: '11px', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
              <Icon icon="chevron-left" size="10px" /> Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1).map((page, index, array) => {
              const prevPage = array[index - 1];
              const showEllipsis = prevPage && page - prevPage > 1;
              return (
                <span key={page} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {showEllipsis && <span style={{ padding: '0 4px', fontSize: '12px', color: 'var(--text-muted)' }}>...</span>}
                  <button onClick={() => setCurrentPage(page)} style={{ height: '30px', width: '30px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: '750', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: currentPage === page ? 'var(--primary)' : 'transparent', color: currentPage === page ? '#ffffff' : 'var(--text)', border: currentPage === page ? '1px solid var(--primary)' : '1px solid var(--border)', transition: 'all 0.15s ease' }}>{page}</button>
                </span>
              );
            })}
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="btn btn-ghost" style={{ height: '30px', padding: '0 10px', fontSize: '11px', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
              Next <Icon icon="chevron-right" size="10px" />
            </button>
          </div>
        </div>
      </div>

      {showReferralModal && (
        <div onClick={() => { setShowReferralModal(false); setReferralCase(null); }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,10,20,0.6)', backdropFilter: 'blur(3px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 640, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', border: '0.5px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1.5px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>New Referral</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Create an external referral for {referralCase?.id || 'this case'}</div>
              </div>
              <button onClick={() => { setShowReferralModal(false); setReferralCase(null); }} style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <Icon icon="xmark" size="14px" />
              </button>
            </div>
            <div className="card-body" style={{ padding: '20px 24px' }}>
              <div className="form-group">
                <label className="form-label">Refer to</label>
                <select className="form-select" value={referralTo} onChange={(e) => setReferralTo(e.target.value)}>
                  <option>Social Worker</option>
                  <option>PNP Station</option>
                  <option>DSWD</option>
                  <option>Hospital / Medical</option>
                  <option>Counselor</option>
                  <option>Legal Aid</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Referral</label>
                <textarea className="form-textarea" value={referralReason} onChange={(e) => setReferralReason(e.target.value)} placeholder="Explain why this case is being referred..." />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCreateReferral}>Create Referral</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Combined Case Detail + Agent Actions Modal ── */}
      {selectedCase && !showReferralModal && (
        <div onClick={() => setSelectedCase(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,10,20,0.55)', backdropFilter: 'blur(3px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 920, maxHeight: '90vh', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', border: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 24px', borderBottom: '1.5px solid var(--border)', flexShrink: 0, background: 'linear-gradient(135deg,rgba(194,24,91,0.04) 0%,transparent 60%)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.4 }}>{selectedCase.id} — {selectedCase.type}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge status={selectedCase.status} />
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 12, backgroundColor: selectedCase.priority === 'urgent' ? 'var(--sos-light)' : selectedCase.priority === 'high' ? 'rgba(230,81,0,0.08)' : 'rgba(0,105,92,0.08)', color: selectedCase.priority === 'urgent' ? 'var(--sos)' : selectedCase.priority === 'high' ? 'var(--warn)' : 'var(--safe)', border: `0.5px solid ${selectedCase.priority === 'urgent' ? 'rgba(198,40,40,0.2)' : selectedCase.priority === 'high' ? 'rgba(230,81,0,0.2)' : 'rgba(0,105,92,0.2)'}` }}>
                    <Icon icon="flag" size="9px" style={{ marginRight: 4 }} />{selectedCase.priority || "normal"} Priority
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedCase(null)} style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}>
                <Icon icon="xmark" size="14px" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

              {/* LEFT — Case Details */}
              <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, borderRight: '1px solid var(--border)' }}>
                {showReferralModal ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>External Referral</div>
                    <div style={{ padding: 16, backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-lg)', border: '0.5px solid var(--border)' }}>
                      <div className="form-group">
                        <label className="form-label">Case</label>
                        <select className="form-select" value={referralCaseId} onChange={(e) => setReferralCaseId(e.target.value)}>
                          <option value="">Select a case</option>
                          <option value={selectedCase?.id || '#VIO-000'}>{selectedCase?.id || '#VIO-000'} — {selectedCase?.type || 'Selected case'}</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Refer to</label>
                        <select className="form-select" value={referralTo} onChange={(e) => setReferralTo(e.target.value)}>
                          <option>Social Worker</option>
                          <option>PNP Station</option>
                          <option>DSWD</option>
                          <option>Hospital / Medical</option>
                          <option>Counselor</option>
                          <option>Legal Aid</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Reason for Referral</label>
                        <textarea className="form-textarea" value={referralReason} onChange={(e) => setReferralReason(e.target.value)} placeholder="Explain why this case is being referred..." />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>Case Details</div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, padding: 14, backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-lg)', border: '0.5px solid var(--border)' }}>
                  {[{ icon: 'user', bg: 'var(--primary-light)', color: 'var(--primary)', label: 'Reporter', val: selectedCase.reporter },
                  { icon: 'calendar', bg: 'var(--accent-light)', color: 'var(--accent)', label: 'Date Filed', val: selectedCase.date },
{ icon: 'location-dot', bg: 'var(--sos-light)', color: 'var(--sos)', label: 'Incident Location', val: selectedCase.location },
                  { icon: 'user-tie', bg: 'var(--safe-light)', color: 'var(--safe)', label: selectedCase.status === 'referred' ? 'Referred To' : 'Assigned To', val: selectedCase.status === 'referred' ? (selectedCase.referredTo || 'Pending') : (assignedOfficer || 'Unassigned') }
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}><Icon icon={item.icon} size="13px" /></div>
                      <div><div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', fontWeight: 700 }}>{item.label}</div><div style={{ fontSize: 13, fontWeight: 650, color: 'var(--text)' }}>{item.val}</div></div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, gridColumn: 'span 2' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'var(--warn-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warn)', flexShrink: 0 }}><Icon icon="clock" size="13px" /></div>
                    <div><div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', fontWeight: 700 }}>Date &amp; Time of Incident</div><div style={{ fontSize: 13, fontWeight: 650, color: 'var(--text)' }}>{selectedCase.incidentDateTime || 'Not recorded'}</div></div>
                  </div>
                </div>

                {[{ icon: 'file-lines', accent: selectedCase.priority === 'urgent' ? 'var(--sos)' : 'var(--primary)', label: 'Incident Description', val: selectedCase.description },
                { icon: 'user-secret', accent: 'var(--accent)', label: 'Suspect Description', val: selectedCase.suspectDescription }
                ].map(b => (
                  <div key={b.label} style={{ borderLeft: `4px solid ${b.accent}`, backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', padding: '12px 14px', border: '0.5px solid var(--border)', borderLeftWidth: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}><Icon icon={b.icon} size="12px" color="var(--text-muted)" /><div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>{b.label}</div></div>
                    <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.6 }}>{b.val || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>None provided</span>}</div>
                  </div>
                ))}

                {evidence.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Icon icon="paperclip" size="12px" color="var(--text-muted)" /><div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>Evidence ({evidence.length})</div></div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
                      {evidence.map(file => {
                        const isImage = file.fileName?.match(/\.(jpeg|jpg|gif|png|webp)/i);
                        return (
                          <div key={file.id} style={{ display: 'flex', alignItems: 'center', padding: 10, backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border)', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 6, backgroundColor: isImage ? 'rgba(0,105,92,0.08)' : 'rgba(194,24,91,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isImage ? 'var(--safe)' : 'var(--primary)', flexShrink: 0 }}><Icon icon={isImage ? 'image' : 'file-lines'} size="15px" /></div>
                            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.fileName}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>by {file.uploadedBy || 'System'}</div></div>
                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: 11, height: 'auto', borderRadius: 4, textDecoration: 'none' }}>View</a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {messages.length > 0 && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Icon icon="comments" size="12px" color="var(--text-muted)" /><div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>Communications ({messages.length})</div></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-lg)', padding: 12, border: '0.5px solid var(--border)' }}>
                      {messages.map(msg => {
                        const isReporter = msg.from === 'reporter' || msg.reporterName?.toLowerCase()?.includes('reporter') || msg.reporterName?.toLowerCase()?.includes('anonymous');
                        const msgDate = msg.timestamp?.toDate ? msg.timestamp.toDate() : (msg.timestamp ? new Date(msg.timestamp) : null);
                        return (
                          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 10px', backgroundColor: isReporter ? 'rgba(194,24,91,0.02)' : 'rgba(0,105,92,0.02)', borderRadius: 8, border: `0.5px solid ${isReporter ? 'rgba(194,24,91,0.08)' : 'rgba(0,105,92,0.08)'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: isReporter ? 'var(--primary-light)' : 'var(--safe-light)', color: isReporter ? 'var(--primary)' : 'var(--safe)', textTransform: 'uppercase' }}>{isReporter ? 'Reporter' : 'Officer'}: {msg.reporterName}</span>
                              {msgDate && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!showReferralModal && currentCaseStatus !== 'referred' ? (
                  <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 4 }} onClick={openReferralModal}>
                    <Icon icon="right-from-bracket" size="12px" /> Refer External Case
                  </button>
                ) : null}
              </>
            )}
              </div>

              {/* RIGHT — Agent Actions */}
              <div style={{ width: 290, flexShrink: 0, padding: '20px 20px', display: showReferralModal ? 'none' : 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 12 }}>Agent Actions</div>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16, gap: 12 }}>
                  {(currentCaseStatus === 'referred' ? 
                    [{ key: 'update', icon: 'pen-to-square', label: 'Settings' }, { key: 'resolution', icon: 'message-lines', label: 'Reason for Referral' }]
                    : [{ key: 'update', icon: 'pen-to-square', label: 'Settings' }, { key: 'resolution', icon: 'circle-check', label: 'Resolution' }]
                  ).map(tab => (
                    <button key={tab.key} onClick={() => setActionMode(tab.key)} style={{ padding: '10px 4px', background: 'none', border: 'none', borderBottom: actionMode === tab.key ? '2.5px solid var(--primary)' : '2.5px solid transparent', color: actionMode === tab.key ? 'var(--primary)' : 'var(--text-muted)', fontWeight: actionMode === tab.key ? 700 : 500, cursor: 'pointer', fontSize: 12.5, transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon icon={tab.icon} size="12px" />{tab.label}
                      {tab.key === 'resolution' && currentCaseStatus !== 'referred' && pendingResolution && !pendingResolutionProcessing && <span style={{ width: 8, height: 8, backgroundColor: 'var(--sos)', borderRadius: '50%', display: 'inline-block' }} />}
                    </button>
                  ))}
                </div>

                {pendingResolution && !pendingResolutionProcessing && actionMode !== 'resolution' && (
                  <div style={{ backgroundColor: 'var(--sos-light)', border: '0.5px solid rgba(198,40,40,0.2)', color: 'var(--sos)', borderRadius: 'var(--radius-md)', padding: '10px 12px', fontSize: 11, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Icon icon="circle-exclamation" size="13px" /><span>Pending resolution available</span>
                    <button onClick={() => setActionMode('resolution')} style={{ marginLeft: 'auto', background: 'var(--sos)', color: 'white', border: 'none', padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>View</button>
                  </div>
                )}

                {actionMode === 'update' && (
                  <>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}><Icon icon="circle-info" size="11px" style={{ marginRight: 4 }} />Change Case Status</label>
                      <div>
                        <select className="form-select" value={status === 'referred' ? 'referred' : status} onChange={e => setStatus(e.target.value)} style={{ fontSize: 12.5 }}>
                          <option value="pending">Pending</option>
                          <option value="reviewing">Under Review</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Case Closed</option>
                          {status === 'referred' && <option value="referred">Referred</option>}
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
<label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}><Icon icon="user-shield" size="11px" style={{ marginRight: 4 }} />Assign Officer</label>
                      <select className="form-select" value={status === 'referred' ? selectedCase?.referredTo || assignedOfficer : assignedOfficer} onChange={e => status === 'referred' ? null : setAssignedOfficer(e.target.value)} disabled={status === 'pending' || status === 'referred'} style={status === 'pending' || status === 'referred' ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: 'var(--bg)', fontSize: 12.5 } : { fontSize: 12.5 }}>
                        <option value="">-- Unassigned --</option>
                        {officers.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                      </select>
                      {status === 'pending' && <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>Change status first to assign</div>}
                      {status === 'referred' && <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>Case referred - cannot reassign</div>}
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}><Icon icon="triangle-exclamation" size="11px" style={{ marginRight: 4 }} />Priority Level</label>
                      <select className="form-select" value={priorityLevel} onChange={e => setPriorityLevel(e.target.value)} style={{ fontSize: 12.5 }}>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleSaveChanges}>
                      <Icon icon="floppy-disk" size="13px" /> Save Changes
                    </button>
                  </>
                )}

                {actionMode === 'resolution' && (
                  currentCaseStatus === 'referred' ? (
                    <div style={{ color: 'var(--text)', fontSize: 12.5, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 14, padding: '12px 14px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border)' }}>
                        <div style={{ fontSize: 12.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{selectedCase?.referralReason || 'Not specified'}</div>
                      </div>
                    </div>
                  ) : (
                    (!pendingResolution || pendingResolutionProcessing) ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: 12.5, textAlign: 'center', padding: '30px 20px', lineHeight: 1.5 }}>
                        <Icon icon="circle-check" size="28px" color="var(--text-muted)" style={{ marginBottom: 10, display: 'block', marginLeft: 'auto', marginRight: 'auto', opacity: 0.5 }} />
                        {pendingResolutionProcessing ? 'Processing action... please wait.' : 'No pending resolution request.'}<br />Resolutions are submitted by the assigned officer.
                      </div>
                    ) : (
                      <>
                        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, backgroundColor: 'var(--bg)', padding: '10px 12px', borderRadius: 8, border: '0.5px solid var(--border)' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--safe-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--safe)', flexShrink: 0 }}><Icon icon="user-check" size="12px" /></div>
                          <div>
                            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', fontWeight: 700 }}>Submitted By</div>
                            <div style={{ fontSize: 12.5, fontWeight: 650, color: 'var(--text)' }}>{pendingResolution.submittedByName}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{pendingResolution.submittedAt?.toDate ? pendingResolution.submittedAt.toDate().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'N/A'}</div>
                          </div>
                        </div>
                        <div style={{ marginBottom: 14, padding: '12px 14px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border)' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 6 }}>Officer's Summary</div>
                          <div style={{ fontSize: 12.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>{pendingResolution.notes}</div>
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>Review Comments (Optional)</label>
                          <textarea className="form-input" placeholder="Feedback or reasons for rejection..." value={approvalComments} onChange={(e) => setApprovalComments(e.target.value)} style={{ minHeight: 70, resize: 'vertical', fontFamily: 'inherit', fontSize: 12.5 }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button className="btn btn-primary" style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={handleApproveResolution} disabled={approving}>
                            <Icon icon="check" size="14px" />{approving ? 'Approving...' : 'Approve & Close'}
                          </button>
                          <button className="btn btn-ghost" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--sos)', backgroundColor: 'var(--sos-light)', border: '0.5px solid rgba(198,40,40,0.2)' }} onClick={handleRejectResolution} disabled={rejecting}>
                            <Icon icon="xmark" size="14px" />{rejecting ? 'Rejecting...' : 'Reject'}
                          </button>
                        </div>
                      </>
                    )
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
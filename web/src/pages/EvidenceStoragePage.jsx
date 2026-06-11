import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, getDoc, doc } from 'firebase/firestore';
import '../styles/EvidenceStorage.css';
import Icon from '../components/Icon';

const ROLE_LABELS = { admin: 'Admin', officer: 'Officer' };
const ROLE_CLASSES = { admin: 'badge-admin', officer: 'badge-officer' };
const AVATAR_COLOR = {
  pink: 'av-pink',
  blue: 'av-blue',
  green: 'av-green',
  purple: 'av-purple',
  amber: 'av-amber',
};



export default function EvidenceStoragePage() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [evidence, setEvidence] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const isAdmin = user?.role === 'admin';

  // Fetch cases based on role
  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribe;
    let officerUnsubscribed = false;

    const run = async () => {
      let q;

      if (isAdmin) {
        q = query(collection(db, 'reports'));
      } else {
        // EvidenceStorage expects `assignedOfficer` to be stored as the officer full name ("First Last"),
        // but this UI previously compared it to the officer UID.
        // Fix: resolve the staff full name then query by that.
        const staffSnap = await getDoc(doc(db, 'staff', user.uid));
        if (!staffSnap.exists) {
          setCases([]);
          setLoading(false);
          return;
        }

        const staff = staffSnap.data();
        const officerFullName = `${staff.firstName || ''} ${staff.lastName || ''}`.trim();

        q = query(collection(db, 'reports'), where('assignedOfficer', '==', officerFullName));
      }

      unsubscribe = onSnapshot(q, (snapshot) => {
        if (officerUnsubscribed) return;
        const casesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCases(casesList);
        if (casesList.length > 0 && !selectedCaseId) {
          setSelectedCaseId(casesList[0].id);
        }
        setLoading(false);
      });
    };

    run().catch((e) => {
      console.error('Failed to fetch evidence storage cases:', e);
      setLoading(false);
    });

    return () => {
      officerUnsubscribed = true;
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid, isAdmin, selectedCaseId]);

  // Fetch evidence for selected case
  useEffect(() => {
    if (!selectedCaseId) {
      setEvidence([]);
      return;
    }

    setSelectedFilter('all');
    const caseDoc = cases.find(c => c.id === selectedCaseId);
    if (caseDoc?.evidence) {
      setEvidence(caseDoc.evidence);
    }
  }, [selectedCaseId, cases, isAdmin]);

  // Fetch access logs for admin
  useEffect(() => {
    if (!isAdmin) return;

    const logsQuery = query(
      collection(db, 'access_logs'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setAccessLogs(logs);
    });

    return unsubscribe;
  }, [isAdmin]);


  const logAccess = async ({ caseDocId, caseId, action }) => {
    try {
      await addDoc(collection(db, 'access_logs'), {
        adminId: user.uid,
        caseId,
        caseDocId,
        timestamp: serverTimestamp(),
        action,
      });
    } catch (err) {
      console.error('Error logging access:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCaseId) return;

    setUploading(true);
    try {
      // TODO: Upload file to Cloudinary and add to evidence array
      console.log('Uploading file:', file.name);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  const getFilteredEvidence = () => {
    if (!selectedCase?.evidence) return [];

    switch (selectedFilter) {
      case 'photo':
        return selectedCase.evidence.filter(f => f.resourceType === 'image');
      case 'doc':
        return selectedCase.evidence.filter(f => f.resourceType === 'raw');
      case 'video':
        return selectedCase.evidence.filter(f => f.resourceType === 'video');
      default:
        return selectedCase.evidence;
    }
  };

  const filteredEvidence = getFilteredEvidence();

  if (loading) {
    return <div className="evidence-page loading">Loading...</div>;
  }

  return (
    <div className="evidence-page">
      {/* Main Content */}
      <div className="evidence-main">
        {/* Evidence Storage Card - Two Column Layout */}
        <div className="card evidence-card" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'row' }}>
          {/* Left Side - Case List */}
          <div className="card-cases-panel">
            <div className="sidebar-header">
              <h3>Evidence storage</h3>
              <span className="case-count">{cases.length}</span>
            </div>
            <div className="select-case-text">Select a case to view files</div>

            {/* Search Input */}
            <div className="search-cases-wrapper">
              <input
                type="text"
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-cases-input"
              />
              <i className="fas fa-search"></i>
            </div>

            <div className="case-list">
              {cases
                .filter((caseItem) => {
                  const q = (searchQuery || '').trim().toLowerCase();
                  if (!q) return true;

                  const caseId = (caseItem?.caseId || '').toString().toLowerCase();
                  const incidentType = (caseItem?.incidentType || '').toString().toLowerCase();
                  const reporter = (caseItem?.reporterName || caseItem?.reporter || '').toString().toLowerCase();
                  const assigned = (caseItem?.assignedOfficerName || caseItem?.assignedOfficer || '').toString().toLowerCase();

                  const createdAt = caseItem?.createdAt;
                  let filedText = '';
                  try {
                    if (createdAt) {
                      const d = createdAt?.toDate?.() || createdAt;
                      if (d) {
                        filedText = new Date(d).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        }).toLowerCase();
                      }
                    }
                  } catch {
                    filedText = '';
                  }

                  const fullText = `${caseId} ${incidentType} ${reporter} ${assigned} ${filedText}`;
                  return fullText.includes(q);
                })
                .map(caseItem => (
                <div
                  key={caseItem.id}
                  className={`case-item ${selectedCaseId === caseItem.id ? 'active' : ''}`}
                  onClick={() => setSelectedCaseId(caseItem.id)}
                >
                  <div className="case-item-header">
                    <div>
                      <div className="case-id">{caseItem.caseId}</div>
                      <div className="case-type">{caseItem.incidentType}</div>
                    </div>
                    <div className="file-badge">{caseItem.evidence?.length || 0}</div>
                  </div>
                  <div className="case-meta">
                    <span className="meta-label">Filed:</span>
                    <span className="meta-value">
                      {caseItem.createdAt ? new Date(caseItem.createdAt.toDate?.() || caseItem.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A'}
                    </span>
                  </div>
                  <div className="case-meta">
                    <span className="meta-label">Reporter:</span>
                    <span className="meta-value">{caseItem.reporterName || caseItem.reporter || 'N/A'}</span>
                  </div>
                  <div className="case-meta">
                    <span className="meta-label">Assigned:</span>
                    <span className="meta-value">{caseItem.assignedOfficerName || caseItem.assignedOfficer || 'Unassigned'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Evidence Content */}
          <div className="card-content-panel">
            {selectedCase ? (
              <div className="card-header">
                <div className="card-header-content">
                  <span className="card-title">{selectedCase.caseId} — {selectedCase.incidentType}</span>
                  <span className="file-info">{selectedCase.evidence?.length || 0} files · Secure encrypted storage</span>
                </div>
                <label className="upload-btn" style={{ marginLeft: 'auto' }}>
                  <input type="file" onChange={handleFileUpload} disabled={uploading} />
                  <i className="fas fa-upload"></i>
                  {uploading ? 'Uploading...' : 'Upload file'}
                </label>
              </div>
            ) : (
              <div className="card-header">
                <span className="card-title">Evidence storage</span>
                <label className="upload-btn" style={{ marginLeft: 'auto' }}>
                  <input type="file" onChange={handleFileUpload} disabled={uploading} />
                  <i className="fas fa-upload"></i>
                  {uploading ? 'Uploading...' : 'Upload file'}
                </label>
              </div>
            )}

            <div style={{ padding: '16px' }}>
              {selectedCase ? (
                <>
                  {/* File Filters */}
                  <div className="file-filters">
                    <button
                      className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedFilter('all')}
                    >
                      All ({selectedCase.evidence?.length || 0})
                    </button>
                    <button
                      className={`filter-btn ${selectedFilter === 'photo' ? 'active' : ''}`}
                      onClick={() => setSelectedFilter('photo')}
                    >
                      Photo ({selectedCase.evidence?.filter(f => f.resourceType === 'image').length || 0})
                    </button>
                    <button
                      className={`filter-btn ${selectedFilter === 'doc' ? 'active' : ''}`}
                      onClick={() => setSelectedFilter('doc')}
                    >
                      Doc ({selectedCase.evidence?.filter(f => f.resourceType === 'raw').length || 0})
                    </button>
                    <button
                      className={`filter-btn ${selectedFilter === 'video' ? 'active' : ''}`}
                      onClick={() => setSelectedFilter('video')}
                    >
                      Video ({selectedCase.evidence?.filter(f => f.resourceType === 'video').length || 0})
                    </button>
                  </div>

                  {/* File Grid */}
                  <div className="file-grid">
                    {filteredEvidence && filteredEvidence.length > 0 ? (
                      filteredEvidence.map((file, idx) => (
                        <FileCard key={idx} file={file} caseDocId={selectedCaseId} caseId={selectedCase.caseId} onAccess={logAccess} />
                      ))
                    ) : (
                      <div className="empty-state">
                        <p>No {selectedFilter !== 'all' ? selectedFilter : 'evidence'} files for this case</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <p>Select a case from the left to view files</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Access Logs Card - Below Evidence Storage */}
        {isAdmin && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Access Logs</span>
            </div>
            <div className="logs-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Staff member</th>
                    <th>Role</th>
                    <th>Case</th>
                    <th>Action</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {accessLogs.length > 0 ? (
                    accessLogs.map((log) => (
                      <AccessLogRow key={log.id} log={log} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No access logs yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function formatAction(action) {
  if (!action) return '—';
  const str = String(action);

  // Show full text for shorter values.
  // For long values, show: previewed_3ec9...8df7.webp
  // (still full value in tooltip)
  const compactThresholdLen = 55;
  if (str.length <= compactThresholdLen) return str;

  const extMatch = str.match(/\.(webp|jpg|jpeg|png|gif|mp4|mov|mkv)$/i);
  const ext = extMatch ? extMatch[0] : '';
  const base = ext ? str.slice(0, -ext.length) : str;

  const prefixLen = 20;
  const suffixLen = ext ? 4 : 6;

  if (base.length <= prefixLen + suffixLen) return str;

  const prefix = base.slice(0, prefixLen);
  const suffix = base.slice(-suffixLen);
  return `${prefix}...${suffix}${ext}`;
}


function AccessLogRow({ log }) {
  const [staff, setStaff] = useState(null);

  const formatAccessTimestamp = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp?.toDate?.() || timestamp);
    // Desired format example: Jun 10, 2026, 12:09 PM
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };


  useEffect(() => {
    let mounted = true;

    const fetchStaff = async () => {
      if (!log?.adminId) return;
      try {
        const staffRef = doc(db, 'staff', log.adminId);
        const staffSnap = await getDoc(staffRef);
        if (!mounted) return;
        if (staffSnap.exists()) {
          setStaff({ id: staffSnap.id, ...staffSnap.data() });
        } else {
          setStaff(null);
        }
      } catch (e) {
        console.error('Failed to fetch staff for access log:', e);
        if (mounted) setStaff(null);
      }
    };

    fetchStaff();
    return () => {
      mounted = false;
    };
  }, [log?.adminId]);

  const initials = staff
    ? `${(staff.firstName || '').charAt(0)}${(staff.lastName || '').charAt(0)}`.toUpperCase()
    : '';

  const role = staff?.role;
  const roleLabel = role ? ROLE_LABELS[role] || role : '—';
  const roleClass = role ? ROLE_CLASSES[role] || '' : '';

  return (
    <tr>
      <td>
        {staff ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className={`staff-avatar ${AVATAR_COLOR[staff.color] || 'av-pink'}`}
              style={{ opacity: staff.status !== 'active' ? 0.45 : 1 }}
            >
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: staff.status !== 'active' ? 'var(--text-muted)' : 'var(--text)' }}>
                {staff.firstName} {staff.lastName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                {staff.email}
              </div>
            </div>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>Unknown staff</span>
        )}
      </td>
      <td>
        <span className={`badge ${roleClass}`}>{roleLabel}</span>
      </td>
      <td className="bold">{log.caseId}</td>
      <td className="action-cell" title={log.action}>{formatAction(log.action)}</td>
      <td>{formatAccessTimestamp(log.timestamp)}</td>
    </tr>
  );
}

function FileCard({ file, onAccess, caseDocId, caseId }) {
  const getFileIcon = (resourceType) => {
    if (resourceType === 'image') return 'fas fa-image';
    if (resourceType === 'video') return 'fas fa-video';
    return 'fas fa-file';
  };

  const getFileTypeBadge = (resourceType) => {
    if (resourceType === 'image') return 'Photo';
    if (resourceType === 'video') return 'Video';
    return 'Doc';
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.toDate?.() || timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    if (bytes === undefined || bytes === null || Number.isNaN(Number(bytes))) return '';

    const n = Number(bytes);
    const mb = n / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = n / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  const handlePreview = async () => {
    if (file.url) {
      window.open(file.url, '_blank');
    }

    if (typeof onAccess === 'function') {
      const fileName = file?.name ? String(file.name) : 'unknown_file';
      await onAccess({
        caseDocId,
        caseId,
        action: `previewed_${fileName}`,
      });
    }
  };

  const handleDownload = async () => {
    if (!file.url) return;
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (typeof onAccess === 'function') {
        const fileName = file?.name ? String(file.name) : 'unknown_file';
        await onAccess({
          caseDocId,
          caseId,
          action: `downloaded_${fileName}`,
        });
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="file-card">
      <div className="file-icon">
        <i className={getFileIcon(file.resourceType)}></i>
      </div>
      <div className="file-name">{file.name}</div>
      <div className="file-meta">
        <span className="file-size">
          {(() => {
            const bytes = file.size ?? file.bytes ?? file.fileSize ?? file.contentLength;
            return formatSize(bytes);
          })()}
        </span>
        <span className="file-date">{formatDate(file.uploadedAt)}</span>
      </div>
      <div className="file-type-badge">{getFileTypeBadge(file.resourceType)}</div>
      <div className="file-actions">
        <button className="action-btn" title="Download" onClick={handleDownload}><i className="fas fa-download"></i></button>
        <button className="action-btn" title="Preview" onClick={handlePreview}><i className="fas fa-eye"></i></button>
      </div>
    </div>
  );
}

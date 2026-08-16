import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import API_BASE_URL from '../config/api';
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
  const [accessLogSearch, setAccessLogSearch] = useState('');
  const [accessLogRoleFilter, setAccessLogRoleFilter] = useState('all');
  const [accessLogCurrentPage, setAccessLogCurrentPage] = useState(1);
  const [accessLogRowsPerPage, setAccessLogRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const isAdmin = user?.role === 'admin';

  // Fetch all cases from the backend so the list includes cases even when they have no evidence.
  useEffect(() => {
    if (!user?.uid) return;

    let active = true;

    const fetchCases = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/all-cases`);
        const data = await response.json();

        if (!active) return;

        if (data?.success && Array.isArray(data.cases)) {
          const casesList = data.cases.map((item) => ({
            id: item.id || item.caseId || item.caseNumber || item.case_number,
            ...item,
            caseId: item.caseId || item.caseNumber || item.case_number || 'N/A',
            incidentType: item.incidentType || item.type || 'General',
            reporterName: item.reporterName || item.reporter || 'Anonymous',
            evidence: Array.isArray(item.evidence) ? item.evidence : [],
            assignedOfficer: item.assignedOfficer || item.assignedOfficerName || 'Unassigned',
          }));

          setCases(casesList);
          if (casesList.length > 0 && !selectedCaseId) {
            setSelectedCaseId(casesList[0].id);
          }
          if (casesList.length === 0) {
            setSelectedCaseId(null);
          }
        } else {
          setCases([]);
          setSelectedCaseId(null);
        }
      } catch (error) {
        console.error('Failed to fetch evidence storage cases:', error);
        if (active) {
          setCases([]);
          setSelectedCaseId(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCases();

    return () => {
      active = false;
    };
  }, [user?.uid]);

  // Use the backend case payload directly; a case should remain in the list even when evidence is empty.
  useEffect(() => {
    if (!selectedCaseId) {
      setEvidence([]);
      return;
    }

    setSelectedFilter('all');
    const caseDoc = cases.find((c) => c.id === selectedCaseId);
    const allEvidence = Array.isArray(caseDoc?.evidence) ? caseDoc.evidence.map((file) => ({
      ...file,
      resourceType: file.resourceType || (file.name || file.url || '').match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : (file.name || file.url || '').match(/\.(mp4|mov|avi|mkv)$/i) ? 'video' : 'document',
    })) : [];

    setEvidence(allEvidence);
  }, [selectedCaseId, cases]);

  const fetchAccessLogs = async () => {
    if (!isAdmin) {
      setAccessLogs([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/access-logs`);
      const data = await response.json();
      setAccessLogs(Array.isArray(data?.logs) ? data.logs : []);
    } catch (error) {
      console.error('Failed to load access logs:', error);
      setAccessLogs([]);
    }
  };

  useEffect(() => {
    fetchAccessLogs();
  }, [isAdmin]);

  const filteredAccessLogs = accessLogs.filter((log) => {
    const searchValue = accessLogSearch.trim().toLowerCase();
    const caseId = (log.caseId || '').toString().toLowerCase();
    const action = (log.action || '').toString().toLowerCase();
    const roleMatch = accessLogRoleFilter === 'all' || (log.role || '').toLowerCase() === accessLogRoleFilter;

    if (!searchValue) {
      return roleMatch;
    }

    const formatLogTimestamp = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp?.toDate?.() || timestamp);
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const staffName = (log.adminName || '').toString().toLowerCase();
    const roleText = (log.role || '').toString().toLowerCase();
    const timestampText = formatLogTimestamp(log.timestamp).toString().toLowerCase();
    const searchable = [caseId, action, staffName, (log.adminEmail || '').toString().toLowerCase(), roleText, timestampText].join(' ');
    return roleMatch && searchable.includes(searchValue);
  });

  const accessLogTotalPages = Math.max(1, Math.ceil(filteredAccessLogs.length / accessLogRowsPerPage));
  const accessLogStartIndex = (accessLogCurrentPage - 1) * accessLogRowsPerPage;
  const accessLogEndIndex = Math.min(accessLogStartIndex + accessLogRowsPerPage, filteredAccessLogs.length);
  const paginatedAccessLogs = filteredAccessLogs.slice(accessLogStartIndex, accessLogEndIndex);

  const formatActionLabel = (log) => {
    if (!log?.action) return 'Viewed';
    const action = String(log.action);
    if (action.startsWith('previewed_')) return 'Previewed';
    if (action.startsWith('downloaded_')) return 'Downloaded';
    return action;
  };

  const logRoleOptions = [
    { value: 'all', label: 'All roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'officer', label: 'Officer' },
  ];

  const logSearchPlaceholder = 'Search by staff, case, or action...';

  const handleAccessLogSearchChange = (value) => {
    setAccessLogSearch(value);
    setAccessLogCurrentPage(1);
  };

  const handleAccessLogRoleFilterChange = (value) => {
    setAccessLogRoleFilter(value);
    setAccessLogCurrentPage(1);
  };


  const logAccess = async ({ caseDocId, caseId, action, fileName }) => {
    if (!user?.uid || !caseId || !action) return;

    const fullName = user.fullName || user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Staff Member';

    try {
      const response = await fetch(`${API_BASE_URL}/log-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.uid,
          adminName: fullName,
          fullName,
          adminEmail: user.email || '',
          role: user.role || 'admin',
          caseId,
          caseDocId,
          fileName,
          action,
        }),
      });

      if (response.ok) {
        await fetchAccessLogs();
      }
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
    if (!evidence || evidence.length === 0) return [];

    switch (selectedFilter) {
      case 'photo':
        return evidence.filter(f => f.resourceType === 'image');
      case 'doc':
        return evidence.filter(f => f.resourceType === 'raw' || f.resourceType === 'document');
      case 'video':
        return evidence.filter(f => f.resourceType === 'video');
      default:
        return evidence;
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
                  <span className="file-info">{evidence?.length || 0} files · Secure encrypted storage</span>
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
                      All ({evidence?.length || 0})
                    </button>
                    <button
                      className={`filter-btn ${selectedFilter === 'photo' ? 'active' : ''}`}
                      onClick={() => setSelectedFilter('photo')}
                    >
                      Photo ({evidence?.filter(f => f.resourceType === 'image').length || 0})
                    </button>
                    <button
                      className={`filter-btn ${selectedFilter === 'doc' ? 'active' : ''}`}
                      onClick={() => setSelectedFilter('doc')}
                    >
                      Doc ({evidence?.filter(f => f.resourceType === 'raw' || f.resourceType === 'document').length || 0})
                    </button>
                    <button
                      className={`filter-btn ${selectedFilter === 'video' ? 'active' : ''}`}
                      onClick={() => setSelectedFilter('video')}
                    >
                      Video ({evidence?.filter(f => f.resourceType === 'video').length || 0})
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
            <div style={{ padding: '6px 16px 0', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input className="form-input" placeholder={logSearchPlaceholder} style={{ maxWidth: 220, height: 34 }} value={accessLogSearch} onChange={(e) => handleAccessLogSearchChange(e.target.value)} />
              <select className="form-select" style={{ width: 128, height: 34 }} value={accessLogRoleFilter} onChange={(e) => handleAccessLogRoleFilterChange(e.target.value)}>
                {logRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
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
                  {paginatedAccessLogs.length > 0 ? (
                    paginatedAccessLogs.map((log) => (
                      <AccessLogRow key={log.id} log={log} formatActionLabel={formatActionLabel} />
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderTop: '0.5px solid var(--border)', backgroundColor: '#FDFAFC', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>Show</span>
                <select
                  value={accessLogRowsPerPage}
                  onChange={(e) => { setAccessLogRowsPerPage(Number(e.target.value)); setAccessLogCurrentPage(1); }}
                  className="form-select"
                  style={{ width: 70, padding: '4px 8px', height: 30, fontSize: 12.5 }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {filteredAccessLogs.length > 0 ? `Showing ${accessLogStartIndex + 1} to ${accessLogEndIndex} of ${filteredAccessLogs.length} entries` : 'Showing 0 to 0 of 0 entries'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => setAccessLogCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={accessLogCurrentPage === 1}
                  className="btn btn-ghost"
                  style={{ height: 30, padding: '0 10px', fontSize: 11, opacity: accessLogCurrentPage === 1 ? 0.5 : 1, cursor: accessLogCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Prev
                </button>

                <div style={{ minWidth: 88, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                  {filteredAccessLogs.length > 0 ? `Page ${accessLogCurrentPage} of ${accessLogTotalPages}` : 'Page 0 of 0'}
                </div>

                <button
                  onClick={() => setAccessLogCurrentPage(prev => Math.min(prev + 1, accessLogTotalPages))}
                  disabled={accessLogCurrentPage === accessLogTotalPages}
                  className="btn btn-ghost"
                  style={{ height: 30, padding: '0 10px', fontSize: 11, opacity: accessLogCurrentPage === accessLogTotalPages ? 0.5 : 1, cursor: accessLogCurrentPage === accessLogTotalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
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


function AccessLogRow({ log, formatActionLabel }) {
  const formatAccessTimestamp = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp?.toDate?.() || timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const rawName = log.fullName || log.adminName || log.adminEmail || 'Unknown staff';
  const adminDisplayName = typeof rawName === 'string' && rawName.includes('@') ? 'Unknown staff' : (rawName || 'Unknown staff').trim() || 'Unknown staff';
  const normalizedRole = (log.role || '').toString().toLowerCase();
  const roleLabel = normalizedRole ? ROLE_LABELS[normalizedRole] || log.role : '—';
  const roleClass = normalizedRole ? ROLE_CLASSES[normalizedRole] || '' : '';
  const normalizedAction = formatActionLabel ? formatActionLabel(log) : 'Viewed';
  const fileLabel = log.fileName ? String(log.fileName) : 'Evidence file';
  const actionTitle = log.action ? String(log.action) : normalizedAction;

  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className={`staff-avatar ${AVATAR_COLOR.pink}`} style={{ opacity: 1 }}>
            {adminDisplayName
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'US'}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{adminDisplayName}</div>
          </div>
        </div>
      </td>
      <td>
        <span className={`badge ${roleClass}`}>{roleLabel}</span>
      </td>
      <td className="bold" title={log.caseId || '—'}>{log.caseId || '—'}</td>
      <td className="action-cell" title={actionTitle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span>{normalizedAction}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{fileLabel}</span>
        </div>
      </td>
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
        fileName,
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
          fileName,
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

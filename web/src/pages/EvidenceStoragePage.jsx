import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import '../styles/EvidenceStorage.css';
import Icon from '../components/Icon';

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

    let q;
    if (isAdmin) {
      q = query(collection(db, 'reports'));
    } else {
      q = query(collection(db, 'reports'), where('assignedOfficer', '==', user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
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

    return unsubscribe;
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

      if (isAdmin) {
        logAccess(selectedCaseId, caseDoc.caseId);
      }
    }
  }, [selectedCaseId, cases, isAdmin]);

  // Fetch access logs for admin
  useEffect(() => {
    if (!isAdmin) return;

    const { orderBy } = require('firebase/firestore');
    const logsQuery = query(collection(db, 'access_logs'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAccessLogs(logs);
    });

    return unsubscribe;
  }, [isAdmin]);

  const logAccess = async (caseDocId, caseId) => {
    try {
      await addDoc(collection(db, 'access_logs'), {
        adminId: user.uid,
        caseId,
        caseDocId,
        timestamp: serverTimestamp(),
        action: 'viewed_evidence',
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
        <div className="card" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'row' }}>
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
                .filter(caseItem =>
                  caseItem.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  caseItem.incidentType.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(caseItem => (
                <div
                  key={caseItem.id}
                  className={`case-item ${selectedCaseId === caseItem.id ? 'active' : ''}`}
                  onClick={() => setSelectedCaseId(caseItem.id)}
                >
                  <div className="case-id">{caseItem.caseId}</div>
                  <div className="case-type">{caseItem.incidentType}</div>
                  <div className="file-badge">{caseItem.evidence?.length || 0}</div>
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
                        <FileCard key={idx} file={file} />
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
                    <th>Admin</th>
                    <th>Case</th>
                    <th>Action</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {accessLogs.length > 0 ? (
                    accessLogs.map(log => (
                      <tr key={log.id}>
                        <td>{log.adminId}</td>
                        <td className="bold">{log.caseId}</td>
                        <td>{log.action}</td>
                        <td>{new Date(log.timestamp?.toDate?.() || log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
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

function FileCard({ file }) {
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
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp.toDate?.() || timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  const handlePreview = () => {
    if (file.url) {
      window.open(file.url, '_blank');
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
        <span className="file-size">{formatSize(file.size)}</span>
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

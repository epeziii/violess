// EvidencePage.jsx
import { useState, useEffect } from "react";
import API_BASE_URL from "../config/api";

export default function EvidencePage() {
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [accessLog, setAccessLog] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        setLoading(true);
        console.log("[EvidencePage] Fetching from:", `${API_BASE_URL}/all-cases`);
        const res = await fetch(`${API_BASE_URL}/all-cases`);
        const data = await res.json();
        console.log("[EvidencePage] Response:", data);

        if (data.success && data.cases) {
          console.log("[EvidencePage] Found", data.cases.length, "cases");
          // Collect all evidence files from all cases
          const allEvidence = [];
          data.cases.forEach(caseData => {
            console.log("[EvidencePage] Case:", caseData.caseId, "Evidence:", caseData.evidence);
            if (caseData.evidence && Array.isArray(caseData.evidence)) {
              caseData.evidence.forEach(file => {
                allEvidence.push({
                  ...file,
                  caseId: caseData.caseId,
                  caseType: caseData.type,
                });
              });
            }
          });
          console.log("[EvidencePage] Total evidence files:", allEvidence.length);
          setEvidenceFiles(allEvidence);
        } else {
          console.log("[EvidencePage] No cases returned");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching evidence:", error);
        setEvidenceFiles([]);
        setLoading(false);
      }
    };

    fetchEvidence();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>Evidence Storage</h1>
      </div>

      {/* Secure File Storage */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Secure File Storage</span>
          <button className="btn btn-primary btn-sm">Upload File</button>
        </div>
        <div style={{ padding: '10px 16px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['all', 'photos', 'documents', 'videos', 'medical'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
              style={{ textTransform: 'capitalize' }}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="evid-grid">
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 14 }}>Loading evidence files...</p>
            </div>
          ) : evidenceFiles.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 14 }}>No evidence files uploaded yet. Files will appear here when cases include evidence attachments.</p>
            </div>
          ) : (
            evidenceFiles.map(f => {
              const getFileType = (name) => {
                if (name.match(/\.(jpg|jpeg|png|gif|webp)/i)) return 'photos';
                if (name.match(/\.(pdf|doc|docx|txt)/i)) return 'documents';
                if (name.match(/\.(mp4|mov|avi|mkv)/i)) return 'videos';
                return 'other';
              };
              
              const fileType = getFileType(f.name || '');
              if (filter !== 'all' && fileType !== filter) return null;

              return (
                <div key={`${f.caseId}-${f.name}`} className="evid-item">
                  <div className="evid-icon">{f.icon}</div>
                  <div className="evid-name">{f.name}</div>
                  <div className="evid-meta">{f.caseId} · {f.caseType}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Access Log */}
      <div className="card">
        <div className="card-header"><span className="card-title">Access Log</span></div>
        <table className="data-table">
          <thead>
            <tr><th>File</th><th>Accessed By</th><th>Time</th><th>Action</th></tr>
          </thead>
          <tbody>
            {accessLog.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                  No access logs available
                </td>
              </tr>
            ) : (
              accessLog.map(([file, user, time, action]) => (
                <tr key={file}>
                  <td>{file}</td>
                  <td>{user}</td>
                  <td>{time}</td>
                  <td><span className="badge badge-reviewing">{action}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
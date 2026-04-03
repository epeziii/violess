// EvidencePage.jsx
import { useState } from "react";

export default function EvidencePage() {
  const FILES = [
    { icon: '', name: 'photo_001.jpg', meta: 'Case #VIO-001 · Feb 12 · 2.1 MB' },
    { icon: '', name: 'blotter_report.pdf', meta: 'Case #VIO-001 · Feb 12 · 340 KB' },
    { icon: '', name: 'cctv_clip.mp4', meta: 'Case #VIO-002 · Feb 13 · 18 MB' },
    { icon: '', name: 'medical_cert.pdf', meta: 'Case #VIO-002 · Feb 13 · 890 KB' },
    { icon: '', name: 'screenshot_msg.png', meta: 'Case #VIO-003 · Feb 14 · 1.2 MB' },
    { icon: '', name: 'incident_form.docx', meta: 'Case #VIO-004 · Feb 15 · 120 KB' },
    { icon: '', name: 'witness_video.mp4', meta: 'Case #VIO-002 · Feb 13 · 45 MB' },
    { icon: '', name: 'bruise_photo.jpg', meta: 'Case #VIO-002 · Feb 13 · 3.4 MB' },
  ];

  const [filter, setFilter] = useState('all');

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
          {FILES.map(f => (
            <div key={f.name} className="evid-item">
              <div className="evid-icon">{f.icon}</div>
              <div className="evid-name">{f.name}</div>
              <div className="evid-meta">{f.meta}</div>
            </div>
          ))}
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
            {[
              ['photo_001.jpg', 'Officer Reyes', 'Feb 12, 10:00 AM', 'Viewed'],
              ['blotter_report.pdf', 'Officer Raven', 'Feb 13, 9:00 AM', 'Viewed'],
              ['medical_cert.pdf', 'Officer Reyes', 'Feb 13, 2:00 PM', 'Viewed']
            ].map(([file, user, time, action]) => (
              <tr key={file}>
                <td>{file}</td>
                <td>{user}</td>
                <td>{time}</td>
                <td><span className="badge badge-reviewing">{action}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
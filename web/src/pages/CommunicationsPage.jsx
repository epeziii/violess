// CommunicationsPage.jsx
import { useState } from "react";

export default function CommunicationsPage() {
  const [msgs, setMsgs] = useState([
    { id: 1, from: 'victim', name: 'Anonymous (#VIO-001)', text: 'I am afraid to go outside. What should I do?', time: '9:12 AM' },
    { id: 2, from: 'me',    name: 'Officer Reyes',         text: "Please stay safe. We have assigned a social worker to your case. She will contact you shortly.", time: '9:20 AM' },
    { id: 3, from: 'victim', name: 'Anonymous (#VIO-001)', text: "Thank you. I feel a bit better knowing someone is listening.", time: '9:25 AM' },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMsgs(m => [...m, { id: Date.now(), from: 'me', name: 'Officer Reyes', text: input, time: 'Now' }]);
    setInput("");
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>Communications</h1>
      </div>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Messages</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--safe)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}> Encrypted</span>
            </div>
          </div>
          <div className="chat-messages">
            {msgs.map(m => (
              <div key={m.id} className={`msg-row ${m.from === 'me' ? 'me' : ''}`}>
                <div className="msg-avatar" style={{ background: m.from === 'me' ? 'var(--primary)' : '#888' }}>
                  {m.from === 'me' ? 'OR' : 'A'}
                </div>
                <div className={`msg-bubble ${m.from === 'me' ? 'msg-me' : 'msg-them'}`}>
                  {m.from !== 'me' && <div className="msg-name">{m.name}</div>}
                  <div className={m.from === 'me' ? 'msg-text-me' : 'msg-text'}>{m.text}</div>
                  <div className={m.from === 'me' ? 'msg-time-me' : 'msg-time'}>{m.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Type a message to victim..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button className="chat-send" onClick={send}>➤</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Schedule Interview</span></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Case</label>
                <select className="form-select">
                  <option>#VIO-001 — Harassment</option>
                  <option>#VIO-002 — Domestic Abuse</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input className="form-input" placeholder="e.g. Feb 20, 2025 2:00 PM" />
              </div>
              <div className="form-group">
                <label className="form-label">Mode</label>
                <select className="form-select">
                  <option>Barangay Hall (private room)</option>
                  <option>Video call (secure)</option>
                  <option>Home visit</option>
                </select>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }}>Schedule Interview</button>
            </div>
          </div>

          
        </div>
      </div>
    </div>
  );
}
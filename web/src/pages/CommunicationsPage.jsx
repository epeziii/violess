// CommunicationsPage.jsx
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, orderBy, addDoc } from "firebase/firestore";
import { useAuth } from "../AuthContext";

export default function CommunicationsPage() {
  const { user } = useAuth();
  const [selectedCase, setSelectedCase] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [assignedCases, setAssignedCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (!user) return;

    try {
      // Build the officer's full name for matching
      const officerName = `${user.firstName} ${user.lastName}`.trim();

      // Query cases assigned to this officer
      const q = query(
        collection(db, "reports"),
        where("assignedOfficer", "==", officerName)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cases = snapshot.docs.map((doc) => ({
          id: doc.data().caseId,
          type: doc.data().incidentType,
          reporter: doc.data().reporterName,
          status: doc.data().status || "pending",
          priority: doc.data().priorityLevel || "normal",
          docId: doc.id,
          uid: doc.data().uid,
        }));
        setAssignedCases(cases);
        setLoadingCases(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching assigned cases:", error);
      setLoadingCases(false);
    }
  }, [user]);

  // Fetch messages for selected case
  useEffect(() => {
    if (!selectedCase) {
      setMsgs([]);
      return;
    }

    try {
      setLoadingMessages(true);
      const messagesQuery = query(
        collection(db, "messages"),
        where("caseId", "==", selectedCase.id),
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
    } catch (error) {
      console.error("Error fetching messages:", error);
      setLoadingMessages(false);
    }
  }, [selectedCase]);

  const send = async () => {
    if (!input.trim() || !selectedCase) return;

    try {
      await addDoc(collection(db, "messages"), {
        caseId: selectedCase.id,
        reporterUid: selectedCase.uid,
        officerUid: user.uid,
        officerName: `${user.firstName} ${user.lastName}`,
        reporterName: selectedCase.reporter,
        from: 'officer',
        text: input,
        timestamp: new Date(),
      });
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.5 }}>Communications</h1>
      </div>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Assigned Cases</span></div>
            <div style={{ maxHeight: 300, overflowY: 'auto', padding: '0 16px' }}>
              {loadingCases ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
              ) : assignedCases.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No assigned cases</div>
              ) : (
                assignedCases.map(caseItem => (
                  <div key={caseItem.id} onClick={() => setSelectedCase(caseItem)} style={{ paddingTop: 12, paddingBottom: 12, borderBottom: '0.5px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', backgroundColor: selectedCase?.id === caseItem.id ? 'rgba(194, 24, 91, 0.08)' : 'transparent', transition: 'background-color 0.2s' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{caseItem.id} — {caseItem.type}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Reporter: {caseItem.reporter}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'capitalize', padding: '2px 8px', borderRadius: '4px', backgroundColor: caseItem.status === 'reviewing' ? '#e3f2fd' : caseItem.status === 'pending' ? '#fff3e0' : '#ffe0e6', color: caseItem.status === 'reviewing' ? '#1565c0' : caseItem.status === 'pending' ? '#e65100' : '#c2185b' }}>
                          {caseItem.status}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'capitalize', padding: '2px 8px', borderRadius: '4px', backgroundColor: caseItem.priority === 'urgent' ? '#ffebee' : caseItem.priority === 'high' ? '#fff9c4' : '#e8f5e9', color: caseItem.priority === 'urgent' ? '#c62828' : caseItem.priority === 'high' ? '#f57f17' : '#2e7d32' }}>
                          {caseItem.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Schedule Interview</span></div>
            <div className="card-body">
              {selectedCase ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Case</label>
                    <div style={{ fontSize: 13, fontWeight: 600, padding: '8px 12px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '0.5px solid var(--border)' }}>
                      {selectedCase.id} — {selectedCase.type}
                    </div>
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
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px' }}>Select a case to schedule an interview</div>
              )}
            </div>
          </div>


        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Messages {selectedCase && `— ${selectedCase.reporter}`}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--safe)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}> Encrypted</span>
            </div>
          </div>
          <div className="chat-messages">
            {loadingMessages ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading messages...</div>
            ) : !selectedCase ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Select a case to view messages</div>
            ) : msgs.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No messages yet. Start the conversation!</div>
            ) : (
              msgs.map(m => (
                <div key={m.id} className={`msg-row ${m.from === 'officer' ? 'me' : ''}`}>
                  <div className="msg-avatar" style={{ background: m.from === 'officer' ? 'var(--primary)' : '#888' }}>
                    {m.from === 'officer' ? 'OF' : 'RP'}
                  </div>
                  <div className={`msg-bubble ${m.from === 'officer' ? 'msg-me' : 'msg-them'}`}>
                    {m.from !== 'officer' && <div className="msg-name">{m.reporterName}</div>}
                    <div className={m.from === 'officer' ? 'msg-text-me' : 'msg-text'}>{m.text}</div>
                    <div className={m.from === 'officer' ? 'msg-time-me' : 'msg-time'}>
                      {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : new Date(m.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder={selectedCase ? "Type a message..." : "Select a case to message..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              disabled={!selectedCase}
            />
            <button className="chat-send" onClick={send} disabled={!selectedCase}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}
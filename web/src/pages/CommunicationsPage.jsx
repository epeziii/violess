
// CommunicationsPage.jsx
import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { addDoc, collection, serverTimestamp, doc, query, where, onSnapshot, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../AuthContext";
import API_BASE_URL from "../config/api";

export default function CommunicationsPage() {
  const { user } = useAuth();
  const [selectedCase, setSelectedCase] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [assignedCases, setAssignedCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [interviewMode, setInterviewMode] = useState("Barangay Hall (private room)");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [completionDate, setCompletionDate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingResolution, setPendingResolution] = useState(null);
  const [resolutionError, setResolutionError] = useState("");
  const [actionCardMode, setActionCardMode] = useState("interview");

  useEffect(() => {
    if (!user) return;
    const officerName = `${user.firstName} ${user.lastName}`.trim();
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
  }, [user]);

  useEffect(() => {
    if (!selectedCase) {
      setMsgs([]);
      return;
    }
    setLoadingMessages(true);
    const messagesQuery = query(
      collection(db, "messages", selectedCase.id, "messages"),
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
  }, [selectedCase]);

  useEffect(() => {
    if (!selectedCase) {
      setPendingResolution(null);
      return;
    }
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
  }, [selectedCase]);

  const scheduleInterview = async () => {
    if (!selectedCase || !selectedDate || !selectedTime || scheduling) return;
    try {
      setScheduling(true);
      setScheduleMessage("");
      const interviewDateTime = new Date(selectedDate);
      interviewDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      await addDoc(collection(db, `reports/${selectedCase.docId}/interviews`), {
        caseId: selectedCase.id,
        reporterUid: selectedCase.uid,
        reporterName: selectedCase.reporter,
        officerUid: user.uid,
        officerName: `${user.firstName} ${user.lastName}`,
        dateTime: interviewDateTime,
        mode: interviewMode,
        status: "scheduled",
        createdAt: serverTimestamp(),
      });
      setScheduleMessage("Interview scheduled successfully!");
      const officerName = `${user.firstName} ${user.lastName}`;
      const formattedDateTime = format(interviewDateTime, 'MMM dd, yyyy h:mm aa');
      const messageText = `📅 Interview scheduled for ${formattedDateTime} (${interviewMode}) by ${officerName}. Reply ACCEPT to confirm or state your reason:`;
      await addDoc(collection(db, "messages", selectedCase.id, "messages"), {
        reporterUid: selectedCase.uid,
        officerUid: user.uid,
        officerName: officerName,
        reporterName: selectedCase.reporter,
        from: 'officer',
        text: messageText,
        timestamp: new Date(),
      });
      setSelectedDate(null);
      setSelectedTime(null);
      setInterviewMode("Barangay Hall (private room)");
    } catch (error) {
      console.error("Error scheduling interview:", error);
      setScheduleMessage("Failed to schedule interview. Please try again.");
    } finally {
      setScheduling(false);
    }
  };

  const send = async () => {
    if (!input.trim() || !selectedCase || sending) return;
    try {
      setSending(true);
      await addDoc(collection(db, "messages", selectedCase.id, "messages"), {
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
    } finally {
      setSending(false);
    }
  };

  const handleSubmitResolution = async () => {
    if (!selectedCase || !resolutionNotes.trim() || submitting) return;
    try {
      setSubmitting(true);
      setResolutionError("");
      const res = await fetch(`${API_BASE_URL}/submit-resolution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          caseId: selectedCase.docId,
          notes: resolutionNotes,
          completionDate: completionDate
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit resolution");
      }
      setResolutionNotes("");
      setCompletionDate(null);
      setResolutionError("✓ Resolution submitted successfully!");
      setTimeout(() => setResolutionError(""), 3000);
    } catch (error) {
      console.error("Error submitting resolution:", error);
      setResolutionError(error.message || "Error submitting resolution");
    } finally {
      setSubmitting(false);
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
                assignedCases.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    onClick={() => setSelectedCase(caseItem)}
                    style={{
                      paddingTop: 12,
                      paddingBottom: 12,
                      borderBottom: '0.5px solid var(--border)',
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      backgroundColor: selectedCase?.id === caseItem.id ? 'rgba(194, 24, 91, 0.08)' : 'transparent',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                        {caseItem.id} — {caseItem.type}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                        Reporter: {caseItem.reporter}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: caseItem.status === 'reviewing' ? '#e3f2fd' : caseItem.status === 'pending' ? '#fff3e0' : '#ffe0e6',
                            color: caseItem.status === 'reviewing' ? '#1565c0' : caseItem.status === 'pending' ? '#e65100' : '#c2185b',
                          }}
                        >
                          {caseItem.status}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: caseItem.priority === 'urgent' ? '#ffebee' : caseItem.priority === 'high' ? '#fff9c4' : '#e8f5e9',
                            color: caseItem.priority === 'urgent' ? '#c62828' : caseItem.priority === 'high' ? '#f57f17' : '#2e7d32',
                          }}
                        >
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
            <div className="card-header">
              <span className="card-title">Case Actions</span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Select Action</label>
                <select
                  className="form-select"
                  value={actionCardMode}
                  onChange={(e) => setActionCardMode(e.target.value)}
                >
                  <option value="interview">Schedule Interview</option>
                  <option value="resolution">Submit Resolution</option>
                </select>
              </div>

              {actionCardMode === 'interview' ? (
                <>
                  {selectedCase ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">Case</label>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            padding: '8px 12px',
                            backgroundColor: 'var(--bg)',
                            borderRadius: 'var(--radius-md)',
                            border: '0.5px solid var(--border)',
                          }}
                        >
                          {selectedCase.id} — {selectedCase.type}
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                          onChange={(e) => setSelectedDate(e.target.valueAsDate || null)}
                          min={format(new Date(), 'yyyy-MM-dd')}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">TIME</label>
                      <DatePicker
                        selected={selectedTime}
                        onChange={setSelectedTime}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        dateFormat="h:mm aa"
                        className="form-input"
                        placeholderText="Select time"
                      />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Mode</label>
                        <select
                          className="form-select"
                          value={interviewMode}
                          onChange={(e) => setInterviewMode(e.target.value)}
                        >
                          <option>Barangay Hall (private room)</option>
                          <option>Video call (secure)</option>
                          <option>Home visit</option>
                        </select>
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={scheduleInterview}
                        disabled={!selectedCase || !selectedDate || !selectedTime || scheduling}
                      >
                        {scheduling ? 'Scheduling...' : 'Schedule Interview'}
                      </button>
                      {scheduleMessage && (
                        <div
                          style={{
                            marginTop: 12,
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 13,
                            textAlign: 'center',
                            backgroundColor: scheduleMessage.includes('successfully') ? '#d4edda' : '#f8d7da',
                            color: scheduleMessage.includes('successfully') ? '#155724' : '#721c24',
                          }}
                        >
                          {scheduleMessage}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px' }}>
                      Select a case to schedule an interview
                    </div>
                  )}
                </>
              ) : (
                <>
                  {selectedCase ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">Case</label>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            padding: '8px 12px',
                            backgroundColor: 'var(--bg)',
                            borderRadius: 'var(--radius-md)',
                            border: '0.5px solid var(--border)',
                          }}
                        >
                          {selectedCase.id} — {selectedCase.type}
                        </div>
                      </div>

                      {pendingResolution ? (
                        <div
                          style={{
                            padding: 12,
                            backgroundColor: pendingResolution.status === 'pending' ? '#e3f2fd' : '#d4edda',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${pendingResolution.status === 'pending' ? '#1565c0' : '#155724'}`,
                            marginBottom: 12,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: pendingResolution.status === 'pending' ? '#1565c0' : '#155724',
                              marginBottom: 4,
                            }}
                          >
                            Status: {pendingResolution.status === 'pending' ? '⏳ Awaiting Review' : pendingResolution.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                          </div>
                          {pendingResolution.reviewComments && (
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                              Admin: {pendingResolution.reviewComments}
                            </div>
                          )}
                        </div>
                      ) : null}

                      {!pendingResolution || pendingResolution.status === 'rejected' ? (
                        <>
                          <div className="form-group">
                            <label className="form-label">Date Completed</label>
                            <input
                              type="date"
                              className="form-input"
                              value={completionDate ? format(completionDate, 'yyyy-MM-dd') : ''}
                              onChange={(e) => setCompletionDate(e.target.valueAsDate || null)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Summary of Actions *</label>
                            <textarea
                              className="form-input"
                              placeholder="Describe what actions were taken, findings, outcome..."
                              value={resolutionNotes}
                              onChange={(e) => setResolutionNotes(e.target.value)}
                              style={{ minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
                            />
                          </div>
                          <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={handleSubmitResolution}
                            disabled={!resolutionNotes.trim() || submitting}
                          >
                            {submitting ? 'Submitting...' : 'Submit for Admin Review'}
                          </button>
                        </>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px' }}>
                          ✓ Resolution submitted. Awaiting admin review.
                        </div>
                      )}

                      {resolutionError && (
                        <div
                          style={{
                            marginTop: 12,
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 13,
                            textAlign: 'center',
                            backgroundColor: resolutionError.includes('successfully') ? '#d4edda' : '#f8d7da',
                            color: resolutionError.includes('successfully') ? '#155724' : '#721c24',
                          }}
                        >
                          {resolutionError}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px' }}>
                      Select a case to submit resolution
                    </div>
                  )}
                </>
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
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Loading messages...
              </div>
            ) : !selectedCase ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Select a case to view messages
              </div>
            ) : msgs.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No messages yet. Start the conversation!
              </div>
            ) : (
              msgs.map((m) => (
                <div key={m.id} className={`msg-row ${m.from === 'officer' ? 'me' : ''}`}>
                  <div
                    className="msg-avatar"
                    style={{ background: m.from === 'officer' ? 'var(--primary)' : '#888' }}
                  >
                    {m.from === 'officer' ? 'OF' : 'RP'}
                  </div>
                  <div className={`msg-bubble ${m.from === 'officer' ? 'msg-me' : 'msg-them'}`}>
                    {m.from !== 'officer' && (
                      <div className="msg-name">{m.reporterName}</div>
                    )}
                    <div className={m.from === 'officer' ? 'msg-text-me' : 'msg-text'}>
                      {m.text}
                    </div>
                    <div className={m.from === 'officer' ? 'msg-time-me' : 'msg-time'}>
                      {m.timestamp?.toDate
                        ? m.timestamp.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                        : new Date(m.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder={selectedCase ? 'Type a message...' : 'Select a case to message...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !sending && send()}
              disabled={!selectedCase}
            />
            <button
              className="chat-send"
              onClick={send}
              disabled={!selectedCase || sending || !input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard } from 'react-native';
import { ch, s } from './sharedStyles';
import { colors, spacing } from '../theme';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, getDoc, doc, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { API_BASE_URL } from '../config/api';

const formatMessageTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  
  try {
    let date;
    
    // Firebase Timestamp
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } 
    // Already Date
    else if (timestamp instanceof Date) {
      date = timestamp;
    } 
    // String/number - parse safely
    else {
      date = new Date(timestamp);
    }
    
    // Invalid date check
    if (isNaN(date.getTime())) {
      return 'Just now';
    }
    
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  } catch {
    return 'Just now';
  }
};

export default function ChatScreen({ navigation, route }) {
  const { caseId } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [officerName, setOfficerName] = useState('Officer');
  const [sending, setSending] = useState(false);
  const [showReasonFor, setShowReasonFor] = useState(null);
  const [reasonInput, setReasonInput] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const listRef = useRef();
  const isInitialLoadRef = useRef(true);

  // Handle keyboard show/hide
  useEffect(() => {
    const keyboardDidShow = (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    };
    const keyboardDidHide = () => {
      setKeyboardHeight(0);
    };

    const showListener = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
    const hideListener = Keyboard.addListener('keyboardDidHide', keyboardDidHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Fetch case details to get assigned officer
  useEffect(() => {
    const fetchCaseDetails = async () => {
      if (!caseId) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setLoading(false);
          return;
        }

        // Query for the case
        const casesQuery = query(
          collection(db, "reports"),
          where("caseId", "==", caseId),
          where("uid", "==", currentUser.uid)
        );

        const snapshot = await getDocs(casesQuery);
        if (!snapshot.empty) {
          const foundCase = snapshot.docs[0].data();
          setCaseData(foundCase);
          setOfficerName(foundCase.assignedOfficer || 'Officer');
        }
      } catch (error) {
        console.error('Error fetching case details:', error);
      }
    };

    fetchCaseDetails();
  }, [caseId]);

  // Set up real-time message polling (fetches from backend API)
  useEffect(() => {
    if (!caseId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/case/${caseId}/messages`,
          {
            headers: {
              "x-user-id": currentUser.uid,
            },
          }
        );
        const data = await response.json();

        if (!isMounted) return;

        if (!data.success) {
          // Only show error on initial load, not on polling
          if (isInitialLoadRef.current) {
            setError(data.error || "Failed to fetch messages");
            setMessages([]);
            setLoading(false);
          }
          return;
        }

          const fetchedMessages = data.messages.map((msg) => ({
          id: msg.id,
          from: msg.from === 'officer' ? 'officer' : 'reporter',
          name: msg.from === 'officer' ? msg.officerName : undefined,
          text: msg.text,
          time: formatMessageTime(msg.timestamp),
        }));

        setMessages(fetchedMessages);
        setError(null);
        setLoading(false);

        // Only scroll to end on initial load
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
          setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching messages:', error);
          // Only show error on initial load, not on polling
          if (isInitialLoadRef.current) {
            setError("Failed to load messages");
            setMessages([]);
            setLoading(false);
          } else {
            // On polling, silently continue - error will trigger next retry
            setError(null);
          }
        }
      }
    };

    // Fetch immediately
    fetchMessages();

    // Poll for new messages every 2 seconds
    const interval = setInterval(fetchMessages, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [caseId]);

  const quickSend = async (messageText) => {
    if (!messageText.trim() || !caseId || sending) return;

    try {
      setSending(true);
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get user info for the message
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        console.error("User profile not found");
        return;
      }

      const userData = userSnap.data();
      const reporterName = `${userData.firstName} ${userData.lastName}`.trim();

      // Get case to find assigned officer uid
      const casesQuery = query(
        collection(db, "reports"),
        where("caseId", "==", caseId),
        where("uid", "==", currentUser.uid)
      );

      let officerUid = "";
      let assignedOfficerName = "";

      try {
        const caseSnapshot = await getDocs(casesQuery);
        if (!caseSnapshot.empty) {
          const caseData = caseSnapshot.docs[0].data();
          assignedOfficerName = caseData.assignedOfficer || "";

          // Look up the officer's UID by staff name
          if (assignedOfficerName) {
            const staffQuery = query(
              collection(db, "staff"),
              where("firstName", "!=", "")
            );
            const staffSnapshot = await getDocs(staffQuery);
            for (const staffDoc of staffSnapshot.docs) {
              const staffData = staffDoc.data();
              const fullName = `${staffData.firstName} ${staffData.lastName}`.trim();
              if (fullName === assignedOfficerName) {
                officerUid = staffDoc.id;
                break;
              }
            }
          }
        }
      } catch (error) {
        console.warn('Could not look up officer UID:', error.message);
        // Continue without officer UID
      }

      // Add message to Firestore
      await addDoc(collection(db, "messages", caseId, "messages"), {
        from: 'reporter',
        reporterUid: currentUser.uid,
        reporterName: reporterName,
        officerUid: officerUid || "",
        text: messageText,
        timestamp: new Date(),
      });

      // Reset reason input if used
      if (showReasonFor) {
        setReasonInput('');
        setShowReasonFor(null);
      } else {
        // Regular input - handled in send()
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const send = async () => {
    if (!input.trim() || !caseId || sending) return;
    await quickSend(input);
    setInput('');
  };

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: colors.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerTitle}>{officerName}</Text>
          <View style={s.onlineRow}>
            <View style={s.onlineDot} />
            <Text style={s.onlineText}>Online · 🔒 Encrypted</Text>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Messages */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
            <Text style={{ color: colors.error, textAlign: 'center', marginBottom: spacing.md }}>Error loading messages</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>{error}</Text>
          </View>
        ) : !caseId ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted }}>No case selected</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            scrollEnabled
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={{ padding: spacing.lg }}
            renderItem={({ item }) => {
              const isInterviewMsg = item.text.match(/📅 Interview scheduled.*Reply ACCEPT/i);
              const isMyReason = showReasonFor === item.id;

              const handleAccept = () => {
                quickSend(`✅ ACCEPT - Confirmed for ${item.text.match(/📅 Interview scheduled for (.*?)\(/)?.[1] || 'scheduled interview'}`);
              };

              const handleReasonSend = () => {
                quickSend(reasonInput || 'Reason for unavailability');
                setReasonInput('');
              };

              const handleReasonCancel = () => {
                setReasonInput('');
                setShowReasonFor(null);
              };

              return (
                <View style={[ch.msgWrap, item.from === 'reporter' && ch.msgWrapMe]}>
                  {item.from !== 'reporter' && <Text style={ch.senderName}>{item.name}</Text>}
                  <View style={[ch.bubble, item.from === 'reporter' ? ch.bubbleMe : ch.bubbleThem]}>
                    <Text style={[ch.bubbleText, item.from === 'reporter' && { color: '#fff' }]}>{item.text}</Text>
                    <Text style={[ch.timeText, item.from === 'reporter' && { color: 'rgba(255,255,255,0.65)' }]}>{item.time}</Text>
                  </View>
                  {isInterviewMsg && item.from === 'officer' && !isMyReason && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, paddingHorizontal: 4 }}>
                      <TouchableOpacity 
                        style={{ flex: 1, backgroundColor: colors.safe, padding: 10, borderRadius: 8, alignItems: 'center' }}
                        onPress={handleAccept}
                        disabled={sending}
                      >
                        <Text style={{ color: 'white', fontWeight: '600' }}>✅ Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ flex: 1, backgroundColor: colors.warning, padding: 10, borderRadius: 8, alignItems: 'center' }}
                        onPress={() => setShowReasonFor(item.id)}
                        disabled={sending}
                      >
                        <Text style={{ color: 'white', fontWeight: '600' }}>❌ Reason</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {isMyReason && (
                    <View style={{ marginTop: 8, gap: 8 }}>
                      <TextInput
                        style={[ch.input, { flex: 0, minHeight: 40 }]}
                        value={reasonInput}
                        onChangeText={setReasonInput}
                        placeholder="Enter reason for unavailability..."
                        placeholderTextColor={colors.placeholder}
                        multiline
                      />
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity 
                          style={{ flex: 1, backgroundColor: colors.primary, padding: 10, borderRadius: 8, alignItems: 'center' }}
                          onPress={handleReasonSend}
                          disabled={sending || !reasonInput.trim()}
                        >
                          <Text style={{ color: 'white', fontWeight: '600' }}>Send Reason</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={{ flex: 1, backgroundColor: colors.surfaceVariant, padding: 10, borderRadius: 8, alignItems: 'center' }}
                          onPress={handleReasonCancel}
                        >
                          <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Input */}
      <View style={ch.inputRow}>
        <TouchableOpacity style={ch.attachBtn}><Text style={{ fontSize: 18 }}>📎</Text></TouchableOpacity>
        <TextInput
          style={ch.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor={colors.placeholder}
          multiline
          editable={!!caseId}
        />
        <TouchableOpacity style={ch.sendBtn} onPress={send} disabled={!caseId || sending || !input.trim()}>
          <Text style={ch.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
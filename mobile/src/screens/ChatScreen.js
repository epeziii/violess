import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { ch, s } from './sharedStyles';
import { colors, spacing } from '../theme';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, getDoc, doc, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { API_BASE_URL } from '../config/api';

export default function ChatScreen({ navigation, route }) {
  const { caseId } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [officerName, setOfficerName] = useState('Officer');
  const listRef = useRef();

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
          setError(data.error || "Failed to fetch messages");
          setMessages([]);
          setLoading(false);
          return;
        }

        const fetchedMessages = data.messages.map((msg) => ({
          id: msg.id,
          from: msg.from === 'officer' ? 'officer' : 'reporter',
          name: msg.from === 'officer' ? msg.officerName : undefined,
          text: msg.text,
          time: msg.timestamp?.toDate?.()
            ? new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : msg.timestamp instanceof Date
            ? msg.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : 'Now',
        }));

        setMessages(fetchedMessages);
        setError(null);
        setLoading(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching messages:', error);
          setError("Failed to load messages");
          setMessages([]);
          setLoading(false);
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

  const send = async () => {
    if (!input.trim() || !caseId) return;

    try {
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
      await addDoc(collection(db, "messages"), {
        caseId,
        from: 'reporter',
        reporterUid: currentUser.uid,
        reporterName: reporterName,
        officerUid: officerUid || "",
        text: input,
        timestamp: new Date(),
      });

      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <View style={[s.root, { backgroundColor: colors.surface }]}>
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
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
          renderItem={({ item }) => (
            <View style={[ch.msgWrap, item.from === 'reporter' && ch.msgWrapMe]}>
              {item.from !== 'reporter' && <Text style={ch.senderName}>{item.name}</Text>}
              <View style={[ch.bubble, item.from === 'reporter' ? ch.bubbleMe : ch.bubbleThem]}>
                <Text style={[ch.bubbleText, item.from === 'reporter' && { color: '#fff' }]}>{item.text}</Text>
                <Text style={[ch.timeText, item.from === 'reporter' && { color: 'rgba(255,255,255,0.65)' }]}>{item.time}</Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
          <TouchableOpacity style={ch.sendBtn} onPress={send} disabled={!caseId}>
            <Text style={ch.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
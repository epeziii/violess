import React, { useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { ch, s } from './sharedStyles';
import { colors, spacing } from '../theme';

const INITIAL_MSGS = [
  { id: '1', from: 'officer', name: 'Social Worker Ana', text: 'Hello. I\'m Ana, your assigned social worker. How are you feeling today?', time: '9:12 AM' },
  { id: '2', from: 'me', text: 'I\'m a bit scared but I want to talk about my case.', time: '9:15 AM' },
  { id: '3', from: 'officer', name: 'Social Worker Ana', text: 'That\'s completely understandable. You are safe here. I\'ve reviewed your report and I\'m here to help.', time: '9:17 AM' },
  { id: '4', from: 'officer', name: 'Social Worker Ana', text: 'Would you like to schedule a private session this week?', time: '9:17 AM' },
];

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState(INITIAL_MSGS);
  const [input, setInput] = useState('');
  const listRef = useRef();

  const send = () => {
    if (!input.trim()) return;
    setMessages(m => [...m, { id: Date.now().toString(), from: 'me', text: input.trim(), time: 'Now' }]);
    setInput('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
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
          <Text style={s.headerTitle}>Social Worker Ana</Text>
          <View style={s.onlineRow}>
            <View style={s.onlineDot} />
            <Text style={s.onlineText}>Online · 🔒 Encrypted</Text>
          </View>
        </View>
        <TouchableOpacity
          style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => navigation.replace('Chatbot')}
        >
          <Text style={{ fontSize: 18 }}>🤖</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}
        renderItem={({ item }) => (
          <View style={[ch.msgWrap, item.from === 'me' && ch.msgWrapMe]}>
            {item.from !== 'me' && <Text style={ch.senderName}>{item.name}</Text>}
            <View style={[ch.bubble, item.from === 'me' ? ch.bubbleMe : ch.bubbleThem]}>
              <Text style={[ch.bubbleText, item.from === 'me' && { color: '#fff' }]}>{item.text}</Text>
              <Text style={[ch.timeText, item.from === 'me' && { color: 'rgba(255,255,255,0.65)' }]}>{item.time}</Text>
            </View>
          </View>
        )}
      />

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
          />
          <TouchableOpacity style={ch.sendBtn} onPress={send}>
            <Text style={ch.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
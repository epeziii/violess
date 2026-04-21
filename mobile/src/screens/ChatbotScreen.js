import React, { useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { ch, s } from './sharedStyles';
import { colors, spacing } from '../theme';

const INITIAL_MSGS = [
  { id: '1', from: 'bot', name: 'SafeTalk AI', text: 'Hello, I\'m SafeTalk AI, here to listen and support you. You can share what happened to you in your own words, and I\'ll help you process it. Everything you say is confidential and safe. What would you like to talk about today?', time: '9:12 AM' },
];

const BOT_RESPONSES = [
  "I'm here to listen. Can you tell me more about what happened?",
  "That sounds really difficult. How are you feeling about it?",
  "Thank you for sharing that with me. You're doing great by seeking support.",
  "It's okay to feel this way. Many people who experience trauma feel similarly.",
  "Have you shared this with anyone else? Support systems are important.",
  "Your safety is important. Are you in a safe place right now?",
  "Would it help to talk about what happened step by step?",
  "I'm here to support you through this. What else would you like to share?",
  "You're being very brave in discussing this. That takes courage.",
  "How can I best support you today?",
];

export default function ChatbotScreen({ navigation }) {
  const [messages, setMessages] = useState(INITIAL_MSGS);
  const [input, setInput] = useState('');
  const listRef = useRef();

  const send = () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMsg = { id: Date.now().toString(), from: 'me', text: input.trim(), time: 'Now' };
    setMessages(m => [...m, userMsg]);
    setInput('');

    // Simulate bot response after a short delay
    setTimeout(() => {
      const randomResponse = BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)];
      const botMsg = {
        id: (Date.now() + 1).toString(),
        from: 'bot',
        name: 'SafeTalk AI',
        text: randomResponse,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(m => [...m, botMsg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }, 500);

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
          <Text style={s.headerTitle}>SafeTalk AI Support</Text>
          <View style={s.onlineRow}>
            <View style={[s.onlineDot, { backgroundColor: colors.info }]} />
            <Text style={s.onlineText}>Online · 🔒 Encrypted</Text>
          </View>
        </View>
        <TouchableOpacity
          style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => navigation.replace('Chat')}
        >
          <Text style={{ fontSize: 18 }}>💬</Text>
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
            {item.from !== 'me' && <Text style={[ch.senderName, { color: colors.info }]}>{item.name}</Text>}
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
            placeholder="Tell me what happened..."
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

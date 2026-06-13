import React, { useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { ch, s } from './sharedStyles';
import { colors, spacing } from '../theme';
import { API_BASE_URL } from '../config/api';

const INITIAL_MSGS = [
  { id: '1', from: 'bot', name: 'SafeTalk AI', text: 'Hello, I\'m SafeTalk AI, here to listen and support you. You can share what happened to you in your own words, and I\'ll help you process it. Everything you say is confidential and safe. What would you like to talk about today?', time: '9:12 AM' },
];

export default function ChatbotScreen({ navigation }) {
  const [messages, setMessages] = useState(INITIAL_MSGS);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef();

  const send = async () => {
    if (!input.trim() || sending) return;

    const userMsg = { id: Date.now().toString(), from: 'me', text: input.trim(), time: 'Now' };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input.trim() }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      const botMsg = {
        id: (Date.now() + 1).toString(),
        from: 'bot',
        name: 'SafeTalk AI',
        text: data.message,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(m => [...m, botMsg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        from: 'bot',
        name: 'SafeTalk AI',
        text: "I'm sorry, I encountered an error. Please try again.",
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(m => [...m, errorMsg]);
    } finally {
      setSending(false);
    }

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: colors.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <FontAwesome6 name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerTitle}>SafeTalk AI Support</Text>
          <View style={s.onlineRow}>
            <View style={[s.onlineDot, { backgroundColor: colors.info }]} />
            <FontAwesome6 name="lock" size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={s.onlineText}>Online · Encrypted</Text>
          </View>
        </View>
        <View style={{ width: 36 }} />
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
      <View style={ch.inputRow}>
        <TouchableOpacity style={ch.attachBtn} disabled={sending}>
          <FontAwesome6 name="paperclip" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TextInput
          style={ch.input}
          value={input}
          onChangeText={setInput}
          placeholder="Tell me what happened..."
          placeholderTextColor={colors.placeholder}
          multiline
          editable={!sending}
        />
        <TouchableOpacity style={ch.sendBtn} onPress={send} disabled={sending || !input.trim()}>
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <FontAwesome6 name="paper-plane" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

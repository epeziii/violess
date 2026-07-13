// ─── PrivacyScreen.js (Settings) ──────────────────────────────────────────
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, spacing } from '../theme';
import { Card } from '../components';
import { pv, s } from './sharedStyles';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

export default function PrivacyScreen({ navigation }) {
  const [settings, setSettings] = useState({
    officerChatNotifications: true,
  });

  const toggle = (key) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Log Out',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const SETTINGS = [
    {
      key: 'officerChatNotifications',
      icon: 'bell',
      title: "Don't get notified when an officer chats you",
      desc: 'You will not receive in-app notifications for officer chat messages.',
    },
  ];

  return (
    <View style={[s.root, { backgroundColor: colors.surface }]}> 
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <FontAwesome6 name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionLabel}>Preferences</Text>

        {SETTINGS.map((item) => (
          <Card key={item.key}>
            <View style={pv.row}>
              <View style={[pv.icon, { backgroundColor: colors.primaryLight }]}>
                <FontAwesome6 name={item.icon} size={18} color={colors.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={pv.title}>{item.title}</Text>
                <Text style={pv.desc}>{item.desc}</Text>
              </View>

              <Switch
                value={settings[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{ true: colors.primary, false: '#DDD' }}
                thumbColor="#fff"
              />
            </View>
          </Card>
        ))}

        <TouchableOpacity style={pv.exitBtn} onPress={handleLogout} activeOpacity={0.85}>
          <FontAwesome6
            name="right-from-bracket"
            size={18}
            color="#fff"
            style={{ marginRight: spacing.sm }}
          />
          <Text style={pv.exitBtnText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}


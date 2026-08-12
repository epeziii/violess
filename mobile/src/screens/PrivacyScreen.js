// ─── PrivacyScreen.js (Settings) ──────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, spacing } from '../theme';
import { Card } from '../components';
import { pv, s } from './sharedStyles';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const PREFERENCE_KEY = 'muteOfficerChatNotifications';

export default function PrivacyScreen({ navigation }) {
  const [muteOfficerChatNotifications, setMuteOfficerChatNotifications] = useState(false);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(PREFERENCE_KEY);
        if (storedValue !== null) {
          setMuteOfficerChatNotifications(storedValue === 'true');
        }

        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (typeof userData?.muteOfficerChatNotifications === 'boolean') {
              setMuteOfficerChatNotifications(userData.muteOfficerChatNotifications);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load officer chat preference', error);
      }
    };

    loadPreference();
  }, []);

  const toggle = async () => {
    const nextValue = !muteOfficerChatNotifications;
    setMuteOfficerChatNotifications(nextValue);
    try {
      await AsyncStorage.setItem(PREFERENCE_KEY, JSON.stringify(nextValue));
    } catch (error) {
      console.warn('Failed to save officer chat preference', error);
    }

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = doc(db, 'users', currentUser.uid);
        await updateDoc(userDoc, { muteOfficerChatNotifications: nextValue });
      }
    } catch (error) {
      console.warn('Failed to persist officer chat preference to Firestore', error);
    }
  };

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
      key: 'muteOfficerChatNotifications',
      icon: 'bell',
      title: "Don't get notified when an officer chats you",
      desc: 'You will not receive push notifications when an officer sends you a chat message.',
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
                value={muteOfficerChatNotifications}
                onValueChange={toggle}
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

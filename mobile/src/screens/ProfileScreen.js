import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Card } from '../components';
import { auth, doc, getDoc } from '../config/firebase';

const db = {};

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const getInitials = () => {
    if (!userData) return 'U';
    const first = userData.firstName ? userData.firstName.charAt(0).toUpperCase() : '';
    const last = userData.lastName ? userData.lastName.charAt(0).toUpperCase() : '';
    return (first + last) || 'U';
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Section ── */}
        <View style={styles.avatarSection}>
          <View style={styles.largeAvatar}>
            <Text style={styles.largeAvatarText}>{getInitials()}</Text>
          </View>
          <Text style={styles.userName}>
            {userData?.firstName} {userData?.lastName}
          </Text>
          <Text style={styles.userEmail}>{userData?.email}</Text>
        </View>

        {/* ── Profile Info Card ── */}
        <Card variant="elevated" style={styles.infoCard}>
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userData?.email || 'N/A'}</Text>
          </View>

          <View style={[styles.infoSection, styles.infoDivider]}>
            <Text style={styles.infoLabel}>Barangay</Text>
            <Text style={styles.infoValue}>{userData?.barangay || 'Not provided'}</Text>
          </View>

          <View style={[styles.infoSection, styles.infoDivider]}>
            <Text style={styles.infoLabel}>Contact Number</Text>
            <Text style={styles.infoValue}>{userData?.contactNumber || 'Not provided'}</Text>
          </View>

          <View style={[styles.infoSection, styles.infoDivider]}>
            <Text style={styles.infoLabel}>Emergency Contact</Text>
            <Text style={styles.infoValue}>{userData?.emergency || 'Not provided'}</Text>
          </View>
        </Card>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingTop: 52,
    backgroundColor: colors.primaryDark,
  },
  backButton: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  largeAvatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 32,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textMuted,
  },
  infoCard: {
    marginBottom: spacing.xl,
  },
  infoSection: {
    paddingVertical: spacing.md,
  },
  infoDivider: {
    borderTopWidth: 0.5,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});

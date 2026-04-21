import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, Animated, Dimensions
} from 'react-native';
import { colors, spacing, radius, shadow } from '../theme';
import { Card, StatusBadge, QuickCard, SectionHeader } from '../components';
import { auth } from '../config/firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

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
      }
    };

    fetchUserData();
  }, []);

  // Generate initials from first and last name
  const getInitials = () => {
    if (!userData) return 'U';
    const first = userData.firstName ? userData.firstName.charAt(0).toUpperCase() : '';
    const last = userData.lastName ? userData.lastName.charAt(0).toUpperCase() : '';
    return (first + last) || 'U';
  };

  const firstName = userData?.firstName || 'User';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* ── Hero Header ── */}
      <View style={styles.hero}>
        <View style={styles.heroInner}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroGreet}>Good morning </Text>
              <Text style={styles.heroName}>{firstName}</Text>
            </View>
            <TouchableOpacity
              style={styles.heroAvatar}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.heroAvatarText}>{getInitials()}</Text>
            </TouchableOpacity>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { value: '1', label: 'Active case' },
              { value: '3', label: 'Contacts' },
              { value: 'Safe', label: 'Status' },
            ].map((s, i) => (
              <View key={i} style={styles.statItem}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Decorative circle */}
        <View style={styles.heroCircle} />
        <View style={styles.heroCircle2} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── SOS Panic Button ── */}
          

          {/* ── Quick Actions ── */}
          <SectionHeader title="Quick Actions" />
          <View style={styles.quickGrid}>
            <QuickCard
              icon="" title="Track Case" desc="View case status"
              onPress={() => navigation.navigate('Track')}
              accent={colors.infoLight}
            />
            <QuickCard
              icon="" title="Chat Support" desc="Talk to a counselor"
              onPress={() => navigation.navigate('Chat')}
              accent={colors.accentLight}
            />
          </View>
          <View style={styles.quickGrid}>
          </View>

          {/* ── Recent Activity ── */}
          <SectionHeader
            title="Recent Activity"
            action="See all"
            onAction={() => navigation.navigate('Track')}
          />
          <Card variant="elevated">
            <View style={styles.caseRow}>
              <View style={styles.caseLeft}>
                <View style={[styles.caseIndicator, { backgroundColor: colors.primary }]} />
                <View>
                  <Text style={styles.caseName}>Case #001 — Harassment</Text>
                  <Text style={styles.caseDate}>Submitted Feb 12, 2025</Text>
                </View>
              </View>
              <StatusBadge status="reviewing" />
            </View>
            <View style={[styles.caseRow, { borderTopWidth: 0.5, borderTopColor: colors.borderLight, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
              <View style={styles.caseLeft}>
                <View style={[styles.caseIndicator, { backgroundColor: colors.warn }]} />
                <View>
                  <Text style={styles.caseName}>Case #003 — Bullying</Text>
                  <Text style={styles.caseDate}>Submitted Feb 14, 2025</Text>
                </View>
              </View>
              <StatusBadge status="pending" />
            </View>
          </Card>

          {/* ── Safety Reminder ── */}
          

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.surface },
  hero: {
    backgroundColor: colors.primaryDark,
    paddingTop: 52,
    paddingBottom: spacing.xxl + 10,
    overflow: 'hidden',
    position: 'relative',
  },
  heroInner:     { paddingHorizontal: spacing.xl, position: 'relative', zIndex: 2 },
  heroTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  heroGreet:     { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 3 },
  heroName:      { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primary,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroAvatarText:{ color: '#fff', fontWeight: '800', fontSize: 16 },
  statsRow:      { flexDirection: 'row', gap: spacing.md },
  statItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statValue:     { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel:     { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  heroCircle: {
    position: 'absolute', right: -40, top: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroCircle2: {
    position: 'absolute', right: 40, top: 20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scroll:        { flex: 1, marginTop: -18 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 100 },
  sosCard: {
    backgroundColor: colors.sos,
    borderRadius: radius.xl,
    padding: spacing.lg + 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  sosIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  sosTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 2 },
  sosSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  sosPulse: {
    position: 'absolute', right: -20, top: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  quickGrid:     { flexDirection: 'row', marginBottom: 0 },
  caseRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  caseLeft:      { flexDirection: 'row', alignItems: 'center', flex: 1 },
  caseIndicator: { width: 4, height: 36, borderRadius: 2, marginRight: spacing.sm },
  caseName:      { fontSize: 13, fontWeight: '600', color: colors.text },
  caseDate:      { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  reminderRow:   { flexDirection: 'row', alignItems: 'center' },
  reminderTitle: { fontSize: 13, fontWeight: '700', color: colors.primaryDark, marginBottom: 2 },
  reminderSub:   { fontSize: 11, color: colors.textSecondary, lineHeight: 15 },
  reminderLink:  { fontSize: 12, fontWeight: '700', color: colors.primary },
});

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, StatusBar, Animated, Dimensions, ActivityIndicator
} from 'react-native';
import { colors, spacing, radius, shadow } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, QuickCard, SectionHeader } from '../components';
import { supabase } from '../config/supabase';
import { API_BASE_URL } from '../config/api';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [userData, setUserData] = useState(null);
  const [activeCasesCount, setActiveCasesCount] = useState(0);
  const [recentCases, setRecentCases] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [userCaseIds, setUserCaseIds] = useState([]);
  const [recentCasesLoading, setRecentCasesLoading] = useState(true);
  const [recentCasesError, setRecentCasesError] = useState(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } = {} } = await supabase.auth.getSession();
        const currentUser = session?.user;
        if (currentUser) {
          const { data: userDoc } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle();
          if (userDoc) setUserData(userDoc);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchWithRetry = async (url, maxRetries = 2) => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        let timeoutId = null;
        try {
          const controller = new AbortController();
          timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          const response = await fetch(url, {
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' }
          });

          if (timeoutId !== null) clearTimeout(timeoutId);

          if (!response.ok) {
            if (attempt < maxRetries) continue;
            return null;
          }

          return await response.json();
        } catch (error) {
          if (timeoutId !== null) clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            console.warn('Fetch timeout, retrying...');
          } else if (attempt < maxRetries) {
            console.warn(`Fetch attempt ${attempt + 1} failed, retrying...`, error.message);
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Backoff
          } else {
            throw error;
          }
        }
      }
    };

    const fetchHomeData = async () => {
      try {
        setRecentCasesLoading(true);
        setRecentCasesError(null);

        const { data: { session } = {} } = await supabase.auth.getSession();
        const currentUser = session?.user;
        if (!currentUser) {
          setRecentCases([]);
          setActiveCasesCount(0);
          return;
        }

        console.log('🔍 [Home] Fetching cases for uid:', currentUser.id);
        console.log('🔗 [Home] Using API:', API_BASE_URL);

        const data = await fetchWithRetry(`${API_BASE_URL}/user/${currentUser.id}/cases`);

        console.log('📱 [Home] Backend response:', data);

        if (data?.success && Array.isArray(data.cases)) {
          const activeCount = data.cases.filter(
            c => c.status !== 'resolved' && c.status !== 'closed'
          ).length;
          console.log('✅ [Home] Active cases count:', activeCount);
          setActiveCasesCount(activeCount);

          const recentActivities = data.cases
            .flatMap((item) => {
              const caseId = item.caseId || item.id || '—';
              const submissionEvent = {
                id: `${caseId}-submitted`,
                caseId,
                incidentType: item.incidentType || 'Report',
                status: item.status || 'pending',
                title: 'Report submitted',
                subtitle: 'Report received and logged',
                timestamp: item.createdAt || item.updatedAt,
                order: 0,
              };

              const events = [submissionEvent];
              const status = item.status || 'pending';
              const hasAssigned = Boolean(item.assignedOfficer);
              const hasReferred = Boolean(item.referredTo);

              if (hasAssigned) {
                events.push({
                  id: `${caseId}-assigned`,
                  caseId,
                  incidentType: item.incidentType || 'Report',
                  status: 'reviewing',
                  title: `Assigned to ${item.assignedOfficer}`,
                  subtitle: status === 'reviewing'
                    ? 'Case is now being reviewed'
                    : 'Case was assigned to an officer',
                  timestamp: item.updatedAt || item.createdAt,
                  order: 1,
                });
              }

              if (hasReferred) {
                events.push({
                  id: `${caseId}-referred`,
                  caseId,
                  incidentType: item.incidentType || 'Report',
                  status: 'referred',
                  title: `Referred to ${item.referredTo}`,
                  subtitle: item.referralReason ? item.referralReason : 'Case moved to the next step',
                  timestamp: item.updatedAt || item.createdAt,
                  order: 2,
                });
              }

              if (status === 'resolved' || status === 'closed') {
                events.push({
                  id: `${caseId}-resolved`,
                  caseId,
                  incidentType: item.incidentType || 'Report',
                  status: 'resolved',
                  title: 'Case resolved',
                  subtitle: 'The case has been resolved',
                  timestamp: item.updatedAt || item.createdAt,
                  order: 3,
                });
              }

              if (status === 'closed') {
                events.push({
                  id: `${caseId}-closed`,
                  caseId,
                  incidentType: item.incidentType || 'Report',
                  status: 'closed',
                  title: 'Case closed',
                  subtitle: 'The case has been closed',
                  timestamp: item.updatedAt || item.createdAt,
                  order: 4,
                });
              }

              return events.filter(Boolean);
            })
            .sort((a, b) => {
              const aTime = new Date(a.timestamp || 0).getTime();
              const bTime = new Date(b.timestamp || 0).getTime();
              if (bTime !== aTime) return bTime - aTime;
              return (b.order || 0) - (a.order || 0);
            });

          setRecentCases(recentActivities);
          setUserCaseIds(data.cases.map(c => c.caseId).filter(Boolean));
        } else {
          console.warn('⚠️ [Home] No success data or no cases:', data);
          setRecentCases([]);
          setRecentCasesError('Unable to load recent activity');
        }
      } catch (error) {
        console.error('❌ [Home] Error fetching home data:', error.message || error);
        console.error('🔗 [Home] Full error:', error);
        setRecentCasesError('Unable to load recent activity');
      } finally {
        setRecentCasesLoading(false);
      }
    };

    fetchHomeData();
    const unsubscribe = navigation.addListener('focus', fetchHomeData);
    return unsubscribe;
  }, [navigation]);

  // Poll unread officer messages across all user's cases (for Track Case badge)
  useEffect(() => {
    if (!userCaseIds || userCaseIds.length === 0) return;

    let isMounted = true;

    const updateUnread = async () => {
      try {
        const { data: { session } = {} } = await supabase.auth.getSession();
        const currentUser = session?.user;
        if (!currentUser) return;

        const map = {};

        for (const id of Array.from(new Set(userCaseIds))) {
          try {
            const resp = await fetch(`${API_BASE_URL}/case/${id}/messages`, {
              headers: { 'x-user-id': currentUser.id },
            });
            const data = await resp.json();
            if (!data?.success || !Array.isArray(data.messages)) continue;

            const lastSeenStr = await AsyncStorage.getItem(`lastSeen:${id}`);
            const lastSeen = lastSeenStr ? new Date(lastSeenStr) : null;

            let count = 0;
            for (const m of data.messages) {
              if (m.from !== 'officer') continue;
              const mDate = m.timestamp && m.timestamp.toDate ? m.timestamp.toDate() : new Date(m.timestamp);
              if (!lastSeen || mDate > lastSeen) count += 1;
            }

            if (count > 0) map[id] = count;
          } catch (err) {
            console.warn('Unread fetch error for case', id, err?.message || err);
          }
        }

        if (isMounted) setUnreadCounts(map);
      } catch (err) {
        console.warn('Failed to update unread counts (home)', err?.message || err);
      }
    };

    updateUnread();
    const iv = setInterval(updateUnread, 5000);
    return () => { isMounted = false; clearInterval(iv); };
  }, [userCaseIds]);

  // Generate initials from first and last name
  const getInitials = () => {
    if (!userData) return 'U';
    const first = userData.firstName ? userData.firstName.charAt(0).toUpperCase() : '';
    const last = userData.lastName ? userData.lastName.charAt(0).toUpperCase() : '';
    return (first + last) || 'U';
  };

  const firstName = userData?.firstName || 'User';

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCaseDate = (value) => {
    if (!value) return 'Recently updated';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recently updated';

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getActivityDetails = (item) => {
    const officerName = item.assignedOfficer?.trim();
    const timestamp = item.updatedAt || item.createdAt;

    switch (item.status) {
      case 'reviewing':
        return {
          title: officerName ? `Assigned to ${officerName}` : 'Assigned to officer',
          subtitle: 'Case is now being reviewed',
          timestamp,
        };
      case 'referred':
        return {
          title: item.referredTo ? `Referred to ${item.referredTo}` : 'Referred to social worker',
          subtitle: item.referralReason ? item.referralReason : 'Case moved to the next step',
          timestamp,
        };
      case 'resolved':
        return {
          title: 'Case resolved',
          subtitle: 'The case has been resolved',
          timestamp,
        };
      case 'closed':
        return {
          title: 'Case closed',
          subtitle: 'The case has been closed',
          timestamp,
        };
      default:
        return {
          title: 'Report submitted',
          subtitle: 'Report received and logged',
          timestamp: item.createdAt || timestamp,
        };
    }
  };

  const totalUnread = Object.values(unreadCounts || {}).reduce((a, b) => a + (b || 0), 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* ── Hero Header ── */}
      <View style={styles.hero}>
        <View style={styles.heroInner}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroGreet}>{getGreeting()} </Text>
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
              { value: activeCasesCount.toString(), label: 'Active case' },
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

      <View style={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── SOS Panic Button ── */}
          

          {/* ── Quick Actions ── */}
          <SectionHeader title="Quick Actions" />
          <View style={styles.quickGrid}>
            <View style={{ position: 'relative', flex: 1 }}>
              <QuickCard
                icon="briefcase" title="Track Case" desc="View case status"
                onPress={() => navigation.navigate('Track')}
                accent={colors.infoLight}
              />
              {totalUnread > 0 && (
                <TouchableOpacity onPress={() => navigation.navigate('Track')} style={{ position: 'absolute', right: 8, top: 8 }}>
                  <View style={{ backgroundColor: colors.sos, minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>{String(totalUnread)}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
            <QuickCard
              icon="message" title="Chat Support" desc="Talk to SafeTalk AI"
              onPress={() => navigation.navigate('Chatbot')}
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
            {recentCasesLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.emptyText}>Loading recent activity...</Text>
              </View>
            ) : recentCasesError ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{recentCasesError}</Text>
              </View>
            ) : recentCases.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No recent activity yet</Text>
                <Text style={styles.emptySubText}>Your latest reports will appear here.</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.activityList}
                contentContainerStyle={styles.activityListContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {recentCases.map((item, index) => (
                  <View
                    key={item.id || item.caseId || `${item.incidentType}-${index}`}
                    style={[
                      styles.caseRow,
                      index > 0 && {
                        borderTopWidth: 0.5,
                        borderTopColor: colors.borderLight,
                        marginTop: spacing.sm,
                        paddingTop: spacing.sm,
                      },
                    ]}
                  >
                    <View style={styles.caseLeft}>
                      <View style={[styles.caseIndicator, { backgroundColor: index % 2 === 0 ? colors.primary : colors.warn }]} />
                      <View style={styles.caseTextWrap}>
                        <Text style={styles.caseName}>
                          {`Case ${item.caseId || '—'} — ${item.title}`}
                        </Text>
                        <Text style={styles.caseDate}>{item.subtitle} • {formatCaseDate(item.timestamp)}</Text>
                      </View>
                    </View>
                    {/* no per-item message badge in recent activity */}
                  </View>
                ))}
              </ScrollView>
            )}
          </Card>

          {/* ── Safety Reminder ── */}
          

        </Animated.View>
      </View>
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
    width: '48%',
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
  scroll:        { flex: 1, marginTop: -10, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  emptyText: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  caseTextWrap: {
    flex: 1,
  },
  activityList: {
    maxHeight: 360,
  },
  activityListContent: {
    paddingBottom: spacing.xs,
  },
});

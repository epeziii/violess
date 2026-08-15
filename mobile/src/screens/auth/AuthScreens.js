import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, TextInput, ScrollView,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, spacing, radius, shadow } from '../../theme';
import { auth, doc, getDoc, setDoc } from '../../config/firebase';

const db = {};

// ─── Anonymous Report Screen ─────────────────────────────────────────────────
export function AnonymousScreen({ navigation }) {
  const [caseCode, setCaseCode] = useState('');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      <View style={styles.hero}>
        <View style={styles.circle1} /><View style={styles.circle2} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <View style={styles.anonIconBox}>
            <Text style={{ fontSize: 30 }}></Text>
          </View>
          <Text style={styles.heroTitle}>Anonymous Mode</Text>
          <Text style={styles.heroSub}>Report safely without{'\n'}creating an account</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* What it means */}
        <View style={[styles.card, { backgroundColor: colors.primaryLight, borderColor: 'rgba(194,24,91,0.15)' }]}>
          <Text style={styles.cardTitle}>What anonymous mode means</Text>
          {[
            { icon: '✓', text: 'Your name and identity are never stored', ok: true },
            { icon: '✓', text: 'You get a private case code to track your report', ok: true },
            { icon: '✓', text: 'All data is encrypted end-to-end', ok: true },
            { icon: '!', text: 'You cannot message officers or get push notifications', ok: false },
          ].map((item, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: item.ok ? colors.safe : colors.warn }]}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{item.icon}</Text>
              </View>
              <Text style={styles.bulletText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Continue anonymously */}
        <TouchableOpacity
          style={[styles.btnPrimary, shadow.md]}
          onPress={() => navigation.navigate('Report')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>Continue Anonymously →</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.divLine} />
          <Text style={styles.divText}>or track an existing report</Text>
          <View style={styles.divLine} />
        </View>

        {/* Case code lookup */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Track your anonymous case</Text>
          <Text style={styles.cardSub}>Enter the case code you received when you filed your report</Text>
          <View style={styles.codeRow}>
            <View style={styles.codeInput}>
              <Text style={styles.codePrefix}>VIO-</Text>
              <TextInput
                style={styles.codeField}
                placeholder="XXXX"
                placeholderTextColor={colors.placeholder}
                value={caseCode}
                onChangeText={setCaseCode}
                autoCapitalize="characters"
                maxLength={4}
              />
            </View>
            <TouchableOpacity style={styles.trackBtn}>
              <Text style={styles.trackBtnText}>Track</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Create account link */}
        <TouchableOpacity
          style={styles.accountCard}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.85}
        >
          <View style={styles.accountIconWrap}>
            <Text style={{ fontSize: 20 }}></Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.accountTitle}>Create an account instead</Text>
            <Text style={styles.accountSub}>Get full access to chat, tracking & push updates</Text>
          </View>
          <Text style={{ color: colors.primary, fontSize: 18 }}>›</Text>
        </TouchableOpacity>

        <View style={styles.safetyNote}>
          <View style={styles.safetyDot} />
          <Text style={styles.safetyText}>
            Vio-less will never share your information with anyone outside of authorized Barangay officers handling your case.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Register Success Screen ──────────────────────────────────────────────────
export function RegisterSuccessScreen({ navigation }) {
  const [userData, setUserData] = useState(null);

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

  const handleContinueToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <View style={[styles.successWrap]}>
        <View style={styles.successIcon}>
          <Text style={{ fontSize: 44 }}>🎉</Text>
        </View>
        <Text style={styles.successTitle}>You're all set!</Text>
        <Text style={styles.successSub}>
          Welcome to Vio-less. Your account is active and protected.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.primaryLight, width: '100%', marginTop: spacing.xxl }]}>
          <Text style={[styles.cardTitle, { color: colors.primary }]}>Your account</Text>
          <View style={styles.profileRow}>
            <View style={styles.profileAvatar}>
              <FontAwesome6 name="user" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.profileName}>
                {userData ? `${userData.firstName} ${userData.lastName}` : 'Loading...'}
              </Text>
              <Text style={styles.profileRole}>
                Community Member
              </Text>
            </View>
          </View>
        </View>

        <View style={{ width: '100%', marginTop: spacing.xl }}>
          <TouchableOpacity
            style={[styles.btnPrimary, shadow.md]}
            onPress={handleContinueToLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>
              Continue to Login →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Forgot Password Screen ───────────────────────────────────────────────────
export function ForgotPasswordScreen({ navigation }) {
  const [phone,    setPhone]    = useState('');
  const [sent,     setSent]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSend = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    // TODO: Firebase — sendPasswordResetEmail or phone OTP
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />
      <View style={styles.hero}>
        <View style={styles.circle1} /><View style={styles.circle2} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <View style={styles.anonIconBox}><Text style={{ fontSize: 28 }}>🔑</Text></View>
          <Text style={styles.heroTitle}>Reset Password</Text>
          <Text style={styles.heroSub}>Enter your phone number and we'll{'\n'}send you a reset code</Text>
        </View>
      </View>

      <View style={styles.body}>
        {!sent ? (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Phone number</Text>
              <View style={styles.inputRow}>
                <View style={styles.countryCode}><Text style={styles.countryText}>🇵🇭 +63</Text></View>
                <TextInput
                  style={styles.input}
                  placeholder="9XX XXX XXXX"
                  placeholderTextColor={colors.placeholder}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.btnPrimary, shadow.md, loading && { opacity: 0.75 }]}
              onPress={handleSend}
              disabled={loading}
            >
              <Text style={styles.btnPrimaryText}>
                {loading ? 'Sending...' : 'Send Reset Code'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems: 'center', marginTop: spacing.md }} onPress={() => navigation.goBack()}>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>
                Remember it? <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <View style={styles.successIcon}><Text style={{ fontSize: 36 }}>📱</Text></View>
            <Text style={styles.successTitle}>Code sent!</Text>
            <Text style={[styles.successSub, { textAlign: 'center' }]}>
              We sent a reset code to{'\n'}+63 {phone}
            </Text>
            <TouchableOpacity
              style={[styles.btnPrimary, shadow.md, { width: '100%', marginTop: spacing.xl }]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.btnPrimaryText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primaryDark },
  hero: {
    backgroundColor: colors.primaryDark, paddingTop: 52,
    paddingBottom: 32, paddingHorizontal: spacing.xl,
    position: 'relative', overflow: 'hidden',
  },
  circle1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.05)', right: -50, top: -40 },
  circle2: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.04)', right: 40, top: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  backIcon: { fontSize: 18, color: '#fff' },
  anonIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 6, textAlign: 'center' },
  heroSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 18 },
  body:      { flex: 1, backgroundColor: colors.surface, padding: spacing.xl, paddingBottom: 60 },
  card: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 0.5, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 12, fontWeight: '700', color: colors.primaryDark, letterSpacing: 0.3, marginBottom: spacing.md },
  cardSub:   { fontSize: 11, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 16 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  bulletDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  bulletText:{ fontSize: 12, color: colors.textSecondary, flex: 1, lineHeight: 17 },
  btnPrimary:{ backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center', marginBottom: spacing.md },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  divider:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  divLine:   { flex: 1, height: 0.5, backgroundColor: colors.borderLight },
  divText:   { fontSize: 11, color: colors.textMuted },
  codeRow:   { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  codeInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderWidth: 0.5, borderColor: colors.borderLight, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 46 },
  codePrefix:{ fontSize: 14, fontWeight: '700', color: colors.primary, marginRight: 4 },
  codeField: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: 3 },
  trackBtn:  { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center', height: 46 },
  trackBtnText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  accountCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 0.5, borderColor: colors.border,
    padding: spacing.md, marginBottom: spacing.md,
  },
  accountIconWrap: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  accountTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
  accountSub:   { fontSize: 11, color: colors.textMuted, lineHeight: 15 },
  safetyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.safeLight, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  safetyDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.safe, marginTop: 3, flexShrink: 0 },
  safetyText: { fontSize: 11, color: colors.safe, fontWeight: '500', lineHeight: 16, flex: 1 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  successIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.safeLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  successTitle:{ fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  successSub:  { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  profileRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileAvatar:{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 14, fontWeight: '700', color: colors.text },
  profileRole: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  field:       { marginBottom: spacing.md },
  label:       { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: spacing.xs },
  inputRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderWidth: 0.5, borderColor: colors.borderLight, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50 },
  countryCode: { paddingRight: spacing.sm, marginRight: spacing.sm, borderRightWidth: 0.5, borderRightColor: colors.borderLight, height: '100%', justifyContent: 'center' },
  countryText: { fontSize: 13, fontWeight: '600', color: colors.text },
  input:       { flex: 1, fontSize: 14, color: colors.text, height: '100%' },
});

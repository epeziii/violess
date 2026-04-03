import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, TextInput, KeyboardAvoidingView,
  Platform, ScrollView, Animated,
} from 'react-native';
import { colors, spacing, radius, shadow } from '../../theme';

// 🔥 Firebase
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;

  // 🔄 Shake animation for error feedback
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // 🔑 Handle Firebase login
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      shake();
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);

      // ✅ Do NOT navigate manually
      // Your AppNavigator's Firebase listener will handle login redirect

    } catch (e) {
      let msg = 'Incorrect email or password.';
      if (e.code === 'auth/user-not-found') msg = 'User not found.';
      if (e.code === 'auth/wrong-password') msg = 'Wrong password.';
      if (e.code === 'auth/invalid-email') msg = 'Invalid email format.';

      setError(msg);
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Hero section */}
      <View style={styles.hero}>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.heroContent}>
          <View style={styles.logoBox}>
            <Text style={{ fontSize: 26 }}>🕊</Text>
          </View>
          <Text style={styles.heroTitle}>Welcome back</Text>
          <Text style={styles.heroSub}>Sign in to your Vio-less account</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.formWrap} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>

          {/* Error message */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={{ marginRight: spacing.xs }}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={colors.placeholder}
              />
            </View>
          </View>

          {/* Password field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                placeholderTextColor={colors.placeholder}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={{ paddingHorizontal: spacing.xs }}>
                <Text>{showPw ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign in button */}
          <TouchableOpacity style={[styles.btnPrimary, loading && { opacity: 0.75 }]} onPress={handleLogin} disabled={loading}>
            <Text style={styles.btnPrimaryText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: colors.surface },
  hero: {
    backgroundColor: colors.primaryDark,
    paddingTop: 52,
    paddingBottom: 32,
    paddingHorizontal: spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute', width: 180, height: 180,
    borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.05)',
    right: -50, top: -40,
  },
  heroCircle2: {
    position: 'absolute', width: 100, height: 100,
    borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)',
    right: 40, top: 20,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  backIcon:    { fontSize: 18, color: '#fff' },
  heroContent: { alignItems: 'center' },
  logoBox: {
    width: 60, height: 60,
    backgroundColor: colors.primary,
    borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: spacing.xs },
  heroSub:   { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  scroll:    { flex: 1 },
  formWrap:  { padding: spacing.xl, paddingBottom: 60 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.sosLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 0.5,
    borderColor: 'rgba(198,40,40,0.2)',
  },
  errorText: { fontSize: 12, color: colors.sos, fontWeight: '500', flex: 1 },

  fieldGroup: { marginBottom: spacing.md },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 0.5, marginBottom: spacing.xs,
  },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  forgotLink:{ fontSize: 11, fontWeight: '700', color: colors.primary },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  inputError: { borderColor: colors.sos, backgroundColor: colors.sosLight },
  inputIcon:  { fontSize: 16, marginRight: spacing.sm },
  input: {
    flex: 1, fontSize: 14, color: colors.text,
    height: '100%',
  },
  eyeBtn: { padding: spacing.xs },

  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: colors.borderLight },
  dividerText: { fontSize: 12, color: colors.textMuted },

  btnAnon: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  btnAnonText: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },

  registerRow: { alignItems: 'center', marginBottom: spacing.lg },
  registerText:{ fontSize: 13, color: colors.textMuted },
  registerLink:{ color: colors.primary, fontWeight: '700' },

  safetyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.safeLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  safetyDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.safe, marginTop: 3, flexShrink: 0 },
  safetyText: { fontSize: 11, color: colors.safe, fontWeight: '500', lineHeight: 16, flex: 1 },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, TextInput, KeyboardAvoidingView,
  Platform, ScrollView, Animated,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, spacing, radius, shadow } from '../../theme';
import { auth } from '../../config/firebase';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  reload,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

const STEPS = ['Account', 'Check Email', 'Profile'];

const capitalize = (str) => {
  if (!str) return '';
  return str.trim().charAt(0).toUpperCase() + str.trim().slice(1);
};

// Format barangay and city: combine and capitalize
const formatBarangayCity = (barangay, city) => {
  const b = barangay.trim();
  const c = city.trim();

  if (!b || !c) {
    return { error: 'Please fill in both barangay and city' };
  }

  // Capitalize each word in barangay and city
  const formattedBarangay = b.split(/\s+/).map(w => capitalize(w)).join(' ');
  const formattedCity = c.split(/\s+/).map(w => capitalize(w)).join(' ');

  return { formatted: `${formattedBarangay}, ${formattedCity}` };
};

export default function RegisterScreen({ navigation }) {
  const [step,         setStep]         = useState(0);
  const [firstName,    setFirstName]    = useState('');
  const [lastName,     setLastName]     = useState('');
  const [middleName,   setMiddleName]   = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirmPw,    setConfirmPw]    = useState('');
  const [showPw,       setShowPw]       = useState(false);
  const [role,         setRole]         = useState('woman');
  const [barangay,     setBarangay]     = useState('');
  const [city,         setCity]         = useState('');
  const [emergency,    setEmergency]    = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [currentUser, setCurrentUser]   = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Listen to auth state changes to reliably get current user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return unsub;
  }, []);

  const pwStrength = () => {
    if (password.length < 6) return { level: 0, label: 'Too short', color: '#EEE' };
    if (password.length < 8) return { level: 1, label: 'Weak', color: colors.sos };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password))
      return { level: 3, label: 'Strong', color: colors.safe };
    return { level: 2, label: 'Medium', color: colors.warn };
  };

  const goNext = async () => {
    setError('');
    if (step === 0) {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
        setError('Please fill in all required fields.'); return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address.'); return;
      }
      if (password !== confirmPw) {
        setError('Passwords do not match.'); return;
      }
      if (pwStrength().level < 2) {
        setError('Please choose a stronger password.'); return;
      }
      setLoading(true);
      try {
        // Create Firebase account
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);

        // Send verification email using Firebase
        await sendEmailVerification(userCredential.user);

        // Save user data to Firestore immediately
        const db = getFirestore();
        const userData = {
          firstName: capitalize(firstName),
          lastName: capitalize(lastName),
          email: email.trim(),
          barangay: '',
          status: 'active',
          registrationComplete: false,
          accountCreated: Timestamp.now(),
          lastLogin: Timestamp.now(),
        };
        console.log('Creating user doc for uid:', userCredential.user.uid);
        console.log('User data:', userData);
        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        console.log('User document created successfully in Step 0');

        setLoading(false);
        setStep(1);
      } catch (err) {
        setLoading(false);
        let errorMsg = err.message || 'Failed to create account. Please try again.';
        if (err.code === 'auth/email-already-in-use') {
          errorMsg = 'This email is already registered.';
        } else if (err.code === 'auth/invalid-email') {
          errorMsg = 'Invalid email address.';
        } else if (err.code === 'auth/weak-password') {
          errorMsg = 'Password is too weak.';
        }
        setError(errorMsg);
      }
    } else if (step === 1) {
      // Verify email and proceed to profile collection
      const user = auth.currentUser;
      if (!user) {
        setError('Please verify your email first by clicking the link.');
        return;
      }

      // Refresh auth state to get latest email verification status from Firebase
      await reload(user);

      if (!user.emailVerified) {
        setError('Please verify your email first by clicking the link.');
        return;
      }

      setLoading(false);
      setStep(2);
    } else {
      setLoading(true);
      setError('');
      if (!emergency.trim()) {
        setLoading(false);
        setError('Please fill in emergency contact.');
        return;
      }

      // Validate and format barangay and city
      const barangayResult = formatBarangayCity(barangay, city);
      if (barangayResult.error) {
        setLoading(false);
        setError(barangayResult.error);
        return;
      }

      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user logged in');

        const db = getFirestore();

        // Update the Firestore document with profile data
        // Do NOT set registrationComplete yet - wait until RegisterSuccessScreen
        await setDoc(doc(db, 'users', user.uid), {
          firstName: capitalize(firstName),
          lastName: capitalize(lastName),
          email: email.trim(),
          barangay: barangayResult.formatted,
          emergency: emergency.trim(),
          status: 'active',
          registrationComplete: false,
          lastLogin: Timestamp.now(),
        }, { merge: true });

        setLoading(false);
        navigation.replace('RegisterSuccess');
      } catch (err) {
        setLoading(false);
        console.error('Profile error:', err);
        setError(err?.message || 'Failed to save to Firestore.');
      }
    }
  };

  const pw = pwStrength();

  const handleResendEmail = async () => {
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Please wait a moment for your session to load...');
        return;
      }
      await sendEmailVerification(user);
      alert('Verification email sent! Check your inbox.');
    } catch (err) {
      setError('Failed to resend email: ' + err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <TouchableOpacity style={styles.backBtn} onPress={() => step > 0 ? setStep(s => s - 1) : navigation.goBack()}>
          <FontAwesome6 name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            {step === 0 ? 'Create Account' : step === 1 ? 'Check Your Email' : 'Your Profile'}
          </Text>
          <Text style={styles.heroSub}>
            {step === 0 ? 'Join Vio-less to report and track cases' :
             step === 1 ? `Verification link sent to ${email}` :
             'Almost done — just a few more details'}
          </Text>
        </View>

        {/* Step indicators */}
        <View style={styles.stepRow}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
                <Text style={[styles.stepNum, i <= step && styles.stepNumActive]}>
                  {i < step ? '✓' : i + 1}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, i < step && styles.stepLineActive]} />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.formWrap}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Error */}
        {!!error && (
          <View style={styles.errorBox}>
            <FontAwesome6 name="exclamation-circle" size={14} color={colors.sos} style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── STEP 0: Account Info ── */}
        {step === 0 && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>First name</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your first name"
                  placeholderTextColor={colors.placeholder}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Last name</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your last name"
                  placeholderTextColor={colors.placeholder}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Middle name <Text style={styles.labelOptional}>(optional)</Text></Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your middle name"
                  placeholderTextColor={colors.placeholder}
                  value={middleName}
                  onChangeText={setMiddleName}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email address</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}></Text>
                <TextInput
                  style={styles.input}
                  placeholder="your.email@example.com"
                  placeholderTextColor={colors.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a strong password"
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => setShowPw(s => !s)} style={{ padding: 4 }}>
                  <FontAwesome6 name={showPw ? "eye-slash" : "eye"} size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              {/* Strength bar */}
              {password.length > 0 && (
                <>
                  <View style={styles.strengthTrack}>
                    <View style={[styles.strengthFill, { width: `${(pw.level / 3) * 100}%`, backgroundColor: pw.color }]} />
                  </View>
                  <Text style={[styles.strengthLabel, { color: pw.color }]}>{pw.label} password</Text>
                </>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm password</Text>
              <View style={[styles.inputRow, confirmPw && confirmPw !== password && styles.inputError]}>
                <Text style={styles.inputIcon}></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Repeat your password"
                  placeholderTextColor={colors.placeholder}
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                  secureTextEntry={!showPw}
                />
              </View>
              {confirmPw.length > 0 && confirmPw !== password && (
                <Text style={{ fontSize: 10, color: colors.sos, marginTop: 3 }}>Passwords do not match</Text>
              )}
            </View>
          </>
        )}

        {/* ── STEP 1: Email Verification ── */}
        {step === 1 && (
          <>
            <View style={styles.emailVerifyBox}>
              <FontAwesome6 name="envelope" size={48} color={colors.primary} style={{ marginBottom: spacing.md }} />
              <Text style={styles.emailVerifyTitle}>Check your email</Text>
              <Text style={styles.emailVerifyText}>
                We've sent a verification link to{'\n'}<Text style={{ fontWeight: '700' }}>{email}</Text>
              </Text>
              <Text style={styles.emailVerifyInstructions}>
                Click the link in the email to verify your account, then come back here to continue.
              </Text>
            </View>
            <TouchableOpacity style={styles.resendRow} onPress={handleResendEmail}>
              <Text style={styles.resendText}>
                Didn't receive it?{' '}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Resend email</Text>
              </Text>
            </TouchableOpacity>
            <View style={styles.safetyNote}>
              <View style={styles.safetyDot} />
              <Text style={styles.safetyText}>
                The verification link will expire in 24 hours.
              </Text>
            </View>
          </>
        )}

        {/* ── STEP 2: Profile ── */}
        {step === 2 && (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>I am a</Text>
              <View style={styles.roleGrid}>
                {[
                  { id: 'woman',   icon: 'user-circle', label: 'Woman / Girl' },
                  { id: 'youth',   icon: 'backpack', label: 'Youth / Student' },
                  { id: 'witness', icon: 'eye', label: 'Witness' },
                  { id: 'other',   icon: 'user', label: 'Prefer not to say' },
                ].map(r => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.roleCard, role === r.id && styles.roleCardActive]}
                    onPress={() => setRole(r.id)}
                    activeOpacity={0.8}
                  >
                    <FontAwesome6 name={r.icon} size={22} color={role === r.id ? colors.primary : colors.textSecondary} style={{ marginBottom: spacing.xs }} />
                    <Text style={[styles.roleLabel, role === r.id && styles.roleLabelActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Emergency contact</Text>
              <View style={styles.inputRow}>
                <FontAwesome6 name="phone" size={16} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
                <TextInput
                  style={styles.input}
                  placeholder="+63 9XX XXX XXXX"
                  placeholderTextColor={colors.placeholder}
                  value={emergency}
                  onChangeText={setEmergency}
                  keyboardType="phone-pad"
                />
              </View>
              <Text style={styles.fieldHint}>This person will be notified when you press SOS</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Barangay</Text>
              <View style={styles.inputRow}>
                <FontAwesome6 name="map-pin" size={16} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Mabayuan"
                  placeholderTextColor={colors.placeholder}
                  value={barangay}
                  onChangeText={setBarangay}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>City</Text>
              <View style={styles.inputRow}>
                <FontAwesome6 name="building" size={16} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Olongapo City"
                  placeholderTextColor={colors.placeholder}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>
          </>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={[styles.btnPrimary, shadow.md, loading && { opacity: 0.75 }]}
          onPress={goNext}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={styles.btnPrimaryText}>
            {loading ? 'Please wait...' :
             step === 0 ? 'Send Verification Email →' :
             step === 1 ? 'Continue →' :
             'Complete Setup'}
          </Text>
        </TouchableOpacity>

        {step === 0 && (
          <TouchableOpacity style={styles.loginRow} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  hero: {
    backgroundColor: colors.primaryDark,
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  circle1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.05)', right: -50, top: -40 },
  circle2: { position: 'absolute', width: 90,  height: 90,  borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.04)', right: 40,  top: 20 },
  backBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  backIcon: { fontSize: 18, color: '#fff' },
  heroContent: { marginBottom: spacing.lg },
  heroTitle:   { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
  heroSub:     { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 18 },
  stepRow:     { flexDirection: 'row', alignItems: 'center' },
  stepDot:     { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  stepDotActive:{ backgroundColor: colors.primary },
  stepNum:     { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.5)' },
  stepNumActive:{ color: '#fff' },
  stepLine:    { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 4 },
  stepLineActive:{ backgroundColor: colors.primary },

  scroll:   { flex: 1 },
  formWrap: { padding: spacing.xl, paddingBottom: 60 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.sosLight,
    borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 0.5, borderColor: 'rgba(198,40,40,0.2)',
  },
  errorText: { fontSize: 12, color: colors.sos, fontWeight: '500', flex: 1 },

  field:     { marginBottom: spacing.md },
  label: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    letterSpacing: 0.5, marginBottom: spacing.xs,
  },
  labelOptional: { fontSize: 10, fontWeight: '400', color: colors.textMuted },
  fieldHint: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 0.5, borderColor: colors.borderLight,
    borderRadius: radius.md, paddingHorizontal: spacing.md, height: 50,
  },
  inputError: { borderColor: colors.sos, backgroundColor: colors.sosLight },
  inputIcon:  { fontSize: 16, marginRight: spacing.sm },
  input: { flex: 1, fontSize: 14, color: colors.text, height: '100%' },
  strengthTrack: { height: 3, backgroundColor: '#EEE', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  strengthFill:  { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 10, marginTop: 3 },

  emailVerifyBox: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(194,24,91,0.2)',
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emailVerifyIcon: { fontSize: 48, marginBottom: spacing.md },
  emailVerifyTitle: { fontSize: 16, fontWeight: '800', color: colors.primary, marginBottom: spacing.sm, textAlign: 'center' },
  emailVerifyText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md, lineHeight: 20 },
  emailVerifyInstructions: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },

  resendRow:    { alignItems: 'center', marginBottom: spacing.xl },
  resendText:   { fontSize: 12, color: colors.textMuted },

  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  roleCard: {
    width: '47%', backgroundColor: colors.white,
    borderRadius: radius.lg, borderWidth: 1.5,
    borderColor: colors.borderLight, padding: spacing.md, alignItems: 'center',
  },
  roleCardActive:  { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  roleIcon:        { fontSize: 22, marginBottom: spacing.xs },
  roleLabel:       { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  roleLabelActive: { color: colors.primary },

  btnPrimary: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: 15, alignItems: 'center',
    marginTop: spacing.md, marginBottom: spacing.md,
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  loginRow: { alignItems: 'center', marginTop: spacing.xs },
  loginText:{ fontSize: 13, color: colors.textMuted },
  loginLink:{ color: colors.primary, fontWeight: '700' },

  safetyNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.safeLight, borderRadius: radius.md, padding: spacing.md,
  },
  safetyDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.safe, marginTop: 3, flexShrink: 0 },
  safetyText: { fontSize: 11, color: colors.safe, fontWeight: '500', lineHeight: 16, flex: 1 },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, TextInput, KeyboardAvoidingView,
  Platform, ScrollView, Animated, Modal, FlatList,
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, spacing, radius, shadow } from '../../theme';
import { supabase } from '../../config/supabase';

const STEPS = ['Account', 'Check Email', 'Profile'];

const BARANGAYS = [
  'Barangay Asinan',
  'Barangay Banicain',
  'Barangay Barretto',
  'Barangay East Bajac-Bajac',
  'Barangay East Tapinac',
  'Barangay Gordon Heights',
  'Barangay Kalaklan',
  'Barangay Mabayuan',
  'Barangay New Asinan',
  'Barangay New Cabalan',
  'Barangay New Ilalim',
  'Barangay New Kababae',
  'Barangay New Kalalake',
  'Barangay Old Cabalan',
  'Barangay Pag-asa',
  'Barangay Santa Rita',
  'Barangay West Bajac-Bajac',
  'Barangay West Tapinac',
];

const capitalize = (str) => {
  if (!str) return '';
  return str.trim().replace(/\s+/g, ' ').split(' ').map(word => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

const formatNameInput = (value) => {
  return value.replace(/\s+/g, ' ').trimStart();
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
  const [emergency,    setEmergency]    = useState('');
  const [contactNum,   setContactNum]   = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [currentUser, setCurrentUser]   = useState(null);
  const [showBarangayModal, setShowBarangayModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Listen to auth state changes to reliably get current user
  useEffect(() => {
    const syncCurrentUser = async () => {
      const { data: { session } = {} } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      setCurrentUser(user);

      if (step === 1 && user?.email_confirmed_at) {
        setStep(2);
      }
    };
    syncCurrentUser();

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);

      if (step === 1 && user?.email_confirmed_at) {
        setStep(2);
      }
    });

    return () => subscription?.unsubscribe?.();
  }, [step]);

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
        // Use landing app email confirmation page for email verification
        // The page will handle Supabase auth callback and verify the email
        const redirectUrl = 'https://violess-landing.vercel.app/email-confirmed';
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) throw error;

        try {
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email.trim(),
          });

          if (resendError) {
            console.warn('Verification email resend failed after signup:', resendError);
          }
        } catch (resendErr) {
          console.warn('Verification email resend error after signup:', resendErr);
        }

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
        } else if (/rate limit|too many requests|email.*limit/i.test(err.message || '')) {
          errorMsg = 'Verification emails are temporarily rate-limited. Please wait a few minutes and try again.';
        }
        setError(errorMsg);
      }
    } else if (step === 1) {
      // Just verify email is confirmed, don't sign in yet (we'll sign in after profile is complete)
      setLoading(true);
      try {
        // Check if email was confirmed by attempting to sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setLoading(false);
          setError('Email not yet verified or incorrect credentials.');
          return;
        }

        // Email is verified and credentials are correct, proceed to profile step
        // (User is now signed in but registration_complete is not set yet)
        setLoading(false);
        setStep(2);
      } catch (err) {
        setLoading(false);
        console.error('Step 1 verification error:', err);
        setError('An error occurred. Please try again.');
      }
    } else {
      setLoading(true);
      setError('');
      if (!contactNum.trim()) {
        setLoading(false);
        setError('Please fill in contact number.');
        return;
      }
      if (!emergency.trim()) {
        setLoading(false);
        setError('Please fill in emergency contact.');
        return;
      }
      if (!barangay.trim()) {
        setLoading(false);
        setError('Please select a barangay.');
        return;
      }

      try {
        const { data: { session } = {} } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) throw new Error('No user logged in');

        const { error: profileError } = await supabase.from('users').upsert([
          {
            id: user.id,
            first_name: capitalize(firstName),
            middle_name: middleName ? capitalize(middleName) : null,
            last_name: capitalize(lastName),
            email: email.trim(),
            barangay: barangay.trim(),
            city: 'Olongapo',
            role,
            emergency: emergency.trim(),
            contact_number: contactNum.trim(),
            status: 'active',
            registration_complete: true,
            last_login: new Date().toISOString(),
          }
        ], { onConflict: 'id' });

        if (profileError) throw profileError;

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
      const { data: { session } = {} } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || !user.email) {
        setError('Please wait a moment for your session to load...');
        return;
      }
      const { error } = await supabase.auth.resend({ type: 'signup', email: user.email });
      if (error) throw error;
      alert('Verification email sent! Check your inbox.');
    } catch (err) {
      const rateLimited = /rate limit|too many requests|email.*limit/i.test(err.message || '');
      setError(rateLimited
        ? 'Too many verification emails sent. Please wait a few minutes before trying again.'
        : 'Failed to resend email: ' + (err.message || 'Unknown error'));
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
                  onChangeText={(text) => setFirstName(formatNameInput(capitalize(text)))}
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
                  onChangeText={(text) => setLastName(formatNameInput(capitalize(text)))}
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
                  onChangeText={(text) => setMiddleName(formatNameInput(capitalize(text)))}
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
                  { id: 'woman',   icon: 'user-circle', label: 'Woman / Girl', age: 'age 18-35' },
                  { id: 'youth',   icon: 'graduation-cap', label: 'Youth', age: 'age 13-17' },
                  { id: 'children', icon: 'child', label: 'Children', age: 'age below 13' },
                  { id: 'other',   icon: 'user', label: 'Prefer not to say', age: '' },
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
                    {r.age && (
                      <Text style={[styles.roleAge, role === r.id && styles.roleAgeActive]}>
                        {r.age}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contact number</Text>
              <View style={styles.inputRow}>
                <FontAwesome6 name="phone" size={16} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
                <TextInput
                  style={styles.input}
                  placeholder="+63 9XX XXX XXXX"
                  placeholderTextColor={colors.placeholder}
                  value={contactNum}
                  onChangeText={setContactNum}
                  keyboardType="phone-pad"
                />
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
              <Text style={styles.label}>City</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.input, { color: colors.text, flex: 1, lineHeight: 50 }]}>Olongapo</Text>
                <FontAwesome6 name="lock" size={16} color={colors.textMuted} style={{ marginLeft: spacing.sm }} />
              </View>
              <Text style={styles.fieldHint}>This field is fixed to Olongapo City.</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Barangay</Text>
              <TouchableOpacity
                style={[styles.inputRow, styles.dropdownTrigger]}
                onPress={() => setShowBarangayModal(true)}
              >
                <Text style={[styles.input, { color: barangay ? colors.text : colors.placeholder, flex: 1, lineHeight: 50 }]}>
                  {barangay || 'Select a barangay'}
                </Text>
                <FontAwesome6 name="chevron-down" size={14} color={colors.textMuted} />
              </TouchableOpacity>
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

      {/* Barangay Dropdown Modal */}
      <Modal
        visible={showBarangayModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBarangayModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowBarangayModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Barangay</Text>
              <TouchableOpacity onPress={() => setShowBarangayModal(false)}>
                <FontAwesome6 name="times" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={BARANGAYS}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.barangayOption, barangay === item && styles.barangayOptionActive]}
                  onPress={() => {
                    setBarangay(item);
                    setShowBarangayModal(false);
                  }}
                >
                  <Text style={[styles.barangayOptionText, barangay === item && styles.barangayOptionTextActive]}>
                    {item}
                  </Text>
                  {barangay === item && (
                    <FontAwesome6 name="check" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  roleAge:         { fontSize: 9, fontWeight: '400', color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  roleAgeActive:   { color: colors.primary },

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

  dropdownTrigger: { paddingRight: spacing.sm, justifyContent: 'space-between' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
    paddingTop: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  barangayOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  barangayOptionActive: {
    backgroundColor: colors.primaryLight,
  },
  barangayOptionText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  barangayOptionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});

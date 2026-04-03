import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Animated, Dimensions,
} from 'react-native';
import { colors, spacing, radius, shadow } from '../../theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Background decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />

      {/* Logo area */}
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🕊</Text>
        </View>
        <Text style={styles.appName}>Vio-less</Text>
        <Text style={styles.tagline}>Your safe space to report,{'\n'}track, and find support</Text>
      </Animated.View>

      {/* Feature pills */}
      <Animated.View style={[styles.pillsWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {[
          { icon: '', text: 'Anonymous reporting' },
          { icon: '', text: 'SOS emergency alerts' },
          { icon: '', text: 'Direct counselor chat' },
        ].map((p, i) => (
          <View key={i} style={styles.featurePill}>
            <Text style={styles.pillIcon}>{p.icon}</Text>
            <Text style={styles.pillText}>{p.text}</Text>
          </View>
        ))}
      </Animated.View>

      {/* CTA buttons */}
      <Animated.View style={[styles.ctaWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <TouchableOpacity
          style={[styles.btnPrimary, shadow.md]}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.88}
        >
          <Text style={styles.btnPrimaryText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.88}
        >
          <Text style={styles.btnSecondaryText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnAnon}
          onPress={() => navigation.navigate('Anonymous')}
          activeOpacity={0.88}
        >
          <Text style={styles.btnAnonText}>  Report Anonymously</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          By continuing, you agree to our Privacy Policy.{'\n'}
          Your data is encrypted and protected.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  circle1: { width: 280, height: 280, top: -80,  right: -80 },
  circle2: { width: 160, height: 160, top: 60,   right: 20 },
  circle3: { width: 200, height: 200, bottom: -60, left: -60 },

  logoWrap:   { alignItems: 'center', marginTop: spacing.xxl },
  logoBox: {
    width: 80, height: 80,
    backgroundColor: colors.primary,
    borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  logoIcon:   { fontSize: 38 },
  appName: {
    fontSize: 36, fontWeight: '800', color: '#fff',
    letterSpacing: -1, marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: 14, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 22,
  },

  pillsWrap: { gap: spacing.sm },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pillIcon: { fontSize: 16 },
  pillText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  ctaWrap: { gap: spacing.sm },
  btnPrimary: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 15, fontWeight: '800', color: colors.primaryDark },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  btnAnon: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnAnonText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  footerNote: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: spacing.xs,
  },
});

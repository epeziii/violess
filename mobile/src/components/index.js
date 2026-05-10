import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, radius, spacing, shadow } from '../theme';

// ── Card ──────────────────────────────────────────────
export const Card = ({ children, style, variant = 'default' }) => {
  const variants = {
    default: styles.card,
    elevated: [styles.card, shadow.md],
    tinted: [styles.card, { backgroundColor: colors.primaryLight, borderColor: 'rgba(194,24,91,0.15)' }],
    danger: [styles.card, { backgroundColor: colors.sosLight, borderColor: 'rgba(211,47,47,0.2)' }],
    safe: [styles.card, { backgroundColor: colors.safeLight, borderColor: 'rgba(0,105,92,0.2)' }],
  };
  return <View style={[variants[variant], style]}>{children}</View>;
};

// ── Badge / Pill ───────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    pending:  { bg: colors.warnLight,  text: colors.warn,   label: 'Pending' },
    reviewing:{ bg: colors.infoLight,  text: colors.info,   label: 'Reviewing' },
    referred: { bg: colors.accentLight,text: colors.accent, label: 'Referred' },
    resolved: { bg: colors.safeLight,  text: colors.safe,   label: 'Resolved' },
    urgent:   { bg: colors.sosLight,   text: colors.sos,    label: 'Urgent' },
    closed:   { bg: '#F5F5F5',         text: '#757575',     label: 'Closed' },
  };
  const s = map[status] || map.pending;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
    </View>
  );
};

// ── Button ─────────────────────────────────────────────
export const Button = ({
  label, onPress, variant = 'primary', icon, loading, style, disabled
}) => {
  const variantStyle = {
    primary:   [styles.btn, styles.btnPrimary],
    secondary: [styles.btn, styles.btnSecondary],
    ghost:     [styles.btn, styles.btnGhost],
    danger:    [styles.btn, styles.btnDanger],
  };
  const textStyle = {
    primary:   styles.btnTextPrimary,
    secondary: styles.btnTextSecondary,
    ghost:     styles.btnTextGhost,
    danger:    styles.btnTextDanger,
  };
  return (
    <TouchableOpacity
      style={[...variantStyle[variant], disabled && { opacity: 0.5 }, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary} size="small" />
        : <>
            {icon && <Text style={{ marginRight: 6, fontSize: 15 }}>{icon}</Text>}
            <Text style={textStyle[variant]}>{label}</Text>
          </>
      }
    </TouchableOpacity>
  );
};

// ── Section Header ─────────────────────────────────────
export const SectionHeader = ({ title, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ── Timeline Step ──────────────────────────────────────
export const TimelineStep = ({ label, sub, status = 'done', last = false }) => {
  const dotColor = {
    done:    colors.safe,
    active:  colors.primary,
    pending: colors.border,
  };
  return (
    <View style={styles.tlRow}>
      <View style={styles.tlLeft}>
        <View style={[styles.tlDot, { backgroundColor: dotColor[status] }]}>
          {status === 'done' && <Text style={{ color: '#fff', fontSize: 9 }}>✓</Text>}
        </View>
        {!last && <View style={[styles.tlLine, { backgroundColor: status === 'done' ? colors.safe : colors.border }]} />}
      </View>
      <View style={styles.tlContent}>
        <Text style={[styles.tlLabel, status === 'pending' && { color: colors.textMuted }]}>{label}</Text>
        {sub && <Text style={styles.tlSub}>{sub}</Text>}
      </View>
    </View>
  );
};

// ── Input ──────────────────────────────────────────────
export const Input = ({ label, ...props }) => (
  <View style={styles.inputWrap}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    {/* In real RN use TextInput from react-native */}
    <View style={styles.inputField}>
      <Text style={{ color: colors.placeholder, fontSize: 13 }}>{props.placeholder}</Text>
    </View>
  </View>
);

// ── Avatar ─────────────────────────────────────────────
export const Avatar = ({ initials, size = 40, color = colors.primary }) => (
  <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
    <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{initials}</Text>
  </View>
);

// ── Quick Action Card ──────────────────────────────────
export const QuickCard = ({ icon, title, desc, onPress, accent = colors.primaryLight }) => (
  <TouchableOpacity style={[styles.quickCard, shadow.sm]} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.quickIcon, { backgroundColor: accent }]}>
      {icon && <FontAwesome6 name={icon} size={20} color={colors.primary} />}
    </View>
    <Text style={styles.quickTitle}>{title}</Text>
    <Text style={styles.quickDesc}>{desc}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  btnPrimary:   { backgroundColor: colors.primary },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  btnGhost:     { backgroundColor: colors.primaryLight },
  btnDanger:    { backgroundColor: colors.sos },
  btnTextPrimary:   { color: '#fff',           fontWeight: '700', fontSize: 14 },
  btnTextSecondary: { color: colors.primary,   fontWeight: '700', fontSize: 14 },
  btnTextGhost:     { color: colors.primary,   fontWeight: '600', fontSize: 14 },
  btnTextDanger:    { color: '#fff',            fontWeight: '700', fontSize: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.6, textTransform: 'uppercase' },
  sectionAction: { fontSize: 12, fontWeight: '600', color: colors.primary },
  tlRow:    { flexDirection: 'row', marginBottom: 0 },
  tlLeft:   { alignItems: 'center', marginRight: spacing.md },
  tlDot:    { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  tlLine:   { width: 2, flex: 1, minHeight: 28, marginTop: 2, marginBottom: 2 },
  tlContent:{ flex: 1, paddingBottom: spacing.md, paddingTop: 2 },
  tlLabel:  { fontSize: 13, fontWeight: '600', color: colors.text },
  tlSub:    { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  inputWrap: { marginBottom: spacing.md },
  inputLabel:{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 4, letterSpacing: 0.4 },
  inputField:{
    backgroundColor: colors.surfaceAlt,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 13,
  },
  avatar:      { alignItems: 'center', justifyContent: 'center' },
  avatarText:  { color: '#fff', fontWeight: '700' },
  quickCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flex: 1,
    margin: spacing.xs,
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  quickTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
  quickDesc:  { fontSize: 11, color: colors.textMuted, lineHeight: 15 },
});

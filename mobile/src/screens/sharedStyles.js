// ─── Shared styles ─────────────────────────────────────────────────────────────
import { StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../theme';

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#1A0000' },
  header: {
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon:     { fontSize: 20, color: '#fff' },
  headerTitle:  { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#fff' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: spacing.sm, marginTop: spacing.md },
  content:      { padding: spacing.lg, paddingBottom: 100 },
  caseCard:     { borderWidth: 1, borderColor: 'transparent' },
  caseCardActive:{ borderColor: colors.primary, backgroundColor: colors.primaryLight },
  caseTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs },
  caseId:       { fontSize: 13, fontWeight: '700', color: colors.text },
  caseType:     { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  caseDate:     { fontSize: 11, color: colors.textMuted },
  officerRow:   { flexDirection: 'row', alignItems: 'center' },
  officerName:  { fontSize: 14, fontWeight: '700', color: colors.text },
  officerRole:  { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  msgBtn:       { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.sm },
  msgBtnText:   { color: colors.primary, fontSize: 11, fontWeight: '700' },
  unreadBadge:  { position: 'absolute', top: 36, right: 8, zIndex: 2, backgroundColor: colors.sos, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadBadgeText:{ color: '#fff', fontSize: 10, fontWeight: '700' },
  onlineRow:    { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.safe, marginRight: 4 },
  onlineText:   { fontSize: 10, color: 'rgba(255,255,255,0.65)' },
});

const ch = StyleSheet.create({
  msgWrap:    { marginBottom: spacing.sm, maxWidth: '80%' },
  msgWrapMe:  { alignSelf: 'flex-end', alignItems: 'flex-end' },
  senderName: { fontSize: 10, fontWeight: '700', color: colors.primary, marginBottom: 3 },
  bubble:     { borderRadius: radius.lg, padding: spacing.md, paddingBottom: spacing.sm },
  bubbleMe:   { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: colors.white, borderWidth: 0.5, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 13, color: colors.text, lineHeight: 19 },
  timeText:   { fontSize: 9, color: colors.textMuted, marginTop: 4, textAlign: 'right' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 0.5,
    borderTopColor: colors.borderLight,
    gap: spacing.sm,
  },
  attachBtn:  { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.text,
    maxHeight: 80,
  },
  sendBtn:    { width: 38, height: 38, backgroundColor: colors.primary, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  sendIcon:   { color: '#fff', fontSize: 14, marginLeft: 2 },
});

const r2 = StyleSheet.create({
  resRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  resIcon:      { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  resTitle:     { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 2 },
  resDesc:      { fontSize: 11, color: colors.textMuted, lineHeight: 15 },
  mapPlaceholder:{ backgroundColor: colors.safeLight, borderRadius: radius.md, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  centerRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  centerDot:    { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  centerName:   { flex: 1, fontSize: 12, fontWeight: '600', color: colors.text },
  centerDist:   { fontSize: 11, color: colors.textMuted },
  dirBtn:       { backgroundColor: colors.infoLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  dirBtnText:   { color: colors.info, fontSize: 10, fontWeight: '700' },
});

const pv = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon:    { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:   { fontSize: 13, fontWeight: '700', color: colors.text },
  desc:    { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  exitBtn: {
    backgroundColor: colors.sos, borderRadius: radius.lg, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg,
  },
  exitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export { s, ch, r2, pv };

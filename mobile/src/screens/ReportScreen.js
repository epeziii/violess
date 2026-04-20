import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, StatusBar, TextInput, Alert
} from 'react-native';
import { colors, spacing, radius } from '../theme';
import { Card, Button } from '../components';

const INCIDENT_TYPES = [
  { id: 'domestic', label: 'Domestic Violence', icon: '' },
  { id: 'harassment', label: 'Harassment', icon: '' },
  { id: 'bullying', label: 'Bullying', icon: '' },
  { id: 'abuse', label: 'Abuse', icon: '' },
  { id: 'threats', label: 'Threats', icon: '' },
  { id: 'other', label: 'Other', icon: '' },
];

export default function ReportScreen({ navigation }) {
  const [selectedType, setSelectedType] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [datetime, setDatetime] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // ✅ VALIDATION FUNCTIONS
  const validateStep1 = () => {
    if (!selectedType) {
      Alert.alert('Missing Information', 'Please select an incident type.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please describe the incident.');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateStep1() || !validateStep2()) return;

    // 🔥 ready for backend integration later
    console.log({
      selectedType,
      isAnonymous,
      description,
      location,
      datetime,
    });

    setSubmitted(true);
  };

  // ✅ SUCCESS SCREEN
  if (submitted) {
    return (
      <View style={styles.successWrap}>
        <View style={styles.successIcon}>
          <Text style={{ fontSize: 40 }}>✅</Text>
        </View>

        <Text style={styles.successTitle}>Report Submitted</Text>

        <Text style={styles.successSub}>
          Your report has been received.{'\n'}
          {isAnonymous
            ? 'Your identity is protected.'
            : 'A case officer will contact you.'}
        </Text>

        <View style={styles.caseIdBox}>
          <Text style={styles.caseIdLabel}>Your Case ID</Text>
          <Text style={styles.caseIdValue}>#VIO-2026-001</Text>
        </View>

        <Button
          label="Track My Case"
          onPress={() => navigation.navigate('Track')}
          style={{ marginTop: spacing.xl, width: '100%' }}
        />

        <Button
          label="Back to Home"
          variant="ghost"
          onPress={() => navigation.navigate('Home')}
          style={{ marginTop: spacing.sm, width: '100%' }}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>File Incident Report</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* STEP INDICATOR */}
      <View style={styles.stepRow}>
        {[1, 2, 3].map(s => (
          <React.Fragment key={s}>
            <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
              <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
            </View>
            {s < 3 && (
              <View style={[styles.stepLine, step > s && styles.stepLineActive]} />
            )}
          </React.Fragment>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <Card variant="tinted">
              <View style={styles.anonRow}>
                <View style={styles.anonLeft}>
                  <Text style={{ fontSize: 20, marginRight: spacing.md }}></Text>
                  <View>
                    <Text style={styles.anonTitle}>Report Anonymously</Text>
                    <Text style={styles.anonSub}>Your identity will be hidden</Text>
                  </View>
                </View>

                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  trackColor={{ true: colors.primary, false: '#ddd' }}
                  thumbColor="#fff"
                />
              </View>
            </Card>

            <Text style={styles.stepLabel}>Step 1 of 3 — Type of Incident</Text>

            <View style={styles.typeGrid}>
              {INCIDENT_TYPES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.typeCard,
                    selectedType === t.id && styles.typeCardActive
                  ]}
                  onPress={() => setSelectedType(t.id)}
                >
                  <Text style={styles.typeIcon}>{t.icon}</Text>
                  <Text
                    style={[
                      styles.typeLabel,
                      selectedType === t.id && styles.typeLabelActive
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              label="Next: Describe Incident →"
              onPress={() => {
                if (validateStep1()) setStep(2);
              }}
              style={{ marginTop: spacing.md }}
            />
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <Text style={styles.stepLabel}>Step 2 of 3 — Details</Text>

            <Text style={styles.fieldLabel}>What happened? *</Text>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Describe the incident..."
              placeholderTextColor={colors.placeholder}
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.fieldLabel}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Where did it happen?"
              placeholderTextColor={colors.placeholder}
              value={location}
              onChangeText={setLocation}
            />

            <Text style={styles.fieldLabel}>Date & Time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. March 15, 8:30 PM"
              placeholderTextColor={colors.placeholder}
              value={datetime}
              onChangeText={setDatetime}
            />

            <View style={styles.navRow}>
              <Button label="← Back" variant="ghost" onPress={() => setStep(1)} style={{ flex: 1 }} />
              <Button
                label="Next: Review →"
                onPress={() => {
                  if (validateStep2()) setStep(3);
                }}
                style={{ flex: 2 }}
              />
            </View>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <Text style={styles.stepLabel}>Step 3 of 3 — Review</Text>

            <Card>
              <Text style={styles.reviewTitle}>Summary</Text>

              <Text>Type: {INCIDENT_TYPES.find(t => t.id === selectedType)?.label}</Text>
              <Text>Anonymous: {isAnonymous ? 'Yes' : 'No'}</Text>
              <Text>Location: {location || 'N/A'}</Text>
              <Text>Description: {description}</Text>
            </Card>

            <View style={styles.navRow}>
              <Button label="← Back" variant="ghost" onPress={() => setStep(2)} style={{ flex: 1 }} />
              <Button label="Submit Report" onPress={handleSubmit} style={{ flex: 2 }} />
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },

  header: {
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },

  backBtn: { width: 36 },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontWeight: '700' },

  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: '#fff',
  },

  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: colors.primary },

  stepNum: { color: '#aaa' },
  stepNumActive: { color: '#fff' },

  stepLine: { width: 40, height: 2, backgroundColor: '#eee' },
  stepLineActive: { backgroundColor: colors.primary },

  content: { padding: spacing.lg },

  stepLabel: { marginBottom: spacing.md, fontWeight: '700' },

  anonRow: { flexDirection: 'row', alignItems: 'center' },
  anonLeft: { flexDirection: 'row', flex: 1 },

  anonTitle: { fontWeight: '700' },
  anonSub: { fontSize: 12 },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  typeCard: {
    width: '47%',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: radius.lg,
    alignItems: 'center',
  },

  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  typeIcon: { fontSize: 24 },
  typeLabel: { fontSize: 12 },

  typeLabelActive: { color: colors.primary },

  fieldLabel: { marginTop: spacing.sm },

  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 100,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: radius.md,
    padding: spacing.md,
  },

  navRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
  },

  successWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  successIcon: {
    marginBottom: spacing.lg,
  },

  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  successSub: {
    textAlign: 'center',
    marginVertical: spacing.md,
  },

  caseIdBox: {
    padding: spacing.md,
    backgroundColor: '#eee',
    borderRadius: radius.md,
    marginTop: spacing.md,
  },

  caseIdLabel: { fontSize: 12 },
  caseIdValue: { fontSize: 20, fontWeight: 'bold' },

  reviewTitle: { fontWeight: '700', marginBottom: spacing.sm },
});
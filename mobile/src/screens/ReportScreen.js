import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, StatusBar, TextInput, Alert, ActivityIndicator,
  Animated, Vibration
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, spacing, radius } from '../theme';
import { Card, Button } from '../components';
import { auth } from '../config/firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { API_BASE_URL } from '../config/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const INCIDENT_TYPES = [
  { id: 'domestic', label: 'Domestic Violence', icon: 'heart-crack' },
  { id: 'harassment', label: 'Harassment', icon: 'ban' },
  { id: 'bullying', label: 'Bullying', icon: 'users-slash' },
  { id: 'abuse', label: 'Abuse', icon: 'shield-halved' },
  { id: 'threats', label: 'Threats', icon: 'triangle-exclamation' },
  { id: 'other', label: 'Other', icon: 'question' },
];

const DESCRIPTION_MAX_LENGTH = 1500;
const LOCATION_MAX_LENGTH = 100;
const SUSPECT_DESCRIPTION_MAX_LENGTH = 1000;

export default function ReportScreen({ navigation }) {
  const scrollViewRef = useRef(null);
  const shakeAnimations = useRef({
    description: new Animated.Value(0),
    location: new Animated.Value(0),
    suspectDescription: new Animated.Value(0),
  }).current;
  const [selectedType, setSelectedType] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [step, setStep] = useState(1);
  const [limitFlashField, setLimitFlashField] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
const [showDatePicker, setShowDatePicker] = useState(false);

const [time, setTime] = useState(new Date());
const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [caseId, setCaseId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suspectDescription, setSuspectDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidenceUploadStatus, setEvidenceUploadStatus] = useState('idle');
  const [evidenceError, setEvidenceError] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  useEffect(() => {
    const loadReporterContactInfo = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setContactNumber(data.contactNumber || '');
          setEmergencyContact(data.emergency || data.emergencyContact || '');
        }
      } catch (error) {
        console.error('Error loading reporter contact info:', error);
      }
    };

    loadReporterContactInfo();
  }, []);

  useEffect(() => {
    if (!limitFlashField) return;

    const timeout = setTimeout(() => {
      setLimitFlashField(null);
    }, 400);

    return () => clearTimeout(timeout);
  }, [limitFlashField]);

  const triggerLimitFeedback = (fieldKey) => {
    const animation = shakeAnimations[fieldKey];
    animation.stopAnimation();
    animation.setValue(0);

    Animated.sequence([
      Animated.timing(animation, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(animation, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(animation, { toValue: -4, duration: 50, useNativeDriver: true }),
      Animated.timing(animation, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(animation, { toValue: -2, duration: 50, useNativeDriver: true }),
      Animated.timing(animation, { toValue: 2, duration: 50, useNativeDriver: true }),
      Animated.timing(animation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    Vibration.vibrate([30, 60, 30]);
  };

  const getAnimatedInputStyle = (fieldKey) => ({
    transform: [{ translateX: shakeAnimations[fieldKey] }],
  });

  const getCounterStyle = (value, maxLength) => ({
    ...styles.charCounter,
    color: value >= maxLength ? '#d32f2f' : colors.textMuted,
  });

  const getInputBorderStyle = (fieldKey) => {
    if (limitFlashField !== fieldKey) {
      return null;
    }

    return {
      borderColor: '#d32f2f',
    };
  };

  const focusField = (fieldKey) => {
    const offsetMap = {
      description: 180,
      location: 260,
      suspectDescription: 420,
    };

    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: offsetMap[fieldKey] || 0,
        animated: true,
      });
    });
  };

  const handleLimitedTextChange = (fieldKey, setter, maxLength, text) => {
    const limitedText = text.slice(0, maxLength);
    setter(limitedText);

    if (text.length > maxLength) {
      setLimitFlashField(fieldKey);
      triggerLimitFeedback(fieldKey);
    }
  };

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
    if (!location.trim()) {
      Alert.alert('Missing Information', 'Please provide the location of the incident.');
      return false;
    }
    if (!suspectDescription.trim()) {
      Alert.alert('Missing Information', 'Please describe the suspect.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) return;

    setIsLoading(true);

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert('Error', 'User not authenticated');
        setIsLoading(false);
        return;
      }

      if (!isAnonymous && (!contactNumber || !emergencyContact)) {
        try {
          const uid = auth.currentUser?.uid;
          if (uid) {
            const db = getFirestore();
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setContactNumber(prev => prev || data.contactNumber || data.phone || data.phoneNumber || '');
              setEmergencyContact(prev => prev || data.emergency || data.emergencyContact || '');
            }
          }
        } catch (loadError) {
          console.error('Error loading contact data before submit:', loadError);
        }
      }

      const payload = {
        uid,
        incidentType: selectedType,
        description,
        location,
        suspectDescription,
        evidence: evidenceFiles,
        datetime: `${date.toDateString()} ${time.toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit'
})}`,
        isAnonymous,
      };

      if (!isAnonymous) {
        payload.contactNumber = contactNumber;
        payload.emergencyContact = emergencyContact;
      }

      const response = await fetch(`${API_BASE_URL}/submit-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.error || 'Failed to submit report');
        setIsLoading(false);
        return;
      }

      setCaseId(data.caseId);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ SUCCESS SCREEN
  if (submitted) {
    return (
      <View style={styles.successWrap}>
        <View style={styles.successIcon}>
          <FontAwesome6 name="check-circle" size={60} color={colors.safe} />
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
          <Text style={styles.caseIdValue}>{caseId || '#VIO-2026-001'}</Text>
        </View>

        <Button
          label="Track My Case"
          onPress={() => navigation.navigate('Track')}
          style={{ marginTop: spacing.xl, width: '100%' }}
        />

        <Button
          label="Report Another Case"
          variant="ghost"
          onPress={() => {
            // Go back to the Report screen (first page) instead of staying on the success view
            setSubmitted(false);
            navigation.navigate('Report');
            setStep(1);
          }}
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
          <FontAwesome6 name="arrow-left" size={20} color="#fff" />
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
                  <FontAwesome6 name={t.icon} size={24} color={selectedType === t.id ? colors.primary : colors.textMuted} />
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

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>When filing a report, you must provide clear, accurate, and precise information to ensure the issue can be properly understood and addressed.</Text>
            </View>

            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Describe what happened? *</Text>
              <Text style={getCounterStyle(description.length, DESCRIPTION_MAX_LENGTH)}>{description.length}/{DESCRIPTION_MAX_LENGTH}</Text>
            </View>
            <Animated.View style={getAnimatedInputStyle('description')}>
              <TextInput
                style={[styles.textArea, getInputBorderStyle('description')]}
                multiline
                placeholder="Describe the incident in detail..."
                placeholderTextColor={colors.placeholder}
                value={description}
                onFocus={() => focusField('description')}
                onChangeText={(text) => handleLimitedTextChange('description', setDescription, DESCRIPTION_MAX_LENGTH, text)}
              />
            </Animated.View>

            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Location *</Text>
              <Text style={getCounterStyle(location.length, LOCATION_MAX_LENGTH)}>{location.length}/{LOCATION_MAX_LENGTH}</Text>
            </View>
            <Animated.View style={getAnimatedInputStyle('location')}>
              <TextInput
                style={[styles.input, getInputBorderStyle('location')]}
                placeholder="Where did it happen?"
                placeholderTextColor={colors.placeholder}
                value={location}
                onFocus={() => focusField('location')}
                onChangeText={(text) => handleLimitedTextChange('location', setLocation, LOCATION_MAX_LENGTH, text)}
              />
            </Animated.View>

            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Suspect Description</Text>
              <Text style={getCounterStyle(suspectDescription.length, SUSPECT_DESCRIPTION_MAX_LENGTH)}>{suspectDescription.length}/{SUSPECT_DESCRIPTION_MAX_LENGTH}</Text>
            </View>
            <Animated.View style={getAnimatedInputStyle('suspectDescription')}>
              <TextInput
                style={[styles.textArea, getInputBorderStyle('suspectDescription')]}
                multiline
                placeholder="Describe the suspect (appearance, clothing, behavior, etc.)..."
                placeholderTextColor={colors.placeholder}
                value={suspectDescription}
                onFocus={() => focusField('suspectDescription')}
                onChangeText={(text) => handleLimitedTextChange('suspectDescription', setSuspectDescription, SUSPECT_DESCRIPTION_MAX_LENGTH, text)}
              />
            </Animated.View>

            <Text style={styles.fieldLabel}>Date</Text>
<TouchableOpacity
  style={styles.input}
  onPress={() => setShowDatePicker(true)}
>
  <Text>
    {date ? date.toDateString() : 'Select date'}
  </Text>
</TouchableOpacity>

<Text style={styles.fieldLabel}>Time</Text>
<TouchableOpacity
  style={styles.input}
  onPress={() => setShowTimePicker(true)}
>
  <Text>
    {time ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select time'}
  </Text>
</TouchableOpacity>

{showDatePicker && (
  <DateTimePicker
    value={date}
    mode="date"
    display="default"
    onChange={(event, selectedDate) => {
      setShowDatePicker(false);
      if (selectedDate) setDate(selectedDate);
    }}
  />
)}

{showTimePicker && (
  <DateTimePicker
    value={time}
    mode="time"
    display="default"
    onChange={(event, selectedTime) => {
      setShowTimePicker(false);
      if (selectedTime) setTime(selectedTime);
    }}
  />
)}

            <Text style={styles.fieldLabel}>Evidence Upload <Text style={styles.optional}>(optional)</Text></Text>
            <TouchableOpacity
              style={styles.uploadField}
              onPress={async () => {
                try {
                  setEvidenceError('');
                  setEvidenceUploadStatus('uploading');
                  const result = await DocumentPicker.getDocumentAsync({
                    type: '*/*',
                    copyToCacheDirectory: true,
                  });

                  if (result?.type === 'cancel' || result?.canceled === true) {
                    setEvidenceUploadStatus(evidenceFiles.length > 0 ? 'done' : 'idle');
                    return;
                  }

                  const file = result?.assets?.[0] || result;
                  if (!file?.uri) {
                    throw new Error('No file selected');
                  }

                  // Get file size
                  const fileInfo = await FileSystem.getInfoAsync(file.uri);
                  const fileSizeMB = (fileInfo.size || 0) / (1024 * 1024);

                  // Validate individual file size (10MB max)
                  if (fileSizeMB > 10) {
                    throw new Error(`File exceeds 10MB limit (${fileSizeMB.toFixed(2)}MB)`);
                  }

                  // Calculate total size with existing files
                  const totalSizeMB = evidenceFiles.reduce((sum, f) => sum + (f.sizeMB || 0), 0) + fileSizeMB;
                  if (totalSizeMB > 50) {
                    throw new Error(`Total evidence size exceeds 50MB limit (${totalSizeMB.toFixed(2)}MB)`);
                  }

                  // Check for duplicate files (by name)
                  if (evidenceFiles.some(f => f.name === (file.name || 'Evidence file'))) {
                    throw new Error(`File "${file.name}" is already added`);
                  }

                  const uploadResult = await FileSystem.uploadAsync(
                    `${API_BASE_URL}/upload-evidence`,
                    file.uri,
                    {
                      httpMethod: 'POST',
                      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                      fieldName: 'file',
                      mimeType: file.mimeType || 'application/octet-stream',
                    }
                  );

                  console.log('Upload response status:', uploadResult.status);
                  console.log('Upload response body:', uploadResult.body);

                  let json = {};
                  try {
                    json = JSON.parse(uploadResult.body || '{}');
                  } catch (parseErr) {
                    console.error('JSON parse error. Raw response:', uploadResult.body);
                    throw new Error(`Server error: ${uploadResult.body?.substring(0, 100) || 'Unknown'}`);
                  }

                  if (uploadResult.status !== 200) {
                    let errorMsg = json.error || 'Upload failed';
                    if (errorMsg.includes('entity too large') || errorMsg.includes('413')) {
                      errorMsg = 'File is too large (max 10MB)';
                    }
                    throw new Error(errorMsg);
                  }

                  setEvidenceFiles([...evidenceFiles, {
                    url: json.url,
                    name: json.originalName || file.name || 'Evidence file',
                    publicId: json.publicId,
                    resourceType: json.resourceType,
                    sizeMB: fileSizeMB,
                  }]);
                  setEvidenceUploadStatus('done');
                } catch (err) {
                  console.error('Evidence upload error:', err);
                  setEvidenceError(err.message || 'Evidence upload failed');
                  setEvidenceUploadStatus('failed');
                }
              }}
            >
              <Text style={styles.uploadFieldText}>
                {evidenceUploadStatus === 'uploading'
                  ? 'Uploading evidence…'
                  : '+ Add Evidence File'}
              </Text>
            </TouchableOpacity>

            {evidenceFiles.length > 0 && (
              <View style={styles.evidenceList}>
                {evidenceFiles.map((file, idx) => (
                  <View key={idx} style={styles.evidenceItem}>
                    <View style={styles.evidenceInfo}>
                      <FontAwesome6 name="file" size={16} color={colors.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.evidenceItemName}>{file.name}</Text>
                        <Text style={styles.evidenceItemSize}>{(file.sizeMB || 0).toFixed(2)}MB</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={async () => {
                        try {
                          console.log('Deleting file:', file.name, 'publicId:', file.publicId, 'resourceType:', file.resourceType);
                          if (file.publicId) {
                            const deleteRes = await fetch(`${API_BASE_URL}/delete-evidence`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ publicId: file.publicId, resourceType: file.resourceType }),
                            });
                            const deleteData = await deleteRes.json();
                            console.log('Delete response:', deleteRes.status, deleteData);
                            if (!deleteRes.ok) {
                              Alert.alert('Warning', 'Failed to delete from cloud: ' + (deleteData.error || 'Unknown error'));
                            }
                          } else {
                            console.warn('No publicId for file:', file.name);
                          }
                          setEvidenceFiles(evidenceFiles.filter((_, i) => i !== idx));
                        } catch (err) {
                          console.error('Error deleting evidence:', err);
                          Alert.alert('Warning', 'File removed from list but may still be in cloud storage');
                          setEvidenceFiles(evidenceFiles.filter((_, i) => i !== idx));
                        }
                      }}
                      style={styles.removeBtn}
                    >
                      <FontAwesome6 name="trash" size={16} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.uploadMeta}>
              {evidenceFiles.length > 0
                ? `${evidenceFiles.length} file${evidenceFiles.length !== 1 ? 's' : ''} added (${evidenceFiles.reduce((sum, f) => sum + (f.sizeMB || 0), 0).toFixed(2)}MB / 50MB)`
                : 'No files added yet. Max 10MB per file, 50MB total.'}
            </Text>
            {evidenceUploadStatus === 'failed' ? (
              <Text style={styles.errorText}>{evidenceError || 'Upload failed. Please try again.'}</Text>
            ) : null}

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

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Please review your report carefully to ensure all information is accurate, complete, and clearly presented before submission.</Text>
            </View>

            <Card>
              <Text style={styles.reviewTitle}>Summary</Text>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Type:</Text>
                <Text style={styles.reviewValue}>{INCIDENT_TYPES.find(t => t.id === selectedType)?.label}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Anonymous:</Text>
                <Text style={styles.reviewValue}>{isAnonymous ? 'Yes' : 'No'}</Text>
              </View>

              {location && (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Location:</Text>
                  <Text style={styles.reviewValue}>{location}</Text>
                </View>
              )}

              {(date || time) && (
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Date & Time:</Text>
                <Text style={styles.reviewValue}>
                  {`${date.toDateString()} ${time.toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit'
})}`}
                </Text>
              </View>
              )}

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Description:</Text>
                <Text style={styles.reviewValue}>{description}</Text>
              </View>

              {suspectDescription && (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Suspect Description:</Text>
                  <Text style={styles.reviewValue}>{suspectDescription}</Text>
                </View>
              )}

              {evidenceFiles.length > 0 && (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Evidence files:</Text>
                  <View>
                    {evidenceFiles.map((file, idx) => (
                      <Text key={idx} style={styles.reviewValue}>• {file.name}</Text>
                    ))}
                  </View>
                </View>
              )}
            </Card>

            <View style={styles.navRow}>
              <Button label="← Back" variant="ghost" onPress={() => setStep(2)} style={{ flex: 1 }} />
              <Button
                label={isLoading ? "Submitting..." : "Submit Report"}
                onPress={handleSubmit}
                style={{ flex: 2 }}
                disabled={isLoading}
              />
            </View>

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Submitting your report...</Text>
              </View>
            )}
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

  scroll: { flex: 1 },
  content: { padding: spacing.lg, flexGrow: 1, width: '100%' },

  stepLabel: { marginBottom: spacing.md, fontWeight: '700' },

  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },

  charCounter: { fontSize: 12, color: colors.textMuted },

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

  infoTitle: { fontWeight: '700', marginBottom: spacing.sm, fontSize: 14, textAlign: 'center' },
  infoText: {
  fontSize: 13,        // 👈 slightly smaller
  lineHeight: 18,      // keep it readable
  color: '#333',
},

infoBox: {
  backgroundColor: colors.primaryLight,
  borderRadius: radius.lg,
  padding: spacing.lg,
  marginBottom: spacing.md,
  borderWidth: 0.5,
  borderColor: 'rgba(0,0,0,0.08)',
},

  fieldLabel: { marginTop: spacing.md, fontWeight: '600' },

  optional: { fontSize: 12, fontWeight: '400', color: colors.textMuted },

  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 100,
    marginTop: spacing.sm,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },

  uploadField: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: '#fafafa',
  },

  uploadFieldText: {
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },

  uploadMeta: {
    marginTop: spacing.sm,
    color: '#555',
    fontSize: 12,
  },

  evidenceList: {
    marginTop: spacing.md,
    backgroundColor: '#f5f5f5',
    borderRadius: radius.md,
    padding: spacing.md,
  },

  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },

  evidenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },

  evidenceItemName: {
    flex: 1,
    color: '#333',
    fontSize: 13,
  },

  evidenceItemSize: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },

  removeBtn: {
    padding: spacing.sm,
  },

  errorText: {
    marginTop: spacing.xs,
    color: '#d32f2f',
    fontSize: 12,
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

  reviewRow: { marginBottom: spacing.md },
  reviewLabel: { fontWeight: '600', marginBottom: spacing.xs },
  reviewValue: { fontSize: 13, color: '#666' },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: spacing.md,
    color: colors.primary,
    fontWeight: '600',
  },
});

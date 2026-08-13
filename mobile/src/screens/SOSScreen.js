import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated,
  TouchableOpacity, StatusBar, ScrollView, Easing, Alert
} from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, spacing, shadow } from '../theme';
import { Card, Button, TimelineStep } from '../components';
import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/api';

export default function SOSScreen({ navigation }) {
  const [activated, setActivated] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [holding, setHolding] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.5)).current;
  const countdownRef = useRef(null);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 900, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.4, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();

    return () => {
      loop.stop();
      clearInterval(countdownRef.current);
    };
  }, [pulseAnim, pulseOpacity]);

  // Handle hold start
  const startHold = () => {
    setHolding(true);
    setCountdown(3);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setActivated(true);
          setHolding(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle release (cancel)
  const cancelHold = () => {
    setHolding(false);
    clearInterval(countdownRef.current);
    setCountdown(3);
  };

  const sendSOSAlert = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert('SOS unavailable', 'You must be signed in to send an emergency alert.');
        return;
      }

      let latitude = null;
      let longitude = null;
      let locationLabel = 'Location not available';

      try {
        const { Location } = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;
          locationLabel = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        }
      } catch (locationError) {
        console.warn('Location unavailable for SOS:', locationError);
      }

      const payload = {
        uid,
        reporterName: auth.currentUser?.displayName || 'Unknown user',
        contactNumber: auth.currentUser?.phoneNumber || '',
        emergencyContact: '',
        latitude,
        longitude,
        locationLabel,
        note: 'Emergency SOS raised from mobile app',
      };

      const response = await fetch(`${API_BASE_URL}/send-sos-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to send SOS alert');
      }

      console.log('SOS alert sent successfully:', data);
    } catch (error) {
      console.error('SOS alert error:', error);
      Alert.alert('SOS failed', 'Your emergency alert could not be sent. Please try again.');
      setActivated(false);
      setHolding(false);
      setCountdown(3);
    }
  };

  useEffect(() => {
    if (activated) {
      sendSOSAlert();
    }
  }, [activated]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#7B0000" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <FontAwesome6 name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SOS Emergency</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!activated ? (
          <>
            <Text style={styles.sosInstruct}>
              Hold the SOS button for 3 seconds{'\n'}to send an emergency alert
            </Text>

            <View style={styles.sosCenter}>
              <Animated.View style={[styles.pulseRing, styles.pulseRing3, { transform: [{ scale: pulseAnim }], opacity: pulseOpacity }]} />
              <Animated.View style={[styles.pulseRing, styles.pulseRing2, { transform: [{ scale: Animated.multiply(pulseAnim, 0.85) }], opacity: Animated.multiply(pulseOpacity, 1.4) }]} />

              <TouchableOpacity
                style={styles.sosBtn}
                activeOpacity={0.85}
                onPressIn={startHold}
                onPressOut={cancelHold}
              >
                <FontAwesome6 name="triangle-exclamation" size={28} color="#fff" />
                <Text style={styles.sosBtnText}>
                  {holding ? countdown : 'SOS'}
                </Text>
              </TouchableOpacity>
            </View>

            <Card style={{ marginHorizontal: 0 }}>
              <Text style={styles.flowTitle}>What happens when activated</Text>
              <TimelineStep label="SOS Alert Sent" sub="Your SOS alert is sent to an available duty officer." status="done" />
              <TimelineStep label="Officer Notified" sub="A duty officer receives your name and contact details." status="done" />
              <TimelineStep label="Officer Contacts You" sub="The officer may call you to check your situation." status="done" />
              <TimelineStep label="Help Is Coordinated" sub="Assistance will be arranged based on your needs." status="done" last />
            </Card>

          </>
        ) : (
          <View style={styles.activatedWrap}>
            <View style={styles.activatedIcon}>
              <FontAwesome6 name="tower-broadcast" size={36} color={colors.sos} />
            </View>
            <Text style={styles.activatedTitle}>SOS Alert Sent</Text>
            <Text style={styles.activatedSub}>
              SOS Alert Sent — Your SOS alert is sent to an available duty officer.{'\n'}
              Officer Notified — A duty officer receives your name and contact details.{'\n'}
              Officer Contacts You — The officer may call you to check your situation.{'\n'}
              Help Is Coordinated — Assistance will be arranged based on your needs.
            </Text>

            <Button
              label="Cancel Alert"
              variant="ghost"
              onPress={() => setActivated(false)}
              style={{ marginTop: spacing.xl, width: '100%' }}
            />
            <Button
              label="Back to Home"
              onPress={() => navigation.navigate('Home')}
              style={{ marginTop: spacing.sm, width: '100%' }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1A0000' },
  header: {
    backgroundColor: '#7B0000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: '#fff' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#fff' },
  content: { padding: spacing.lg, paddingBottom: 100 },
  sosInstruct: { fontSize: 15, textAlign: 'center', color: 'rgba(255,255,255,0.7)', marginBottom: spacing.xxxl },
  sosCenter: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl, height: 200 },
  pulseRing: { position: 'absolute', borderRadius: 100, backgroundColor: colors.sos },
  pulseRing2: { width: 150, height: 150 },
  pulseRing3: { width: 180, height: 180 },
  sosBtn: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: colors.sos,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,100,100,0.4)',
    ...shadow.lg,
  },
  sosBtnIcon: { fontSize: 28 },
  sosBtnText: { fontSize: 18, fontWeight: '900', color: '#fff' },

  activatedWrap: { alignItems: 'center', paddingTop: spacing.xxl },
  activatedIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  activatedTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  activatedSub: { fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
});
// ─── ResourcesScreen.js ──────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';

import { colors, spacing } from '../theme';
import { Card } from '../components';
import { r2, s } from './sharedStyles';

export default function ResourcesScreen({ navigation }) {
  const [userLocation, setUserLocation] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Help centers with estimated coordinates (Manila area)
  const CENTERS = [
    { id: 1, name: 'Barangay Hall', lat: 14.5995, lng: 121.0437, color: colors.primary, address: 'Barangay Hall' },
    { id: 2, name: 'Police Station', lat: 14.6029, lng: 121.0456, color: colors.info, address: 'Manila Police Station' },
    { id: 3, name: 'Hospital', lat: 14.5880, lng: 121.0538, color: colors.safe, address: 'Hospital' },
    { id: 4, name: 'DSWD Office', lat: 14.5920, lng: 121.0480, color: colors.warn, address: 'DSWD Office' },
  ];

  // Filter nearby centers (within 5 km)
  const getNearByCenters = () => {
    if (!userLocation) return CENTERS;
    const MAX_DISTANCE_KM = 5;
    return CENTERS.filter((center) => {
      const distance = calculateDistanceInKm(userLocation.latitude, userLocation.longitude, center.lat, center.lng);
      return distance <= MAX_DISTANCE_KM;
    });
  };

  const calculateDistanceInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const RESOURCES = [
    { icon: '', title: "Women's Rights (RA 9262)", desc: 'Anti-Violence Against Women and Children Act', color: colors.primaryLight },
    { icon: '', title: 'Youth Protection Laws', desc: 'Rights and protections for minors in the Philippines', color: colors.infoLight },
    { icon: '', title: 'Emergency Hotlines', desc: 'PNP: 911 · DSWD: 931 · Bantay Bata: 163', color: colors.sosLight },
    { icon: '', title: 'What to do after abuse', desc: 'Step-by-step guide for immediate safety', color: colors.safeLight },
    { icon: '', title: 'Legal Steps', desc: 'How to file a blotter and seek a protection order', color: colors.warnLight },
  ];

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        setLocationError('Location permission denied');
      }
    } catch (error) {
      setLocationError('Failed to request location permission');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setMapReady(true);
    } catch (error) {
      setLocationError('Unable to get location');
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance < 1 ? (distance * 1000).toFixed(0) + ' m' : distance.toFixed(1) + ' km';
  };

  const openDirections = (centerLat, centerLng, centerName) => {
    if (!userLocation) {
      Alert.alert('Location Required', 'Please enable location access to get directions');
      return;
    }

    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });

    const latLng = `${centerLat},${centerLng}`;
    const label = centerName;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    Linking.openURL(url);
  };

  // Generate HTML for the embedded map
  const generateMapHTML = () => {
    if (!userLocation) return '';

    const markerHTML = CENTERS.map((center) => {
      const colorMap = {
        [colors.primary]: '#C0392B',
        [colors.info]: '#2980B9',
        [colors.safe]: '#27AE60',
        [colors.warn]: '#F39C12',
      };
      const pinColor = colorMap[center.color] || '#C0392B';
      return `
        L.circleMarker([${center.lat}, ${center.lng}], {
          radius: 8,
          fillColor: '${pinColor}',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        })
        .bindPopup('<b>${center.name}</b><br/>${center.address}')
        .addTo(map);
      `;
    }).join('\n');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
          <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
          <style>
            body { margin: 0; padding: 0; }
            #map { position: absolute; top: 0; bottom: 0; width: 100%; }
            .leaflet-control-attribution { display: none; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const map = L.map('map').setView([${userLocation.latitude}, ${userLocation.longitude}], 14);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '',
              maxZoom: 19
            }).addTo(map);

            L.circleMarker([${userLocation.latitude}, ${userLocation.longitude}], {
              radius: 10,
              fillColor: '#3498DB',
              color: '#fff',
              weight: 3,
              opacity: 1,
              fillOpacity: 0.9
            })
            .bindPopup('<b>Your Location</b>')
            .openPopup()
            .addTo(map);

            ${markerHTML}
          </script>
        </body>
      </html>
    `;
  };

  return (
    <View style={[s.root, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Resource Center</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Resources */}
        <Text style={s.sectionLabel}>Know Your Rights</Text>
        {RESOURCES.map((r, i) => (
          <TouchableOpacity key={i} activeOpacity={0.85}>
            <Card>
              <View style={r2.resRow}>
                <View style={[r2.resIcon, { backgroundColor: r.color }]}>
                  <Text style={{ fontSize: 20 }}>{r.icon}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={r2.resTitle}>{r.title}</Text>
                  <Text style={r2.resDesc}>{r.desc}</Text>
                </View>

                <Text style={{ color: colors.textMuted, fontSize: 16 }}>›</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Nearby Centers */}
        <Text style={s.sectionLabel}>Nearby Help Centers</Text>
        <Card>
          {mapReady && userLocation ? (
            <WebView
              source={{ html: generateMapHTML() }}
              style={{ height: 400, borderRadius: 12, overflow: 'hidden', marginBottom: spacing.md }}
              scrollEnabled={false}
              originWhitelist={['*']}
            />
          ) : locationError ? (
            <View style={r2.mapPlaceholder}>
              <Text style={{ fontSize: 20, marginBottom: spacing.xs }}>📍</Text>
              <Text style={{ fontSize: 12, color: colors.sos, fontWeight: '600' }}>
                {locationError}
              </Text>
              <TouchableOpacity onPress={requestLocationPermission} style={{ marginTop: spacing.md }}>
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={r2.mapPlaceholder}>
              <ActivityIndicator size="large" color={colors.safe} />
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: spacing.sm }}>
                Loading map...
              </Text>
            </View>
          )}

          {CENTERS.map((c, i) => (
            <View
              key={c.id}
              style={[
                r2.centerRow,
                i > 0 && {
                  borderTopWidth: 0.5,
                  borderTopColor: colors.borderLight,
                  marginTop: spacing.sm,
                  paddingTop: spacing.sm,
                },
              ]}
            >
              <View style={[r2.centerDot, { backgroundColor: c.color }]} />
              <Text style={r2.centerName}>{c.name}</Text>
              <Text style={r2.centerDist}>
                {userLocation
                  ? calculateDistance(userLocation.latitude, userLocation.longitude, c.lat, c.lng)
                  : '—'}
              </Text>

              <TouchableOpacity
                style={r2.dirBtn}
                onPress={() => openDirections(c.lat, c.lng, c.name)}
              >
                <Text style={r2.dirBtnText}>Directions</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

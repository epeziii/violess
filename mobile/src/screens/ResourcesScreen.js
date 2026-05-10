// ───────── ResourcesScreen.js ─────────

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import { colors, spacing } from '../theme';
import { Card } from '../components';
import { r2, s } from './sharedStyles';

// ───────── Your Google Places API Key ─────────
const PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY';

// ───────── Category config (FontAwesome6 icons) ─────────
const CATEGORIES = {
  police: {
    label: 'Police Station',
    color: '#FF6B6B',
    icon: 'shield',
  },
  hospital: {
    label: 'Hospital / Clinic',
    color: '#4ECDC4',
    icon: 'flask-vial',
  },
  dswd: {
    label: 'DSWD / Social Facility',
    color: '#A78BFA',
    icon: 'people-group',
  },
  barangay: {
    label: 'Barangay Hall',
    color: '#FBBF24',
    icon: 'building',
  },
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Centers', color: '#888888', icon: 'map-pin' },
  { value: 'police', label: 'Police Station', color: '#FF6B6B', icon: 'shield' },
  {
    value: 'hospital',
    label: 'Hospital / Clinic',
    color: '#4ECDC4',
    icon: 'flask-vial',
  },
  { value: 'dswd', label: 'DSWD / Social Facility', color: '#A78BFA', icon: 'people-group' },
  {
    value: 'barangay',
    label: 'Barangay Hall',
    color: '#FBBF24',
    icon: 'building',
  },
];

// ───────── Maps each filter to a Google Places keyword search ─────────
const SEARCH_KEYWORDS = {
  all: ['police station', 'hospital', 'barangay hall', 'DSWD'],
  police: ['police station'],
  hospital: ['hospital', 'clinic'],
  dswd: ['DSWD', 'social welfare office'],
  barangay: ['barangay hall'],
};

async function searchNearby(lat, lon, keyword, radius = 3000) {
  const url =
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json' +
    `?location=${lat},${lon}` +
    `&radius=${radius}` +
    `&keyword=${encodeURIComponent(keyword)}` +
    `&key=${PLACES_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API: ${data.status} — ${data.error_message ?? ''}`);
  }

  return (data.results || []).map((place) => ({
    id: place.place_id,
    name: place.name,
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
    address: place.vicinity || null,
    rating: place.rating || null,
  }));
}

async function fetchPOIs(lat, lon, filter) {
  const keywords = SEARCH_KEYWORDS[filter] ?? SEARCH_KEYWORDS.all;

  const results = await Promise.all(
    keywords.map((kw) => searchNearby(lat, lon, kw).catch(() => [])),
  );

  const seen = new Set();
  return results
    .flat()
    .filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
}

export default function ResourcesScreen({ navigation }) {
  const [userLocation, setUserLocation] = useState(null);
  const [pois, setPois] = useState([]);
  const [poiLoading, setPoiLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const mapRef = useRef(null);

  const activeFilter = FILTER_OPTIONS.find((f) => f.value === selectedFilter);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadPOIs(userLocation.latitude, userLocation.longitude, selectedFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter, userLocation?.latitude, userLocation?.longitude]);

  const init = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;
      setUserLocation({ latitude, longitude });
    } catch {
      setLocationError('Unable to get location');
    }
  };

  const loadPOIs = async (lat, lon, filter) => {
    setPoiLoading(true);
    setPois([]);
    try {
      const results = await fetchPOIs(lat, lon, filter);
      setPois(results);
    } catch (err) {
      console.error('Places API error:', err);
      Alert.alert(
        'Could not load help centers',
        err.message || 'Check your internet connection and try again.',
      );
    } finally {
      setPoiLoading(false);
    }
  };

  const handleFilterSelect = (value) => {
    setSelectedFilter(value);
    setFilterModalVisible(false);

    if (mapRef.current && userLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        300,
      );
    }
  };

  // ───────── Resource cards ─────────
  const RESOURCES = [
    {
      resourceId: 'ra9262',
      icon: 'shield',
      title: "Women's Rights (RA 9262)",
      desc: 'Anti-Violence Against Women and Children Act',
      color: colors.primaryLight,
      accent: colors.primary,
    },
    {
      resourceId: 'youthLaws',
      icon: 'people-group',
      title: 'Youth Protection Laws',
      desc: 'Rights and protections for minors in the Philippines',
      color: colors.infoLight,
      accent: colors.info,
    },
    {
      resourceId: 'hotlines',
      icon: 'phone',
      title: 'Emergency Hotlines',
      desc: 'PNP: 911 · DSWD: 931 · Bantay Bata: 163',
      color: colors.sosLight,
      accent: colors.sos,
    },
    {
      resourceId: 'afterAbuse',
      icon: 'shield-heart',
      title: 'What to do after abuse',
      desc: 'Step-by-step guide for immediate safety',
      color: colors.safeLight,
      accent: colors.safe,
    },
    {
      resourceId: 'legalSteps',
      icon: 'gavel',
      title: 'Legal Steps',
      desc: 'How to file a blotter and seek a protection order',
      color: colors.warnLight,
      accent: colors.warn,
    },
  ];

  return (
    <View style={[s.root, { backgroundColor: colors.surface }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <FontAwesome6 name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Resource Center</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionLabel}>Know Your Rights</Text>
        {RESOURCES.map((r, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ResourceDetail', { resourceId: r.resourceId })}
          >
            <Card>
              <View style={r2.resRow}>
                <View style={[r2.resIcon, { backgroundColor: r.color }]}>
                  <FontAwesome6 name={r.icon} size={22} color={'#fff'} />
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

        <Text style={s.sectionLabel}>Nearby Help Centers</Text>

        <TouchableOpacity
          onPress={() => setFilterModalVisible(true)}
          style={styles.filterTrigger}
          activeOpacity={0.8}
        >
          <View style={[styles.filterDot, { backgroundColor: activeFilter?.color ?? '#888' }]} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <FontAwesome6 name={activeFilter?.icon ?? 'map-pin'} size={18} color={'#1a1a2e'} />
            <Text style={styles.filterTriggerText}>
              {activeFilter?.label ?? 'All Centers'}
            </Text>
          </View>

          {poiLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 4 }} />
          ) : (
            <Text style={styles.filterChevron}>▾</Text>
          )}
        </TouchableOpacity>

        {!poiLoading && (
          <Text style={styles.poiCount}>
            {pois.length} center{pois.length !== 1 ? 's' : ''} found nearby
          </Text>
        )}

        <Card>
          {locationError ? (
            <View style={r2.mapPlaceholder}>
              <FontAwesome6 name="map-pin" size={20} color={colors.sos} style={{ marginBottom: spacing.xs }} />
              <Text style={{ fontSize: 12, color: colors.sos, fontWeight: '600' }}>{locationError}</Text>
              <TouchableOpacity onPress={() => init()} style={{ marginTop: spacing.md }}>
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : !userLocation ? (
            <View style={r2.mapPlaceholder}>
              <ActivityIndicator size="large" color={colors.safe} />
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: spacing.sm }}>
                Getting your location…
              </Text>
            </View>
          ) : (
            <MapView
              key={selectedFilter}
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              showsUserLocation
              showsMyLocationButton={false}
              showsPointsOfInterest={false}
              showsBuildings={false}
              initialRegion={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              }}
            >
              {pois.map((poi) => {
                const cat = CATEGORIES[
                  selectedFilter === 'all' ? detectCategory(poi.name) : selectedFilter
                ];
                const pinColor = cat?.color ?? '#888';

                return (
                  <Marker
                    key={poi.id}
                    coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
                    tracksViewChanges={false}
                  >
                    <View style={[styles.pin, { backgroundColor: pinColor }]}>
                      <FontAwesome6 name={cat?.icon ?? 'map-pin'} size={16} color={'#fff'} />
                    </View>

                    <Callout tooltip={false}>
                      <View style={styles.callout}>
                        <Text style={styles.calloutTitle}>{poi.name}</Text>
                        {poi.address && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <FontAwesome6 name="map-pin" size={12} color={colors.textMuted} />
                            <Text style={styles.calloutSub}>{poi.address}</Text>
                          </View>
                        )}
                        {poi.rating && <Text style={styles.calloutSub}>★ {poi.rating}</Text>}
                        <Text style={[styles.calloutBadge, { backgroundColor: pinColor }]}>
                          {cat?.label ?? activeFilter?.label}
                        </Text>
                      </View>
                    </Callout>
                  </Marker>
                );
              })}
            </MapView>
          )}
        </Card>

        <Text style={styles.attribution}>Results powered by Google Places API</Text>
      </ScrollView>

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Search Help Centers</Text>
            <Text style={styles.modalSubtitle}>Searches Google Maps for the selected type near you</Text>

            <FlatList
              data={FILTER_OPTIONS}
              keyExtractor={(item) => item.value}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const isActive = selectedFilter === item.value;

                return (
                  <TouchableOpacity
                    style={[styles.filterItem, isActive && styles.filterItemActive]}
                    onPress={() => handleFilterSelect(item.value)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.filterItemDot, { backgroundColor: item.color }]} />

                    <FontAwesome6 name={item.icon ?? 'map-pin'} size={18} color={isActive ? item.color : '#1a1a2e'} />

                    <Text style={[styles.filterItemLabel, isActive && styles.filterItemLabelActive]}>
                      {item.label}
                    </Text>
                    {isActive && (
                      <FontAwesome6 name="check" size={16} color={item.color} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function detectCategory(name = '') {
  const n = name.toLowerCase();
  if (n.includes('police')) return 'police';
  if (n.includes('hospital') || n.includes('clinic')) return 'hospital';
  if (n.includes('dswd') || n.includes('social')) return 'dswd';
  if (n.includes('barangay')) return 'barangay';
  return 'barangay';
}

const styles = StyleSheet.create({
  map: {
    height: 420,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },

  callout: { width: 180, padding: 10 },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  calloutSub: { fontSize: 11, color: '#555', marginBottom: 2 },
  calloutBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    overflow: 'hidden',
  },

  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  filterDot: { width: 10, height: 10, borderRadius: 5 },
  filterTriggerText: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  filterChevron: { fontSize: 14, color: '#888' },

  poiCount: { fontSize: 11, color: '#999', marginBottom: 8, marginLeft: 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: '#888', marginBottom: 16 },

  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 10,
  },
  filterItemActive: { backgroundColor: '#f4f4ff' },
  filterItemDot: { width: 12, height: 12, borderRadius: 6 },
  filterItemLabel: { flex: 1, fontSize: 14, color: '#444', fontWeight: '500' },
  filterItemLabelActive: { color: '#1a1a2e', fontWeight: '700' },

  separator: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 8 },
  attribution: {
    fontSize: 10,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
});


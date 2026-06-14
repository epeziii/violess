// ───────── ResourcesScreen.js ─────────
// Custom Olongapo City Help Centers Map
// No external API required - data is hardcoded

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, spacing } from '../theme';
import { Card } from '../components';
import { s, r2 } from './sharedStyles';

const OLONGAPO_CENTER = {
  latitude: 14.8450,
  longitude: 120.2870,
};

const OLONGAPO_POI_DATA = [
  // POLICE STATIONS
  {
    id: 'pd_olongapo_main',
    name: 'Olongapo City Police Station',
    category: 'police',
    latitude: 14.8420,
    longitude: 120.2850,
    address: 'Magsaysay St, Olongapo City',
    phone: '(047) 224-3524',
    rating: 4.1,
  },
  {
    id: 'pd_barangay_barrio',
    name: 'Barangay Barrio Police Substation',
    category: 'police',
    latitude: 14.8580,
    longitude: 120.2920,
    address: 'Barangay Barrio, Olongapo City',
    phone: '(047) 224-5689',
    rating: 3.8,
  },
  {
    id: 'pd_east_bajac',
    name: 'East Bajac-Bajac Police Substation',
    category: 'police',
    latitude: 14.8290,
    longitude: 120.3050,
    address: 'East Bajac-Bajac, Olongapo City',
    phone: '(047) 224-7812',
    rating: 3.9,
  },

  // HOSPITALS & CLINICS
  {
    id: 'hosp_maritime',
    name: 'Maritime Medical Center',
    category: 'hospital',
    latitude: 14.8400,
    longitude: 120.2780,
    address: 'Gordon Ave, Olongapo City',
    phone: '(047) 222-4444',
    rating: 4.3,
  },
  {
    id: 'hosp_golden',
    name: 'Golden Retriever Hospital',
    category: 'hospital',
    latitude: 14.8480,
    longitude: 120.2920,
    address: 'Magsaysay St, Olongapo City',
    phone: '(047) 224-3388',
    rating: 4.2,
  },
  {
    id: 'clinic_west',
    name: 'West Olongapo Community Health Center',
    category: 'hospital',
    latitude: 14.8200,
    longitude: 120.2650,
    address: 'Rizal Avenue, Olongapo City',
    phone: '(047) 222-7654',
    rating: 4.0,
  },
  {
    id: 'clinic_central',
    name: 'Central City Clinic',
    category: 'hospital',
    latitude: 14.8330,
    longitude: 120.2780,
    address: "Mayor's Ave, Olongapo City",
    phone: '(047) 222-9876',
    rating: 3.9,
  },

  // DSWD & SOCIAL SERVICES
  {
    id: 'dswd_main',
    name: 'DSWD Olongapo City Main Office',
    category: 'dswd',
    latitude: 14.8380,
    longitude: 120.2900,
    address: 'Magsaysay St, Olongapo City',
    phone: '(047) 224-1234',
    rating: 3.7,
  },
  {
    id: 'cwc_olongapo',
    name: 'City Social Welfare Office',
    category: 'dswd',
    latitude: 14.8450,
    longitude: 120.2750,
    address: 'Government Center, Olongapo City',
    phone: '(047) 224-5000',
    rating: 3.8,
  },

  // BARANGAY HALLS
  {
    id: 'barangay_hall_barrio',
    name: 'Barangay Barrio Hall',
    category: 'barangay',
    latitude: 14.8580,
    longitude: 120.2920,
    address: 'Barangay Barrio, Olongapo City',
    phone: '(047) 224-5555',
    rating: 3.9,
  },
  {
    id: 'barangay_hall_east_bajac',
    name: 'Barangay East Bajac-Bajac Hall',
    category: 'barangay',
    latitude: 14.8290,
    longitude: 120.3050,
    address: 'East Bajac-Bajac, Olongapo City',
    phone: '(047) 224-6666',
    rating: 3.8,
  },
  {
    id: 'barangay_hall_west_bajac',
    name: 'Barangay West Bajac-Bajac Hall',
    category: 'barangay',
    latitude: 14.8150,
    longitude: 120.2750,
    address: 'West Bajac-Bajac, Olongapo City',
    phone: '(047) 224-7777',
    rating: 3.8,
  },
  {
    id: 'barangay_hall_gordon',
    name: 'Barangay Gordon Heights Hall',
    category: 'barangay',
    latitude: 14.8520,
    longitude: 120.2650,
    address: 'Gordon Heights, Olongapo City',
    phone: '(047) 224-8888',
    rating: 3.9,
  },
  {
    id: 'barangay_hall_san_antonio',
    name: 'Barangay San Antonio Hall',
    category: 'barangay',
    latitude: 14.8400,
    longitude: 120.2550,
    address: 'San Antonio, Olongapo City',
    phone: '(047) 224-9999',
    rating: 3.7,
  },
];

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

// ───────── Filter POI data by category ─────────
function filterPOIs(filter) {
  if (filter === 'all') {
    return OLONGAPO_POI_DATA;
  }
  return OLONGAPO_POI_DATA.filter((poi) => poi.category === filter);
}


export default function ResourcesScreen({ navigation }) {
  const [userLocation, setUserLocation] = useState(null);
  const [pois, setPois] = useState([]);
  const [poiLoading, setPoiLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const mapRef = useRef(null);

  const activeFilter = FILTER_OPTIONS.find((f) => f.value === selectedFilter);

  const leafletHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
      <style>
        * { margin: 0; padding: 0; }
        html, body, #map { width: 100%; height: 100%; }
        #map { background: #e8f0f7; }
        .leaflet-container { background: #e8f0f7; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        let map = null;
        let markersGroup = null;

        function initMap() {
          if (map) return;
          try {
            map = L.map('map', {
              zoomControl: true,
              attributionControl: true,
              zoom: 13,
              center: [14.8450, 120.2870]
            });

            L.tileLayer('https://tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
              maxZoom: 18,
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            markersGroup = L.layerGroup().addTo(map);
          } catch (e) {
            console.error('Map init error:', e);
            document.getElementById('map').style.background = '#e8e8e8';
            document.getElementById('map').innerHTML = '<div style="color: #666; padding: 20px;">Map unavailable</div>';
          }
        }

        function addPOI(poi) {
          const colors = { police: '#FF6B6B', hospital: '#4ECDC4', dswd: '#A78BFA', barangay: '#FBBF24' };
          const labels = { police: 'Police', hospital: 'Hospital', dswd: 'DSWD', barangay: 'Barangay' };
          const color = colors[poi.category] || '#888';

          const marker = L.circleMarker([poi.latitude, poi.longitude], {
            radius: 12,
            fillColor: color,
            color: 'white',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(markersGroup);

          marker.bindPopup('<b>' + poi.name + '</b><br>' + (poi.address || '') + '<br>' + (poi.phone || '') + '<br><span style="color: ' + color + '; font-weight: bold;">' + (labels[poi.category] || 'Center') + '</span>');
        }

        function renderMap(pois) {
          if (!map) initMap();
          markersGroup.clearLayers();

          if (pois && pois.length > 0) {
            pois.forEach(addPOI);

            // Fit bounds to all markers
            const group = L.featureGroup(Object.values(markersGroup._layers));
            map.fitBounds(group.getBounds().pad(0.1), { animate: true });
          }
        }

        window.addEventListener('message', function(e) {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'ADD_POIS' && msg.pois) {
              renderMap(msg.pois);
            }
          } catch (err) {
            console.error('Map error:', err);
          }
        });

        // Initialize on load
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initMap);
        } else {
          initMap();
        }
      <\/script>
    </body>
    </html>
  `;

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Load filtered POIs
    loadPOIs(selectedFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter]);

  const init = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch (err) {
      console.log('Location access not available, using Olongapo City center');
    }

    // Load initial POIs
    loadPOIs('all');
  };

  const loadPOIs = async (filter) => {
    setPoiLoading(true);
    try {
      // Simulate slight delay for better UX
      await new Promise((resolve) => setTimeout(resolve, 300));
      const results = filterPOIs(filter);
      setPois(results);
    } catch (err) {
      console.error('Error loading POIs:', err);
      Alert.alert('Error', 'Could not load help centers');
    } finally {
      setPoiLoading(false);
    }
  };

  const handleFilterSelect = (value) => {
    setSelectedFilter(value);
    setFilterModalVisible(false);
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

      <FlatList
        contentContainerStyle={s.content}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        ListHeaderComponent={
          <>
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
          </>
        }
        data={[{ id: 'map' }]}
        renderItem={() => (
          <Card style={{ overflow: 'hidden' }}>
            {!poiLoading ? (
              <WebView
                key={selectedFilter}
                ref={mapRef}
                source={{ html: leafletHTML }}
                style={styles.map}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                javaScriptEnabled={true}
                onLoadEnd={() => {
                  setTimeout(() => {
                    console.log('Map loaded, sending POIs:', pois.length);
                    mapRef.current?.injectJavaScript(`
                      renderMap(${JSON.stringify(pois)});
                    `);
                  }, 300);
                }}
              />
            ) : (
              <View style={r2.mapPlaceholder}>
                <ActivityIndicator size="large" color={colors.safe} />
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: spacing.sm }}>
                  Loading help centers…
                </Text>
              </View>
            )}
          </Card>
        )}
        keyExtractor={(item) => item.id}
        ListFooterComponent={
          <Text style={styles.attribution}>Olongapo City Help Centers Directory</Text>
        }
      />

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
            <Text style={styles.modalSubtitle}>Filter available help centers in Olongapo City</Text>

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

const styles = StyleSheet.create({
  map: {
    height: 420,
    borderRadius: 12,
    marginBottom: spacing.md,
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


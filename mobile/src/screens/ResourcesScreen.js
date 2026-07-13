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
    id: 'pd_ocpo_police_station_1',
    name: 'OCPO - Police Station 1',
    category: 'police',
    latitude: 14.842233538423937,
    longitude: 120.28748655767747,
    address: 'Rizal Ave, West Bajac-bajac, Olongapo City, Zambales',
    phone: '222-5101 / 0998-598-5547',
    rating: null,
  },
  {
    id: 'pd_ocpo_police_station_2',
    name: 'OCPO - Police Station 2',
    category: 'police',
    latitude: 14.831950648508451,
    longitude: 120.27691315897692,
    address: 'Foster St, New Kababae, Olongapo City, Zambales',
    phone: '222-1020 / 0998-598-5549',
    rating: null,
  },
  {
    id: 'pd_ocpo_police_station_3',
    name: 'OCPO - Police Station 3',
    category: 'police',
    latitude: 14.828734940669687,
    longitude: 120.28177493461034,
    address: 'East 3rd St, Asinan, Olongapo City, Zambales',
    phone: '222-0964 / 0998-598-5561',
    rating: null,
  },
  {
    id: 'pd_ocpo_police_station_4',
    name: 'OCPO - Police Station 4',
    category: 'police',
    latitude: 14.850700,
    longitude: 120.323800,
    address: 'Mabini St, New Cabalan, Olongapo City, Zambales',
    phone: '0998-598-5563',
    rating: null,
  },
  {
    id: 'pd_ocpo_police_station_6',
    name: 'OCPO - Police Station 6',
    category: 'police',
    latitude: 14.851697187342848,
    longitude: 120.2634161083549,
    address: 'IloIlo St, Barretto, Olongapo City, Zambales',
    phone: '0998-598-5569',
    rating: null,
  },
  {
    id: 'pd_ocpo_police_station_5',
    name: 'OCPO - POlice Station 5',
    category: 'police',
    latitude: 14.849124428845805,
    longitude: 120.29123083037264,
    address: 'Horseshoe Dr St, Santa Rita, Olongapo City, Zambales',
    phone: '222-0402 / 0998-598-5567',
    rating: null,
  },
  {
    id: 'pd_ocpo_hq',
    name: 'OCPO - HQ',
    category: 'police',
    latitude: 14.849232519171577,
    longitude: 120.26577561873219,
    address: '',
    phone: '0919-245-0666 / 0998-598-5546',
    rating: null,
  },


  // HOSPITALS & CLINICS
  {
    id: 'hosp_calapatia',
    name: 'Calapatia Polymedic Hospital Plaza',
    category: 'hospital',
    latitude: 14.842659411629661,
    longitude: 120.28866252687702,
    address: '11 E 24th St, Olongapo City, Zambales',
    phone: '(047)2222002',
    rating: null,
  },
  {
    id: 'hosp_zmmg',
    name: 'Zambales Medical Mission Group Hospital & Health Services Cooperative',
    category: 'hospital',
    latitude: 14.842420635110276,
    longitude: 120.28517186618824,
    address: '18 Grill Street, West Bajac-bajac, Olongapo City, 2200 Zambales',
    phone: '(047)2239528',
    rating: null,
  },
  {
    id: 'hosp_zmmg_coop',
    name: 'ZMMG COOP Hospital',
    category: 'hospital',
    latitude: 14.839007226949215,
    longitude: 120.28273845969245,
    address: '14 Brill St, Olongapo City, 2200 Zambales',
    phone: '(047)6020278',
    rating: null,
  },
  {
    id: 'hosp_ridons',
    name: "Ridon's St. Jude Medical Center",
    category: 'hospital',
    latitude: 14.836211123330484,
    longitude: 120.28653641570148,
    address: '60 & #62 E 18th St, Olongapo City, 2200 Zambales',
    phone: '',
    rating: null,
  },
  {
    id: 'hosp_james',
    name: 'James L. Gordon Memorial Hospital',
    category: 'hospital',
    latitude: 14.826680298455805,
    longitude: 120.28009310464803,
    address: '1 Perimeter Rd, Olongapo City, Zambales',
    phone: '(047)6021229',
    rating: null,
  },
  {
    id: 'hosp_ulticare',
    name: 'Ulticare Medical Center',
    category: 'hospital',
    latitude: 14.846762328936922,
    longitude: 120.2686530452352,
    address: '2 National Highway, Barretto, Olongapo City, 2200 Zambales',
    phone: '(047)6026200',
    rating: null,
  },
  {
    id: 'hosp_ace',
    name: 'Allied Care Experts (ACE) Medical Center - Baypointe, Inc.',
    category: 'hospital',
    latitude: 14.82383058035754,
    longitude: 120.27220904215847,
    address: 'Block 8, Lot 1A and 1B Dewey Avenue Subic Bay Freeport Zone, Olongapo City, 2222 Zambales',
    phone: '(047)2506070',
    rating: null,
  },

  // DSWD & SOCIAL SERVICES
  {
    id: 'dswd_welfare_office',
    name: 'Welfare Office',
    category: 'dswd',
    latitude: 14.842473473941885,
    longitude: 120.28777547311397,
    address: 'Olongapo City Hall, Arthur St, Olongapo City, 2200 Zambales',
    phone: '0472229491',
    rating: null,
  },
  {
    id: 'dswd_social_development_center_1',
    name: 'Social Development Center',
    category: 'dswd',
    latitude: 14.847910177474784,
    longitude: 120.31704638048993,
    address: 'R8X8+4RR, Mulawin St Ext, Olongapo City, Zambales',
    phone: '0472231139',
    rating: null,
  },
  {
    id: 'dswd_social_development_center_2',
    name: 'Social Development Center',
    category: 'dswd',
    latitude: 14.838940052995751,
    longitude: 120.28463349608555,
    address: '1090 Rizal Ave, Olongapo City, Zambales',
    phone: '',
    rating: null,
  },

  // BARANGAY HALLS
  {
    id: 'barangay_gordon_heights',
    name: 'Gordon Heights Barangay Hall',
    category: 'barangay',
    latitude: 14.867970599715232,
    longitude: 120.2921830011242,
    address: 'Long Rd, Olongapo City, Zambales',
    phone: '',
    rating: null,
  },
  {
    id: 'barangay_new_cabalan',
    name: 'New Cabalan Barangay Hall',
    category: 'barangay',
    latitude: 14.850493335097067,
    longitude: 120.3237937613086,
    address: 'V82F+6G4, Rizal St, Olongapo City, Zambales',
    phone: '',
    rating: null,
  },
  {
    id: 'barangay_santa_rita',
    name: 'Santa Rita Barangay Hall',
    category: 'barangay',
    latitude: 14.848914121903547,
    longitude: 120.29097003040428,
    address: 'R7XR+HC6, Subic Bay Freeport Zone, Olongapo City, Zambales',
    phone: '',
    rating: null,
  },
  {
    id: 'barangay_west_bajac',
    name: 'West Bajac-Bajac Barangay Hall',
    category: 'barangay',
    latitude: 14.84184934859466,
    longitude: 120.28312345006402,
    address: 'R7RM+R54 West Bajac Bajac Barangay Hall, 19 W 20th St, Olongapo City, Zambales',
    phone: '',
    rating: null,
  },
  {
    id: 'barangay_east_bajac',
    name: 'Barangay Hall East Bajac Bajac Olongapo City',
    category: 'barangay',
    latitude: 14.835272753465224,
    longitude: 120.28781368840217,
    address: '74 E 18th St, East Bajac-bajac, Olongapo City, 2200 Zambales',
    phone: '(047)2225035',
    rating: null,
  },
  {
    id: 'barangay_east_tapinac',
    name: 'East Tapinac Barangay Hall',
    category: 'barangay',
    latitude: 14.832658289931675,
    longitude: 120.28519336928369,
    address: 'R7MP+23W, 14th St, Olongapo City, 2200 Zambales',
    phone: '(047)2233444',
    rating: null,
  },
  {
    id: 'barangay_new_kalalake',
    name: 'New Kalalake Barangay Hall',
    category: 'barangay',
    latitude: 14.830719600151545,
    longitude: 120.2890282205907,
    address: 'R7JQ+8J3, E 14th St, Olongapo City, Zambales',
    phone: '(047)2248264',
    rating: null,
  },
  {
    id: 'barangay_west_tapinac',
    name: 'Barangay West Tapinac Barangay Hall',
    category: 'barangay',
    latitude: 14.832620697831914,
    longitude: 120.27949943086608,
    address: 'R7MH+3Q5, Corpuz St, Olongapo City, Zambales',
    phone: '',
    rating: null,
  },
  {
    id: 'barangay_new_banicain',
    name: 'New Banicain Barangay Hall',
    category: 'barangay',
    latitude: 14.829333784218441,
    longitude: 120.27576003432964,
    address: 'R7HG+P7Q, W 1st St, Olongapo City, Zambales',
    phone: '',
    rating: null,
  },
  {
    id: 'barangay_pagasa',
    name: 'Pag-asa Barangay Hall',
    category: 'barangay',
    latitude: 14.826980044506696,
    longitude: 120.2873145803833,
    address: 'R7GP+RW3, Perimeter Rd, Olongapo City, Zambales',
    phone: '',
    rating: null,
  },
  {
    id: 'barangay_new_kababae',
    name: 'New Kababae Barangay Hall',
    category: 'barangay',
    latitude: 14.831993893212346,
    longitude: 120.27691599720875,
    address: '61 Foster St, Olongapo City, 2200 Zambales',
    phone: '09198419538',
    rating: null,
  },
  {
    id: 'barangay_new_asinan',
    name: 'New Asinan Barangay Hall',
    category: 'barangay',
    latitude: 14.827933712069427,
    longitude: 120.28574621261707,
    address: 'R7HP+586, Gordon Ave, Olongapo City, Zambales',
    phone: '',
    rating: null,
  },
  {
    id: 'barangay_pagasa_duplicate',
    name: 'Pag-asa Barangay Hall',
    category: 'barangay',
    latitude: 14.826991453460515,
    longitude: 120.28730723891235,
    address: 'R7GP+RW3, Perimeter Rd, Olongapo City, Zambales',
    phone: '',
    rating: null,
  },
  {
    id: 'barangay_kalaklan',
    name: 'Kalaklan Barangay Hall & Health Center',
    category: 'barangay',
    latitude: 14.830434898809669,
    longitude: 120.27376272061916,
    address: 'R7JF+5GR, RH5 National Hwy, Olongapo City, Zambales',
    phone: '',
    rating: null,
  },
  {
    id: 'barangay_mabayuan',
    name: 'Barangay Mabayuan',
    category: 'barangay',
    latitude: 14.843449481130273,
    longitude: 120.28201173826497,
    address: '31 Otero Ave, Olongapo City, Zambales',
    phone: '09602546130',
    rating: null,
  },
  {
    id: 'barangay_old_cabalan',
    name: 'Barangay Old Cabalan',
    category: 'barangay',
    latitude: 14.848667091704426,
    longitude: 120.31512755350022,
    address: 'R8X7+FXX, Mulawin St, Olongapo City, Zambales',
    phone: '(047) 223 1629',
    rating: null,
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
  { value: 'police', label: 'Police Station', color: '#2563EB', icon: 'shield' },
  {
    value: 'hospital',
    label: 'Hospital / Clinic',
    color: '#DC2626',
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

  const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

  const categoryToOverpass = (cat) => {
    // OSM tags are imperfect; keep it broad for better coverage.
    switch (cat) {
      case 'police':
        // Police stations: amenity=police, emergency=police, office=police
        return `(
          node["amenity"="police"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          way["amenity"="police"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          relation["amenity"="police"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          node["office"="police"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          way["office"="police"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          relation["office"="police"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
        )`;
      case 'hospital':
        // hospitals/clinics
        return `(
          node["amenity"="hospital"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          way["amenity"="hospital"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          relation["amenity"="hospital"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          node["amenity"="clinic"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          way["amenity"="clinic"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          relation["amenity"="clinic"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
        )`;
      case 'dswd':
        // social facility is not consistent; use offices/community centers
        return `(
          node["amenity"="social_facility"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          way["amenity"="social_facility"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          relation["amenity"="social_facility"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          node["amenity"="community_centre"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          way["amenity"="community_centre"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          relation["amenity"="community_centre"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
        )`;
      case 'barangay':
        // barangay hall/community administrative offices
        return `(
          node["amenity"="community_centre"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          way["amenity"="community_centre"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          relation["amenity"="community_centre"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          node["office"="government"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          way["office"="government"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
          relation["office"="government"](around:5000,${userLocation?.latitude ?? OLONGAPO_CENTER.latitude},${userLocation?.longitude ?? OLONGAPO_CENTER.longitude});
        )`;
      default:
        return null;
    }
  };

  const fetchPOIsFromOverpass = async (filter) => {
    // fallback to hardcoded if anything fails
    const fallback = filterPOIs(filter);

    const lat = userLocation?.latitude ?? OLONGAPO_CENTER.latitude;
    const lon = userLocation?.longitude ?? OLONGAPO_CENTER.longitude;

    // Query radius in meters
    const radius = 8000;

    const selector = categoryToOverpass(filter);
    if (!selector) return fallback;

    const query = `[
      timeout:25;
      out:json;
    ];
    (
      ${selector}
    );
    out center;`;

    const res = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Overpass sometimes blocks requests without a browser-like user-agent.
        'User-Agent': 'ViolessMobile/1.0 (+https://example.com)'
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      // Fallback to hardcoded POIs if Overpass is blocked/unavailable.
      return fallback;
    }

    const json = await res.json();
    const elements = Array.isArray(json?.elements) ? json.elements : [];

    const mapped = elements
      .map((el) => {
        // For node: lat/lon exist; for way: center.lat/center.lon
        const lat2 = el.lat ?? el.center?.lat;
        const lon2 = el.lon ?? el.center?.lon;
        if (!isFinite(lat2) || !isFinite(lon2)) return null;

        const tags = el.tags || {};
        const name = tags.name || tags['name:en'] || tags['operator'] || 'Help Center';
        const address = tags['addr:street'] || tags['addr:full'] || '';
        const phone = tags.phone || '';
        const rating = null;

        return {
          id: String(el.id ?? `${name}_${lat2}_${lon2}`),
          name,
          category: filter === 'all' ? 'police' : filter,
          latitude: lat2,
          longitude: lon2,
          address,
          phone,
          rating,
        };
      })
      .filter(Boolean);

    return mapped.length ? mapped : fallback;
  };


  // Keep this string strictly valid JS (escape backticks inside embedded HTML)
  const leafletHTML = `



    <!DOCTYPE html>
    <!-- Markers are sourced either from Overpass (runtime) or fallback hardcoded POIs -->
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
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
              attributionControl: false,
              zoom: 13,
              center: [14.8450, 120.2870]
            });


            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              minZoom: 1
            }).addTo(map);

            markersGroup = L.layerGroup().addTo(map);
            console.log('Map initialized');
          } catch (e) {
            console.error('Map init error:', e);
          }
        }

        function addPOI(poi) {
          const colors = { police: '#2563EB', hospital: '#DC2626', dswd: '#A78BFA', barangay: '#FBBF24' };
          const labels = { police: 'Police', hospital: 'Hospital', dswd: 'DSWD', barangay: 'Barangay' };
          const color = colors[poi.category] || '#888';

          if (poi.category === 'police' || poi.category === 'hospital' || poi.category === 'dswd' || poi.category === 'barangay') {
            const iconName = poi.category === 'police'
              ? 'shield-halved'
              : poi.category === 'hospital'
                ? 'hospital'
                : poi.category === 'dswd'
                  ? 'people-group'
                  : 'building';

            const iconHtml = '<i class="fa-solid fa-' + iconName + '" style="font-size:18px;line-height:1;color:#fff;"></i>';

            const marker = L.marker([poi.latitude, poi.longitude], {
              icon: L.divIcon({
                className: '',
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                html: '<div style="width:36px;height:36px;border-radius:50%;background-color:' + color + ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.25);">' + iconHtml + '</div>',
              }),
            }).addTo(markersGroup);

            marker.bindPopup(createPOIPopupHTML(poi, color, labels));
            return;
          }

          const marker = L.circleMarker([poi.latitude, poi.longitude], {
            radius: 12,
            fillColor: color,
            color: 'white',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(markersGroup);

          marker.bindPopup(createPOIPopupHTML(poi, color, labels));
        }

        // Simple haversine distance in kilometers
        function haversineKm(lat1, lon1, lat2, lon2) {

          const R = 6371;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        }

        function formatKm(km) {
          if (!isFinite(km)) return '';
          if (km < 1) return Math.round(km * 1000) + ' m';
          return km.toFixed(1) + ' km';
        }

        function createPOIPopupHTML(poi, color, labels) {
          const user = window.__USER_LOCATION__;
          let distanceHtml = '';

          if (user && isFinite(user.latitude) && isFinite(user.longitude)) {

            const km = haversineKm(user.latitude, user.longitude, poi.latitude, poi.longitude);
            distanceHtml = '<div class="popup-line"><strong>🧭 Distance:</strong> ' + formatKm(km) + '</div>';
          }

          const categoryLabel = labels[poi.category] || 'Center';
          const addressHtml = poi.address ? '<div class="popup-line"><strong>📍 Address:</strong> ' + poi.address + '</div>' : '';
          const phoneLabel = '☎️ Phone';
          const phoneHtml = poi.phone ? '<div class="popup-line"><strong>' + phoneLabel + ':</strong> ' + poi.phone + '</div>' : '';
          const ratingHtml = (poi.rating !== undefined && poi.rating !== null)
            ? '<div class="popup-line"><strong>⭐ Rating:</strong> ' + poi.rating + '</div>'
            : '';

          return (
            '<div style="background:#fff; padding:10px; width:220px; border-radius:8px;">'
            + '<div style="font-weight:800; color:#1a1a2e; font-size:13px; margin-bottom:6px;">' + poi.name + '</div>'
            + distanceHtml
            + addressHtml
            + phoneHtml
            + ratingHtml
            + '<div style="margin-top:8px;">'
            + '<span style="display:inline-block; font-size:11px; font-weight:700; padding:4px 10px; border-radius:999px; color:#fff; background-color:' + color + ';">'
            + categoryLabel
            + '</span>'
            + '</div>'
            + '</div>'
          );
        }




        function renderMap(pois) {
          if (!map) initMap();
          markersGroup.clearLayers();

          const visiblePois = pois || [];

          if (visiblePois.length > 0) {
            visiblePois.forEach(addPOI);

            const group = L.featureGroup(visiblePois.map((p) => L.latLng([p.latitude, p.longitude])));
            const bounds = L.latLngBounds(group.getLayers().map((l) => l));
            if (bounds.isValid()) map.fitBounds(bounds.pad(0.1), { animate: true });
          } else {
            map.setView([OLONGAPO_CENTER.latitude, OLONGAPO_CENTER.longitude], 13);
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

        // Expose stable global recenter function for React Native calls
        window.__recenterToOlongapo = function () {
          try {
            if (!map) initMap();
            map.setView([14.8450, 120.2870], 13, { animate: true });
          } catch (e) {
            console.error('Recentering error:', e);
          }
        };

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

  // NOTE: IMPORTANT: Marker positions and names come ONLY from OLONGAPO_POI_DATA below.
  // If the user reports wrong positions/names, update the hardcoded POI dataset.


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
      // Prefer live Overpass data (no API key). Fallback to hardcoded POIs.
    const results = await fetchPOIsFromOverpass(filter);

      // Hardcoded overrides to ensure specific known locations render at correct coordinates.
      // This prevents wrong Overpass-derived centers/geometry for particular POIs.
      let merged = results;
      if (filter === 'police') {
        // Keep only the police POIs we explicitly trust/override.
        // This removes inaccurate Overpass police markers (wrong locality/centers).
        merged = OLONGAPO_POI_DATA.filter((p) => p.category === 'police');
      }

      setPois(merged);


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

  const recenterMapToOlongapo = () => {
    mapRef.current?.injectJavaScript(`
      (function () {
        try {
          // Always attempt in the current WebView instance.
          if (typeof window.__recenterToOlongapo === 'function') {
            window.__recenterToOlongapo();
            return;
          }

          // Fallback: if initMap exists but recenter was not wired yet,
          // initialize then recenter.
          if (typeof window.initMap === 'function') {
            window.initMap();
            if (typeof window.__recenterToOlongapo === 'function') {
              window.__recenterToOlongapo();
            } else {
              // Last resort: directly set view.
              if (typeof map !== 'undefined' && map && typeof map.setView === 'function') {
                map.setView([14.8450, 120.2870], 13, { animate: true });
              }
            }
            return;
          }
        } catch (err) {
          console.error('Recentering error:', err);
        }
      })();
      true;
    `);
  };

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
                    <View
                      style={[
                        r2.resIcon,
                        {
                          backgroundColor: r.color,
                        },
                      ]}
                    >
                      <FontAwesome6 name={r.icon} size={24} color={r.accent} />
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

            <Text style={s.sectionLabel}>Nearby Help Centers in Olongapo</Text>

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
            <View>
              {!poiLoading ? (
                <>
                  <TouchableOpacity
                    onPress={recenterMapToOlongapo}
                    style={styles.centerButton}
                    activeOpacity={0.85}
                    accessibilityLabel="Center map on Olongapo"
                    testID="center-map-button"
                  >
                    <FontAwesome6 name="location-crosshairs" size={16} color="#fff" />
                    <Text style={styles.centerButtonText}>Center</Text>
                  </TouchableOpacity>

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
                          window.__USER_LOCATION__ = ${JSON.stringify(userLocation)};
                          renderMap(${JSON.stringify(pois)});
                        `);

                      }, 300);
                    }}
                  />
                </>
              ) : (
                <View style={r2.mapPlaceholder}>
                  <ActivityIndicator size="large" color={colors.safe} />
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: spacing.sm }}>
                    Loading help centers…
                  </Text>
                </View>
              )}
            </View>
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
    height: 480,
    borderRadius: 12,
    marginBottom: spacing.md,
  },

  centerButton: {
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(26,26,46,0.92)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  centerButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
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


// ─── ResourcesScreen.js ──────────────────────────────────────────────────────
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';

import { colors, spacing } from '../theme';
import { Card } from '../components';
import { r2, s } from './sharedStyles';

export default function ResourcesScreen({ navigation }) {
  const RESOURCES = [
    { icon: '', title: "Women's Rights (RA 9262)", desc: 'Anti-Violence Against Women and Children Act', color: colors.primaryLight },
    { icon: '', title: 'Youth Protection Laws', desc: 'Rights and protections for minors in the Philippines', color: colors.infoLight },
    { icon: '', title: 'Emergency Hotlines', desc: 'PNP: 911 · DSWD: 931 · Bantay Bata: 163', color: colors.sosLight },
    { icon: '', title: 'What to do after abuse', desc: 'Step-by-step guide for immediate safety', color: colors.safeLight },
    { icon: '', title: 'Legal Steps', desc: 'How to file a blotter and seek a protection order', color: colors.warnLight },
  ];

  const CENTERS = [
    { name: 'Barangay Hall', dist: '0.2 km', color: colors.primary },
    { name: 'Police Station', dist: '0.5 km', color: colors.info },
    { name: 'Ospital ng Maynila', dist: '1.1 km', color: colors.safe },
    { name: 'DSWD Office', dist: '1.4 km', color: colors.warn },
  ];

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
          <View style={r2.mapPlaceholder}>
            <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>🗺️</Text>
            <Text style={{ fontSize: 12, color: colors.safe, fontWeight: '600' }}>
              Map — Nearby Support Centers
            </Text>
            <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>
              Enable location to see distance
            </Text>
          </View>

          {CENTERS.map((c, i) => (
            <View
              key={i}
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
              <Text style={r2.centerDist}>{c.dist}</Text>

              <TouchableOpacity style={r2.dirBtn}>
                <Text style={r2.dirBtnText}>Directions</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}
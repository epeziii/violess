import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { colors, spacing } from '../theme';
import { Card, StatusBadge, TimelineStep, Avatar } from '../components';
import { s } from './sharedStyles';

const CASES = [
  { id: '#VIO-2025-001', type: 'Harassment', status: 'reviewing', date: 'Feb 12', officer: 'Officer Reyes', initials: 'OR' },
  { id: '#VIO-2025-003', type: 'Bullying',   status: 'pending',   date: 'Feb 14', officer: 'Unassigned',    initials: '?' },
];

export default function CaseTrackingScreen({ navigation }) {
  const [selected, setSelected] = useState(CASES[0]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Case Tracking</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Your Cases */}
        <Text style={s.sectionLabel}>Your Cases</Text>
        {CASES.map(c => (
          <TouchableOpacity key={c.id} onPress={() => setSelected(c)} activeOpacity={0.85}>
            <Card style={[s.caseCard, selected.id === c.id && s.caseCardActive]}>
              <View style={s.caseTop}>
                <View>
                  <Text style={s.caseId}>{c.id}</Text>
                  <Text style={s.caseType}>{c.type}</Text>
                </View>
                <StatusBadge status={c.status} />
              </View>
              <Text style={s.caseDate}>Filed: {c.date}, 2025</Text>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Case Progress */}
        <Text style={s.sectionLabel}>Case Progress</Text>
        <Card>
          <TimelineStep label="Report Submitted"          sub={`${selected.date}, 9:00 AM`} status="done" />
          <TimelineStep
            label="Barangay Reviewing"
            sub={selected.status === 'reviewing' ? `${selected.officer} assigned` : 'Pending'}
            status={selected.status === 'reviewing' ? 'active' : 'pending'}
          />
          <TimelineStep label="Referred to Social Worker" sub="Pending assignment" status="pending" />
          <TimelineStep label="Action Taken"              sub="—" status="pending" />
          <TimelineStep label="Case Closed"               sub="—" status="pending" last />
        </Card>

        {/* Assigned Officer */}
        <Text style={s.sectionLabel}>Assigned Officer</Text>
        <Card>
          <View style={s.officerRow}>
            <Avatar initials={selected.initials} size={44} />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text style={s.officerName}>{selected.officer}</Text>
              <Text style={s.officerRole}>VAWC Desk · Brgy. 123</Text>
            </View>
            <TouchableOpacity style={s.msgBtn}>
              <Text style={s.msgBtnText}>Message</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
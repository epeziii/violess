import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { colors, spacing } from '../theme';
import { Card, StatusBadge, TimelineStep, Avatar } from '../components';
import { s } from './sharedStyles';
import { auth } from '../config/firebase';
import { API_BASE_URL } from '../config/api';

export default function CaseTrackingScreen({ navigation }) {
  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserCases = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError("No user logged in");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/user/${currentUser.uid}/cases`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error || "Failed to fetch cases");
          setCases([]);
          setLoading(false);
          return;
        }

        // Transform backend cases to UI format
        const transformedCases = data.cases.map(c => ({
          id: c.caseId,
          type: c.incidentType,
          status: c.status,
          date: new Date(c.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
          officer: c.assignedOfficer || "Unassigned",
          initials: c.assignedOfficer ? c.assignedOfficer.split(' ').map(n => n.charAt(0)).join('') : '?',
          isAnonymous: c.isAnonymous,
        }));

        setCases(transformedCases);
        if (transformedCases.length > 0) {
          setSelected(transformedCases[0]);
        }
      } catch (err) {
        console.error('Error fetching cases:', err);
        setError("Failed to load cases");
      } finally {
        setLoading(false);
      }
    };

    fetchUserCases();
  }, []);

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

        {loading ? (
          <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
            <Text style={{ color: colors.error, marginBottom: spacing.sm }}>Unable to load cases</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>{error}</Text>
          </View>
        ) : cases.length === 0 ? (
          <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted }}>No cases yet</Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
              Submit an incident report to track cases here
            </Text>
          </View>
        ) : (
          cases.map(c => (
            <TouchableOpacity key={c.id} onPress={() => setSelected(c)} activeOpacity={0.85}>
              <Card style={[s.caseCard, selected?.id === c.id && s.caseCardActive]}>
                <View style={s.caseTop}>
                  <View>
                    <Text style={s.caseId}>{c.id}</Text>
                    <Text style={s.caseType}>{c.type}</Text>
                  </View>
                  <StatusBadge status={c.status} />
                </View>
                <Text style={s.caseDate}>Filed: {c.date}</Text>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {selected && (
          <>
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
                <TouchableOpacity style={s.msgBtn} onPress={() => navigation.navigate('Chat', { caseId: selected.id })}>
                  <Text style={s.msgBtnText}>Message</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}
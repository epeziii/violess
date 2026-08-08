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

  const fetchWithRetry = async (url, maxRetries = 2) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let timeoutId = null;
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        });

        if (timeoutId !== null) clearTimeout(timeoutId);

        if (!response.ok) {
          if (attempt < maxRetries) continue;
          return null;
        }

        return await response.json();
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.warn('Fetch timeout, retrying...');
        } else if (attempt < maxRetries) {
          console.warn(`Fetch attempt ${attempt + 1} failed, retrying...`, error.message);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        } else {
          throw error;
        }
      }
    }
  };

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

        console.log('🔍 [Track] Fetching cases for uid:', currentUser.uid);
        console.log('🔗 [Track] Using API:', API_BASE_URL);
        
        const data = await fetchWithRetry(`${API_BASE_URL}/user/${currentUser.uid}/cases`, 2);
        
        console.log('📱 [Track] Backend response:', data);
        
        if (!data) {
          const errMsg = "Unable to connect to server after retries. Check network/backend.";
          console.error('❌ [Track] No data response:', errMsg);
          setError(errMsg);
          setCases([]);
          setLoading(false);
          return;
        }

        if (!data.success) {
          const errMsg = data.error || "Failed to fetch cases";
          console.error('❌ [Track] Backend error:', errMsg);
          setError(errMsg);
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
          referredTo: c.referredTo || "",
          referralReason: c.referralReason || "",
          // Use first letter of first and last names only (e.g., Juan Dela Cruz -> JDC should be JC)
          initials: c.assignedOfficer
            ? (() => {
                const parts = String(c.assignedOfficer)
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean);

                if (parts.length === 0) return '?';
                if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

                const first = parts[0];
                const last = parts[parts.length - 1];
                return `${first.charAt(0).toUpperCase()}${last.charAt(0).toUpperCase()}`;
              })()
            : '?',
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

  const getTimelineProgress = (caseItem) => {
    const st = caseItem?.status || 'pending';
    const officerAssigned = caseItem?.officer && caseItem.officer !== 'Unassigned';
    const destination = caseItem?.referredTo?.trim();

    const isAssignedState = st === 'reviewing' || st === 'assigned';
    const isReferredState = st === 'referred';

    const assignmentStep = {
      label:
        isReferredState
          ? `Referred to ${destination || 'External Service'}`
          : officerAssigned
            ? `Assigned to ${caseItem.officer}`
            : 'Barangay Reviewing',
      sub:
        isReferredState
          ? caseItem?.referralReason || 'Case is being handled externally'
          : officerAssigned
            ? `${caseItem.officer} is assigned to this case`
            : 'Awaiting assignment',
      status:
        st === 'pending'
          ? 'active'
          : officerAssigned || isReferredState
            ? 'done'
            : 'pending',
    };

    const actionStep = {
      label: 'Action Taken',
      sub:
        st === 'resolved' || st === 'closed'
          ? 'Follow-up completed'
          : 'This is the next step in the case progress',
      status:
        st === 'resolved' || st === 'closed'
          ? 'done'
          : isAssignedState
            ? 'active'
            : 'pending',
    };

    const closedStep = {
      label: 'Case Closed',
      sub: st === 'closed' ? 'Case resolved and closed' : 'Pending closure',
      status: st === 'closed' ? 'done' : 'pending',
    };

    if (isReferredState) {
      return [
        {
          label: 'Report Submitted',
          sub: caseItem?.date || 'Submitted',
          status: 'done',
        },
        assignmentStep,
      ];
    }

    return [
      {
        label: 'Report Submitted',
        sub: caseItem?.date || 'Submitted',
        status: 'done',
      },
      assignmentStep,
      actionStep,
      closedStep,
    ];
  };

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
              {(() => {
                const progress = getTimelineProgress(selected);

                return progress.map((item, index) => (
                  <TimelineStep
                    key={item.label}
                    label={item.label}
                    sub={item.sub}
                    status={item.status}
                    last={index === progress.length - 1}
                  />
                ));
              })()}
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
                {selected.officer && selected.officer !== 'Unassigned' ? (
                  <TouchableOpacity style={s.msgBtn} onPress={() => navigation.navigate('Chat', { caseId: selected.id })}>
                    <Text style={s.msgBtnText}>Message</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ───────── ResourceDetailScreen.js ─────────

import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

import { colors, radius, shadow, spacing } from '../theme';

// ───────── Resource data ─────────
export const RESOURCE_DATA = {
  ra9262: {
    id: 'ra9262',
    icon: 'shield',
    title: "Women's Rights (RA 9262)",
    subtitle: 'Anti-Violence Against Women and Children Act of 2004',
    color: colors.primaryLight,
    accentColor: colors.primary,
    overview:
      'Republic Act 9262, also known as the Anti-VAWC Act, protects women and their children from physical, sexual, psychological, and economic abuse committed by a spouse, former spouse, or any person with whom the victim has or had a dating or sexual relationship.',
    sections: [
      {
        heading: 'Who is protected?',
        items: [
          'Women who are wives or former wives',
          'Women in a dating or sexual relationship',
          'Women with a common child with the abuser',
          'Children of the women victim, whether legitimate or not',
        ],
      },
      {
        heading: 'Types of violence covered',
        items: [
          'Physical violence — hitting, slapping, kicking, or any bodily harm',
          'Sexual violence — rape, sexual assault, forced acts',
          'Psychological violence — verbal abuse, intimidation, controlling behavior',
          'Economic abuse — controlling finances, preventing work, withholding money',
        ],
      },
      {
        heading: 'Your rights under RA 9262',
        items: [
          'Right to file a complaint at the barangay, police, or court',
          'Right to a Barangay Protection Order (BPO) within 24 hours',
          'Right to a Temporary Protection Order (TPO) from the court',
          'Right to shelter, support, and custody of children',
          'Right to free legal assistance from PAO',
        ],
      },
      {
        heading: 'Penalties for violators',
        items: [
          'Imprisonment of 6 months to 40 years depending on the offense',
          'Mandatory attendance in psychological intervention',
          'Payment of damages to the victim',
          'Perpetual disqualification from public office',
        ],
      },
    ],
    steps: {
      heading: 'What to do if your rights are violated',
      list: [
        'Go to the nearest Barangay Hall and request a Barangay Protection Order (BPO)',
        'File an incident blotter at the PNP or NBI',
        'Seek medical attention and request a medico-legal certificate',
        'Contact DSWD or a social worker for shelter and support',
        "Consult the Public Attorney's Office (PAO) for free legal help",
      ],
    },
    hotlines: [
      { label: 'PNP Women & Children Protection', number: '(02) 8723-0401' },
      { label: 'DSWD Crisis Hotline', number: '931' },
      { label: 'PCW (Philippine Commission on Women)', number: '(02) 8532-0955' },
      { label: "Libreng Tulong (PAO)", number: '(02) 8929-9436' },
    ],
  },

  youthLaws: {
    id: 'youthLaws',
    icon: 'people-group',
    title: 'Youth Protection Laws',
    subtitle: 'Rights and legal protections for minors in the Philippines',
    color: colors.infoLight,
    accentColor: colors.info,
    overview:
      'The Philippines has strong laws protecting children and youth from abuse, exploitation, and violence. These include the Special Protection of Children Act (RA 7610), the Juvenile Justice Act (RA 9344), and the Anti-Bullying Act (RA 10627).',
    sections: [
      {
        heading: 'RA 7610 — Special Protection of Children',
        items: [
          'Protects children from abuse, exploitation, and discrimination',
          'Covers physical, sexual, and psychological abuse',
          'Applies to children below 18 years old',
          'Mandates reporting of child abuse by any person who knows of it',
        ],
      },
      {
        heading: 'RA 10627 — Anti-Bullying Act',
        items: [
          'Requires all schools to adopt anti-bullying policies',
          'Covers physical, verbal, and cyber bullying',
          'Schools must investigate and resolve incidents within 5 days',
          'Victims may transfer schools without penalty',
        ],
      },
      {
        heading: 'RA 9775 — Anti-Child Pornography Act',
        items: [
          'Criminalizes production, distribution, and possession of child pornography',
          'Applies to online and offline content',
          'Penalties range from 6 years to life imprisonment',
        ],
      },
      {
        heading: 'Rights of every child',
        items: [
          'Right to be protected from abuse, neglect, and exploitation',
          'Right to education, health, and shelter',
          'Right to privacy and dignity',
          'Right to be heard in legal proceedings',
        ],
      },
    ],
    steps: {
      heading: 'What to do if a child is being abused',
      list: [
        'Report immediately to the Barangay Council for the Protection of Children (BCPC)',
        'Call the DSWD or the nearest social welfare office',
        'Bring the child to the nearest hospital for medical evaluation',
        'File a blotter report at the police station',
        'Contact the Department of Education if bullying occurs in school',
      ],
    },
    hotlines: [
      { label: 'Bantay Bata 163 (SOS)', number: '163' },
      { label: 'DSWD Crisis Hotline', number: '931' },
      { label: 'NBI Anti-Human Trafficking', number: '(02) 8523-8231' },
      { label: 'DepEd Child Protection', number: '(02) 8636-5284' },
    ],
  },

  hotlines: {
    id: 'hotlines',
    icon: 'phone',
    title: 'Emergency Hotlines',
    subtitle: 'Direct lines for immediate help and support',
    color: colors.sosLight,
    accentColor: colors.sos,
    overview:
      'In an emergency, call these numbers immediately. Save them on your phone. All calls are confidential and your safety is the priority.',
    sections: [
      {
        heading: 'Emergency & Police',
        items: [
          'PNP Emergency Hotline — 911',
          'PNP Women & Children Protection Desk — (02) 8723-0401',
          'NBI — (02) 8523-8231',
          'Bureau of Fire Protection — 160',
        ],
      },
      {
        heading: 'Government Support Services',
        items: [
          'DSWD Crisis Intervention — 931',
          'DSWD Hotline — (02) 8931-8101',
          'Department of Health — 1555',
          'Philippine Commission on Women — (02) 8532-0955',
        ],
      },
      {
        heading: 'Child & Youth Services',
        items: [
          'Bantay Bata 163 — 163 (SOS)',
          'Childhope Philippines — (02) 8563-6131',
          'DepEd Child Protection — (02) 8636-5284',
        ],
      },
      {
        heading: 'Mental Health & Counseling',
        items: [
          'National Center for Mental Health — 1553',
          'In Touch Crisis Line — (02) 8893-7603',
          'Hopeline Philippines — (02) 8804-4673',
        ],
      },
    ],
    steps: {
      heading: 'Tips when calling for help',
      list: [
        'Stay as calm as possible and speak clearly',
        'State your name and exact location first',
        'Describe the emergency briefly',
        "Follow the operator's instructions",
        'Stay on the line unless told otherwise',
      ],
    },
    hotlines: [
      { label: 'PNP Emergency', number: '911' },
      { label: 'DSWD', number: '931' },
      { label: 'Bantay Bata', number: '163' },
      { label: 'DOH', number: '1555' },
    ],
  },

  afterAbuse: {
    id: 'afterAbuse',
    icon: 'shield-heart',
    title: 'What to do after abuse',
    subtitle: 'Immediate steps to ensure your safety and begin recovery',
    color: colors.safeLight,
    accentColor: colors.safe,
    overview:
      'If you or someone you know has experienced abuse, taking the right steps immediately can protect your safety, preserve evidence, and begin the process of getting justice and healing.',
    sections: [
      {
        heading: 'Immediate safety (first 24 hours)',
        items: [
          'Get to a safe place away from the abuser',
          'Call a trusted person — family, friend, or neighbor',
          'Contact the barangay or police if in immediate danger',
          'Do not shower or change clothes if sexual assault occurred — preserve evidence',
          'Seek medical attention as soon as possible',
        ],
      },
      {
        heading: 'Medical care',
        items: [
          'Go to the nearest hospital emergency room',
          'Request a medico-legal examination and certificate',
          'Disclose all injuries — including hidden ones',
          'Ask for post-exposure prophylaxis (PEP) if needed',
          'Keep all medical records and certificates safe',
        ],
      },
      {
        heading: 'Emotional and mental health',
        items: [
          'What you feel — fear, anger, shame — is a normal response',
          'Talk to a trusted person or counselor',
          'Contact a crisis hotline if you feel unsafe or overwhelmed',
          'Know that the abuse is never your fault',
          'Recovery takes time — be patient with yourself',
        ],
      },
      {
        heading: 'Gathering evidence',
        items: [
          'Take photos of injuries as soon as possible',
          'Save threatening messages, emails, or voicemails',
          'Write down what happened while details are fresh',
          'List any witnesses who may have seen or heard something',
          'Keep all evidence in a safe place the abuser cannot access',
        ],
      },
    ],
    steps: {
      heading: 'Step-by-step action plan',
      list: [
        'Ensure your immediate safety — leave if you can',
        'Call 911 or go to the nearest Barangay Hall',
        'Seek medical attention and get a medico-legal certificate',
        'File a blotter report at the police station',
        'Apply for a Barangay Protection Order (BPO)',
        'Reach out to a social worker or DSWD for shelter and support',
        'Contact PAO for free legal assistance',
      ],
    },
    hotlines: [
      { label: 'PNP Emergency', number: '911' },
      { label: 'DSWD Crisis Hotline', number: '931' },
      { label: 'Hopeline', number: '(02) 8804-4673' },
      { label: 'NCMH Crisis', number: '1553' },
    ],
  },

  legalSteps: {
    id: 'legalSteps',
    icon: 'gavel',
    title: 'Legal Steps',
    subtitle: 'How to file a complaint and seek legal protection',
    color: colors.warnLight,
    accentColor: colors.warn,
    overview:
      'The legal process can feel overwhelming, but there are clear steps and people who will help you. You do not need a lawyer to start. Your first step is the barangay or police station.',
    sections: [
      {
        heading: 'Step 1 — Barangay Protection Order (BPO)',
        items: [
          'Go to your Barangay Hall and ask the Punong Barangay',
          'The BPO must be issued within 24 hours of your request',
          'It prohibits the abuser from contacting or approaching you',
          'Effective for 15 days and can be renewed',
          'Free of charge — no lawyer needed',
        ],
      },
      {
        heading: 'Step 2 — Police Blotter',
        items: [
          'Go to the nearest PNP station and request to file a blotter',
          'Bring your medico-legal certificate if available',
          'Bring photos of injuries and any evidence',
          'You will be given a blotter reference number — keep it safe',
          'Request a copy of the blotter report',
        ],
      },
      {
        heading: 'Step 3 — Temporary Protection Order (TPO)',
        items: [
          'File a petition at the Regional Trial Court (RTC)',
          'The court may issue a TPO within 24 hours ex parte (without the abuser present)',
          'TPO is effective for 30 days and can be extended',
          'Violations of the TPO result in immediate arrest',
          'A free lawyer from PAO can help you file',
        ],
      },
      {
        heading: 'Step 4 — Criminal complaint',
        items: [
          "A formal complaint can be filed at the City Prosecutor's Office",
          'Bring all evidence: medical certificate, photos, blotter, witnesses',
          'The prosecutor will determine if there is probable cause',
          'If probable cause is found, a case is filed in court',
          'You may be assisted by PAO or a private lawyer',
        ],
      },
    ],
    steps: {
      heading: 'Where to go for free legal help',
      list: [
        "Public Attorney's Office (PAO) — free for those who cannot afford a lawyer",
        'Integrated Bar of the Philippines (IBP) — free legal aid clinics',
        'DSWD — social workers who can guide the legal process',
        'University legal aid clinics — free consultations',
        "Women's legal rights organizations in your city",
      ],
    },
    hotlines: [
      { label: "PAO (Public Attorney's Office)", number: '(02) 8929-9436' },
      { label: 'IBP Legal Aid', number: '(02) 8531-7635' },
      { label: 'DSWD', number: '931' },
      { label: 'PNP Women & Children Desk', number: '(02) 8723-0401' },
    ],
  },
};

export default function ResourceDetailScreen({ navigation, route }) {
  const { resourceId } = route.params;
  const data = RESOURCE_DATA[resourceId];

  if (!data) return null;

  const callNumber = (number) => {
    Linking.openURL(`tel:${number.replace(/[^0-9+]/g, '')}`);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      <View style={[styles.header, { backgroundColor: colors.primaryDark }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <FontAwesome6 name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Resource Center
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroBanner, { backgroundColor: data.color }]}>
          <View style={[styles.heroIconWrap, { backgroundColor: data.accentColor + '22' }]}>
            <FontAwesome6 name={data.icon} size={32} color={data.accentColor} />
          </View>
          <Text style={[styles.heroTitle, { color: data.accentColor }]}>{data.title}</Text>
          <Text style={[styles.heroSubtitle, { color: data.accentColor + 'BB' }]}>{data.subtitle}</Text>
        </View>

        <View style={styles.overviewCard}>
          <Text style={styles.overviewText}>{data.overview}</Text>
        </View>

        {data.sections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={[styles.sectionHeading, { color: data.accentColor }]}>{section.heading}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, ii) => (
                <View key={ii} style={[styles.bulletRow, ii < section.items.length - 1 && styles.bulletRowBorder]}>
                  <View style={[styles.bulletDot, { backgroundColor: data.accentColor }]} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: data.accentColor }]}>{data.steps.heading}</Text>
          <View style={styles.sectionCard}>
            {data.steps.list.map((step, i) => (
              <View key={i} style={[styles.stepRow, i < data.steps.list.length - 1 && styles.bulletRowBorder]}>
                <View style={[styles.stepNumber, { backgroundColor: data.accentColor }]}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Text style={styles.bulletText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: data.accentColor }]}>Hotlines & contacts</Text>
          {data.hotlines.map((h, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.hotlineCard, shadow.sm]}
              onPress={() => callNumber(h.number)}
              activeOpacity={0.8}
            >
              <View style={styles.hotlineLeft}>
                <Text style={styles.hotlineLabel}>{h.label}</Text>
                <Text style={[styles.hotlineNumber, { color: data.accentColor }]}>{h.number}</Text>
              </View>
              <View style={[styles.callBtn, { backgroundColor: data.accentColor }]}>
                <Text style={styles.callBtnText}>Call</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.noteCard, { backgroundColor: data.color, borderColor: data.accentColor + '25' }]}>
          <Text style={[styles.noteText, { color: data.accentColor }]}>
            All reports filed through Vio-less are confidential. You can also report anonymously if you are not comfortable sharing your identity.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: '#fff' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: '#fff' },

  scroll: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: 48 },

  heroBanner: {
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  heroSubtitle: { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  overviewCard: {
    margin: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: spacing.lg,
  },
  overviewText: { fontSize: 13, color: colors.textSecondary, lineHeight: 22 },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.sm,
  },
  bulletRowBorder: { borderBottomWidth: 0.5, borderBottomColor: colors.borderLight },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  bulletText: { fontSize: 13, color: colors.text, lineHeight: 20, flex: 1 },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.md,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  hotlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  hotlineLeft: { flex: 1 },
  hotlineLabel: { fontSize: 12, fontWeight: '600', color: colors.text, marginBottom: 2 },
  hotlineNumber: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  callBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
  },
  callBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  noteCard: {
    margin: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 0.5,
    padding: spacing.md,
  },
  noteText: { fontSize: 12, lineHeight: 19, fontWeight: '500' },
});


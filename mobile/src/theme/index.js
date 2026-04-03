export const colors = {
  primary: '#C2185B',
  primaryDark: '#880E4F',
  primaryLight: '#FCE4EC',
  primaryMid: '#E91E63',
  accent: '#6A1B9A',
  accentLight: '#EDE7F6',

  sos: '#D32F2F',
  sosLight: '#FFEBEE',
  safe: '#00695C',
  safeLight: '#E0F2F1',
  warn: '#E65100',
  warnLight: '#FFF3E0',
  info: '#1565C0',
  infoLight: '#E3F2FD',

  white: '#FFFFFF',
  surface: '#FFF8FC',
  surfaceAlt: '#F8F0F5',
  border: 'rgba(194,24,91,0.12)',
  borderLight: 'rgba(0,0,0,0.06)',

  text: '#1A0A12',
  textSecondary: '#6B4C5E',
  textMuted: '#A08898',
  placeholder: '#C4A8B8',
};

export const typography = {
  display: { fontFamily: 'System', fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontFamily: 'System', fontWeight: '700' },
  subheading: { fontFamily: 'System', fontWeight: '600' },
  body: { fontFamily: 'System', fontWeight: '400' },
  caption: { fontFamily: 'System', fontWeight: '400', fontSize: 11 },
  label: { fontFamily: 'System', fontWeight: '600', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, full: 999,
};

export const shadow = {
  sm: {
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#C2185B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#880E4F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
};

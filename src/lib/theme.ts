// src/lib/theme.ts

export const LIGHT_COLORS = {
  background: '#f5f6f8', // --bg-main
  surface: '#ffffff', // --card-solid
  surfaceElevated: '#f8f9fa',
  cardBg: 'rgba(255,255,255,0.6)', // --card-bg glassmorphism
  cardBlur: 'rgba(255,255,255,0.5)', // --card-blur
  border: '#dddddd', // --border-color
  borderLight: '#eeeeee', // --border-light
  text: '#111111', // --text-main
  textMuted: '#666666', // --text-muted
  textSubtle: '#999999', // --text-light
  shadowSm: 'rgba(0,0,0,0.05)',
  shadowMd: 'rgba(0,0,0,0.15)',
  shadowLg: 'rgba(0,0,0,0.1)',
  success: '#3ecf8e',
  warning: '#f59e0b',
  favActive: '#ff6b6b', // Rouge favori (#ff6b6b)
};

export const DARK_COLORS = {
  background: '#121214',
  surface: '#1c1c1e',
  surfaceElevated: '#2c2c2e',
  cardBg: 'rgba(28,28,30,0.85)',
  cardBlur: 'rgba(28,28,30,0.65)',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.05)',
  text: '#ffffff',
  textMuted: '#8e8e93',
  textSubtle: '#636366',
  shadowSm: 'rgba(0,0,0,0.3)',
  shadowMd: 'rgba(0,0,0,0.5)',
  shadowLg: 'rgba(0,0,0,0.4)',
  success: '#10b981',
  warning: '#f59e0b',
  favActive: '#ff6b6b',
};

export const PRIMARY_VARIANTS = {
  violet: {
    primary: '#4f5af6',
    primaryHover: '#3d49e6',
    primaryDark: '#3d49e6',
    primaryContrast: '#ffffff',
    voBadge: '#4f5af6',
    vfBadge: '#4f5af6',
  },
  blue: {
    primary: '#0161A7',
    primaryHover: '#014A80',
    primaryDark: '#014A80',
    primaryContrast: '#ffffff',
    voBadge: '#0161A7',
    vfBadge: '#0161A7',
  },
  white: {
    primary: '#ffffff',
    primaryHover: '#f0f0f0',
    primaryDark: '#e5e5e5',
    primaryContrast: '#121214',
    voBadge: '#ffffff',
    vfBadge: '#ffffff',
  },
  black: {
    primary: '#1c1c1e',
    primaryHover: '#2c2c2e',
    primaryDark: '#000000',
    primaryContrast: '#ffffff',
    voBadge: '#1c1c1e',
    vfBadge: '#1c1c1e',
  },
  cleardark: {
    primary: '#ffffff',
    primaryHover: '#f0f0f0',
    primaryDark: '#e5e5e5',
    primaryContrast: '#121212',
    voBadge: '#ffffff',
    vfBadge: '#ffffff',
  },
};

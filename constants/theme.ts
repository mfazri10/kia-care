// KIA Care - Theme Constants
// Soft, professional color palette for mothers

export const Colors = {
  // Primary - Soft Rose/Pink
  primary: '#E8919B',
  primaryLight: '#F5C6CB',
  primaryDark: '#C76B77',
  primaryBg: '#FFF0F2',

  // Secondary - Soft Teal
  secondary: '#7BBFB5',
  secondaryLight: '#B2DDD6',
  secondaryDark: '#5A9E94',
  secondaryBg: '#EFF9F7',

  // Accent - Warm Gold
  accent: '#E8C547',
  accentLight: '#F5E6A0',
  accentDark: '#C4A030',
  accentBg: '#FDF8E8',

  // Phase Colors
  praHamil: '#A78BDA', // Soft purple
  praHamilLight: '#D4C5F0',
  praHamilBg: '#F5F0FF',
  hamil: '#E8919B', // Soft rose
  hamilLight: '#F5C6CB',
  hamilBg: '#FFF0F2',
  pascaMelahirkan: '#7BBFB5', // Soft teal
  pascaMelahirkanLight: '#B2DDD6',
  pascaMelahirkanBg: '#EFF9F7',

  // Danger
  danger: '#E74C3C',
  dangerLight: '#FADBD8',
  dangerBg: '#FFF5F5',
  warning: '#F39C12',
  warningLight: '#FDEBD0',
  warningBg: '#FFFBF0',
  success: '#27AE60',
  successLight: '#D5F5E3',
  successBg: '#F0FFF5',

  // Neutral
  white: '#FFFFFF',
  background: '#FAFBFD',
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F6F8',
  border: '#E8EDF2',
  borderLight: '#F0F3F7',

  // Text
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  textTertiary: '#BDC3C7',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.08)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  title: 32,
  hero: 36,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadow = {
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const phaseConfig = {
  'pra-hamil': {
    label: 'Pra Hamil',
    color: Colors.praHamil,
    lightColor: Colors.praHamilLight,
    bgColor: Colors.praHamilBg,
    icon: 'heart-outline' as const,
    description: 'Persiapan sebelum kehamilan',
  },
  'hamil': {
    label: 'Hamil',
    color: Colors.hamil,
    lightColor: Colors.hamilLight,
    bgColor: Colors.hamilBg,
    icon: 'body-outline' as const,
    description: 'Masa kehamilan',
  },
  'pasca-melahirkan': {
    label: 'Pasca Melahirkan',
    color: Colors.pascaMelahirkan,
    lightColor: Colors.pascaMelahirkanLight,
    bgColor: Colors.pascaMelahirkanBg,
    icon: 'happy-outline' as const,
    description: 'Masa setelah melahirkan',
  },
};

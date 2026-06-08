// ─── Stovd "Warm Kitchen" brand palette (runtime / useTheme source) ─────
// Must mirror lib/theme.ts. Terracotta primary, herb-green secondary,
// saffron accent, warm cream→espresso neutral ramp.
export const colors = {
  // Primary — Terracotta / tomato (brand)
  primary: {
    50: '#FBEDE9',
    100: '#F5D3C9',
    200: '#ECB3A4',
    300: '#E08E78',
    400: '#D56A4F',
    500: '#C8472B', // Main primary
    600: '#B23D24',
    700: '#97331E',
    800: '#7C2A19',
    900: '#5E2013',
  },

  // Secondary — Herb green
  secondary: {
    50: '#ECF3EB',
    100: '#CFE0CD',
    200: '#AECBAB',
    300: '#8DB689',
    400: '#74A06F',
    500: '#5B8C5A', // Main secondary
    600: '#4E7A4D',
    700: '#3F6440',
    800: '#324F33',
    900: '#243A26',
  },

  // Accent — Saffron / amber
  accent: {
    50: '#FDF4E5',
    100: '#FAE2BD',
    200: '#F5CE90',
    300: '#EFB962',
    400: '#EBAB48',
    500: '#E8A13A', // Main accent
    600: '#CE8A2C',
    700: '#A86E22',
    800: '#85571B',
    900: '#5F3E13',
  },

  // Status Colors
  success: {
    50: '#ECF5EC',
    500: '#4F9D52',
    600: '#43883F',
    700: '#356B33',
  },

  warning: {
    50: '#FDF4E5',
    500: '#E8920F',
    600: '#CE7F0B',
    700: '#A86609',
  },

  error: {
    50: '#FCEBEA',
    500: '#DC2626',
    600: '#C21F1F',
    700: '#9F1A1A',
  },

  // Neutral — warm-tinted (cream → espresso)
  neutral: {
    0: '#FFFFFF',
    50: '#FBF7F0',
    100: '#F4EEE4',
    200: '#E9E0D3',
    300: '#D8CCBA',
    400: '#B9AB97',
    500: '#9A8C78',
    600: '#7A6E5D',
    700: '#5C5346',
    800: '#3E382F',
    900: '#2A2422',
    950: '#1A1614',
  },
};

// ✅ UPDATED: Enhanced Theme interface
interface Colors {
  // Base colors
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  error: string;
  warning: string;
  success: string;
  info: string;

  // Text colors
  text: string;
  textPrimary: string;
  textSecondary: string;
  textOnPrimary: string;

  // UI elements
  border: string;
  borderLight: string;
  divider: string;

  // Special UI states
  overlay: string;
  shadow: string;

  // Component specific
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;
  surfaceVariant: string;

  // Button colors
  buttonPrimary: string;
  buttonSecondary: string;

  // Category colors
  categoryActive: string;
  categoryInactive: string;
  categoryBadge: string;

  // Expiry colors
  expiryUrgent: string;
  expirySoon: string;
  expiryOk: string;
  expiryNeutral: string;
}

// Light Theme
const lightColors: Colors = {
  // Base colors
  primary: colors.primary[500],
  secondary: colors.secondary[500],
  accent: colors.accent[500],
  background: colors.neutral[50],
  surface: colors.neutral[0],
  error: colors.error[500],
  warning: colors.warning[500],
  success: colors.primary[50],
  info: colors.accent[500],

  // Text colors
  text: colors.neutral[900],
  textPrimary: colors.neutral[900],
  textSecondary: colors.neutral[500],
  textOnPrimary: colors.neutral[0],

  // UI elements
  border: colors.neutral[300],
  borderLight: colors.neutral[200],
  divider: colors.neutral[200],

  // Special UI states
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: colors.neutral[900],

  // Component specific
  inputBackground: colors.neutral[50],
  inputBorder: colors.neutral[300],
  inputPlaceholder: colors.neutral[500],
  surfaceVariant: colors.neutral[100],

  // Button colors
  buttonPrimary: colors.primary[500],
  buttonSecondary: colors.secondary[500],

  // Category colors
  categoryActive: colors.primary[500],
  categoryInactive: colors.neutral[600],
  categoryBadge: colors.neutral[200],

  // Expiry colors
  expiryUrgent: colors.error[500],
  expirySoon: colors.warning[500],
  expiryOk: colors.success[500],
  expiryNeutral: colors.neutral[500],
};

// Dark Theme
const darkColors: Colors = {
  // Base colors
  primary: colors.primary[400],
  secondary: colors.secondary[400],
  accent: colors.accent[400],
  background: colors.neutral[950],
  surface: colors.neutral[900],
  error: colors.error[600],
  warning: colors.warning[500],
  success: colors.primary[300],
  info: colors.accent[400],

  // Text colors
  text: colors.neutral[0],
  textPrimary: colors.neutral[100],
  textSecondary: colors.neutral[400],
  textOnPrimary: colors.neutral[900],

  // UI elements
  border: colors.neutral[700],
  borderLight: colors.neutral[800],
  divider: colors.neutral[800],

  // Special UI states
  overlay: 'rgba(65, 62, 62, 0.8)',
  shadow: colors.neutral[0],

  // Component specific
  inputBackground: colors.neutral[800],
  inputBorder: colors.neutral[700],
  inputPlaceholder: colors.neutral[500],
  surfaceVariant: colors.neutral[800],

  // Button colors
  buttonPrimary: colors.primary[400],
  buttonSecondary: colors.secondary[400],

  // Category colors
  categoryActive: colors.primary[400],
  categoryInactive: colors.neutral[400],
  categoryBadge: colors.neutral[800],

  // Expiry colors
  expiryUrgent: colors.error[500],
  expirySoon: colors.warning[500],
  expiryOk: colors.success[500],
  expiryNeutral: colors.neutral[500],
};

export { lightColors, darkColors, Colors };

export const colors = {
  // Primary Colors
  primary: {
    50: '#E8F5E8',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#10b981', // Main primary
    600: '#388E3C',
    700: '#2E7D32',
    800: '#2E672E',
    900: '#1B5E20',
  },

  // Secondary Colors (Energy Orange)
  secondary: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF8F00', // Main secondary
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },

  // Accent Colors (Info Blue)
  accent: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#1976D2', // Main accent
    600: '#1565C0',
    700: '#0D47A1',
    800: '#0A388A',
    900: '#082973',
  },

  // Status Colors
  success: {
    50: '#E8F5E8',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
  },

  warning: {
    50: '#FFF8E1',
    500: '#FF9800',
    600: '#FB8C00',
    700: '#F57C00',
  },

  error: {
    50: '#f3bfc6ff',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
  },

  // Neutral Colors
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    950: '#0A0A0A',
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
  text: colors.neutral[0],
  textPrimary: colors.neutral[900],
  textSecondary: colors.neutral[600],
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

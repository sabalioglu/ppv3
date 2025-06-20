// lib/theme.ts
// Design system and theme configuration
export const colors = {
  // Primary Colors
  primary: {
    50: '#E8F5E8',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#2E7D32', // Main primary
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
    50: '#FFEBEE',
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

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  sm: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Component-specific styles
export const components = {
  button: {
    height: 48,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
  },
  
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    backgroundColor: colors.neutral[0],
    ...shadows.md,
  },
  
  input: {
    height: 48,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[0],
  },
  
  tabBar: {
    height: 80,
    paddingBottom: spacing.sm,
    backgroundColor: colors.neutral[0],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
};

// Animation timings
export const animations = {
  fast: 150,
  normal: 250,
  slow: 350,
};

// Common gradients
export const gradients = {
  primary: [colors.primary[400], colors.primary[600]],
  secondary: [colors.secondary[400], colors.secondary[600]],
  accent: [colors.accent[400], colors.accent[600]],
  health: [colors.primary[300], colors.accent[300]],
  sunset: [colors.secondary[300], colors.error[400]],
};

// Theme interface
export interface Theme {
  colors: {
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
  };
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  shadows: typeof shadows;
  components: typeof components;
  animations: typeof animations;
  gradients: typeof gradients;
}

// Light Theme
export const lightTheme: Theme = {
  colors: {
    // Base colors
    primary: colors.primary[500],
    secondary: colors.secondary[500],
    accent: colors.accent[500],
    background: colors.neutral[50],
    surface: colors.neutral[0],
    error: colors.error[500],
    warning: colors.warning[500],
    success: colors.success[500],
    info: colors.accent[500],
    
    // Text colors
    text: colors.neutral[900],
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
  },
  spacing,
  borderRadius,
  typography,
  shadows,
  components,
  animations,
  gradients,
};

// Dark Theme
export const darkTheme: Theme = {
  colors: {
    // Base colors
    primary: colors.primary[400],
    secondary: colors.secondary[400],
    accent: colors.accent[400],
    background: colors.neutral[950],
    surface: colors.neutral[900],
    error: colors.error[400],
    warning: colors.warning[400],
    success: colors.success[400],
    info: colors.accent[400],
    
    // Text colors
    text: colors.neutral[100],
    textPrimary: colors.neutral[100],
    textSecondary: colors.neutral[400],
    textOnPrimary: colors.neutral[900],
    
    // UI elements
    border: colors.neutral[700],
    borderLight: colors.neutral[800],
    divider: colors.neutral[800],
    
    // Special UI states
    overlay: 'rgba(0, 0, 0, 0.7)',
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
    expiryUrgent: colors.error[400],
    expirySoon: colors.warning[400],
    expiryOk: colors.success[400],
    expiryNeutral: colors.neutral[500],
  },
  spacing,
  borderRadius,
  typography,
  shadows,
  components,
  animations,
  gradients,
};

// Legacy theme export (for backward compatibility)
export const theme = lightTheme;

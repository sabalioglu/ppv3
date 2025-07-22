// constants/Typography.ts
import { Platform } from 'react-native';

export interface TextVariant {
  fontSize: number;
  lineHeight: number;
  fontFamily?: string;
}

export interface FontWeights {
  regular: '400';
  medium: '500';
  semibold: '600';
  bold: '700';
}

export const fontWeights: FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Font families based on platform
export const fontFamilies = {
  ios: {
    regular: 'SF Pro Text',
    medium: 'SF Pro Text',
    semibold: 'SF Pro Text',
    bold: 'SF Pro Display',
  },
  android: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },
  default: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
};

// Get platform-specific font family
export const getFontFamily = (weight: keyof FontWeights = 'regular'): string => {
  if (Platform.OS === 'ios') {
    return fontFamilies.ios[weight];
  } else if (Platform.OS === 'android') {
    return fontFamilies.android[weight];
  }
  return fontFamilies.default[weight];
};

// Typography variants
export const textVariants = {
  // Headers
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: getFontFamily('bold'),
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: getFontFamily('bold'),
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: getFontFamily('semibold'),
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: getFontFamily('semibold'),
  },
  h5: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: getFontFamily('semibold'),
  },
  h6: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: getFontFamily('semibold'),
  },
  
  // Body text
  bodyLarge: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: getFontFamily('regular'),
  },
  bodyRegular: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: getFontFamily('regular'),
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: getFontFamily('regular'),
  },
  
  // Special text
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: getFontFamily('semibold'),
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: getFontFamily('regular'),
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: getFontFamily('medium'),
  },
} as const;

export type TextVariantKey = keyof typeof textVariants;
export type FontWeightKey = keyof FontWeights;

// Header specific styles
export const headerStyles = {
  container: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    ...textVariants.h2,
    color: '#1F2937',
    textAlign: 'center' as const,
  },
  leftAction: {
    position: 'absolute' as const,
    left: 20,
    top: Platform.OS === 'ios' ? 50 : 30,
    zIndex: 1,
  },
  rightAction: {
    position: 'absolute' as const,
    right: 20,
    top: Platform.OS === 'ios' ? 50 : 30,
    zIndex: 1,
  },
};
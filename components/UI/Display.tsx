// components/UI/Display.tsx — Stovd editorial type primitives.
// Display  = Fraunces serif headings (the "cookbook" voice).
// Eyebrow  = small uppercase tracked kicker above titles.
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { fonts } from '@/lib/theme/index';

type DisplaySize = 'xl' | 'lg' | 'md' | 'sm';
type DisplayWeight = 'display' | 'displayMedium' | 'displayBold';

const SIZES: Record<DisplaySize, { fontSize: number; lineHeight: number }> = {
  xl: { fontSize: 30, lineHeight: 34 },
  lg: { fontSize: 25, lineHeight: 29 },
  md: { fontSize: 20, lineHeight: 25 },
  sm: { fontSize: 16, lineHeight: 21 },
};

interface DisplayProps extends TextProps {
  size?: DisplaySize;
  weight?: DisplayWeight;
  color?: string;
}

export function Display({
  size = 'lg',
  weight = 'display',
  color,
  style,
  ...rest
}: DisplayProps) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: fonts[weight], color: color ?? colors.textPrimary },
        SIZES[size],
        styles.display,
        style,
      ]}
    />
  );
}

export function Eyebrow({
  color,
  style,
  ...rest
}: TextProps & { color?: string }) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[styles.eyebrow, { color: color ?? colors.primary }, style]}
    />
  );
}

const styles = StyleSheet.create({
  display: { letterSpacing: -0.4 },
  eyebrow: {
    fontFamily: fonts.bodySemibold,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
});

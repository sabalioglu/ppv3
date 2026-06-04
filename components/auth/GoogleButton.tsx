// components/auth/GoogleButton.tsx — clean social button (surface bg, hairline border).
// White surface, 1px border, serif-free Inter-SemiBold label, "G" brand glyph.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { fonts } from '@/lib/theme/index';
import ThemedText from '@/components/UI/ThemedText';

interface GoogleButtonProps {
  text: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function GoogleButton({
  text,
  onPress,
  disabled = false,
}: GoogleButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: disabled ? 0.6 : pressed ? 0.95 : 1,
        },
      ]}
    >
      <View style={styles.glyph}>
        <ThemedText style={[styles.glyphText, { color: colors.primary }]}>
          G
        </ThemedText>
      </View>
      <ThemedText style={[styles.label, { color: colors.textPrimary }]}>
        {text}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#3C2814',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  glyph: { width: 20, alignItems: 'center', justifyContent: 'center' },
  glyphText: { fontFamily: fonts.bodyBold, fontSize: 17 },
  label: {
    fontFamily: fonts.bodySemibold,
    fontSize: 15,
    letterSpacing: 0.1,
  },
});

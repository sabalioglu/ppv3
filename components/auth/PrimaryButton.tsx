// components/auth/PrimaryButton.tsx — Warm Kitchen terracotta CTA.
// Terracotta fill, Inter-Bold white label, soft terracotta shadow, radius ~18.
import React from 'react';
import { Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { fonts } from '@/lib/theme/index';
import ThemedText from '@/components/UI/ThemedText';

interface PrimaryButtonProps {
  text: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function PrimaryButton({
  text,
  onPress,
  loading = false,
  disabled = false,
}: PrimaryButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
          opacity: disabled ? 0.6 : pressed ? 0.92 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <ThemedText style={styles.label}>{text}</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: '#fff',
    letterSpacing: 0.2,
  },
});

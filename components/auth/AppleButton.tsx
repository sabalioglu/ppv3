// components/auth/AppleButton.tsx — Apple Sign-In button (App Store Guideline 4.8).
// Black surface, white label + Apple glyph, matching GoogleButton geometry.
// iOS-only by convention (callers gate on Platform.OS === 'ios').
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { fonts } from '@/lib/theme/index';
import ThemedText from '@/components/UI/ThemedText';

interface AppleButtonProps {
  text: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function AppleButton({
  text,
  onPress,
  disabled = false,
}: AppleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { opacity: disabled ? 0.6 : pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.glyph}>
        {/* U+F8FF renders the Apple logo on Apple platforms. */}
        <ThemedText style={styles.glyphText}></ThemedText>
      </View>
      <ThemedText style={styles.label}>{text}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 18,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  glyph: { width: 20, alignItems: 'center', justifyContent: 'center' },
  glyphText: { color: '#fff', fontSize: 19, lineHeight: 22 },
  label: {
    color: '#fff',
    fontFamily: fonts.bodySemibold,
    fontSize: 15,
    letterSpacing: 0.1,
  },
});

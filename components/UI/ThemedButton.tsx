import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';

import { radius, spacing, shadows } from '@/lib/theme/index';
import ThemedText, { ThemedTextProps } from '../UI/ThemedText';

type Variant = 'primary' | 'google' | 'bold' | 'switch';

type ButtonProps = {
  text: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: Variant;
  style?: ViewStyle; // ekstra override
};

const ThemedButton = ({
  text,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
}: ButtonProps) => {
  const { colors } = useTheme();
  const variantStyles: Record<
    Variant,
    { button: ViewStyle; text: ThemedTextProps }
  > = {
    primary: {
      button: { ...styles.button, backgroundColor: colors.buttonPrimary },
      text: {
        type: 'body',
        bold: true,
        style: { color: colors.text },
      },
    },
    google: {
      button: {
        ...styles.googleButton,
        ...shadows.md,
        borderColor: colors.border,
        backgroundColor: colors.background,
      },
      text: {
        type: 'body',
        bold: true,
      },
    },
    bold: {
      button: { ...styles.boldButton },
      text: {
        type: 'caption',
        bold: true,
        style: { color: colors.buttonPrimary },
      },
    },
    switch: {
      button: {
        ...styles.switchButton,
      },
      text: {
        type: 'caption',
        style: { color: colors.buttonPrimary },
      },
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <TouchableOpacity
      style={[currentVariant.button, disabled && { opacity: 0.6 }, style]}
      onPress={onPress}
      disabled={disabled}
    >
      {disabled ? (
        <ActivityIndicator color={colors.textOnPrimary} />
      ) : (
        <ThemedText {...currentVariant.text}>{text}</ThemedText>
      )}
    </TouchableOpacity>
  );
};

export default ThemedButton;

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  boldButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  switchButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
});

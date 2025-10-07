import React from 'react';
import { TextInput, StyleSheet, View, TextStyle } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { radius, spacing } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';
import ThemedText from '../UI/ThemedText';

type Props = {
  control: Control<any>;
  name: string;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  style?: TextStyle;
};

const FormInput = ({
  control,
  name,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  style,
}: Props) => {
  const { colors } = useTheme();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={{ marginBottom: spacing.md }}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.textPrimary,
              },
              error && { borderColor: colors.error },
              style,
            ]}
            placeholder={placeholder}
            value={value}
            onChangeText={onChange}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize="none"
            placeholderTextColor={colors.inputPlaceholder}
          />
          {error && (
            <ThemedText
              type="caption"
              style={[styles.error, { color: colors.error }]}
            >
              {error.message}
            </ThemedText>
          )}
        </View>
      )}
    />
  );
};

export default FormInput;

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: 16,
  },
  error: {
    marginLeft: spacing.sm,
  },
});

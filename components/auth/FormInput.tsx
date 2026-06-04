import React, { useState } from 'react';
import { TextInput, StyleSheet, View, TextStyle, Platform } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import { radius, spacing, fonts } from '@/lib/theme/index';
import { useTheme } from '@/contexts/ThemeContext';
import ThemedText from '../UI/ThemedText';

type PickerOption = {
  label: string;
  value: string;
};

type Props = {
  control: Control<any>;
  name: string;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  style?: TextStyle;
  pickerOptions?: readonly PickerOption[];
  /** Optional unit shown as a muted suffix inside the field (e.g. "cm"). */
  unit?: string;
  /** Disable lowercase forcing (names, free text). */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

// On web, strip the native blue focus ring so we can show our own
// terracotta border instead. No-op on native.
const webOutlineReset =
  Platform.OS === 'web'
    ? ({ outlineStyle: 'none' } as unknown as TextStyle)
    : null;

const FormInput = ({
  control,
  name,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  style,
  pickerOptions,
  unit,
  autoCapitalize = 'none',
}: Props) => {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const isPicker = pickerOptions && pickerOptions.length > 0;

  const borderColor = (error?: boolean) =>
    error ? colors.error : focused ? colors.primary : colors.borderLight;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={styles.wrapper}>
          {isPicker ? (
            <View
              style={[
                styles.field,
                {
                  backgroundColor: colors.surface,
                  borderColor: borderColor(!!error),
                },
              ]}
            >
              <Picker
                style={[
                  styles.picker,
                  {
                    color: value ? colors.textPrimary : colors.inputPlaceholder,
                  },
                  webOutlineReset,
                  style,
                ]}
                selectedValue={value}
                onValueChange={onChange}
                dropdownIconColor={colors.textSecondary}
              >
                <Picker.Item label={placeholder ?? 'Select...'} value="" />
                {pickerOptions?.map((opt) => (
                  <Picker.Item
                    key={opt.value}
                    label={opt.label}
                    value={opt.value}
                  />
                ))}
              </Picker>
            </View>
          ) : (
            <View
              style={[
                styles.field,
                {
                  backgroundColor: colors.surface,
                  borderColor: borderColor(!!error),
                },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  { color: colors.textPrimary },
                  webOutlineReset,
                  style,
                ]}
                placeholder={placeholder}
                value={value}
                onChangeText={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                placeholderTextColor={colors.inputPlaceholder}
              />
              {unit ? (
                <ThemedText
                  style={[styles.unit, { color: colors.textSecondary }]}
                >
                  {unit}
                </ThemedText>
              ) : null}
            </View>
          )}
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
  wrapper: { marginBottom: spacing.md },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15.5,
    paddingVertical: 14,
  },
  picker: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 15.5,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: Platform.OS === 'web' ? 14 : undefined,
  },
  unit: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    marginLeft: spacing.sm,
  },
  error: {
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});

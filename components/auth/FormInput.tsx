import React, { ReactNode } from 'react';
import { TextInput, StyleSheet, View, TextStyle } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import { radius, spacing } from '@/lib/theme/index';
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
  keyboardType?: 'default' | 'email-address';
  style?: TextStyle;
  pickerOptions?: readonly PickerOption[];
};

const FormInput = ({
  control,
  name,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  style,
  pickerOptions,
}: Props) => {
  const { colors } = useTheme();
  const isPicker = pickerOptions && pickerOptions.length > 0;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={{ marginBottom: spacing.md }}>
          {isPicker ? (
            <Picker
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: error ? colors.error : colors.inputBorder,
                  color: colors.textPrimary,
                },
                style,
              ]}
              selectedValue={value}
              onValueChange={onChange}
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
          ) : (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: error ? colors.error : colors.inputBorder,
                  color: colors.textPrimary,
                },
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

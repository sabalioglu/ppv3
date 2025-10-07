import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useCustomAlert } from '@/hooks/useCustomAlert';
import { useTheme } from '@/contexts/ThemeContext';

import CustomAlert from '@/components/UI/CustomAlert';
import ThemedButton from '@/components/UI/ThemedButton';
import FormInput from '@/components/auth/FormInput';
import AuthLayout from '@/components/auth/AuthLayout';
import ThemedText from '@/components/UI/ThemedText';
import { spacing } from '@/lib/theme';

// ✅ validation schema
const schema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match",
  });

type FormFields = z.infer<typeof schema>;

const ResetConfirmPassword = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();

  const { control, handleSubmit } = useForm<FormFields>({
    defaultValues: { password: '', confirmPassword: '' },
    resolver: zodResolver(schema),
  });

  const { visible, title, message, buttons, showAlert, hideAlert } =
    useCustomAlert();

  const handleResetPasswordConfirm = async (values: FormFields) => {
    try {
      setIsLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) throw error;

      showAlert(
        'Password Updated ✅',
        'Your password has been reset successfully. You can now log in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="refresh-outline" size={64} color={colors.primary} />
          <ThemedText type="heading" bold style={[styles.title]}>
            Set New Password
          </ThemedText>
          <ThemedText type="subheading" style={styles.subtitle}>
            Please enter and confirm your new password below
          </ThemedText>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <FormInput
            control={control}
            name="password"
            placeholder="New Password"
            secureTextEntry
          />
          <FormInput
            control={control}
            name="confirmPassword"
            placeholder="Confirm Password"
            secureTextEntry
          />
          <ThemedButton
            text="Reset Password"
            onPress={handleSubmit(handleResetPasswordConfirm)}
            disabled={isLoading}
          />
        </View>
        <CustomAlert
          visible={visible}
          title={title}
          message={message}
          buttons={buttons}
          onClose={hideAlert}
        />
      </View>
    </AuthLayout>
  );
};

export default ResetConfirmPassword;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  title: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
});

import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { makeRedirectUri } from 'expo-auth-session';

import { useTheme } from '@/contexts/ThemeContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/UI/CustomAlert';
import FormInput from '@/components/auth/FormInput';
import AuthLayout from '@/components/auth/AuthLayout';
import ThemedText from '@/components/UI/ThemedText';
import ThemedButton from '@/components/UI/ThemedButton';
import { spacing } from '@/lib/theme';

const schema = z.object({
  email: z.string().email('Email required'),
});

type FormFields = z.infer<typeof schema>;

const ResetPassword = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();

  const { control, handleSubmit } = useForm<FormFields>({
    defaultValues: { email: '' },
    resolver: zodResolver(schema),
  });

  const { visible, title, message, buttons, showAlert, hideAlert } =
    useCustomAlert();

  const handleResetPassword = async (values: FormFields) => {
    try {
      setIsLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(
        values.email,
        {
          redirectTo: makeRedirectUri({
            path: 'reset-confirm-password',
          }),
        }
      );

      if (error) throw error;

      showAlert(
        'Check your email! 📧',
        'We have sent you a password reset link. Please check your email inbox.'
      );
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <View style={styles.content}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Ionicons
            name="lock-closed-outline"
            size={64}
            color={colors.primary}
          />
          <ThemedText type="heading" bold style={[styles.title]}>
            Reset Password
          </ThemedText>
          <ThemedText type="subheading" style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your
            password
          </ThemedText>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <FormInput
            control={control}
            name="email"
            placeholder="Email"
            keyboardType="email-address"
          />
          <ThemedButton
            text="Send Reset Link"
            onPress={handleSubmit(handleResetPassword)}
            disabled={isLoading}
          />
        </View>

        {/* Back to Login Link */}
        <View style={styles.footer}>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            Remember your password?{' '}
          </ThemedText>
          <ThemedButton
            variant="bold"
            onPress={() => router.replace('/login')}
            text="Sign In"
            style={{ marginBottom: 0, marginLeft: spacing.xs }}
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

export default ResetPassword;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    zIndex: 1,
    padding: spacing.sm,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
});

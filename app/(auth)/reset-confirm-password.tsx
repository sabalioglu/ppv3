import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ShieldCheck } from 'lucide-react-native';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useCustomAlert } from '@/hooks/useCustomAlert';
import { useTheme } from '@/contexts/ThemeContext';

import CustomAlert from '@/components/UI/CustomAlert';
import FormInput from '@/components/auth/FormInput';
import AuthLayout from '@/components/auth/AuthLayout';
import { Display, Eyebrow } from '@/components/UI/Display';
import PrimaryButton from '@/components/auth/PrimaryButton';
import { spacing } from '@/lib/theme/index';
import { t } from '@/lib/i18n';

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
        t('auth.passwordUpdatedTitle'),
        t('auth.passwordUpdatedMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => router.replace('/login'),
          },
        ],
      );
    } catch (error: any) {
      showAlert(
        t('common.error'),
        error.message || t('auth.updatePasswordFailed'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <View style={styles.content}>
        {/* Header */}
        <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
          <ShieldCheck size={24} color="#fff" />
        </View>
        <Eyebrow style={styles.eyebrow}>{t('auth.newPasswordEyebrow')}</Eyebrow>
        <Display size="xl" style={styles.title}>
          {t('auth.newPasswordTitle')}
        </Display>
        <Display
          size="sm"
          weight="displayMedium"
          color={colors.textSecondary}
          style={styles.lede}
        >
          {t('auth.newPasswordLede')}
        </Display>

        {/* Form */}
        <View style={styles.form}>
          <FormInput
            control={control}
            name="password"
            placeholder={t('auth.newPasswordPlaceholder')}
            secureTextEntry
          />
          <FormInput
            control={control}
            name="confirmPassword"
            placeholder={t('auth.confirmNewPasswordPlaceholder')}
            secureTextEntry
          />
          <PrimaryButton
            text={t('auth.updatePassword')}
            onPress={handleSubmit(handleResetPasswordConfirm)}
            loading={isLoading}
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
    paddingVertical: spacing.xl,
    justifyContent: 'center',
  },
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#C8472B',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  eyebrow: { marginBottom: spacing.sm },
  title: { marginBottom: spacing.sm },
  lede: { marginBottom: spacing.xl },
  form: { width: '100%' },
});

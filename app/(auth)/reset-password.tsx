import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, KeyRound } from 'lucide-react-native';
import z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { makeRedirectUri } from 'expo-auth-session';

import { useTheme } from '@/contexts/ThemeContext';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from '@/components/UI/CustomAlert';
import FormInput from '@/components/auth/FormInput';
import AuthLayout from '@/components/auth/AuthLayout';
import { Display, Eyebrow } from '@/components/UI/Display';
import PrimaryButton from '@/components/auth/PrimaryButton';
import { spacing } from '@/lib/theme/index';
import { t } from '@/lib/i18n';

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
        },
      );

      if (error) throw error;

      showAlert(t('auth.resetSentTitle'), t('auth.resetSentMessage'));
    } catch (error: any) {
      showAlert(t('common.error'), error.message || t('auth.resetFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <View style={styles.content}>
        {/* Back Button */}
        <Pressable
          style={[styles.backButton, { borderColor: colors.border }]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>

        {/* Header */}
        <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
          <KeyRound size={24} color="#fff" />
        </View>
        <Eyebrow style={styles.eyebrow}>{t('auth.resetEyebrow')}</Eyebrow>
        <Display size="xl" style={styles.title}>
          {t('auth.resetTitle')}
        </Display>
        <Display
          size="sm"
          weight="displayMedium"
          color={colors.textSecondary}
          style={styles.lede}
        >
          {t('auth.resetLede')}
        </Display>

        {/* Form */}
        <View style={styles.form}>
          <FormInput
            control={control}
            name="email"
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
          />
          <PrimaryButton
            text={t('auth.sendResetLink')}
            onPress={handleSubmit(handleResetPassword)}
            loading={isLoading}
            disabled={isLoading}
          />
        </View>

        {/* Back to Login Link */}
        <Pressable
          onPress={() => router.replace('/login')}
          hitSlop={8}
          style={styles.footer}
        >
          <Display
            size="sm"
            weight="displayMedium"
            color={colors.textSecondary}
          >
            {t('auth.rememberedPassword')}
          </Display>
          <Display size="sm" weight="displayBold" color={colors.primary}>
            {t('auth.signInLink')}
          </Display>
        </Pressable>

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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});

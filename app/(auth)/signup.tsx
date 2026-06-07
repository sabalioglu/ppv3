import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChefHat } from 'lucide-react-native';

import { supabase } from '../../lib/supabase';
import { useCustomAlert } from '@/hooks/useCustomAlert';

import FormInput from '../../components/auth/FormInput';
import Divider from '@/components/auth/Divider';
import ErrorCard from '@/components/UI/ErrorCard';
import CustomAlert from '@/components/UI/CustomAlert';
import { Display, Eyebrow } from '@/components/UI/Display';
import GoogleButton from '@/components/auth/GoogleButton';
import AppleButton from '@/components/auth/AppleButton';
import PrimaryButton from '@/components/auth/PrimaryButton';
import AuthLayout from '@/components/auth/AuthLayout';

import { useTheme } from '@/contexts/ThemeContext';
import { spacing } from '@/lib/theme/index';
import { t } from '@/lib/i18n';

const schema = z
  .object({
    email: z.string().email('Email required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(30),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password must be match',
    path: ['confirmPassword'],
  });

type FormFields = z.infer<typeof schema>;

const SignUpPage = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<FormFields>({
    defaultValues: { email: '', password: '', confirmPassword: '' },
    resolver: zodResolver(schema),
  });

  const { visible, title, message, buttons, showAlert, hideAlert } =
    useCustomAlert();

  const handleSignUp = async (values: FormFields) => {
    setErrorMessage(null);

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: makeRedirectUri({
            path: 'email-confirmed',
          }),
        },
      });

      if (error) throw error;

      // Email confirmation check
      if (data?.user && !data.session) {
        showAlert(t('auth.checkEmailTitle'), t('auth.checkEmailMessage'));
      }
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMessage(null);
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: makeRedirectUri() },
      });
      if (error) throw error;
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // App Store Guideline 4.8: offer Apple sign-in alongside Google (iOS).
  const handleAppleSignUp = async () => {
    setErrorMessage(null);
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: makeRedirectUri() },
      });
      if (error) throw error;
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectToSignIn = () => {
    router.push('/login');
  };

  return (
    <AuthLayout>
      <View style={styles.content}>
        <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
          <ChefHat size={26} color="#fff" />
        </View>
        <Eyebrow style={styles.eyebrow}>{t('auth.signupEyebrow')}</Eyebrow>
        <Display size="xl" style={styles.title}>
          {t('auth.signupTitle')}
        </Display>
        <Display
          size="sm"
          weight="displayMedium"
          color={colors.textSecondary}
          style={styles.lede}
        >
          {t('auth.signupLede')}
        </Display>

        <View style={styles.form}>
          <FormInput
            control={control}
            name="email"
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
          />
          <FormInput
            control={control}
            name="password"
            placeholder={t('auth.passwordPlaceholder')}
            secureTextEntry
          />
          <FormInput
            control={control}
            name="confirmPassword"
            placeholder={t('auth.confirmPasswordPlaceholder')}
            secureTextEntry
          />

          <PrimaryButton
            text={t('auth.signUp')}
            onPress={handleSubmit(handleSignUp)}
            loading={loading}
            disabled={loading}
          />

          <Divider />

          <GoogleButton
            text={t('auth.continueWithGoogle')}
            onPress={handleGoogleSignUp}
            disabled={loading}
          />

          {Platform.OS === 'ios' && (
            <View style={styles.appleSpacer}>
              <AppleButton
                text={t('auth.continueWithApple')}
                onPress={handleAppleSignUp}
                disabled={loading}
              />
            </View>
          )}

          {errorMessage && <ErrorCard message={errorMessage} />}
        </View>

        <Pressable
          onPress={handleRedirectToSignIn}
          hitSlop={8}
          style={styles.switch}
        >
          <Display
            size="sm"
            weight="displayMedium"
            color={colors.textSecondary}
          >
            {t('auth.haveAccount')}
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
export default SignUpPage;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
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
  appleSpacer: { marginTop: spacing.sm },
  title: { marginBottom: spacing.sm },
  lede: { marginBottom: spacing.xl },
  form: { gap: 0 },
  switch: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});

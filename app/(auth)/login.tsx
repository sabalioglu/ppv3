import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { makeRedirectUri } from 'expo-auth-session';
import { ChefHat } from 'lucide-react-native';

import FormInput from '@/components/auth/FormInput';
import Divider from '@/components/auth/Divider';
import ErrorCard from '@/components/UI/ErrorCard';
import AuthLayout from '@/components/auth/AuthLayout';
import CustomAlert from '@/components/UI/CustomAlert';
import { Display, Eyebrow } from '@/components/UI/Display';
import GoogleButton from '@/components/auth/GoogleButton';
import AppleButton from '@/components/auth/AppleButton';
import PrimaryButton from '@/components/auth/PrimaryButton';

import { useCustomAlert } from '@/hooks/useCustomAlert';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing } from '@/lib/theme/index';
import { t } from '@/lib/i18n';

const schema = z.object({
  email: z.string().email('Email required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(30),
});

type FormFields = z.infer<typeof schema>;

const LoginPage = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<FormFields>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(schema),
  });

  const { visible, title, message, buttons, showAlert, hideAlert } =
    useCustomAlert();

  const handleAuth = async (values: FormFields) => {
    setErrorMessage(null);
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          showAlert(
            t('auth.emailNotConfirmedTitle'),
            t('auth.emailNotConfirmedMessage'),
            [
              {
                text: t('auth.resendEmail'),
                onPress: async () => {
                  const { error: resendError } = await supabase.auth.resend({
                    type: 'signup',
                    email: values.email,
                  });
                  if (!resendError) {
                    showAlert(
                      t('auth.emailSentTitle'),
                      t('auth.emailSentMessage'),
                    );
                  }
                },
              },
              { text: t('common.cancel'), onPress: hideAlert },
            ],
          );
          return;
        }
        throw error;
      }
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
  const handleAppleSignIn = async () => {
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

  const handleRedirectToSignUp = () => {
    router.replace('/signup');
  };

  const handleForgotPassword = () => {
    router.replace('/reset-password');
  };

  return (
    <AuthLayout>
      <View style={styles.content}>
        <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
          <ChefHat size={26} color="#fff" />
        </View>
        <Eyebrow style={styles.eyebrow}>{t('auth.loginEyebrow')}</Eyebrow>
        <Display size="xl" style={styles.title}>
          {t('auth.loginTitle')}
        </Display>
        <Display
          size="sm"
          weight="displayMedium"
          color={colors.textSecondary}
          style={styles.lede}
        >
          {t('auth.loginLede')}
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

          <Pressable
            onPress={handleForgotPassword}
            hitSlop={8}
            style={styles.forgot}
          >
            <Eyebrow color={colors.primary} style={styles.linkText}>
              {t('auth.forgotPassword')}
            </Eyebrow>
          </Pressable>

          <PrimaryButton
            text={t('auth.signIn')}
            onPress={handleSubmit(handleAuth)}
            loading={loading}
            disabled={loading}
          />

          <Divider />

          <GoogleButton
            text={t('auth.continueWithGoogle')}
            onPress={handleGoogleSignIn}
            disabled={loading}
          />

          <View style={styles.appleSpacer}>
            <AppleButton
              text={t('auth.continueWithApple')}
              onPress={handleAppleSignIn}
              disabled={loading}
            />
          </View>

          {errorMessage && <ErrorCard message={errorMessage} />}
        </View>

        <Pressable
          onPress={handleRedirectToSignUp}
          hitSlop={8}
          style={styles.switch}
        >
          <Display
            size="sm"
            weight="displayMedium"
            color={colors.textSecondary}
          >
            {t('auth.noAccount')}
          </Display>
          <Display size="sm" weight="displayBold" color={colors.primary}>
            {t('auth.signUpLink')}
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

export default LoginPage;

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
  forgot: { alignSelf: 'flex-end', marginBottom: spacing.lg, marginTop: -4 },
  linkText: { letterSpacing: 0.3, textTransform: 'none', fontSize: 12.5 },
  switch: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
});

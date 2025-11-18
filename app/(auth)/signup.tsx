import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { supabase } from '../../lib/supabase';
import { useCustomAlert } from '@/hooks/useCustomAlert';

import FormInput from '../../components/auth/FormInput';
import Divider from '@/components/auth/Divider';
import ErrorCard from '@/components/UI/ErrorCard';
import CustomAlert from '@/components/UI/CustomAlert';
import ThemedButton from '@/components/UI/ThemedButton';
import ThemedText from '@/components/UI/ThemedText';
import AuthLayout from '@/components/auth/AuthLayout';
import { spacing } from '@/lib/theme';

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
        showAlert(
          'Check Your Email! 📧',
          'We sent you a confirmation link. Please check your email to activate your account.'
        );
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

  const handleRedirectToSignIn = () => {
    router.push('/login');
  };

  return (
    <AuthLayout>
      <View style={styles.content}>
        <ThemedText type="heading" bold={true} style={styles.title}>
          🍽️ AI Food Pantry
        </ThemedText>
        <ThemedText type="subheading" style={styles.subtitle}>
          Create Account
        </ThemedText>
        <FormInput
          control={control}
          name="email"
          placeholder="Email"
          keyboardType="email-address"
        />
        <FormInput
          control={control}
          name="password"
          placeholder="Password"
          secureTextEntry
        />
        <FormInput
          control={control}
          name="confirmPassword"
          placeholder="Confirm Password"
          secureTextEntry
        />
        <ThemedButton
          onPress={handleSubmit(handleSignUp)}
          disabled={loading}
          text="Sign Up"
        />
        <Divider />
        <ThemedButton
          variant="google"
          onPress={handleGoogleSignUp}
          disabled={loading}
          text="Continue with Google"
        />
        {errorMessage && <ErrorCard message={errorMessage} />}
        <ThemedButton
          variant="switch"
          onPress={handleRedirectToSignIn}
          text="Already have an account? Sign In"
        />
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
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});

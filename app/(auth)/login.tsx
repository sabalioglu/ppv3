import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/lib/supabase';
import { makeRedirectUri } from 'expo-auth-session';

import FormInput from '@/components/auth/FormInput';
import ThemedButton from '@/components/UI/ThemedButton';
import Divider from '@/components/auth/Divider';
import ErrorCard from '@/components/UI/ErrorCard';
import AuthLayout from '@/components/auth/AuthLayout';
import ThemedText from '@/components/UI/ThemedText';
import CustomAlert from '@/components/UI/CustomAlert';

import { useCustomAlert } from '@/hooks/useCustomAlert';
import { spacing } from '@/lib/theme';

const schema = z.object({
  email: z.string().email('Email required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(30),
});

type FormFields = z.infer<typeof schema>;

const LoginPage = () => {
  const router = useRouter();
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
            'Email Not Confirmed',
            'Please check your email and click the confirmation link before signing in.',
            [
              {
                text: 'Resend Email',
                onPress: async () => {
                  const { error: resendError } = await supabase.auth.resend({
                    type: 'signup',
                    email: values.email,
                  });
                  if (!resendError) {
                    showAlert(
                      'Email Sent',
                      'Confirmation email has been resent.'
                    );
                  }
                },
              },
              { text: 'Cancel', onPress: hideAlert },
            ]
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

  const handleRedirectToSignUp = () => {
    router.replace('/signup');
  };

  const handleForgotPassword = () => {
    router.replace('/reset-password');
  };

  return (
    <AuthLayout>
      <View style={styles.content}>
        <ThemedText type="heading" bold={true} style={styles.title}>
          🍽️ AI Food Pantry
        </ThemedText>
        <ThemedText type="subheading" style={styles.subtitle}>
          Welcome Back
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
        <ThemedButton
          variant="bold"
          onPress={handleForgotPassword}
          text="Forgot Password?"
        />
        <ThemedButton
          onPress={handleSubmit(handleAuth)}
          disabled={loading}
          text="Sign In"
        />
        <Divider />
        <ThemedButton
          variant="google"
          onPress={handleGoogleSignIn}
          disabled={loading}
          text="Continue with Google"
        />
        {errorMessage && <ErrorCard message={errorMessage} />}
        <ThemedButton
          variant="switch"
          onPress={handleRedirectToSignUp}
          text="Need an account? Sign Up"
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

export default LoginPage;

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

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();

  const handleAuth = async () => {
    // Simple validation
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUpMode && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);

      if (isSignUpMode) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        Alert.alert(
          '📧 Check Your Email!',
          'We\'ve sent you a verification email. Please verify your account before signing in.',
          [{
            text: 'OK',
            onPress: () => {
              setIsSignUpMode(false);
              setPassword('');
            }
          }]
        );
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Handle email not confirmed error
          if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
            Alert.alert(
              'Email Not Verified',
              'Please check your email and click the verification link before signing in.',
              [
                {
                  text: 'Resend Email',
                  onPress: async () => {
                    try {
                      const { error: resendError } = await supabase.auth.resend({
                        type: 'signup',
                        email: email,
                      });
                      
                      if (resendError) {
                        Alert.alert('Error', 'Failed to resend verification email. Please try again.');
                      } else {
                        Alert.alert('Email Sent', 'Verification email has been resent. Please check your inbox.');
                      }
                    } catch (resendErr) {
                      Alert.alert('Error', 'Failed to resend verification email. Please try again.');
                    }
                  }
                },
                { text: 'OK', style: 'cancel' }
              ]
            );
            return;
          }
          
          throw error;
        }

        // Success - AuthWrapper will handle navigation
        console.log('✅ Login successful');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert(
        'Error',
        error.message || 'An error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Platform.OS === 'web' 
            ? `${window.location.origin}/(auth)/callback`
            : 'aifoodpantry://auth/callback',
        }
      });

      if (error) throw error;

      // Web will redirect, mobile needs to wait for auth state change
      if (Platform.OS !== 'web') {
        console.log('✅ OAuth initiated, waiting for callback...');
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo/Header */}
        <View style={styles.header}>
          <Ionicons name="nutrition" size={80} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>
            AI Food Pantry
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {isSignUpMode ? 'Create your account' : 'Welcome back!'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={theme.colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Email"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={theme.colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder={isSignUpMode ? "Password (min 6 characters)" : "Password"}
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          {!isSignUpMode && (
            <View style={styles.forgotPasswordContainer}>
              <Link href="/(auth)/reset-password" asChild>
                <TouchableOpacity>
                  <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}

          {/* Auth Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUpMode ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>
              OR
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Image
              source={{ uri: 'https://www.google.com/favicon.ico' }}
              style={styles.socialIcon}
            />
            <Text style={[styles.socialButtonText, { color: theme.colors.text }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Toggle Sign Up/Sign In */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              {isSignUpMode ? 'Already have an account?' : "Don't have an account?"}{' '}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsSignUpMode(!isSignUpMode);
                setPassword('');
              }}
            >
              <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                {isSignUpMode ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 24,
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
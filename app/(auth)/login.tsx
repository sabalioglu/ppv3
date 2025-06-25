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
import { signIn, signInWithOAuth, supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();

  const handleEmailAuth = async () => {
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
        // Sign up flow
        console.log('📝 [Login] Starting sign up process...');
        console.log('⏰ [Login] Sign up start time:', new Date().toISOString());
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        console.log('📋 [Login] Sign up result:', {
          success: !!authData.user,
          error: authError?.message || null,
          userId: authData.user?.id
        });

        if (authError) throw authError;

        if (authData.user) {
          Alert.alert(
            '📧 Check Your Email!',
            'We\'ve sent you a verification email. Please verify your account before signing in.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setIsSignUpMode(false);
                  setPassword('');
                }
              }
            ]
          );
        }
      } else {
        // Sign in flow
        console.log('🔐 [Login] Starting sign in process...');
        console.log('⏰ [Login] Sign in start time:', new Date().toISOString());
        
        const { data, error } = await signIn(email, password);
        
        console.log('📋 [Login] Sign in result:', {
          success: !!data.session,
          error: error?.message || null,
          sessionId: data.session?.access_token ? 'Present' : 'Missing',
          userId: data.session?.user?.id,
          userEmail: data.session?.user?.email
        });

        if (error) {
          // Email not confirmed hatası kontrolü
          if (error.message.includes('Email not confirmed') ||
              error.message.includes('email_not_confirmed') ||
              error.message.includes('User account has not been verified')) {
            Alert.alert(
              'Email Not Verified',
              'Please check your email and click the verification link first.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert('Error', error.message);
          }
        } else {
          console.log('✅ [Login] Login successful');
          console.log('⏰ [Login] Before delay:', new Date().toISOString());
          
          // SESSION'IN HAZIR OLMASINI BEKLE
          await new Promise(resolve => setTimeout(resolve, 100));
          
          console.log('⏰ [Login] After delay, before refresh:', new Date().toISOString());
          
          // Session'ı manuel refresh et
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          console.log('📋 [Login] Refresh result:', {
            success: !refreshError,
            error: refreshError?.message || null
          });
          
          if (!refreshError) {
            console.log('✅ [Login] Session refreshed after login');
          }
          
          console.log('⏰ [Login] Login process complete:', new Date().toISOString());
          
          // Verify session exists
          const { data: { session } } = await supabase.auth.getSession();
          console.log('🔍 [Login] Final session check:', {
            hasSession: !!session,
            userId: session?.user?.id,
            email: session?.user?.email
          });
          
          // Navigation will be handled by AuthWrapper
        }
      }
    } catch (error: any) {
      console.error('❌ [Login] Auth error:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      console.log('🏁 [Login] Process finished, loading set to false');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 [Login] Starting Google Sign In...');
      console.log('📱 [Login] Platform:', Platform.OS);
      console.log('⏰ [Login] Google sign in start:', new Date().toISOString());

      const { data, error } = await signInWithOAuth('google');

      console.log('📋 [Login] Google sign in result:', {
        success: !!data,
        error: error?.message || null
      });

      if (error) {
        console.error('❌ [Login] Sign in error:', error);
        Alert.alert('Sign In Error', error.message || 'Failed to sign in with Google');
      } else {
        console.log('✅ [Login] Sign in initiated successfully');
        // Navigation will be handled by AuthWrapper after callback
      }
    } catch (error: any) {
      console.error('❌ [Login] Unexpected error:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
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
            {isSignUpMode ? 'Create your account to get started' : 'Welcome back! Sign in to continue'}
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

          {/* Forgot Password Link (only for sign in) */}
          {!isSignUpMode && (
            <Link href="/(auth)/reset-password" asChild>
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </Link>
          )}

          {/* Auth Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleEmailAuth}
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

          {/* Terms Text (only for sign up) */}
          {isSignUpMode && (
            <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Text>
          )}

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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
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
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 16,
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
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// app/(auth)/login.tsx - Fixed Version with Debug

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, signInWithGoogle } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    // Debug Environment Check
    console.log('🔍 Environment Check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      windowLocation: typeof window !== 'undefined' ? window.location.origin : 'undefined',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'undefined',
      platform: Platform.OS,
      isSignUpMode
    });

    if (!email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    
    if (isSignUpMode && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // Environment validation
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase environment variables');
      Alert.alert('Configuration Error', 'App configuration is missing. Please contact support.');
      return;
    }

    setLoading(true);
    
    try {
      if (isSignUpMode) {
        console.log('🚀 Starting sign up process...');
        
        // Prepare sign up options with safe redirect URL
        const signUpOptions: any = {
          email,
          password,
        };

        // Add email redirect only if we're in a web environment
        if (typeof window !== 'undefined' && window.location) {
          signUpOptions.options = {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              email_confirm: true
            }
          };
          console.log('📧 Email redirect URL:', signUpOptions.options.emailRedirectTo);
        } else {
          console.log('📱 Mobile environment detected, skipping email redirect');
        }

        const { data, error } = await supabase.auth.signUp(signUpOptions);
        
        console.log('📊 Sign up response:', { 
          user: data?.user?.id, 
          session: !!data?.session,
          error: error?.message 
        });

        if (error) {
          console.error('❌ Sign up error:', error);
          
          // Handle specific error types
          if (error.message.includes('confirmation email')) {
            Alert.alert(
              'Email Service Issue',
              'There was a problem sending the confirmation email. Your account may have been created. Please try signing in, or contact support if the problem persists.',
              [
                { text: 'Try Sign In', onPress: () => setIsSignUpMode(false) },
                { text: 'OK' }
              ]
            );
          } else if (error.message.includes('already registered')) {
            Alert.alert(
              'Account Exists',
              'An account with this email already exists. Please sign in instead.',
              [{ text: 'Sign In', onPress: () => setIsSignUpMode(false) }]
            );
          } else {
            throw error;
          }
          return;
        }
        
        // Success message
        Alert.alert(
          '📧 Check Your Email!',
          'We\'ve sent you a verification email. Please verify your account before signing in.',
          [{ text: 'OK', onPress: () => setIsSignUpMode(false) }]
        );

      } else {
        console.log('🔑 Starting sign in process...');
        
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        console.log('📊 Sign in response:', { 
          user: data?.user?.id, 
          session: !!data?.session,
          error: error?.message 
        });

        if (error) {
          console.error('❌ Sign in error:', error);
          
          if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
            Alert.alert(
              'Email Not Verified',
              'Please check your email and click the verification link.',
              [
                {
                  text: 'Resend Email',
                  onPress: async () => {
                    try {
                      console.log('📧 Resending verification email...');
                      const { error: resendError } = await supabase.auth.resend({
                        type: 'signup',
                        email: email,
                      });
                      
                      if (resendError) {
                        console.error('❌ Resend error:', resendError);
                        Alert.alert('Error', 'Failed to resend verification email.');
                      } else {
                        console.log('✅ Verification email resent');
                        Alert.alert('Email Sent', 'Verification email has been resent.');
                      }
                    } catch (resendErr) {
                      console.error('❌ Resend unexpected error:', resendErr);
                      Alert.alert('Error', 'Failed to resend verification email.');
                    }
                  },
                },
                { text: 'OK', style: 'cancel' },
              ]
            );
            return;
          } else if (error.message.includes('Invalid login credentials')) {
            Alert.alert('Invalid Credentials', 'Please check your email and password.');
            return;
          }
          
          throw error;
        }

        console.log('✅ Login successful, navigating to main app...');
        router.replace('/(tabs)');
      }
      
    } catch (error: any) {
      console.error('❌ Auth unexpected error:', error);
      
      // Generic error handling
      const errorMessage = error?.message || 'Authentication failed';
      Alert.alert(
        'Authentication Error', 
        errorMessage.includes('fetch') 
          ? 'Network error. Please check your internet connection.' 
          : errorMessage
      );
      
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('🔍 Google Sign In Environment Check:', {
      platform: Platform.OS,
      hasWindow: typeof window !== 'undefined'
    });

    setGoogleLoading(true);
    try {
      console.log('🔐 Starting Google OAuth...');
      
      // lib/supabase.ts'deki helper fonksiyonunu kullan
      const { data, error } = await signInWithGoogle();

      console.log('📊 Google OAuth response:', { 
        data: !!data, 
        error: error?.message 
      });

      if (error) {
        console.error('❌ Google OAuth error:', error);
        throw error;
      }
      
      console.log('✅ Google OAuth initiated successfully');
      
      // Web'de otomatik redirect olur, mobile'da WebBrowser handling zaten yapılmış
      // TabsLayout auth guard navigation'ı handle edecek
      
    } catch (error: any) {
      console.error('❌ Google OAuth unexpected error:', error);
      Alert.alert(
        'Google Sign In Failed', 
        error.message || 'Failed to sign in with Google. Please try again.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>🍽 AI Food Pantry</Text>
          <Text style={styles.subtitle}>
            {isSignUpMode ? 'Create your account' : 'Welcome back!'}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading && !googleLoading}
          />

          <TextInput
            style={styles.input}
            placeholder={isSignUpMode ? "Password (min 6 characters)" : "Password"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading && !googleLoading}
          />

          {/* Email confirmation info note - only in signup mode */}
          {isSignUpMode && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoNote}>
                📧 After creating your account, please check your email for verification.
              </Text>
              <Text style={styles.infoSubNote}>
                Check your spam folder if you don't see the email within a few minutes.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, (loading || googleLoading) && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading || googleLoading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUpMode ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[styles.socialButton, (loading || googleLoading) && styles.buttonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#1f2937" />
            ) : (
              <>
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isSignUpMode ? 'Already have an account?' : "Don't have an account? "}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIsSignUpMode(!isSignUpMode);
                setPassword('');
              }}
              disabled={loading || googleLoading}
            >
              <Text style={[styles.linkText, (loading || googleLoading) && styles.linkTextDisabled]}>
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
    backgroundColor: '#f8fafc',
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
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    color: '#6b7280',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: 'white',
    marginBottom: 16,
  },
  infoContainer: {
    marginBottom: 16,
    marginTop: 4,
    paddingHorizontal: 12,
  },
  infoNote: {
    fontSize: 13,
    color: '#059669',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  infoSubNote: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  button: {
    backgroundColor: '#10b981',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6b7280',
  },
  socialButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 50,
  },
  googleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  socialButtonText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  linkTextDisabled: {
    color: '#9ca3af',
  },
});

// app/(auth)/login.tsx - Complete Updated Version

import React, { useState, useEffect } from 'react';
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
  const [envError, setEnvError] = useState<string | null>(null);
  const router = useRouter();

  // Environment validation on component mount
  useEffect(() => {
    const validateEnvironment = () => {
      // 🧪 KESIN TEST KODU
      console.log('🧪 ENVIRONMENT TEST:');
      console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
      console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
      console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
        const errorMsg = 'App configuration error. Please contact support.';
        setEnvError(errorMsg);
        console.error('❌ Missing Supabase environment variables');
        return false;
      }
      
      console.log('✅ Environment variables validated');
      return true;
    };

    validateEnvironment();
  }, []);

  // Show error if environment is not configured
  if (envError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Configuration Error</Text>
          <Text style={styles.errorText}>
            The app is not properly configured. Please contact support.
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => setEnvError(null)}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleAuth = async () => {
    // 🔍 Debug Environment Check (Updated with EXPO_PUBLIC_)
    console.log('🔍 Environment Check:', {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
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

    setLoading(true);
    
    try {
      if (isSignUpMode) {
        console.log('🚀 Starting sign up process...');
        
        // 🔧 Fixed: Proper emailRedirectTo configuration
        const redirectUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/(auth)/email-confirmed`
          : 'aifoodpantry://auth/email-confirmed'; // Mobile deep link
        
        console.log('📧 Sign up with redirect URL:', redirectUrl);
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              email_confirm: true
            }
          }
        });
        
        console.log('📊 Sign up response:', { 
          user: data.user?.id, 
          session: !!data.session, 
          error: error?.message 
        });
        
        if (error) {
          console.error('❌ Sign up error:', error);
          
          // Handle specific error types
          if (error.message.includes('User already registered')) {
            Alert.alert(
              'Account Exists',
              'An account with this email already exists. Please sign in instead.',
              [
                { text: 'Switch to Sign In', onPress: () => setIsSignUpMode(false) },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
            return;
          }
          
          if (error.message.includes('confirmation email')) {
            Alert.alert(
              'Email Service Issue',
              'There was a problem sending the confirmation email. Please try again in a few minutes.',
              [{ text: 'OK' }]
            );
            return;
          }
          
          throw error;
        }
        
        // Success message
        Alert.alert(
          '📧 Check Your Email!',
          'We\'ve sent you a verification email. Please check your inbox and click the verification link to activate your account.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                setIsSignUpMode(false);
                setEmail('');
                setPassword('');
              }
            }
          ]
        );
        
      } else {
        console.log('🔑 Starting sign in process...');
        
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        console.log('📊 Sign in response:', { 
          user: data.user?.id, 
          session: !!data.session, 
          error: error?.message 
        });
        
        if (error) {
          console.error('❌ Sign in error:', error);
          
          // Handle specific error types
          if (error.message.includes('Email not confirmed')) {
            Alert.alert(
              'Email Not Verified',
              'Please check your email and click the verification link to activate your account.',
              [
                {
                  text: 'Resend Verification',
                  onPress: async () => {
                    try {
                      const redirectUrl = typeof window !== 'undefined' 
                        ? `${window.location.origin}/(auth)/email-confirmed`
                        : 'aifoodpantry://auth/email-confirmed';
                        
                      const { error: resendError } = await supabase.auth.resend({
                        type: 'signup',
                        email: email,
                        options: {
                          emailRedirectTo: redirectUrl
                        }
                      });
                      
                      if (resendError) {
                        console.error('❌ Resend error:', resendError);
                        Alert.alert('Error', 'Failed to resend verification email. Please try again.');
                      } else {
                        console.log('✅ Verification email resent');
                        Alert.alert('Email Sent', 'Verification email has been resent. Please check your inbox.');
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
          }
          
          if (error.message.includes('Invalid login credentials')) {
            Alert.alert('Login Failed', 'Invalid email or password. Please check your credentials and try again.');
            return;
          }
          
          throw error;
        }

        console.log('✅ Login successful, redirecting to app...');
        router.replace('/(tabs)');
      }
      
    } catch (error: any) {
      console.error('❌ Auth unexpected error:', error);
      
      // Enhanced error handling
      let errorMessage = 'Authentication failed';
      
      if (error.message?.includes('confirmation email')) {
        errorMessage = 'There was a problem sending the confirmation email. Please check your internet connection and try again.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message?.includes('fetch')) {
        errorMessage = 'Connection error. Please check your internet connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      console.log('🔐 Starting Google OAuth...');
      
      // lib/supabase.ts'deki helper fonksiyonunu kullan
      const { data, error } = await signInWithGoogle();

      if (error) throw error;
      
      console.log('✅ Google OAuth initiated successfully');
      
      // Web'de otomatik redirect olur, mobile'da WebBrowser handling zaten yapılmış
      // TabsLayout auth guard navigation'ı handle edecek
      
    } catch (error: any) {
      console.error('❌ Google OAuth error:', error);
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

          {/* Enhanced info note for signup mode */}
          {isSignUpMode && (
            <View style={styles.infoContainer}>
              <Text style={styles.infoNote}>
                📧 After creating your account, please check your email for a verification link. 
                You'll need to verify your email before you can sign in.
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
                setEmail('');
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
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  infoNote: {
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 18,
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
  // Error container styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
});

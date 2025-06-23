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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    if (!email || (!password && !isResetPassword)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      if (isResetPassword) {
        // PASSWORD RESET
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://warm-smakager-7badee.netlify.app/auth/reset-password',
        });

        if (error) throw error;

        Alert.alert(
          'Check Your Email! 📧',
          'We sent you a password reset link. Please check your email.',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsResetPassword(false);
                setEmail('');
              }
            }
          ]
        );
        return;
      }

      if (isSignUp) {
        // SIGN UP
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'https://warm-smakager-7badee.netlify.app/auth/callback'
          }
        });
        
        if (error) throw error;
        
        // Email confirmation kontrolü
        if (data?.user && !data.session) {
          Alert.alert(
            'Check Your Email! 📧',
            'We sent you a confirmation link. Please check your email to activate your account.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setIsSignUp(false);
                  setEmail('');
                  setPassword('');
                }
              }
            ]
          );
        } else if (data?.user && data.session) {
          console.log('✅ Sign up successful, auto logged in');
          router.replace('/(auth)/onboarding');
        }
      } else {
        // SIGN IN
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            Alert.alert(
              'Email Not Confirmed',
              'Please check your email and click the confirmation link before signing in.',
              [
                {
                  text: 'Resend Email',
                  onPress: async () => {
                    const { error: resendError } = await supabase.auth.resend({
                      type: 'signup',
                      email: email,
                    });
                    if (!resendError) {
                      Alert.alert('Email Sent', 'Confirmation email has been resent.');
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
        
        if (data.user) {
          console.log('✅ Login successful for user:', data.user.id);
          
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('age, gender, height_cm, weight_kg, full_name')
            .eq('id', data.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Profile fetch error:', profileError);
          }
          
          console.log('Profile data:', profile);
          
          if (!profile || !profile.age || !profile.gender) {
            console.log('➡️ Redirecting to onboarding...');
            router.replace('/(auth)/onboarding');
          } else {
            console.log('➡️ Redirecting to dashboard...');
            router.replace('/(tabs)/dashboard');
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      
      // Web için özel handling
      if (Platform.OS === 'web') {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            skipBrowserRedirect: false
          }
        });
        
        if (error) throw error;
      } else {
        // Mobile için
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'pantrypal://auth/callback'
          }
        });
        
        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Google sign in error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (isResetPassword) {
      return (
        <>
          <Text style={styles.subtitle}>Reset Password</Text>
          <Text style={styles.description}>
            Enter your email and we'll send you a reset link
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#6b7280"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setIsResetPassword(false);
              setEmail('');
            }}
            style={styles.switchButton}
          >
            <Text style={styles.switchText}>Back to Sign In</Text>
          </TouchableOpacity>
        </>
      );
    }

    return (
      <>
        <Text style={styles.subtitle}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#6b7280"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6b7280"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {!isSignUp && (
          <TouchableOpacity
            onPress={() => {
              setIsResetPassword(true);
              setPassword('');
            }}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png' }}
            style={styles.googleLogo}
            resizeMode="contain"
          />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsSignUp(!isSignUp)}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>🍽️ AI Food Pantry</Text>
        {renderContent()}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    color: '#6b7280',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: -20,
    color: '#9ca3af',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -8,
  },
  forgotText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3c4043',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#10b981',
  },
});

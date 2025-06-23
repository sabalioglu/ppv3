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
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

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
          // Email confirmation gerekiyor
          Alert.alert(
            'Check Your Email! 📧',
            'We sent you a confirmation link. Please check your email to activate your account.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Sign up modundan sign in moduna geç
                  setIsSignUp(false);
                  // Email ve password alanlarını temizle
                  setEmail('');
                  setPassword('');
                }
              }
            ]
          );
        } else if (data?.user && data.session) {
          // Email confirmation kapalı, direkt giriş yaptı
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
          // Özel hata mesajları
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
        
        // ✅ LOGIN BAŞARILI
        if (data.user) {
          console.log('✅ Login successful for user:', data.user.id);
          
          // Profile kontrolü - maybeSingle() kullan
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('age, gender, height_cm, weight_kg, full_name')
            .eq('id', data.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Profile fetch error:', profileError);
          }
          
          console.log('Profile data:', profile);
          
          // Yönlendirme
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

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>🍽️ AI Food Pantry</Text>
        
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

        <TouchableOpacity
          onPress={() => setIsSignUp(!isSignUp)}
          style={styles.switchButton}
        >
          <Text style={styles.switchText}>
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </Text>
        </TouchableOpacity>
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
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#10b981',
  },
});

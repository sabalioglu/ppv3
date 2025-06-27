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
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        Alert.alert(
          '📧 Check Your Email!',
          'We\'ve sent you a verification email. Please verify your account before signing in.',
          [{ text: 'OK', onPress: () => setIsSignUpMode(false) }]
        );
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            Alert.alert(
              'Email Not Verified',
              'Please check your email and click the verification link.',
              [
                {
                  text: 'Resend Email',
                  onPress: async () => {
                    const { error: resendError } = await supabase.auth.resend({
                      type: 'signup',
                      email: email,
                    });
                    if (resendError) {
                      Alert.alert('Error', 'Failed to resend verification email.');
                    } else {
                      Alert.alert('Email Sent', 'Verification email has been resent.');
                    }
                  },
                },
                { text: 'OK', style: 'cancel' },
              ]
            );
            return;
          }
          throw error;
        }

        console.log('✅ Login successful');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
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
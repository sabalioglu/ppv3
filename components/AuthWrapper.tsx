import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { validateAndFixAuth, debugAuthState } from '../utils/authDebug';
import OnboardingScreen from '../screens/OnboardingScreen';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthLoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#22C55E" />
    <Text style={styles.loadingText}>🔐 Checking authentication...</Text>
    <Text style={styles.loadingSubtext}>AI Food Pantry • Production-Ready</Text>
  </View>
);

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    console.log('🔐 AuthWrapper: Starting authentication check...');
    
    let mounted = true;
    
    // 🔧 Refresh token hatalarını otomatik yakala ve temizle
    validateAndFixAuth();

    // Initial session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;

      if (error) {
        console.error('❌ Session check error:', error);
        setLoading(false);
      } else {
        console.log('✅ Initial session:', session?.user?.email || 'No authenticated user');
        setUser(session?.user ?? null);
        
        if (session?.user) {
          checkProfileCompleteness(session.user.id, mounted);
        } else {
          setLoading(false);
        }
      }
    });

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth event:', event, session?.user?.email || 'No user');
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await createUserProfileIfNeeded(session.user);
          checkProfileCompleteness(session.user.id, mounted);
        } else {
          setIsProfileComplete(false);
          setLoading(false);
        }
        
        // 🚨 Token refresh başarısızlığını yakala ve temizle
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('🚨 Token refresh failed, clearing auth state...');
          validateAndFixAuth();
        }
      }
    );

    // 🛠️ Development debug helpers
    if (__DEV__ && typeof window !== 'undefined') {
      (window as any).debugAuth = debugAuthState;
      (window as any).clearAuth = async () => {
        const { clearAuthState } = await import('../utils/authDebug');
        await clearAuthState();
        setUser(null);
      };
      (window as any).testUILogout = async () => {
        try {
          console.log('🚪 Testing logout from AuthWrapper...');
          await signOut();
          console.log('✅ AuthWrapper logout completed');
        } catch (error) {
          console.error('❌ AuthWrapper logout error:', error);
        }
      };
    }

    return () => {
      mounted = false;
      console.log('🧹 AuthWrapper: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const checkProfileCompleteness = async (userId: string, mounted: boolean) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('age, gender, height_cm, weight_kg, activity_level')
        .eq('id', userId)
        .single();

      if (!mounted) return;

      if (error) {
        console.error("Error checking profile completeness:", error);
        setIsProfileComplete(false);
      } else if (profile && 
                 profile.age !== null && 
                 profile.gender !== null &&
                 profile.height_cm !== null &&
                 profile.weight_kg !== null &&
                 profile.activity_level !== null) {
        console.log('✅ Profile is complete');
        setIsProfileComplete(true);
      } else {
        console.log('📝 Profile incomplete, will show onboarding');
        console.log('Profile data:', profile);
        setIsProfileComplete(false);
      }
    } catch (err) {
      console.error("Critical error checking profile completeness:", err);
      setIsProfileComplete(false);
    } finally {
      if (mounted) setLoading(false);
    }
  };

  const createUserProfileIfNeeded = async (user: any) => {
    try {
      console.log('🔍 Checking if user profile exists...');
      
      const { data: existingProfile, error: selectError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('❌ Profile check error:', selectError);
        return;
      }

      if (!existingProfile) {
        console.log('📝 Creating new user profile...');
        
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            created_at: new Date().toISOString(),
            dietary_preferences: [],
            notification_settings: {
              expiry_alerts: true,
              recipe_suggestions: true,
              shopping_reminders: true
            },
            streak_days: 0
          });

        if (insertError) {
          console.error('❌ Profile creation error:', insertError);
        } else {
          console.log('✅ User profile created successfully');
        }
      } else {
        console.log('✅ User profile already exists');
      }
    } catch (error) {
      console.error('❌ Profile management error:', error);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      console.log(`🔐 Attempting ${isSignUp ? 'sign up' : 'sign in'} for:`, email);

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0]
            }
          }
        });
        
        if (error) throw error;
        console.log('✅ Sign up successful:', data.user?.email);
        
        if (data.user && !data.session) {
          Alert.alert('Success', 'Account created! You can now sign in.');
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        console.log('✅ Sign in successful:', data.user?.email);
      }
    } catch (error: any) {
      console.error('❌ Authentication error:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.message.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
        setIsSignUp(false);
      }
      
      Alert.alert('Authentication Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out from UI button...');
      console.log('🔍 Current user before logout:', user?.email);
      
      // 1. Supabase logout
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Supabase logout error:', error);
      } else {
        console.log('✅ Supabase logout successful');
      }
      
      // 2. Force local state clear
      console.log('🧹 Force clearing user state...');
      setUser(null);
      setIsProfileComplete(false);
      
      // 3. Storage temizle
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
          console.log('✅ Storage cleared');
        } catch (storageError) {
          console.log('⚠️ Storage clear error:', storageError);
        }
      }
      
      // 4. 🔥 WEB-SPECIFIC: Page reload for complete state reset
      if (Platform.OS === 'web') {
        console.log('🔄 Reloading page for complete logout on web...');
        setTimeout(() => {
          window.location.reload();
        }, 500); // Small delay to allow console logs
      }
      
      console.log('✅ Logout process completed');
      
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      
      // Force logout even on error
      console.log('🚨 Force logout due to error');
      setUser(null);
      setIsProfileComplete(false);
      
      if (Platform.OS === 'web') {
        window.location.reload();
      }
      
      Alert.alert('Logout Notice', 'You have been signed out. Please refresh if needed.');
    }
  };

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🍽️ AI Food Pantry</Text>
          <Text style={styles.subtitle}>
            Smart Food Management • AI-Powered • Production-Ready
          </Text>
          <Text style={styles.instruction}>
            {isSignUp 
              ? 'Create your account to start managing your food inventory'
              : 'Sign in to access your personal food inventory'
            }
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
          
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleAuth}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.secondaryButtonText}>
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </Text>
          </TouchableOpacity>

          {Platform.OS === 'web' && (
            <Text style={styles.webNote}>
              💡 Running on web platform with full functionality
            </Text>
          )}
        </View>
      </View>
    );
  }

  // User authenticated but profile incomplete - show onboarding
  if (!isProfileComplete) {
    return <OnboardingScreen userId={user.id} onComplete={() => setIsProfileComplete(true)} />;
  }

  // User authenticated and profile complete - show main app
  return (
    <View style={styles.appContainer}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  authContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  form: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    padding: 12,
  },
  secondaryButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  webNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 16,
    fontStyle: 'italic',
  },
  appContainer: {
    flex: 1,
  },
});

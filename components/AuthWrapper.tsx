// components/AuthWrapper.tsx - YENİ DOSYA OLUŞTUR
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export default function AuthWrapper({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('test@example.com'); // Quick test için
  const [password, setPassword] = useState('password123'); // Quick test için
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    console.log('🔐 AuthWrapper: Starting authentication check...');
    
    // Initial session check
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Session check error:', error);
      } else {
        console.log('✅ Initial session:', session?.user?.email || 'No authenticated user');
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email || 'No user');
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await createUserProfileIfNeeded(session.user);
        }
      }
    );

    return () => {
      console.log('🧹 AuthWrapper: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const createUserProfileIfNeeded = async (user) => {
    try {
      console.log('🔍 Checking if user profile exists...');
      
      const { data: existingProfile, error: selectError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, bu normal
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
            dietary_preferences: {},
            notification_settings: {
              expiry_alerts: true,
              recipe_suggestions: true,
              shopping_reminders: true
            }
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
          setIsSignUp(false); // Switch to sign in mode
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        console.log('✅ Sign in successful:', data.user?.email);
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      
      // User-friendly error messages
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
      console.log('🚪 Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      Alert.alert('Error', error.message);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🔐 Checking authentication...</Text>
        <Text style={styles.loadingSubtext}>Firebase-Free • Supabase-Powered</Text>
      </View>
    );
  }

  // No user - show auth screen
  if (!user) {
    return (
      <View style={styles.authContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>🍽️ AI Food Pantry</Text>
          <Text style={styles.subtitle}>
            Firebase-Free • Supabase-Powered • Production-Ready
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

  // User authenticated - show main app
  return (
    <View style={styles.appContainer}>
      <View style={styles.userBar}>
        <Text style={styles.userInfo}>Welcome, {user.email}!</Text>
        <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
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
  userBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userInfo: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  signOutText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});
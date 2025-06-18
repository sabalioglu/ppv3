// lib/authService.ts - SUPABASE-ONLY VERSION
import { supabase } from './supabase';
import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Complete WebBrowser session for OAuth
WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  provider: 'email' | 'google' | 'apple' | 'amazon';
}

export class AuthService {
  // Email/Password Authentication
  static async signInWithEmail(email: string, password: string): Promise<any> {
    try {
      console.log('🔐 Signing in with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('✅ Email sign in successful');
      return data.user;
    } catch (error: any) {
      console.error('❌ Email sign in failed:', error);
      throw new Error(this.getAuthErrorMessage(error.message));
    }
  }

  static async signUpWithEmail(email: string, password: string, displayName?: string): Promise<any> {
    try {
      console.log('📝 Creating account with email:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
          },
        },
      });
      
      if (error) throw error;
      
      console.log('✅ Email sign up successful');
      return data.user;
    } catch (error: any) {
      console.error('❌ Email sign up failed:', error);
      throw new Error(this.getAuthErrorMessage(error.message));
    }
  }

  // Enhanced Google Authentication with Supabase
  static async signInWithGoogle(): Promise<any> {
    try {
      console.log('🔍 Starting Google sign in...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Platform.OS === 'web' ? window.location.origin : 'pantrypal://auth',
        },
      });
      
      if (error) throw error;
      
      console.log('✅ Google sign in initiated');
      return data;
    } catch (error: any) {
      console.error('❌ Google sign in failed:', error);
      throw new Error('Google sign in failed: ' + error.message);
    }
  }

  // Apple Authentication (Supabase OAuth)
  static async signInWithApple(): Promise<any> {
    try {
      console.log('🍎 Starting Apple Sign In...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: Platform.OS === 'web' ? window.location.origin : 'pantrypal://auth',
        },
      });
      
      if (error) throw error;
      
      console.log('✅ Apple sign in initiated');
      return data;
    } catch (error: any) {
      console.error('❌ Apple sign in failed:', error);
      throw new Error('Apple sign in failed: ' + error.message);
    }
  }

  // Amazon Authentication (placeholder - requires Amazon setup)
  static async signInWithAmazon(): Promise<any> {
    try {
      console.log('📦 Amazon Sign In not implemented yet');
      throw new Error('Amazon Sign In not implemented yet');
    } catch (error: any) {
      throw new Error('Amazon sign in failed: ' + error.message);
    }
  }

  // Sign Out
  static async signOut(): Promise<void> {
    try {
      console.log('👋 Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('✅ Sign out successful');
    } catch (error: any) {
      console.error('❌ Sign out failed:', error);
      throw new Error('Sign out failed: ' + error.message);
    }
  }

  // Get Current User
  static async getCurrentUser(): Promise<any> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error: any) {
      console.error('❌ Get current user failed:', error);
      return null;
    }
  }

  // Enhanced Auth State Listener with Supabase
  static onAuthStateChanged(callback: (user: any) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user ? `User: ${session.user.email}` : 'No user');
      callback(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }

  // Create User Profile in Supabase
  private static async createUserProfile(user: any, provider: UserProfile['provider']): Promise<void> {
    try {
      const userProfile: Omit<UserProfile, 'id'> = {
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || undefined,
        avatar_url: user.user_metadata?.avatar_url || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        provider
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert([{ id: user.id, ...userProfile }]);

      if (error) throw error;
      console.log('✅ User profile created in Supabase');
    } catch (error) {
      console.error('❌ Failed to create user profile:', error);
      // Don't throw error here as auth was successful
    }
  }

  // Update User Profile
  private static async updateUserProfile(user: any, provider: UserProfile['provider']): Promise<void> {
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('user_profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (error) throw error;
        console.log('✅ User profile updated in Supabase');
      } else {
        // Create new profile
        await this.createUserProfile(user, provider);
      }
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      // Don't throw error here as auth was successful
    }
  }

  // Error Message Helper
  private static getAuthErrorMessage(errorMessage: string): string {
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Invalid email or password';
    }
    if (errorMessage.includes('User already registered')) {
      return 'This email address is already in use';
    }
    if (errorMessage.includes('Password should be at least')) {
      return 'Password is too weak. Must be at least 6 characters';
    }
    if (errorMessage.includes('Invalid email')) {
      return 'Invalid email address';
    }
    if (errorMessage.includes('Network request failed')) {
      return 'Network connection error';
    }
    if (errorMessage.includes('Too many requests')) {
      return 'Too many failed attempts. Please try again later';
    }
    if (errorMessage.includes('User not found')) {
      return 'No user found with this email address';
    }
    
    console.log('Unknown auth error:', errorMessage);
    return 'Authentication error occurred';
  }
}
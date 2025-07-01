import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Sade cross-platform storage
const storage = Platform.OS === 'web' ? undefined : AsyncStorage;

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
      flowType: 'pkce',
    },
  }
);

// Enhanced OAuth sign in function
export const signInWithOAuth = async (provider: 'google' | 'apple') => {
  try {
    const redirectTo = Platform.OS === 'web' 
      ? `${window.location.origin}/(auth)/callback`
      : 'aifoodpantry://auth/callback';
    
    console.log('🔗 OAuth redirect URL:', redirectTo);

    if (Platform.OS === 'web') {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      return { data, error };
    } else {
      // Mobile implementation
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No URL returned from OAuth');

      console.log('📱 Opening OAuth URL...');
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
        { showInRecents: true, createTask: false }
      );

      console.log('📱 OAuth result:', result.type);

      if (result.type === 'success' && result.url) {
        const parsedUrl = Linking.parse(result.url);
        const fragment = parsedUrl.hostname === 'auth' && parsedUrl.path === '/callback' 
          ? parsedUrl.queryParams : {};
        
        if (fragment.access_token) {
          console.log('🔑 Setting session...');
          await supabase.auth.setSession({
            access_token: fragment.access_token as string,
            refresh_token: (fragment.refresh_token as string) || '',
          });
          
          // Session kontrolü
          const { data: sessionData } = await supabase.auth.getSession();
          console.log('📱 Session status:', sessionData.session ? 'Active' : 'None');
        }
      }

      return { data, error: null };
    }
  } catch (error) {
    console.error('❌ OAuth error:', error);
    return { data: null, error };
  }
};

// Keep backward compatibility
export const signInWithGoogle = async () => {
  return signInWithOAuth('google');
};

// Auth helper functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Database helper functions
export const createUserProfile = async (profile: Database['public']['Tables']['user_profiles']['Insert']) => {
  const { data, error } = await supabase.from('user_profiles').insert(profile).select().single();
  return { data, error };
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: Database['public']['Tables']['user_profiles']['Update']) => {
  const { data, error } = await supabase.from('user_profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', userId).select().single();
  return { data, error };
};

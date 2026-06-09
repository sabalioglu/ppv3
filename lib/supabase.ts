// lib/supabase.ts - Fixed Environment Variables

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔧 Fixed: Use EXPO_PUBLIC_ instead of NEXT_PUBLIC_
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Environment validation
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required variables:');
  console.error('- EXPO_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseAnonKey);

  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.',
  );
}

console.log('✅ Supabase environment variables loaded');
console.log('- URL:', supabaseUrl);
console.log('- Key prefix:', supabaseAnonKey.substring(0, 20) + '...');

// Cross-platform storage
const storage = Platform.OS === 'web' ? undefined : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});

// Enhanced OAuth sign in function
export const signInWithOAuth = async (provider: 'google' | 'apple') => {
  try {
    const redirectTo =
      Platform.OS === 'web'
        ? `${window.location.origin}/(auth)/callback`
        : 'stovd://auth/callback';

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
        { showInRecents: true, createTask: false },
      );

      console.log('📱 OAuth result:', result.type);

      if (result.type === 'success' && result.url) {
        const parsedUrl = Linking.parse(result.url);
        const qp = parsedUrl.queryParams ?? {};
        const code = qp.code as string | undefined;
        const access_token = qp.access_token as string | undefined;

        // flowType is 'pkce' → the callback carries ?code=… which must be
        // exchanged for a session. (Older implicit flow returns ?access_token=…)
        if (code) {
          console.log('🔑 Exchanging code for session...');
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (access_token) {
          console.log('🔑 Setting session...');
          await supabase.auth.setSession({
            access_token,
            refresh_token: (qp.refresh_token as string) || '',
          });
        }

        const { data: sessionData } = await supabase.auth.getSession();
        console.log(
          '📱 Session status:',
          sessionData.session ? 'Active' : 'None',
        );
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
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
};

// Database helper functions
export const createUserProfile = async (
  profile: Database['public']['Tables']['user_profiles']['Insert'],
) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profile)
    .select()
    .single();
  return { data, error };
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (
  userId: string,
  updates: Database['public']['Tables']['user_profiles']['Update'],
) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

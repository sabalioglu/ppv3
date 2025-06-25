import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

console.log('✅ Supabase Config:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'Missing',
  anonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'Missing',
});

// Custom storage that works with SSR
const customStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.localStorage.getItem(key);
    }
    // Server-side rendering için null dön
    return null;
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  },
};

// Create redirect URL based on platform
const getRedirectUrl = () => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/auth/callback`;
    }
    return 'https://warm-smakager-7badee.netlify.app/auth/callback';
  }
  // For mobile, use the deep link
  return Linking.createURL('auth/callback');
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    flowType: 'pkce',
  },
});

// Auth helper functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
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
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Custom sign in function for OAuth
export const signInWithOAuth = async (provider: 'google' | 'apple') => {
  try {
    const redirectTo = getRedirectUrl();
    console.log('🔗 OAuth redirect URL:', redirectTo);

    if (Platform.OS === 'web') {
      // Web implementation
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
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
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No URL returned from OAuth');

      // Open in web browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo,
        {
          showInRecents: true,
          createTask: false,
        }
      );

      if (result.type === 'success' && result.url) {
        // Parse the URL to get tokens
        const parsedUrl = Linking.parse(result.url);
        const fragment = parsedUrl.hostname === 'auth' && parsedUrl.path === 'callback' 
          ? parsedUrl.queryParams 
          : {};
        
        if (fragment.access_token) {
          // Set the session manually
          await supabase.auth.setSession({
            access_token: fragment.access_token as string,
            refresh_token: (fragment.refresh_token as string) || '',
          });
        }
      }

      return { data, error: null };
    }
  } catch (error) {
    console.error('OAuth error:', error);
    return { data: null, error };
  }
};

// Keep the old function for backward compatibility
export const signInWithGoogle = async () => {
  return signInWithOAuth('google');
};

// Database helper functions
export const createUserProfile = async (profile: Database['public']['Tables']['user_profiles']['Insert']) => {
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
  updates: Database['public']['Tables']['user_profiles']['Update']
) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

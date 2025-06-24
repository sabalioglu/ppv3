import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { Platform, Linking } from 'react-native';

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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
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

// Google OAuth sign in
export const signInWithGoogle = async () => {
  try {
    const redirectTo = Platform.select({
      web: `${window.location.origin}/auth/callback`,
      default: 'aifoodpantry://auth/callback'
    });

    console.log('🔗 Google OAuth redirect URL:', redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true, // Mobil için her zaman true
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) throw error;

    // Web'de otomatik yönlendirme
    if (Platform.OS === 'web' && data?.url) {
      console.log('🌐 Redirecting to:', data.url);
      window.location.href = data.url;
    }

    // Mobil için URL'yi aç
    if (Platform.OS !== 'web' && data?.url) {
      console.log('📱 Opening OAuth URL in browser:', data.url);
      
      try {
        const canOpen = await Linking.canOpenURL(data.url);
        
        if (canOpen) {
          await Linking.openURL(data.url);
          console.log('✅ Opened OAuth URL in browser');
        } else {
          console.error('❌ Cannot open URL:', data.url);
          throw new Error('Cannot open authentication URL');
        }
      } catch (linkingError) {
        console.error('❌ Linking error:', linkingError);
        // Fallback: Try to open URL directly
        await Linking.openURL(data.url);
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('❌ Google sign in error:', error);
    return { data: null, error };
  }
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

export const updateUserProfile = async (userId: string, updates: Database['public']['Tables']['user_profiles']['Update']) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  return { data, error };
};

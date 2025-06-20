import { supabase } from '../lib/supabase';

export const clearAuthState = async () => {
  try {
    console.log('🧹 Clearing authentication state...');
    
    // 1. Supabase session'ı temizle
    await supabase.auth.signOut();
    
    // 2. Browser storage'ları temizle
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      
      // 3. Supabase specific keys'leri özellikle temizle
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('✅ Storage cleared successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing auth state:', error);
    return false;
  }
};

export const debugAuthState = async () => {
  try {
    console.log('🔍 === AUTH STATE DEBUG ===');
    
    // Current session kontrolü
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('📱 Session exists:', !!session);
    console.log('📱 Session error:', sessionError?.message || 'None');
    
    // Current user kontrolü
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 User exists:', !!user);
    console.log('👤 User email:', user?.email || 'None');
    console.log('👤 User error:', userError?.message || 'None');
    
    // Token durumu
    if (session) {
      const now = new Date();
      const expiresAt = new Date(session.expires_at * 1000);
      console.log('🔑 Access token exists:', !!session.access_token);
      console.log('🔄 Refresh token exists:', !!session.refresh_token);
      console.log('⏰ Token expires at:', expiresAt.toLocaleString());
      console.log('⏰ Token expired:', now > expiresAt);
    }
    
    console.log('🔍 === DEBUG COMPLETE ===');
    
    return { session, user, sessionError, userError };
  } catch (error) {
    console.error('❌ Debug error:', error);
    return { error };
  }
};

export const validateAndFixAuth = async () => {
  const { session, user, sessionError, userError } = await debugAuthState();
  
  // Invalid refresh token hatası kontrolü
  const hasRefreshTokenError = 
    sessionError?.message?.includes('Invalid Refresh Token') || 
    userError?.message?.includes('Invalid Refresh Token') ||
    sessionError?.message?.includes('JWT') ||
    userError?.message?.includes('JWT');
  
  if (hasRefreshTokenError) {
    console.log('🚨 Auth errors detected, clearing state...');
    await clearAuthState();
    
    // Sayfa yenileme için signal
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    
    return false;
  }
  
  if (!session || !user) {
    console.log('⚠️ No valid session found');
    return false;
  }
  
  console.log('✅ Authentication state is valid');
  return true;
};

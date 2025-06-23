const handleCallback = async () => {
  try {
    console.log('🔄 Processing OAuth callback...');

    // Web'de ve client-side'da URL kontrolü
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      console.log('📍 Current URL:', window.location.href);
      const fragment = window.location.hash;
      console.log('🔍 URL Fragment:', fragment);

      // Supabase'in session'ı URL'den almasını bekle
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Session'ı kontrol et
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Callback error:', error);
      router.replace('/auth/login'); // Parantez içindeki route'ları kontrol edin
      return;
    }

    console.log('🔐 Session status:', session ? 'Found' : 'Not found');

    if (!session) {
      console.log('⚠️ No session found');
      router.replace('/auth/login'); // Kullanıcıyı login'e yönlendir
      return;
    }

    console.log('✅ OAuth login successful!', session.user.email);

    // Profile kontrolü
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('age, gender, full_name')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError);
      router.replace('/auth/login'); // Profil alınamazsa login'e yönlendir
      return;
    }

    console.log('👤 Profile data:', profile);

    if (!profile || !profile.age || !profile.gender) {
      console.log('➡️ Redirecting to onboarding...');
      router.replace('/auth/onboarding');
    } else {
      console.log('➡️ Redirecting to dashboard...');
      router.replace('/tabs/dashboard');
    }
  } catch (error) {
    console.error('❌ Auth callback error:', error);
    router.replace('/auth/login');
  }
};
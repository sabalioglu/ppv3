const handleGoogleSignIn = async () => {
  try {
    console.log('🚀 Starting Google Sign In...');
    console.log('📱 Platform:', Platform.OS);
    
    setIsLoading(true);
    
    const { data, error } = await signInWithGoogle();
    
    console.log('📊 Sign in result:', { data, error });
    
    if (error) {
      console.error('❌ Sign in error:', error);
      Alert.alert('Error', error.message);
    } else {
      console.log('✅ Sign in successful, data:', data);
    }
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    Alert.alert('Error', 'An unexpected error occurred');
  } finally {
    setIsLoading(false);
  }
};
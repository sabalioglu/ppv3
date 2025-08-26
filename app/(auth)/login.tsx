import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthForm } from '@/components/auth/AuthForm';
import { colors } from '@/lib/theme';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const router = useRouter();

  const handleAuthSuccess = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <AuthForm
        mode={authMode}
        onSuccess={handleAuthSuccess}
        onModeChange={setAuthMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
});

import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { User } from 'firebase/auth';
import { AuthService } from '@/lib/authService';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      
      // Auth routing
      if (!user) {
        router.replace('/auth/welcome');
      } else {
        router.replace('/(tabs)');
      }
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
  },
});
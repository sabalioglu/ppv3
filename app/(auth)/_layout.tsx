import { Redirect, Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import LoadingCard from '@/components/UI/LoadingCard';

export default function AuthLayout() {
  const { colors } = useTheme();
  const { isReady, session, isProfileComplete } = useAuth();

  if (!isReady) {
    return <LoadingCard />;
  }

  if (session && session.user && isProfileComplete) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Protected guard={!session?.user}>
        <Stack.Screen
          name="signup"
          options={{
            title: 'Sign Up',
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: 'Login',
          }}
        />
        <Stack.Screen
          name="reset-password"
          options={{
            title: 'Reset Password',
          }}
        />
        <Stack.Screen
          name="reset-confirm-password"
          options={{
            title: 'Reset Confirm Password',
          }}
        />
      </Stack.Protected>
      <Stack.Protected
        guard={!!session?.user && !!isReady && !isProfileComplete}
      >
        <Stack.Screen
          name="onboarding"
          options={{
            title: 'Get Started',
            gestureEnabled: false,
          }}
        />
      </Stack.Protected>
      <Stack.Screen
        name="email-confirmed"
        options={{
          title: 'Email Confirmed',
        }}
      />
    </Stack>
  );
}

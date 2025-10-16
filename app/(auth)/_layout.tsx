import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function AuthLayout() {
  const { colors } = useTheme();

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
        name="onboarding"
        options={{
          title: 'Get Started',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="callback"
        options={{
          title: 'Authenticating...',
          gestureEnabled: false,
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
      <Stack.Screen
        name="email-confirmed"
        options={{
          title: 'Email Confirmed',
        }}
      />
    </Stack>
  );
}

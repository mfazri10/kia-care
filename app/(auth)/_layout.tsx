import { Stack } from 'expo-router';
import { GuestLayout } from '@fastshot/auth';

export default function AuthLayout() {
  return (
    <GuestLayout redirectTo="/">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
      </Stack>
    </GuestLayout>
  );
}

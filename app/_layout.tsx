import { Stack } from 'expo-router';
import { AuthProvider } from '@fastshot/auth';
import { AppProvider } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider
      supabaseClient={supabase}
      routes={{
        login: '/(auth)/welcome',
        afterLogin: '/',
        protected: ['tabs', 'onboarding'],
        guest: ['auth'],
      }}
      onSignIn={(user) => {
        console.log('User signed in:', user.email);
      }}
      onSignOut={() => {
        console.log('User signed out');
      }}
      onError={(error) => {
        console.error('Auth error:', error.type, error.message);
      }}
    >
      <AppProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="pin-lock" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="education" />
          <Stack.Screen name="pregnancy" />
          <Stack.Screen name="postpartum" />
          <Stack.Screen name="pre-pregnancy" />
          <Stack.Screen name="red-flag" />
          <Stack.Screen name="growth-chart" />
          <Stack.Screen name="milestone-tracker" />
          <Stack.Screen name="clinical-records" />
          <Stack.Screen name="immunization-dashboard" />
          <Stack.Screen name="export-kia" />
          <Stack.Screen name="appointments" />
          <Stack.Screen name="wellness-hub" />
        </Stack>
      </AppProvider>
    </AuthProvider>
  );
}

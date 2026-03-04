import { Stack } from 'expo-router';
import { AppProvider } from '@/context/AppContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="pin-lock" />
        <Stack.Screen name="(tabs)" />
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
      </Stack>
    </AppProvider>
  );
}

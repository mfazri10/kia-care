import { Stack } from 'expo-router';

export default function WellnessHubLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="mood-tracker" />
      <Stack.Screen name="exercise-guide" />
      <Stack.Screen name="hospital-bag" />
      <Stack.Screen name="community" />
      <Stack.Screen name="partner-mode" />
    </Stack>
  );
}

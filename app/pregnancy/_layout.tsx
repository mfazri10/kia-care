import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function PregnancyLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="timeline" />
      <Stack.Screen name="anc" />
      <Stack.Screen name="ttd" />
      <Stack.Screen name="p4k" />
      <Stack.Screen name="danger-signs" />
    </Stack>
  );
}

import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function PostpartumLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="kf-visits" />
      <Stack.Screen name="breastfeeding" />
      <Stack.Screen name="milk-stock" />
      <Stack.Screen name="baby-growth" />
      <Stack.Screen name="baby-blues" />
    </Stack>
  );
}

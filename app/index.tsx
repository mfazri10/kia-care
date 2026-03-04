import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@fastshot/auth';
import { useApp } from '@/context/AppContext';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { isLoading: appLoading, settings } = useApp();

  // Show loading while auth or app data is initializing
  if (authLoading || appLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Not authenticated → go to welcome/auth
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Authenticated but onboarding not completed → go to onboarding
  if (!settings.onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  // Authenticated + onboarded but PIN is enabled → go to PIN lock
  if (settings.pinEnabled && settings.pin) {
    return <Redirect href="/pin-lock" />;
  }

  // Authenticated + onboarded → go to main app
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});

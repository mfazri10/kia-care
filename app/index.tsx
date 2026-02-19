import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { isLoading, settings } = useApp();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!settings.onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  if (settings.pinEnabled && settings.pin) {
    return <Redirect href="/pin-lock" />;
  }

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

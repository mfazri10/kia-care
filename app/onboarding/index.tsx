import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleGetStarted = () => {
    router.push('/onboarding/phase-select');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topSection}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="heart" size={48} color={Colors.white} />
          </View>
        </View>

        <Text style={styles.appName}>KIA Care</Text>
        <Text style={styles.subtitle}>Buku KIA Digital Anda</Text>
      </View>

      <View style={styles.middleSection}>
        <View style={styles.featureRow}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.praHamilBg }]}>
              <Ionicons name="heart-outline" size={24} color={Colors.praHamil} />
            </View>
            <Text style={styles.featureText}>Pra Hamil</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.hamilBg }]}>
              <Ionicons name="body-outline" size={24} color={Colors.hamil} />
            </View>
            <Text style={styles.featureText}>Kehamilan</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.pascaMelahirkanBg }]}>
              <Ionicons name="happy-outline" size={24} color={Colors.pascaMelahirkan} />
            </View>
            <Text style={styles.featureText}>Pasca Lahir</Text>
          </View>
        </View>

        <Text style={styles.description}>
          Pantau kesehatan ibu dan bayi di setiap tahap perjalanan Anda. Dari persiapan kehamilan hingga pasca melahirkan.
        </Text>

        <View style={styles.highlights}>
          <HighlightItem
            icon="calendar-outline"
            text="Jadwal pemeriksaan & pengingat"
          />
          <HighlightItem
            icon="document-text-outline"
            text="Catatan kesehatan lengkap"
          />
          <HighlightItem
            icon="book-outline"
            text="Edukasi kesehatan ibu & anak"
          />
        </View>
      </View>

      <View style={styles.bottomSection}>
        <Button
          title="Mulai Sekarang"
          onPress={handleGetStarted}
          size="lg"
          fullWidth
          icon="arrow-forward"
          iconPosition="right"
        />

        <Text style={styles.footerText}>
          Bersama KIA Care, kehamilan Anda lebih terpantau
        </Text>
      </View>
    </View>
  );
}

function HighlightItem({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.highlightItem}>
      <Ionicons name={icon} size={20} color={Colors.secondary} />
      <Text style={styles.highlightText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xxl,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: Spacing.huge,
  },
  logoContainer: {
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.xxxl,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  featureText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xxl,
  },
  highlights: {
    gap: Spacing.md,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  highlightText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  bottomSection: {
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});

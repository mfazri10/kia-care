import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@fastshot/auth';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
} from '@/constants/theme';

const AUTH_COLORS = {
  peach: '#F4845F',
  peachLight: '#FFD4C7',
  peachBg: '#FFF5F2',
  warmWhite: '#FFFAF8',
};

export default function OnboardingWelcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Bunda';

  const handleContinue = () => {
    router.push('/onboarding/phase-select');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}>
      {/* Decorative background */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <View style={styles.content}>
        {/* Welcome icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="sparkles" size={36} color={Colors.white} />
          </View>
        </View>

        <Text style={styles.greeting}>Halo, {userName}!</Text>
        <Text style={styles.title}>Selamat bergabung di{'\n'}KIA Care</Text>
        <Text style={styles.subtitle}>
          Mari lengkapi profil Anda agar kami dapat memberikan panduan kesehatan yang tepat untuk Anda dan si kecil.
        </Text>

        {/* Steps preview */}
        <View style={styles.stepsContainer}>
          <StepItem
            number="1"
            title="Pilih Fase Anda"
            desc="Hamil, Pasca Melahirkan, atau Pra Hamil"
            active
          />
          <StepItem
            number="2"
            title="Lengkapi Profil"
            desc="Data diri dan informasi kesehatan"
          />
          <StepItem
            number="3"
            title="Mulai Perjalanan"
            desc="Pantau kesehatan ibu & anak"
          />
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
        activeOpacity={0.85}
      >
        <Text style={styles.continueButtonText}>Mulai Pengaturan</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

function StepItem({
  number,
  title,
  desc,
  active = false,
}: {
  number: string;
  title: string;
  desc: string;
  active?: boolean;
}) {
  return (
    <View style={styles.stepItem}>
      <View style={[styles.stepNumber, active && styles.stepNumberActive]}>
        <Text style={[styles.stepNumberText, active && styles.stepNumberTextActive]}>
          {number}
        </Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, active && styles.stepTitleActive]}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.warmWhite,
    paddingHorizontal: Spacing.xxl,
  },
  bgCircle1: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: AUTH_COLORS.peachBg,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: 100,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: AUTH_COLORS.peachBg,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.xxl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AUTH_COLORS.peach,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AUTH_COLORS.peach,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  greeting: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    color: AUTH_COLORS.peach,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 38,
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xxxl,
  },
  stepsContainer: {
    gap: Spacing.xl,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  stepNumberActive: {
    backgroundColor: AUTH_COLORS.peach,
    borderColor: AUTH_COLORS.peach,
  },
  stepNumberText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textTertiary,
  },
  stepNumberTextActive: {
    color: Colors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  stepTitleActive: {
    color: Colors.textPrimary,
  },
  stepDesc: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.peach,
    borderRadius: BorderRadius.lg,
    height: 56,
    gap: Spacing.sm,
    shadowColor: AUTH_COLORS.peach,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
});

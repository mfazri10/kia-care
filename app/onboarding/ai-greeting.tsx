import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTextGeneration } from '@fastshot/ai';
import { useApp } from '@/context/AppContext';
import { Phase } from '@/types';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  phaseConfig,
} from '@/constants/theme';
import { migrateLocalDataToCloud } from '@/utils/migration';

const AUTH_COLORS = {
  peach: '#F4845F',
  peachLight: '#FFD4C7',
  peachBg: '#FFF5F2',
  warmWhite: '#FFFAF8',
};

function getGreetingPrompt(profileName: string, phase: Phase, hpht?: string, babyDob?: string, babyName?: string): string {
  let context = '';

  if (phase === 'hamil' && hpht) {
    const hphtDate = new Date(hpht);
    const now = new Date();
    const diffMs = now.getTime() - hphtDate.getTime();
    const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    context = `Dia sedang hamil minggu ke-${weeks}.`;
  } else if (phase === 'pasca-melahirkan' && babyDob) {
    const dobDate = new Date(babyDob);
    const now = new Date();
    const diffMs = now.getTime() - dobDate.getTime();
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const weeks = Math.floor(days / 7);
    const babyInfo = babyName ? `bernama ${babyName}` : '';
    context = `Bayinya ${babyInfo} berusia ${weeks > 0 ? `${weeks} minggu` : `${days} hari`}.`;
  } else if (phase === 'pra-hamil') {
    context = 'Dia sedang dalam tahap persiapan kehamilan (pra-hamil).';
  }

  return `Kamu adalah asisten kesehatan ibu dan anak yang hangat dan penuh empati. Buat ucapan selamat datang yang personal dan menyemangati untuk seorang ibu bernama ${profileName}. ${context}

Aturan:
- Gunakan bahasa Indonesia yang hangat dan menyemangati
- Sapa dengan nama ibu
- Sebutkan informasi spesifik tentang kehamilannya atau bayinya jika ada
- Berikan satu tips kesehatan singkat yang relevan dengan fasenya
- Maksimal 3-4 kalimat saja
- Jangan gunakan format markdown atau bullet point
- Gunakan emoji yang sesuai (1-2 saja)`;
}

export default function AIGreetingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding, activeProfile } = useApp();
  const { profileName, phase, hpht, babyDob, babyName } = useLocalSearchParams<{
    profileName: string;
    phase: Phase;
    hpht?: string;
    babyDob?: string;
    babyName?: string;
  }>();

  const currentPhase: Phase = phase || 'hamil';
  const config = phaseConfig[currentPhase];
  const name = profileName || activeProfile?.name || 'Bunda';

  const [greeting, setGreeting] = useState<string>('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const greetingFade = useRef(new Animated.Value(0)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;

  const { generateText, isLoading } = useTextGeneration({
    onError: (err) => {
      console.error('AI greeting error:', err);
      // Fallback greeting if AI fails
      setGreeting(getFallbackGreeting(name, currentPhase, hpht, babyDob, babyName));
    },
  });

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Generate greeting on mount
  useEffect(() => {
    const fetchGreeting = async () => {
      const prompt = getGreetingPrompt(name, currentPhase, hpht, babyDob, babyName);
      const response = await generateText(prompt);
      if (response) {
        setGreeting(response);
      } else {
        setGreeting(getFallbackGreeting(name, currentPhase, hpht, babyDob, babyName));
      }
    };

    fetchGreeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate greeting text when it appears
  useEffect(() => {
    if (greeting) {
      Animated.sequence([
        Animated.timing(greetingFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => setIsReady(true));
    }
  }, [greeting, greetingFade, buttonFade]);

  // Attempt data migration in background
  useEffect(() => {
    const migrate = async () => {
      setIsMigrating(true);
      try {
        await migrateLocalDataToCloud();
      } catch (err) {
        console.error('Data migration error:', err);
        // Non-blocking: migration failure shouldn't prevent onboarding
      } finally {
        setIsMigrating(false);
      }
    };

    migrate();
  }, []);

  const handleContinue = async () => {
    try {
      await completeOnboarding();
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Error completing onboarding:', err);
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}>
      {/* Decorative background */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Step indicator */}
        <Text style={styles.stepLabel}>Langkah 3 dari 3</Text>

        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: config.color }]}>
          <Ionicons name="sparkles" size={40} color={Colors.white} />
        </View>

        <Text style={styles.title}>Profil Anda Siap!</Text>

        {/* AI Greeting */}
        {isLoading && !greeting ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AUTH_COLORS.peach} />
            <Text style={styles.loadingText}>Menyiapkan pesan personal untuk Anda...</Text>
          </View>
        ) : (
          <Animated.View style={[styles.greetingCard, { opacity: greetingFade }]}>
            <View style={styles.greetingHeader}>
              <View style={styles.aiAvatarSmall}>
                <Ionicons name="sparkles" size={14} color={Colors.white} />
              </View>
              <Text style={styles.greetingFrom}>Dari Asisten Kia</Text>
            </View>
            <Text style={styles.greetingText}>{greeting}</Text>
          </Animated.View>
        )}

        {/* Migration status */}
        {isMigrating && (
          <View style={styles.migrationStatus}>
            <ActivityIndicator size="small" color={Colors.secondary} />
            <Text style={styles.migrationText}>Menyinkronkan data lokal...</Text>
          </View>
        )}
      </Animated.View>

      {/* CTA Button */}
      <Animated.View style={{ opacity: buttonFade }}>
        <TouchableOpacity
          style={[styles.continueButton, (!isReady && !greeting) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!greeting && isLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>Mulai Menggunakan KIA Care</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function getFallbackGreeting(name: string, phase: Phase, hpht?: string, babyDob?: string, babyName?: string): string {
  if (phase === 'hamil' && hpht) {
    const hphtDate = new Date(hpht);
    const now = new Date();
    const weeks = Math.floor((now.getTime() - hphtDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `Selamat datang, ${name}! Kehamilan Anda sudah memasuki minggu ke-${weeks}. Kami siap menemani perjalanan indah ini bersama Anda. Jangan lupa minum vitamin dan istirahat yang cukup ya, Bunda! 🤰✨`;
  }
  if (phase === 'pasca-melahirkan' && babyDob) {
    const dobDate = new Date(babyDob);
    const now = new Date();
    const days = Math.floor((now.getTime() - dobDate.getTime()) / (24 * 60 * 60 * 1000));
    const babyInfo = babyName ? `${babyName}` : 'si kecil';
    return `Selamat datang kembali, ${name}! ${babyInfo} sudah berusia ${days} hari. Setiap hari bersama si kecil adalah momen berharga. Ingat untuk selalu menjaga kesehatan Bunda juga ya! 👶💕`;
  }
  return `Selamat datang, ${name}! Perjalanan menuju kehamilan yang sehat dimulai dari persiapan yang baik. KIA Care siap mendampingi setiap langkah Anda. Mulai dengan pola makan sehat dan olahraga teratur ya! 💪🌸`;
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
    bottom: 80,
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
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: AUTH_COLORS.peach,
    marginBottom: Spacing.xxl,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxl,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.xxxl,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  greetingCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: AUTH_COLORS.peach,
  },
  greetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  aiAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingFrom: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  greetingText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  migrationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    backgroundColor: Colors.secondaryBg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  migrationText: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
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
  buttonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
});

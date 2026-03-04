import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

const AUTH_COLORS = {
  peach: '#F4845F',
  peachLight: '#FFD4C7',
  peachBg: '#FFF5F2',
  coral: '#FF7F6E',
  coralLight: '#FFBAB0',
  warmWhite: '#FFFAF8',
  softGold: '#F5C77E',
};

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous heart pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(heartPulse, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(heartPulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [fadeAnim, slideAnim, logoScale, heartPulse]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }]}>
      {/* Background decorative circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* Top section - Logo and branding */}
      <Animated.View
        style={[
          styles.topSection,
          {
            opacity: fadeAnim,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: heartPulse }] }]}>
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <Ionicons name="heart" size={40} color={Colors.white} />
            </View>
            {/* Mother & child decorative element */}
            <View style={styles.childHeart}>
              <Ionicons name="heart" size={16} color={AUTH_COLORS.coral} />
            </View>
          </View>
        </Animated.View>

        <Text style={styles.appName}>KIA Care</Text>
        <Text style={styles.tagline}>Pendamping Setia Ibu & Anak</Text>
      </Animated.View>

      {/* Middle section - Warm messaging */}
      <Animated.View
        style={[
          styles.middleSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.welcomeTitle}>
          Selamat Datang,{'\n'}Bunda!
        </Text>
        <Text style={styles.welcomeDesc}>
          Mulai perjalanan kehamilan dan perawatan si kecil bersama KIA Care.
          Aman, terpercaya, dan selalu menemani setiap langkah Anda.
        </Text>

        {/* Trust badges */}
        <View style={styles.trustBadges}>
          <TrustBadge icon="shield-checkmark" text="Data Aman" />
          <TrustBadge icon="lock-closed" text="Privasi Terjaga" />
          <TrustBadge icon="cloud-done" text="Cloud Backup" />
        </View>
      </Animated.View>

      {/* Bottom section - Auth buttons */}
      <Animated.View
        style={[
          styles.bottomSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Primary CTA - Register */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => router.push('/(auth)/register')}
        >
          <Text style={styles.primaryButtonText}>Daftar Sekarang</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>

        {/* Secondary CTA - Login */}
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.7}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.secondaryButtonText}>Sudah punya akun? </Text>
          <Text style={styles.secondaryButtonLink}>Masuk</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Bersama KIA Care, kehamilan Anda lebih terpantau
        </Text>
      </Animated.View>
    </View>
  );
}

function TrustBadge({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.trustBadge}>
      <View style={styles.trustBadgeIcon}>
        <Ionicons name={icon} size={18} color={AUTH_COLORS.peach} />
      </View>
      <Text style={styles.trustBadgeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.warmWhite,
    paddingHorizontal: Spacing.xxl,
  },
  // Background decorative circles
  bgCircle1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: AUTH_COLORS.peachBg,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: 120,
    left: -100,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: AUTH_COLORS.peachBg,
    opacity: 0.6,
  },
  bgCircle3: {
    position: 'absolute',
    top: '40%',
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF0EC',
    opacity: 0.5,
  },

  // Top section
  topSection: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
  },
  logoContainer: {
    marginBottom: Spacing.xl,
  },
  logoOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AUTH_COLORS.peachLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: AUTH_COLORS.peach,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AUTH_COLORS.peach,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  childHeart: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appName: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.bold,
    color: AUTH_COLORS.peach,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Middle section
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  welcomeTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 38,
    marginBottom: Spacing.lg,
  },
  welcomeDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xxl,
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trustBadge: {
    alignItems: 'center',
    flex: 1,
  },
  trustBadgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AUTH_COLORS.peachBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  trustBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Bottom section
  bottomSection: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  primaryButton: {
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
  primaryButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  secondaryButtonText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  secondaryButtonLink: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: AUTH_COLORS.peach,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

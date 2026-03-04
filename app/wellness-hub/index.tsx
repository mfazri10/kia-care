// KIA Care - Wellness Hub Main Screen
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';

interface HubCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  onPress: () => void;
}

function HubCard({ title, subtitle, icon, color, bgColor, onPress }: HubCardProps) {
  return (
    <TouchableOpacity
      style={[styles.hubCard, { backgroundColor: bgColor, borderColor: color + '30' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.hubCardIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={[styles.hubCardTitle, { color }]}>{title}</Text>
      <Text style={styles.hubCardSubtitle}>{subtitle}</Text>
      <View style={[styles.hubCardArrow, { backgroundColor: color + '15' }]}>
        <Ionicons name="arrow-forward" size={16} color={color} />
      </View>
    </TouchableOpacity>
  );
}

export default function WellnessHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Wellness Hub</Text>
          <Text style={styles.headerSubtitle}>Kesehatan Mental, Fisik & Komunitas</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="leaf" size={32} color={Colors.mintGreen} />
          </View>
          <Text style={styles.heroTitle}>Selamat Datang di Wellness Hub 🌿</Text>
          <Text style={styles.heroDesc}>
            Jaga kesehatan mental dan fisik Anda dengan fitur mood tracker, panduan olahraga,
            dan komunitas yang mendukung perjalanan kehamilan Anda.
          </Text>
        </View>

        {/* Section: Mental Health */}
        <Text style={styles.sectionTitle}>🧘‍♀️ Kesehatan Mental</Text>
        <HubCard
          title="Mood Tracker"
          subtitle="Catat mood harian & dapatkan saran AI"
          icon="happy-outline"
          color={Colors.lavender}
          bgColor={Colors.lavenderBg}
          onPress={() => router.push('/wellness-hub/mood-tracker')}
        />

        {/* Section: Physical Activity */}
        <Text style={styles.sectionTitle}>💪 Aktivitas Fisik</Text>
        <HubCard
          title="Panduan Olahraga"
          subtitle="Yoga prenatal, kegel & stretching"
          icon="fitness-outline"
          color={Colors.mintGreen}
          bgColor={Colors.mintGreenBg}
          onPress={() => router.push('/wellness-hub/exercise-guide')}
        />

        {/* Section: Preparation */}
        <Text style={styles.sectionTitle}>🧳 Persiapan Persalinan</Text>
        <HubCard
          title="Tas Rumah Sakit"
          subtitle="Checklist perlengkapan persalinan"
          icon="bag-handle-outline"
          color={Colors.primary}
          bgColor={Colors.primaryBg}
          onPress={() => router.push('/wellness-hub/hospital-bag')}
        />

        {/* Section: Community */}
        <Text style={styles.sectionTitle}>👥 Komunitas & Koneksi</Text>
        <View style={styles.gridRow}>
          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: Colors.skyBlueBg, borderColor: Colors.skyBlue + '30' }]}
            onPress={() => router.push('/wellness-hub/community')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridCardIcon, { backgroundColor: Colors.skyBlue + '20' }]}>
              <Ionicons name="chatbubbles-outline" size={24} color={Colors.skyBlue} />
            </View>
            <Text style={[styles.gridCardTitle, { color: Colors.skyBlue }]}>Forum</Text>
            <Text style={styles.gridCardSub}>Diskusi anonim</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, { backgroundColor: Colors.skyBlueBg, borderColor: Colors.skyBlue + '30' }]}
            onPress={() => router.push('/wellness-hub/partner-mode')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridCardIcon, { backgroundColor: Colors.skyBlue + '20' }]}>
              <Ionicons name="people-outline" size={24} color={Colors.skyBlue} />
            </View>
            <Text style={[styles.gridCardTitle, { color: Colors.skyBlue }]}>Partner Mode</Text>
            <Text style={styles.gridCardSub}>Akses Suami</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.massive }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  heroBanner: {
    backgroundColor: Colors.mintGreenBg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.mintGreenLight,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.mintGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.mintGreenDark,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  hubCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    ...Shadow.sm,
  },
  hubCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  hubCardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  hubCardSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  hubCardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  gridCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
    ...Shadow.sm,
  },
  gridCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  gridCardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  gridCardSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});

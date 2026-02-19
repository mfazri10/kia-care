// KIA Care - Dashboard (Hari Ini)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, phaseConfig } from '@/constants/theme';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  getPregnancyWeek,
  getDaysUntilDue,
  getEstimatedDueDate,
  formatDateID,
  getBabyAgeText,
  getTodayISO,
  getTrimester,
} from '@/utils/date';
import { getTTDLog, getANCVisits, getKFVisits, getBreastfeedingSessions } from '@/utils/storage';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeProfile } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [ttdCount, setTtdCount] = useState(0);
  const [ancCompleted, setAncCompleted] = useState(0);
  const [kfCompleted, setKfCompleted] = useState(0);
  const [todayFeedings, setTodayFeedings] = useState(0);

  const loadDashboardData = useCallback(async () => {
    if (!activeProfile) return;
    try {
      const [ttdLog, ancVisits, kfVisits, sessions] = await Promise.all([
        getTTDLog(),
        getANCVisits(),
        getKFVisits(),
        getBreastfeedingSessions(),
      ]);

      const profileTTD = (ttdLog || []).filter(
        (t: any) => t.profileId === activeProfile.id && t.taken
      );
      setTtdCount(profileTTD.length);

      const profileANC = (ancVisits || []).filter(
        (v: any) => v.profileId === activeProfile.id && v.completed
      );
      setAncCompleted(profileANC.length);

      const profileKF = (kfVisits || []).filter(
        (v: any) => v.profileId === activeProfile.id && v.completed
      );
      setKfCompleted(profileKF.length);

      const today = getTodayISO();
      const todaySessions = (sessions || []).filter(
        (s: any) => s.profileId === activeProfile.id && s.startTime.startsWith(today)
      );
      setTodayFeedings(todaySessions.length);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (!activeProfile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Tidak ada profil aktif</Text>
      </View>
    );
  }

  const phase = activeProfile.phase;
  const config = phaseConfig[phase];
  const today = new Date();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const dateStr = `${dayNames[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  // Pregnancy-specific data
  const pregnancyWeek = phase === 'hamil' && activeProfile.hpht ? getPregnancyWeek(activeProfile.hpht) : 0;
  const daysUntilDue = phase === 'hamil' && activeProfile.hpht ? getDaysUntilDue(activeProfile.hpht) : 0;
  const trimester = getTrimester(pregnancyWeek);
  const edd = phase === 'hamil' && activeProfile.hpht ? getEstimatedDueDate(activeProfile.hpht) : null;

  // Postpartum-specific data
  const babyAgeText = phase === 'pasca-melahirkan' && activeProfile.babyDob
    ? getBabyAgeText(activeProfile.babyDob)
    : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Halo, {activeProfile.name} 👋</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        <View style={[styles.phaseBadge, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon as any} size={16} color={config.color} />
          <Text style={[styles.phaseText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={config.color} />
        }
      >
        {/* Danger Signs Quick Access */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.dangerButton}
          onPress={() => router.push('/pregnancy/danger-signs')}
        >
          <View style={styles.dangerIcon}>
            <Ionicons name="warning" size={24} color={Colors.white} />
          </View>
          <View style={styles.dangerContent}>
            <Text style={styles.dangerTitle}>Tanda Bahaya</Text>
            <Text style={styles.dangerSubtitle}>Cek gejala darurat segera</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.danger} />
        </TouchableOpacity>

        {/* Phase-specific Hero Card */}
        {phase === 'hamil' && activeProfile.hpht && (
          <Card style={[styles.heroCard, { backgroundColor: config.color }]} variant="elevated">
            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroLabel}>Usia Kehamilan</Text>
                <Text style={styles.heroValue}>Minggu ke-{pregnancyWeek}</Text>
                <Text style={styles.heroSubtext}>Trimester {trimester}</Text>
              </View>
              <View style={styles.heroRight}>
                <View style={styles.heroCircle}>
                  <Text style={styles.heroCircleNumber}>{daysUntilDue}</Text>
                  <Text style={styles.heroCircleLabel}>hari lagi</Text>
                </View>
              </View>
            </View>
            {edd && (
              <View style={styles.heroFooter}>
                <Ionicons name="calendar" size={14} color={Colors.white + 'CC'} />
                <Text style={styles.heroFooterText}>
                  Perkiraan lahir: {formatDateID(edd.toISOString())}
                </Text>
              </View>
            )}
            <ProgressBar
              progress={Math.min(pregnancyWeek / 40, 1)}
              color={Colors.white}
              backgroundColor={Colors.white + '30'}
              height={6}
            />
          </Card>
        )}

        {phase === 'pasca-melahirkan' && activeProfile.babyDob && (
          <Card style={[styles.heroCard, { backgroundColor: config.color }]} variant="elevated">
            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroLabel}>
                  {activeProfile.babyName || 'Si Kecil'}
                </Text>
                <Text style={styles.heroValue}>{babyAgeText}</Text>
                <Text style={styles.heroSubtext}>
                  Lahir: {formatDateID(activeProfile.babyDob)}
                </Text>
              </View>
              <View style={styles.heroIconContainer}>
                <Ionicons name="happy" size={48} color={Colors.white + '80'} />
              </View>
            </View>
          </Card>
        )}

        {phase === 'pra-hamil' && (
          <Card style={[styles.heroCard, { backgroundColor: config.color }]} variant="elevated">
            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                <Text style={styles.heroLabel}>Program Pra Hamil</Text>
                <Text style={styles.heroValue}>Persiapan Kehamilan</Text>
                <Text style={styles.heroSubtext}>Mulai langkah sehat menuju kehamilan</Text>
              </View>
              <View style={styles.heroIconContainer}>
                <Ionicons name="heart" size={48} color={Colors.white + '80'} />
              </View>
            </View>
          </Card>
        )}

        {/* Today's Tasks */}
        <Text style={styles.sectionTitle}>Tugas Hari Ini</Text>

        {phase === 'hamil' && (
          <View style={styles.tasksGrid}>
            <Card style={styles.taskCard} onPress={() => router.push('/pregnancy/ttd')}>
              <View style={[styles.taskIcon, { backgroundColor: Colors.accentBg }]}>
                <Ionicons name="medical" size={24} color={Colors.accent} />
              </View>
              <Text style={styles.taskTitle}>Tablet Tambah Darah</Text>
              <Text style={styles.taskSubtitle}>{ttdCount}/90 tablet</Text>
              <ProgressBar progress={ttdCount / 90} color={Colors.accent} height={4} />
            </Card>

            <Card style={styles.taskCard} onPress={() => router.push('/pregnancy/anc')}>
              <View style={[styles.taskIcon, { backgroundColor: Colors.secondaryBg }]}>
                <Ionicons name="medkit" size={24} color={Colors.secondary} />
              </View>
              <Text style={styles.taskTitle}>Kunjungan ANC</Text>
              <Text style={styles.taskSubtitle}>{ancCompleted}/6 kunjungan</Text>
              <ProgressBar progress={ancCompleted / 6} color={Colors.secondary} height={4} />
            </Card>
          </View>
        )}

        {phase === 'pasca-melahirkan' && (
          <View style={styles.tasksGrid}>
            <Card style={styles.taskCard} onPress={() => router.push('/postpartum/kf-visits')}>
              <View style={[styles.taskIcon, { backgroundColor: Colors.secondaryBg }]}>
                <Ionicons name="medkit" size={24} color={Colors.secondary} />
              </View>
              <Text style={styles.taskTitle}>Kunjungan Nifas</Text>
              <Text style={styles.taskSubtitle}>{kfCompleted}/4 kunjungan</Text>
              <ProgressBar progress={kfCompleted / 4} color={Colors.secondary} height={4} />
            </Card>

            <Card style={styles.taskCard} onPress={() => router.push('/postpartum/breastfeeding')}>
              <View style={[styles.taskIcon, { backgroundColor: Colors.primaryBg }]}>
                <Ionicons name="water" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.taskTitle}>Menyusui Hari Ini</Text>
              <Text style={styles.taskSubtitle}>{todayFeedings} sesi</Text>
            </Card>
          </View>
        )}

        {phase === 'pra-hamil' && (
          <View style={styles.tasksGrid}>
            <Card style={styles.taskCard} onPress={() => router.push('/pre-pregnancy/checklist')}>
              <View style={[styles.taskIcon, { backgroundColor: Colors.praHamilBg }]}>
                <Ionicons name="checkbox" size={24} color={Colors.praHamil} />
              </View>
              <Text style={styles.taskTitle}>Checklist Persiapan</Text>
              <Text style={styles.taskSubtitle}>Persiapan sebelum hamil</Text>
            </Card>

            <Card style={styles.taskCard} onPress={() => router.push('/pre-pregnancy/fertility')}>
              <View style={[styles.taskIcon, { backgroundColor: Colors.accentBg }]}>
                <Ionicons name="calendar" size={24} color={Colors.accent} />
              </View>
              <Text style={styles.taskTitle}>Kalender Kesuburan</Text>
              <Text style={styles.taskSubtitle}>Lacak masa subur</Text>
            </Card>
          </View>
        )}

        {/* Quick Access Menu */}
        <Text style={styles.sectionTitle}>Menu Cepat</Text>

        {phase === 'hamil' && (
          <View style={styles.menuGrid}>
            <MenuButton
              icon="analytics-outline"
              label="Timeline"
              color={Colors.primary}
              onPress={() => router.push('/pregnancy/timeline')}
            />
            <MenuButton
              icon="document-text-outline"
              label="P4K"
              color={Colors.secondary}
              onPress={() => router.push('/pregnancy/p4k')}
            />
            <MenuButton
              icon="warning-outline"
              label="Tanda Bahaya"
              color={Colors.danger}
              onPress={() => router.push('/pregnancy/danger-signs')}
            />
            <MenuButton
              icon="book-outline"
              label="Edukasi"
              color={Colors.accent}
              onPress={() => router.push('/(tabs)/education')}
            />
          </View>
        )}

        {phase === 'pasca-melahirkan' && (
          <View style={styles.menuGrid}>
            <MenuButton
              icon="water-outline"
              label="Stok ASI"
              color={Colors.primary}
              onPress={() => router.push('/postpartum/milk-stock')}
            />
            <MenuButton
              icon="trending-up-outline"
              label="Tumbuh Kembang"
              color={Colors.secondary}
              onPress={() => router.push('/postpartum/baby-growth')}
            />
            <MenuButton
              icon="heart-outline"
              label="Baby Blues"
              color={Colors.praHamil}
              onPress={() => router.push('/postpartum/baby-blues')}
            />
            <MenuButton
              icon="warning-outline"
              label="Tanda Bahaya"
              color={Colors.danger}
              onPress={() => router.push('/pregnancy/danger-signs')}
            />
          </View>
        )}

        {phase === 'pra-hamil' && (
          <View style={styles.menuGrid}>
            <MenuButton
              icon="list-outline"
              label="Checklist"
              color={Colors.praHamil}
              onPress={() => router.push('/pre-pregnancy/checklist')}
            />
            <MenuButton
              icon="flower-outline"
              label="Kesuburan"
              color={Colors.accent}
              onPress={() => router.push('/pre-pregnancy/fertility')}
            />
            <MenuButton
              icon="book-outline"
              label="Edukasi"
              color={Colors.secondary}
              onPress={() => router.push('/(tabs)/education')}
            />
            <MenuButton
              icon="calendar-outline"
              label="Kalender"
              color={Colors.primary}
              onPress={() => router.push('/(tabs)/calendar')}
            />
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

function MenuButton({ icon, label, color, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuButton} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  date: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  phaseText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.massive,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dangerLight,
  },
  dangerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  dangerContent: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.danger,
  },
  dangerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.danger + 'AA',
  },
  heroCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroLeft: {
    flex: 1,
  },
  heroRight: {},
  heroLabel: {
    fontSize: FontSize.sm,
    color: Colors.white + 'CC',
    fontWeight: FontWeight.medium,
  },
  heroValue: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginVertical: Spacing.xs,
  },
  heroSubtext: {
    fontSize: FontSize.sm,
    color: Colors.white + 'BB',
  },
  heroCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCircleNumber: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  heroCircleLabel: {
    fontSize: FontSize.xs,
    color: Colors.white + 'CC',
  },
  heroIconContainer: {
    marginLeft: Spacing.md,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  heroFooterText: {
    fontSize: FontSize.xs,
    color: Colors.white + 'CC',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tasksGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  taskCard: {
    flex: 1,
    padding: Spacing.md,
  },
  taskIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  taskTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  taskSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  menuButton: {
    width: '22%',
    alignItems: 'center',
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  menuLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: FontWeight.medium,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.huge,
  },
});

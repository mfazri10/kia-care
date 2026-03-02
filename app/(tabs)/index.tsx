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
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow, phaseConfig } from '@/constants/theme';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import SectionTitle from '@/components/ui/SectionTitle';
import PrimaryButton from '@/components/ui/PrimaryButton';
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
import type { Phase } from '@/types';

// Daily reminders data per phase
function getDailyReminders(phase: Phase, pregnancyWeek: number): { id: string; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; color: string; done: boolean }[] {
  switch (phase) {
    case 'pra-hamil':
      return [
        { id: 'r1', icon: 'medical-outline', title: 'Minum Asam Folat', subtitle: '400 mcg per hari', color: Colors.praHamil, done: false },
        { id: 'r2', icon: 'walk-outline', title: 'Olahraga Ringan', subtitle: '30 menit jalan kaki', color: Colors.secondary, done: false },
        { id: 'r3', icon: 'book-outline', title: 'Edukasi Minggu Ini', subtitle: 'Baca artikel tentang kesuburan', color: Colors.accent, done: false },
        { id: 'r4', icon: 'calendar-outline', title: 'Catat Siklus Menstruasi', subtitle: 'Lacak masa subur Anda', color: Colors.primary, done: false },
      ];
    case 'hamil':
      return [
        { id: 'r1', icon: 'medical-outline', title: 'Minum TTD', subtitle: 'Tablet Tambah Darah harian', color: Colors.accent, done: false },
        { id: 'r2', icon: 'medkit-outline', title: 'Jadwal ANC', subtitle: pregnancyWeek < 12 ? 'K1 (0-12 minggu)' : pregnancyWeek < 24 ? 'K2 (13-24 minggu)' : 'K3-K6 (>24 minggu)', color: Colors.secondary, done: false },
        { id: 'r3', icon: 'nutrition-outline', title: 'Makan Bergizi', subtitle: 'Protein, sayur, buah', color: Colors.success, done: false },
        { id: 'r4', icon: 'book-outline', title: 'Edukasi Minggu Ini', subtitle: `Artikel minggu ke-${pregnancyWeek}`, color: Colors.primary, done: false },
      ];
    case 'pasca-melahirkan':
      return [
        { id: 'r1', icon: 'water-outline', title: 'Log Menyusui', subtitle: 'Catat sesi menyusui hari ini', color: Colors.primary, done: false },
        { id: 'r2', icon: 'medkit-outline', title: 'Jadwal KF', subtitle: 'Kunjungan nifas berikutnya', color: Colors.pascaMelahirkan, done: false },
        { id: 'r3', icon: 'happy-outline', title: 'Cek Kesehatan Mental', subtitle: 'Pantau mood dan perasaan', color: Colors.praHamil, done: false },
        { id: 'r4', icon: 'book-outline', title: 'Edukasi Minggu Ini', subtitle: 'Tips perawatan bayi', color: Colors.accent, done: false },
      ];
    default:
      return [];
  }
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeProfile } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [ttdCount, setTtdCount] = useState(0);
  const [ancCompleted, setAncCompleted] = useState(0);
  const [kfCompleted, setKfCompleted] = useState(0);
  const [todayFeedings, setTodayFeedings] = useState(0);
  const [reminders, setReminders] = useState<{ id: string; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; color: string; done: boolean }[]>([]);

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

  useEffect(() => {
    if (activeProfile) {
      const pregnancyWeek = activeProfile.phase === 'hamil' && activeProfile.hpht ? getPregnancyWeek(activeProfile.hpht) : 0;
      setReminders(getDailyReminders(activeProfile.phase, pregnancyWeek));
    }
  }, [activeProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const toggleReminder = useCallback((id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r))
    );
  }, []);

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

  // Status text
  const getStatusText = (): string => {
    switch (phase) {
      case 'hamil':
        return pregnancyWeek > 0 ? `Minggu ke-${pregnancyWeek}` : 'Kehamilan';
      case 'pasca-melahirkan':
        return babyAgeText ? `Nifas · ${babyAgeText}` : 'Pasca Melahirkan';
      case 'pra-hamil':
        return 'Program Pra Hamil';
      default:
        return '';
    }
  };

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
        {/* Profile Summary Card */}
        <Card style={[styles.profileSummaryCard, { borderLeftWidth: 4, borderLeftColor: config.color }]} variant="elevated">
          <View style={styles.profileSummaryRow}>
            <View style={[styles.profileAvatar, { backgroundColor: config.color + '20' }]}>
              <Text style={[styles.profileAvatarText, { color: config.color }]}>
                {activeProfile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileSummaryInfo}>
              <Text style={styles.profileSummaryName}>{activeProfile.name}</Text>
              <Text style={[styles.profileSummaryStatus, { color: config.color }]}>{getStatusText()}</Text>
              <View style={styles.profileSummaryMeta}>
                {activeProfile.age > 0 && (
                  <Text style={styles.metaText}>Usia: {activeProfile.age} th</Text>
                )}
                {activeProfile.weight > 0 && (
                  <Text style={styles.metaText}>BB: {activeProfile.weight} kg</Text>
                )}
              </View>
            </View>
          </View>
        </Card>

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

        {/* Daily Reminders */}
        <SectionTitle
          title="Pengingat Hari Ini"
          icon="notifications-outline"
          subtitle={`${reminders.filter((r) => r.done).length}/${reminders.length} selesai`}
        />
        {reminders.map((reminder) => (
          <TouchableOpacity
            key={reminder.id}
            style={[styles.reminderItem, reminder.done && styles.reminderItemDone]}
            onPress={() => toggleReminder(reminder.id)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.reminderCheckbox,
              reminder.done && { backgroundColor: Colors.success, borderColor: Colors.success },
            ]}>
              {reminder.done && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </View>
            <View style={[styles.reminderIcon, { backgroundColor: reminder.color + '15' }]}>
              <Ionicons name={reminder.icon} size={20} color={reminder.done ? Colors.textTertiary : reminder.color} />
            </View>
            <View style={styles.reminderContent}>
              <Text style={[styles.reminderTitle, reminder.done && styles.reminderTitleDone]}>
                {reminder.title}
              </Text>
              <Text style={styles.reminderSubtitle}>{reminder.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Quick Action Buttons */}
        <SectionTitle
          title="Aksi Cepat"
          icon="flash-outline"
        />
        <View style={styles.quickActionsGrid}>
          {/* Phase-specific quick actions */}
          {phase === 'hamil' && (
            <>
              <PrimaryButton
                title="Log TTD"
                subtitle="Catat minum tablet"
                icon="medical-outline"
                color={Colors.accent}
                onPress={() => router.push('/(tabs)/kesehatan')}
                style={styles.quickActionButton}
              />
              <PrimaryButton
                title="Cek Tanda Bahaya"
                subtitle="Periksa gejala darurat"
                icon="warning-outline"
                color={Colors.danger}
                onPress={() => router.push('/red-flag')}
                style={styles.quickActionButton}
              />
              <PrimaryButton
                title="Tambah Catatan"
                subtitle="BB & Tekanan Darah"
                icon="create-outline"
                color={Colors.secondary}
                onPress={() => router.push('/(tabs)/kesehatan')}
                style={styles.quickActionButton}
              />
              <PrimaryButton
                title="Jadwal ANC"
                subtitle={`${ancCompleted}/6 kunjungan`}
                icon="medkit-outline"
                color={Colors.primary}
                onPress={() => router.push('/(tabs)/kesehatan')}
                style={styles.quickActionButton}
              />
            </>
          )}

          {phase === 'pasca-melahirkan' && (
            <>
              <PrimaryButton
                title="Log Menyusui"
                subtitle="Catat sesi hari ini"
                icon="water-outline"
                color={Colors.primary}
                onPress={() => router.push('/(tabs)/kesehatan')}
                style={styles.quickActionButton}
              />
              <PrimaryButton
                title="Cek Tanda Bahaya"
                subtitle="Tanda bahaya nifas"
                icon="warning-outline"
                color={Colors.danger}
                onPress={() => router.push('/red-flag')}
                style={styles.quickActionButton}
              />
              <PrimaryButton
                title="Tumbuh Kembang"
                subtitle="Kurva pertumbuhan WHO"
                icon="trending-up-outline"
                color={Colors.secondary}
                onPress={() => router.push('/growth-chart')}
                style={styles.quickActionButton}
              />
              <PrimaryButton
                title="Jadwal KF"
                subtitle={`${kfCompleted}/4 kunjungan`}
                icon="medkit-outline"
                color={Colors.pascaMelahirkan}
                onPress={() => router.push('/(tabs)/kesehatan')}
                style={styles.quickActionButton}
              />
            </>
          )}

          {phase === 'pra-hamil' && (
            <>
              <PrimaryButton
                title="Checklist Persiapan"
                subtitle="Cek kesiapan Anda"
                icon="checkbox-outline"
                color={Colors.praHamil}
                onPress={() => router.push('/(tabs)/kesehatan')}
                style={styles.quickActionButton}
              />
              <PrimaryButton
                title="Kalender Kesuburan"
                subtitle="Hitung masa subur"
                icon="flower-outline"
                color={Colors.accent}
                onPress={() => router.push('/(tabs)/kesehatan')}
                style={styles.quickActionButton}
              />
              <PrimaryButton
                title="Tambah Catatan"
                subtitle="Catatan kesehatan"
                icon="create-outline"
                color={Colors.secondary}
                onPress={() => router.push('/(tabs)/kesehatan')}
                style={styles.quickActionButton}
              />
              <PrimaryButton
                title="Edukasi"
                subtitle="Artikel pra-hamil"
                icon="book-outline"
                color={Colors.primary}
                onPress={() => router.push('/(tabs)/education')}
                style={styles.quickActionButton}
              />
            </>
          )}
        </View>

        {/* Today's Tasks */}
        <SectionTitle
          title="Ringkasan Tugas"
          icon="list-outline"
        />

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

        {/* Red Flag Emergency System Card */}
        <SectionTitle
          title="Deteksi Dini"
          icon="shield-checkmark-outline"
        />
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.redFlagCard}
          onPress={() => router.push('/red-flag')}
        >
          <View style={styles.redFlagLeft}>
            <View style={styles.redFlagIconContainer}>
              <Ionicons name="warning" size={28} color={Colors.white} />
            </View>
          </View>
          <View style={styles.redFlagContent}>
            <Text style={styles.redFlagTitle}>Cek Tanda Bahaya</Text>
            <Text style={styles.redFlagSubtitle}>Deteksi dini risiko kehamilan & bayi</Text>
            <View style={styles.redFlagButton}>
              <Text style={styles.redFlagButtonText}>Mulai Pemeriksaan</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.white} />
            </View>
          </View>
        </TouchableOpacity>

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

        <View style={{ height: Spacing.xxl }} />
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

  // Profile Summary
  profileSummaryCard: {
    marginBottom: Spacing.md,
  },
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  profileAvatarText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  profileSummaryInfo: {
    flex: 1,
  },
  profileSummaryName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  profileSummaryStatus: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginTop: 2,
  },
  profileSummaryMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // Red Flag Emergency Card
  redFlagCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dangerLight,
    ...Shadow.md,
  },
  redFlagLeft: {
    marginRight: Spacing.lg,
  },
  redFlagIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  redFlagContent: {
    flex: 1,
  },
  redFlagTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  redFlagSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  redFlagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignSelf: 'flex-start',
    gap: Spacing.sm,
  },
  redFlagButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },

  // Danger Button
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
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

  // Hero Card
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

  // Reminders
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  reminderItemDone: {
    backgroundColor: Colors.successBg,
  },
  reminderCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  reminderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  reminderTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  reminderSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Quick Actions
  quickActionsGrid: {
    gap: Spacing.sm,
  },
  quickActionButton: {
    marginBottom: 0,
  },

  // Tasks
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
  errorText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.huge,
  },
});

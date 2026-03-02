// KIA Care - Dashboard Imunisasi (Immunization Dashboard)
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';

type VaccineStatus = 'lengkap' | 'terlewat' | 'akan-datang';

interface Vaccine {
  id: string;
  name: string;
  description: string;
  ageMonths: number; // recommended age in months
  done: boolean;
  dateGiven: string;
  status: VaccineStatus;
}

function getStatusConfig(status: VaccineStatus) {
  switch (status) {
    case 'lengkap':
      return { label: 'Lengkap', color: Colors.success, bg: Colors.successBg, icon: 'checkmark-circle' as const };
    case 'terlewat':
      return { label: 'Terlewat', color: Colors.danger, bg: Colors.dangerBg, icon: 'alert-circle' as const };
    case 'akan-datang':
      return { label: 'Akan Datang', color: '#3498DB', bg: '#EBF5FB', icon: 'time' as const };
  }
}

const MANDATORY_VACCINES: Omit<Vaccine, 'done' | 'dateGiven' | 'status'>[] = [
  { id: 'hb0', name: 'Hepatitis B-0', description: 'Diberikan saat lahir (0-24 jam)', ageMonths: 0 },
  { id: 'bcg', name: 'BCG', description: 'Diberikan usia 0-1 bulan', ageMonths: 1 },
  { id: 'polio1', name: 'Polio 1 (OPV)', description: 'Diberikan usia 1 bulan', ageMonths: 1 },
  { id: 'dpt1', name: 'DPT-HB-Hib 1', description: 'Diberikan usia 2 bulan', ageMonths: 2 },
  { id: 'polio2', name: 'Polio 2 (OPV)', description: 'Diberikan usia 2 bulan', ageMonths: 2 },
  { id: 'dpt2', name: 'DPT-HB-Hib 2', description: 'Diberikan usia 3 bulan', ageMonths: 3 },
  { id: 'polio3', name: 'Polio 3 (OPV)', description: 'Diberikan usia 3 bulan', ageMonths: 3 },
  { id: 'dpt3', name: 'DPT-HB-Hib 3', description: 'Diberikan usia 4 bulan', ageMonths: 4 },
  { id: 'polio4', name: 'Polio 4 (IPV)', description: 'Diberikan usia 4 bulan', ageMonths: 4 },
  { id: 'campak1', name: 'Campak / MR 1', description: 'Diberikan usia 9 bulan', ageMonths: 9 },
  { id: 'dpt4', name: 'DPT-HB-Hib Lanjutan', description: 'Diberikan usia 18 bulan', ageMonths: 18 },
  { id: 'campak2', name: 'Campak / MR 2', description: 'Diberikan usia 18 bulan', ageMonths: 18 },
];

function calculateBabyAgeMonths(babyDob?: string): number {
  if (!babyDob) return 0;
  const now = new Date();
  const dob = new Date(babyDob);
  const diffMs = now.getTime() - dob.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
}

function getInitialVaccineStatus(ageMonths: number, vaccineAgeMonths: number): VaccineStatus {
  if (ageMonths >= vaccineAgeMonths + 2) return 'terlewat';
  if (ageMonths >= vaccineAgeMonths) return 'akan-datang';
  return 'akan-datang';
}

export default function ImmunizationDashboardScreen() {
  const { activeProfile } = useApp();
  const babyAgeMonths = calculateBabyAgeMonths(activeProfile?.babyDob);

  const [vaccines, setVaccines] = useState<Vaccine[]>(() =>
    MANDATORY_VACCINES.map(v => ({
      ...v,
      done: false,
      dateGiven: '',
      status: getInitialVaccineStatus(babyAgeMonths, v.ageMonths),
    }))
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');

  const completedCount = useMemo(() => vaccines.filter(v => v.done).length, [vaccines]);
  const totalCount = vaccines.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  // Next upcoming immunization
  const nextVaccine = useMemo(() => {
    const upcoming = vaccines.filter(v => !v.done).sort((a, b) => a.ageMonths - b.ageMonths);
    return upcoming[0] || null;
  }, [vaccines]);

  const nextDate = useMemo(() => {
    if (!nextVaccine || !activeProfile?.babyDob) return null;
    const dob = new Date(activeProfile.babyDob);
    const targetDate = new Date(dob);
    targetDate.setMonth(targetDate.getMonth() + nextVaccine.ageMonths);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${targetDate.getDate()} ${months[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
  }, [nextVaccine, activeProfile?.babyDob]);

  const toggleVaccine = useCallback((id: string) => {
    setVaccines(prev =>
      prev.map(v => {
        if (v.id !== id) return v;
        const newDone = !v.done;
        return {
          ...v,
          done: newDone,
          dateGiven: newDone ? (v.dateGiven || new Date().toISOString().split('T')[0]) : '',
          status: newDone ? 'lengkap' : getInitialVaccineStatus(babyAgeMonths, v.ageMonths),
        };
      })
    );
  }, [babyAgeMonths]);

  const handleSaveDate = useCallback((id: string) => {
    if (!editDate.trim()) {
      Alert.alert('Perhatian', 'Masukkan tanggal pemberian vaksin.');
      return;
    }
    setVaccines(prev =>
      prev.map(v => v.id === id ? { ...v, dateGiven: editDate } : v)
    );
    setEditingId(null);
    setEditDate('');
  }, [editDate]);

  return (
    <View style={styles.container}>
      <Header
        title="Dashboard Imunisasi"
        subtitle="Jadwal & catatan imunisasi anak"
        showBack
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Reminder Card */}
        {nextVaccine && (
          <Card style={styles.reminderCard} variant="elevated">
            <View style={styles.reminderBadge}>
              <Ionicons name="notifications" size={16} color={Colors.white} />
              <Text style={styles.reminderBadgeText}>Pengingat</Text>
            </View>
            <View style={styles.reminderContent}>
              <View style={styles.reminderIconContainer}>
                <Ionicons name="medkit" size={32} color={Colors.primary} />
              </View>
              <View style={styles.reminderTextContainer}>
                <Text style={styles.reminderTitle}>Imunisasi Berikutnya</Text>
                <Text style={styles.reminderVaccineName}>{nextVaccine.name}</Text>
                {nextDate && (
                  <View style={styles.reminderDateRow}>
                    <Ionicons name="calendar" size={14} color={Colors.textSecondary} />
                    <Text style={styles.reminderDate}>{nextDate}</Text>
                  </View>
                )}
                <Text style={styles.reminderAge}>Usia {nextVaccine.ageMonths} bulan</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Progress Card */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleRow}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.secondary} />
              <Text style={styles.progressTitle}>Imunisasi Lengkap</Text>
            </View>
            <Text style={[styles.progressCount, { color: Colors.secondary }]}>
              {completedCount} dari {totalCount}
            </Text>
          </View>
          <ProgressBar
            progress={progress}
            color={Colors.secondary}
            height={10}
          />
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelLeft}>
              {Math.round(progress * 100)}% selesai
            </Text>
            <Text style={styles.progressLabelRight}>
              {totalCount - completedCount} tersisa
            </Text>
          </View>
        </Card>

        {/* Status Legend */}
        <View style={styles.legendRow}>
          {(['lengkap', 'terlewat', 'akan-datang'] as VaccineStatus[]).map((status) => {
            const config = getStatusConfig(status);
            return (
              <View key={status} style={[styles.legendBadge, { backgroundColor: config.bg }]}>
                <View style={[styles.legendDot, { backgroundColor: config.color }]} />
                <Text style={[styles.legendText, { color: config.color }]}>{config.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Vaccine List */}
        <View style={styles.sectionHeader}>
          <Ionicons name="list" size={20} color={Colors.textPrimary} />
          <Text style={styles.sectionTitle}>Daftar Vaksin Wajib</Text>
        </View>

        {vaccines.map((vaccine) => {
          const displayStatus = vaccine.done ? 'lengkap' : vaccine.status;
          const statusConfig = getStatusConfig(displayStatus);
          const isEditing = editingId === vaccine.id;

          return (
            <Card key={vaccine.id} style={styles.vaccineCard}>
              <View style={styles.vaccineRow}>
                {/* Toggle */}
                <TouchableOpacity
                  style={[
                    styles.vaccineToggle,
                    vaccine.done && { backgroundColor: Colors.success, borderColor: Colors.success },
                  ]}
                  onPress={() => toggleVaccine(vaccine.id)}
                  activeOpacity={0.7}
                >
                  {vaccine.done && <Ionicons name="checkmark" size={16} color={Colors.white} />}
                </TouchableOpacity>

                {/* Info */}
                <View style={styles.vaccineInfo}>
                  <View style={styles.vaccineNameRow}>
                    <Text style={[
                      styles.vaccineName,
                      vaccine.done && styles.vaccineNameDone,
                    ]}>
                      {vaccine.name}
                    </Text>
                    <View style={[styles.vaccineBadge, { backgroundColor: statusConfig.bg }]}>
                      <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
                      <Text style={[styles.vaccineBadgeText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.vaccineDesc}>{vaccine.description}</Text>

                  {/* Date given */}
                  {vaccine.done && vaccine.dateGiven && !isEditing && (
                    <TouchableOpacity
                      style={styles.dateGivenRow}
                      onPress={() => {
                        setEditingId(vaccine.id);
                        setEditDate(vaccine.dateGiven);
                      }}
                    >
                      <Ionicons name="calendar-outline" size={12} color={Colors.success} />
                      <Text style={styles.dateGivenText}>Diberikan: {vaccine.dateGiven}</Text>
                      <Ionicons name="pencil-outline" size={12} color={Colors.textTertiary} />
                    </TouchableOpacity>
                  )}

                  {/* Date edit */}
                  {isEditing && (
                    <View style={styles.dateEditRow}>
                      <TextInput
                        style={styles.dateInput}
                        value={editDate}
                        onChangeText={setEditDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={Colors.textTertiary}
                      />
                      <TouchableOpacity
                        style={styles.dateSaveBtn}
                        onPress={() => handleSaveDate(vaccine.id)}
                      >
                        <Ionicons name="checkmark" size={16} color={Colors.white} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.dateCancelBtn}
                        onPress={() => { setEditingId(null); setEditDate(''); }}
                      >
                        <Ionicons name="close" size={16} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          );
        })}

        {/* Summary Footer */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: Colors.success }]}>{completedCount}</Text>
              <Text style={styles.summaryLabel}>Selesai</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: Colors.danger }]}>
                {vaccines.filter(v => !v.done && v.status === 'terlewat').length}
              </Text>
              <Text style={styles.summaryLabel}>Terlewat</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: '#3498DB' }]}>
                {vaccines.filter(v => !v.done && v.status === 'akan-datang').length}
              </Text>
              <Text style={styles.summaryLabel}>Akan Datang</Text>
            </View>
          </View>
        </Card>

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
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },

  // Reminder Card
  reminderCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    overflow: 'hidden',
  },
  reminderBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: BorderRadius.md,
    gap: 4,
  },
  reminderBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  reminderIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  reminderTextContainer: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  reminderVaccineName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  reminderDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  reminderDate: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  reminderAge: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },

  // Progress
  progressCard: {
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  progressCount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  progressLabelLeft: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  progressLabelRight: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  legendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  // Vaccine Card
  vaccineCard: {
    marginBottom: Spacing.sm,
  },
  vaccineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  vaccineToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  vaccineInfo: {
    flex: 1,
  },
  vaccineNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  vaccineName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  vaccineNameDone: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  vaccineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 3,
    marginLeft: Spacing.sm,
  },
  vaccineBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  vaccineDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  dateGivenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  dateGivenText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    flex: 1,
  },

  // Date edit
  dateEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  dateInput: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateSaveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCancelBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Summary
  summaryCard: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.surfaceSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
});

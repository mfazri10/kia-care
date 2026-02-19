import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { KF_SCHEDULE } from '@/constants/data';
import { getKFVisits, saveKFVisits } from '@/utils/storage';
import { formatDateID, getTodayISO } from '@/utils/date';
import { KFVisit, KFChecklist } from '@/types';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import ChecklistItem from '@/components/ui/ChecklistItem';
import Button from '@/components/ui/Button';

const DEFAULT_CHECKLIST: KFChecklist = {
  tekananDarah: false,
  suhuTubuh: false,
  pendarahan: false,
  kondisiPerineum: false,
  tandaInfeksi: false,
  kontraksiRahim: false,
  tinggiRahim: false,
  asi: false,
  kesehatanMental: false,
};

const CHECKLIST_LABELS: Record<keyof KFChecklist, string> = {
  tekananDarah: 'Tekanan Darah',
  suhuTubuh: 'Suhu Tubuh',
  pendarahan: 'Pendarahan',
  kondisiPerineum: 'Kondisi Perineum',
  tandaInfeksi: 'Tanda Infeksi',
  kontraksiRahim: 'Kontraksi Rahim',
  tinggiRahim: 'Tinggi Rahim',
  asi: 'ASI & Menyusui',
  kesehatanMental: 'Kesehatan Mental',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default function KFVisitsScreen() {
  const { activeProfile } = useApp();
  const [visits, setVisits] = useState<KFVisit[]>([]);
  const [expandedVisit, setExpandedVisit] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadVisits = useCallback(async () => {
    if (!activeProfile) return;
    try {
      setIsLoading(true);
      const stored = await getKFVisits();
      const profileVisits = (stored || []).filter(
        (v: KFVisit) => v.profileId === activeProfile.id
      );

      if (profileVisits.length === 0) {
        const initialVisits: KFVisit[] = KF_SCHEDULE.map((schedule) => ({
          id: generateId(),
          profileId: activeProfile.id,
          visitNumber: schedule.visitNumber,
          scheduledDate: getTodayISO(),
          completed: false,
          checklist: { ...DEFAULT_CHECKLIST },
        }));
        setVisits(initialVisits);
        await saveKFVisits([...(stored || []), ...initialVisits]);
      } else {
        setVisits(profileVisits);
      }
    } catch (error) {
      console.error('Gagal memuat data kunjungan KF:', error);
      Alert.alert('Kesalahan', 'Gagal memuat data kunjungan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  const persistVisits = async (updatedVisits: KFVisit[]) => {
    if (!activeProfile) return;
    try {
      setIsSaving(true);
      const allStored = (await getKFVisits()) || [];
      const otherVisits = allStored.filter(
        (v: KFVisit) => v.profileId !== activeProfile.id
      );
      await saveKFVisits([...otherVisits, ...updatedVisits]);
    } catch (error) {
      console.error('Gagal menyimpan data kunjungan KF:', error);
      Alert.alert('Kesalahan', 'Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCompletion = async (visitNumber: number) => {
    const updated = visits.map((v) => {
      if (v.visitNumber === visitNumber) {
        const nowCompleted = !v.completed;
        return {
          ...v,
          completed: nowCompleted,
          completedDate: nowCompleted ? new Date().toISOString() : undefined,
        };
      }
      return v;
    });
    setVisits(updated);
    await persistVisits(updated);
  };

  const toggleChecklistItem = async (visitNumber: number, key: keyof KFChecklist) => {
    const updated = visits.map((v) => {
      if (v.visitNumber === visitNumber) {
        return {
          ...v,
          checklist: {
            ...v.checklist,
            [key]: !v.checklist[key],
          },
        };
      }
      return v;
    });
    setVisits(updated);
    await persistVisits(updated);
  };

  const getCompletedCount = () => visits.filter((v) => v.completed).length;

  const getScheduleInfo = (visitNumber: number) =>
    KF_SCHEDULE.find((s) => s.visitNumber === visitNumber);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Header title="Kunjungan Nifas (KF)" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.pascaMelahirkan} />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title="Kunjungan Nifas (KF)" showBack subtitle="Jadwal kunjungan pasca melahirkan" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{getCompletedCount()}</Text>
              <Text style={styles.summaryLabel}>Selesai</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{4 - getCompletedCount()}</Text>
              <Text style={styles.summaryLabel}>Tersisa</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNumber, { color: Colors.pascaMelahirkan }]}>4</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
          </View>
        </Card>

        {/* Visit Cards */}
        {visits.map((visit) => {
          const schedule = getScheduleInfo(visit.visitNumber);
          if (!schedule) return null;

          const isExpanded = expandedVisit === visit.visitNumber;
          const checklistKeys = Object.keys(visit.checklist) as (keyof KFChecklist)[];
          const checkedCount = checklistKeys.filter((k) => visit.checklist[k]).length;

          return (
            <Card key={visit.id} style={styles.visitCard}>
              {/* Visit Header */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpandedVisit(isExpanded ? null : visit.visitNumber)}
              >
                <View style={styles.visitHeader}>
                  <View
                    style={[
                      styles.visitBadge,
                      visit.completed && styles.visitBadgeCompleted,
                    ]}
                  >
                    {visit.completed ? (
                      <Ionicons name="checkmark" size={20} color={Colors.white} />
                    ) : (
                      <Text style={styles.visitBadgeText}>{visit.visitNumber}</Text>
                    )}
                  </View>
                  <View style={styles.visitInfo}>
                    <Text style={styles.visitLabel}>{schedule.label}</Text>
                    <Text style={styles.visitTiming}>{schedule.description}</Text>
                  </View>
                  <View style={styles.visitRight}>
                    <View
                      style={[
                        styles.timingBadge,
                        visit.completed && styles.timingBadgeCompleted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.timingText,
                          visit.completed && styles.timingTextCompleted,
                        ]}
                      >
                        {visit.completed ? 'Selesai' : schedule.timing}
                      </Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={Colors.textSecondary}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Completed Date */}
              {visit.completed && visit.completedDate && (
                <View style={styles.completedDateRow}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.success} />
                  <Text style={styles.completedDateText}>
                    Selesai pada {formatDateID(visit.completedDate)}
                  </Text>
                </View>
              )}

              {/* Checklist Progress */}
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(checkedCount / checklistKeys.length) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {checkedCount}/{checklistKeys.length}
                </Text>
              </View>

              {/* Expanded Checklist */}
              {isExpanded && (
                <View style={styles.checklistContainer}>
                  <Text style={styles.checklistTitle}>Checklist Pemeriksaan</Text>
                  {checklistKeys.map((key) => (
                    <ChecklistItem
                      key={key}
                      title={CHECKLIST_LABELS[key]}
                      checked={visit.checklist[key]}
                      onToggle={() => toggleChecklistItem(visit.visitNumber, key)}
                      color={Colors.pascaMelahirkan}
                    />
                  ))}

                  <Text style={styles.keyChecksTitle}>Pemeriksaan Utama</Text>
                  {schedule.keyChecks.map((check, idx) => (
                    <View key={idx} style={styles.keyCheckItem}>
                      <Ionicons
                        name="ellipse"
                        size={6}
                        color={Colors.pascaMelahirkan}
                        style={styles.keyCheckDot}
                      />
                      <Text style={styles.keyCheckText}>{check}</Text>
                    </View>
                  ))}

                  <Button
                    title={visit.completed ? 'Tandai Belum Selesai' : 'Tandai Selesai'}
                    onPress={() => toggleCompletion(visit.visitNumber)}
                    variant={visit.completed ? 'outline' : 'primary'}
                    color={Colors.pascaMelahirkan}
                    icon={visit.completed ? 'close-circle-outline' : 'checkmark-circle-outline'}
                    fullWidth
                    loading={isSaving}
                    style={styles.toggleButton}
                  />
                </View>
              )}
            </Card>
          );
        })}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.pascaMelahirkanBg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  visitCard: {
    marginBottom: Spacing.md,
  },
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.pascaMelahirkanLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  visitBadgeCompleted: {
    backgroundColor: Colors.success,
  },
  visitBadgeText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.pascaMelahirkan,
  },
  visitInfo: {
    flex: 1,
  },
  visitLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  visitTiming: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  visitRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  timingBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.pascaMelahirkanBg,
  },
  timingBadgeCompleted: {
    backgroundColor: Colors.successBg,
  },
  timingText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.pascaMelahirkan,
  },
  timingTextCompleted: {
    color: Colors.success,
  },
  completedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.xs,
  },
  completedDateText: {
    fontSize: FontSize.sm,
    color: Colors.success,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceSecondary,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.pascaMelahirkan,
  },
  progressText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  checklistContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  checklistTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  keyChecksTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  keyCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  keyCheckDot: {
    marginRight: Spacing.sm,
  },
  keyCheckText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  toggleButton: {
    marginTop: Spacing.lg,
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});

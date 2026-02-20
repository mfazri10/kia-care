import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useApp } from '@/context/AppContext';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from '@/constants/theme';
import { ANC_SCHEDULE } from '@/constants/data';
import { getANCVisits } from '@/utils/storage';
import { formatDateID } from '@/utils/date';
import { ANCVisit } from '@/types';

export default function ANCScheduleScreen() {
  const { activeProfile } = useApp();
  const router = useRouter();
  const [visits, setVisits] = useState<ANCVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadVisits = async () => {
    try {
      setIsLoading(true);
      const savedVisits = await getANCVisits();
      if (savedVisits && activeProfile) {
        const profileVisits = savedVisits.filter(
          (v: ANCVisit) => v.profileId === activeProfile.id
        );
        setVisits(profileVisits);
      }
    } catch (error) {
      console.error('Error loading ANC visits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadVisits();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeProfile?.id])
  );

  const getVisitData = (visitNumber: number): ANCVisit | undefined => {
    return visits.find((v) => v.visitNumber === visitNumber);
  };

  const getCompletedCount = (): number => {
    return visits.filter((v) => v.completed).length;
  };

  const getTrimesterColor = (trimester: number): string => {
    switch (trimester) {
      case 1:
        return Colors.accent;
      case 2:
        return Colors.secondary;
      case 3:
        return Colors.primary;
      default:
        return Colors.primary;
    }
  };

  const handleVisitPress = (visitNumber: number) => {
    router.push(`/pregnancy/anc/${visitNumber}`);
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Header title="Jadwal ANC" subtitle="Pemeriksaan Kehamilan" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  const completedCount = getCompletedCount();

  return (
    <View style={styles.screen}>
      <Header title="Jadwal ANC" subtitle="Pemeriksaan Kehamilan" showBack />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <Card variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="medical-outline" size={28} color={Colors.primary} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle}>Kunjungan ANC</Text>
              <Text style={styles.summarySubtitle}>
                {completedCount} dari 6 kunjungan selesai
              </Text>
            </View>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeText}>
                {completedCount}/6
              </Text>
            </View>
          </View>

          {/* Progress dots */}
          <View style={styles.progressDots}>
            {ANC_SCHEDULE.map((schedule) => {
              const visitData = getVisitData(schedule.visitNumber);
              const isCompleted = visitData?.completed ?? false;
              return (
                <View
                  key={schedule.visitNumber}
                  style={[
                    styles.progressDot,
                    isCompleted && {
                      backgroundColor: getTrimesterColor(schedule.trimester),
                    },
                  ]}
                >
                  {isCompleted && (
                    <Ionicons name="checkmark" size={12} color={Colors.white} />
                  )}
                </View>
              );
            })}
          </View>
        </Card>

        {/* Visit Cards */}
        {ANC_SCHEDULE.map((schedule) => {
          const visitData = getVisitData(schedule.visitNumber);
          const isCompleted = visitData?.completed ?? false;
          const trimesterColor = getTrimesterColor(schedule.trimester);

          return (
            <Card
              key={schedule.visitNumber}
              style={{
                ...styles.visitCard,
                ...(isCompleted ? styles.visitCardCompleted : {}),
              }}
              onPress={() => handleVisitPress(schedule.visitNumber)}
            >
              <View style={styles.visitHeader}>
                <View style={styles.visitHeaderLeft}>
                  <View
                    style={[
                      styles.visitNumberBadge,
                      {
                        backgroundColor: isCompleted
                          ? Colors.success
                          : trimesterColor,
                      },
                    ]}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={18} color={Colors.white} />
                    ) : (
                      <Text style={styles.visitNumberText}>
                        {schedule.visitNumber}
                      </Text>
                    )}
                  </View>
                  <View style={styles.visitTitleContainer}>
                    <Text style={styles.visitLabel}>{schedule.label}</Text>
                    <Text style={styles.visitDescription}>
                      {schedule.description}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Colors.textTertiary}
                />
              </View>

              {/* Date info */}
              {visitData?.completedDate && (
                <View style={styles.dateRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={Colors.success}
                  />
                  <Text style={styles.dateText}>
                    Selesai: {formatDateID(visitData.completedDate)}
                  </Text>
                </View>
              )}
              {visitData?.scheduledDate && !visitData.completed && (
                <View style={styles.dateRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={trimesterColor}
                  />
                  <Text style={styles.dateText}>
                    Dijadwalkan: {formatDateID(visitData.scheduledDate)}
                  </Text>
                </View>
              )}

              {/* Key Checks summary */}
              <View style={styles.checksContainer}>
                <Text style={styles.checksTitle}>Pemeriksaan utama:</Text>
                <View style={styles.checksList}>
                  {schedule.keyChecks.slice(0, 4).map((check, index) => (
                    <View key={index} style={styles.checkItem}>
                      <View
                        style={[
                          styles.checkDot,
                          { backgroundColor: trimesterColor },
                        ]}
                      />
                      <Text style={styles.checkText} numberOfLines={1}>
                        {check}
                      </Text>
                    </View>
                  ))}
                  {schedule.keyChecks.length > 4 && (
                    <Text style={styles.moreChecks}>
                      +{schedule.keyChecks.length - 4} pemeriksaan lainnya
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          );
        })}

        <View style={styles.bottomPadding} />
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  summarySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  summaryBadgeText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitCard: {
    marginBottom: Spacing.md,
  },
  visitCardCompleted: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  visitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  visitHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  visitNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  visitNumberText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  visitTitleContainer: {
    flex: 1,
  },
  visitLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  visitDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.massive + Spacing.xs,
  },
  dateText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  checksContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  checksTitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  checksList: {},
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.sm,
  },
  checkText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  moreChecks: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  bottomPadding: {
    height: Spacing.huge,
  },
});

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '@/constants/theme';
import {
  getPregnancyWeek,
  getTrimester,
  getEstimatedDueDate,
  getDaysUntilDue,
  formatDateID,
} from '@/utils/date';

interface Milestone {
  week: number;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const MILESTONES: Milestone[] = [
  { week: 4, title: 'Embrio menempel di rahim', icon: 'ellipse-outline' },
  { week: 8, title: 'Jantung mulai berdetak', icon: 'heart-outline' },
  { week: 12, title: 'Trimester 1 selesai', icon: 'checkmark-circle-outline' },
  { week: 16, title: 'Gerakan pertama terasa', icon: 'hand-left-outline' },
  { week: 20, title: 'USG anatomi (mid-pregnancy)', icon: 'scan-outline' },
  { week: 24, title: 'Viabilitas janin', icon: 'shield-checkmark-outline' },
  { week: 28, title: 'Trimester 3 dimulai', icon: 'flag-outline' },
  { week: 32, title: 'Posisi janin mulai turun', icon: 'arrow-down-outline' },
  { week: 36, title: 'Full term segera!', icon: 'star-outline' },
  { week: 40, title: 'Perkiraan hari lahir', icon: 'gift-outline' },
];

const BABY_SIZES: Record<number, { fruit: string; size: string }> = {
  4: { fruit: 'Biji wijen', size: '~2 mm' },
  5: { fruit: 'Biji apel', size: '~3 mm' },
  6: { fruit: 'Kacang polong', size: '~6 mm' },
  7: { fruit: 'Blueberry', size: '~1.3 cm' },
  8: { fruit: 'Raspberry', size: '~1.6 cm' },
  9: { fruit: 'Ceri', size: '~2.3 cm' },
  10: { fruit: 'Kurma', size: '~3 cm' },
  11: { fruit: 'Jeruk limau', size: '~4 cm' },
  12: { fruit: 'Jeruk nipis', size: '~5.4 cm' },
  13: { fruit: 'Lemon', size: '~7.4 cm' },
  14: { fruit: 'Jeruk', size: '~8.7 cm' },
  15: { fruit: 'Apel', size: '~10 cm' },
  16: { fruit: 'Alpukat', size: '~11.6 cm' },
  17: { fruit: 'Lobak', size: '~13 cm' },
  18: { fruit: 'Paprika', size: '~14 cm' },
  19: { fruit: 'Tomat besar', size: '~15 cm' },
  20: { fruit: 'Pisang', size: '~16.4 cm' },
  21: { fruit: 'Wortel', size: '~26.7 cm' },
  22: { fruit: 'Jagung', size: '~27.8 cm' },
  23: { fruit: 'Mangga', size: '~28.9 cm' },
  24: { fruit: 'Jagung besar', size: '~30 cm' },
  25: { fruit: 'Rutabaga', size: '~34.6 cm' },
  26: { fruit: 'Bawang daun', size: '~35.6 cm' },
  27: { fruit: 'Kembang kol', size: '~36.6 cm' },
  28: { fruit: 'Terong besar', size: '~37.6 cm' },
  29: { fruit: 'Labu butternut', size: '~38.6 cm' },
  30: { fruit: 'Kubis', size: '~39.9 cm' },
  31: { fruit: 'Kelapa', size: '~41.1 cm' },
  32: { fruit: 'Nanas', size: '~42.4 cm' },
  33: { fruit: 'Nanas besar', size: '~43.7 cm' },
  34: { fruit: 'Melon', size: '~45 cm' },
  35: { fruit: 'Melon madu', size: '~46.2 cm' },
  36: { fruit: 'Pepaya', size: '~47.4 cm' },
  37: { fruit: 'Labu siam', size: '~48.6 cm' },
  38: { fruit: 'Labu besar', size: '~49.8 cm' },
  39: { fruit: 'Semangka mini', size: '~50.7 cm' },
  40: { fruit: 'Semangka', size: '~51.2 cm' },
};

function getTrimesterLabel(trimester: number): string {
  switch (trimester) {
    case 1:
      return 'Trimester 1 (Minggu 1-12)';
    case 2:
      return 'Trimester 2 (Minggu 13-27)';
    case 3:
      return 'Trimester 3 (Minggu 28-40)';
    default:
      return '';
  }
}

function getTrimesterColor(trimester: number): string {
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
}

export default function TimelineScreen() {
  const { activeProfile } = useApp();

  const pregnancyData = useMemo(() => {
    if (!activeProfile?.hpht) {
      return null;
    }

    const currentWeek = getPregnancyWeek(activeProfile.hpht);
    const trimester = getTrimester(currentWeek);
    const edd = getEstimatedDueDate(activeProfile.hpht);
    const daysLeft = getDaysUntilDue(activeProfile.hpht);
    const progress = Math.min(currentWeek / 40, 1);
    const clampedWeek = Math.max(1, Math.min(currentWeek, 42));

    return {
      currentWeek: clampedWeek,
      trimester,
      edd,
      daysLeft,
      progress,
    };
  }, [activeProfile?.hpht]);

  if (!activeProfile?.hpht || !pregnancyData) {
    return (
      <View style={styles.screen}>
        <Header title="Timeline Kehamilan" showBack />
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>
            Data HPHT belum diisi. Silakan lengkapi profil Anda terlebih dahulu.
          </Text>
        </View>
      </View>
    );
  }

  const { currentWeek, trimester, edd, daysLeft, progress } = pregnancyData;
  const trimesterColor = getTrimesterColor(trimester);
  const babySize = BABY_SIZES[Math.min(Math.max(currentWeek, 4), 40)];

  return (
    <View style={styles.screen}>
      <Header title="Timeline Kehamilan" showBack />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Week Summary */}
        <Card variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={[styles.weekBadge, { backgroundColor: trimesterColor }]}>
              <Text style={styles.weekBadgeText}>Minggu {currentWeek}</Text>
            </View>
            <View style={[styles.trimesterBadge, { backgroundColor: trimesterColor + '20' }]}>
              <Text style={[styles.trimesterBadgeText, { color: trimesterColor }]}>
                Trimester {trimester}
              </Text>
            </View>
          </View>

          <Text style={styles.trimesterLabel}>{getTrimesterLabel(trimester)}</Text>

          <View style={styles.progressSection}>
            <ProgressBar
              progress={progress}
              color={trimesterColor}
              height={10}
              showLabel
              label={`${Math.round(progress * 100)}% perjalanan kehamilan`}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{daysLeft}</Text>
              <Text style={styles.statLabel}>Hari lagi</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDateID(edd.toISOString())}</Text>
              <Text style={styles.statLabel}>Perkiraan lahir</Text>
            </View>
          </View>
        </Card>

        {/* Baby Size Comparison */}
        {babySize && (
          <Card style={styles.babySizeCard}>
            <View style={styles.babySizeRow}>
              <View style={[styles.babySizeIcon, { backgroundColor: trimesterColor + '15' }]}>
                <Ionicons name="leaf-outline" size={28} color={trimesterColor} />
              </View>
              <View style={styles.babySizeInfo}>
                <Text style={styles.babySizeTitle}>Ukuran Bayi Anda</Text>
                <Text style={styles.babySizeFruit}>
                  Sebesar {babySize.fruit}
                </Text>
                <Text style={styles.babySizeLength}>{babySize.size}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Timeline */}
        <Text style={styles.sectionTitle}>Timeline 40 Minggu</Text>

        <View style={styles.timeline}>
          {Array.from({ length: 40 }, (_, i) => i + 1).map((week) => {
            const milestone = MILESTONES.find((m) => m.week === week);
            const isPast = week < currentWeek;
            const isCurrent = week === currentWeek;
            const weekTrimester = getTrimester(week);
            const weekColor = getTrimesterColor(weekTrimester);

            return (
              <View key={week} style={styles.timelineItem}>
                {/* Timeline line */}
                <View style={styles.timelineLineContainer}>
                  {week > 1 && (
                    <View
                      style={[
                        styles.timelineLineTop,
                        {
                          backgroundColor: isPast || isCurrent
                            ? weekColor
                            : Colors.border,
                        },
                      ]}
                    />
                  )}
                  <View
                    style={[
                      styles.timelineDot,
                      isCurrent && styles.timelineDotCurrent,
                      isCurrent && { borderColor: weekColor, backgroundColor: weekColor },
                      isPast && { backgroundColor: weekColor, borderColor: weekColor },
                      milestone && !isPast && !isCurrent && { borderColor: weekColor },
                    ]}
                  >
                    {isPast && (
                      <Ionicons name="checkmark" size={10} color={Colors.white} />
                    )}
                    {isCurrent && (
                      <View style={styles.currentDotInner} />
                    )}
                  </View>
                  {week < 40 && (
                    <View
                      style={[
                        styles.timelineLineBottom,
                        {
                          backgroundColor: isPast
                            ? weekColor
                            : Colors.border,
                        },
                      ]}
                    />
                  )}
                </View>

                {/* Content */}
                <View
                  style={[
                    styles.timelineContent,
                    isCurrent && [styles.timelineContentCurrent, { borderColor: weekColor }],
                    milestone && styles.timelineContentMilestone,
                  ]}
                >
                  <View style={styles.timelineContentHeader}>
                    <Text
                      style={[
                        styles.timelineWeekText,
                        isCurrent && { color: weekColor, fontWeight: FontWeight.bold },
                        isPast && { color: Colors.textSecondary },
                      ]}
                    >
                      Minggu {week}
                    </Text>
                    {isCurrent && (
                      <View style={[styles.currentBadge, { backgroundColor: weekColor }]}>
                        <Text style={styles.currentBadgeText}>Sekarang</Text>
                      </View>
                    )}
                  </View>
                  {milestone && (
                    <View style={styles.milestoneRow}>
                      <Ionicons
                        name={milestone.icon}
                        size={16}
                        color={isPast ? Colors.textSecondary : weekColor}
                      />
                      <Text
                        style={[
                          styles.milestoneText,
                          isPast && { color: Colors.textSecondary },
                        ]}
                      >
                        {milestone.title}
                      </Text>
                    </View>
                  )}
                  {BABY_SIZES[week] && isCurrent && (
                    <Text style={styles.timelineBabySize}>
                      Ukuran: {BABY_SIZES[week].fruit} ({BABY_SIZES[week].size})
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 22,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  weekBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  weekBadgeText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  trimesterBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  trimesterBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  trimesterLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  progressSection: {
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  babySizeCard: {
    marginBottom: Spacing.xl,
  },
  babySizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  babySizeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  babySizeInfo: {
    flex: 1,
  },
  babySizeTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  babySizeFruit: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  babySizeLength: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  timeline: {
    paddingLeft: Spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 40,
  },
  timelineLineContainer: {
    width: 24,
    alignItems: 'center',
  },
  timelineLineTop: {
    width: 2,
    flex: 1,
  },
  timelineLineBottom: {
    width: 2,
    flex: 1,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotCurrent: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
  },
  currentDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
  timelineContent: {
    flex: 1,
    marginLeft: Spacing.md,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  timelineContentCurrent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadow.sm,
  },
  timelineContentMilestone: {
    paddingBottom: Spacing.xs,
  },
  timelineContentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineWeekText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  currentBadge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  currentBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  milestoneText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginLeft: Spacing.xs,
    fontWeight: FontWeight.medium,
  },
  timelineBabySize: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  bottomPadding: {
    height: Spacing.huge,
  },
});

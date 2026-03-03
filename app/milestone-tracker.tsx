// KIA Care - Milestone Tracker Screen
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import Header from '@/components/ui/Header';
import { useApp } from '@/context/AppContext';
import { getBabyAgeText } from '@/utils/date';
import {
  milestoneCategories,
  stimulationTips,
  dummyChildInfo,
  type MilestoneCategory,
} from '@/data/milestones';

// ==================== TYPES ====================
type CheckedState = Record<string, boolean>;

// ==================== PROGRESS RING COMPONENT ====================
function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  color = Colors.pascaMelahirkan,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const percentage = Math.round(progress * 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background circle */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color + '20',
        }}
      />
      {/* Progress arc using a simple approach with two half circles */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'transparent',
          borderTopColor: color,
          borderRightColor: progress > 0.25 ? color : 'transparent',
          borderBottomColor: progress > 0.5 ? color : 'transparent',
          borderLeftColor: progress > 0.75 ? color : 'transparent',
          transform: [{ rotate: '-45deg' }],
        }}
      />
      {/* Center text */}
      <Text style={[styles.progressRingText, { color }]}>{percentage}%</Text>
    </View>
  );
}

// ==================== ACCORDION COMPONENT ====================
function CategoryAccordion({
  category,
  checkedItems,
  onToggle,
}: {
  category: MilestoneCategory;
  checkedItems: CheckedState;
  onToggle: (itemId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const animProgress = useSharedValue(1);

  const toggleExpanded = useCallback(() => {
    const next = !expanded;
    setExpanded(next);
    animProgress.value = withTiming(next ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [expanded, animProgress]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(animProgress.value, [0, 1], [0, 180])}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(animProgress.value, [0, 1], [0, 500]),
    opacity: animProgress.value,
    overflow: 'hidden' as const,
  }));

  const completedInCategory = category.items.filter((i) => checkedItems[i.id]).length;
  const totalInCategory = category.items.length;

  return (
    <View style={[styles.accordionContainer, { borderColor: category.color + '30' }]}>
      {/* Accordion Header */}
      <TouchableOpacity
        style={[styles.accordionHeader, { backgroundColor: category.colorBg }]}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryIconCircle, { backgroundColor: category.color + '20' }]}>
          <Ionicons name={category.icon as any} size={20} color={category.color} />
        </View>
        <View style={styles.categoryTitleContainer}>
          <Text style={[styles.categoryTitle, { color: category.color }]}>{category.title}</Text>
          <Text style={styles.categoryCount}>
            {completedInCategory}/{totalInCategory} tercapai
          </Text>
        </View>
        {/* Mini progress indicator */}
        <View style={[styles.miniProgressBg, { backgroundColor: category.color + '20' }]}>
          <View
            style={[
              styles.miniProgressFill,
              {
                backgroundColor: category.color,
                width: `${totalInCategory > 0 ? (completedInCategory / totalInCategory) * 100 : 0}%`,
              },
            ]}
          />
        </View>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-up" size={20} color={category.color} />
        </Animated.View>
      </TouchableOpacity>

      {/* Accordion Content */}
      <Animated.View style={contentStyle}>
        <View style={styles.accordionContent}>
          {category.items.map((item, index) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.milestoneItem,
                  isChecked && { backgroundColor: category.colorBg },
                  index < category.items.length - 1 && styles.milestoneItemBorder,
                ]}
                onPress={() => onToggle(item.id)}
                activeOpacity={0.6}
              >
                <View
                  style={[
                    styles.checkbox,
                    isChecked
                      ? { backgroundColor: category.color, borderColor: category.color }
                      : { borderColor: category.color + '60' },
                  ]}
                >
                  {isChecked && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                </View>
                <Text
                  style={[
                    styles.milestoneLabel,
                    isChecked && { color: Colors.textSecondary, textDecorationLine: 'line-through' },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

// ==================== SUMMARY CARD COMPONENT ====================
function SummaryCard({ uncheckedCount }: { uncheckedCount: number }) {
  const getSummaryData = useCallback((count: number) => {
    if (count === 0) {
      return {
        level: 'success' as const,
        color: '#27AE60',
        bgColor: '#F0FFF5',
        borderColor: '#27AE6030',
        icon: 'checkmark-circle' as const,
        title: 'Perkembangan Sesuai Usia',
        message: 'Hebat! Perkembangan si Kecil sesuai usianya. Terus pantau dan berikan stimulasi yang tepat.',
      };
    } else if (count < 4) {
      return {
        level: 'caution' as const,
        color: '#F39C12',
        bgColor: '#FFFBF0',
        borderColor: '#F39C1230',
        icon: 'alert-circle' as const,
        title: 'Butuh Sedikit Dorongan',
        message: 'Si Kecil butuh sedikit dorongan. Coba lakukan stimulasi di bawah ini secara rutin.',
      };
    } else {
      return {
        level: 'critical' as const,
        color: '#E74C3C',
        bgColor: '#FFF5F5',
        borderColor: '#E74C3C30',
        icon: 'warning' as const,
        title: 'Perlu Perhatian Khusus',
        message: 'Sebaiknya konsultasikan dengan tenaga medis untuk evaluasi perkembangan si Kecil lebih lanjut.',
      };
    }
  }, []);

  const data = getSummaryData(uncheckedCount);

  return (
    <View style={[styles.summaryCard, { backgroundColor: data.bgColor, borderColor: data.borderColor }]}>
      <View style={styles.summaryIconRow}>
        <View style={[styles.summaryIconCircle, { backgroundColor: data.color + '15' }]}>
          <Ionicons name={data.icon} size={24} color={data.color} />
        </View>
        <View style={styles.summaryTextContainer}>
          <Text style={[styles.summaryTitle, { color: data.color }]}>{data.title}</Text>
        </View>
      </View>
      <Text style={[styles.summaryMessage, { color: data.color + 'CC' }]}>{data.message}</Text>
    </View>
  );
}

// ==================== MAIN SCREEN ====================
export default function MilestoneTrackerScreen() {
  const { activeProfile } = useApp();

  // Checkbox state for all milestone items
  const [checkedItems, setCheckedItems] = useState<CheckedState>({});

  const toggleItem = useCallback((itemId: string) => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const totalItems = milestoneCategories.reduce((acc, cat) => acc + cat.items.length, 0);
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    const uncheckedCount = totalItems - checkedCount;
    const progress = totalItems > 0 ? checkedCount / totalItems : 0;
    return { totalItems, checkedCount, uncheckedCount, progress };
  }, [checkedItems]);

  // Child info - use profile data if available, otherwise dummy data
  const childName = activeProfile?.babyName || dummyChildInfo.name;
  const childGender = activeProfile?.babyGender || dummyChildInfo.gender;
  const childAgeText = activeProfile?.babyDob
    ? getBabyAgeText(activeProfile.babyDob)
    : dummyChildInfo.ageLabel;

  return (
    <View style={styles.container}>
      <Header
        title="Perkembangan Anak"
        subtitle="Pantau milestone sesuai usia"
        showBack
        backgroundColor={Colors.pascaMelahirkanBg}
        textColor={Colors.textPrimary}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ==================== CHILD INFO CARD ==================== */}
        <View style={styles.childInfoCard}>
          <View style={styles.childInfoLeft}>
            <View style={styles.childAvatarCircle}>
              <Ionicons
                name={childGender === 'Perempuan' ? 'flower-outline' : 'happy-outline'}
                size={28}
                color={Colors.pascaMelahirkan}
              />
            </View>
            <View style={styles.childInfoText}>
              <Text style={styles.childName}>{childName}</Text>
              <View style={styles.childMetaRow}>
                <View style={styles.childMetaBadge}>
                  <Ionicons name="calendar-outline" size={12} color={Colors.pascaMelahirkan} />
                  <Text style={styles.childMetaText}>{childAgeText}</Text>
                </View>
                <View style={styles.childMetaBadge}>
                  <Ionicons
                    name={childGender === 'Perempuan' ? 'female' : 'male'}
                    size={12}
                    color={Colors.pascaMelahirkan}
                  />
                  <Text style={styles.childMetaText}>{childGender}</Text>
                </View>
              </View>
            </View>
          </View>
          {/* Progress Ring */}
          <ProgressRing progress={stats.progress} size={72} strokeWidth={7} />
        </View>

        {/* ==================== PROGRESS SUMMARY BAR ==================== */}
        <View style={styles.progressSummaryBar}>
          <View style={styles.progressSummaryInfo}>
            <Text style={styles.progressSummaryLabel}>Progress Milestone</Text>
            <Text style={styles.progressSummaryCount}>
              <Text style={{ color: Colors.pascaMelahirkan, fontWeight: FontWeight.bold }}>
                {stats.checkedCount}
              </Text>
              /{stats.totalItems} tercapai
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${stats.progress * 100}%`,
                  backgroundColor: Colors.pascaMelahirkan,
                },
              ]}
            />
          </View>
        </View>

        {/* ==================== DYNAMIC SUMMARY CARD ==================== */}
        <SummaryCard uncheckedCount={stats.uncheckedCount} />

        {/* ==================== CHECKLIST ACCORDIONS ==================== */}
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={20} color={Colors.textPrimary} />
          <Text style={styles.sectionTitle}>Checklist Perkembangan</Text>
        </View>

        {milestoneCategories.map((category) => (
          <CategoryAccordion
            key={category.id}
            category={category}
            checkedItems={checkedItems}
            onToggle={toggleItem}
          />
        ))}

        {/* ==================== STIMULATION RECOMMENDATIONS ==================== */}
        <View style={styles.sectionHeader}>
          <Ionicons name="bulb-outline" size={20} color={Colors.accentDark} />
          <Text style={styles.sectionTitle}>Rekomendasi Stimulasi</Text>
        </View>
        <Text style={styles.stimulationSubtitle}>
          Aktivitas harian untuk mendukung tumbuh kembang si Kecil
        </Text>

        {stimulationTips.map((tip) => (
          <View key={tip.id} style={styles.stimulationCard}>
            <View style={[styles.stimulationIconCircle, { backgroundColor: tip.color + '15' }]}>
              <Ionicons name={tip.icon as any} size={22} color={tip.color} />
            </View>
            <View style={styles.stimulationContent}>
              <Text style={styles.stimulationTitle}>{tip.title}</Text>
              <Text style={styles.stimulationDescription}>{tip.description}</Text>
            </View>
          </View>
        ))}

        {/* Bottom Spacer */}
        <View style={{ height: Spacing.massive }} />
      </ScrollView>
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },

  // ---- Child Info Card ----
  childInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  childInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  childAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.pascaMelahirkanBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  childInfoText: {
    flex: 1,
  },
  childName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  childMetaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  childMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.pascaMelahirkanBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  childMetaText: {
    fontSize: FontSize.xs,
    color: Colors.pascaMelahirkan,
    fontWeight: FontWeight.medium,
  },

  // ---- Progress Ring ----
  progressRingText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },

  // ---- Progress Summary Bar ----
  progressSummaryBar: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  progressSummaryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressSummaryLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  progressSummaryCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.pascaMelahirkan + '20',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // ---- Summary Card ----
  summaryCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
  },
  summaryIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  summaryMessage: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginLeft: 56,
  },

  // ---- Section Header ----
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

  // ---- Accordion ----
  accordionContainer: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitleContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  categoryCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  miniProgressBg: {
    width: 40,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: Spacing.xs,
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  accordionContent: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },

  // ---- Milestone Item ----
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  milestoneItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  milestoneLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },

  // ---- Stimulation Tips ----
  stimulationSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  stimulationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  stimulationIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stimulationContent: {
    flex: 1,
  },
  stimulationTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  stimulationDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

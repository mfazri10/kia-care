// KIA Care - Daily Supplement Tracker with Streak & Confetti
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { getDailySupplements, saveDailySupplements } from '@/utils/storage';
import { getTodayISO } from '@/utils/date';
import type { DailySupplementLog } from '@/types';

const SUPPLEMENTS = [
  { key: 'ttd' as const, label: 'Tablet Tambah Darah', icon: 'medical' as const, color: '#FF8C69' },
  { key: 'asamFolat' as const, label: 'Asam Folat', icon: 'leaf' as const, color: '#6BCB77' },
  { key: 'kalsium' as const, label: 'Kalsium', icon: 'fitness' as const, color: '#4D96FF' },
];

// Pre-defined confetti pieces
const CONFETTI_PIECES = [
  { id: 0, color: '#FF6B6B', left: 10 },
  { id: 1, color: '#FFD93D', left: 45 },
  { id: 2, color: '#6BCB77', left: 80 },
  { id: 3, color: '#4D96FF', left: 115 },
  { id: 4, color: '#FF8C69', left: 150 },
  { id: 5, color: '#A78BDA', left: 185 },
  { id: 6, color: '#7BBFB5', left: 220 },
  { id: 7, color: '#E8919B', left: 255 },
  { id: 8, color: '#FFD93D', left: 290 },
  { id: 9, color: '#6BCB77', left: 325 },
  { id: 10, color: '#4D96FF', left: 30 },
  { id: 11, color: '#FF6B6B', left: 340 },
];

interface ConfettiProps {
  visible: boolean;
}

function Confetti({ visible }: ConfettiProps) {
  const animations = useRef(
    CONFETTI_PIECES.map(() => ({
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;

    const anims = animations.map((anim, i) =>
      Animated.sequence([
        Animated.delay(i * 40),
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateY, {
            toValue: -(80 + (i % 3) * 30),
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.stagger(30, anims).start(() => {
      animations.forEach((anim) => {
        anim.translateY.setValue(0);
        anim.opacity.setValue(0);
        anim.rotate.setValue(0);
      });
    });
  }, [visible, animations]);

  if (!visible) return null;

  return (
    <View style={styles.confettiContainer} pointerEvents="none">
      {CONFETTI_PIECES.map((piece, i) => {
        const spin = animations[i].rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });
        return (
          <Animated.View
            key={piece.id}
            style={[
              styles.confettiPiece,
              {
                backgroundColor: piece.color,
                left: piece.left,
                opacity: animations[i].opacity,
                transform: [
                  { translateY: animations[i].translateY },
                  { rotate: spin },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

interface DailyTrackerProps {
  profileId: string;
}

export default function DailyTracker({ profileId }: DailyTrackerProps) {
  const [supplements, setSupplements] = useState<DailySupplementLog>({
    id: '',
    profileId,
    date: getTodayISO(),
    ttd: false,
    asamFolat: false,
    kalsium: false,
  });
  const [streak, setStreak] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [allDoneToday, setAllDoneToday] = useState(false);
  const prevAllDone = useRef(false);

  const loadData = useCallback(async () => {
    try {
      const logs = await getDailySupplements() as DailySupplementLog[] | null;
      const today = getTodayISO();

      if (logs && logs.length > 0) {
        const profileLogs = logs.filter((l) => l.profileId === profileId);
        const todayLog = profileLogs.find((l) => l.date === today);
        if (todayLog) {
          setSupplements(todayLog);
          const isAllDone = todayLog.ttd && todayLog.asamFolat && todayLog.kalsium;
          setAllDoneToday(isAllDone);
          prevAllDone.current = isAllDone;
        }

        // Calculate streak
        const sortedLogs = profileLogs
          .filter((l) => l.ttd && l.asamFolat && l.kalsium)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        let streakCount = 0;
        const checkDate = new Date(today);

        for (const log of sortedLogs) {
          const logDate = new Date(log.date);
          const diffDays = Math.round((checkDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === streakCount) {
            streakCount++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (diffDays > streakCount) {
            break;
          }
        }
        setStreak(streakCount);
      }
    } catch (error) {
      console.error('Error loading daily supplements:', error);
    }
  }, [profileId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSupplement = useCallback(async (key: 'ttd' | 'asamFolat' | 'kalsium') => {
    const today = getTodayISO();
    const updated = { ...supplements, [key]: !supplements[key] };
    setSupplements(updated);

    const isAllDone = updated.ttd && updated.asamFolat && updated.kalsium;
    setAllDoneToday(isAllDone);

    // Trigger confetti when newly completed
    if (isAllDone && !prevAllDone.current) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
    }
    prevAllDone.current = isAllDone;

    try {
      const logs = (await getDailySupplements() as DailySupplementLog[] | null) || [];
      const profileLogs = logs.filter((l) => l.profileId !== profileId || l.date !== today);
      const logEntry: DailySupplementLog = {
        ...updated,
        id: updated.id || `${profileId}_${today}`,
        date: today,
        profileId,
      };
      await saveDailySupplements([...profileLogs, logEntry]);

      if (isAllDone) {
        // Recalculate streak after saving
        loadData();
      }
    } catch (error) {
      console.error('Error saving supplement:', error);
    }
  }, [supplements, profileId, loadData]);

  const completedCount = [supplements.ttd, supplements.asamFolat, supplements.kalsium].filter(Boolean).length;

  return (
    <View style={styles.container}>
      <Confetti visible={showConfetti} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Suplemen Harian</Text>
          <Text style={styles.subtitle}>{completedCount}/3 diminum hari ini</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakFire}>🔥</Text>
          <Text style={styles.streakCount}>{streak}</Text>
          <Text style={styles.streakLabel}>hari</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBarFill,
            { width: `${(completedCount / 3) * 100}%` },
          ]}
        />
      </View>

      {/* Supplements */}
      <View style={styles.supplementsRow}>
        {SUPPLEMENTS.map((supplement) => {
          const isDone = supplements[supplement.key];
          return (
            <TouchableOpacity
              key={supplement.key}
              style={[
                styles.supplementItem,
                isDone && { ...styles.supplementItemDone, borderColor: supplement.color },
              ]}
              onPress={() => toggleSupplement(supplement.key)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.supplementIcon,
                { backgroundColor: isDone ? supplement.color : supplement.color + '20' },
              ]}>
                <Ionicons
                  name={isDone ? 'checkmark-circle' : supplement.icon}
                  size={22}
                  color={isDone ? Colors.white : supplement.color}
                />
              </View>
              <Text style={[styles.supplementLabel, isDone && { color: supplement.color }]}>
                {supplement.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Completion message */}
      {allDoneToday && (
        <View style={styles.completionBanner}>
          <Text style={styles.completionText}>🎉 Semua suplemen diminum! Hebat!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#FF8C6920',
    ...Shadow.sm,
  },
  confettiContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    overflow: 'hidden',
    zIndex: 10,
  },
  confettiPiece: {
    position: 'absolute',
    bottom: 20,
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E8',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: 3,
  },
  streakFire: {
    fontSize: 16,
  },
  streakCount: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FF8C69',
  },
  streakLabel: {
    fontSize: FontSize.xs,
    color: '#FF8C69',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#FF8C69',
    borderRadius: 3,
  },
  supplementsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  supplementItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  supplementItemDone: {
    backgroundColor: Colors.white,
  },
  supplementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  supplementLabel: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  completionBanner: {
    backgroundColor: Colors.successBg,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  completionText: {
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: FontWeight.semibold,
  },
});

import React, { useState, useCallback, useMemo } from 'react';
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
import { useFocusEffect } from 'expo-router';
import { useApp } from '@/context/AppContext';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from '@/constants/theme';
import { getTTDLog, saveTTDLog } from '@/utils/storage';
import { getTodayISO, getCalendarDates } from '@/utils/date';
import { TTDEntry } from '@/types';

const TOTAL_TABLETS = 90;

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function TTDScreen() {
  const { activeProfile } = useApp();
  const [entries, setEntries] = useState<TTDEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const savedLog = await getTTDLog();
      if (savedLog && activeProfile) {
        const profileEntries = savedLog.filter(
          (e: TTDEntry) => e.profileId === activeProfile.id
        );
        setEntries(profileEntries);
      }
    } catch (error) {
      console.error('Error loading TTD log:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeProfile?.id])
  );

  const takenCount = useMemo(() => {
    return entries.filter((e) => e.taken).length;
  }, [entries]);

  const todayISO = getTodayISO();
  const takenToday = useMemo(() => {
    return entries.some((e) => e.date === todayISO && e.taken);
  }, [entries, todayISO]);

  const calendarDates = useMemo(() => {
    return getCalendarDates(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const monthlyStats = useMemo(() => {
    const monthEntries = entries.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && e.taken;
    });
    return monthEntries.length;
  }, [entries, currentMonth, currentYear]);

  const isDateTaken = useCallback(
    (date: Date): boolean => {
      const dateISO = date.toISOString().split('T')[0];
      return entries.some((e) => e.date === dateISO && e.taken);
    },
    [entries]
  );

  const handleTakeToday = async () => {
    if (!activeProfile) {
      Alert.alert('Error', 'Profil tidak ditemukan.');
      return;
    }

    if (takenToday) {
      // Undo today's entry
      try {
        const allLog = (await getTTDLog()) || [];
        const updatedLog = allLog.filter(
          (e: TTDEntry) =>
            !(e.profileId === activeProfile.id && e.date === todayISO)
        );
        await saveTTDLog(updatedLog);
        setEntries(
          updatedLog.filter((e: TTDEntry) => e.profileId === activeProfile.id)
        );
      } catch (error) {
        console.error('Error removing TTD entry:', error);
        Alert.alert('Error', 'Gagal menghapus data. Silakan coba lagi.');
      }
      return;
    }

    try {
      const newEntry: TTDEntry = {
        id: `ttd-${activeProfile.id}-${todayISO}`,
        profileId: activeProfile.id,
        date: todayISO,
        taken: true,
        time: new Date().toISOString(),
      };

      const allLog = (await getTTDLog()) || [];
      // Remove any existing entry for today for this profile
      const filtered = allLog.filter(
        (e: TTDEntry) =>
          !(e.profileId === activeProfile.id && e.date === todayISO)
      );
      const updatedLog = [...filtered, newEntry];
      await saveTTDLog(updatedLog);
      setEntries(
        updatedLog.filter((e: TTDEntry) => e.profileId === activeProfile.id)
      );
    } catch (error) {
      console.error('Error saving TTD entry:', error);
      Alert.alert('Error', 'Gagal menyimpan data. Silakan coba lagi.');
    }
  };

  const handleToggleDate = async (date: Date) => {
    if (!activeProfile) return;

    const dateISO = date.toISOString().split('T')[0];
    const isFutureDate = date > new Date();

    if (isFutureDate) {
      return;
    }

    try {
      const allLog = (await getTTDLog()) || [];
      const existingIndex = allLog.findIndex(
        (e: TTDEntry) => e.profileId === activeProfile.id && e.date === dateISO
      );

      let updatedLog: TTDEntry[];
      if (existingIndex >= 0 && allLog[existingIndex].taken) {
        // Remove entry
        updatedLog = allLog.filter(
          (e: TTDEntry) =>
            !(e.profileId === activeProfile.id && e.date === dateISO)
        );
      } else {
        // Add entry
        const newEntry: TTDEntry = {
          id: `ttd-${activeProfile.id}-${dateISO}`,
          profileId: activeProfile.id,
          date: dateISO,
          taken: true,
          time: new Date().toISOString(),
        };
        const filtered = allLog.filter(
          (e: TTDEntry) =>
            !(e.profileId === activeProfile.id && e.date === dateISO)
        );
        updatedLog = [...filtered, newEntry];
      }

      await saveTTDLog(updatedLog);
      setEntries(
        updatedLog.filter((e: TTDEntry) => e.profileId === activeProfile.id)
      );
    } catch (error) {
      console.error('Error toggling TTD entry:', error);
      Alert.alert('Error', 'Gagal menyimpan data. Silakan coba lagi.');
    }
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Header title="Tablet Tambah Darah" subtitle="Tracking 90 Tablet" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  const progress = Math.min(takenCount / TOTAL_TABLETS, 1);

  return (
    <View style={styles.screen}>
      <Header title="Tablet Tambah Darah" subtitle="Tracking 90 Tablet" showBack />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Card */}
        <Card variant="elevated" style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIconContainer}>
              <Ionicons name="medical-outline" size={28} color={Colors.primary} />
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressCount}>
                {takenCount}
                <Text style={styles.progressTotal}> / {TOTAL_TABLETS}</Text>
              </Text>
              <Text style={styles.progressLabel}>tablet diminum</Text>
            </View>
          </View>

          <ProgressBar
            progress={progress}
            color={Colors.primary}
            height={12}
            showLabel
            label="Progres konsumsi"
          />

          {takenCount >= TOTAL_TABLETS && (
            <View style={styles.completedBanner}>
              <Ionicons name="trophy" size={20} color={Colors.accent} />
              <Text style={styles.completedText}>
                Selamat! Target 90 tablet tercapai!
              </Text>
            </View>
          )}
        </Card>

        {/* Take Today Button */}
        <Card style={styles.todayCard}>
          <Button
            title={takenToday ? 'Sudah Diminum Hari Ini' : 'Sudah Minum Hari Ini'}
            onPress={handleTakeToday}
            icon={takenToday ? 'checkmark-circle' : 'add-circle-outline'}
            size="lg"
            fullWidth
            variant={takenToday ? 'secondary' : 'primary'}
            color={takenToday ? Colors.success : Colors.primary}
          />
          {takenToday && (
            <Text style={styles.todayHint}>
              Ketuk lagi untuk membatalkan
            </Text>
          )}
        </Card>

        {/* Calendar View */}
        <Card style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.calendarNav}>
              <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNav}>
              <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Day names */}
          <View style={styles.dayNamesRow}>
            {DAY_NAMES.map((day) => (
              <View key={day} style={styles.dayNameCell}>
                <Text style={styles.dayNameText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {calendarDates.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.calendarCell} />;
              }

              const taken = isDateTaken(date);
              const isToday =
                date.toISOString().split('T')[0] === todayISO;
              const isFuture = date > new Date();

              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={styles.calendarCell}
                  onPress={() => handleToggleDate(date)}
                  disabled={isFuture}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.calendarDay,
                      taken && styles.calendarDayTaken,
                      isToday && !taken && styles.calendarDayToday,
                      isFuture && styles.calendarDayFuture,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        taken && styles.calendarDayTextTaken,
                        isToday && !taken && styles.calendarDayTextToday,
                        isFuture && styles.calendarDayTextFuture,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    {taken && (
                      <View style={styles.takenDot} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Monthly Stats */}
          <View style={styles.monthlyStats}>
            <Ionicons name="stats-chart-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.monthlyStatsText}>
              Bulan ini: {monthlyStats} tablet diminum
            </Text>
          </View>
        </Card>

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={20} color={Colors.accent} />
            <Text style={styles.tipsTitle}>Tips Minum TTD</Text>
          </View>
          <Text style={styles.tipText}>
            {'\u2022'} Minum tablet dengan air jeruk atau air putih untuk meningkatkan penyerapan.
          </Text>
          <Text style={styles.tipText}>
            {'\u2022'} Hindari minum bersamaan dengan teh, kopi, atau susu.
          </Text>
          <Text style={styles.tipText}>
            {'\u2022'} Sebaiknya diminum sebelum tidur untuk mengurangi mual.
          </Text>
          <Text style={styles.tipText}>
            {'\u2022'} Konsumsi teratur setiap hari untuk hasil terbaik.
          </Text>
        </Card>

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
  progressCard: {
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  progressIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  progressInfo: {
    flex: 1,
  },
  progressCount: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  progressTotal: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
  },
  progressLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  completedText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.accentDark,
    marginLeft: Spacing.sm,
  },
  todayCard: {
    marginBottom: Spacing.lg,
  },
  todayHint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  calendarCard: {
    marginBottom: Spacing.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  calendarNav: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  calendarDay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayTaken: {
    backgroundColor: Colors.primary,
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  calendarDayFuture: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  calendarDayTextTaken: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  calendarDayTextToday: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  calendarDayTextFuture: {
    color: Colors.textTertiary,
  },
  takenDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.white,
  },
  monthlyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  monthlyStatsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  tipsCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.accentBg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tipsTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.accentDark,
    marginLeft: Spacing.sm,
  },
  tipText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
  bottomPadding: {
    height: Spacing.huge,
  },
});

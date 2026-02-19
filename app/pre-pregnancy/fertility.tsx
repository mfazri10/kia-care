import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { getFertilityData, saveFertilityData } from '@/utils/storage';
import { getFertilityWindow, getCalendarDates, formatDateID } from '@/utils/date';
import { FertilityEntry } from '@/types';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_HEADERS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

type DayType = 'period' | 'fertile' | 'ovulation' | 'safe' | 'none';

function isSameDateDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return d >= s && d <= e;
}

function getDayType(
  date: Date,
  cycleStart: Date,
  cycleLength: number,
  periodLength: number,
): DayType {
  // Period days: from cycle start for periodLength days
  const periodEnd = new Date(cycleStart);
  periodEnd.setDate(cycleStart.getDate() + periodLength - 1);

  if (isDateInRange(date, cycleStart, periodEnd)) {
    return 'period';
  }

  // Calculate fertility window
  const { ovulationDate, fertileStart, fertileEnd } = getFertilityWindow(
    cycleStart.toISOString(),
    cycleLength,
  );

  if (isSameDateDay(date, ovulationDate)) {
    return 'ovulation';
  }

  if (isDateInRange(date, fertileStart, fertileEnd)) {
    return 'fertile';
  }

  // Check next cycle period days
  const nextCycleStart = new Date(cycleStart);
  nextCycleStart.setDate(cycleStart.getDate() + cycleLength);
  const nextPeriodEnd = new Date(nextCycleStart);
  nextPeriodEnd.setDate(nextCycleStart.getDate() + periodLength - 1);

  if (isDateInRange(date, nextCycleStart, nextPeriodEnd)) {
    return 'period';
  }

  // Check next cycle fertility
  const nextFertility = getFertilityWindow(
    nextCycleStart.toISOString(),
    cycleLength,
  );

  if (isSameDateDay(date, nextFertility.ovulationDate)) {
    return 'ovulation';
  }

  if (isDateInRange(date, nextFertility.fertileStart, nextFertility.fertileEnd)) {
    return 'fertile';
  }

  return 'safe';
}

function getDayColor(type: DayType): { bg: string; text: string } {
  switch (type) {
    case 'period':
      return { bg: '#F5C6CB', text: '#C0392B' };
    case 'fertile':
      return { bg: '#D5F5E3', text: '#27AE60' };
    case 'ovulation':
      return { bg: Colors.praHamil, text: Colors.white };
    case 'safe':
      return { bg: Colors.surfaceSecondary, text: Colors.textSecondary };
    case 'none':
    default:
      return { bg: 'transparent', text: Colors.textPrimary };
  }
}

export default function FertilityScreen() {
  const [cycleStartDate, setCycleStartDate] = useState<Date>(new Date());
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await getFertilityData();
      if (stored) {
        const data = stored as FertilityEntry;
        if (data.cycleStartDate) {
          setCycleStartDate(new Date(data.cycleStartDate));
        }
        if (data.cycleLength) {
          setCycleLength(String(data.cycleLength));
        }
        if (data.periodLength) {
          setPeriodLength(String(data.periodLength));
        }
      }
    } catch (error) {
      console.error('Gagal memuat data kesuburan:', error);
      Alert.alert('Kesalahan', 'Gagal memuat data. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveData = async () => {
    const cycleLengthNum = parseInt(cycleLength, 10);
    const periodLengthNum = parseInt(periodLength, 10);

    if (isNaN(cycleLengthNum) || cycleLengthNum < 21 || cycleLengthNum > 45) {
      Alert.alert('Peringatan', 'Panjang siklus harus antara 21-45 hari.');
      return;
    }

    if (isNaN(periodLengthNum) || periodLengthNum < 1 || periodLengthNum > 10) {
      Alert.alert('Peringatan', 'Lama menstruasi harus antara 1-10 hari.');
      return;
    }

    try {
      setIsSaving(true);
      const data: FertilityEntry = {
        profileId: '',
        cycleStartDate: cycleStartDate.toISOString(),
        cycleLength: cycleLengthNum,
        periodLength: periodLengthNum,
      };
      await saveFertilityData(data);
      Alert.alert('Berhasil', 'Data kesuburan berhasil disimpan.');
    } catch (error) {
      console.error('Gagal menyimpan data kesuburan:', error);
      Alert.alert('Kesalahan', 'Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setCycleStartDate(selectedDate);
    }
  };

  const cycleLengthNum = parseInt(cycleLength, 10) || 28;
  const periodLengthNum = parseInt(periodLength, 10) || 5;

  // Calculate fertility information
  const fertilityInfo = useMemo(() => {
    try {
      const { ovulationDate, fertileStart, fertileEnd } = getFertilityWindow(
        cycleStartDate.toISOString(),
        cycleLengthNum,
      );

      const nextPeriodStart = new Date(cycleStartDate);
      nextPeriodStart.setDate(cycleStartDate.getDate() + cycleLengthNum);

      const nextPeriodEnd = new Date(nextPeriodStart);
      nextPeriodEnd.setDate(nextPeriodStart.getDate() + periodLengthNum - 1);

      return {
        ovulationDate,
        fertileStart,
        fertileEnd,
        nextPeriodStart,
        nextPeriodEnd,
      };
    } catch (error) {
      console.error('Gagal menghitung data kesuburan:', error);
      return null;
    }
  }, [cycleStartDate, cycleLengthNum, periodLengthNum]);

  // Calendar data
  const calendarDates = useMemo(() => {
    return getCalendarDates(calendarYear, calendarMonth);
  }, [calendarYear, calendarMonth]);

  const navigateMonth = (direction: number) => {
    let newMonth = calendarMonth + direction;
    let newYear = calendarYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }
    setCalendarMonth(newMonth);
    setCalendarYear(newYear);
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Header title="Kalender Kesuburan" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.praHamil} />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header
        title="Kalender Kesuburan"
        subtitle="Hitung masa subur Anda"
        showBack
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Input Section */}
        <Card style={styles.inputCard}>
          <Text style={styles.inputCardTitle}>Data Siklus Menstruasi</Text>

          {/* Cycle Start Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hari Pertama Menstruasi Terakhir</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors.praHamil} />
              <Text style={styles.dateButtonText}>
                {formatDateID(cycleStartDate.toISOString())}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
            {showDatePicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={cycleStartDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  minimumDate={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)}
                  onChange={onDateChange}
                />
                {Platform.OS === 'ios' && (
                  <Button
                    title="Selesai"
                    onPress={() => setShowDatePicker(false)}
                    variant="ghost"
                    color={Colors.praHamil}
                    size="sm"
                  />
                )}
              </View>
            )}
          </View>

          {/* Cycle Length */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Panjang Siklus (hari)</Text>
            <View style={styles.numberInputRow}>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => {
                  const val = parseInt(cycleLength, 10) || 28;
                  if (val > 21) setCycleLength(String(val - 1));
                }}
              >
                <Ionicons name="remove" size={20} color={Colors.praHamil} />
              </TouchableOpacity>
              <TextInput
                style={styles.numberInput}
                keyboardType="numeric"
                value={cycleLength}
                onChangeText={setCycleLength}
                maxLength={2}
              />
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => {
                  const val = parseInt(cycleLength, 10) || 28;
                  if (val < 45) setCycleLength(String(val + 1));
                }}
              >
                <Ionicons name="add" size={20} color={Colors.praHamil} />
              </TouchableOpacity>
              <Text style={styles.numberUnit}>hari</Text>
            </View>
            <Text style={styles.inputHint}>Rata-rata 21-45 hari (normal: 28 hari)</Text>
          </View>

          {/* Period Length */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Lama Menstruasi (hari)</Text>
            <View style={styles.numberInputRow}>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => {
                  const val = parseInt(periodLength, 10) || 5;
                  if (val > 1) setPeriodLength(String(val - 1));
                }}
              >
                <Ionicons name="remove" size={20} color={Colors.praHamil} />
              </TouchableOpacity>
              <TextInput
                style={styles.numberInput}
                keyboardType="numeric"
                value={periodLength}
                onChangeText={setPeriodLength}
                maxLength={2}
              />
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => {
                  const val = parseInt(periodLength, 10) || 5;
                  if (val < 10) setPeriodLength(String(val + 1));
                }}
              >
                <Ionicons name="add" size={20} color={Colors.praHamil} />
              </TouchableOpacity>
              <Text style={styles.numberUnit}>hari</Text>
            </View>
            <Text style={styles.inputHint}>Rata-rata 3-7 hari (normal: 5 hari)</Text>
          </View>

          <Button
            title="Simpan & Hitung"
            onPress={saveData}
            color={Colors.praHamil}
            icon="calculator-outline"
            fullWidth
            size="lg"
            loading={isSaving}
          />
        </Card>

        {/* Results Section */}
        {fertilityInfo && (
          <Card style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Hasil Perhitungan</Text>

            <View style={styles.resultRow}>
              <View style={[styles.resultIcon, { backgroundColor: '#F5C6CB' }]}>
                <Ionicons name="water-outline" size={20} color="#C0392B" />
              </View>
              <View style={styles.resultTextContainer}>
                <Text style={styles.resultLabel}>Perkiraan Menstruasi Berikutnya</Text>
                <Text style={styles.resultValue}>
                  {formatDateID(fertilityInfo.nextPeriodStart.toISOString())} -{' '}
                  {formatDateID(fertilityInfo.nextPeriodEnd.toISOString())}
                </Text>
              </View>
            </View>

            <View style={styles.resultDivider} />

            <View style={styles.resultRow}>
              <View style={[styles.resultIcon, { backgroundColor: '#D5F5E3' }]}>
                <Ionicons name="leaf-outline" size={20} color="#27AE60" />
              </View>
              <View style={styles.resultTextContainer}>
                <Text style={styles.resultLabel}>Jendela Kesuburan</Text>
                <Text style={styles.resultValue}>
                  {formatDateID(fertilityInfo.fertileStart.toISOString())} -{' '}
                  {formatDateID(fertilityInfo.fertileEnd.toISOString())}
                </Text>
              </View>
            </View>

            <View style={styles.resultDivider} />

            <View style={styles.resultRow}>
              <View style={[styles.resultIcon, { backgroundColor: Colors.praHamilLight }]}>
                <Ionicons name="egg-outline" size={20} color={Colors.praHamil} />
              </View>
              <View style={styles.resultTextContainer}>
                <Text style={styles.resultLabel}>Perkiraan Ovulasi</Text>
                <Text style={styles.resultValue}>
                  {formatDateID(fertilityInfo.ovulationDate.toISOString())}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Calendar Section */}
        <Card style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              onPress={() => navigateMonth(-1)}
              style={styles.calendarNavButton}
            >
              <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.calendarMonthTitle}>
              {MONTH_NAMES[calendarMonth]} {calendarYear}
            </Text>
            <TouchableOpacity
              onPress={() => navigateMonth(1)}
              style={styles.calendarNavButton}
            >
              <Ionicons name="chevron-forward" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Day Headers */}
          <View style={styles.calendarDayHeaders}>
            {DAY_HEADERS.map((day) => (
              <View key={day} style={styles.calendarDayHeader}>
                <Text style={styles.calendarDayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDates.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
              }

              const dayType = getDayType(date, cycleStartDate, cycleLengthNum, periodLengthNum);
              const { bg, text } = getDayColor(dayType);
              const isToday = isSameDateDay(date, new Date());

              return (
                <View key={`day-${index}`} style={styles.calendarDayCell}>
                  <View
                    style={[
                      styles.calendarDay,
                      { backgroundColor: bg },
                      isToday && styles.calendarDayToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        { color: text },
                        isToday && styles.calendarDayTodayText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Keterangan:</Text>
            <View style={styles.legendGrid}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F5C6CB' }]} />
                <Text style={styles.legendText}>Menstruasi</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#D5F5E3' }]} />
                <Text style={styles.legendText}>Masa Subur</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.praHamil }]} />
                <Text style={styles.legendText}>Ovulasi</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.surfaceSecondary }]} />
                <Text style={styles.legendText}>Hari Aman</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={22} color={Colors.praHamil} />
            <Text style={styles.infoTitle}>Catatan Penting</Text>
          </View>
          <Text style={styles.infoText}>
            Perhitungan ini berdasarkan metode kalender dan bersifat estimasi. Setiap
            wanita memiliki siklus yang berbeda-beda. Untuk hasil yang lebih akurat,
            konsultasikan dengan dokter atau bidan Anda.
          </Text>
        </Card>

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
  inputCard: {
    marginBottom: Spacing.lg,
  },
  inputCardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputHint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  dateButtonText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  pickerContainer: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  numberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  numberButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.praHamilBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.praHamilLight,
  },
  numberInput: {
    width: 60,
    textAlign: 'center',
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
  },
  numberUnit: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  resultsCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.praHamilBg,
  },
  resultsTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTextContainer: {
    flex: 1,
  },
  resultLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  resultValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  resultDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  calendarCard: {
    marginBottom: Spacing.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  calendarDayHeaders: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  calendarDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  calendarDayHeaderText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
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
  calendarDayToday: {
    borderWidth: 2,
    borderColor: Colors.praHamil,
  },
  calendarDayText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  calendarDayTodayText: {
    fontWeight: FontWeight.bold,
  },
  legendContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  legendTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  infoCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.warningBg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});

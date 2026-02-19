import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { getBreastfeedingSessions, saveBreastfeedingSessions } from '@/utils/storage';
import { formatTime, formatDuration, getTodayISO, isSameDay } from '@/utils/date';
import { BreastfeedingSession } from '@/types';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

type SessionSide = 'kiri' | 'kanan' | 'keduanya';
type SessionType = 'menyusui' | 'pompa';

const SIDE_LABELS: Record<SessionSide, string> = {
  kiri: 'Kiri',
  kanan: 'Kanan',
  keduanya: 'Keduanya',
};

const SIDE_ICONS: Record<SessionSide, keyof typeof Ionicons.glyphMap> = {
  kiri: 'arrow-back-circle-outline',
  kanan: 'arrow-forward-circle-outline',
  keduanya: 'sync-circle-outline',
};

const TYPE_LABELS: Record<SessionType, string> = {
  menyusui: 'Menyusui',
  pompa: 'Pompa',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default function BreastfeedingScreen() {
  const { activeProfile } = useApp();
  const [sessions, setSessions] = useState<BreastfeedingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Form state
  const [selectedSide, setSelectedSide] = useState<SessionSide>('kiri');
  const [selectedType, setSelectedType] = useState<SessionType>('menyusui');
  const [pumpAmount, setPumpAmount] = useState('');

  const loadSessions = useCallback(async () => {
    if (!activeProfile) return;
    try {
      setIsLoading(true);
      const stored = await getBreastfeedingSessions();
      const profileSessions = (stored || []).filter(
        (s: BreastfeedingSession) => s.profileId === activeProfile.id
      );
      setSessions(profileSessions);
    } catch (error) {
      console.error('Gagal memuat data sesi menyusui:', error);
      Alert.alert('Kesalahan', 'Gagal memuat data. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    const now = new Date().toISOString();
    setStartTime(now);
    setElapsedSeconds(0);
    setIsTimerRunning(true);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);

    if (!startTime || !activeProfile) return;

    if (selectedType === 'pompa' && pumpAmount.trim() === '') {
      Alert.alert('Peringatan', 'Silakan masukkan jumlah ASI yang dipompa (ml).');
      return;
    }

    const amount = selectedType === 'pompa' ? parseInt(pumpAmount, 10) : undefined;
    if (selectedType === 'pompa' && (isNaN(amount!) || amount! <= 0)) {
      Alert.alert('Peringatan', 'Jumlah ASI harus berupa angka positif.');
      return;
    }

    try {
      const newSession: BreastfeedingSession = {
        id: generateId(),
        profileId: activeProfile.id,
        startTime,
        endTime: new Date().toISOString(),
        side: selectedSide,
        type: selectedType,
        amount,
      };

      const allStored = (await getBreastfeedingSessions()) || [];
      const updatedAll = [...allStored, newSession];
      await saveBreastfeedingSessions(updatedAll);

      setSessions((prev) => [...prev, newSession]);
      setElapsedSeconds(0);
      setStartTime(null);
      setPumpAmount('');
    } catch (error) {
      console.error('Gagal menyimpan sesi menyusui:', error);
      Alert.alert('Kesalahan', 'Gagal menyimpan sesi. Silakan coba lagi.');
    }
  };

  const cancelTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
    setElapsedSeconds(0);
    setStartTime(null);
  };

  const todaySessions = sessions.filter((s) => {
    const today = getTodayISO();
    return isSameDay(s.startTime, today);
  });

  const getTodayTotal = () => {
    let totalSeconds = 0;
    todaySessions.forEach((s) => {
      if (s.startTime && s.endTime) {
        const diff = new Date(s.endTime).getTime() - new Date(s.startTime).getTime();
        totalSeconds += Math.floor(diff / 1000);
      }
    });
    return totalSeconds;
  };

  const getTodayPumpTotal = () => {
    return todaySessions
      .filter((s) => s.type === 'pompa' && s.amount)
      .reduce((sum, s) => sum + (s.amount || 0), 0);
  };

  const getSessionDuration = (session: BreastfeedingSession): number => {
    if (!session.startTime || !session.endTime) return 0;
    return Math.floor(
      (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000
    );
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Header title="Menyusui & Pompa ASI" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.pascaMelahirkan} />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title="Menyusui & Pompa ASI" showBack subtitle="Catat sesi menyusui dan pompa" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer Card */}
        <Card style={styles.timerCard}>
          <Text style={styles.timerDisplay}>{formatDuration(elapsedSeconds)}</Text>

          {/* Type Toggle */}
          <View style={styles.toggleRow}>
            {(Object.keys(TYPE_LABELS) as SessionType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.toggleButton,
                  selectedType === type && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  if (!isTimerRunning) setSelectedType(type);
                }}
                activeOpacity={0.7}
                disabled={isTimerRunning}
              >
                <Ionicons
                  name={type === 'menyusui' ? 'water-outline' : 'flask-outline'}
                  size={18}
                  color={selectedType === type ? Colors.white : Colors.pascaMelahirkan}
                />
                <Text
                  style={[
                    styles.toggleText,
                    selectedType === type && styles.toggleTextActive,
                  ]}
                >
                  {TYPE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Side Selection */}
          <View style={styles.sideRow}>
            {(Object.keys(SIDE_LABELS) as SessionSide[]).map((side) => (
              <TouchableOpacity
                key={side}
                style={[
                  styles.sideButton,
                  selectedSide === side && styles.sideButtonActive,
                ]}
                onPress={() => {
                  if (!isTimerRunning) setSelectedSide(side);
                }}
                activeOpacity={0.7}
                disabled={isTimerRunning}
              >
                <Ionicons
                  name={SIDE_ICONS[side]}
                  size={22}
                  color={selectedSide === side ? Colors.pascaMelahirkan : Colors.textTertiary}
                />
                <Text
                  style={[
                    styles.sideText,
                    selectedSide === side && styles.sideTextActive,
                  ]}
                >
                  {SIDE_LABELS[side]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pump Amount Input */}
          {selectedType === 'pompa' && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Jumlah ASI</Text>
              <View style={styles.amountInputContainer}>
                <TextInput
                  style={styles.amountInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textTertiary}
                  value={pumpAmount}
                  onChangeText={setPumpAmount}
                  editable={!isTimerRunning}
                />
                <Text style={styles.amountUnit}>ml</Text>
              </View>
            </View>
          )}

          {/* Timer Controls */}
          <View style={styles.timerControls}>
            {!isTimerRunning ? (
              <Button
                title="Mulai"
                onPress={startTimer}
                color={Colors.pascaMelahirkan}
                icon="play"
                fullWidth
                size="lg"
              />
            ) : (
              <View style={styles.timerButtonsRow}>
                <Button
                  title="Batal"
                  onPress={cancelTimer}
                  variant="outline"
                  color={Colors.textSecondary}
                  icon="close"
                  style={styles.cancelButton}
                />
                <Button
                  title="Selesai"
                  onPress={stopTimer}
                  color={Colors.pascaMelahirkan}
                  icon="stop"
                  style={styles.stopButton}
                  size="lg"
                />
              </View>
            )}
          </View>
        </Card>

        {/* Today's Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Ringkasan Hari Ini</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="time-outline" size={24} color={Colors.pascaMelahirkan} />
              <Text style={styles.summaryValue}>{formatDuration(getTodayTotal())}</Text>
              <Text style={styles.summaryLabel}>Total Durasi</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="list-outline" size={24} color={Colors.pascaMelahirkan} />
              <Text style={styles.summaryValue}>{todaySessions.length}</Text>
              <Text style={styles.summaryLabel}>Sesi</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="flask-outline" size={24} color={Colors.pascaMelahirkan} />
              <Text style={styles.summaryValue}>{getTodayPumpTotal()} ml</Text>
              <Text style={styles.summaryLabel}>Pompa</Text>
            </View>
          </View>
        </Card>

        {/* Today's Sessions */}
        <Text style={styles.sectionTitle}>Sesi Hari Ini</Text>

        {todaySessions.length === 0 ? (
          <EmptyState
            icon="water-outline"
            title="Belum Ada Sesi"
            description="Mulai catat sesi menyusui atau pompa ASI Anda hari ini."
            color={Colors.pascaMelahirkan}
          />
        ) : (
          [...todaySessions].reverse().map((session) => (
            <Card key={session.id} style={styles.sessionCard} variant="outlined">
              <View style={styles.sessionRow}>
                <View
                  style={[
                    styles.sessionIcon,
                    {
                      backgroundColor:
                        session.type === 'menyusui'
                          ? Colors.pascaMelahirkanBg
                          : Colors.accentBg,
                    },
                  ]}
                >
                  <Ionicons
                    name={session.type === 'menyusui' ? 'water' : 'flask'}
                    size={20}
                    color={
                      session.type === 'menyusui'
                        ? Colors.pascaMelahirkan
                        : Colors.accent
                    }
                  />
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionType}>
                    {TYPE_LABELS[session.type]} - {SIDE_LABELS[session.side]}
                  </Text>
                  <Text style={styles.sessionTime}>
                    {formatTime(session.startTime)}
                    {session.endTime ? ` - ${formatTime(session.endTime)}` : ''}
                  </Text>
                </View>
                <View style={styles.sessionRight}>
                  <Text style={styles.sessionDuration}>
                    {formatDuration(getSessionDuration(session))}
                  </Text>
                  {session.type === 'pompa' && session.amount && (
                    <Text style={styles.sessionAmount}>{session.amount} ml</Text>
                  )}
                </View>
              </View>
            </Card>
          ))
        )}

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
  timerCard: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  timerDisplay: {
    fontSize: 56,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginBottom: Spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  toggleButtonActive: {
    backgroundColor: Colors.pascaMelahirkan,
  },
  toggleText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.pascaMelahirkan,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  sideRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  sideButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  sideButtonActive: {
    borderColor: Colors.pascaMelahirkan,
    backgroundColor: Colors.pascaMelahirkanBg,
  },
  sideText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textTertiary,
  },
  sideTextActive: {
    color: Colors.pascaMelahirkan,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  amountLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  amountInput: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    paddingVertical: Spacing.sm,
    minWidth: 60,
    textAlign: 'center',
  },
  amountUnit: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  timerControls: {
    width: '100%',
  },
  timerButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  stopButton: {
    flex: 2,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sessionCard: {
    marginBottom: Spacing.sm,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionType: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  sessionTime: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sessionRight: {
    alignItems: 'flex-end',
  },
  sessionDuration: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  sessionAmount: {
    fontSize: FontSize.sm,
    color: Colors.pascaMelahirkan,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});

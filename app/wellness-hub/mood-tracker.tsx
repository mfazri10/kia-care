// KIA Care - Mood Tracker with AI Motivational Messages
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTextGeneration } from '@fastshot/ai';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getMoodEntries, saveMoodEntries } from '@/utils/storage';
import { MoodType, MoodEntry } from '@/types';

const MOODS: { type: MoodType; emoji: string; label: string; color: string }[] = [
  { type: 'amazing', emoji: '🤩', label: 'Luar Biasa', color: '#FFD700' },
  { type: 'happy', emoji: '😊', label: 'Senang', color: '#7BC8A4' },
  { type: 'okay', emoji: '😌', label: 'Biasa', color: '#B8A9E8' },
  { type: 'sad', emoji: '😢', label: 'Sedih', color: '#7CB8E4' },
  { type: 'stressed', emoji: '😰', label: 'Stres', color: '#E8919B' },
];

const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function getWeekDates(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export default function MoodTrackerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeProfile } = useApp();

  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [aiMessage, setAiMessage] = useState<string>('');
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);

  const { generateText, isLoading: isAiLoading } = useTextGeneration({
    onError: (err) => {
      console.error('AI mood error:', err);
      setAiMessage('Tetap semangat hari ini! 💪');
    },
  });

  const loadEntries = useCallback(async () => {
    try {
      const stored = await getMoodEntries();
      const profileEntries = (stored || []).filter(
        (e: MoodEntry) => e.profileId === activeProfile?.id
      );
      setEntries(profileEntries);

      const today = getTodayISO();
      const todayMood = profileEntries.find((e: MoodEntry) => e.date === today);
      if (todayMood) {
        setSelectedMood(todayMood.mood);
        if (todayMood.aiMessage) {
          setAiMessage(todayMood.aiMessage);
        }
      }
    } catch (error) {
      console.error('Error loading mood entries:', error);
    } finally {
      setIsLoadingEntries(false);
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSelectMood = async (mood: MoodType) => {
    if (!activeProfile) return;

    setSelectedMood(mood);
    setAiMessage('');

    const moodConfig = MOODS.find((m) => m.type === mood);
    const prompt = `Kamu adalah asisten kesehatan ibu hamil yang hangat dan suportif. Pengguna sedang merasa "${moodConfig?.label}" (${mood}). Berikan satu pesan motivasi singkat (2-3 kalimat) dalam bahasa Indonesia yang sesuai dengan mood mereka. Jika mereka sedih atau stres, berikan saran aktivitas ringan seperti jalan kaki 5 menit, latihan pernapasan, atau mendengarkan musik. Jika mereka senang, dorong mereka untuk mempertahankan perasaan positif. Jangan gunakan format list, cukup paragraf singkat.`;

    const response = await generateText(prompt);
    const message = response || 'Tetap semangat hari ini! 💪';
    setAiMessage(message);

    const today = getTodayISO();
    const newEntry: MoodEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      profileId: activeProfile.id,
      date: today,
      mood,
      aiMessage: message,
      createdAt: new Date().toISOString(),
    };

    try {
      const allEntries = (await getMoodEntries()) || [];
      const filtered = allEntries.filter(
        (e: MoodEntry) => !(e.profileId === activeProfile.id && e.date === today)
      );
      filtered.push(newEntry);
      await saveMoodEntries(filtered);

      const profileEntries = filtered.filter(
        (e: MoodEntry) => e.profileId === activeProfile.id
      );
      setEntries(profileEntries);
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', 'Gagal menyimpan mood');
    }
  };

  const weekDates = getWeekDates();
  const today = getTodayISO();

  const getWeekMoodData = () => {
    return weekDates.map((date) => {
      const entry = entries.find((e) => e.date === date);
      const moodConfig = entry ? MOODS.find((m) => m.type === entry.mood) : null;
      const isToday = date === today;
      return { date, entry, moodConfig, isToday };
    });
  };

  const weekData = getWeekMoodData();

  // Compute mood stats for the past 30 days
  const last30Days = entries.filter((e) => {
    const entryDate = new Date(e.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return entryDate >= thirtyDaysAgo;
  });

  const moodCounts = MOODS.map((m) => ({
    ...m,
    count: last30Days.filter((e) => e.mood === m.type).length,
  }));

  const maxCount = Math.max(...moodCounts.map((m) => m.count), 1);

  if (isLoadingEntries) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.lavender} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.lavenderDark} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Mood Tracker</Text>
          <Text style={styles.headerSubtitle}>Catat perasaan Anda hari ini</Text>
        </View>
        <View style={styles.headerEmoji}>
          <Text style={{ fontSize: 28 }}>🧘‍♀️</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Today's Mood Selector */}
        <View style={styles.moodSection}>
          <Text style={styles.sectionTitle}>Bagaimana perasaan Anda hari ini?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((mood) => {
              const isSelected = selectedMood === mood.type;
              return (
                <TouchableOpacity
                  key={mood.type}
                  style={[
                    styles.moodButton,
                    isSelected && {
                      backgroundColor: mood.color + '20',
                      borderColor: mood.color,
                      transform: [{ scale: 1.05 }],
                    },
                  ]}
                  onPress={() => handleSelectMood(mood.type)}
                  activeOpacity={0.7}
                  disabled={isAiLoading}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      isSelected && { color: mood.color, fontWeight: FontWeight.bold },
                    ]}
                  >
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* AI Message */}
        {(isAiLoading || aiMessage) && (
          <View style={styles.aiCard}>
            <View style={styles.aiCardHeader}>
              <View style={styles.aiIconWrap}>
                <Ionicons name="sparkles" size={16} color={Colors.white} />
              </View>
              <Text style={styles.aiCardTitle}>Pesan dari Kia AI</Text>
            </View>
            {isAiLoading ? (
              <View style={styles.aiLoadingRow}>
                <ActivityIndicator size="small" color={Colors.lavender} />
                <Text style={styles.aiLoadingText}>Kia sedang menyiapkan pesan...</Text>
              </View>
            ) : (
              <Text style={styles.aiMessageText}>{aiMessage}</Text>
            )}
          </View>
        )}

        {/* Weekly Mood Trend */}
        <View style={styles.weekSection}>
          <Text style={styles.sectionTitle}>Tren Mood Minggu Ini</Text>
          <View style={styles.weekCard}>
            <View style={styles.weekRow}>
              {weekData.map((day, index) => (
                <View key={day.date} style={styles.weekDay}>
                  <View
                    style={[
                      styles.weekDayCircle,
                      day.moodConfig && {
                        backgroundColor: day.moodConfig.color + '25',
                        borderColor: day.moodConfig.color,
                        borderWidth: 2,
                      },
                      day.isToday && !day.moodConfig && styles.weekDayToday,
                    ]}
                  >
                    {day.moodConfig ? (
                      <Text style={styles.weekDayEmoji}>{day.moodConfig.emoji}</Text>
                    ) : day.isToday ? (
                      <Ionicons name="ellipse" size={8} color={Colors.lavender} />
                    ) : (
                      <Ionicons name="remove" size={16} color={Colors.textTertiary} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.weekDayLabel,
                      day.isToday && { color: Colors.lavender, fontWeight: FontWeight.bold },
                    ]}
                  >
                    {DAY_LABELS[index]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 30-Day Mood Distribution */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Distribusi Mood (30 Hari)</Text>
          <View style={styles.statsCard}>
            {moodCounts.map((mood) => (
              <View key={mood.type} style={styles.statRow}>
                <Text style={styles.statEmoji}>{mood.emoji}</Text>
                <View style={styles.statBarWrap}>
                  <View
                    style={[
                      styles.statBar,
                      {
                        width: `${(mood.count / maxCount) * 100}%`,
                        backgroundColor: mood.color + '40',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.statBarFill,
                      {
                        width: `${(mood.count / maxCount) * 100}%`,
                        backgroundColor: mood.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.statCount}>{mood.count}</Text>
              </View>
            ))}
            {last30Days.length === 0 && (
              <Text style={styles.emptyStatsText}>
                Belum ada data mood. Mulai catat perasaan Anda hari ini!
              </Text>
            )}
          </View>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={20} color={Colors.lavenderDark} />
            <Text style={styles.tipsTitle}>Tips Kesehatan Mental</Text>
          </View>
          <Text style={styles.tipsText}>
            • Luangkan 5 menit untuk bernapas dalam-dalam setiap hari{'\n'}
            • Tulis 3 hal yang Anda syukuri sebelum tidur{'\n'}
            • Jangan ragu untuk berbicara dengan orang terdekat{'\n'}
            • Istirahat yang cukup penting untuk ibu & bayi
          </Text>
        </View>

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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.lavenderBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lavenderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.lavenderDark,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.lavender,
    marginTop: 2,
  },
  headerEmoji: {
    marginLeft: Spacing.sm,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  moodSection: {
    marginBottom: Spacing.xxl,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  moodLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  aiCard: {
    backgroundColor: Colors.lavenderBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.lavenderLight,
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  aiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.lavenderDark,
  },
  aiLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  aiLoadingText: {
    fontSize: FontSize.sm,
    color: Colors.lavender,
    fontStyle: 'italic',
  },
  aiMessageText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  weekSection: {
    marginBottom: Spacing.xxl,
  },
  weekCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  weekDayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayToday: {
    borderWidth: 2,
    borderColor: Colors.lavender,
    borderStyle: 'dashed',
  },
  weekDayEmoji: {
    fontSize: 20,
  },
  weekDayLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  statsSection: {
    marginBottom: Spacing.xxl,
  },
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  statEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  statBarWrap: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  statBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 12,
    borderRadius: 6,
  },
  statBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 12,
    borderRadius: 6,
    opacity: 0.7,
  },
  statCount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    width: 24,
    textAlign: 'right',
  },
  emptyStatsText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  tipsCard: {
    backgroundColor: Colors.lavenderBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.lavenderLight,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tipsTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.lavenderDark,
  },
  tipsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});

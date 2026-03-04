// KIA Care - Exercise Guide with Timer
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';

interface ExerciseStep {
  title: string;
  description: string;
  duration: number; // seconds
  breathingTip?: string;
}

interface Exercise {
  id: string;
  title: string;
  category: 'prenatal-yoga' | 'kegel' | 'postnatal-stretching';
  icon: keyof typeof Ionicons.glyphMap;
  difficulty: 'Mudah' | 'Sedang';
  totalDuration: string;
  disclaimer: string;
  steps: ExerciseStep[];
}

const EXERCISES: Exercise[] = [
  {
    id: 'prenatal-yoga-1',
    title: 'Yoga Prenatal Dasar',
    category: 'prenatal-yoga',
    icon: 'body-outline',
    difficulty: 'Mudah',
    totalDuration: '8 menit',
    disclaimer:
      'Konsultasikan dengan dokter sebelum memulai program olahraga. Hentikan jika merasa pusing, sesak, atau nyeri.',
    steps: [
      {
        title: 'Pemanasan: Duduk Bersila',
        description:
          'Duduk dengan nyaman di lantai dengan kaki bersila. Letakkan tangan di atas lutut. Luruskan punggung dan rilekskan bahu.',
        duration: 60,
        breathingTip: 'Tarik napas dalam melalui hidung (4 detik), tahan (4 detik), buang melalui mulut (6 detik).',
      },
      {
        title: 'Cat-Cow Stretch',
        description:
          'Posisi merangkak dengan tangan di bawah bahu dan lutut di bawah pinggul. Tarik napas, angkat kepala dan pinggul (cow). Buang napas, bulatkan punggung (cat). Ulangi perlahan.',
        duration: 90,
        breathingTip: 'Sinkronkan gerakan dengan napas. Tarik napas saat cow, buang napas saat cat.',
      },
      {
        title: 'Warrior II (Virabhadrasana)',
        description:
          'Berdiri dengan kaki terbuka lebar. Tekuk lutut kanan 90 derajat, rentangkan tangan ke samping. Tahan posisi, lalu ganti sisi.',
        duration: 90,
        breathingTip: 'Bernapas teratur dan dalam. Jangan menahan napas.',
      },
      {
        title: 'Butterfly Stretch',
        description:
          'Duduk dengan telapak kaki saling menempel. Pegang kaki dengan kedua tangan. Perlahan tekan lutut ke bawah dengan siku. Gerakan ini membantu membuka panggul.',
        duration: 60,
        breathingTip: 'Bernapas dalam dan rileks. Jangan paksa gerakan.',
      },
      {
        title: 'Pendinginan: Savasana',
        description:
          'Berbaring miring ke kiri dengan bantal di antara lutut. Tutup mata dan fokus pada napas. Rilekskan seluruh tubuh.',
        duration: 120,
        breathingTip: 'Bernapas alami dan dalam. Lepaskan segala ketegangan.',
      },
    ],
  },
  {
    id: 'kegel-1',
    title: 'Latihan Kegel',
    category: 'kegel',
    icon: 'fitness-outline',
    difficulty: 'Mudah',
    totalDuration: '5 menit',
    disclaimer:
      'Latihan kegel aman untuk semua trimester. Jangan menahan napas saat melakukan kontraksi. Jika tidak yakin, konsultasikan dengan bidan.',
    steps: [
      {
        title: 'Persiapan',
        description:
          'Duduk atau berbaring dengan nyaman. Kosongkan kandung kemih terlebih dahulu. Identifikasi otot dasar panggul (bayangkan sedang menahan kencing).',
        duration: 30,
        breathingTip: 'Bernapas normal dan rileks.',
      },
      {
        title: 'Kontraksi Cepat',
        description:
          'Kencangkan otot dasar panggul dengan cepat selama 2 detik, lalu rileks 2 detik. Ulangi 10 kali. Fokus hanya pada otot panggul, bukan perut atau paha.',
        duration: 60,
        breathingTip: 'Tetap bernapas normal. Jangan menahan napas.',
      },
      {
        title: 'Kontraksi Tahan',
        description:
          'Kencangkan otot dasar panggul dan tahan selama 5 detik. Rileks selama 5 detik. Ulangi 10 kali. Tingkatkan durasi tahan seiring waktu.',
        duration: 120,
        breathingTip: 'Bernapas dalam dan teratur selama kontraksi.',
      },
      {
        title: 'Elevator Kegel',
        description:
          'Bayangkan otot panggul sebagai elevator. Kencangkan perlahan dari lantai 1 ke lantai 3 (makin kencang). Tahan di lantai 3 selama 5 detik. Turun perlahan.',
        duration: 60,
        breathingTip: 'Bernapas perlahan saat "naik" dan "turun".',
      },
      {
        title: 'Rileksasi',
        description:
          'Rilekskan seluruh tubuh. Rasakan perbedaan antara otot tegang dan rileks. Latihan ini bisa dilakukan 3 kali sehari.',
        duration: 30,
        breathingTip: 'Tarik napas dalam, buang perlahan. Rasakan rileks.',
      },
    ],
  },
  {
    id: 'postnatal-stretch-1',
    title: 'Stretching Pasca Melahirkan',
    category: 'postnatal-stretching',
    icon: 'walk-outline',
    difficulty: 'Mudah',
    totalDuration: '7 menit',
    disclaimer:
      'Tunggu minimal 6 minggu setelah melahirkan (atau sesuai saran dokter) sebelum memulai olahraga. Untuk operasi caesar, tunggu hingga dokter mengizinkan.',
    steps: [
      {
        title: 'Peregangan Leher',
        description:
          'Duduk tegak. Perlahan miringkan kepala ke kanan, tahan 15 detik. Ulangi ke kiri. Lalu putar kepala perlahan melingkar.',
        duration: 60,
        breathingTip: 'Bernapas dalam dan perlahan selama peregangan.',
      },
      {
        title: 'Peregangan Bahu & Dada',
        description:
          'Satukan tangan di belakang punggung. Tarik tangan ke bawah sambil membuka dada ke depan. Tahan 15 detik. Ini membantu postur yang sering membungkuk saat menyusui.',
        duration: 60,
        breathingTip: 'Tarik napas saat membuka dada, buang saat rileks.',
      },
      {
        title: 'Pelvic Tilt',
        description:
          'Berbaring dengan lutut ditekuk dan kaki rata di lantai. Kencangkan perut dan tekan punggung bawah ke lantai. Tahan 5 detik, lepas. Ulangi 10 kali.',
        duration: 90,
        breathingTip: 'Buang napas saat mengencangkan, tarik napas saat rileks.',
      },
      {
        title: 'Bridge Pose',
        description:
          'Dari posisi pelvic tilt, angkat pinggul ke atas sambil mengencangkan bokong. Tahan 5 detik, turun perlahan. Ulangi 8 kali.',
        duration: 90,
        breathingTip: 'Buang napas saat mengangkat, tarik napas saat menurunkan.',
      },
      {
        title: 'Child\'s Pose',
        description:
          'Berlutut dengan lutut terbuka selebar pinggul. Duduk di tumit dan julurkan tangan ke depan. Rilekskan dahi di lantai. Tahan dan bernapas dalam.',
        duration: 90,
        breathingTip: 'Bernapas dalam melalui hidung, rasakan tubuh melepas ketegangan.',
      },
    ],
  },
];

const CATEGORY_COLORS = {
  'prenatal-yoga': Colors.mintGreen,
  'kegel': Colors.mintGreenDark,
  'postnatal-stretching': Colors.mintGreen,
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function ExerciseGuideScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const [exerciseComplete, setExerciseComplete] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = useCallback((duration: number) => {
    setTimeRemaining(duration);
    setTimerActive(true);
    setExerciseComplete(false);

    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration * 1000,
      useNativeDriver: false,
    }).start();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [progressAnim]);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);
    progressAnim.stopAnimation();
  };

  const handleStartExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setCurrentStepIndex(0);
    setShowTimer(true);
    setExerciseComplete(false);
    startTimer(exercise.steps[0].duration);
  };

  const handleNextStep = () => {
    if (!selectedExercise) return;
    stopTimer();

    if (currentStepIndex < selectedExercise.steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      startTimer(selectedExercise.steps[nextIndex].duration);
    } else {
      setExerciseComplete(true);
    }
  };

  const handlePrevStep = () => {
    if (!selectedExercise || currentStepIndex === 0) return;
    stopTimer();
    const prevIndex = currentStepIndex - 1;
    setCurrentStepIndex(prevIndex);
    startTimer(selectedExercise.steps[prevIndex].duration);
  };

  const handleCloseTimer = () => {
    stopTimer();
    setShowTimer(false);
    setSelectedExercise(null);
    setCurrentStepIndex(0);
    setExerciseComplete(false);
  };

  const currentStep = selectedExercise?.steps[currentStepIndex];

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.mintGreenDark} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Panduan Olahraga</Text>
          <Text style={styles.headerSubtitle}>Gerakan aman untuk ibu</Text>
        </View>
        <View style={styles.headerEmoji}>
          <Text style={{ fontSize: 28 }}>💪</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Safety Disclaimer */}
        <View style={styles.disclaimerCard}>
          <View style={styles.disclaimerHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.warning} />
            <Text style={styles.disclaimerTitle}>Keselamatan Utama</Text>
          </View>
          <Text style={styles.disclaimerText}>
            Selalu konsultasikan dengan dokter/bidan sebelum memulai olahraga apapun.
            Hentikan jika merasa pusing, sesak napas, nyeri, atau pendarahan.
          </Text>
        </View>

        {/* Exercise Cards */}
        {EXERCISES.map((exercise) => {
          const categoryColor = CATEGORY_COLORS[exercise.category];
          return (
            <TouchableOpacity
              key={exercise.id}
              style={styles.exerciseCard}
              onPress={() => handleStartExercise(exercise)}
              activeOpacity={0.8}
            >
              <View style={styles.exerciseCardHeader}>
                <View style={[styles.exerciseIcon, { backgroundColor: categoryColor + '20' }]}>
                  <Ionicons name={exercise.icon} size={28} color={categoryColor} />
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                  <View style={styles.exerciseMeta}>
                    <View style={[styles.difficultyBadge, { backgroundColor: categoryColor + '15' }]}>
                      <Text style={[styles.difficultyText, { color: categoryColor }]}>
                        {exercise.difficulty}
                      </Text>
                    </View>
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
                      <Text style={styles.durationText}>{exercise.totalDuration}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.playButton, { backgroundColor: categoryColor }]}>
                  <Ionicons name="play" size={18} color={Colors.white} />
                </View>
              </View>

              <View style={styles.stepsPreview}>
                <Text style={styles.stepsPreviewLabel}>
                  {exercise.steps.length} langkah
                </Text>
                <View style={styles.stepsDotsRow}>
                  {exercise.steps.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.stepDot, { backgroundColor: categoryColor + '40' }]}
                    />
                  ))}
                </View>
              </View>

              <Text style={styles.exerciseDisclaimer} numberOfLines={2}>
                ⚠️ {exercise.disclaimer}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Breathing Tips Card */}
        <View style={styles.breathingCard}>
          <View style={styles.breathingHeader}>
            <Text style={{ fontSize: 24 }}>🌬️</Text>
            <Text style={styles.breathingTitle}>Tips Pernapasan</Text>
          </View>
          <Text style={styles.breathingText}>
            • <Text style={styles.breathingBold}>4-4-6</Text>: Tarik napas 4 detik, tahan 4 detik, buang 6 detik{'\n'}
            • Bernapas melalui hidung untuk menenangkan sistem saraf{'\n'}
            • Jangan menahan napas saat berolahraga{'\n'}
            • Jika napas terengah, istirahat dan bernapas normal dulu
          </Text>
        </View>

        <View style={{ height: Spacing.massive }} />
      </ScrollView>

      {/* Timer Modal */}
      <Modal visible={showTimer} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.timerContainer, { paddingTop: insets.top }]}>
          {/* Timer Header */}
          <View style={styles.timerHeader}>
            <TouchableOpacity onPress={handleCloseTimer} style={styles.timerCloseBtn}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.timerHeaderTitle}>{selectedExercise?.title}</Text>
            <View style={{ width: 40 }} />
          </View>

          {exerciseComplete ? (
            /* Completion Screen */
            <View style={styles.completionWrap}>
              <Text style={styles.completionEmoji}>🎉</Text>
              <Text style={styles.completionTitle}>Selesai!</Text>
              <Text style={styles.completionDesc}>
                Luar biasa! Anda telah menyelesaikan {selectedExercise?.title}.
                Tetap konsisten untuk hasil terbaik.
              </Text>
              <TouchableOpacity
                style={[styles.completeButton, { backgroundColor: Colors.mintGreen }]}
                onPress={handleCloseTimer}
              >
                <Text style={styles.completeButtonText}>Kembali</Text>
              </TouchableOpacity>
            </View>
          ) : currentStep ? (
            <ScrollView
              contentContainerStyle={styles.timerContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Step Progress */}
              <View style={styles.stepProgressRow}>
                {selectedExercise?.steps.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.stepProgressDot,
                      i <= currentStepIndex && {
                        backgroundColor: Colors.mintGreen,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.stepCounter}>
                Langkah {currentStepIndex + 1} / {selectedExercise?.steps.length}
              </Text>

              {/* Timer Circle */}
              <View style={styles.timerCircleWrap}>
                <View style={styles.timerCircle}>
                  <Text style={styles.timerTime}>{formatTime(timeRemaining)}</Text>
                  <Text style={styles.timerLabel}>
                    {timerActive ? 'Berlangsung' : timeRemaining === 0 ? 'Selesai' : 'Dijeda'}
                  </Text>
                </View>
                {/* Progress Bar */}
                <View style={styles.timerProgressTrack}>
                  <Animated.View
                    style={[styles.timerProgressFill, { width: progressWidth }]}
                  />
                </View>
              </View>

              {/* Step Info */}
              <View style={styles.stepInfoCard}>
                <Text style={styles.stepTitle}>{currentStep.title}</Text>
                <Text style={styles.stepDescription}>{currentStep.description}</Text>

                {currentStep.breathingTip && (
                  <View style={styles.breathingTipWrap}>
                    <Ionicons name="leaf-outline" size={16} color={Colors.mintGreenDark} />
                    <Text style={styles.breathingTipText}>{currentStep.breathingTip}</Text>
                  </View>
                )}
              </View>

              {/* Controls */}
              <View style={styles.timerControls}>
                <TouchableOpacity
                  style={[styles.controlBtn, styles.controlBtnSecondary]}
                  onPress={handlePrevStep}
                  disabled={currentStepIndex === 0}
                >
                  <Ionicons
                    name="play-back"
                    size={20}
                    color={currentStepIndex === 0 ? Colors.textTertiary : Colors.mintGreenDark}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlBtn, styles.controlBtnPrimary]}
                  onPress={() => {
                    if (timerActive) {
                      stopTimer();
                    } else if (timeRemaining > 0) {
                      startTimer(timeRemaining);
                    } else {
                      handleNextStep();
                    }
                  }}
                >
                  <Ionicons
                    name={
                      timerActive ? 'pause' : timeRemaining === 0 ? 'play-forward' : 'play'
                    }
                    size={28}
                    color={Colors.white}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlBtn, styles.controlBtnSecondary]}
                  onPress={handleNextStep}
                >
                  <Ionicons name="play-forward" size={20} color={Colors.mintGreenDark} />
                </TouchableOpacity>
              </View>

              {timeRemaining === 0 && !exerciseComplete && (
                <TouchableOpacity
                  style={styles.nextStepBtn}
                  onPress={handleNextStep}
                >
                  <Text style={styles.nextStepBtnText}>
                    {currentStepIndex < (selectedExercise?.steps.length || 0) - 1
                      ? 'Langkah Selanjutnya →'
                      : 'Selesai! 🎉'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.mintGreenBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.mintGreenLight,
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
    color: Colors.mintGreenDark,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.mintGreen,
    marginTop: 2,
  },
  headerEmoji: {
    marginLeft: Spacing.sm,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  disclaimerCard: {
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.warningLight,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  disclaimerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.warning,
  },
  disclaimerText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  exerciseCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  exerciseIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  difficultyText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepsPreviewLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  stepsDotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  exerciseDisclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
  breathingCard: {
    backgroundColor: Colors.mintGreenBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.mintGreenLight,
  },
  breathingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  breathingTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.mintGreenDark,
  },
  breathingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  breathingBold: {
    fontWeight: FontWeight.bold,
    color: Colors.mintGreenDark,
  },
  // Timer Modal
  timerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerHeaderTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  timerContent: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  stepProgressRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepProgressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  stepCounter: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  timerCircleWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    width: '100%',
  },
  timerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.mintGreenBg,
    borderWidth: 4,
    borderColor: Colors.mintGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  timerTime: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.bold,
    color: Colors.mintGreenDark,
  },
  timerLabel: {
    fontSize: FontSize.sm,
    color: Colors.mintGreen,
    marginTop: 4,
  },
  timerProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.mintGreenLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerProgressFill: {
    height: 6,
    backgroundColor: Colors.mintGreen,
    borderRadius: 3,
  },
  stepInfoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    marginBottom: Spacing.xxl,
    ...Shadow.sm,
  },
  stepTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  stepDescription: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  breathingTipWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.mintGreenBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  breathingTipText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.mintGreenDark,
    lineHeight: 20,
  },
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnPrimary: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.mintGreen,
  },
  controlBtnSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.mintGreenBg,
  },
  nextStepBtn: {
    backgroundColor: Colors.mintGreen,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
  nextStepBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  completionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  completionEmoji: {
    fontSize: 64,
    marginBottom: Spacing.xl,
  },
  completionTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.mintGreenDark,
    marginBottom: Spacing.md,
  },
  completionDesc: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  completeButton: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxxl,
  },
  completeButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
});

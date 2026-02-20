import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { EPDS_QUESTIONS } from '@/constants/data';
import { getBabyBluesScreenings, saveBabyBluesScreenings } from '@/utils/storage';
import { formatDateID } from '@/utils/date';
import { BabyBluesScreening } from '@/types';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import EmptyState from '@/components/ui/EmptyState';

type RiskLevel = 'rendah' | 'sedang' | 'tinggi';

interface ScreeningView {
  mode: 'history' | 'questionnaire' | 'result';
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getRiskLevel(score: number): RiskLevel {
  if (score <= 9) return 'rendah';
  if (score <= 12) return 'sedang';
  return 'tinggi';
}

function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'rendah':
      return Colors.success;
    case 'sedang':
      return Colors.warning;
    case 'tinggi':
      return Colors.danger;
  }
}

function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case 'rendah':
      return 'Risiko Rendah';
    case 'sedang':
      return 'Risiko Sedang';
    case 'tinggi':
      return 'Risiko Tinggi';
  }
}

function getRiskDescription(level: RiskLevel): string {
  switch (level) {
    case 'rendah':
      return 'Skor Anda menunjukkan risiko rendah untuk depresi pasca melahirkan. Tetap jaga kesehatan mental Anda dan jangan ragu untuk berbicara dengan tenaga kesehatan jika merasa perlu.';
    case 'sedang':
      return 'Skor Anda menunjukkan risiko sedang. Disarankan untuk berkonsultasi dengan bidan atau dokter Anda untuk evaluasi lebih lanjut. Dukungan keluarga sangat penting saat ini.';
    case 'tinggi':
      return 'Skor Anda menunjukkan risiko tinggi untuk depresi pasca melahirkan. Sangat disarankan untuk segera menghubungi tenaga kesehatan profesional untuk mendapatkan penanganan yang tepat.';
  }
}

function getRiskIcon(level: RiskLevel): keyof typeof Ionicons.glyphMap {
  switch (level) {
    case 'rendah':
      return 'shield-checkmark';
    case 'sedang':
      return 'warning';
    case 'tinggi':
      return 'alert-circle';
  }
}

export default function BabyBluesScreen() {
  const { activeProfile } = useApp();
  const [screenings, setScreenings] = useState<BabyBluesScreening[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Screening state
  const [viewMode, setViewMode] = useState<ScreeningView['mode']>('history');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(EPDS_QUESTIONS.length).fill(null)
  );
  const [lastResult, setLastResult] = useState<BabyBluesScreening | null>(null);

  const loadScreenings = useCallback(async () => {
    if (!activeProfile) return;
    try {
      setIsLoading(true);
      const stored = await getBabyBluesScreenings();
      const profileScreenings = (stored || []).filter(
        (s: BabyBluesScreening) => s.profileId === activeProfile.id
      );
      setScreenings(profileScreenings);
    } catch (error) {
      console.error('Gagal memuat data skrining:', error);
      Alert.alert('Kesalahan', 'Gagal memuat data. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadScreenings();
  }, [loadScreenings]);

  const startScreening = () => {
    setAnswers(new Array(EPDS_QUESTIONS.length).fill(null));
    setCurrentQuestion(0);
    setViewMode('questionnaire');
  };

  const selectAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (answers[currentQuestion] === null) {
      Alert.alert('Peringatan', 'Silakan pilih salah satu jawaban.');
      return;
    }
    if (currentQuestion < EPDS_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitScreening();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitScreening = async () => {
    if (!activeProfile) return;

    const hasUnanswered = answers.some((a) => a === null);
    if (hasUnanswered) {
      Alert.alert('Peringatan', 'Silakan jawab semua pertanyaan terlebih dahulu.');
      return;
    }

    try {
      const validAnswers = answers.map((a) => a ?? 0);
      const totalScore = validAnswers.reduce((sum: number, a: number) => sum + a, 0);
      const riskLevel = getRiskLevel(totalScore);

      const newScreening: BabyBluesScreening = {
        id: generateId(),
        profileId: activeProfile.id,
        date: new Date().toISOString(),
        answers: validAnswers,
        totalScore,
        riskLevel,
      };

      const allStored = (await getBabyBluesScreenings()) || [];
      const updatedAll = [...allStored, newScreening];
      await saveBabyBluesScreenings(updatedAll);

      setScreenings((prev) => [...prev, newScreening]);
      setLastResult(newScreening);
      setViewMode('result');
    } catch (error) {
      console.error('Gagal menyimpan hasil skrining:', error);
      Alert.alert('Kesalahan', 'Gagal menyimpan hasil. Silakan coba lagi.');
    }
  };

  const callEmergency = () => {
    Alert.alert(
      'Hubungi Bantuan',
      'Apakah Anda ingin menghubungi hotline kesehatan jiwa 119 ext. 8?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hubungi',
          onPress: () => {
            Linking.openURL('tel:119').catch(() => {
              Alert.alert('Kesalahan', 'Tidak dapat membuka aplikasi telepon.');
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Header title="Skrining Baby Blues" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.pascaMelahirkan} />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </View>
    );
  }

  // Questionnaire View
  if (viewMode === 'questionnaire') {
    const question = EPDS_QUESTIONS[currentQuestion];
    const progress = (currentQuestion + 1) / EPDS_QUESTIONS.length;

    return (
      <View style={styles.screen}>
        <Header
          title="Skrining EPDS"
          showBack
          subtitle={`Pertanyaan ${currentQuestion + 1} dari ${EPDS_QUESTIONS.length}`}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Progress */}
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={progress}
              color={Colors.pascaMelahirkan}
              height={6}
              showLabel
              label={`Pertanyaan ${currentQuestion + 1}/${EPDS_QUESTIONS.length}`}
            />
          </View>

          {/* Question */}
          <Card style={styles.questionCard}>
            <Text style={styles.questionNumber}>Pertanyaan {question.id}</Text>
            <Text style={styles.questionText}>{question.question}</Text>
          </Card>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {question.options.map((option, idx) => {
              const isSelected = answers[currentQuestion] === option.value;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => selectAnswer(option.value)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.radioOuter,
                      isSelected && styles.radioOuterSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Navigation */}
          <View style={styles.navButtons}>
            {currentQuestion > 0 && (
              <Button
                title="Sebelumnya"
                onPress={goToPreviousQuestion}
                variant="outline"
                color={Colors.textSecondary}
                icon="chevron-back"
                style={styles.prevButton}
              />
            )}
            <Button
              title={
                currentQuestion < EPDS_QUESTIONS.length - 1
                  ? 'Selanjutnya'
                  : 'Lihat Hasil'
              }
              onPress={goToNextQuestion}
              color={Colors.pascaMelahirkan}
              icon={
                currentQuestion < EPDS_QUESTIONS.length - 1
                  ? 'chevron-forward'
                  : 'checkmark-circle-outline'
              }
              iconPosition="right"
              style={styles.nextButton}
              disabled={answers[currentQuestion] === null}
            />
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    );
  }

  // Result View
  if (viewMode === 'result' && lastResult) {
    const riskLevel = lastResult.riskLevel;
    const riskColor = getRiskColor(riskLevel);

    return (
      <View style={styles.screen}>
        <Header title="Hasil Skrining" showBack />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Score Card */}
          <Card style={{ ...styles.resultCard, borderColor: riskColor, borderWidth: 2 }}>
            <View style={[styles.resultIconContainer, { backgroundColor: riskColor + '15' }]}>
              <Ionicons name={getRiskIcon(riskLevel)} size={48} color={riskColor} />
            </View>
            <Text style={styles.resultScoreLabel}>Skor Total</Text>
            <Text style={[styles.resultScore, { color: riskColor }]}>
              {lastResult.totalScore}
            </Text>
            <Text style={styles.resultScoreMax}>dari 30</Text>

            <View style={[styles.riskBadge, { backgroundColor: riskColor + '15' }]}>
              <Text style={[styles.riskBadgeText, { color: riskColor }]}>
                {getRiskLabel(riskLevel)}
              </Text>
            </View>

            <Text style={styles.resultDescription}>
              {getRiskDescription(riskLevel)}
            </Text>
          </Card>

          {/* Emergency CTA for High Risk */}
          {riskLevel === 'tinggi' && (
            <Card style={styles.emergencyCard}>
              <View style={styles.emergencyHeader}>
                <Ionicons name="call-outline" size={24} color={Colors.danger} />
                <Text style={styles.emergencyTitle}>Butuh Bantuan Segera?</Text>
              </View>
              <Text style={styles.emergencyText}>
                Jika Anda atau seseorang yang Anda kenal memiliki pikiran untuk menyakiti diri sendiri, segera hubungi tenaga kesehatan atau hotline krisis.
              </Text>
              <Button
                title="Hubungi Hotline 119 ext. 8"
                onPress={callEmergency}
                variant="danger"
                icon="call"
                fullWidth
                size="lg"
                style={styles.emergencyButton}
              />
              <Text style={styles.emergencyDisclaimer}>
                Layanan Hotline Kesehatan Jiwa Kemenkes RI
              </Text>
            </Card>
          )}

          {/* Score Breakdown */}
          <Card style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Keterangan Skor</Text>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.breakdownLabel}>0-9: Risiko Rendah</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.breakdownLabel}>10-12: Risiko Sedang</Text>
            </View>
            <View style={styles.breakdownItem}>
              <View style={[styles.breakdownDot, { backgroundColor: Colors.danger }]} />
              <Text style={styles.breakdownLabel}>13+: Risiko Tinggi</Text>
            </View>
          </Card>

          <Button
            title="Kembali ke Riwayat"
            onPress={() => setViewMode('history')}
            variant="outline"
            color={Colors.pascaMelahirkan}
            fullWidth
            style={styles.backToHistoryButton}
          />

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    );
  }

  // History View (default)
  const sortedScreenings = [...screenings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <View style={styles.screen}>
      <Header
        title="Skrining Baby Blues"
        showBack
        subtitle="Edinburgh Postnatal Depression Scale"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={Colors.pascaMelahirkan} />
            <Text style={styles.infoTitle}>Tentang Skrining EPDS</Text>
          </View>
          <Text style={styles.infoText}>
            Edinburgh Postnatal Depression Scale (EPDS) adalah kuesioner 10 pertanyaan yang membantu mengidentifikasi risiko depresi pasca melahirkan. Skrining ini bukan diagnosis, namun dapat membantu Anda dan tenaga kesehatan untuk menentukan langkah selanjutnya.
          </Text>
          <Button
            title="Mulai Skrining Baru"
            onPress={startScreening}
            color={Colors.pascaMelahirkan}
            icon="clipboard-outline"
            fullWidth
            size="lg"
            style={styles.startButton}
          />
        </Card>

        {/* History */}
        <Text style={styles.sectionTitle}>Riwayat Skrining</Text>

        {sortedScreenings.length === 0 ? (
          <EmptyState
            icon="clipboard-outline"
            title="Belum Ada Riwayat"
            description="Lakukan skrining pertama Anda untuk memantau kesehatan mental pasca melahirkan."
            color={Colors.pascaMelahirkan}
          />
        ) : (
          sortedScreenings.map((screening) => {
            const riskColor = getRiskColor(screening.riskLevel);
            return (
              <Card key={screening.id} style={styles.historyCard} variant="outlined">
                <View style={styles.historyRow}>
                  <View
                    style={[
                      styles.historyIcon,
                      { backgroundColor: riskColor + '15' },
                    ]}
                  >
                    <Ionicons
                      name={getRiskIcon(screening.riskLevel)}
                      size={24}
                      color={riskColor}
                    />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyDate}>
                      {formatDateID(screening.date)}
                    </Text>
                    <View style={styles.historyScoreRow}>
                      <Text style={styles.historyScoreLabel}>Skor: </Text>
                      <Text style={[styles.historyScore, { color: riskColor }]}>
                        {screening.totalScore}/30
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.historyRiskBadge,
                      { backgroundColor: riskColor + '15' },
                    ]}
                  >
                    <Text
                      style={[styles.historyRiskText, { color: riskColor }]}
                    >
                      {getRiskLabel(screening.riskLevel)}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
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
  // Info Card
  infoCard: {
    marginBottom: Spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  infoText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  startButton: {
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  // Questionnaire
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  questionCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.pascaMelahirkanBg,
  },
  questionNumber: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.pascaMelahirkan,
    marginBottom: Spacing.sm,
  },
  questionText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  optionsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    gap: Spacing.md,
  },
  optionButtonSelected: {
    borderColor: Colors.pascaMelahirkan,
    backgroundColor: Colors.pascaMelahirkanBg,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.pascaMelahirkan,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.pascaMelahirkan,
  },
  optionText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  optionTextSelected: {
    fontWeight: FontWeight.medium,
    color: Colors.pascaMelahirkan,
  },
  navButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  prevButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  // Result
  resultCard: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  resultIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  resultScoreLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  resultScore: {
    fontSize: 56,
    fontWeight: FontWeight.bold,
  },
  resultScoreMax: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  riskBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  riskBadgeText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  resultDescription: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  // Emergency
  emergencyCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerLight,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  emergencyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
  },
  emergencyText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  emergencyButton: {
    marginBottom: Spacing.sm,
  },
  emergencyDisclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // Breakdown
  breakdownCard: {
    marginBottom: Spacing.lg,
  },
  breakdownTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  breakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  breakdownLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  backToHistoryButton: {
    marginBottom: Spacing.lg,
  },
  // History
  historyCard: {
    marginBottom: Spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  historyScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  historyScoreLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  historyScore: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  historyRiskBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  historyRiskText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});

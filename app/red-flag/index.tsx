// KIA Care - Red Flag Emergency System: Checklist Screen
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';

// Symptom categories with severity scores
const RED_FLAG_CATEGORIES = [
  {
    id: 'perdarahan',
    title: 'Perdarahan',
    icon: 'water-outline' as const,
    color: '#E74C3C',
    description: 'Tanda perdarahan abnormal',
    symptoms: [
      { id: 'p1', text: 'Keluar darah dari jalan lahir', severity: 3 },
      { id: 'p2', text: 'Flek/bercak darah yang terus-menerus', severity: 2 },
      { id: 'p3', text: 'Darah berwarna merah segar dalam jumlah banyak', severity: 3 },
    ],
  },
  {
    id: 'nyeri',
    title: 'Nyeri Hebat',
    icon: 'flash-outline' as const,
    color: '#E67E22',
    description: 'Nyeri yang tidak biasa atau sangat kuat',
    symptoms: [
      { id: 'n1', text: 'Nyeri perut hebat yang tidak hilang', severity: 3 },
      { id: 'n2', text: 'Sakit kepala berat dan terus-menerus', severity: 2 },
      { id: 'n3', text: 'Nyeri ulu hati yang sangat mengganggu', severity: 2 },
    ],
  },
  {
    id: 'demam',
    title: 'Demam Tinggi',
    icon: 'thermometer-outline' as const,
    color: '#F39C12',
    description: 'Peningkatan suhu tubuh',
    symptoms: [
      { id: 'd1', text: 'Suhu tubuh lebih dari 38°C', severity: 2 },
      { id: 'd2', text: 'Menggigil dan badan terasa dingin', severity: 1 },
      { id: 'd3', text: 'Demam tidak turun lebih dari 2 hari', severity: 2 },
    ],
  },
  {
    id: 'gerakan',
    title: 'Gerakan Janin Berkurang',
    icon: 'body-outline' as const,
    color: '#3498DB',
    description: 'Perubahan pola gerakan bayi',
    symptoms: [
      { id: 'g1', text: 'Bayi bergerak kurang dari 10 kali dalam 12 jam', severity: 3 },
      { id: 'g2', text: 'Tidak merasakan gerakan bayi lebih dari 12 jam', severity: 3 },
      { id: 'g3', text: 'Gerakan bayi terasa melemah dari biasanya', severity: 2 },
    ],
  },
  {
    id: 'kejang',
    title: 'Kejang & Preeklamsia',
    icon: 'pulse-outline' as const,
    color: '#9B59B6',
    description: 'Tanda kejang atau tekanan darah tinggi',
    symptoms: [
      { id: 'k1', text: 'Kejang pada tubuh', severity: 3 },
      { id: 'k2', text: 'Pandangan kabur atau berkunang-kunang', severity: 2 },
      { id: 'k3', text: 'Bengkak pada wajah, tangan, dan kaki', severity: 2 },
    ],
  },
];

type StatusLevel = 'normal' | 'caution' | 'warning' | 'critical';

function getStatusFromScore(score: number): StatusLevel {
  if (score === 0) return 'normal';
  if (score <= 3) return 'caution';
  if (score <= 7) return 'warning';
  return 'critical';
}

export default function RedFlagChecklistScreen() {
  const router = useRouter();
  const [checkedSymptoms, setCheckedSymptoms] = useState<Set<string>>(new Set());
  const [expandedCategory, setExpandedCategory] = useState<string | null>(RED_FLAG_CATEGORIES[0].id);

  const toggleSymptom = useCallback((symptomId: string) => {
    setCheckedSymptoms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(symptomId)) {
        newSet.delete(symptomId);
      } else {
        newSet.add(symptomId);
      }
      return newSet;
    });
  }, []);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategory((prev) => (prev === categoryId ? null : categoryId));
  }, []);

  const totalScore = useMemo(() => {
    let score = 0;
    RED_FLAG_CATEGORIES.forEach((cat) => {
      cat.symptoms.forEach((symptom) => {
        if (checkedSymptoms.has(symptom.id)) {
          score += symptom.severity;
        }
      });
    });
    return score;
  }, [checkedSymptoms]);

  const checkedCountPerCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    RED_FLAG_CATEGORIES.forEach((cat) => {
      counts[cat.id] = cat.symptoms.filter((s) => checkedSymptoms.has(s.id)).length;
    });
    return counts;
  }, [checkedSymptoms]);

  const totalSymptoms = RED_FLAG_CATEGORIES.reduce((acc, cat) => acc + cat.symptoms.length, 0);
  const progress = checkedSymptoms.size / totalSymptoms;

  const handleSubmit = useCallback(() => {
    const status = getStatusFromScore(totalScore);
    const selectedSymptoms: string[] = [];
    RED_FLAG_CATEGORIES.forEach((cat) => {
      cat.symptoms.forEach((s) => {
        if (checkedSymptoms.has(s.id)) {
          selectedSymptoms.push(s.text);
        }
      });
    });

    router.push({
      pathname: '/red-flag/result',
      params: {
        score: totalScore.toString(),
        status,
        symptoms: JSON.stringify(selectedSymptoms),
        checkedCount: checkedSymptoms.size.toString(),
      },
    });
  }, [totalScore, checkedSymptoms, router]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Pemeriksaan',
      'Hapus semua tanda yang sudah dicentang?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setCheckedSymptoms(new Set());
            setExpandedCategory(RED_FLAG_CATEGORIES[0].id);
          },
        },
      ]
    );
  }, []);

  return (
    <View style={styles.container}>
      <Header
        title="Cek Tanda Bahaya"
        subtitle="Deteksi dini risiko kehamilan & bayi"
        showBack
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Instructions */}
        <Card style={styles.instructionCard} variant="outlined">
          <View style={styles.instructionRow}>
            <View style={styles.instructionIcon}>
              <Ionicons name="information-circle" size={24} color={Colors.secondary} />
            </View>
            <View style={styles.instructionText}>
              <Text style={styles.instructionTitle}>Petunjuk Pemeriksaan</Text>
              <Text style={styles.instructionDesc}>
                Centang gejala yang Anda rasakan pada setiap kategori. Tekan &quot;Lihat Hasil&quot; setelah selesai untuk melihat analisis.
              </Text>
            </View>
          </View>
        </Card>

        {/* Progress Indicator */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress Pemeriksaan</Text>
            <Text style={styles.progressCount}>
              {checkedSymptoms.size} gejala dipilih
            </Text>
          </View>
          <ProgressBar
            progress={progress}
            color={totalScore === 0 ? Colors.secondary : totalScore <= 3 ? '#F1C40F' : totalScore <= 7 ? '#E67E22' : Colors.danger}
            height={6}
          />
        </View>

        {/* Symptom Categories */}
        {RED_FLAG_CATEGORIES.map((category) => {
          const isExpanded = expandedCategory === category.id;
          const checkedInCat = checkedCountPerCategory[category.id] || 0;
          const hasChecked = checkedInCat > 0;

          return (
            <View key={category.id} style={styles.categoryContainer}>
              {/* Category Header */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.categoryHeader,
                  hasChecked && { backgroundColor: category.color + '08', borderColor: category.color + '30' },
                ]}
                onPress={() => toggleCategory(category.id)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
                  <Ionicons name={category.icon} size={22} color={category.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryTitleRow}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    {hasChecked && (
                      <View style={[styles.categoryBadge, { backgroundColor: category.color }]}>
                        <Text style={styles.categoryBadgeText}>{checkedInCat}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.categoryDesc}>{category.description}</Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Expanded Symptoms */}
              {isExpanded && (
                <View style={styles.symptomsContainer}>
                  {category.symptoms.map((symptom) => {
                    const isChecked = checkedSymptoms.has(symptom.id);
                    return (
                      <TouchableOpacity
                        key={symptom.id}
                        activeOpacity={0.7}
                        style={[
                          styles.symptomRow,
                          isChecked && { backgroundColor: category.color + '08' },
                        ]}
                        onPress={() => toggleSymptom(symptom.id)}
                      >
                        <View
                          style={[
                            styles.symptomCheckbox,
                            isChecked && { backgroundColor: category.color, borderColor: category.color },
                          ]}
                        >
                          {isChecked && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                        </View>
                        <Text
                          style={[
                            styles.symptomText,
                            isChecked && { color: category.color, fontWeight: FontWeight.semibold },
                          ]}
                        >
                          {symptom.text}
                        </Text>
                        {/* Severity indicator */}
                        <View style={styles.severityDots}>
                          {Array.from({ length: symptom.severity }).map((_, i) => (
                            <View
                              key={i}
                              style={[
                                styles.severityDot,
                                { backgroundColor: isChecked ? category.color : Colors.border },
                              ]}
                            />
                          ))}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Ionicons name="shield-checkmark" size={22} color={Colors.white} />
            <Text style={styles.submitButtonText}>Lihat Hasil Pemeriksaan</Text>
          </TouchableOpacity>

          {checkedSymptoms.size > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.resetButton}
              onPress={handleReset}
            >
              <Ionicons name="refresh-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.resetButtonText}>Reset Pemeriksaan</Text>
            </TouchableOpacity>
          )}
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
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },

  // Instruction Card
  instructionCard: {
    marginBottom: Spacing.lg,
    borderColor: Colors.secondary + '40',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  instructionText: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.secondary,
    marginBottom: 4,
  },
  instructionDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Progress
  progressSection: {
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  progressCount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },

  // Category
  categoryContainer: {
    marginBottom: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  categoryBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  categoryDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Symptoms
  symptomsContainer: {
    marginTop: Spacing.sm,
    marginLeft: Spacing.lg,
    borderLeftWidth: 2,
    borderLeftColor: Colors.border,
    paddingLeft: Spacing.md,
  },
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  symptomCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  symptomText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  severityDots: {
    flexDirection: 'row',
    gap: 3,
    marginLeft: Spacing.sm,
  },
  severityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Actions
  actionSection: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  submitButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  resetButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
});

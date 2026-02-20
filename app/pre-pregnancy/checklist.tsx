import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { PRE_PREGNANCY_ITEMS } from '@/constants/data';
import { getPrePregnancyChecklist, savePrePregnancyChecklist } from '@/utils/storage';
import { PrePregnancyChecklist } from '@/types';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import ChecklistItem from '@/components/ui/ChecklistItem';

const DEFAULT_CHECKLIST: PrePregnancyChecklist = {
  profileId: '',
  asamFolat: false,
  pemeriksaanKesehatan: false,
  imunisasiTT: false,
  polaMakanSehat: false,
  olahragaTeratur: false,
  berhentiMerokok: false,
  kurangiKafein: false,
  kelolStres: false,
  periksaGigi: false,
  catatSiklusMenstruasi: false,
};

const CHECKLIST_KEYS = PRE_PREGNANCY_ITEMS.map((item) => item.key) as (keyof Omit<PrePregnancyChecklist, 'profileId'>)[];

export default function PrePregnancyChecklistScreen() {
  const [checklist, setChecklist] = useState<PrePregnancyChecklist>(DEFAULT_CHECKLIST);
  const [isLoading, setIsLoading] = useState(true);

  const loadChecklist = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await getPrePregnancyChecklist();
      if (stored) {
        setChecklist(stored as PrePregnancyChecklist);
      }
    } catch (error) {
      console.error('Gagal memuat checklist:', error);
      Alert.alert('Kesalahan', 'Gagal memuat data checklist. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  const toggleItem = async (key: keyof Omit<PrePregnancyChecklist, 'profileId'>) => {
    try {
      const updated: PrePregnancyChecklist = {
        ...checklist,
        [key]: !checklist[key],
      };
      setChecklist(updated);
      await savePrePregnancyChecklist(updated);
    } catch (error) {
      console.error('Gagal menyimpan checklist:', error);
      // Revert on error
      setChecklist(checklist);
      Alert.alert('Kesalahan', 'Gagal menyimpan perubahan. Silakan coba lagi.');
    }
  };

  const completedCount = CHECKLIST_KEYS.filter((key) => checklist[key]).length;
  const totalCount = CHECKLIST_KEYS.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Header title="Checklist Pra Hamil" showBack />
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
        title="Checklist Pra Hamil"
        subtitle="Persiapan sebelum kehamilan"
        showBack
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Summary */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIconContainer}>
              <Ionicons name="heart-outline" size={24} color={Colors.praHamil} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTitle}>Progres Persiapan</Text>
              <Text style={styles.progressSubtitle}>
                {completedCount}/{totalCount} item selesai
              </Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          </View>
          <ProgressBar
            progress={progress}
            color={Colors.praHamil}
            height={10}
            showLabel={false}
          />
          {completedCount === totalCount && (
            <View style={styles.completedBanner}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.completedText}>
                Semua persiapan selesai! Anda siap untuk program hamil.
              </Text>
            </View>
          )}
        </Card>

        {/* Checklist Items */}
        <Text style={styles.sectionTitle}>Daftar Persiapan</Text>

        {PRE_PREGNANCY_ITEMS.map((item) => {
          const key = item.key as keyof Omit<PrePregnancyChecklist, 'profileId'>;
          return (
            <ChecklistItem
              key={item.key}
              title={item.title}
              description={item.description}
              checked={checklist[key] ?? false}
              onToggle={() => toggleItem(key)}
              icon={item.icon as keyof typeof Ionicons.glyphMap}
              color={Colors.praHamil}
            />
          );
        })}

        {/* Tips Card */}
        <Card style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={22} color={Colors.accent} />
            <Text style={styles.tipsTitle}>Tips Pra Kehamilan</Text>
          </View>
          <Text style={styles.tipsText}>
            Persiapan yang baik sebelum hamil akan membantu kesehatan ibu dan bayi.
            Mulailah persiapan minimal 3 bulan sebelum program hamil. Konsultasikan
            dengan dokter atau bidan untuk panduan yang lebih lengkap sesuai kondisi
            kesehatan Anda.
          </Text>
          <View style={styles.tipsDivider} />
          <View style={styles.tipsRow}>
            <Ionicons name="star-outline" size={16} color={Colors.praHamil} />
            <Text style={styles.tipsHighlight}>
              Asam folat sangat penting untuk mencegah cacat tabung saraf pada janin.
            </Text>
          </View>
          <View style={styles.tipsRow}>
            <Ionicons name="star-outline" size={16} color={Colors.praHamil} />
            <Text style={styles.tipsHighlight}>
              Pola hidup sehat meningkatkan peluang kehamilan yang sehat dan lancar.
            </Text>
          </View>
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
  progressCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.praHamilBg,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  progressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  progressTextContainer: {
    flex: 1,
  },
  progressTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  progressSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: Colors.praHamil,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  progressBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: Colors.successBg,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  completedText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.success,
    fontWeight: FontWeight.medium,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  tipsCard: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.accentBg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tipsTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  tipsText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  tipsDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  tipsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tipsHighlight: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});

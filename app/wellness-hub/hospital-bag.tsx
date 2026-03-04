// KIA Care - Hospital Bag Checklist
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getHospitalBag, saveHospitalBag } from '@/utils/storage';
import { HospitalBagData } from '@/types';
import ProgressBar from '@/components/ui/ProgressBar';

type CategoryKey = 'perlengkapanIbu' | 'perlengkapanBayi' | 'dokumenPenting';

const DEFAULT_BAG_DATA = (profileId: string): HospitalBagData => ({
  profileId,
  perlengkapanIbu: [
    { id: 'ibu-1', label: 'Baju ganti (3-4 set)', checked: false },
    { id: 'ibu-2', label: 'Pakaian dalam (4-5 pcs)', checked: false },
    { id: 'ibu-3', label: 'Pembalut nifas', checked: false },
    { id: 'ibu-4', label: 'Bra menyusui (2-3 pcs)', checked: false },
    { id: 'ibu-5', label: 'Sandal & kaos kaki', checked: false },
    { id: 'ibu-6', label: 'Perlengkapan mandi', checked: false },
    { id: 'ibu-7', label: 'Handuk kecil & besar', checked: false },
    { id: 'ibu-8', label: 'Kacamata/lensa kontak', checked: false },
    { id: 'ibu-9', label: 'Charger HP & powerbank', checked: false },
    { id: 'ibu-10', label: 'Snack & minuman', checked: false },
    { id: 'ibu-11', label: 'Bantal/selimut favorit', checked: false },
    { id: 'ibu-12', label: 'Breast pad', checked: false },
  ],
  perlengkapanBayi: [
    { id: 'bayi-1', label: 'Baju bayi (4-5 set)', checked: false },
    { id: 'bayi-2', label: 'Popok newborn (1 pak)', checked: false },
    { id: 'bayi-3', label: 'Topi bayi', checked: false },
    { id: 'bayi-4', label: 'Sarung tangan & kaki', checked: false },
    { id: 'bayi-5', label: 'Selimut bayi', checked: false },
    { id: 'bayi-6', label: 'Kain bedong (2-3 pcs)', checked: false },
    { id: 'bayi-7', label: 'Washlap bayi', checked: false },
    { id: 'bayi-8', label: 'Minyak telon', checked: false },
    { id: 'bayi-9', label: 'Gendongan bayi', checked: false },
    { id: 'bayi-10', label: 'Car seat / tempat bayi', checked: false },
  ],
  dokumenPenting: [
    { id: 'doc-1', label: 'KTP suami & istri', checked: false },
    { id: 'doc-2', label: 'Kartu BPJS / Asuransi', checked: false },
    { id: 'doc-3', label: 'Buku KIA', checked: false },
    { id: 'doc-4', label: 'Kartu Keluarga', checked: false },
    { id: 'doc-5', label: 'Surat nikah (fotokopi)', checked: false },
    { id: 'doc-6', label: 'Hasil lab & USG', checked: false },
    { id: 'doc-7', label: 'Uang tunai / ATM', checked: false },
    { id: 'doc-8', label: 'Daftar kontak darurat', checked: false },
  ],
});

const CATEGORIES: { key: CategoryKey; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'perlengkapanIbu', label: 'Perlengkapan Ibu', icon: 'woman-outline', color: Colors.primary },
  { key: 'perlengkapanBayi', label: 'Perlengkapan Bayi', icon: 'happy-outline', color: Colors.secondary },
  { key: 'dokumenPenting', label: 'Dokumen Penting', icon: 'document-text-outline', color: Colors.accent },
];

export default function HospitalBagScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeProfile } = useApp();

  const [bagData, setBagData] = useState<HospitalBagData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<CategoryKey | null>('perlengkapanIbu');

  const loadData = useCallback(async () => {
    try {
      const stored = await getHospitalBag();
      if (stored && (stored as HospitalBagData).profileId === activeProfile?.id) {
        setBagData(stored as HospitalBagData);
      } else if (activeProfile) {
        const defaultData = DEFAULT_BAG_DATA(activeProfile.id);
        setBagData(defaultData);
        await saveHospitalBag(defaultData);
      }
    } catch (error) {
      console.error('Error loading hospital bag:', error);
      if (activeProfile) {
        setBagData(DEFAULT_BAG_DATA(activeProfile.id));
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleItem = async (category: CategoryKey, itemId: string) => {
    if (!bagData) return;

    const updatedData = { ...bagData };
    updatedData[category] = updatedData[category].map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );

    setBagData(updatedData);
    await saveHospitalBag(updatedData);
  };

  const getTotalProgress = (): { checked: number; total: number } => {
    if (!bagData) return { checked: 0, total: 0 };
    const allItems = [
      ...bagData.perlengkapanIbu,
      ...bagData.perlengkapanBayi,
      ...bagData.dokumenPenting,
    ];
    return {
      checked: allItems.filter((i) => i.checked).length,
      total: allItems.length,
    };
  };

  const getCategoryProgress = (category: CategoryKey): { checked: number; total: number } => {
    if (!bagData) return { checked: 0, total: 0 };
    const items = bagData[category];
    return {
      checked: items.filter((i) => i.checked).length,
      total: items.length,
    };
  };

  const { checked: totalChecked, total: totalItems } = getTotalProgress();
  const overallProgress = totalItems > 0 ? totalChecked / totalItems : 0;
  const progressPercent = Math.round(overallProgress * 100);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.primaryDark} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Tas Rumah Sakit</Text>
          <Text style={styles.headerSubtitle}>Checklist perlengkapan persalinan</Text>
        </View>
        <Text style={{ fontSize: 28 }}>🧳</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Overall Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>Kesiapan Anda</Text>
              <Text style={styles.progressSubtitle}>
                {totalChecked} dari {totalItems} item siap
              </Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{progressPercent}% Siap</Text>
            </View>
          </View>
          <ProgressBar
            progress={overallProgress}
            color={
              progressPercent >= 80
                ? Colors.success
                : progressPercent >= 50
                ? Colors.accent
                : Colors.primary
            }
            height={10}
          />
          {progressPercent >= 80 && (
            <View style={styles.readyBanner}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.readyBannerText}>
                Hampir siap! Tinggal sedikit lagi 🎉
              </Text>
            </View>
          )}
          {progressPercent === 100 && (
            <View style={[styles.readyBanner, { backgroundColor: Colors.successBg }]}>
              <Ionicons name="trophy" size={18} color={Colors.success} />
              <Text style={[styles.readyBannerText, { color: Colors.success }]}>
                Semua siap! Tas sudah lengkap! 🏆
              </Text>
            </View>
          )}
        </View>

        {/* Categories */}
        {CATEGORIES.map((cat) => {
          const isExpanded = expandedCategory === cat.key;
          const { checked, total } = getCategoryProgress(cat.key);
          const catProgress = total > 0 ? checked / total : 0;
          const items = bagData ? bagData[cat.key] : [];

          return (
            <View key={cat.key} style={styles.categorySection}>
              <TouchableOpacity
                style={[
                  styles.categoryHeader,
                  isExpanded && { backgroundColor: cat.color + '08', borderColor: cat.color + '30' },
                ]}
                onPress={() => setExpandedCategory(isExpanded ? null : cat.key)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIcon, { backgroundColor: cat.color + '15' }]}>
                  <Ionicons name={cat.icon} size={22} color={cat.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                  <View style={styles.categoryProgressRow}>
                    <View style={styles.categoryProgressTrack}>
                      <View
                        style={[
                          styles.categoryProgressFill,
                          { width: `${catProgress * 100}%`, backgroundColor: cat.color },
                        ]}
                      />
                    </View>
                    <Text style={[styles.categoryCount, { color: cat.color }]}>
                      {checked}/{total}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.categoryItems}>
                  {items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.checkItem,
                        item.checked && { backgroundColor: cat.color + '08' },
                      ]}
                      onPress={() => handleToggleItem(cat.key, item.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          item.checked && { backgroundColor: cat.color, borderColor: cat.color },
                        ]}
                      >
                        {item.checked && (
                          <Ionicons name="checkmark" size={14} color={Colors.white} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.checkItemText,
                          item.checked && styles.checkItemTextChecked,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={18} color={Colors.accent} />
            <Text style={styles.tipsTitle}>Tips</Text>
          </View>
          <Text style={styles.tipsText}>
            • Siapkan tas sejak minggu ke-36{'\n'}
            • Taruh tas di tempat yang mudah dijangkau{'\n'}
            • Beri tahu suami/keluarga lokasi tas{'\n'}
            • Sertakan makanan ringan untuk energi{'\n'}
            • Jangan lupa charger HP!
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
    backgroundColor: Colors.primaryBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryLight,
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
    color: Colors.primaryDark,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    marginTop: 2,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  progressSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  progressBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primaryDark,
  },
  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: Colors.accentBg,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  readyBannerText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.accentDark,
  },
  categorySection: {
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
  categoryLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  categoryProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  categoryCount: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  categoryItems: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginVertical: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkItemText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  checkItemTextChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  tipsCard: {
    backgroundColor: Colors.accentBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tipsTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.accentDark,
  },
  tipsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});

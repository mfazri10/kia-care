// KIA Care - Partner Mode (Akses Suami) with Cloud Sync
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import {
  getPartnerSync,
  savePartnerSync,
  getCloudSyncEnabled,
  saveCloudSyncEnabled,
} from '@/utils/storage';
import { PartnerSyncData } from '@/types';

interface TipItem {
  id: string;
  icon: string;
  title: string;
  content: string;
}

const TIPS_AYAH: TipItem[] = [
  {
    id: 'tip-1',
    icon: '🤝',
    title: 'Temani ke Dokter',
    content:
      'Usahakan menemani istri saat kontrol kehamilan. Tanyakan hal-hal penting kepada dokter dan catat informasi yang didapat.',
  },
  {
    id: 'tip-2',
    icon: '💆‍♂️',
    title: 'Bantu Pijat Ringan',
    content:
      'Pijat lembut di bagian punggung bawah, kaki, dan bahu bisa sangat membantu meringankan ketidaknyamanan selama kehamilan.',
  },
  {
    id: 'tip-3',
    icon: '🍳',
    title: 'Siapkan Makanan Sehat',
    content:
      'Bantu menyiapkan makanan bergizi. Pastikan istri mendapat asupan protein, sayuran, dan buah yang cukup setiap hari.',
  },
  {
    id: 'tip-4',
    icon: '💤',
    title: 'Pastikan Istirahat Cukup',
    content:
      'Bantu mengambil alih tugas rumah agar istri bisa beristirahat. Tidur yang cukup sangat penting untuk kesehatan ibu dan bayi.',
  },
  {
    id: 'tip-5',
    icon: '🗣️',
    title: 'Dengarkan & Komunikasi',
    content:
      'Hormon kehamilan bisa mempengaruhi emosi. Jadilah pendengar yang baik tanpa menghakimi. Tanyakan perasaannya setiap hari.',
  },
  {
    id: 'tip-6',
    icon: '🏥',
    title: 'Siapkan Persalinan',
    content:
      'Bantu mempersiapkan tas rumah sakit, kenali rute ke RS, dan pelajari tanda-tanda persalinan agar siap kapan saja.',
  },
  {
    id: 'tip-7',
    icon: '🧸',
    title: 'Siapkan Kamar Bayi',
    content:
      'Libatkan diri dalam mempersiapkan kebutuhan bayi. Ini membantu membangun ikatan emosional sebagai calon ayah.',
  },
  {
    id: 'tip-8',
    icon: '📚',
    title: 'Ikut Belajar',
    content:
      'Ikut kelas parenting atau baca buku tentang kehamilan dan perawatan bayi. Pengetahuan akan membuat Anda lebih percaya diri.',
  },
];

export default function PartnerModeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeProfile } = useApp();

  const [partnerData, setPartnerData] = useState<PartnerSyncData | null>(null);
  const [cloudSync, setCloudSync] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [partnerName, setPartnerName] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const stored = await getPartnerSync();
      if (stored && (stored as PartnerSyncData).profileId === activeProfile?.id) {
        setPartnerData(stored as PartnerSyncData);
        setPartnerName((stored as PartnerSyncData).partnerName || '');
      }

      const syncEnabled = await getCloudSyncEnabled();
      setCloudSync(syncEnabled || false);
    } catch (error) {
      console.error('Error loading partner data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLinkPartner = async () => {
    if (!partnerName.trim() || !activeProfile) {
      Alert.alert('Error', 'Masukkan nama pasangan');
      return;
    }

    const data: PartnerSyncData = {
      profileId: activeProfile.id,
      partnerLinked: true,
      partnerName: partnerName.trim(),
      syncEnabled: cloudSync,
      lastSynced: new Date().toISOString(),
    };

    setPartnerData(data);
    await savePartnerSync(data);
    setShowLinkInput(false);
    Alert.alert('Berhasil', `Akun pasangan "${partnerName.trim()}" berhasil ditautkan!`);
  };

  const handleUnlinkPartner = () => {
    Alert.alert(
      'Lepas Tautan',
      'Apakah Anda yakin ingin melepas tautan dengan pasangan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Lepas',
          style: 'destructive',
          onPress: async () => {
            if (!activeProfile) return;
            const data: PartnerSyncData = {
              profileId: activeProfile.id,
              partnerLinked: false,
              partnerName: undefined,
              syncEnabled: false,
            };
            setPartnerData(data);
            setPartnerName('');
            await savePartnerSync(data);
          },
        },
      ]
    );
  };

  const handleToggleCloudSync = async (value: boolean) => {
    setCloudSync(value);
    await saveCloudSyncEnabled(value);

    if (partnerData && activeProfile) {
      const updated = { ...partnerData, syncEnabled: value };
      setPartnerData(updated);
      await savePartnerSync(updated);
    }

    if (value) {
      Alert.alert(
        'Cloud Backup Aktif',
        'Data Anda akan disinkronkan ke cloud. Fitur ini memerlukan koneksi internet.',
        [{ text: 'OK' }]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.skyBlue} />
        </View>
      </View>
    );
  }

  const isLinked = partnerData?.partnerLinked === true;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.skyBlueDark} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Partner Mode</Text>
          <Text style={styles.headerSubtitle}>Akses Suami & Sinkronisasi</Text>
        </View>
        <Text style={{ fontSize: 28 }}>👫</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Partner Link Status Card */}
        <View style={styles.linkCard}>
          <View style={styles.linkCardHeader}>
            <View
              style={[
                styles.linkStatusIcon,
                { backgroundColor: isLinked ? Colors.successBg : Colors.surfaceSecondary },
              ]}
            >
              <Ionicons
                name={isLinked ? 'link' : 'link-outline'}
                size={24}
                color={isLinked ? Colors.success : Colors.textTertiary}
              />
            </View>
            <View style={styles.linkStatusInfo}>
              <Text style={styles.linkStatusTitle}>
                {isLinked ? 'Akun Terhubung' : 'Belum Terhubung'}
              </Text>
              {isLinked && partnerData?.partnerName && (
                <Text style={styles.linkStatusName}>
                  Pasangan: {partnerData.partnerName}
                </Text>
              )}
              {isLinked && partnerData?.lastSynced && (
                <Text style={styles.linkStatusTime}>
                  Terakhir sync:{' '}
                  {new Date(partnerData.lastSynced).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              )}
              {!isLinked && (
                <Text style={styles.linkStatusDesc}>
                  Hubungkan akun pasangan untuk berbagi informasi kehamilan
                </Text>
              )}
            </View>
          </View>

          {isLinked ? (
            <View style={styles.linkActions}>
              <View style={[styles.syncIndicator, { backgroundColor: Colors.successBg }]}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={[styles.syncText, { color: Colors.success }]}>
                  Sync Aktif
                </Text>
              </View>
              <TouchableOpacity
                style={styles.unlinkBtn}
                onPress={handleUnlinkPartner}
              >
                <Text style={styles.unlinkBtnText}>Lepas Tautan</Text>
              </TouchableOpacity>
            </View>
          ) : showLinkInput ? (
            <View style={styles.linkInputWrap}>
              <TextInput
                style={styles.linkInput}
                placeholder="Nama pasangan"
                placeholderTextColor={Colors.textTertiary}
                value={partnerName}
                onChangeText={setPartnerName}
                autoCapitalize="words"
                autoFocus
              />
              <View style={styles.linkInputActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowLinkInput(false)}
                >
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.linkBtn,
                    !partnerName.trim() && styles.linkBtnDisabled,
                  ]}
                  onPress={handleLinkPartner}
                  disabled={!partnerName.trim()}
                >
                  <Ionicons name="link" size={16} color={Colors.white} />
                  <Text style={styles.linkBtnText}>Hubungkan</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.connectBtn}
              onPress={() => setShowLinkInput(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.skyBlue} />
              <Text style={styles.connectBtnText}>Hubungkan Akun Pasangan</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Cloud Sync Toggle */}
        <View style={styles.syncCard}>
          <View style={styles.syncCardHeader}>
            <View style={styles.syncCardIcon}>
              <Ionicons name="cloud-outline" size={24} color={Colors.skyBlue} />
            </View>
            <View style={styles.syncCardInfo}>
              <Text style={styles.syncCardTitle}>Cloud Backup & Sync</Text>
              <Text style={styles.syncCardDesc}>
                Sinkronkan data ke cloud untuk keamanan dan akses lintas perangkat
              </Text>
            </View>
            <Switch
              value={cloudSync}
              onValueChange={handleToggleCloudSync}
              trackColor={{ false: Colors.border, true: Colors.skyBlueLight }}
              thumbColor={cloudSync ? Colors.skyBlue : Colors.surfaceSecondary}
            />
          </View>
          {cloudSync && (
            <View style={styles.syncFeatures}>
              <View style={styles.syncFeatureRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.syncFeatureText}>Backup otomatis data kesehatan</Text>
              </View>
              <View style={styles.syncFeatureRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.syncFeatureText}>Sinkronisasi lintas perangkat</Text>
              </View>
              <View style={styles.syncFeatureRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.syncFeatureText}>Berbagi data dengan pasangan</Text>
              </View>
            </View>
          )}
        </View>

        {/* Tips Ayah Section */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsSectionHeader}>
            <Text style={styles.tipsSectionTitle}>Tips Ayah 💙</Text>
            <Text style={styles.tipsSectionSubtitle}>
              Panduan praktis mendampingi istri selama kehamilan
            </Text>
          </View>

          {TIPS_AYAH.map((tip) => {
            const isExpanded = expandedTip === tip.id;
            return (
              <TouchableOpacity
                key={tip.id}
                style={[styles.tipCard, isExpanded && styles.tipCardExpanded]}
                onPress={() => setExpandedTip(isExpanded ? null : tip.id)}
                activeOpacity={0.7}
              >
                <View style={styles.tipHeader}>
                  <Text style={styles.tipIcon}>{tip.icon}</Text>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={Colors.textSecondary}
                  />
                </View>
                {isExpanded && (
                  <Text style={styles.tipContent}>{tip.content}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.skyBlueDark} />
          <Text style={styles.infoText}>
            Partner Mode memungkinkan pasangan Anda untuk melihat informasi kehamilan,
            jadwal kontrol, dan tips perawatan bersama. Data Anda tetap aman dan terenkripsi.
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
    backgroundColor: Colors.skyBlueBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.skyBlueLight,
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
    color: Colors.skyBlueDark,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.skyBlue,
    marginTop: 2,
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  linkCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  linkCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  linkStatusIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  linkStatusInfo: {
    flex: 1,
  },
  linkStatusTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  linkStatusName: {
    fontSize: FontSize.md,
    color: Colors.skyBlueDark,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  linkStatusTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  linkStatusDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  linkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  syncText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  unlinkBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.danger + '40',
  },
  unlinkBtnText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: FontWeight.medium,
  },
  linkInputWrap: {
    gap: Spacing.md,
  },
  linkInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  cancelBtnText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.skyBlue,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  linkBtnDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  linkBtnText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.skyBlueBg,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.skyBlueLight,
    borderStyle: 'dashed',
  },
  connectBtnText: {
    fontSize: FontSize.md,
    color: Colors.skyBlue,
    fontWeight: FontWeight.medium,
  },
  syncCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  syncCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  syncCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.skyBlueBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  syncCardInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  syncCardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  syncCardDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  syncFeatures: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  syncFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  syncFeatureText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  tipsSection: {
    marginBottom: Spacing.xl,
  },
  tipsSectionHeader: {
    marginBottom: Spacing.lg,
  },
  tipsSectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  tipsSectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  tipCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  tipCardExpanded: {
    backgroundColor: Colors.skyBlueBg,
    borderWidth: 1,
    borderColor: Colors.skyBlueLight,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tipIcon: {
    fontSize: 24,
  },
  tipTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  tipContent: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: Spacing.md,
    paddingLeft: Spacing.xxxl + Spacing.sm,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.skyBlueBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.skyBlueLight,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.skyBlueDark,
    lineHeight: 20,
  },
});

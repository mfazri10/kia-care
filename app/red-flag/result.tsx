// KIA Care - Red Flag Emergency System: Result Screen
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Card from '@/components/ui/Card';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type StatusLevel = 'normal' | 'caution' | 'warning' | 'critical';

interface StatusConfig {
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  recommendations: string[];
  urgencyText: string;
}

const STATUS_CONFIGS: Record<StatusLevel, StatusConfig> = {
  normal: {
    title: 'Normal',
    subtitle: 'Tidak ada tanda bahaya terdeteksi',
    color: '#27AE60',
    bgColor: '#F0FFF5',
    borderColor: '#D5F5E3',
    icon: 'checkmark-circle',
    urgencyText: 'Kondisi Anda baik',
    recommendations: [
      'Terus lakukan pemeriksaan rutin sesuai jadwal ANC',
      'Jaga pola makan bergizi seimbang',
      'Istirahat yang cukup dan olahraga ringan',
      'Minum Tablet Tambah Darah sesuai anjuran',
      'Segera periksa jika ada keluhan baru',
    ],
  },
  caution: {
    title: 'Waspada',
    subtitle: 'Ada beberapa gejala yang perlu diperhatikan',
    color: '#F1C40F',
    bgColor: '#FFFEF0',
    borderColor: '#FEF9E7',
    icon: 'alert-circle',
    urgencyText: 'Pantau kondisi Anda',
    recommendations: [
      'Monitor gejala yang Anda rasakan dengan cermat',
      'Catat frekuensi dan intensitas gejala',
      'Jadwalkan kunjungan ke bidan/dokter dalam 1-2 hari',
      'Istirahat lebih banyak dan hindari aktivitas berat',
      'Hubungi tenaga kesehatan jika gejala memburuk',
    ],
  },
  warning: {
    title: 'Peringatan',
    subtitle: 'Ditemukan gejala yang memerlukan perhatian medis',
    color: '#E67E22',
    bgColor: '#FFF8F0',
    borderColor: '#FDEBD0',
    icon: 'warning',
    urgencyText: 'Segera hubungi bidan/dokter',
    recommendations: [
      'Segera hubungi bidan atau dokter Anda hari ini',
      'Jangan tunda untuk memeriksakan diri',
      'Siapkan dokumen kesehatan (buku KIA, hasil lab)',
      'Minta seseorang menemani Anda ke fasilitas kesehatan',
      'Jika kondisi memburuk, segera ke IGD rumah sakit',
    ],
  },
  critical: {
    title: 'DARURAT',
    subtitle: 'Kondisi darurat medis terdeteksi!',
    color: '#E74C3C',
    bgColor: '#FFF5F5',
    borderColor: '#FADBD8',
    icon: 'alert',
    urgencyText: 'SEGERA KE IGD / RS TERDEKAT!',
    recommendations: [
      'SEGERA pergi ke IGD rumah sakit terdekat!',
      'Hubungi ambulans atau minta bantuan orang terdekat',
      'Jangan menunda - setiap menit sangat berharga',
      'Bawa buku KIA dan dokumen identitas',
      'Informasikan kondisi Anda kepada petugas medis',
    ],
  },
};

export default function RedFlagResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    score: string;
    status: string;
    symptoms: string;
    checkedCount: string;
  }>();

  const score = parseInt(params.score || '0', 10);
  const status = (params.status || 'normal') as StatusLevel;
  const selectedSymptoms: string[] = useMemo(() => {
    try {
      return JSON.parse(params.symptoms || '[]');
    } catch {
      return [];
    }
  }, [params.symptoms]);
  const checkedCount = parseInt(params.checkedCount || '0', 10);

  const config = STATUS_CONFIGS[status];

  const handleCallEmergency = () => {
    const url = 'tel:119';
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Info', 'Hubungi nomor darurat 119 ext 8 untuk ambulans.');
        }
      })
      .catch(() => {
        Alert.alert('Info', 'Hubungi nomor darurat 119 ext 8 untuk ambulans.');
      });
  };

  const handleCallContact = () => {
    Alert.alert(
      'Hubungi Kontak Darurat',
      'Pilih tindakan:',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hubungi 119 (Ambulans)',
          onPress: () => {
            Linking.openURL('tel:119').catch(() => {
              Alert.alert('Info', 'Tidak dapat membuka aplikasi telepon.');
            });
          },
        },
        {
          text: 'Hubungi 112 (Darurat)',
          onPress: () => {
            Linking.openURL('tel:112').catch(() => {
              Alert.alert('Info', 'Tidak dapat membuka aplikasi telepon.');
            });
          },
        },
      ]
    );
  };

  const handleGoBack = () => {
    router.dismissAll();
  };

  return (
    <View style={styles.container}>
      {/* Status Header */}
      <View style={[styles.statusHeader, { paddingTop: insets.top + Spacing.md, backgroundColor: config.bgColor }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={config.color} />
        </TouchableOpacity>

        <View style={styles.statusContent}>
          <View style={[styles.statusIconContainer, { backgroundColor: config.color + '20' }]}>
            <Ionicons name={config.icon} size={48} color={config.color} />
          </View>
          <Text style={[styles.statusTitle, { color: config.color }]}>{config.title}</Text>
          <Text style={styles.statusSubtitle}>{config.subtitle}</Text>

          {/* Score Display */}
          <View style={[styles.scoreContainer, { borderColor: config.color + '30' }]}>
            <Text style={styles.scoreLabel}>Skor Risiko</Text>
            <Text style={[styles.scoreValue, { color: config.color }]}>{score}</Text>
            <Text style={styles.scoreSubtext}>{checkedCount} gejala terdeteksi</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Urgency Banner */}
        <View style={[styles.urgencyBanner, { backgroundColor: config.color + '12', borderColor: config.color + '30' }]}>
          <Ionicons name="time-outline" size={20} color={config.color} />
          <Text style={[styles.urgencyText, { color: config.color }]}>{config.urgencyText}</Text>
        </View>

        {/* Selected Symptoms */}
        {selectedSymptoms.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Gejala Terdeteksi</Text>
            <Card style={[styles.symptomsCard, { borderLeftWidth: 4, borderLeftColor: config.color }]}>
              {selectedSymptoms.map((symptom, index) => (
                <View key={index} style={[styles.symptomItem, index < selectedSymptoms.length - 1 && styles.symptomItemBorder]}>
                  <View style={[styles.symptomDot, { backgroundColor: config.color }]} />
                  <Text style={styles.symptomText}>{symptom}</Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Recommendations */}
        <Text style={styles.sectionTitle}>Rekomendasi</Text>
        <Card style={styles.recommendationCard}>
          {config.recommendations.map((rec, index) => (
            <View key={index} style={[styles.recItem, index < config.recommendations.length - 1 && styles.recItemBorder]}>
              <View style={[styles.recNumber, { backgroundColor: config.color + '15' }]}>
                <Text style={[styles.recNumberText, { color: config.color }]}>{index + 1}</Text>
              </View>
              <Text style={styles.recText}>{rec}</Text>
            </View>
          ))}
        </Card>

        {/* Emergency Contact Button */}
        {(status === 'warning' || status === 'critical') && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.emergencyButton}
            onPress={handleCallEmergency}
          >
            <View style={styles.emergencyIcon}>
              <Ionicons name="call" size={28} color={Colors.white} />
            </View>
            <View style={styles.emergencyContent}>
              <Text style={styles.emergencyTitle}>Hubungi Kontak Darurat</Text>
              <Text style={styles.emergencySubtitle}>Panggil ambulans 119 ext 8</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.white} />
          </TouchableOpacity>
        )}

        {/* Secondary emergency for all non-normal */}
        {status !== 'normal' && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.contactButton}
            onPress={handleCallContact}
          >
            <Ionicons name="call-outline" size={20} color={Colors.danger} />
            <Text style={styles.contactButtonText}>Hubungi Nomor Darurat Lainnya</Text>
          </TouchableOpacity>
        )}

        {/* Disclaimer */}
        <Card style={styles.disclaimerCard} variant="outlined">
          <View style={styles.disclaimerRow}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textTertiary} />
            <Text style={styles.disclaimerText}>
              Hasil pemeriksaan ini bersifat skrining awal dan bukan diagnosis medis. Selalu konsultasikan dengan tenaga kesehatan profesional untuk penanganan yang tepat.
            </Text>
          </View>
        </Card>

        {/* Back to Dashboard */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.dashboardButton}
          onPress={handleGoBack}
        >
          <Ionicons name="home-outline" size={20} color={Colors.white} />
          <Text style={styles.dashboardButtonText}>Kembali ke Dashboard</Text>
        </TouchableOpacity>

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

  // Status Header
  statusHeader: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white + '80',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statusContent: {
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statusTitle: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  statusSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadow.sm,
  },
  scoreLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  scoreValue: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.bold,
  },
  scoreSubtext: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },

  // Scroll content
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },

  // Urgency
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  urgencyText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    flex: 1,
  },

  // Section
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Symptoms
  symptomsCard: {
    marginBottom: Spacing.lg,
  },
  symptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  symptomItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  symptomDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.md,
  },
  symptomText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },

  // Recommendations
  recommendationCard: {
    marginBottom: Spacing.lg,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  recItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  recNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  recNumberText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  recText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
  },

  // Emergency
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  emergencyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.white + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  emergencySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.white + 'CC',
    marginTop: 2,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dangerLight,
    backgroundColor: Colors.dangerBg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  contactButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.danger,
  },

  // Disclaimer
  disclaimerCard: {
    marginBottom: Spacing.lg,
    borderColor: Colors.border,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 18,
  },

  // Dashboard Button
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  dashboardButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
});

// KIA Care - Export Buku KIA Digital (Digital Summary)
import React, { useState, useCallback } from 'react';
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
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';

import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';

function formatDateID(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Mini growth chart
function MiniGrowthChart() {
  const chartW = 280;
  const chartH = 100;
  const pL = 30;
  const pR = 10;
  const pT = 10;
  const pB = 20;
  const plotW = chartW - pL - pR;
  const plotH = chartH - pT - pB;

  // Sample data points (weight in grams over months)
  const data = [
    { month: 0, weight: 3200 },
    { month: 1, weight: 4100 },
    { month: 2, weight: 5000 },
    { month: 3, weight: 5800 },
    { month: 4, weight: 6400 },
    { month: 5, weight: 7000 },
  ];

  const minW = 2500;
  const maxW = 8000;

  const getX = (m: number) => pL + (m / 5) * plotW;
  const getY = (w: number) => pT + plotH - ((w - minW) / (maxW - minW)) * plotH;

  const points = data.map(d => `${getX(d.month)},${getY(d.weight)}`).join(' ');

  return (
    <View style={styles.miniChartContainer}>
      <Text style={styles.miniChartTitle}>Kurva Pertumbuhan (BB)</Text>
      <Svg width={chartW} height={chartH}>
        {/* Grid */}
        {[0, 1, 2, 3, 4].map(i => {
          const val = minW + (i / 4) * (maxW - minW);
          const y = getY(val);
          return (
            <React.Fragment key={i}>
              <Line x1={pL} y1={y} x2={chartW - pR} y2={y} stroke="#E0E0E0" strokeWidth={0.5} />
              <SvgText x={pL - 4} y={y + 3} fontSize={7} fill="#999" textAnchor="end">
                {(val / 1000).toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}
        {/* Line */}
        <Polyline
          points={points}
          fill="none"
          stroke={Colors.secondary}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {/* Points */}
        {data.map((d, i) => (
          <React.Fragment key={i}>
            <Circle cx={getX(d.month)} cy={getY(d.weight)} r={3} fill={Colors.white} stroke={Colors.secondary} strokeWidth={1.5} />
            <SvgText x={getX(d.month)} y={chartH - 4} fontSize={7} fill="#999" textAnchor="middle">
              {d.month}bl
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
      <Text style={styles.miniChartUnit}>Berat Badan (kg) vs Usia (bulan)</Text>
    </View>
  );
}

export default function ExportKIAScreen() {
  const { activeProfile } = useApp();
  const [isExporting, setIsExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  // Sample data for summary
  const summary = {
    motherName: activeProfile?.name || 'Ibu',
    phase: activeProfile?.phase === 'hamil' ? 'Masa Kehamilan' : activeProfile?.phase === 'pasca-melahirkan' ? 'Pasca Melahirkan' : 'Pra Kehamilan',
    ancVisits: 4,
    ancTotal: 6,
    ttdStatus: '67 dari 90 tablet',
    immunizationProgress: '6 dari 12 vaksin',
    childGrowth: 'Normal (Persentil 50)',
    babyName: activeProfile?.babyName || 'Si Kecil',
    babyDob: activeProfile?.babyDob || '2025-09-15',
    latestNotes: 'Kondisi ibu dan bayi baik. Pertumbuhan sesuai usia. Lanjutkan pemberian ASI eksklusif dan TTD.',
  };

  const handleExport = useCallback(() => {
    setIsExporting(true);
    setExportDone(false);
    console.log('Generate PDF');

    // Simulate PDF generation
    setTimeout(() => {
      setIsExporting(false);
      setExportDone(true);
      Alert.alert(
        'PDF Siap',
        'Dokumen Buku KIA Digital telah berhasil dibuat. File siap untuk diunduh.',
        [{ text: 'OK' }]
      );
    }, 2500);
  }, []);

  return (
    <View style={styles.container}>
      <Header
        title="Export Buku KIA"
        subtitle="Ringkasan digital kesehatan"
        showBack
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Card */}
        <Card style={styles.summaryCard} variant="elevated">
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIconBg}>
              <Ionicons name="document-text" size={24} color={Colors.primary} />
            </View>
            <View style={styles.summaryHeaderText}>
              <Text style={styles.summaryTitle}>Ringkasan Buku KIA</Text>
              <Text style={styles.summarySubtitle}>Data terkini kesehatan ibu & anak</Text>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryItemIcon, { backgroundColor: Colors.primaryBg }]}>
                <Ionicons name="person" size={18} color={Colors.primary} />
              </View>
              <View style={styles.summaryItemText}>
                <Text style={styles.summaryItemLabel}>Nama Ibu</Text>
                <Text style={styles.summaryItemValue}>{summary.motherName}</Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={[styles.summaryItemIcon, { backgroundColor: Colors.secondaryBg }]}>
                <Ionicons name="heart" size={18} color={Colors.secondary} />
              </View>
              <View style={styles.summaryItemText}>
                <Text style={styles.summaryItemLabel}>Fase Saat Ini</Text>
                <Text style={styles.summaryItemValue}>{summary.phase}</Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={[styles.summaryItemIcon, { backgroundColor: Colors.accentBg }]}>
                <Ionicons name="medkit" size={18} color={Colors.accentDark} />
              </View>
              <View style={styles.summaryItemText}>
                <Text style={styles.summaryItemLabel}>Kunjungan ANC</Text>
                <Text style={styles.summaryItemValue}>{summary.ancVisits} dari {summary.ancTotal}</Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={[styles.summaryItemIcon, { backgroundColor: Colors.warningBg }]}>
                <Ionicons name="medical" size={18} color={Colors.warning} />
              </View>
              <View style={styles.summaryItemText}>
                <Text style={styles.summaryItemLabel}>Status TTD</Text>
                <Text style={styles.summaryItemValue}>{summary.ttdStatus}</Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={[styles.summaryItemIcon, { backgroundColor: '#EBF5FB' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#3498DB" />
              </View>
              <View style={styles.summaryItemText}>
                <Text style={styles.summaryItemLabel}>Imunisasi</Text>
                <Text style={styles.summaryItemValue}>{summary.immunizationProgress}</Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={[styles.summaryItemIcon, { backgroundColor: Colors.successBg }]}>
                <Ionicons name="trending-up" size={18} color={Colors.success} />
              </View>
              <View style={styles.summaryItemText}>
                <Text style={styles.summaryItemLabel}>Tumbuh Kembang</Text>
                <Text style={styles.summaryItemValue}>{summary.childGrowth}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Document Preview */}
        <View style={styles.docPreviewLabel}>
          <Ionicons name="eye-outline" size={18} color={Colors.textPrimary} />
          <Text style={styles.docPreviewLabelText}>Pratinjau Dokumen</Text>
        </View>

        <View style={styles.documentPreview}>
          {/* Document Page */}
          <View style={styles.docPage}>
            {/* Header */}
            <View style={styles.docHeader}>
              <View style={styles.docLogo}>
                <Ionicons name="heart-circle" size={36} color={Colors.primary} />
              </View>
              <View style={styles.docHeaderText}>
                <Text style={styles.docTitle}>BUKU KIA DIGITAL</Text>
                <Text style={styles.docSubtitle}>Kia Care - Kesehatan Ibu & Anak</Text>
              </View>
            </View>
            <View style={styles.docDivider} />

            {/* Identity Section */}
            <Text style={styles.docSectionTitle}>Data Identitas</Text>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Nama Ibu</Text>
              <Text style={styles.docValue}>{summary.motherName}</Text>
            </View>
            <View style={styles.docRow}>
              <Text style={styles.docLabel}>Fase</Text>
              <Text style={styles.docValue}>{summary.phase}</Text>
            </View>
            {activeProfile?.babyName && (
              <View style={styles.docRow}>
                <Text style={styles.docLabel}>Nama Anak</Text>
                <Text style={styles.docValue}>{summary.babyName}</Text>
              </View>
            )}
            {activeProfile?.babyDob && (
              <View style={styles.docRow}>
                <Text style={styles.docLabel}>Tanggal Lahir Anak</Text>
                <Text style={styles.docValue}>{formatDateID(summary.babyDob)}</Text>
              </View>
            )}
            <View style={styles.docDividerLight} />

            {/* Health Summary */}
            <Text style={styles.docSectionTitle}>Ringkasan Kesehatan</Text>
            <View style={styles.docStatsRow}>
              <View style={styles.docStat}>
                <Text style={styles.docStatValue}>{summary.ancVisits}/{summary.ancTotal}</Text>
                <Text style={styles.docStatLabel}>ANC</Text>
              </View>
              <View style={styles.docStat}>
                <Text style={styles.docStatValue}>67/90</Text>
                <Text style={styles.docStatLabel}>TTD</Text>
              </View>
              <View style={styles.docStat}>
                <Text style={styles.docStatValue}>6/12</Text>
                <Text style={styles.docStatLabel}>Imunisasi</Text>
              </View>
            </View>
            <View style={styles.docDividerLight} />

            {/* Mini Growth Chart */}
            <Text style={styles.docSectionTitle}>Pertumbuhan Anak</Text>
            <MiniGrowthChart />
            <View style={styles.docDividerLight} />

            {/* Doctor Notes */}
            <Text style={styles.docSectionTitle}>Catatan Dokter Terakhir</Text>
            <View style={styles.docNotesBox}>
              <Text style={styles.docNotesText}>{summary.latestNotes}</Text>
            </View>

            {/* Footer */}
            <View style={styles.docFooter}>
              <Text style={styles.docFooterText}>
                Dokumen dibuat pada {formatDateID(new Date().toISOString())}
              </Text>
              <Text style={styles.docFooterText}>Kia Care - Aplikasi Kesehatan Ibu & Anak</Text>
            </View>
          </View>
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
          onPress={handleExport}
          activeOpacity={0.7}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <ActivityIndicator color={Colors.white} size="small" />
              <Text style={styles.exportButtonText}>Memproses Dokumen...</Text>
            </>
          ) : exportDone ? (
            <>
              <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
              <Text style={styles.exportButtonText}>PDF Berhasil Dibuat</Text>
            </>
          ) : (
            <>
              <Ionicons name="download-outline" size={22} color={Colors.white} />
              <Text style={styles.exportButtonText}>Download PDF</Text>
            </>
          )}
        </TouchableOpacity>

        {exportDone && (
          <TouchableOpacity
            style={styles.reExportButton}
            onPress={() => { setExportDone(false); }}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={18} color={Colors.primary} />
            <Text style={styles.reExportText}>Buat Ulang PDF</Text>
          </TouchableOpacity>
        )}

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

  // Summary Card
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  summaryIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryHeaderText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  summarySubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryGrid: {
    gap: Spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  summaryItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryItemText: {
    flex: 1,
  },
  summaryItemLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  summaryItemValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },

  // Document Preview
  docPreviewLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  docPreviewLabelText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  documentPreview: {
    backgroundColor: '#F0F0F0',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xxl,
    ...Shadow.md,
  },
  docPage: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xl,
    ...Shadow.sm,
  },

  // Document Header
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  docLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docHeaderText: {
    flex: 1,
  },
  docTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  docSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  docDivider: {
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
    marginBottom: Spacing.lg,
  },
  docDividerLight: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },

  // Document Sections
  docSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  docLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  docValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },

  // Stats
  docStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.sm,
  },
  docStat: {
    alignItems: 'center',
  },
  docStatValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  docStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Mini Chart
  miniChartContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  miniChartTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  miniChartUnit: {
    fontSize: 9,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Notes
  docNotesBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  docNotesText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Footer
  docFooter: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  docFooterText: {
    fontSize: 9,
    color: Colors.textTertiary,
    marginBottom: 2,
  },

  // Export Button
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  exportButtonDisabled: {
    opacity: 0.8,
  },
  exportButtonText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  reExportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  reExportText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
});

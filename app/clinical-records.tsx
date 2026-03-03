// KIA Care - Catatan Pemeriksaan Klinis (Clinical Records)
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';

import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';

interface ClinicalRecord {
  id: string;
  date: string;
  systolic: number;
  diastolic: number;
  hb: number;
  weight: number;
  notes: string;
}

type StatusLevel = 'normal' | 'caution' | 'risk';

function getStatusLevel(record: ClinicalRecord): StatusLevel {
  const { systolic, diastolic, hb } = record;
  if (hb < 11 || systolic > 140 || diastolic > 90) {
    if (hb < 8 || systolic > 160 || diastolic > 100) return 'risk';
    return 'caution';
  }
  return 'normal';
}

function getStatusConfig(status: StatusLevel) {
  switch (status) {
    case 'risk':
      return { label: 'Risiko', color: Colors.danger, bg: Colors.dangerBg, icon: 'alert-circle' as const };
    case 'caution':
      return { label: 'Perhatian', color: Colors.warning, bg: Colors.warningBg, icon: 'warning' as const };
    default:
      return { label: 'Normal', color: Colors.success, bg: Colors.successBg, icon: 'checkmark-circle' as const };
  }
}

function formatDateID(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// BP Trend Chart Component using react-native-svg
function BPTrendChart({ records }: { records: ClinicalRecord[] }) {
  const chartWidth = 320;
  const chartHeight = 180;
  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 32;

  const sortedRecords = useMemo(() =>
    [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [records]
  );

  if (sortedRecords.length < 2) {
    return (
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Ionicons name="trending-up" size={20} color={Colors.primary} />
          <Text style={styles.chartTitle}>Tren Tekanan Darah</Text>
        </View>
        <View style={styles.chartEmpty}>
          <Ionicons name="analytics-outline" size={40} color={Colors.textTertiary} />
          <Text style={styles.chartEmptyText}>Minimal 2 catatan untuk melihat grafik</Text>
        </View>
      </Card>
    );
  }

  const allSystolic = sortedRecords.map(r => r.systolic);
  const allDiastolic = sortedRecords.map(r => r.diastolic);
  const minVal = Math.min(...allDiastolic) - 10;
  const maxVal = Math.max(...allSystolic) + 10;

  const plotW = chartWidth - paddingLeft - paddingRight;
  const plotH = chartHeight - paddingTop - paddingBottom;

  const getX = (i: number) => paddingLeft + (i / (sortedRecords.length - 1)) * plotW;
  const getY = (val: number) => paddingTop + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;

  const systolicPoints = sortedRecords.map((r, i) => `${getX(i)},${getY(r.systolic)}`).join(' ');
  const diastolicPoints = sortedRecords.map((r, i) => `${getX(i)},${getY(r.diastolic)}`).join(' ');

  // Y-axis grid lines
  const ySteps = 5;
  const yLines = Array.from({ length: ySteps + 1 }, (_, i) => {
    const val = Math.round(minVal + (i / ySteps) * (maxVal - minVal));
    return { val, y: getY(val) };
  });

  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Ionicons name="trending-up" size={20} color={Colors.primary} />
        <Text style={styles.chartTitle}>Tren Tekanan Darah</Text>
      </View>
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
          <Text style={styles.legendText}>Sistolik</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.secondary }]} />
          <Text style={styles.legendText}>Diastolik</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: Colors.warning + '60' }]} />
          <Text style={styles.legendText}>Batas (140/90)</Text>
        </View>
      </View>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Grid lines */}
        {yLines.map((line, i) => (
          <React.Fragment key={`grid-${i}`}>
            <Line
              x1={paddingLeft}
              y1={line.y}
              x2={chartWidth - paddingRight}
              y2={line.y}
              stroke={Colors.border}
              strokeWidth={0.5}
            />
            <SvgText
              x={paddingLeft - 6}
              y={line.y + 4}
              fontSize={9}
              fill={Colors.textTertiary}
              textAnchor="end"
            >
              {line.val}
            </SvgText>
          </React.Fragment>
        ))}
        {/* Danger threshold line at 140 */}
        {140 >= minVal && 140 <= maxVal && (
          <Line
            x1={paddingLeft}
            y1={getY(140)}
            x2={chartWidth - paddingRight}
            y2={getY(140)}
            stroke={Colors.warning}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.6}
          />
        )}
        {/* Danger threshold line at 90 */}
        {90 >= minVal && 90 <= maxVal && (
          <Line
            x1={paddingLeft}
            y1={getY(90)}
            x2={chartWidth - paddingRight}
            y2={getY(90)}
            stroke={Colors.warning}
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.6}
          />
        )}
        {/* Systolic line */}
        <Polyline
          points={systolicPoints}
          fill="none"
          stroke={Colors.danger}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Diastolic line */}
        <Polyline
          points={diastolicPoints}
          fill="none"
          stroke={Colors.secondary}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Data points systolic */}
        {sortedRecords.map((r, i) => (
          <Circle
            key={`sys-${i}`}
            cx={getX(i)}
            cy={getY(r.systolic)}
            r={4}
            fill={Colors.white}
            stroke={Colors.danger}
            strokeWidth={2}
          />
        ))}
        {/* Data points diastolic */}
        {sortedRecords.map((r, i) => (
          <Circle
            key={`dia-${i}`}
            cx={getX(i)}
            cy={getY(r.diastolic)}
            r={4}
            fill={Colors.white}
            stroke={Colors.secondary}
            strokeWidth={2}
          />
        ))}
        {/* X-axis labels */}
        {sortedRecords.map((r, i) => {
          const d = new Date(r.date);
          const label = `${d.getDate()}/${d.getMonth() + 1}`;
          return (
            <SvgText
              key={`x-${i}`}
              x={getX(i)}
              y={chartHeight - 6}
              fontSize={9}
              fill={Colors.textTertiary}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </Card>
  );
}

export default function ClinicalRecordsScreen() {
  const { activeProfile } = useApp();

  const [records, setRecords] = useState<ClinicalRecord[]>([
    {
      id: '1',
      date: '2026-02-10',
      systolic: 120,
      diastolic: 80,
      hb: 12.5,
      weight: 58,
      notes: 'Kondisi baik, tidak ada keluhan.',
    },
    {
      id: '2',
      date: '2026-02-17',
      systolic: 125,
      diastolic: 82,
      hb: 11.8,
      weight: 58.5,
      notes: 'Sedikit pusing di pagi hari.',
    },
    {
      id: '3',
      date: '2026-02-24',
      systolic: 130,
      diastolic: 85,
      hb: 10.5,
      weight: 59,
      notes: 'Hb menurun, dianjurkan makan lebih banyak sayuran hijau.',
    },
  ]);

  // Form state
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSystolic, setFormSystolic] = useState('');
  const [formDiastolic, setFormDiastolic] = useState('');
  const [formHb, setFormHb] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSave = useCallback(() => {
    const sys = parseInt(formSystolic, 10);
    const dia = parseInt(formDiastolic, 10);
    const hb = parseFloat(formHb);
    const weight = parseFloat(formWeight);

    if (!formSystolic || !formDiastolic || !formHb || !formWeight) {
      Alert.alert('Perhatian', 'Silakan lengkapi semua field yang wajib diisi.');
      return;
    }

    if (isNaN(sys) || isNaN(dia) || isNaN(hb) || isNaN(weight)) {
      Alert.alert('Perhatian', 'Pastikan semua angka yang dimasukkan valid.');
      return;
    }

    const newRecord: ClinicalRecord = {
      id: Date.now().toString(),
      date: formDate,
      systolic: sys,
      diastolic: dia,
      hb,
      weight,
      notes: formNotes.trim(),
    };

    setRecords(prev => [newRecord, ...prev]);
    setFormSystolic('');
    setFormDiastolic('');
    setFormHb('');
    setFormWeight('');
    setFormNotes('');
    setShowForm(false);
    Alert.alert('Tersimpan', 'Catatan pemeriksaan klinis berhasil disimpan.');
  }, [formDate, formSystolic, formDiastolic, formHb, formWeight, formNotes]);

  return (
    <View style={styles.container}>
      <Header
        title="Pemeriksaan Klinis"
        subtitle="Catatan pemeriksaan kesehatan"
        showBack
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="medical" size={18} color={Colors.primary} />
            <Text style={styles.infoBannerText}>
              {activeProfile?.name ? `Pemeriksaan untuk ${activeProfile.name}` : 'Catatan Pemeriksaan Klinis'}
            </Text>
          </View>

          {/* Toggle Form Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(!showForm)}
            activeOpacity={0.7}
          >
            <View style={styles.addButtonIcon}>
              <Ionicons name={showForm ? 'close' : 'add'} size={22} color={Colors.white} />
            </View>
            <Text style={styles.addButtonText}>
              {showForm ? 'Tutup Formulir' : 'Tambah Catatan Baru'}
            </Text>
            <Ionicons name={showForm ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.primary} />
          </TouchableOpacity>

          {/* Input Form */}
          {showForm && (
            <Card style={styles.formCard} variant="elevated">
              <Text style={styles.formSectionTitle}>Data Pemeriksaan</Text>

              {/* Date */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Tanggal Pemeriksaan</Text>
                <TextInput
                  style={styles.formInput}
                  value={formDate}
                  onChangeText={setFormDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              {/* Blood Pressure */}
              <Text style={styles.formGroupLabel}>Tekanan Darah (mmHg)</Text>
              <View style={styles.bpRow}>
                <View style={styles.bpField}>
                  <Text style={styles.formLabel}>Sistolik</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formSystolic}
                    onChangeText={setFormSystolic}
                    keyboardType="number-pad"
                    placeholder="120"
                    placeholderTextColor={Colors.textTertiary}
                    maxLength={3}
                  />
                </View>
                <View style={styles.bpSlash}>
                  <Text style={styles.bpSlashText}>/</Text>
                </View>
                <View style={styles.bpField}>
                  <Text style={styles.formLabel}>Diastolik</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formDiastolic}
                    onChangeText={setFormDiastolic}
                    keyboardType="number-pad"
                    placeholder="80"
                    placeholderTextColor={Colors.textTertiary}
                    maxLength={3}
                  />
                </View>
              </View>

              {/* Hb */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Hemoglobin / Hb (g/dL)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formHb}
                  onChangeText={setFormHb}
                  keyboardType="decimal-pad"
                  placeholder="12.0"
                  placeholderTextColor={Colors.textTertiary}
                  maxLength={5}
                />
              </View>

              {/* Weight */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Berat Badan Ibu (kg)</Text>
                <TextInput
                  style={styles.formInput}
                  value={formWeight}
                  onChangeText={setFormWeight}
                  keyboardType="decimal-pad"
                  placeholder="58.0"
                  placeholderTextColor={Colors.textTertiary}
                  maxLength={6}
                />
              </View>

              {/* Notes */}
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Catatan Dokter</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  value={formNotes}
                  onChangeText={setFormNotes}
                  placeholder="Catatan tambahan dari dokter..."
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.7}
              >
                <Ionicons name="save-outline" size={20} color={Colors.white} />
                <Text style={styles.saveButtonText}>Simpan Catatan</Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* BP Trend Chart */}
          <BPTrendChart records={records} />

          {/* Color Coding Guide */}
          <Card style={styles.guideCard}>
            <Text style={styles.guideTitle}>Panduan Indikator</Text>
            <View style={styles.guideRow}>
              <View style={[styles.guideDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.guideText}>Normal: Hb {'\u2265'} 11 g/dL, TD {'\u2264'} 140/90</Text>
            </View>
            <View style={styles.guideRow}>
              <View style={[styles.guideDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.guideText}>Perhatian: Hb &lt; 11 atau TD &gt; 140/90</Text>
            </View>
            <View style={styles.guideRow}>
              <View style={[styles.guideDot, { backgroundColor: Colors.danger }]} />
              <Text style={styles.guideText}>Risiko: Hb &lt; 8 atau TD &gt; 160/100</Text>
            </View>
          </Card>

          {/* History List */}
          <View style={styles.historyHeader}>
            <Ionicons name="time-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.historyTitle}>Riwayat Pemeriksaan</Text>
            <Text style={styles.historyCount}>{records.length} catatan</Text>
          </View>

          {records.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Ionicons name="document-text-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>Belum ada catatan pemeriksaan</Text>
                <Text style={styles.emptySubtext}>Ketuk tombol di atas untuk menambah catatan baru</Text>
              </View>
            </Card>
          ) : (
            records.map((record) => {
              const status = getStatusLevel(record);
              const statusConfig = getStatusConfig(status);
              return (
                <Card key={record.id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <View style={styles.recordDateRow}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.recordDate}>{formatDateID(record.date)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                      <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                    </View>
                  </View>

                  <View style={styles.recordGrid}>
                    <View style={styles.recordMetric}>
                      <Text style={styles.metricLabel}>Tekanan Darah</Text>
                      <Text style={[
                        styles.metricValue,
                        (record.systolic > 140 || record.diastolic > 90) && { color: Colors.danger },
                      ]}>
                        {record.systolic}/{record.diastolic}
                      </Text>
                      <Text style={styles.metricUnit}>mmHg</Text>
                    </View>
                    <View style={styles.recordMetric}>
                      <Text style={styles.metricLabel}>Hemoglobin</Text>
                      <Text style={[
                        styles.metricValue,
                        record.hb < 11 && { color: record.hb < 8 ? Colors.danger : Colors.warning },
                      ]}>
                        {record.hb.toFixed(1)}
                      </Text>
                      <Text style={styles.metricUnit}>g/dL</Text>
                    </View>
                    <View style={styles.recordMetric}>
                      <Text style={styles.metricLabel}>Berat Badan</Text>
                      <Text style={styles.metricValue}>{record.weight}</Text>
                      <Text style={styles.metricUnit}>kg</Text>
                    </View>
                  </View>

                  {record.notes ? (
                    <View style={styles.recordNotes}>
                      <Ionicons name="document-text-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.recordNotesText}>{record.notes}</Text>
                    </View>
                  ) : null}
                </Card>
              );
            })
          )}

          <View style={{ height: Spacing.massive }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoBannerText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  addButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  addButtonText: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },

  // Form
  formCard: {
    marginBottom: Spacing.lg,
  },
  formSectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  formField: {
    marginBottom: Spacing.lg,
  },
  formGroupLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  formLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  formInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTextarea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  bpRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  bpField: {
    flex: 1,
  },
  bpSlash: {
    paddingBottom: Spacing.md,
  },
  bpSlashText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },

  // Save
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  saveButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },

  // Chart
  chartCard: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  chartTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  chartEmpty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  chartEmptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },

  // Guide
  guideCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceSecondary,
  },
  guideTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  guideDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  guideText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  // History
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  historyTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  historyCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  // Record Card
  recordCard: {
    marginBottom: Spacing.md,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  recordDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  recordDate: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // Metrics
  recordGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  recordMetric: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  metricValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  metricUnit: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Notes
  recordNotes: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  recordNotesText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Empty
  emptyCard: {
    marginBottom: Spacing.md,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});

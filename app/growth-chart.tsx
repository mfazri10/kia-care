// KIA Care - WHO Growth Chart (Stunting Checker)
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line, Polyline, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING = { top: 30, right: 30, bottom: 50, left: 45 };
const CHART_WIDTH = SCREEN_WIDTH - Spacing.xl * 2 - Spacing.lg * 2;
const CHART_HEIGHT = 260;

// WHO Height-for-Age standards (0-24 months, in cm)
const WHO_HEIGHT_FOR_AGE = {
  'laki-laki': {
    months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 21, 24],
    median: [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7, 79.1, 82.3, 85.1, 87.8],
    minus2SD: [46.1, 50.8, 54.4, 57.3, 59.7, 61.7, 63.3, 64.8, 66.2, 67.5, 68.7, 69.9, 71.0, 74.1, 76.9, 79.4, 81.7],
    minus3SD: [44.2, 48.9, 52.4, 55.3, 57.6, 59.6, 61.2, 62.7, 64.0, 65.2, 66.4, 67.6, 68.6, 71.6, 74.4, 76.5, 78.7],
  },
  'perempuan': {
    months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 21, 24],
    median: [49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 72.8, 74.0, 77.5, 80.7, 83.7, 86.4],
    minus2SD: [45.4, 49.8, 53.0, 55.6, 57.8, 59.6, 61.2, 62.7, 64.0, 65.3, 66.5, 67.7, 68.9, 72.0, 74.9, 77.5, 80.0],
    minus3SD: [43.6, 47.8, 51.0, 53.5, 55.6, 57.4, 58.9, 60.3, 61.7, 62.9, 64.1, 65.2, 66.3, 69.3, 72.0, 74.5, 76.7],
  },
};

type Gender = 'laki-laki' | 'perempuan';
type StuntingStatus = 'normal' | 'risiko' | 'berat';

interface GrowthEntry {
  id: string;
  ageMonths: number;
  weight: number;
  height: number;
  gender: Gender;
  status: StuntingStatus;
  date: string;
}

function getStuntingStatus(ageMonths: number, height: number, gender: Gender): StuntingStatus {
  const data = WHO_HEIGHT_FOR_AGE[gender];
  const { months, minus2SD, minus3SD } = data;

  // Find the two nearest months for interpolation
  let lowerIdx = 0;
  let upperIdx = months.length - 1;

  for (let i = 0; i < months.length; i++) {
    if (months[i] <= ageMonths) lowerIdx = i;
    if (months[i] >= ageMonths && i < upperIdx) {
      upperIdx = i;
      break;
    }
  }

  // Linear interpolation
  let threshold2SD: number;
  let threshold3SD: number;

  if (lowerIdx === upperIdx || months[lowerIdx] === ageMonths) {
    threshold2SD = minus2SD[lowerIdx];
    threshold3SD = minus3SD[lowerIdx];
  } else {
    const ratio = (ageMonths - months[lowerIdx]) / (months[upperIdx] - months[lowerIdx]);
    threshold2SD = minus2SD[lowerIdx] + ratio * (minus2SD[upperIdx] - minus2SD[lowerIdx]);
    threshold3SD = minus3SD[lowerIdx] + ratio * (minus3SD[upperIdx] - minus3SD[lowerIdx]);
  }

  if (height < threshold3SD) return 'berat';
  if (height < threshold2SD) return 'risiko';
  return 'normal';
}

function getStatusConfig(status: StuntingStatus) {
  switch (status) {
    case 'normal':
      return {
        label: 'Pertumbuhan Normal',
        color: '#27AE60',
        bgColor: '#F0FFF5',
        icon: 'checkmark-circle' as const,
        description: 'Tinggi badan anak sesuai dengan standar WHO untuk usianya.',
        recommendation: 'Pertahankan pola makan bergizi dan pemantauan rutin setiap bulan.',
      };
    case 'risiko':
      return {
        label: 'Risiko Stunting',
        color: '#E67E22',
        bgColor: '#FFF8F0',
        icon: 'warning' as const,
        description: 'Tinggi badan anak berada di bawah -2 SD standar WHO (pendek).',
        recommendation: 'Konsultasikan dengan dokter/ahli gizi. Perbaiki asupan nutrisi terutama protein dan vitamin D.',
      };
    case 'berat':
      return {
        label: 'Stunting Berat',
        color: '#E74C3C',
        bgColor: '#FFF5F5',
        icon: 'alert-circle' as const,
        description: 'Tinggi badan anak berada di bawah -3 SD standar WHO (sangat pendek).',
        recommendation: 'SEGERA konsultasikan ke dokter spesialis anak. Anak membutuhkan intervensi gizi dan medis segera.',
      };
  }
}

// Chart component
function GrowthChart({ entries, gender }: { entries: GrowthEntry[]; gender: Gender }) {
  const data = WHO_HEIGHT_FOR_AGE[gender];
  const { months, median, minus2SD, minus3SD } = data;

  // Chart dimensions
  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

  const xMin = 0;
  const xMax = 24;
  const yMin = 40;
  const yMax = 95;

  const scaleX = (val: number) => CHART_PADDING.left + (val - xMin) / (xMax - xMin) * plotWidth;
  const scaleY = (val: number) => CHART_PADDING.top + (1 - (val - yMin) / (yMax - yMin)) * plotHeight;

  const toPoints = (xArr: number[], yArr: number[]) =>
    xArr.map((x, i) => `${scaleX(x)},${scaleY(yArr[i])}`).join(' ');

  // Grid lines
  const yGridValues = [45, 50, 55, 60, 65, 70, 75, 80, 85, 90];
  const xGridValues = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  return (
    <View style={chartStyles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id="normalZone" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#27AE60" stopOpacity="0.08" />
            <Stop offset="1" stopColor="#27AE60" stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {/* Background grid */}
        {yGridValues.map((val) => (
          <React.Fragment key={`yg-${val}`}>
            <Line
              x1={CHART_PADDING.left}
              y1={scaleY(val)}
              x2={CHART_WIDTH - CHART_PADDING.right}
              y2={scaleY(val)}
              stroke={Colors.border}
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
            <SvgText
              x={CHART_PADDING.left - 8}
              y={scaleY(val) + 4}
              fontSize={9}
              fill={Colors.textTertiary}
              textAnchor="end"
            >
              {val}
            </SvgText>
          </React.Fragment>
        ))}

        {xGridValues.map((val) => (
          <React.Fragment key={`xg-${val}`}>
            <Line
              x1={scaleX(val)}
              y1={CHART_PADDING.top}
              x2={scaleX(val)}
              y2={CHART_HEIGHT - CHART_PADDING.bottom}
              stroke={Colors.border}
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
            <SvgText
              x={scaleX(val)}
              y={CHART_HEIGHT - CHART_PADDING.bottom + 16}
              fontSize={9}
              fill={Colors.textTertiary}
              textAnchor="middle"
            >
              {val}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Axis labels */}
        <SvgText
          x={CHART_WIDTH / 2}
          y={CHART_HEIGHT - 5}
          fontSize={10}
          fill={Colors.textSecondary}
          textAnchor="middle"
          fontWeight="600"
        >
          Usia (bulan)
        </SvgText>
        <SvgText
          x={12}
          y={CHART_HEIGHT / 2}
          fontSize={10}
          fill={Colors.textSecondary}
          textAnchor="middle"
          fontWeight="600"
          rotation="-90"
          originX={12}
          originY={CHART_HEIGHT / 2}
        >
          TB (cm)
        </SvgText>

        {/* -3 SD line */}
        <Polyline
          points={toPoints(months, minus3SD)}
          fill="none"
          stroke="#E74C3C"
          strokeWidth={1.5}
          strokeDasharray="6,3"
        />

        {/* -2 SD line */}
        <Polyline
          points={toPoints(months, minus2SD)}
          fill="none"
          stroke="#E67E22"
          strokeWidth={1.5}
          strokeDasharray="6,3"
        />

        {/* Median line */}
        <Polyline
          points={toPoints(months, median)}
          fill="none"
          stroke="#27AE60"
          strokeWidth={2}
        />

        {/* User data points */}
        {entries.map((entry) => {
          const cx = scaleX(entry.ageMonths);
          const cy = scaleY(entry.height);
          const statusConf = getStatusConfig(entry.status);

          return (
            <React.Fragment key={entry.id}>
              <Circle cx={cx} cy={cy} r={7} fill={statusConf.color + '30'} />
              <Circle cx={cx} cy={cy} r={5} fill={statusConf.color} stroke={Colors.white} strokeWidth={2} />
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Legend */}
      <View style={chartStyles.legend}>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendLine, { backgroundColor: '#27AE60' }]} />
          <Text style={chartStyles.legendText}>Median</Text>
        </View>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDashed, { borderColor: '#E67E22' }]} />
          <Text style={chartStyles.legendText}>-2 SD</Text>
        </View>
        <View style={chartStyles.legendItem}>
          <View style={[chartStyles.legendDashed, { borderColor: '#E74C3C' }]} />
          <Text style={chartStyles.legendText}>-3 SD</Text>
        </View>
        <View style={chartStyles.legendItem}>
          <View style={chartStyles.legendDot} />
          <Text style={chartStyles.legendText}>Data Anak</Text>
        </View>
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
  },
  legendDashed: {
    width: 16,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.secondary,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
});

export default function GrowthChartScreen() {
  const [ageMonths, setAgeMonths] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState<Gender>('laki-laki');
  const [entries, setEntries] = useState<GrowthEntry[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [latestStatus, setLatestStatus] = useState<StuntingStatus | null>(null);

  const handleCalculate = useCallback(() => {
    const ageNum = parseInt(ageMonths, 10);
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (isNaN(ageNum) || ageNum < 0 || ageNum > 24) {
      Alert.alert('Perhatian', 'Masukkan usia yang valid (0-24 bulan).');
      return;
    }
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('Perhatian', 'Masukkan berat badan yang valid.');
      return;
    }
    if (isNaN(heightNum) || heightNum <= 0) {
      Alert.alert('Perhatian', 'Masukkan tinggi badan yang valid.');
      return;
    }

    const status = getStuntingStatus(ageNum, heightNum, gender);
    const newEntry: GrowthEntry = {
      id: Date.now().toString(),
      ageMonths: ageNum,
      weight: weightNum,
      height: heightNum,
      gender,
      status,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    setEntries((prev) => [...prev, newEntry]);
    setLatestStatus(status);
    setShowResult(true);
  }, [ageMonths, weight, height, gender]);

  const handleReset = useCallback(() => {
    setAgeMonths('');
    setWeight('');
    setHeight('');
    setShowResult(false);
    setLatestStatus(null);
  }, []);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Hapus Semua Data',
      'Hapus semua data pengukuran?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            setEntries([]);
            handleReset();
          },
        },
      ]
    );
  }, [handleReset]);

  const statusConfig = latestStatus ? getStatusConfig(latestStatus) : null;

  return (
    <View style={styles.container}>
      <Header
        title="Tumbuh Kembang"
        subtitle="Kurva Pertumbuhan WHO"
        showBack
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <View style={[styles.infoIcon, { backgroundColor: Colors.secondaryBg }]}>
            <Ionicons name="analytics" size={20} color={Colors.secondary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Stunting Checker</Text>
            <Text style={styles.infoDesc}>
              Pantau pertumbuhan anak berdasarkan standar WHO untuk deteksi dini stunting.
            </Text>
          </View>
        </View>

        {/* Input Form */}
        <Text style={styles.sectionTitle}>Data Pengukuran</Text>
        <Card style={styles.formCard}>
          {/* Gender selector */}
          <Text style={styles.inputLabel}>Jenis Kelamin</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.genderButton,
                gender === 'laki-laki' && styles.genderButtonActive,
                gender === 'laki-laki' && { borderColor: '#3498DB' },
              ]}
              onPress={() => setGender('laki-laki')}
            >
              <Ionicons
                name="male"
                size={20}
                color={gender === 'laki-laki' ? '#3498DB' : Colors.textTertiary}
              />
              <Text
                style={[
                  styles.genderText,
                  gender === 'laki-laki' && { color: '#3498DB', fontWeight: FontWeight.semibold },
                ]}
              >
                Laki-laki
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.genderButton,
                gender === 'perempuan' && styles.genderButtonActive,
                gender === 'perempuan' && { borderColor: Colors.primary },
              ]}
              onPress={() => setGender('perempuan')}
            >
              <Ionicons
                name="female"
                size={20}
                color={gender === 'perempuan' ? Colors.primary : Colors.textTertiary}
              />
              <Text
                style={[
                  styles.genderText,
                  gender === 'perempuan' && { color: Colors.primary, fontWeight: FontWeight.semibold },
                ]}
              >
                Perempuan
              </Text>
            </TouchableOpacity>
          </View>

          {/* Age input */}
          <Text style={styles.inputLabel}>Usia (bulan)</Text>
          <TextInput
            style={styles.input}
            value={ageMonths}
            onChangeText={setAgeMonths}
            keyboardType="number-pad"
            placeholder="Contoh: 12"
            placeholderTextColor={Colors.textTertiary}
            maxLength={2}
          />

          {/* Weight input */}
          <Text style={styles.inputLabel}>Berat Badan (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="Contoh: 8.5"
            placeholderTextColor={Colors.textTertiary}
          />

          {/* Height input */}
          <Text style={styles.inputLabel}>Tinggi Badan (cm)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            keyboardType="decimal-pad"
            placeholder="Contoh: 74.5"
            placeholderTextColor={Colors.textTertiary}
          />

          {/* Submit button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.calculateButton}
            onPress={handleCalculate}
          >
            <Ionicons name="calculator" size={20} color={Colors.white} />
            <Text style={styles.calculateButtonText}>Simpan & Hitung</Text>
          </TouchableOpacity>
        </Card>

        {/* Result Interpretation Card */}
        {showResult && statusConfig && (
          <>
            <Text style={styles.sectionTitle}>Hasil Analisis</Text>
            <Card style={[styles.resultCard, { borderLeftWidth: 4, borderLeftColor: statusConfig.color }]}>
              <View style={styles.resultHeader}>
                <View style={[styles.resultIcon, { backgroundColor: statusConfig.bgColor }]}>
                  <Ionicons name={statusConfig.icon} size={28} color={statusConfig.color} />
                </View>
                <View style={styles.resultInfo}>
                  <Text style={[styles.resultLabel, { color: statusConfig.color }]}>
                    {statusConfig.label}
                  </Text>
                  <Text style={styles.resultDesc}>{statusConfig.description}</Text>
                </View>
              </View>

              <View style={[styles.resultRecommendation, { backgroundColor: statusConfig.bgColor }]}>
                <Ionicons name="bulb-outline" size={18} color={statusConfig.color} />
                <Text style={[styles.resultRecText, { color: statusConfig.color }]}>
                  {statusConfig.recommendation}
                </Text>
              </View>

              {/* Measurement summary */}
              {entries.length > 0 && (
                <View style={styles.measurementSummary}>
                  <View style={styles.measurementItem}>
                    <Text style={styles.measurementLabel}>Usia</Text>
                    <Text style={styles.measurementValue}>{entries[entries.length - 1].ageMonths} bln</Text>
                  </View>
                  <View style={styles.measurementDivider} />
                  <View style={styles.measurementItem}>
                    <Text style={styles.measurementLabel}>BB</Text>
                    <Text style={styles.measurementValue}>{entries[entries.length - 1].weight} kg</Text>
                  </View>
                  <View style={styles.measurementDivider} />
                  <View style={styles.measurementItem}>
                    <Text style={styles.measurementLabel}>TB</Text>
                    <Text style={styles.measurementValue}>{entries[entries.length - 1].height} cm</Text>
                  </View>
                </View>
              )}
            </Card>
          </>
        )}

        {/* WHO Growth Chart */}
        <Text style={styles.sectionTitle}>
          Kurva Pertumbuhan WHO (TB/U)
        </Text>
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>
              {gender === 'laki-laki' ? 'Laki-laki' : 'Perempuan'} · 0-24 bulan
            </Text>
            <Text style={styles.chartSubtitle}>Tinggi Badan untuk Usia</Text>
          </View>
          <GrowthChart entries={entries.filter((e) => e.gender === gender)} gender={gender} />
        </Card>

        {/* Measurement History */}
        {entries.length > 0 && (
          <>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Riwayat Pengukuran</Text>
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={styles.clearAllText}>Hapus Semua</Text>
              </TouchableOpacity>
            </View>
            {entries.slice().reverse().map((entry) => {
              const entryConfig = getStatusConfig(entry.status);
              return (
                <Card key={entry.id} style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <View style={[styles.historyDot, { backgroundColor: entryConfig.color }]} />
                    <View style={styles.historyInfo}>
                      <View style={styles.historyTopRow}>
                        <Text style={styles.historyAge}>{entry.ageMonths} bulan</Text>
                        <View style={[styles.historyBadge, { backgroundColor: entryConfig.bgColor }]}>
                          <Text style={[styles.historyBadgeText, { color: entryConfig.color }]}>
                            {entryConfig.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.historyMeta}>
                        TB: {entry.height} cm · BB: {entry.weight} kg · {entry.gender === 'laki-laki' ? 'L' : 'P'}
                      </Text>
                      <Text style={styles.historyDate}>{entry.date}</Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {/* Info about stunting */}
        <Card style={styles.infoCard} variant="outlined">
          <View style={styles.infoCardHeader}>
            <Ionicons name="information-circle" size={20} color={Colors.secondary} />
            <Text style={styles.infoCardTitle}>Tentang Stunting</Text>
          </View>
          <Text style={styles.infoCardText}>
            Stunting adalah kondisi gagal tumbuh pada anak akibat kekurangan gizi kronis terutama pada 1.000 hari pertama kehidupan.
            Deteksi dini melalui pemantauan tinggi badan secara rutin sangat penting untuk pencegahan.
          </Text>
          <View style={styles.infoCardGrid}>
            <View style={[styles.infoGridItem, { backgroundColor: '#F0FFF5' }]}>
              <Text style={[styles.infoGridLabel, { color: '#27AE60' }]}>≥ -2 SD</Text>
              <Text style={styles.infoGridDesc}>Normal</Text>
            </View>
            <View style={[styles.infoGridItem, { backgroundColor: '#FFF8F0' }]}>
              <Text style={[styles.infoGridLabel, { color: '#E67E22' }]}>{'<'} -2 SD</Text>
              <Text style={styles.infoGridDesc}>Pendek</Text>
            </View>
            <View style={[styles.infoGridItem, { backgroundColor: '#FFF5F5' }]}>
              <Text style={[styles.infoGridLabel, { color: '#E74C3C' }]}>{'<'} -3 SD</Text>
              <Text style={styles.infoGridDesc}>Sangat Pendek</Text>
            </View>
          </View>
        </Card>

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

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondaryBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.secondary + '20',
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.secondary,
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // Sections
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Form
  formCard: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
  },
  genderButtonActive: {
    backgroundColor: Colors.white,
    borderWidth: 2,
  },
  genderText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  calculateButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },

  // Result
  resultCard: {
    marginBottom: Spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  resultIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  resultInfo: {
    flex: 1,
  },
  resultLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  resultDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  resultRecommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  resultRecText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: 20,
  },
  measurementSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  measurementItem: {
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  measurementValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  measurementDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },

  // Chart
  chartCard: {
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  chartHeader: {
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  chartTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  chartSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // History
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  clearAllText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: FontWeight.medium,
  },
  historyCard: {
    marginBottom: Spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: Spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyAge: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  historyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  historyBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  historyMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  historyDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  // Info Card
  infoCard: {
    marginTop: Spacing.md,
    borderColor: Colors.secondary + '30',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoCardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.secondary,
  },
  infoCardText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  infoCardGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  infoGridItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  infoGridLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  infoGridDesc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

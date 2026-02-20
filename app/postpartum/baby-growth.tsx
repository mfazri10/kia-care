import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { BABY_GROWTH_STANDARDS } from '@/constants/data';
import { getBabyGrowth, saveBabyGrowth } from '@/utils/storage';
import { formatDateID, getBabyAgeWeeks } from '@/utils/date';
import { BabyGrowthEntry } from '@/types';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

type GrowthStatus = 'below' | 'normal' | 'above';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getClosestStandardWeek(ageWeeks: number): number {
  const standardWeeks = [0, 4, 8, 12, 16, 20, 24, 36, 48];
  let closest = standardWeeks[0];
  let minDiff = Math.abs(ageWeeks - closest);

  for (const week of standardWeeks) {
    const diff = Math.abs(ageWeeks - week);
    if (diff < minDiff) {
      minDiff = diff;
      closest = week;
    }
  }
  return closest;
}

function getWeightStatus(
  weight: number,
  ageWeeks: number,
  gender: 'laki-laki' | 'perempuan'
): GrowthStatus {
  const closestWeek = getClosestStandardWeek(ageWeeks);
  const standards = BABY_GROWTH_STANDARDS[gender]?.weight?.[closestWeek as keyof typeof BABY_GROWTH_STANDARDS[typeof gender]['weight']];
  if (!standards) return 'normal';

  if (weight < standards.p3) return 'below';
  if (weight > standards.p97) return 'above';
  return 'normal';
}

function getHeightStatus(
  height: number,
  ageWeeks: number,
  gender: 'laki-laki' | 'perempuan'
): GrowthStatus {
  const closestWeek = getClosestStandardWeek(ageWeeks);
  const standards = BABY_GROWTH_STANDARDS[gender]?.height?.[closestWeek as keyof typeof BABY_GROWTH_STANDARDS[typeof gender]['height']];
  if (!standards) return 'normal';

  if (height < standards.p3) return 'below';
  if (height > standards.p97) return 'above';
  return 'normal';
}

function getStatusColor(status: GrowthStatus): string {
  switch (status) {
    case 'below':
      return Colors.warning;
    case 'normal':
      return Colors.success;
    case 'above':
      return Colors.danger;
  }
}

function getStatusLabel(status: GrowthStatus): string {
  switch (status) {
    case 'below':
      return 'Di Bawah Rata-rata';
    case 'normal':
      return 'Normal';
    case 'above':
      return 'Di Atas Rata-rata';
  }
}

function getStatusIcon(status: GrowthStatus): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case 'below':
      return 'arrow-down-circle';
    case 'normal':
      return 'checkmark-circle';
    case 'above':
      return 'arrow-up-circle';
  }
}

export default function BabyGrowthScreen() {
  const { activeProfile } = useApp();
  const [entries, setEntries] = useState<BabyGrowthEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formWeight, setFormWeight] = useState('');
  const [formHeight, setFormHeight] = useState('');
  const [formHead, setFormHead] = useState('');

  const babyGender = activeProfile?.babyGender || 'laki-laki';
  const babyDob = activeProfile?.babyDob;
  const currentAgeWeeks = babyDob ? getBabyAgeWeeks(babyDob) : 0;

  const loadEntries = useCallback(async () => {
    if (!activeProfile) return;
    try {
      setIsLoading(true);
      const stored = await getBabyGrowth();
      const profileEntries = (stored || []).filter(
        (e: BabyGrowthEntry) => e.profileId === activeProfile.id
      );
      setEntries(profileEntries);
    } catch (error) {
      console.error('Gagal memuat data pertumbuhan:', error);
      Alert.alert('Kesalahan', 'Gagal memuat data. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addEntry = async () => {
    if (!activeProfile) return;

    const weight = formWeight.trim() ? parseFloat(formWeight) : undefined;
    const height = formHeight.trim() ? parseFloat(formHeight) : undefined;
    const headCircumference = formHead.trim() ? parseFloat(formHead) : undefined;

    if (weight === undefined && height === undefined && headCircumference === undefined) {
      Alert.alert('Peringatan', 'Silakan isi minimal satu pengukuran (berat, tinggi, atau lingkar kepala).');
      return;
    }

    if (weight !== undefined && (isNaN(weight) || weight <= 0)) {
      Alert.alert('Peringatan', 'Berat badan harus berupa angka positif (dalam gram).');
      return;
    }
    if (height !== undefined && (isNaN(height) || height <= 0)) {
      Alert.alert('Peringatan', 'Tinggi badan harus berupa angka positif (dalam cm).');
      return;
    }
    if (headCircumference !== undefined && (isNaN(headCircumference) || headCircumference <= 0)) {
      Alert.alert('Peringatan', 'Lingkar kepala harus berupa angka positif (dalam cm).');
      return;
    }

    try {
      setIsSaving(true);
      const newEntry: BabyGrowthEntry = {
        id: generateId(),
        profileId: activeProfile.id,
        date: new Date().toISOString(),
        ageWeeks: currentAgeWeeks,
        weight,
        height,
        headCircumference,
      };

      const allStored = (await getBabyGrowth()) || [];
      const updatedAll = [...allStored, newEntry];
      await saveBabyGrowth(updatedAll);

      setEntries((prev) => [...prev, newEntry]);
      setFormWeight('');
      setFormHeight('');
      setFormHead('');
      setShowForm(false);
    } catch (error) {
      console.error('Gagal menyimpan data pertumbuhan:', error);
      Alert.alert('Kesalahan', 'Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestEntry = sortedEntries[0];

  const closestStandardWeek = getClosestStandardWeek(currentAgeWeeks);
  const whoStandards = BABY_GROWTH_STANDARDS[babyGender];
  const weightStandard = whoStandards?.weight?.[closestStandardWeek as keyof typeof whoStandards.weight];
  const heightStandard = whoStandards?.height?.[closestStandardWeek as keyof typeof whoStandards.height];

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Header title="Pertumbuhan Bayi" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.pascaMelahirkan} />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header
        title="Pertumbuhan Bayi"
        showBack
        subtitle={`Usia: ${currentAgeWeeks} minggu`}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Latest Measurements Card */}
        {latestEntry && (
          <Card style={styles.latestCard}>
            <Text style={styles.latestTitle}>Pengukuran Terakhir</Text>
            <Text style={styles.latestDate}>{formatDateID(latestEntry.date)}</Text>

            <View style={styles.measurementsGrid}>
              {/* Weight */}
              {latestEntry.weight !== undefined && (
                <View style={styles.measurementItem}>
                  <View style={styles.measurementHeader}>
                    <Ionicons name="scale-outline" size={20} color={Colors.pascaMelahirkan} />
                    <Text style={styles.measurementLabel}>Berat Badan</Text>
                  </View>
                  <Text style={styles.measurementValue}>
                    {latestEntry.weight.toLocaleString()} g
                  </Text>
                  {weightStandard && (
                    <View style={styles.statusRow}>
                      {(() => {
                        const status = getWeightStatus(
                          latestEntry.weight!,
                          latestEntry.ageWeeks,
                          babyGender
                        );
                        return (
                          <>
                            <Ionicons
                              name={getStatusIcon(status)}
                              size={16}
                              color={getStatusColor(status)}
                            />
                            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                              {getStatusLabel(status)}
                            </Text>
                          </>
                        );
                      })()}
                    </View>
                  )}
                  {weightStandard && (
                    <Text style={styles.whoText}>
                      Standar WHO: {weightStandard.p3.toLocaleString()}-{weightStandard.p97.toLocaleString()} g
                    </Text>
                  )}
                </View>
              )}

              {/* Height */}
              {latestEntry.height !== undefined && (
                <View style={styles.measurementItem}>
                  <View style={styles.measurementHeader}>
                    <Ionicons name="resize-outline" size={20} color={Colors.pascaMelahirkan} />
                    <Text style={styles.measurementLabel}>Tinggi Badan</Text>
                  </View>
                  <Text style={styles.measurementValue}>
                    {latestEntry.height} cm
                  </Text>
                  {heightStandard && (
                    <View style={styles.statusRow}>
                      {(() => {
                        const status = getHeightStatus(
                          latestEntry.height!,
                          latestEntry.ageWeeks,
                          babyGender
                        );
                        return (
                          <>
                            <Ionicons
                              name={getStatusIcon(status)}
                              size={16}
                              color={getStatusColor(status)}
                            />
                            <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                              {getStatusLabel(status)}
                            </Text>
                          </>
                        );
                      })()}
                    </View>
                  )}
                  {heightStandard && (
                    <Text style={styles.whoText}>
                      Standar WHO: {heightStandard.p3}-{heightStandard.p97} cm
                    </Text>
                  )}
                </View>
              )}

              {/* Head Circumference */}
              {latestEntry.headCircumference !== undefined && (
                <View style={styles.measurementItem}>
                  <View style={styles.measurementHeader}>
                    <Ionicons name="ellipse-outline" size={20} color={Colors.pascaMelahirkan} />
                    <Text style={styles.measurementLabel}>Lingkar Kepala</Text>
                  </View>
                  <Text style={styles.measurementValue}>
                    {latestEntry.headCircumference} cm
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Input Form */}
        {showForm ? (
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Tambah Pengukuran</Text>
            <Text style={styles.formSubtitle}>
              Usia bayi saat ini: {currentAgeWeeks} minggu
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Berat Badan (gram)</Text>
              <View style={styles.inputRow}>
                <Ionicons name="scale-outline" size={20} color={Colors.textTertiary} />
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="Contoh: 3500"
                  placeholderTextColor={Colors.textTertiary}
                  value={formWeight}
                  onChangeText={setFormWeight}
                />
                <Text style={styles.inputUnit}>g</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tinggi Badan (cm)</Text>
              <View style={styles.inputRow}>
                <Ionicons name="resize-outline" size={20} color={Colors.textTertiary} />
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="Contoh: 50.5"
                  placeholderTextColor={Colors.textTertiary}
                  value={formHeight}
                  onChangeText={setFormHeight}
                />
                <Text style={styles.inputUnit}>cm</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lingkar Kepala (cm)</Text>
              <View style={styles.inputRow}>
                <Ionicons name="ellipse-outline" size={20} color={Colors.textTertiary} />
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="Contoh: 35"
                  placeholderTextColor={Colors.textTertiary}
                  value={formHead}
                  onChangeText={setFormHead}
                />
                <Text style={styles.inputUnit}>cm</Text>
              </View>
            </View>

            <View style={styles.formButtons}>
              <Button
                title="Batal"
                onPress={() => {
                  setShowForm(false);
                  setFormWeight('');
                  setFormHeight('');
                  setFormHead('');
                }}
                variant="outline"
                color={Colors.textSecondary}
                style={styles.cancelButton}
              />
              <Button
                title="Simpan"
                onPress={addEntry}
                color={Colors.pascaMelahirkan}
                icon="checkmark-circle-outline"
                loading={isSaving}
                style={styles.saveButton}
              />
            </View>
          </Card>
        ) : (
          <Button
            title="Tambah Pengukuran"
            onPress={() => setShowForm(true)}
            color={Colors.pascaMelahirkan}
            icon="add-circle-outline"
            fullWidth
            size="lg"
            style={styles.addButton}
          />
        )}

        {/* WHO Reference */}
        {weightStandard && (
          <Card style={styles.whoCard}>
            <View style={styles.whoHeader}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.pascaMelahirkan} />
              <Text style={styles.whoTitle}>
                Standar WHO ({babyGender === 'laki-laki' ? 'Laki-laki' : 'Perempuan'}, ~{closestStandardWeek} minggu)
              </Text>
            </View>
            <View style={styles.whoGrid}>
              <View style={styles.whoRow}>
                <Text style={styles.whoLabel}>Berat Badan</Text>
                <Text style={styles.whoValue}>
                  {weightStandard.p3.toLocaleString()}-{weightStandard.p97.toLocaleString()} g (median: {weightStandard.p50.toLocaleString()} g)
                </Text>
              </View>
              {heightStandard && (
                <View style={styles.whoRow}>
                  <Text style={styles.whoLabel}>Tinggi Badan</Text>
                  <Text style={styles.whoValue}>
                    {heightStandard.p3}-{heightStandard.p97} cm (median: {heightStandard.p50} cm)
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Growth History */}
        <Text style={styles.sectionTitle}>Riwayat Pengukuran</Text>

        {sortedEntries.length === 0 ? (
          <EmptyState
            icon="bar-chart-outline"
            title="Belum Ada Data"
            description="Mulai catat pertumbuhan bayi Anda untuk memantau perkembangannya."
            actionTitle="Tambah Pengukuran"
            onAction={() => setShowForm(true)}
            color={Colors.pascaMelahirkan}
          />
        ) : (
          sortedEntries.map((entry) => (
            <Card key={entry.id} style={styles.historyCard} variant="outlined">
              <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>{formatDateID(entry.date)}</Text>
                <Text style={styles.historyAge}>Usia: {entry.ageWeeks} minggu</Text>
              </View>
              <View style={styles.historyMeasurements}>
                {entry.weight !== undefined && (
                  <View style={styles.historyBadge}>
                    <Ionicons name="scale-outline" size={14} color={Colors.pascaMelahirkan} />
                    <Text style={styles.historyBadgeText}>
                      {entry.weight.toLocaleString()} g
                    </Text>
                  </View>
                )}
                {entry.height !== undefined && (
                  <View style={styles.historyBadge}>
                    <Ionicons name="resize-outline" size={14} color={Colors.pascaMelahirkan} />
                    <Text style={styles.historyBadgeText}>{entry.height} cm</Text>
                  </View>
                )}
                {entry.headCircumference !== undefined && (
                  <View style={styles.historyBadge}>
                    <Ionicons name="ellipse-outline" size={14} color={Colors.pascaMelahirkan} />
                    <Text style={styles.historyBadgeText}>{entry.headCircumference} cm</Text>
                  </View>
                )}
              </View>
            </Card>
          ))
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
  latestCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.pascaMelahirkanBg,
  },
  latestTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  latestDate: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  measurementsGrid: {
    gap: Spacing.lg,
  },
  measurementItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  measurementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  measurementLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  measurementValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  whoText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  formCard: {
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  formSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
  },
  inputUnit: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  formButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  addButton: {
    marginBottom: Spacing.lg,
  },
  whoCard: {
    marginBottom: Spacing.lg,
  },
  whoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  whoTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  whoGrid: {
    gap: Spacing.sm,
  },
  whoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  whoLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  whoValue: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  historyCard: {
    marginBottom: Spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  historyDate: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  historyAge: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  historyMeasurements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.pascaMelahirkanBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  historyBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.pascaMelahirkan,
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
});

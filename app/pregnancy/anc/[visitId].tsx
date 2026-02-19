import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useApp } from '@/context/AppContext';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from '@/constants/theme';
import { ANC_SCHEDULE } from '@/constants/data';
import { getANCVisits, saveANCVisits } from '@/utils/storage';
import { formatDateID } from '@/utils/date';
import { ANCVisit, ANCChecklist } from '@/types';

const DEFAULT_CHECKLIST: ANCChecklist = {
  tekananDarah: false,
  beratBadan: false,
  tinggiFundus: false,
  denyutJantungJanin: false,
  statusImunisasiTT: false,
  tabletTambahDarah: false,
  tesLaboratorium: false,
  tatalaksanaKasus: false,
  temuWicaraKonseling: false,
};

interface ChecklistField {
  key: keyof ANCChecklist;
  label: string;
  visitNumbers: number[];
}

const CHECKLIST_FIELDS: ChecklistField[] = [
  { key: 'tekananDarah', label: 'Tekanan Darah', visitNumbers: [1, 2, 3, 4, 5, 6] },
  { key: 'beratBadan', label: 'Berat Badan', visitNumbers: [1, 2, 3, 4, 5, 6] },
  { key: 'tinggiFundus', label: 'Tinggi Fundus Uteri', visitNumbers: [1, 2, 3, 4, 5, 6] },
  { key: 'denyutJantungJanin', label: 'Denyut Jantung Janin', visitNumbers: [2, 3, 4, 5, 6] },
  { key: 'statusImunisasiTT', label: 'Status Imunisasi TT', visitNumbers: [1] },
  { key: 'tabletTambahDarah', label: 'Tablet Tambah Darah', visitNumbers: [1, 2, 3, 4, 5, 6] },
  { key: 'tesLaboratorium', label: 'Tes Laboratorium (Hb, HIV, dll)', visitNumbers: [1] },
  { key: 'tatalaksanaKasus', label: 'Tatalaksana Kasus', visitNumbers: [1, 2, 3, 4, 5, 6] },
  { key: 'temuWicaraKonseling', label: 'Temu Wicara / Konseling', visitNumbers: [1, 2, 3, 4, 5, 6] },
  { key: 'lingkarLenganAtas', label: 'Lingkar Lengan Atas (LILA)', visitNumbers: [1] },
  { key: 'tinggiadan', label: 'Tinggi Badan', visitNumbers: [1] },
  { key: 'golonganDarah', label: 'Golongan Darah', visitNumbers: [1] },
  { key: 'tesHIV', label: 'Tes HIV', visitNumbers: [1] },
  { key: 'tesSifilis', label: 'Tes Sifilis', visitNumbers: [1] },
  { key: 'tesHepB', label: 'Tes Hepatitis B', visitNumbers: [1] },
  { key: 'tesGulaDarah', label: 'Tes Gula Darah', visitNumbers: [3] },
  { key: 'tesProteinUrin', label: 'Tes Protein Urin', visitNumbers: [5] },
  { key: 'usg', label: 'USG (Ultrasonografi)', visitNumbers: [4, 5, 6] },
];

export default function ANCVisitDetailScreen() {
  const { visitId } = useLocalSearchParams<{ visitId: string }>();
  const { activeProfile } = useApp();
  const router = useRouter();

  const visitNumber = parseInt(visitId || '1', 10);
  const schedule = ANC_SCHEDULE.find((s) => s.visitNumber === visitNumber);

  const [visit, setVisit] = useState<ANCVisit | null>(null);
  const [checklist, setChecklist] = useState<ANCChecklist>({ ...DEFAULT_CHECKLIST });
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [completedDate, setCompletedDate] = useState<Date | null>(null);
  const [showScheduledPicker, setShowScheduledPicker] = useState(false);
  const [showCompletedPicker, setShowCompletedPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadVisitData = async () => {
    try {
      setIsLoading(true);
      const savedVisits = await getANCVisits();
      if (savedVisits && activeProfile) {
        const existingVisit = savedVisits.find(
          (v: ANCVisit) => v.profileId === activeProfile.id && v.visitNumber === visitNumber
        );
        if (existingVisit) {
          setVisit(existingVisit);
          setChecklist(existingVisit.checklist);
          setNotes(existingVisit.notes || '');
          setScheduledDate(new Date(existingVisit.scheduledDate));
          if (existingVisit.completedDate) {
            setCompletedDate(new Date(existingVisit.completedDate));
          }
        }
      }
    } catch (error) {
      console.error('Error loading visit data:', error);
      Alert.alert('Error', 'Gagal memuat data kunjungan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisitData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitNumber, activeProfile?.id]);

  const toggleChecklistItem = (key: keyof ANCChecklist) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleScheduledDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowScheduledPicker(false);
    }
    if (selectedDate) {
      setScheduledDate(selectedDate);
    }
  };

  const handleCompletedDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowCompletedPicker(false);
    }
    if (selectedDate) {
      setCompletedDate(selectedDate);
    }
  };

  const handleSave = async () => {
    if (!activeProfile) {
      Alert.alert('Error', 'Profil tidak ditemukan.');
      return;
    }

    try {
      setIsSaving(true);
      const savedVisits = (await getANCVisits()) || [];

      const visitData: ANCVisit = {
        id: visit?.id || `anc-${activeProfile.id}-${visitNumber}`,
        profileId: activeProfile.id,
        visitNumber,
        scheduledDate: scheduledDate.toISOString(),
        completedDate: completedDate?.toISOString(),
        completed: completedDate !== null,
        checklist,
        notes: notes.trim() || undefined,
      };

      const existingIndex = savedVisits.findIndex(
        (v: ANCVisit) => v.profileId === activeProfile.id && v.visitNumber === visitNumber
      );

      let updatedVisits: ANCVisit[];
      if (existingIndex >= 0) {
        updatedVisits = [...savedVisits];
        updatedVisits[existingIndex] = visitData;
      } else {
        updatedVisits = [...savedVisits, visitData];
      }

      await saveANCVisits(updatedVisits);
      setVisit(visitData);

      Alert.alert('Berhasil', 'Data kunjungan berhasil disimpan.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving visit:', error);
      Alert.alert('Error', 'Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const fieldsForVisit = CHECKLIST_FIELDS.filter((field) =>
    field.visitNumbers.includes(visitNumber)
  );

  if (!schedule) {
    return (
      <View style={styles.screen}>
        <Header title="Kunjungan ANC" showBack />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
          <Text style={styles.errorText}>Data kunjungan tidak ditemukan.</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Header title={schedule.label} showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title={schedule.label} subtitle={schedule.description} showBack />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Visit Info */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.secondary} />
            <Text style={styles.infoText}>
              Minggu kehamilan: {schedule.weekRange}
            </Text>
          </View>
          <Text style={styles.infoDescription}>
            Pastikan semua pemeriksaan dilakukan oleh tenaga kesehatan yang kompeten.
          </Text>
        </Card>

        {/* Scheduled Date */}
        <Card style={styles.dateCard}>
          <Text style={styles.dateLabel}>Tanggal Dijadwalkan</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowScheduledPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
            <Text style={styles.dateButtonText}>
              {formatDateID(scheduledDate.toISOString())}
            </Text>
            <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
          {showScheduledPicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={scheduledDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleScheduledDateChange}
              />
              {Platform.OS === 'ios' && (
                <Button
                  title="Selesai"
                  onPress={() => setShowScheduledPicker(false)}
                  variant="ghost"
                  size="sm"
                />
              )}
            </View>
          )}
        </Card>

        {/* Completed Date */}
        <Card style={styles.dateCard}>
          <View style={styles.completedHeader}>
            <Text style={styles.dateLabel}>Tanggal Selesai</Text>
            {completedDate && (
              <TouchableOpacity
                onPress={() => setCompletedDate(null)}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Hapus</Text>
              </TouchableOpacity>
            )}
          </View>
          {completedDate ? (
            <TouchableOpacity
              style={[styles.dateButton, styles.dateButtonCompleted]}
              onPress={() => setShowCompletedPicker(true)}
            >
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={[styles.dateButtonText, { color: Colors.success }]}>
                {formatDateID(completedDate.toISOString())}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setCompletedDate(new Date());
                setShowCompletedPicker(true);
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.textSecondary} />
              <Text style={[styles.dateButtonText, { color: Colors.textSecondary }]}>
                Tandai selesai
              </Text>
            </TouchableOpacity>
          )}
          {showCompletedPicker && completedDate && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={completedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleCompletedDateChange}
              />
              {Platform.OS === 'ios' && (
                <Button
                  title="Selesai"
                  onPress={() => setShowCompletedPicker(false)}
                  variant="ghost"
                  size="sm"
                />
              )}
            </View>
          )}
        </Card>

        {/* Checklist */}
        <Text style={styles.sectionTitle}>Daftar Pemeriksaan</Text>
        <Card style={styles.checklistCard}>
          {fieldsForVisit.map((field) => {
            const isChecked = checklist[field.key] ?? false;
            return (
              <TouchableOpacity
                key={field.key}
                style={styles.checklistItem}
                onPress={() => toggleChecklistItem(field.key)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    isChecked && styles.checkboxChecked,
                  ]}
                >
                  {isChecked && (
                    <Ionicons name="checkmark" size={16} color={Colors.white} />
                  )}
                </View>
                <Text
                  style={[
                    styles.checklistLabel,
                    isChecked && styles.checklistLabelChecked,
                  ]}
                >
                  {field.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Card>

        {/* Notes */}
        <Text style={styles.sectionTitle}>Catatan</Text>
        <Card style={styles.notesCard}>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Tambahkan catatan dari kunjungan ini..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>

        {/* Save Button */}
        <Button
          title="Simpan"
          onPress={handleSave}
          size="lg"
          fullWidth
          loading={isSaving}
          icon="save-outline"
          style={styles.saveButton}
        />

        <View style={styles.bottomPadding} />
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  infoCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.secondaryBg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.secondaryDark,
    marginLeft: Spacing.sm,
  },
  infoDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  dateCard: {
    marginBottom: Spacing.md,
  },
  dateLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  clearButtonText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: FontWeight.medium,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
  },
  dateButtonCompleted: {
    backgroundColor: Colors.successBg,
  },
  dateButtonText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.sm,
  },
  pickerContainer: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  checklistCard: {
    marginBottom: Spacing.md,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checklistLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  checklistLabelChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  notesCard: {
    marginBottom: Spacing.lg,
  },
  notesInput: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    minHeight: 100,
    lineHeight: 22,
  },
  saveButton: {
    marginBottom: Spacing.md,
  },
  bottomPadding: {
    height: Spacing.huge,
  },
});

// KIA Care - Kesehatan (Health) Tab
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow, phaseConfig } from '@/constants/theme';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import SectionTitle from '@/components/ui/SectionTitle';
import EmptyState from '@/components/ui/EmptyState';
import healthData from '@/data/health.json';
import {
  getPregnancyWeek,
  getBabyAgeText,
} from '@/utils/date';

// Types for local state
interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
}

interface ANCVisitLocal {
  visitNumber: number;
  label: string;
  trimester: number;
  weekRange: string;
  description: string;
  completed: boolean;
  date: string | null;
  notes: string;
}

interface KFVisitLocal {
  visitNumber: number;
  label: string;
  timing: string;
  description: string;
  completed: boolean;
  date: string | null;
}

interface WeightBpEntry {
  id: string;
  date: string;
  weight: string;
  systolic: string;
  diastolic: string;
  notes: string;
}

interface BreastfeedingEntry {
  id: string;
  time: string;
  side: string;
  type: string;
  duration: string;
  notes: string;
}

interface DangerSignResult {
  hasSymptom: boolean;
  sign: string;
}

interface BabyRecord {
  ageWeeks: number;
  weight: number;
  height: number;
  headCircumference: number;
  date: string;
}

export default function KesehatanScreen() {
  const { activeProfile } = useApp();

  if (!activeProfile) {
    return (
      <View style={styles.container}>
        <Header title="Kesehatan" subtitle="Data kesehatan ibu & anak" />
        <View style={styles.centerContent}>
          <EmptyState
            icon="person-outline"
            title="Tidak ada profil aktif"
            description="Buat profil terlebih dahulu untuk mengakses fitur kesehatan."
          />
        </View>
      </View>
    );
  }

  const phase = activeProfile.phase;
  const config = phaseConfig[phase];

  return (
    <View style={styles.container}>
      <Header
        title="Kesehatan"
        subtitle={`Data kesehatan · ${config.label}`}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Phase Badge */}
        <View style={[styles.phaseBanner, { backgroundColor: config.bgColor, borderColor: config.color + '30' }]}>
          <Ionicons name={config.icon as any} size={20} color={config.color} />
          <Text style={[styles.phaseBannerText, { color: config.color }]}>
            Fase: {config.label}
          </Text>
        </View>

        {phase === 'pra-hamil' && <PraHamilContent />}
        {phase === 'hamil' && <HamilContent profile={activeProfile} />}
        {phase === 'pasca-melahirkan' && <PascaContent profile={activeProfile} />}

        {/* Feature Entry Cards */}
        <FeatureEntryCards phase={phase} />

        <View style={{ height: Spacing.massive }} />
      </ScrollView>
    </View>
  );
}

// ==================== PRA HAMIL ====================
function PraHamilContent() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    healthData['pra-hamil'].checklist.map((item) => ({ ...item, completed: false }))
  );
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [healthNotes, setHealthNotes] = useState<Record<string, string>>({});
  const [showFertility, setShowFertility] = useState(false);
  const [cycleLength, setCycleLength] = useState(healthData['pra-hamil'].fertilityDefaults.cycleLength.toString());
  const [periodLength, setPeriodLength] = useState(healthData['pra-hamil'].fertilityDefaults.periodLength.toString());

  const toggleChecklist = useCallback((id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  const completedCount = checklist.filter((c) => c.completed).length;
  const cycleNum = parseInt(cycleLength, 10) || 28;
  const ovulationDay = cycleNum - 14;
  const fertileStart = ovulationDay - 2;
  const fertileEnd = ovulationDay + 1;

  return (
    <>
      {/* Checklist Persiapan */}
      <SectionTitle
        title="Checklist Persiapan"
        icon="checkbox-outline"
        color={Colors.praHamil}
      />
      <Card style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress Persiapan</Text>
          <Text style={[styles.progressCount, { color: Colors.praHamil }]}>
            {completedCount}/{checklist.length}
          </Text>
        </View>
        <ProgressBar
          progress={completedCount / checklist.length}
          color={Colors.praHamil}
          height={8}
        />
      </Card>
      {checklist.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.checklistItem, item.completed && styles.checklistItemCompleted]}
          onPress={() => toggleChecklist(item.id)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.checkboxCircle,
            item.completed && { backgroundColor: Colors.praHamil, borderColor: Colors.praHamil },
          ]}>
            {item.completed && <Ionicons name="checkmark" size={14} color={Colors.white} />}
          </View>
          <View style={styles.checklistTextContainer}>
            <Text style={[styles.checklistTitle, item.completed && styles.checklistTitleCompleted]}>
              {item.title}
            </Text>
            <Text style={styles.checklistDescription}>{item.description}</Text>
          </View>
          <Ionicons name={item.icon as any} size={20} color={item.completed ? Colors.praHamil : Colors.textTertiary} />
        </TouchableOpacity>
      ))}

      {/* Kalender Kesuburan */}
      <SectionTitle
        title="Kalender Kesuburan"
        icon="flower-outline"
        color={Colors.accent}
      />
      <Card style={styles.fertilityCard}>
        <TouchableOpacity
          style={styles.fertilityToggle}
          onPress={() => setShowFertility(!showFertility)}
          activeOpacity={0.7}
        >
          <View style={[styles.fertilityIcon, { backgroundColor: Colors.accentBg }]}>
            <Ionicons name="flower" size={24} color={Colors.accent} />
          </View>
          <View style={styles.fertilityTextContainer}>
            <Text style={styles.fertilityTitle}>Hitung Masa Subur</Text>
            <Text style={styles.fertilitySubtitle}>Berdasarkan panjang siklus menstruasi</Text>
          </View>
          <Ionicons name={showFertility ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        {showFertility && (
          <View style={styles.fertilityContent}>
            <View style={styles.fertilityInputRow}>
              <View style={styles.fertilityInputGroup}>
                <Text style={styles.inputLabel}>Panjang Siklus (hari)</Text>
                <TextInput
                  style={styles.fertilityInput}
                  value={cycleLength}
                  onChangeText={setCycleLength}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              <View style={styles.fertilityInputGroup}>
                <Text style={styles.inputLabel}>Lama Haid (hari)</Text>
                <TextInput
                  style={styles.fertilityInput}
                  value={periodLength}
                  onChangeText={setPeriodLength}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>

            <View style={styles.fertilityResult}>
              <View style={[styles.resultBadge, { backgroundColor: Colors.successBg }]}>
                <Ionicons name="heart" size={16} color={Colors.success} />
                <Text style={[styles.resultText, { color: Colors.success }]}>
                  Masa Subur: Hari ke-{fertileStart} s/d ke-{fertileEnd}
                </Text>
              </View>
              <View style={[styles.resultBadge, { backgroundColor: Colors.accentBg }]}>
                <Ionicons name="star" size={16} color={Colors.accentDark} />
                <Text style={[styles.resultText, { color: Colors.accentDark }]}>
                  Ovulasi: Hari ke-{ovulationDay}
                </Text>
              </View>
              <Text style={styles.resultNote}>
                * Dihitung dari hari pertama menstruasi terakhir
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* Catatan Kesehatan */}
      <SectionTitle
        title="Catatan Kesehatan"
        icon="document-text-outline"
        color={Colors.secondary}
      />
      <Card
        onPress={() => setShowNotesModal(true)}
        style={styles.actionCard}
      >
        <View style={styles.actionCardRow}>
          <View style={[styles.actionIcon, { backgroundColor: Colors.secondaryBg }]}>
            <Ionicons name="create-outline" size={24} color={Colors.secondary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Catatan Kesehatan Pra-Hamil</Text>
            <Text style={styles.actionSubtitle}>
              {Object.keys(healthNotes).length > 0
                ? `${Object.keys(healthNotes).length} catatan tersimpan`
                : 'Catat hasil pemeriksaan Anda'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
        </View>
      </Card>

      {/* Health Notes Modal */}
      <Modal visible={showNotesModal} animationType="slide" transparent onRequestClose={() => setShowNotesModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Catatan Kesehatan</Text>
              <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {healthData['pra-hamil'].healthNotes.fields.map((field) => (
                <View key={field} style={styles.noteField}>
                  <Text style={styles.noteFieldLabel}>{field}</Text>
                  <TextInput
                    style={styles.noteFieldInput}
                    value={healthNotes[field] || ''}
                    onChangeText={(text) => setHealthNotes((prev) => ({ ...prev, [field]: text }))}
                    placeholder={`Masukkan ${field.toLowerCase()}`}
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: Colors.praHamil }]}
              onPress={() => {
                setShowNotesModal(false);
                Alert.alert('Tersimpan', 'Catatan kesehatan berhasil disimpan.');
              }}
            >
              <Text style={styles.saveButtonText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ==================== HAMIL ====================
function HamilContent({ profile }: { profile: any }) {
  const [ancVisits, setAncVisits] = useState<ANCVisitLocal[]>(
    healthData.hamil.ancVisits.map((v) => ({ ...v }))
  );
  const [ttdTaken, setTtdTaken] = useState(0);
  const [dangerResults, setDangerResults] = useState<DangerSignResult[]>(
    healthData.hamil.dangerSigns.map((s) => ({ hasSymptom: false, sign: s.sign }))
  );
  const [showDangerResult, setShowDangerResult] = useState(false);
  const [weightBpLog, setWeightBpLog] = useState<WeightBpEntry[]>([]);
  const [showWeightBpModal, setShowWeightBpModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newSystolic, setNewSystolic] = useState('');
  const [newDiastolic, setNewDiastolic] = useState('');
  const [newBpNotes, setNewBpNotes] = useState('');

  const pregnancyWeek = profile.hpht ? getPregnancyWeek(profile.hpht) : 0;
  const ttdTarget = healthData.hamil.ttdLog.target;

  const toggleAncVisit = useCallback((visitNumber: number) => {
    setAncVisits((prev) =>
      prev.map((v) =>
        v.visitNumber === visitNumber
          ? { ...v, completed: !v.completed, date: !v.completed ? new Date().toISOString().split('T')[0] : null }
          : v
      )
    );
  }, []);

  const handleLogTTD = useCallback(() => {
    if (ttdTaken < ttdTarget) {
      setTtdTaken((prev) => prev + 1);
      Alert.alert('TTD Tercatat', `Tablet ke-${ttdTaken + 1} dari ${ttdTarget} telah dicatat.`);
    } else {
      Alert.alert('Target Tercapai', 'Selamat! Anda telah mencapai target 90 tablet TTD.');
    }
  }, [ttdTaken, ttdTarget]);

  const toggleDangerSign = useCallback((index: number) => {
    setDangerResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, hasSymptom: !r.hasSymptom } : r))
    );
  }, []);

  const handleCheckDanger = useCallback(() => {
    setShowDangerResult(true);
    const hasAny = dangerResults.some((r) => r.hasSymptom);
    if (hasAny) {
      Alert.alert(
        '⚠️ Peringatan',
        'Anda mengalami tanda bahaya. Segera hubungi tenaga kesehatan atau kunjungi fasilitas kesehatan terdekat!',
        [{ text: 'Mengerti', style: 'default' }]
      );
    }
  }, [dangerResults]);

  const addWeightBpEntry = useCallback(() => {
    if (!newWeight.trim() && !newSystolic.trim()) {
      Alert.alert('Perhatian', 'Masukkan minimal berat badan atau tekanan darah.');
      return;
    }
    const entry: WeightBpEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      weight: newWeight,
      systolic: newSystolic,
      diastolic: newDiastolic,
      notes: newBpNotes,
    };
    setWeightBpLog((prev) => [entry, ...prev]);
    setNewWeight('');
    setNewSystolic('');
    setNewDiastolic('');
    setNewBpNotes('');
    setShowWeightBpModal(false);
    Alert.alert('Tersimpan', 'Catatan berhasil disimpan.');
  }, [newWeight, newSystolic, newDiastolic, newBpNotes]);

  const ancCompleted = ancVisits.filter((v) => v.completed).length;

  return (
    <>
      {/* Pregnancy Week Info */}
      {pregnancyWeek > 0 && (
        <View style={[styles.weekBanner, { backgroundColor: Colors.hamilBg }]}>
          <Ionicons name="body-outline" size={18} color={Colors.hamil} />
          <Text style={[styles.weekBannerText, { color: Colors.hamil }]}>
            Usia Kehamilan: Minggu ke-{pregnancyWeek}
          </Text>
        </View>
      )}

      {/* Pemeriksaan ANC */}
      <SectionTitle
        title="Pemeriksaan ANC"
        subtitle={`${ancCompleted}/6 kunjungan selesai`}
        icon="medkit-outline"
        color={Colors.secondary}
      />
      <Card style={styles.progressCard}>
        <ProgressBar
          progress={ancCompleted / 6}
          color={Colors.secondary}
          height={8}
          showLabel
          label={`${ancCompleted}/6 Kunjungan`}
        />
      </Card>
      {ancVisits.map((visit) => (
        <TouchableOpacity
          key={visit.visitNumber}
          style={[styles.visitCard, visit.completed && styles.visitCardCompleted]}
          onPress={() => toggleAncVisit(visit.visitNumber)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.visitNumber,
            { backgroundColor: visit.completed ? Colors.success : Colors.secondary + '20' },
          ]}>
            {visit.completed ? (
              <Ionicons name="checkmark" size={16} color={Colors.white} />
            ) : (
              <Text style={[styles.visitNumberText, { color: Colors.secondary }]}>{visit.visitNumber}</Text>
            )}
          </View>
          <View style={styles.visitInfo}>
            <Text style={styles.visitLabel}>{visit.label}</Text>
            <Text style={styles.visitDescription}>{visit.weekRange}</Text>
            {visit.completed && visit.date && (
              <Text style={[styles.visitDate, { color: Colors.success }]}>✓ Selesai: {visit.date}</Text>
            )}
          </View>
          <View style={[
            styles.trimesterBadge,
            { backgroundColor: visit.trimester === 1 ? Colors.primaryBg : visit.trimester === 2 ? Colors.accentBg : Colors.secondaryBg },
          ]}>
            <Text style={[
              styles.trimesterText,
              { color: visit.trimester === 1 ? Colors.primary : visit.trimester === 2 ? Colors.accentDark : Colors.secondary },
            ]}>
              TM {visit.trimester}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Log Tablet Tambah Darah */}
      <SectionTitle
        title="Log Tablet Tambah Darah"
        subtitle={`Target: ${ttdTarget} tablet`}
        icon="medical-outline"
        color={Colors.accent}
      />
      <Card style={styles.ttdCard}>
        <View style={styles.ttdHeader}>
          <View>
            <Text style={styles.ttdCount}>{ttdTaken}</Text>
            <Text style={styles.ttdLabel}>dari {ttdTarget} tablet</Text>
          </View>
          <View style={styles.ttdCircle}>
            <Text style={styles.ttdPercent}>{Math.round((ttdTaken / ttdTarget) * 100)}%</Text>
          </View>
        </View>
        <ProgressBar
          progress={ttdTaken / ttdTarget}
          color={Colors.accent}
          height={10}
        />
        <TouchableOpacity
          style={[styles.logTtdButton, { backgroundColor: Colors.accent }]}
          onPress={handleLogTTD}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={20} color={Colors.white} />
          <Text style={styles.logTtdButtonText}>Catat Minum TTD Hari Ini</Text>
        </TouchableOpacity>
      </Card>

      {/* Tanda Bahaya Kehamilan */}
      <SectionTitle
        title="Tanda Bahaya Kehamilan"
        icon="warning-outline"
        color={Colors.danger}
      />
      <Card style={styles.dangerCard}>
        <Text style={styles.dangerInstructions}>
          Centang jika Anda mengalami gejala berikut:
        </Text>
        {dangerResults.map((result, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dangerSignRow}
            onPress={() => toggleDangerSign(index)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.dangerCheckbox,
              result.hasSymptom && { backgroundColor: Colors.danger, borderColor: Colors.danger },
            ]}>
              {result.hasSymptom && <Ionicons name="checkmark" size={12} color={Colors.white} />}
            </View>
            <Text style={[styles.dangerSignText, result.hasSymptom && { color: Colors.danger, fontWeight: FontWeight.semibold }]}>
              {result.sign}
            </Text>
            {healthData.hamil.dangerSigns[index]?.severity === 'danger' && (
              <View style={styles.dangerBadge}>
                <Text style={styles.dangerBadgeText}>!</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.checkDangerButton, { backgroundColor: Colors.danger }]}
          onPress={handleCheckDanger}
          activeOpacity={0.7}
        >
          <Ionicons name="shield-checkmark" size={20} color={Colors.white} />
          <Text style={styles.checkDangerButtonText}>Cek Hasil</Text>
        </TouchableOpacity>
        {showDangerResult && (
          <View style={[
            styles.dangerResultBox,
            {
              backgroundColor: dangerResults.some((r) => r.hasSymptom) ? Colors.dangerBg : Colors.successBg,
              borderColor: dangerResults.some((r) => r.hasSymptom) ? Colors.dangerLight : Colors.successLight,
            },
          ]}>
            <Ionicons
              name={dangerResults.some((r) => r.hasSymptom) ? 'alert-circle' : 'checkmark-circle'}
              size={24}
              color={dangerResults.some((r) => r.hasSymptom) ? Colors.danger : Colors.success}
            />
            <Text style={[
              styles.dangerResultText,
              { color: dangerResults.some((r) => r.hasSymptom) ? Colors.danger : Colors.success },
            ]}>
              {dangerResults.some((r) => r.hasSymptom)
                ? 'Ditemukan tanda bahaya! Segera ke fasilitas kesehatan.'
                : 'Tidak ada tanda bahaya. Tetap jaga kesehatan Anda!'}
            </Text>
          </View>
        )}
      </Card>

      {/* Catatan Berat Badan & Tekanan Darah */}
      <SectionTitle
        title="Catatan BB & Tekanan Darah"
        icon="analytics-outline"
        color={Colors.primary}
        actionLabel="+ Tambah"
        onAction={() => setShowWeightBpModal(true)}
      />
      {weightBpLog.length === 0 ? (
        <Card style={styles.emptyLogCard}>
          <View style={styles.emptyLogContent}>
            <Ionicons name="bar-chart-outline" size={32} color={Colors.textTertiary} />
            <Text style={styles.emptyLogText}>Belum ada catatan</Text>
            <TouchableOpacity
              style={[styles.addLogButton, { backgroundColor: Colors.primary }]}
              onPress={() => setShowWeightBpModal(true)}
            >
              <Text style={styles.addLogButtonText}>Tambah Catatan</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ) : (
        weightBpLog.map((entry) => (
          <Card key={entry.id} style={styles.logEntryCard}>
            <Text style={styles.logEntryDate}>{entry.date}</Text>
            <View style={styles.logEntryRow}>
              {entry.weight ? (
                <View style={styles.logEntryItem}>
                  <Text style={styles.logEntryLabel}>BB</Text>
                  <Text style={styles.logEntryValue}>{entry.weight} kg</Text>
                </View>
              ) : null}
              {entry.systolic ? (
                <View style={styles.logEntryItem}>
                  <Text style={styles.logEntryLabel}>TD</Text>
                  <Text style={styles.logEntryValue}>{entry.systolic}/{entry.diastolic || '-'} mmHg</Text>
                </View>
              ) : null}
            </View>
            {entry.notes ? <Text style={styles.logEntryNotes}>{entry.notes}</Text> : null}
          </Card>
        ))
      )}

      {/* Weight/BP Modal */}
      <Modal visible={showWeightBpModal} animationType="slide" transparent onRequestClose={() => setShowWeightBpModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Catatan</Text>
              <TouchableOpacity onPress={() => setShowWeightBpModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.noteField}>
              <Text style={styles.noteFieldLabel}>Berat Badan (kg)</Text>
              <TextInput
                style={styles.noteFieldInput}
                value={newWeight}
                onChangeText={setNewWeight}
                keyboardType="decimal-pad"
                placeholder="Contoh: 65.5"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>
            <View style={styles.bpRow}>
              <View style={[styles.noteField, { flex: 1 }]}>
                <Text style={styles.noteFieldLabel}>Sistolik</Text>
                <TextInput
                  style={styles.noteFieldInput}
                  value={newSystolic}
                  onChangeText={setNewSystolic}
                  keyboardType="number-pad"
                  placeholder="120"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              <Text style={styles.bpSlash}>/</Text>
              <View style={[styles.noteField, { flex: 1 }]}>
                <Text style={styles.noteFieldLabel}>Diastolik</Text>
                <TextInput
                  style={styles.noteFieldInput}
                  value={newDiastolic}
                  onChangeText={setNewDiastolic}
                  keyboardType="number-pad"
                  placeholder="80"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            </View>
            <View style={styles.noteField}>
              <Text style={styles.noteFieldLabel}>Catatan</Text>
              <TextInput
                style={[styles.noteFieldInput, { minHeight: 60 }]}
                value={newBpNotes}
                onChangeText={setNewBpNotes}
                placeholder="Catatan tambahan (opsional)"
                placeholderTextColor={Colors.textTertiary}
                multiline
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: Colors.primary }]}
              onPress={addWeightBpEntry}
            >
              <Text style={styles.saveButtonText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ==================== GROWTH CHART ENTRY ====================
function GrowthChartEntry() {
  const router = useRouter();
  return (
    <Card
      onPress={() => router.push('/growth-chart')}
      style={styles.growthChartEntryCard}
    >
      <View style={styles.growthChartEntryRow}>
        <View style={[styles.growthChartEntryIcon, { backgroundColor: Colors.secondaryBg }]}>
          <Ionicons name="analytics" size={28} color={Colors.secondary} />
        </View>
        <View style={styles.growthChartEntryContent}>
          <Text style={styles.growthChartEntryTitle}>Kurva Pertumbuhan WHO</Text>
          <Text style={styles.growthChartEntrySubtitle}>
            Pantau tinggi & berat badan anak. Deteksi dini stunting berdasarkan standar WHO.
          </Text>
          <View style={styles.growthChartEntryBadges}>
            <View style={[styles.growthChartBadge, { backgroundColor: '#F0FFF5' }]}>
              <Text style={[styles.growthChartBadgeText, { color: '#27AE60' }]}>Normal</Text>
            </View>
            <View style={[styles.growthChartBadge, { backgroundColor: '#FFF8F0' }]}>
              <Text style={[styles.growthChartBadgeText, { color: '#E67E22' }]}>Risiko</Text>
            </View>
            <View style={[styles.growthChartBadge, { backgroundColor: '#FFF5F5' }]}>
              <Text style={[styles.growthChartBadgeText, { color: '#E74C3C' }]}>Stunting</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
      </View>
    </Card>
  );
}

// ==================== MILESTONE TRACKER ENTRY ====================
function MilestoneTrackerEntry() {
  const router = useRouter();
  return (
    <Card
      onPress={() => router.push('/milestone-tracker')}
      style={styles.milestoneTrackerEntryCard}
    >
      <View style={styles.milestoneTrackerEntryRow}>
        <View style={[styles.milestoneTrackerEntryIcon, { backgroundColor: '#F5F0FF' }]}>
          <Ionicons name="ribbon-outline" size={28} color="#9B8EC4" />
        </View>
        <View style={styles.milestoneTrackerEntryContent}>
          <Text style={styles.milestoneTrackerEntryTitle}>Milestone Perkembangan</Text>
          <Text style={styles.milestoneTrackerEntrySubtitle}>
            Pantau pencapaian motorik, bahasa, dan sosial-emosional anak sesuai usia.
          </Text>
          <View style={styles.milestoneTrackerBadges}>
            <View style={[styles.milestoneBadge, { backgroundColor: '#F0FFF4' }]}>
              <Text style={[styles.milestoneBadgeText, { color: '#5CB85C' }]}>Motorik</Text>
            </View>
            <View style={[styles.milestoneBadge, { backgroundColor: '#EBF5FB' }]}>
              <Text style={[styles.milestoneBadgeText, { color: '#5B9BD5' }]}>Bahasa</Text>
            </View>
            <View style={[styles.milestoneBadge, { backgroundColor: '#F5F0FF' }]}>
              <Text style={[styles.milestoneBadgeText, { color: '#9B8EC4' }]}>Sosial</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
      </View>
    </Card>
  );
}

// ==================== PASCA MELAHIRKAN ====================
function PascaContent({ profile }: { profile: any }) {
  const [kfVisits, setKfVisits] = useState<KFVisitLocal[]>(
    healthData['pasca-melahirkan'].kfVisits.map((v) => ({ ...v }))
  );
  const [breastfeedingLog, setBfLog] = useState<BreastfeedingEntry[]>([]);
  const [showBfModal, setShowBfModal] = useState(false);
  const [bfSide, setBfSide] = useState('Kiri');
  const [bfType, setBfType] = useState('Langsung');
  const [bfDuration, setBfDuration] = useState('');
  const [bfNotes, setBfNotes] = useState('');
  const babyRecords: BabyRecord[] = healthData['pasca-melahirkan'].babyData.records;

  const babyAgeText = profile.babyDob ? getBabyAgeText(profile.babyDob) : '';

  const toggleKfVisit = useCallback((visitNumber: number) => {
    setKfVisits((prev) =>
      prev.map((v) =>
        v.visitNumber === visitNumber
          ? { ...v, completed: !v.completed, date: !v.completed ? new Date().toISOString().split('T')[0] : null }
          : v
      )
    );
  }, []);

  const addBreastfeedingEntry = useCallback(() => {
    if (!bfDuration.trim()) {
      Alert.alert('Perhatian', 'Masukkan durasi menyusui.');
      return;
    }
    const entry: BreastfeedingEntry = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      side: bfSide,
      type: bfType,
      duration: bfDuration,
      notes: bfNotes,
    };
    setBfLog((prev) => [entry, ...prev]);
    setBfDuration('');
    setBfNotes('');
    setShowBfModal(false);
    Alert.alert('Tercatat', 'Sesi menyusui berhasil dicatat.');
  }, [bfSide, bfType, bfDuration, bfNotes]);

  const kfCompleted = kfVisits.filter((v) => v.completed).length;

  return (
    <>
      {/* Baby Age Info */}
      {babyAgeText ? (
        <View style={[styles.weekBanner, { backgroundColor: Colors.pascaMelahirkanBg }]}>
          <Ionicons name="happy-outline" size={18} color={Colors.pascaMelahirkan} />
          <Text style={[styles.weekBannerText, { color: Colors.pascaMelahirkan }]}>
            {profile.babyName || 'Si Kecil'}: {babyAgeText}
          </Text>
        </View>
      ) : null}

      {/* Kunjungan Nifas KF1-KF4 */}
      <SectionTitle
        title="Kunjungan Nifas"
        subtitle={`${kfCompleted}/4 kunjungan selesai`}
        icon="medkit-outline"
        color={Colors.pascaMelahirkan}
      />
      <Card style={styles.progressCard}>
        <ProgressBar
          progress={kfCompleted / 4}
          color={Colors.pascaMelahirkan}
          height={8}
          showLabel
          label={`${kfCompleted}/4 Kunjungan`}
        />
      </Card>
      {kfVisits.map((visit) => (
        <TouchableOpacity
          key={visit.visitNumber}
          style={[styles.visitCard, visit.completed && styles.visitCardCompleted]}
          onPress={() => toggleKfVisit(visit.visitNumber)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.visitNumber,
            { backgroundColor: visit.completed ? Colors.success : Colors.pascaMelahirkan + '20' },
          ]}>
            {visit.completed ? (
              <Ionicons name="checkmark" size={16} color={Colors.white} />
            ) : (
              <Text style={[styles.visitNumberText, { color: Colors.pascaMelahirkan }]}>{visit.visitNumber}</Text>
            )}
          </View>
          <View style={styles.visitInfo}>
            <Text style={styles.visitLabel}>{visit.label}</Text>
            <Text style={styles.visitDescription}>{visit.timing}</Text>
            {visit.completed && visit.date && (
              <Text style={[styles.visitDate, { color: Colors.success }]}>✓ Selesai: {visit.date}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}

      {/* Log Menyusui */}
      <SectionTitle
        title="Log Menyusui"
        icon="water-outline"
        color={Colors.primary}
        actionLabel="+ Tambah"
        onAction={() => setShowBfModal(true)}
      />
      {breastfeedingLog.length === 0 ? (
        <Card style={styles.emptyLogCard}>
          <View style={styles.emptyLogContent}>
            <Ionicons name="water-outline" size={32} color={Colors.textTertiary} />
            <Text style={styles.emptyLogText}>Belum ada log menyusui hari ini</Text>
            <TouchableOpacity
              style={[styles.addLogButton, { backgroundColor: Colors.primary }]}
              onPress={() => setShowBfModal(true)}
            >
              <Text style={styles.addLogButtonText}>Catat Menyusui</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ) : (
        breastfeedingLog.map((entry) => (
          <Card key={entry.id} style={styles.logEntryCard}>
            <View style={styles.logEntryRow}>
              <View style={styles.logEntryItem}>
                <Text style={styles.logEntryLabel}>Waktu</Text>
                <Text style={styles.logEntryValue}>{entry.time}</Text>
              </View>
              <View style={styles.logEntryItem}>
                <Text style={styles.logEntryLabel}>Sisi</Text>
                <Text style={styles.logEntryValue}>{entry.side}</Text>
              </View>
              <View style={styles.logEntryItem}>
                <Text style={styles.logEntryLabel}>Durasi</Text>
                <Text style={styles.logEntryValue}>{entry.duration} mnt</Text>
              </View>
            </View>
            {entry.notes ? <Text style={styles.logEntryNotes}>{entry.notes}</Text> : null}
          </Card>
        ))
      )}

      {/* Tumbuh Kembang - WHO Growth Chart Entry */}
      <SectionTitle
        title="Tumbuh Kembang"
        icon="analytics-outline"
        color={Colors.secondary}
      />
      <GrowthChartEntry />

      {/* Milestone Tracker Entry */}
      <MilestoneTrackerEntry />

      {/* Data Bayi (BB/TB) */}
      <SectionTitle
        title="Data Bayi (BB/TB)"
        icon="trending-up-outline"
        color={Colors.secondary}
      />
      <Card style={styles.babyDataCard}>
        <View style={styles.babyDataHeader}>
          <Ionicons name="bar-chart-outline" size={20} color={Colors.secondary} />
          <Text style={styles.babyDataTitle}>Rekam Pertumbuhan</Text>
        </View>
        <View style={styles.babyDataTable}>
          <View style={styles.babyDataHeaderRow}>
            <Text style={[styles.babyDataCell, styles.babyDataCellHeader]}>Usia</Text>
            <Text style={[styles.babyDataCell, styles.babyDataCellHeader]}>BB (g)</Text>
            <Text style={[styles.babyDataCell, styles.babyDataCellHeader]}>TB (cm)</Text>
            <Text style={[styles.babyDataCell, styles.babyDataCellHeader]}>LK (cm)</Text>
          </View>
          {babyRecords.map((record, index) => (
            <View key={index} style={[styles.babyDataRow, index % 2 === 0 && styles.babyDataRowEven]}>
              <Text style={styles.babyDataCell}>{record.date}</Text>
              <Text style={[styles.babyDataCell, styles.babyDataCellValue]}>{record.weight}</Text>
              <Text style={[styles.babyDataCell, styles.babyDataCellValue]}>{record.height}</Text>
              <Text style={[styles.babyDataCell, styles.babyDataCellValue]}>{record.headCircumference}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Breastfeeding Modal */}
      <Modal visible={showBfModal} animationType="slide" transparent onRequestClose={() => setShowBfModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Catat Menyusui</Text>
              <TouchableOpacity onPress={() => setShowBfModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.noteFieldLabel}>Sisi</Text>
            <View style={styles.toggleRow}>
              {['Kiri', 'Kanan', 'Keduanya'].map((side) => (
                <TouchableOpacity
                  key={side}
                  style={[styles.toggleButton, bfSide === side && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                  onPress={() => setBfSide(side)}
                >
                  <Text style={[styles.toggleText, bfSide === side && { color: Colors.white }]}>{side}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.noteFieldLabel}>Jenis</Text>
            <View style={styles.toggleRow}>
              {['Langsung', 'Pompa'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.toggleButton, bfType === type && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                  onPress={() => setBfType(type)}
                >
                  <Text style={[styles.toggleText, bfType === type && { color: Colors.white }]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.noteField}>
              <Text style={styles.noteFieldLabel}>Durasi (menit) *</Text>
              <TextInput
                style={styles.noteFieldInput}
                value={bfDuration}
                onChangeText={setBfDuration}
                keyboardType="number-pad"
                placeholder="Contoh: 15"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            <View style={styles.noteField}>
              <Text style={styles.noteFieldLabel}>Catatan</Text>
              <TextInput
                style={[styles.noteFieldInput, { minHeight: 60 }]}
                value={bfNotes}
                onChangeText={setBfNotes}
                placeholder="Catatan tambahan (opsional)"
                placeholderTextColor={Colors.textTertiary}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: Colors.primary }]}
              onPress={addBreastfeedingEntry}
            >
              <Text style={styles.saveButtonText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ==================== FEATURE ENTRY CARDS ====================
function FeatureEntryCards({ phase }: { phase: string }) {
  const router = useRouter();

  return (
    <>
      <SectionTitle
        title="Fitur Kesehatan Lainnya"
        icon="apps-outline"
        color={Colors.textPrimary}
      />

      {/* Clinical Records */}
      <Card
        onPress={() => router.push('/clinical-records')}
        style={styles.featureEntryCard}
      >
        <View style={styles.featureEntryRow}>
          <View style={[styles.featureEntryIcon, { backgroundColor: Colors.primaryBg }]}>
            <Ionicons name="clipboard" size={28} color={Colors.primary} />
          </View>
          <View style={styles.featureEntryContent}>
            <Text style={styles.featureEntryTitle}>Pemeriksaan Klinis</Text>
            <Text style={styles.featureEntrySubtitle}>
              Catat tekanan darah, Hb, berat badan, dan catatan dokter.
            </Text>
            <View style={styles.featureEntryBadges}>
              <View style={[styles.featureBadge, { backgroundColor: Colors.successBg }]}>
                <Text style={[styles.featureBadgeText, { color: Colors.success }]}>TD</Text>
              </View>
              <View style={[styles.featureBadge, { backgroundColor: Colors.warningBg }]}>
                <Text style={[styles.featureBadgeText, { color: Colors.warning }]}>Hb</Text>
              </View>
              <View style={[styles.featureBadge, { backgroundColor: Colors.primaryBg }]}>
                <Text style={[styles.featureBadgeText, { color: Colors.primary }]}>BB</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
        </View>
      </Card>

      {/* Immunization Dashboard */}
      {(phase === 'pasca-melahirkan' || phase === 'hamil') && (
        <Card
          onPress={() => router.push('/immunization-dashboard')}
          style={styles.featureEntryCard}
        >
          <View style={styles.featureEntryRow}>
            <View style={[styles.featureEntryIcon, { backgroundColor: Colors.secondaryBg }]}>
              <Ionicons name="shield-checkmark" size={28} color={Colors.secondary} />
            </View>
            <View style={styles.featureEntryContent}>
              <Text style={styles.featureEntryTitle}>Dashboard Imunisasi</Text>
              <Text style={styles.featureEntrySubtitle}>
                Pantau jadwal & progress imunisasi anak. Lengkap dengan pengingat.
              </Text>
              <View style={styles.featureEntryBadges}>
                <View style={[styles.featureBadge, { backgroundColor: Colors.successBg }]}>
                  <Text style={[styles.featureBadgeText, { color: Colors.success }]}>Lengkap</Text>
                </View>
                <View style={[styles.featureBadge, { backgroundColor: Colors.dangerBg }]}>
                  <Text style={[styles.featureBadgeText, { color: Colors.danger }]}>Terlewat</Text>
                </View>
                <View style={[styles.featureBadge, { backgroundColor: '#EBF5FB' }]}>
                  <Text style={[styles.featureBadgeText, { color: '#3498DB' }]}>Jadwal</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </View>
        </Card>
      )}

      {/* Export KIA Digital */}
      <Card
        onPress={() => router.push('/export-kia')}
        style={styles.featureEntryCard}
      >
        <View style={styles.featureEntryRow}>
          <View style={[styles.featureEntryIcon, { backgroundColor: Colors.accentBg }]}>
            <Ionicons name="document-text" size={28} color={Colors.accentDark} />
          </View>
          <View style={styles.featureEntryContent}>
            <Text style={styles.featureEntryTitle}>Export Buku KIA Digital</Text>
            <Text style={styles.featureEntrySubtitle}>
              Ringkasan kesehatan ibu & anak dalam format PDF. Cetak atau bagikan.
            </Text>
            <View style={styles.featureEntryBadges}>
              <View style={[styles.featureBadge, { backgroundColor: Colors.accentBg }]}>
                <Text style={[styles.featureBadgeText, { color: Colors.accentDark }]}>PDF</Text>
              </View>
              <View style={[styles.featureBadge, { backgroundColor: Colors.surfaceSecondary }]}>
                <Text style={[styles.featureBadgeText, { color: Colors.textSecondary }]}>Ringkasan</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
        </View>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  phaseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  phaseBannerText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  weekBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  weekBannerText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  // Progress Card
  progressCard: {
    marginBottom: Spacing.md,
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
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },

  // Checklist
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  checklistItemCompleted: {
    backgroundColor: Colors.praHamilBg,
  },
  checkboxCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checklistTextContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  checklistTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  checklistTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  checklistDescription: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Fertility
  fertilityCard: {
    marginBottom: Spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  fertilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  fertilityIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  fertilityTextContainer: {
    flex: 1,
  },
  fertilityTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  fertilitySubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  fertilityContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  fertilityInputRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  fertilityInputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  fertilityInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
  },
  fertilityResult: {
    gap: Spacing.sm,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  resultText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  resultNote: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },

  // Action Card
  actionCard: {
    marginBottom: Spacing.md,
  },
  actionCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  actionSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Visit cards
  visitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  visitCardCompleted: {
    backgroundColor: Colors.successBg,
  },
  visitNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  visitNumberText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  visitInfo: {
    flex: 1,
  },
  visitLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  visitDescription: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  visitDate: {
    fontSize: FontSize.xs,
    marginTop: 4,
    fontWeight: FontWeight.medium,
  },
  trimesterBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  trimesterText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // TTD Card
  ttdCard: {
    marginBottom: Spacing.md,
  },
  ttdHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ttdCount: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  ttdLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  ttdCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ttdPercent: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.accentDark,
  },
  logTtdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  logTtdButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },

  // Danger Signs
  dangerCard: {
    marginBottom: Spacing.md,
  },
  dangerInstructions: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  dangerSignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dangerCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  dangerSignText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  dangerBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
  },
  checkDangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  checkDangerButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  dangerResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  dangerResultText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  // Empty Log
  emptyLogCard: {
    marginBottom: Spacing.md,
  },
  emptyLogContent: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  emptyLogText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  addLogButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addLogButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },

  // Log Entry
  logEntryCard: {
    marginBottom: Spacing.sm,
  },
  logEntryDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  logEntryRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  logEntryItem: {},
  logEntryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  logEntryValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  logEntryNotes: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },

  // Baby Data
  babyDataCard: {
    marginBottom: Spacing.md,
  },
  babyDataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  babyDataTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  babyDataTable: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  babyDataHeaderRow: {
    flexDirection: 'row',
    backgroundColor: Colors.secondary + '15',
    paddingVertical: Spacing.sm,
  },
  babyDataRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  babyDataRowEven: {
    backgroundColor: Colors.surfaceSecondary,
  },
  babyDataCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
  },
  babyDataCellHeader: {
    fontWeight: FontWeight.semibold,
    color: Colors.secondary,
  },
  babyDataCellValue: {
    fontWeight: FontWeight.medium,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.massive,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  modalScroll: {
    maxHeight: 400,
  },
  noteField: {
    marginBottom: Spacing.md,
  },
  noteFieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  noteFieldInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bpRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  bpSlash: {
    fontSize: FontSize.xl,
    color: Colors.textSecondary,
    paddingBottom: Spacing.lg,
  },
  saveButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },

  // Toggle buttons
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },

  // Growth Chart Entry
  growthChartEntryCard: {
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.secondary + '20',
  },
  growthChartEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  growthChartEntryIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  growthChartEntryContent: {
    flex: 1,
  },
  growthChartEntryTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  growthChartEntrySubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  growthChartEntryBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  growthChartBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  growthChartBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // Milestone Tracker Entry
  milestoneTrackerEntryCard: {
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#9B8EC420',
  },
  milestoneTrackerEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneTrackerEntryIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  milestoneTrackerEntryContent: {
    flex: 1,
  },
  milestoneTrackerEntryTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  milestoneTrackerEntrySubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  milestoneTrackerBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  milestoneBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  milestoneBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },

  // Feature Entry Cards
  featureEntryCard: {
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border + '60',
  },
  featureEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureEntryIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureEntryContent: {
    flex: 1,
  },
  featureEntryTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  featureEntrySubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  featureEntryBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  featureBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  featureBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});

// KIA Care - Medical Appointment Manager
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { getAppointments, saveAppointments } from '@/utils/storage';
import type { Appointment } from '@/types';

const APPOINTMENT_TYPES = [
  { key: 'anc' as const, label: 'ANC / Kontrol Kandungan', icon: 'medical', color: Colors.primary },
  { key: 'imunisasi' as const, label: 'Imunisasi', icon: 'shield-checkmark', color: Colors.secondary },
  { key: 'kontrol' as const, label: 'Kontrol Umum', icon: 'stethoscope', color: Colors.praHamil },
  { key: 'lainnya' as const, label: 'Lainnya', icon: 'calendar', color: Colors.accent },
];

const MONTHS_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function formatDateTimeID(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}, ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
}

function getDaysAway(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getCountdownLabel(daysAway: number): { text: string; color: string; bg: string } {
  if (daysAway < 0) return { text: `${Math.abs(daysAway)} hari lalu`, color: Colors.textTertiary, bg: Colors.borderLight };
  if (daysAway === 0) return { text: 'Hari ini!', color: Colors.danger, bg: Colors.dangerBg };
  if (daysAway === 1) return { text: 'Besok', color: Colors.warning, bg: Colors.warningBg };
  if (daysAway <= 3) return { text: `${daysAway} hari lagi`, color: Colors.warning, bg: Colors.warningBg };
  return { text: `${daysAway} hari lagi`, color: Colors.secondary, bg: Colors.secondaryBg };
}

function getTypeInfo(type: string) {
  return APPOINTMENT_TYPES.find((t) => t.key === type) || APPOINTMENT_TYPES[3];
}

export default function AppointmentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeProfile } = useApp();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    doctorName: '',
    clinicName: '',
    date: new Date(),
    type: 'kontrol' as Appointment['type'],
    notes: '',
  });

  const loadAppointments = useCallback(async () => {
    if (!activeProfile) return;
    try {
      const data = await getAppointments();
      const profileAppointments = ((data || []) as Appointment[])
        .filter((a) => a.profileId === activeProfile.id)
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      setAppointments(profileAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const openAddModal = () => {
    setEditingId(null);
    setForm({ doctorName: '', clinicName: '', date: new Date(), type: 'kontrol', notes: '' });
    setShowModal(true);
  };

  const openEditModal = (appt: Appointment) => {
    setEditingId(appt.id);
    setForm({
      doctorName: appt.doctorName,
      clinicName: appt.clinicName,
      date: new Date(appt.dateTime),
      type: appt.type,
      notes: appt.notes || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.doctorName.trim()) { Alert.alert('Perhatian', 'Nama dokter harus diisi.'); return; }
    if (!form.clinicName.trim()) { Alert.alert('Perhatian', 'Nama klinik/RS harus diisi.'); return; }
    if (!activeProfile) return;

    try {
      const allAppointments = ((await getAppointments()) || []) as Appointment[];
      let updated: Appointment[];

      if (editingId) {
        updated = allAppointments.map((a) =>
          a.id === editingId
            ? { ...a, doctorName: form.doctorName, clinicName: form.clinicName, dateTime: form.date.toISOString(), type: form.type, notes: form.notes }
            : a
        );
      } else {
        const newAppt: Appointment = {
          id: Date.now().toString(),
          profileId: activeProfile.id,
          doctorName: form.doctorName,
          clinicName: form.clinicName,
          dateTime: form.date.toISOString(),
          type: form.type,
          notes: form.notes,
        };
        updated = [...allAppointments, newAppt];
      }

      await saveAppointments(updated);
      setShowModal(false);
      loadAppointments();
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Hapus Janji Temu', 'Yakin ingin menghapus janji temu ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            const allAppointments = ((await getAppointments()) || []) as Appointment[];
            const updated = allAppointments.filter((a) => a.id !== id);
            await saveAppointments(updated);
            loadAppointments();
          } catch (error) {
            console.error('Error deleting appointment:', error);
          }
        },
      },
    ]);
  };

  const upcoming = appointments.filter((a) => getDaysAway(a.dateTime) >= 0);
  const past = appointments.filter((a) => getDaysAway(a.dateTime) < 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Janji Temu</Text>
          <Text style={styles.headerSubtitle}>Kelola kunjungan medis</Text>
        </View>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Upcoming */}
        <Text style={styles.sectionLabel}>Mendatang ({upcoming.length})</Text>
        {upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Belum ada janji temu</Text>
            <Text style={styles.emptySub}>Tambahkan jadwal kunjungan dokter atau imunisasi</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
              <Ionicons name="add-circle" size={16} color={Colors.white} />
              <Text style={styles.emptyButtonText}>Tambah Janji Temu</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcoming.map((appt) => {
            const typeInfo = getTypeInfo(appt.type);
            const daysAway = getDaysAway(appt.dateTime);
            const countdown = getCountdownLabel(daysAway);
            return (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                typeInfo={typeInfo}
                countdown={countdown}
                onEdit={() => openEditModal(appt)}
                onDelete={() => handleDelete(appt.id)}
              />
            );
          })
        )}

        {/* Past */}
        {past.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>Riwayat ({past.length})</Text>
            {past.slice().reverse().map((appt) => {
              const typeInfo = getTypeInfo(appt.type);
              const daysAway = getDaysAway(appt.dateTime);
              const countdown = getCountdownLabel(daysAway);
              return (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  typeInfo={typeInfo}
                  countdown={countdown}
                  isPast
                  onEdit={() => openEditModal(appt)}
                  onDelete={() => handleDelete(appt.id)}
                />
              );
            })}
          </>
        )}

        <View style={{ height: Spacing.massive }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top || Spacing.xl }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Janji Temu' : 'Tambah Janji Temu'}</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Appointment Type */}
            <Text style={styles.fieldLabel}>Jenis Kunjungan</Text>
            <View style={styles.typeGrid}>
              {APPOINTMENT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeOption, form.type === t.key && { borderColor: t.color, backgroundColor: t.color + '15' }]}
                  onPress={() => setForm((prev) => ({ ...prev, type: t.key }))}
                >
                  <Ionicons name={t.icon as any} size={20} color={form.type === t.key ? t.color : Colors.textSecondary} />
                  <Text style={[styles.typeLabel, form.type === t.key && { color: t.color }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Doctor Name */}
            <Text style={styles.fieldLabel}>Nama Dokter</Text>
            <TextInput
              style={styles.input}
              placeholder="Nama dokter (cth: dr. Siti Rahma)"
              placeholderTextColor={Colors.textTertiary}
              value={form.doctorName}
              onChangeText={(v) => setForm((p) => ({ ...p, doctorName: v }))}
            />

            {/* Clinic */}
            <Text style={styles.fieldLabel}>Klinik / Rumah Sakit</Text>
            <TextInput
              style={styles.input}
              placeholder="Nama klinik atau RS"
              placeholderTextColor={Colors.textTertiary}
              value={form.clinicName}
              onChangeText={(v) => setForm((p) => ({ ...p, clinicName: v }))}
            />

            {/* Date */}
            <Text style={styles.fieldLabel}>Tanggal & Waktu</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color={Colors.secondary} />
              <Text style={styles.dateButtonText}>
                {form.date.getDate()} {MONTHS_ID[form.date.getMonth()]} {form.date.getFullYear()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dateButton, { marginTop: Spacing.sm }]} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={20} color={Colors.secondary} />
              <Text style={styles.dateButtonText}>
                {form.date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={form.date}
                mode="date"
                minimumDate={new Date()}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setForm((p) => {
                      const d = new Date(date);
                      d.setHours(p.date.getHours(), p.date.getMinutes());
                      return { ...p, date: d };
                    });
                  }
                }}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={form.date}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowTimePicker(false);
                  if (date) {
                    setForm((p) => {
                      const d = new Date(p.date);
                      d.setHours(date.getHours(), date.getMinutes());
                      return { ...p, date: d };
                    });
                  }
                }}
              />
            )}

            {/* Notes */}
            <Text style={styles.fieldLabel}>Catatan (opsional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Keluhan atau hal yang ingin ditanyakan..."
              placeholderTextColor={Colors.textTertiary}
              value={form.notes}
              onChangeText={(v) => setForm((p) => ({ ...p, notes: v }))}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
              <Text style={styles.saveButtonText}>{editingId ? 'Simpan Perubahan' : 'Tambah Janji Temu'}</Text>
            </TouchableOpacity>

            <View style={{ height: Spacing.massive }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function AppointmentCard({
  appointment, typeInfo, countdown, isPast, onEdit, onDelete,
}: {
  appointment: Appointment;
  typeInfo: typeof APPOINTMENT_TYPES[0];
  countdown: { text: string; color: string; bg: string };
  isPast?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.appointmentCard, isPast && styles.appointmentCardPast]}>
      <View style={[styles.typeIconBox, { backgroundColor: typeInfo.color + (isPast ? '30' : '20') }]}>
        <Ionicons name={typeInfo.icon as any} size={24} color={isPast ? Colors.textTertiary : typeInfo.color} />
      </View>

      <View style={styles.apptInfo}>
        <View style={styles.apptTopRow}>
          <Text style={[styles.apptLabel, { color: typeInfo.color }]}>{typeInfo.label}</Text>
          <View style={[styles.countdownPill, { backgroundColor: countdown.bg }]}>
            <Text style={[styles.countdownPillText, { color: countdown.color }]}>{countdown.text}</Text>
          </View>
        </View>
        <Text style={[styles.apptDoctor, isPast && styles.apptTextFaded]}>Dr. {appointment.doctorName}</Text>
        <Text style={[styles.apptClinic, isPast && styles.apptTextFaded]}>
          <Ionicons name="business-outline" size={12} /> {appointment.clinicName}
        </Text>
        <Text style={[styles.apptDateTime, isPast && styles.apptTextFaded]}>
          <Ionicons name="calendar-outline" size={12} /> {formatDateTimeID(appointment.dateTime)}
        </Text>
        {appointment.notes ? (
          <Text style={styles.apptNotes} numberOfLines={2}>{appointment.notes}</Text>
        ) : null}
      </View>

      <View style={styles.apptActions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
          <Ionicons name="pencil-outline" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={[styles.actionBtn, { marginTop: Spacing.xs }]}>
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { padding: Spacing.xs },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  sectionLabel: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.secondaryLight,
    marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginTop: Spacing.md },
  emptySub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyButtonText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.white },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  appointmentCardPast: { opacity: 0.6 },
  typeIconBox: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  apptInfo: { flex: 1 },
  apptTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  apptLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  countdownPill: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  countdownPillText: { fontSize: 10, fontWeight: FontWeight.bold },
  apptDoctor: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  apptClinic: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  apptDateTime: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  apptNotes: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: Spacing.xs, fontStyle: 'italic' },
  apptTextFaded: { color: Colors.textTertiary },
  apptActions: { alignItems: 'center', justifyContent: 'center', paddingLeft: Spacing.sm },
  actionBtn: { padding: Spacing.xs },

  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  modalScroll: { flex: 1, padding: Spacing.xl },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  typeLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  input: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  dateButtonText: { fontSize: FontSize.md, color: Colors.textPrimary },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  saveButtonText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
});

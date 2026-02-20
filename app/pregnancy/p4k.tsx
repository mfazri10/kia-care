import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
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
import { getP4KData, saveP4KData } from '@/utils/storage';
import { P4KData, CalonPendonorDarah, EmergencyContact } from '@/types';

const DEFAULT_P4K: P4KData = {
  profileId: '',
  lokasiPersalinan: '',
  penolongPersalinan: '',
  transportasi: '',
  pendonorDarah: '',
  pendampingPersalinan: '',
  calonPendonorDarah: [],
  kontakDarurat: [],
  tabungan: '',
  asuransi: '',
  alamatRS: '',
  notes: '',
};

const EMPTY_DONOR: CalonPendonorDarah = {
  nama: '',
  golDarah: '',
  telepon: '',
};

const EMPTY_CONTACT: EmergencyContact = {
  nama: '',
  hubungan: '',
  telepon: '',
};

export default function P4KScreen() {
  const { activeProfile } = useApp();
  const [formData, setFormData] = useState<P4KData>({ ...DEFAULT_P4K });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const savedData = await getP4KData();
      if (savedData && activeProfile) {
        const p4kData = savedData as P4KData;
        if (p4kData.profileId === activeProfile.id) {
          setFormData(p4kData);
        } else {
          setFormData({ ...DEFAULT_P4K, profileId: activeProfile.id });
        }
      } else if (activeProfile) {
        setFormData({ ...DEFAULT_P4K, profileId: activeProfile.id });
      }
    } catch (error) {
      console.error('Error loading P4K data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeProfile?.id])
  );

  const updateField = (field: keyof P4KData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Donor management
  const addDonor = () => {
    setFormData((prev) => ({
      ...prev,
      calonPendonorDarah: [...prev.calonPendonorDarah, { ...EMPTY_DONOR }],
    }));
  };

  const updateDonor = (index: number, field: keyof CalonPendonorDarah, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.calonPendonorDarah];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, calonPendonorDarah: updated };
    });
  };

  const removeDonor = (index: number) => {
    Alert.alert(
      'Hapus Pendonor',
      'Yakin ingin menghapus data pendonor ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            setFormData((prev) => ({
              ...prev,
              calonPendonorDarah: prev.calonPendonorDarah.filter((_, i) => i !== index),
            }));
          },
        },
      ]
    );
  };

  // Contact management
  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      kontakDarurat: [...prev.kontakDarurat, { ...EMPTY_CONTACT }],
    }));
  };

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.kontakDarurat];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, kontakDarurat: updated };
    });
  };

  const removeContact = (index: number) => {
    Alert.alert(
      'Hapus Kontak',
      'Yakin ingin menghapus kontak darurat ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            setFormData((prev) => ({
              ...prev,
              kontakDarurat: prev.kontakDarurat.filter((_, i) => i !== index),
            }));
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!activeProfile) {
      Alert.alert('Error', 'Profil tidak ditemukan.');
      return;
    }

    try {
      setIsSaving(true);
      const dataToSave: P4KData = {
        ...formData,
        profileId: activeProfile.id,
      };
      await saveP4KData(dataToSave);
      Alert.alert('Berhasil', 'Data P4K berhasil disimpan.');
    } catch (error) {
      console.error('Error saving P4K data:', error);
      Alert.alert('Error', 'Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Header
          title="P4K"
          subtitle="Perencanaan Persalinan"
          showBack
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header
        title="P4K"
        subtitle="Perencanaan Persalinan"
        showBack
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.secondary} />
            <Text style={styles.infoText}>
              Program Perencanaan Persalinan dan Pencegahan Komplikasi
            </Text>
          </View>
          <Text style={styles.infoDescription}>
            Isi formulir ini bersama keluarga dan bidan Anda untuk mempersiapkan persalinan yang aman.
          </Text>
        </Card>

        {/* Lokasi Persalinan */}
        <SectionHeader
          icon="location-outline"
          title="Lokasi Persalinan"
          color={Colors.primary}
        />
        <Card style={styles.formCard}>
          <FormInput
            label="Nama Fasilitas Kesehatan"
            placeholder="Contoh: RS Bunda, Puskesmas Kecamatan, dll."
            value={formData.lokasiPersalinan}
            onChangeText={(v) => updateField('lokasiPersalinan', v)}
          />
          <FormInput
            label="Alamat Fasilitas Kesehatan"
            placeholder="Alamat lengkap rumah sakit/puskesmas"
            value={formData.alamatRS}
            onChangeText={(v) => updateField('alamatRS', v)}
            multiline
          />
        </Card>

        {/* Penolong Persalinan */}
        <SectionHeader
          icon="person-outline"
          title="Penolong Persalinan"
          color={Colors.secondary}
        />
        <Card style={styles.formCard}>
          <FormInput
            label="Nama Penolong"
            placeholder="Contoh: dr. Sari / Bidan Ani"
            value={formData.penolongPersalinan}
            onChangeText={(v) => updateField('penolongPersalinan', v)}
          />
          <FormInput
            label="Pendamping Persalinan"
            placeholder="Contoh: Suami, Ibu, dll."
            value={formData.pendampingPersalinan}
            onChangeText={(v) => updateField('pendampingPersalinan', v)}
          />
        </Card>

        {/* Transportasi */}
        <SectionHeader
          icon="car-outline"
          title="Transportasi"
          color={Colors.accent}
        />
        <Card style={styles.formCard}>
          <FormInput
            label="Rencana Transportasi"
            placeholder="Contoh: Mobil pribadi, ambulans desa, dll."
            value={formData.transportasi}
            onChangeText={(v) => updateField('transportasi', v)}
          />
        </Card>

        {/* Calon Pendonor Darah */}
        <SectionHeader
          icon="water-outline"
          title="Calon Pendonor Darah"
          color={Colors.danger}
        />
        <Card style={styles.formCard}>
          <FormInput
            label="Golongan Darah Ibu"
            placeholder="Contoh: A, B, AB, O"
            value={formData.pendonorDarah}
            onChangeText={(v) => updateField('pendonorDarah', v)}
          />

          {formData.calonPendonorDarah.map((donor, index) => (
            <View key={`donor-${index}`} style={styles.listItem}>
              <View style={styles.listItemHeader}>
                <Text style={styles.listItemTitle}>Pendonor {index + 1}</Text>
                <TouchableOpacity
                  onPress={() => removeDonor(index)}
                  style={styles.removeButton}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
              <FormInput
                label="Nama"
                placeholder="Nama pendonor"
                value={donor.nama}
                onChangeText={(v) => updateDonor(index, 'nama', v)}
              />
              <FormInput
                label="Golongan Darah"
                placeholder="A / B / AB / O"
                value={donor.golDarah}
                onChangeText={(v) => updateDonor(index, 'golDarah', v)}
              />
              <FormInput
                label="Telepon"
                placeholder="Nomor telepon"
                value={donor.telepon}
                onChangeText={(v) => updateDonor(index, 'telepon', v)}
                keyboardType="phone-pad"
              />
            </View>
          ))}

          <Button
            title="Tambah Pendonor"
            onPress={addDonor}
            variant="outline"
            size="sm"
            icon="add-circle-outline"
            style={styles.addButton}
            color={Colors.danger}
          />
        </Card>

        {/* Kontak Darurat */}
        <SectionHeader
          icon="call-outline"
          title="Kontak Darurat"
          color={Colors.warning}
        />
        <Card style={styles.formCard}>
          {formData.kontakDarurat.map((contact, index) => (
            <View key={`contact-${index}`} style={styles.listItem}>
              <View style={styles.listItemHeader}>
                <Text style={styles.listItemTitle}>Kontak {index + 1}</Text>
                <TouchableOpacity
                  onPress={() => removeContact(index)}
                  style={styles.removeButton}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
              <FormInput
                label="Nama"
                placeholder="Nama kontak"
                value={contact.nama}
                onChangeText={(v) => updateContact(index, 'nama', v)}
              />
              <FormInput
                label="Hubungan"
                placeholder="Contoh: Suami, Orang tua, dll."
                value={contact.hubungan}
                onChangeText={(v) => updateContact(index, 'hubungan', v)}
              />
              <FormInput
                label="Telepon"
                placeholder="Nomor telepon"
                value={contact.telepon}
                onChangeText={(v) => updateContact(index, 'telepon', v)}
                keyboardType="phone-pad"
              />
            </View>
          ))}

          <Button
            title="Tambah Kontak"
            onPress={addContact}
            variant="outline"
            size="sm"
            icon="add-circle-outline"
            style={styles.addButton}
            color={Colors.warning}
          />
        </Card>

        {/* Tabungan & Asuransi */}
        <SectionHeader
          icon="wallet-outline"
          title="Tabungan & Asuransi"
          color={Colors.success}
        />
        <Card style={styles.formCard}>
          <FormInput
            label="Tabungan untuk Persalinan"
            placeholder="Rencana biaya persalinan"
            value={formData.tabungan}
            onChangeText={(v) => updateField('tabungan', v)}
          />
          <FormInput
            label="Asuransi Kesehatan"
            placeholder="Contoh: BPJS, asuransi swasta, dll."
            value={formData.asuransi}
            onChangeText={(v) => updateField('asuransi', v)}
          />
        </Card>

        {/* Notes */}
        <SectionHeader
          icon="document-text-outline"
          title="Catatan Tambahan"
          color={Colors.textSecondary}
        />
        <Card style={styles.formCard}>
          <TextInput
            style={styles.notesInput}
            value={formData.notes}
            onChangeText={(v) => updateField('notes', v)}
            placeholder="Catatan tambahan tentang rencana persalinan..."
            placeholderTextColor={Colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>

        {/* Save Button */}
        <Button
          title="Simpan Data P4K"
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

// Sub-components

function SectionHeader({
  icon,
  title,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  color: string;
}) {
  return (
    <View style={sectionStyles.container}>
      <View style={[sectionStyles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={sectionStyles.title}>{title}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
});

function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric' | 'email-address';
}) {
  return (
    <View style={inputStyles.container}>
      <Text style={inputStyles.label}>{label}</Text>
      <TextInput
        style={[inputStyles.input, multiline && inputStyles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const inputStyles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  inputMultiline: {
    minHeight: 72,
    paddingTop: Spacing.sm,
  },
});

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
    flex: 1,
  },
  infoDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  formCard: {
    marginBottom: Spacing.md,
  },
  listItem: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: Spacing.sm,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  listItemTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    marginTop: Spacing.sm,
  },
  notesInput: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    minHeight: 100,
    lineHeight: 22,
  },
  saveButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  bottomPadding: {
    height: Spacing.huge,
  },
});

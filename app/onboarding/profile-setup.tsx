import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@fastshot/auth';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useApp } from '@/context/AppContext';
import { Phase, UserProfile } from '@/types';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  phaseConfig,
} from '@/constants/theme';

type BabyGender = 'laki-laki' | 'perempuan';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function ProfileSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phase, mode, profileId } = useLocalSearchParams<{
    phase: Phase;
    mode?: string;
    profileId?: string;
  }>();
  const { addProfile, updateProfile, profiles } = useApp();
  const { user } = useAuth();

  const isChangePhaseMode = mode === 'change-phase';
  const currentPhase: Phase = phase || 'hamil';
  const config = phaseConfig[currentPhase];

  // Find existing profile if in change-phase mode
  const existingProfile = isChangePhaseMode
    ? profiles.find((p) => p.id === profileId) ?? null
    : null;

  // Pre-fill name from auth user metadata if available
  const defaultName = existingProfile?.name ?? user?.user_metadata?.full_name ?? '';

  // Profile picture
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Basic profile fields — pre-fill from existing profile or auth data
  const [name, setName] = useState(defaultName);
  const [age, setAge] = useState(existingProfile?.age ? String(existingProfile.age) : '');
  const [weight, setWeight] = useState(
    existingProfile?.weight ? String(existingProfile.weight) : ''
  );
  const [height, setHeight] = useState(
    existingProfile?.height ? String(existingProfile.height) : ''
  );

  // Phase-specific fields
  const [hpht, setHpht] = useState<Date | null>(
    existingProfile?.hpht ? new Date(existingProfile.hpht) : null
  );
  const [showHphtPicker, setShowHphtPicker] = useState(false);
  const [babyDob, setBabyDob] = useState<Date | null>(
    existingProfile?.babyDob ? new Date(existingProfile.babyDob) : null
  );
  const [showBabyDobPicker, setShowBabyDobPicker] = useState(false);
  const [babyName, setBabyName] = useState(existingProfile?.babyName ?? '');
  const [babyGender, setBabyGender] = useState<BabyGender | null>(
    (existingProfile?.babyGender as BabyGender) ?? null
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-populate when existing profile loads (in case context wasn't ready yet)
  useEffect(() => {
    if (existingProfile && isChangePhaseMode) {
      setName(existingProfile.name);
      setAge(existingProfile.age ? String(existingProfile.age) : '');
      setWeight(existingProfile.weight ? String(existingProfile.weight) : '');
      setHeight(existingProfile.height ? String(existingProfile.height) : '');
      if (existingProfile.hpht) setHpht(new Date(existingProfile.hpht));
      if (existingProfile.babyDob) setBabyDob(new Date(existingProfile.babyDob));
      if (existingProfile.babyName) setBabyName(existingProfile.babyName);
      if (existingProfile.babyGender) setBabyGender(existingProfile.babyGender as BabyGender);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateForm = useCallback((): string | null => {
    if (!name.trim()) {
      return 'Nama tidak boleh kosong';
    }

    const ageNum = parseInt(age, 10);
    if (!age.trim() || isNaN(ageNum) || ageNum < 10 || ageNum > 70) {
      return 'Masukkan usia yang valid (10-70 tahun)';
    }

    const weightNum = parseFloat(weight);
    if (!weight.trim() || isNaN(weightNum) || weightNum < 20 || weightNum > 200) {
      return 'Masukkan berat badan yang valid (20-200 kg)';
    }

    const heightNum = parseFloat(height);
    if (!height.trim() || isNaN(heightNum) || heightNum < 100 || heightNum > 220) {
      return 'Masukkan tinggi badan yang valid (100-220 cm)';
    }

    if (currentPhase === 'hamil' && !hpht) {
      return 'Tanggal HPHT harus diisi';
    }

    if (currentPhase === 'pasca-melahirkan') {
      if (!babyDob) {
        return 'Tanggal lahir bayi harus diisi';
      }
      if (!babyName.trim()) {
        return 'Nama bayi tidak boleh kosong';
      }
      if (!babyGender) {
        return 'Jenis kelamin bayi harus dipilih';
      }
    }

    return null;
  }, [name, age, weight, height, currentPhase, hpht, babyDob, babyName, babyGender]);

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Data Belum Lengkap', error);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isChangePhaseMode && existingProfile) {
        // Update the existing profile with new phase + data
        const updates: Partial<UserProfile> = {
          name: name.trim(),
          phase: currentPhase,
          age: parseInt(age, 10),
          weight: parseFloat(weight),
          height: parseFloat(height),
          // Clear phase-specific fields first
          hpht: undefined,
          babyDob: undefined,
          babyName: undefined,
          babyGender: undefined,
        };

        if (currentPhase === 'hamil' && hpht) {
          updates.hpht = hpht.toISOString();
        }
        if (currentPhase === 'pasca-melahirkan') {
          if (babyDob) updates.babyDob = babyDob.toISOString();
          if (babyName.trim()) updates.babyName = babyName.trim();
          if (babyGender) updates.babyGender = babyGender;
        }

        await updateProfile(existingProfile.id, updates);

        Alert.alert(
          'Fase Berhasil Diubah',
          `Profil Anda telah diperbarui ke fase ${config.label}.`,
          [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        // Create new profile (normal onboarding flow)
        const now = new Date().toISOString();
        const profile: UserProfile = {
          id: generateId(),
          name: name.trim(),
          phase: currentPhase,
          age: parseInt(age, 10),
          weight: parseFloat(weight),
          height: parseFloat(height),
          createdAt: now,
          updatedAt: now,
        };

        if (currentPhase === 'hamil' && hpht) {
          profile.hpht = hpht.toISOString();
        }

        if (currentPhase === 'pasca-melahirkan') {
          if (babyDob) {
            profile.babyDob = babyDob.toISOString();
          }
          if (babyName.trim()) {
            profile.babyName = babyName.trim();
          }
          if (babyGender) {
            profile.babyGender = babyGender;
          }
        }

        await addProfile(profile);

        // Navigate to AI greeting instead of completing onboarding directly
        router.push({
          pathname: '/onboarding/ai-greeting',
          params: {
            profileName: name.trim(),
            phase: currentPhase,
            ...(currentPhase === 'hamil' && hpht ? { hpht: hpht.toISOString() } : {}),
            ...(currentPhase === 'pasca-melahirkan' && babyDob ? { babyDob: babyDob.toISOString() } : {}),
            ...(currentPhase === 'pasca-melahirkan' && babyName.trim() ? { babyName: babyName.trim() } : {}),
          },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan profil';
      Alert.alert('Gagal Menyimpan', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onHphtChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowHphtPicker(false);
    }
    if (selectedDate) {
      setHpht(selectedDate);
    }
  };

  const onBabyDobChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowBabyDobPicker(false);
    }
    if (selectedDate) {
      setBabyDob(selectedDate);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          {isChangePhaseMode && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={styles.stepLabel}>
            {isChangePhaseMode ? 'Ganti Fase' : 'Langkah 2 dari 3'}
          </Text>
          <Text style={styles.title}>
            {isChangePhaseMode ? 'Perbarui Data Profil' : 'Lengkapi Profil'}
          </Text>
          <View style={styles.phaseBadge}>
            <View style={[styles.phaseBadgeDot, { backgroundColor: config.color }]} />
            <Text style={styles.phaseBadgeText}>{config.label}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.formContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Picture */}
          {!isChangePhaseMode && (
            <View style={styles.profilePictureSection}>
              <TouchableOpacity
                style={styles.profilePictureContainer}
                onPress={async () => {
                  try {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ['images'],
                      allowsEditing: true,
                      aspect: [1, 1],
                      quality: 0.7,
                    });
                    if (!result.canceled && result.assets[0]) {
                      setProfilePicture(result.assets[0].uri);
                    }
                  } catch {
                    Alert.alert('Error', 'Gagal memilih foto');
                  }
                }}
                activeOpacity={0.7}
              >
                {profilePicture ? (
                  <Image
                    source={{ uri: profilePicture }}
                    style={styles.profilePictureImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.profilePicturePlaceholder, { backgroundColor: config.color + '20' }]}>
                    <Ionicons name="camera-outline" size={32} color={config.color} />
                  </View>
                )}
                <View style={[styles.profilePictureEditBadge, { backgroundColor: config.color }]}>
                  <Ionicons name="pencil" size={12} color={Colors.white} />
                </View>
              </TouchableOpacity>
              <Text style={styles.profilePictureLabel}>Foto Profil</Text>
              <Text style={styles.profilePictureHint}>Opsional - ketuk untuk menambahkan</Text>
            </View>
          )}

          {/* Basic Information */}
          <Card variant="outlined" style={styles.section}>
            <Text style={styles.sectionTitle}>Data Diri</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Usia (tahun)</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Contoh: 28"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="number-pad"
                maxLength={2}
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Berat Badan (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Contoh: 55"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="decimal-pad"
                  maxLength={5}
                  returnKeyType="next"
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Tinggi Badan (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="Contoh: 160"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={3}
                  returnKeyType="done"
                />
              </View>
            </View>
          </Card>

          {/* Phase-specific fields */}
          {currentPhase === 'hamil' && (
            <Card variant="outlined" style={styles.section}>
              <Text style={styles.sectionTitle}>Data Kehamilan</Text>

              <View style={styles.field}>
                <Text style={styles.label}>HPHT (Hari Pertama Haid Terakhir)</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowHphtPicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                  <Text style={[styles.dateText, !hpht && styles.dateTextPlaceholder]}>
                    {hpht ? formatDate(hpht) : 'Pilih tanggal HPHT'}
                  </Text>
                </TouchableOpacity>
                {showHphtPicker && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={hpht || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      maximumDate={new Date()}
                      minimumDate={new Date(Date.now() - 300 * 24 * 60 * 60 * 1000)}
                      onChange={onHphtChange}
                    />
                    {Platform.OS === 'ios' && (
                      <Button
                        title="Selesai"
                        variant="ghost"
                        size="sm"
                        onPress={() => setShowHphtPicker(false)}
                      />
                    )}
                  </View>
                )}
                <Text style={styles.helperText}>
                  Tanggal pertama haid terakhir Anda untuk menghitung usia kehamilan
                </Text>
              </View>
            </Card>
          )}

          {currentPhase === 'pasca-melahirkan' && (
            <Card variant="outlined" style={styles.section}>
              <Text style={styles.sectionTitle}>Data Bayi</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Nama Bayi</Text>
                <TextInput
                  style={styles.input}
                  value={babyName}
                  onChangeText={setBabyName}
                  placeholder="Masukkan nama bayi"
                  placeholderTextColor={Colors.textTertiary}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Jenis Kelamin</Text>
                <View style={styles.genderRow}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      babyGender === 'laki-laki' && styles.genderOptionActive,
                      babyGender === 'laki-laki' && { borderColor: Colors.secondary },
                    ]}
                    onPress={() => setBabyGender('laki-laki')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="male"
                      size={24}
                      color={babyGender === 'laki-laki' ? Colors.secondary : Colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.genderText,
                        babyGender === 'laki-laki' && {
                          color: Colors.secondary,
                          fontWeight: FontWeight.semibold,
                        },
                      ]}
                    >
                      Laki-laki
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      babyGender === 'perempuan' && styles.genderOptionActive,
                      babyGender === 'perempuan' && { borderColor: Colors.primary },
                    ]}
                    onPress={() => setBabyGender('perempuan')}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="female"
                      size={24}
                      color={babyGender === 'perempuan' ? Colors.primary : Colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.genderText,
                        babyGender === 'perempuan' && {
                          color: Colors.primary,
                          fontWeight: FontWeight.semibold,
                        },
                      ]}
                    >
                      Perempuan
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Tanggal Lahir Bayi</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowBabyDobPicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                  <Text style={[styles.dateText, !babyDob && styles.dateTextPlaceholder]}>
                    {babyDob ? formatDate(babyDob) : 'Pilih tanggal lahir bayi'}
                  </Text>
                </TouchableOpacity>
                {showBabyDobPicker && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={babyDob || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      maximumDate={new Date()}
                      minimumDate={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
                      onChange={onBabyDobChange}
                    />
                    {Platform.OS === 'ios' && (
                      <Button
                        title="Selesai"
                        variant="ghost"
                        size="sm"
                        onPress={() => setShowBabyDobPicker(false)}
                      />
                    )}
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Spacing at the bottom for the button */}
          <View style={{ height: Spacing.huge }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <Button
            title={isChangePhaseMode ? 'Simpan Perubahan' : 'Simpan & Mulai'}
            onPress={handleSubmit}
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
            icon="checkmark-circle"
            iconPosition="right"
            color={config.color}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    marginBottom: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  phaseBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  field: {
    gap: Spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  fieldHalf: {
    flex: 1,
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  dateInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  dateText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  dateTextPlaceholder: {
    color: Colors.textTertiary,
  },
  pickerContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    alignItems: 'center',
  },
  helperText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    lineHeight: 16,
  },
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surfaceSecondary,
  },
  genderOptionActive: {
    backgroundColor: Colors.white,
    borderWidth: 2,
  },
  genderText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  bottomBar: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  profilePictureImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  profilePicturePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
  },
  profilePictureEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profilePictureLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  profilePictureHint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});

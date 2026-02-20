// KIA Care - Profile & Settings Screen
import React, { useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, phaseConfig } from '@/constants/theme';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Phase, UserProfile } from '@/types';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    activeProfile,
    profiles,
    settings,
    updateSettings,
    deleteProfile,
    setActiveProfile,
    addProfile,
    resetApp,
  } = useApp();

  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfilePhase, setNewProfilePhase] = useState<Phase>('hamil');

  if (!activeProfile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Tidak ada profil aktif</Text>
      </View>
    );
  }

  const config = phaseConfig[activeProfile.phase];

  const handleSetPin = async () => {
    if (newPin.length !== 4) {
      Alert.alert('Error', 'PIN harus 4 digit');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Error', 'PIN tidak cocok');
      return;
    }
    try {
      await updateSettings({ pinEnabled: true, pin: newPin });
      setShowPinModal(false);
      setNewPin('');
      setConfirmPin('');
      Alert.alert('Berhasil', 'PIN berhasil diatur');
    } catch {
      Alert.alert('Error', 'Gagal mengatur PIN');
    }
  };

  const handleDisablePin = async () => {
    Alert.alert(
      'Nonaktifkan PIN',
      'Apakah Anda yakin ingin menonaktifkan PIN?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Nonaktifkan',
          style: 'destructive',
          onPress: async () => {
            await updateSettings({ pinEnabled: false, pin: undefined });
          },
        },
      ]
    );
  };

  const handleSwitchProfile = async (profileId: string) => {
    try {
      await setActiveProfile(profileId);
    } catch {
      Alert.alert('Error', 'Gagal mengganti profil');
    }
  };

  const handleDeleteProfile = (profile: UserProfile) => {
    if (profiles.length <= 1) {
      Alert.alert('Tidak Bisa Dihapus', 'Anda harus memiliki minimal 1 profil.');
      return;
    }
    Alert.alert(
      'Hapus Profil',
      `Apakah Anda yakin ingin menghapus profil "${profile.name}"? Semua data akan hilang.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => deleteProfile(profile.id),
        },
      ]
    );
  };

  const handleAddProfile = async () => {
    if (!newProfileName.trim()) {
      Alert.alert('Error', 'Nama profil harus diisi');
      return;
    }
    try {
      const profile: UserProfile = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: newProfileName.trim(),
        phase: newProfilePhase,
        age: 0,
        weight: 0,
        height: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addProfile(profile);
      await setActiveProfile(profile.id);
      setShowProfileModal(false);
      setNewProfileName('');
      Alert.alert('Berhasil', 'Profil baru berhasil ditambahkan');
    } catch {
      Alert.alert('Error', 'Gagal menambahkan profil');
    }
  };

  const handleChangePhase = () => {
    router.push({
      pathname: '/onboarding/phase-select',
      params: { mode: 'change-phase', profileId: activeProfile.id },
    });
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Data Aplikasi',
      'Tindakan ini akan menghapus SEMUA data kesehatan, profil, dan pengaturan Anda. Anda akan diarahkan kembali ke halaman awal untuk memulai ulang.\n\nTindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetApp();
              router.replace('/onboarding');
            } catch {
              Alert.alert('Error', 'Gagal mereset data. Silakan coba lagi.');
            }
          },
        },
      ]
    );
  };

  const handleRestartOnboarding = () => {
    Alert.alert(
      'Mulai Ulang Profil',
      'Ini akan menghapus semua data kesehatan dan profil Anda saat ini, lalu membawa Anda kembali ke halaman pengaturan awal untuk memilih fase dan mengisi data profil baru.\n\nLanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Mulai Ulang',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetApp();
              router.replace('/onboarding');
            } catch {
              Alert.alert('Error', 'Gagal mereset data. Silakan coba lagi.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <Card style={[styles.profileCard, { borderLeftColor: config.color, borderLeftWidth: 4 }]} variant="elevated">
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: config.color + '20' }]}>
              <Text style={[styles.avatarText, { color: config.color }]}>
                {activeProfile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{activeProfile.name}</Text>
              <View style={[styles.phaseBadge, { backgroundColor: config.color + '15' }]}>
                <Ionicons name={config.icon as any} size={14} color={config.color} />
                <Text style={[styles.phaseLabel, { color: config.color }]}>{config.label}</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            {activeProfile.age > 0 && (
              <View style={styles.stat}>
                <Text style={styles.statValue}>{activeProfile.age}</Text>
                <Text style={styles.statLabel}>Usia</Text>
              </View>
            )}
            {activeProfile.weight > 0 && (
              <View style={styles.stat}>
                <Text style={styles.statValue}>{activeProfile.weight}</Text>
                <Text style={styles.statLabel}>BB (kg)</Text>
              </View>
            )}
            {activeProfile.height > 0 && (
              <View style={styles.stat}>
                <Text style={styles.statValue}>{activeProfile.height}</Text>
                <Text style={styles.statLabel}>TB (cm)</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Multi-Profile Management */}
        <Text style={styles.sectionTitle}>Kelola Profil</Text>

        {profiles.map((profile) => {
          const pConfig = phaseConfig[profile.phase];
          const isActive = profile.id === activeProfile.id;
          return (
            <TouchableOpacity
              key={profile.id}
              activeOpacity={0.7}
              onPress={() => handleSwitchProfile(profile.id)}
              style={[
                styles.profileItem,
                isActive && { borderColor: pConfig.color, backgroundColor: pConfig.color + '08' },
              ]}
            >
              <View style={[styles.smallAvatar, { backgroundColor: pConfig.color + '20' }]}>
                <Text style={[styles.smallAvatarText, { color: pConfig.color }]}>
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileItemInfo}>
                <Text style={styles.profileItemName}>{profile.name}</Text>
                <Text style={[styles.profileItemPhase, { color: pConfig.color }]}>
                  {pConfig.label}
                </Text>
              </View>
              {isActive && (
                <View style={[styles.activeBadge, { backgroundColor: pConfig.color }]}>
                  <Text style={styles.activeBadgeText}>Aktif</Text>
                </View>
              )}
              {!isActive && (
                <TouchableOpacity
                  onPress={() => handleDeleteProfile(profile)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}

        <Button
          title="Tambah Profil Baru"
          onPress={() => setShowProfileModal(true)}
          variant="outline"
          icon="add-circle-outline"
          fullWidth
          style={{ marginTop: Spacing.sm }}
        />

        {/* Settings */}
        <Text style={styles.sectionTitle}>Pengaturan</Text>

        <Card style={styles.settingsCard}>
          <SettingsItem
            icon="swap-horizontal-outline"
            label="Ubah Fase"
            value={config.label}
            onPress={handleChangePhase}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="lock-closed-outline"
            label="Kunci PIN"
            value={settings.pinEnabled ? 'Aktif' : 'Nonaktif'}
            onPress={settings.pinEnabled ? handleDisablePin : () => setShowPinModal(true)}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="notifications-outline"
            label="Notifikasi"
            value={settings.notificationsEnabled ? 'Aktif' : 'Nonaktif'}
            onPress={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
          />
        </Card>

        {/* Data Management */}
        <Text style={styles.sectionTitle}>Data</Text>

        <Card style={styles.settingsCard}>
          <SettingsItem
            icon="cloud-offline-outline"
            label="Mode Offline"
            value="Data tersimpan lokal"
            showChevron={false}
          />
        </Card>

        {/* Restart / Reset Section */}
        <Text style={styles.sectionTitle}>Onboarding & Reset</Text>

        {/* Mulai Ulang Profil - prominent card */}
        <TouchableOpacity
          style={styles.restartCard}
          onPress={handleRestartOnboarding}
          activeOpacity={0.8}
        >
          <View style={styles.restartIconWrap}>
            <Ionicons name="refresh-circle-outline" size={32} color={Colors.primary} />
          </View>
          <View style={styles.restartTextWrap}>
            <Text style={styles.restartTitle}>Mulai Ulang Profil</Text>
            <Text style={styles.restartDesc}>
              Kembali ke halaman awal untuk memilih fase dan mengisi data profil baru
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <Card style={[styles.settingsCard, { marginTop: Spacing.sm }]}>
          <SettingsItem
            icon="trash-outline"
            label="Reset Semua Data"
            value="Hapus semua data & mulai dari awal"
            onPress={handleResetData}
            danger
          />
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>KIA Care</Text>
          <Text style={styles.appVersion}>Buku KIA Digital v1.0.0</Text>
          <Text style={styles.appDesc}>Pendamping kesehatan ibu & anak Indonesia</Text>
        </View>

        <View style={{ height: Spacing.massive }} />
      </ScrollView>

      {/* PIN Setup Modal */}
      <Modal visible={showPinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Atur PIN Baru</Text>
            <Text style={styles.modalSubtitle}>Masukkan 4 digit PIN</Text>

            <TextInput
              style={styles.pinInput}
              value={newPin}
              onChangeText={(t) => setNewPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="PIN"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholderTextColor={Colors.textTertiary}
            />
            <TextInput
              style={styles.pinInput}
              value={confirmPin}
              onChangeText={(t) => setConfirmPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="Konfirmasi PIN"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              placeholderTextColor={Colors.textTertiary}
            />

            <View style={styles.modalActions}>
              <Button
                title="Batal"
                variant="ghost"
                onPress={() => {
                  setShowPinModal(false);
                  setNewPin('');
                  setConfirmPin('');
                }}
              />
              <Button title="Simpan" onPress={handleSetPin} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Profile Modal */}
      <Modal visible={showProfileModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tambah Profil Baru</Text>

            <TextInput
              style={styles.modalInput}
              value={newProfileName}
              onChangeText={setNewProfileName}
              placeholder="Nama Profil"
              placeholderTextColor={Colors.textTertiary}
              autoCapitalize="words"
            />

            <Text style={styles.modalLabel}>Pilih Fase:</Text>
            <View style={styles.phaseOptions}>
              {(['pra-hamil', 'hamil', 'pasca-melahirkan'] as Phase[]).map((p) => {
                const pc = phaseConfig[p];
                const isSelected = newProfilePhase === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.phaseOption,
                      isSelected && { backgroundColor: pc.color + '15', borderColor: pc.color },
                    ]}
                    onPress={() => setNewProfilePhase(p)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={pc.icon as any} size={20} color={isSelected ? pc.color : Colors.textTertiary} />
                    <Text style={[styles.phaseOptionText, isSelected && { color: pc.color }]}>
                      {pc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Batal"
                variant="ghost"
                onPress={() => {
                  setShowProfileModal(false);
                  setNewProfileName('');
                }}
              />
              <Button title="Tambah" onPress={handleAddProfile} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SettingsItem({ icon, label, value, onPress, danger = false, showChevron = true }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={22}
        color={danger ? Colors.danger : Colors.textSecondary}
        style={styles.settingsIcon}
      />
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsLabel, danger && { color: Colors.danger }]}>{label}</Text>
        {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
      </View>
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.massive,
  },
  profileCard: {
    marginBottom: Spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  phaseLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xxl,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  smallAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  smallAvatarText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  profileItemInfo: {
    flex: 1,
  },
  profileItemName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  profileItemPhase: {
    fontSize: FontSize.xs,
  },
  activeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  activeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  settingsIcon: {
    marginRight: Spacing.md,
  },
  settingsContent: {
    flex: 1,
  },
  settingsLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  settingsValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.lg,
  },
  restartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  restartIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restartTextWrap: {
    flex: 1,
  },
  restartTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.primaryDark,
    marginBottom: 2,
  },
  restartDesc: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    lineHeight: 16,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  appName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  appVersion: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  appDesc: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  modalSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pinInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
    letterSpacing: 8,
  },
  modalLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  phaseOptions: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  phaseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  phaseOptionText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.huge,
  },
});

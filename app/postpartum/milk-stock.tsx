import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '@/constants/theme';
import { MILK_STORAGE_DURATION } from '@/constants/data';
import { getMilkStock, saveMilkStock } from '@/utils/storage';
import { formatDateID, getMilkExpirationDate } from '@/utils/date';
import { MilkStock } from '@/types';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

type StorageType = 'suhu-ruang' | 'kulkas' | 'freezer';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getStockStatus(
  expirationDate: string
): 'fresh' | 'expiring' | 'expired' {
  const now = new Date();
  const expiry = new Date(expirationDate);
  const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursLeft <= 0) return 'expired';
  if (hoursLeft <= 6) return 'expiring';
  return 'fresh';
}

function getStatusColor(status: 'fresh' | 'expiring' | 'expired'): string {
  switch (status) {
    case 'fresh':
      return Colors.success;
    case 'expiring':
      return Colors.warning;
    case 'expired':
      return Colors.danger;
  }
}

function getStatusLabel(status: 'fresh' | 'expiring' | 'expired'): string {
  switch (status) {
    case 'fresh':
      return 'Segar';
    case 'expiring':
      return 'Segera Habis';
    case 'expired':
      return 'Kedaluwarsa';
  }
}

function getTimeRemaining(expirationDate: string): string {
  const now = new Date();
  const expiry = new Date(expirationDate);
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) return 'Sudah kedaluwarsa';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months > 0) {
    const remainDays = days % 30;
    return remainDays > 0
      ? `${months} bulan ${remainDays} hari lagi`
      : `${months} bulan lagi`;
  }
  if (days > 0) {
    const remainHours = hours % 24;
    return remainHours > 0
      ? `${days} hari ${remainHours} jam lagi`
      : `${days} hari lagi`;
  }
  return `${hours} jam lagi`;
}

export default function MilkStockScreen() {
  const { activeProfile } = useApp();
  const [stocks, setStocks] = useState<MilkStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [formAmount, setFormAmount] = useState('');
  const [formStorage, setFormStorage] = useState<StorageType>('kulkas');
  const [isSaving, setIsSaving] = useState(false);

  const loadStocks = useCallback(async () => {
    if (!activeProfile) return;
    try {
      setIsLoading(true);
      const stored = await getMilkStock();
      const profileStocks = (stored || []).filter(
        (s: MilkStock) => s.profileId === activeProfile.id
      );
      setStocks(profileStocks);
    } catch (error) {
      console.error('Gagal memuat data stok ASI:', error);
      Alert.alert('Kesalahan', 'Gagal memuat data. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadStocks();
  }, [loadStocks]);

  const addStock = async () => {
    if (!activeProfile) return;

    const amount = parseInt(formAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Peringatan', 'Silakan masukkan jumlah ASI yang valid (ml).');
      return;
    }

    try {
      setIsSaving(true);
      const now = new Date().toISOString();
      const expirationDate = getMilkExpirationDate(now, formStorage);

      const newStock: MilkStock = {
        id: generateId(),
        profileId: activeProfile.id,
        dateStored: now,
        amount,
        storageType: formStorage,
        expirationDate: expirationDate.toISOString(),
        used: false,
      };

      const allStored = (await getMilkStock()) || [];
      const updatedAll = [...allStored, newStock];
      await saveMilkStock(updatedAll);

      setStocks((prev) => [...prev, newStock]);
      setFormAmount('');
      setFormStorage('kulkas');
      setShowAddModal(false);
    } catch (error) {
      console.error('Gagal menyimpan stok ASI:', error);
      Alert.alert('Kesalahan', 'Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const markAsUsed = async (stockId: string) => {
    if (!activeProfile) return;
    try {
      const updatedStocks = stocks.map((s) =>
        s.id === stockId
          ? { ...s, used: true, usedDate: new Date().toISOString() }
          : s
      );
      setStocks(updatedStocks);

      const allStored = (await getMilkStock()) || [];
      const updatedAll = allStored.map((s: MilkStock) =>
        s.id === stockId
          ? { ...s, used: true, usedDate: new Date().toISOString() }
          : s
      );
      await saveMilkStock(updatedAll);
    } catch (error) {
      console.error('Gagal memperbarui stok ASI:', error);
      Alert.alert('Kesalahan', 'Gagal memperbarui data. Silakan coba lagi.');
    }
  };

  const confirmMarkAsUsed = (stockId: string) => {
    Alert.alert(
      'Konfirmasi',
      'Tandai stok ASI ini sebagai sudah digunakan?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ya, Tandai', onPress: () => markAsUsed(stockId) },
      ]
    );
  };

  const activeStocks = stocks.filter((s) => !s.used);
  const usedStocks = stocks.filter((s) => s.used);

  const totalMl = activeStocks.reduce((sum, s) => sum + s.amount, 0);
  const freshCount = activeStocks.filter(
    (s) => getStockStatus(s.expirationDate) === 'fresh'
  ).length;
  const expiringCount = activeStocks.filter(
    (s) => getStockStatus(s.expirationDate) === 'expiring'
  ).length;
  const expiredCount = activeStocks.filter(
    (s) => getStockStatus(s.expirationDate) === 'expired'
  ).length;

  const sortedActiveStocks = [...activeStocks].sort((a, b) => {
    const statusOrder = { expired: 0, expiring: 1, fresh: 2 };
    const aStatus = getStockStatus(a.expirationDate);
    const bStatus = getStockStatus(b.expirationDate);
    return statusOrder[aStatus] - statusOrder[bStatus];
  });

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <Header title="Stok ASI" showBack />
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
        title="Stok ASI"
        showBack
        subtitle="Kelola penyimpanan ASI perah"
        rightAction={{
          icon: 'add-circle-outline',
          onPress: () => setShowAddModal(true),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Total Stok</Text>
            <Text style={styles.summaryAmount}>{totalMl} ml</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.statusCount}>{freshCount} Segar</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.statusCount}>{expiringCount} Segera Habis</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: Colors.danger }]} />
              <Text style={styles.statusCount}>{expiredCount} Kedaluwarsa</Text>
            </View>
          </View>
        </Card>

        {/* Active Stocks */}
        <Text style={styles.sectionTitle}>Stok Aktif</Text>

        {sortedActiveStocks.length === 0 ? (
          <EmptyState
            icon="flask-outline"
            title="Belum Ada Stok"
            description="Tambahkan stok ASI perah untuk memantau penyimpanan."
            actionTitle="Tambah Stok"
            onAction={() => setShowAddModal(true)}
            color={Colors.pascaMelahirkan}
          />
        ) : (
          sortedActiveStocks.map((stock) => {
            const status = getStockStatus(stock.expirationDate);
            const statusColor = getStatusColor(status);
            const storageInfo =
              MILK_STORAGE_DURATION[stock.storageType];

            return (
              <Card key={stock.id} style={styles.stockCard} variant="outlined">
                <View style={styles.stockRow}>
                  <View style={[styles.stockIconContainer, { backgroundColor: statusColor + '15' }]}>
                    <Ionicons
                      name={storageInfo.icon as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={statusColor}
                    />
                  </View>
                  <View style={styles.stockInfo}>
                    <View style={styles.stockTopRow}>
                      <Text style={styles.stockAmount}>{stock.amount} ml</Text>
                      <View style={[styles.stockStatusBadge, { backgroundColor: statusColor + '15' }]}>
                        <Text style={[styles.stockStatusText, { color: statusColor }]}>
                          {getStatusLabel(status)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.stockStorage}>{storageInfo.label}</Text>
                    <Text style={styles.stockDate}>
                      Disimpan: {formatDateID(stock.dateStored)}
                    </Text>
                    <Text style={[styles.stockExpiry, { color: statusColor }]}>
                      {getTimeRemaining(stock.expirationDate)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.useButton}
                  onPress={() => confirmMarkAsUsed(stock.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color={Colors.pascaMelahirkan} />
                  <Text style={styles.useButtonText}>Tandai Sudah Digunakan</Text>
                </TouchableOpacity>
              </Card>
            );
          })
        )}

        {/* Used Stocks */}
        {usedStocks.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>
              Riwayat Penggunaan ({usedStocks.length})
            </Text>
            {[...usedStocks].reverse().slice(0, 5).map((stock) => {
              const storageInfo =
                MILK_STORAGE_DURATION[stock.storageType];
              return (
                <Card
                  key={stock.id}
                  style={{ ...styles.stockCard, ...styles.usedStockCard }}
                  variant="outlined"
                >
                  <View style={styles.stockRow}>
                    <View style={[styles.stockIconContainer, { backgroundColor: Colors.surfaceSecondary }]}>
                      <Ionicons
                        name={storageInfo.icon as keyof typeof Ionicons.glyphMap}
                        size={24}
                        color={Colors.textTertiary}
                      />
                    </View>
                    <View style={styles.stockInfo}>
                      <Text style={[styles.stockAmount, { color: Colors.textSecondary }]}>
                        {stock.amount} ml
                      </Text>
                      <Text style={styles.stockStorage}>{storageInfo.label}</Text>
                      {stock.usedDate && (
                        <Text style={styles.stockDate}>
                          Digunakan: {formatDateID(stock.usedDate)}
                        </Text>
                      )}
                    </View>
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {/* Add Button (Bottom) */}
        <Button
          title="Tambah Stok ASI"
          onPress={() => setShowAddModal(true)}
          color={Colors.pascaMelahirkan}
          icon="add-circle-outline"
          fullWidth
          size="lg"
          style={styles.addButton}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add Stock Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Stok ASI</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <Text style={styles.inputLabel}>Jumlah ASI (ml)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              placeholder="Contoh: 120"
              placeholderTextColor={Colors.textTertiary}
              value={formAmount}
              onChangeText={setFormAmount}
            />

            {/* Storage Type Selection */}
            <Text style={styles.inputLabel}>Tempat Penyimpanan</Text>
            <View style={styles.storageOptions}>
              {(Object.keys(MILK_STORAGE_DURATION) as StorageType[]).map(
                (type) => {
                  const info = MILK_STORAGE_DURATION[type];
                  const isSelected = formStorage === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.storageOption,
                        isSelected && styles.storageOptionActive,
                      ]}
                      onPress={() => setFormStorage(type)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={info.icon as keyof typeof Ionicons.glyphMap}
                        size={28}
                        color={isSelected ? Colors.pascaMelahirkan : Colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.storageOptionLabel,
                          isSelected && styles.storageOptionLabelActive,
                        ]}
                      >
                        {info.label}
                      </Text>
                      <Text style={styles.storageOptionDuration}>
                        Maks {info.maxHours < 24
                          ? `${info.maxHours} jam`
                          : info.maxHours < 720
                          ? `${Math.floor(info.maxHours / 24)} hari`
                          : `${Math.floor(info.maxHours / 720)} bulan`}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>

            <Button
              title="Simpan"
              onPress={addStock}
              color={Colors.pascaMelahirkan}
              fullWidth
              size="lg"
              loading={isSaving}
              icon="checkmark-circle-outline"
            />
          </View>
        </View>
      </Modal>
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
  summaryCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.pascaMelahirkanBg,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  summaryAmount: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.pascaMelahirkan,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  stockCard: {
    marginBottom: Spacing.sm,
  },
  usedStockCard: {
    opacity: 0.7,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stockIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stockInfo: {
    flex: 1,
  },
  stockTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  stockAmount: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  stockStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  stockStatusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  stockStorage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  stockDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  stockExpiry: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginTop: 2,
  },
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.xs,
  },
  useButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.pascaMelahirkan,
  },
  addButton: {
    marginTop: Spacing.lg,
  },
  bottomSpacer: {
    height: Spacing.xxxl,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    paddingBottom: Spacing.massive,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  inputLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  storageOptions: {
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  storageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  storageOptionActive: {
    borderColor: Colors.pascaMelahirkan,
    backgroundColor: Colors.pascaMelahirkanBg,
  },
  storageOptionLabel: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  storageOptionLabelActive: {
    color: Colors.pascaMelahirkan,
  },
  storageOptionDuration: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});

// KIA Care - Jurnal Tab (Nutrition & Gallery)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { getNutritionLogs, saveNutritionLogs, getGalleryItems, saveGalleryItems } from '@/utils/storage';
import { getTodayISO } from '@/utils/date';
import type { NutritionLog, GalleryItem } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GALLERY_COL = 3;
const THUMB_SIZE = (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.sm * 2) / GALLERY_COL;

const ROSE_GOLD = '#B76E79';
const ROSE_GOLD_BG = '#F9EEF0';
const ROSE_GOLD_LIGHT = '#E8B4BC';

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatDateFull(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

const GALLERY_CATEGORIES = [
  { key: 'usg' as const, label: 'USG', icon: 'scan-outline', color: '#4D96FF' },
  { key: 'milestone' as const, label: 'Milestone', icon: 'star-outline', color: '#FFD93D' },
  { key: 'daily' as const, label: 'Harian', icon: 'sunny-outline', color: ROSE_GOLD },
  { key: 'other' as const, label: 'Lainnya', icon: 'images-outline', color: Colors.textSecondary },
];

export default function JurnalScreen() {
  const insets = useSafeAreaInsets();
  const { activeProfile } = useApp();
  const [activeTab, setActiveTab] = useState<'nutrisi' | 'galeri'>('nutrisi');

  if (!activeProfile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Jurnal</Text>
          <Text style={styles.headerSubtitle}>Catatan nutrisi & momen</Text>
        </View>
        <View style={styles.centerContent}>
          <Ionicons name="person-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.noProfileText}>Tidak ada profil aktif</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Jurnal</Text>
          <Text style={styles.headerSubtitle}>Catatan nutrisi & momen berharga</Text>
        </View>
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'nutrisi' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('nutrisi')}
        >
          <Ionicons name="nutrition" size={16} color={activeTab === 'nutrisi' ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.segmentText, activeTab === 'nutrisi' && styles.segmentTextActive]}>
            Nutrisi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'galeri' && { ...styles.segmentBtnActive, backgroundColor: ROSE_GOLD }]}
          onPress={() => setActiveTab('galeri')}
        >
          <Ionicons name="images" size={16} color={activeTab === 'galeri' ? Colors.white : Colors.textSecondary} />
          <Text style={[styles.segmentText, activeTab === 'galeri' && styles.segmentTextActive]}>
            Galeri
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'nutrisi' ? (
        <NutrisiTab profileId={activeProfile.id} />
      ) : (
        <GaleriTab profileId={activeProfile.id} babyName={activeProfile.babyName} />
      )}
    </View>
  );
}

// =========== NUTRISI TAB ===========
function NutrisiTab({ profileId }: { profileId: string }) {
  const today = getTodayISO();
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);

  // Form states
  const [activeForm, setActiveForm] = useState<'breastfeed' | 'bottle' | 'mpasi' | null>(null);
  const [bfSide, setBfSide] = useState<'left' | 'right'>('left');
  const [bfDuration, setBfDuration] = useState('');
  const [bottleAmount, setBottleAmount] = useState('');
  const [bottleType, setBottleType] = useState<'asi' | 'formula'>('asi');
  const [mpasiFood, setMpasiFood] = useState('');
  const [mpasiAllergy, setMpasiAllergy] = useState('');
  const [logNotes, setLogNotes] = useState('');

  const loadLogs = useCallback(async () => {
    try {
      const data = (await getNutritionLogs() as NutritionLog[] | null) || [];
      const filtered = data.filter((l) => l.profileId === profileId && l.date === selectedDate);
      setLogs(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading nutrition logs:', error);
    }
  }, [profileId, selectedDate]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const resetForm = () => {
    setBfDuration(''); setBfSide('left'); setBottleAmount('');
    setBottleType('asi'); setMpasiFood(''); setMpasiAllergy('');
    setLogNotes(''); setActiveForm(null);
  };

  const handleSave = async () => {
    if (!activeForm) return;
    if (activeForm === 'breastfeed' && !bfDuration) { Alert.alert('Perhatian', 'Masukkan durasi menyusui.'); return; }
    if (activeForm === 'bottle' && !bottleAmount) { Alert.alert('Perhatian', 'Masukkan jumlah susu.'); return; }
    if (activeForm === 'mpasi' && !mpasiFood) { Alert.alert('Perhatian', 'Masukkan nama makanan MPASI.'); return; }

    try {
      const allLogs = (await getNutritionLogs() as NutritionLog[] | null) || [];
      const newLog: NutritionLog = {
        id: Date.now().toString(),
        profileId,
        date: selectedDate,
        type: activeForm,
        ...(activeForm === 'breastfeed' && {
          breastfeedSide: bfSide,
          breastfeedDurationMinutes: parseInt(bfDuration) || 0,
        }),
        ...(activeForm === 'bottle' && {
          bottleAmountMl: parseInt(bottleAmount) || 0,
          bottleType,
        }),
        ...(activeForm === 'mpasi' && {
          mpasiFood,
          mpasiAllergyNote: mpasiAllergy || undefined,
        }),
        notes: logNotes || undefined,
        createdAt: new Date().toISOString(),
      };
      await saveNutritionLogs([...allLogs, newLog]);
      resetForm();
      loadLogs();
    } catch (error) {
      console.error('Error saving nutrition log:', error);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      const allLogs = (await getNutritionLogs() as NutritionLog[] | null) || [];
      await saveNutritionLogs(allLogs.filter((l) => l.id !== id));
      loadLogs();
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  // Date selector: today and yesterday
  const dates = [
    { label: 'Kemarin', value: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
    { label: 'Hari Ini', value: today },
  ];

  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Date Selector */}
      <View style={styles.dateSelectorRow}>
        {dates.map((d) => (
          <TouchableOpacity
            key={d.value}
            style={[styles.dateSelectorBtn, selectedDate === d.value && styles.dateSelectorBtnActive]}
            onPress={() => setSelectedDate(d.value)}
          >
            <Text style={[styles.dateSelectorText, selectedDate === d.value && styles.dateSelectorTextActive]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Log Buttons */}
      <Text style={styles.sectionTitle}>Catat Asupan</Text>
      <View style={styles.logButtonsRow}>
        <TouchableOpacity
          style={[styles.logTypeBtn, activeForm === 'breastfeed' && { borderColor: Colors.primary, backgroundColor: Colors.primaryBg }]}
          onPress={() => setActiveForm(activeForm === 'breastfeed' ? null : 'breastfeed')}
        >
          <Ionicons name="water" size={22} color={activeForm === 'breastfeed' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.logTypeBtnText, activeForm === 'breastfeed' && { color: Colors.primary }]}>Menyusui</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.logTypeBtn, activeForm === 'bottle' && { borderColor: Colors.secondary, backgroundColor: Colors.secondaryBg }]}
          onPress={() => setActiveForm(activeForm === 'bottle' ? null : 'bottle')}
        >
          <Ionicons name="beaker" size={22} color={activeForm === 'bottle' ? Colors.secondary : Colors.textSecondary} />
          <Text style={[styles.logTypeBtnText, activeForm === 'bottle' && { color: Colors.secondary }]}>Susu Botol</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.logTypeBtn, activeForm === 'mpasi' && { borderColor: Colors.accent, backgroundColor: Colors.accentBg }]}
          onPress={() => setActiveForm(activeForm === 'mpasi' ? null : 'mpasi')}
        >
          <Ionicons name="restaurant" size={22} color={activeForm === 'mpasi' ? Colors.accent : Colors.textSecondary} />
          <Text style={[styles.logTypeBtnText, activeForm === 'mpasi' && { color: Colors.accent }]}>MPASI</Text>
        </TouchableOpacity>
      </View>

      {/* Forms */}
      {activeForm === 'breastfeed' && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Log Menyusui</Text>
          <Text style={styles.fieldLabel}>Sisi Payudara</Text>
          <View style={styles.sideRow}>
            {(['left', 'right'] as const).map((side) => (
              <TouchableOpacity
                key={side}
                style={[styles.sidePicker, bfSide === side && { borderColor: Colors.primary, backgroundColor: Colors.primaryBg }]}
                onPress={() => setBfSide(side)}
              >
                <Ionicons name={side === 'left' ? 'arrow-back-circle' : 'arrow-forward-circle'} size={20} color={bfSide === side ? Colors.primary : Colors.textSecondary} />
                <Text style={[styles.sidePickerText, bfSide === side && { color: Colors.primary }]}>
                  {side === 'left' ? 'Kiri' : 'Kanan'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Durasi (menit)</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Masukkan durasi menyusui"
            placeholderTextColor={Colors.textTertiary}
            value={bfDuration}
            onChangeText={setBfDuration}
            keyboardType="number-pad"
          />
          <Text style={styles.fieldLabel}>Catatan (opsional)</Text>
          <TextInput style={styles.inputField} placeholder="Catatan tambahan..." placeholderTextColor={Colors.textTertiary} value={logNotes} onChangeText={setLogNotes} />
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}><Text style={styles.cancelBtnText}>Batal</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.primary }]} onPress={handleSave}><Text style={styles.saveBtnText}>Simpan</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {activeForm === 'bottle' && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Log Susu Botol</Text>
          <Text style={styles.fieldLabel}>Jenis Susu</Text>
          <View style={styles.sideRow}>
            {(['asi', 'formula'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.sidePicker, bottleType === type && { borderColor: Colors.secondary, backgroundColor: Colors.secondaryBg }]}
                onPress={() => setBottleType(type)}
              >
                <Text style={[styles.sidePickerText, bottleType === type && { color: Colors.secondary }]}>
                  {type === 'asi' ? 'ASI Perah' : 'Susu Formula'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Jumlah (ml)</Text>
          <TextInput style={styles.inputField} placeholder="Jumlah dalam ml" placeholderTextColor={Colors.textTertiary} value={bottleAmount} onChangeText={setBottleAmount} keyboardType="number-pad" />
          <Text style={styles.fieldLabel}>Catatan (opsional)</Text>
          <TextInput style={styles.inputField} placeholder="Catatan tambahan..." placeholderTextColor={Colors.textTertiary} value={logNotes} onChangeText={setLogNotes} />
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}><Text style={styles.cancelBtnText}>Batal</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.secondary }]} onPress={handleSave}><Text style={styles.saveBtnText}>Simpan</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {activeForm === 'mpasi' && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Log MPASI</Text>
          <Text style={styles.fieldLabel}>Nama Makanan</Text>
          <TextInput style={styles.inputField} placeholder="Cth: Bubur nasi + wortel + ayam" placeholderTextColor={Colors.textTertiary} value={mpasiFood} onChangeText={setMpasiFood} />
          <Text style={styles.fieldLabel}>Catatan Alergi</Text>
          <TextInput style={styles.inputField} placeholder="Reaksi alergi atau catatan khusus..." placeholderTextColor={Colors.textTertiary} value={mpasiAllergy} onChangeText={setMpasiAllergy} />
          <Text style={styles.fieldLabel}>Catatan Tambahan (opsional)</Text>
          <TextInput style={styles.inputField} placeholder="Porsi, reaksi bayi, dll..." placeholderTextColor={Colors.textTertiary} value={logNotes} onChangeText={setLogNotes} />
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}><Text style={styles.cancelBtnText}>Batal</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.accent }]} onPress={handleSave}><Text style={styles.saveBtnText}>Simpan</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {/* Today's logs */}
      <Text style={styles.sectionTitle}>Log {selectedDate === today ? 'Hari Ini' : 'Kemarin'}</Text>
      {logs.length === 0 ? (
        <View style={styles.emptyLogs}>
          <Ionicons name="restaurant-outline" size={36} color={Colors.textTertiary} />
          <Text style={styles.emptyLogsText}>Belum ada catatan untuk tanggal ini</Text>
        </View>
      ) : (
        logs.map((log) => <NutritionLogItem key={log.id} log={log} onDelete={() => handleDeleteLog(log.id)} />)
      )}
    </ScrollView>
  );
}

function NutritionLogItem({ log, onDelete }: { log: NutritionLog; onDelete: () => void }) {
  const getIcon = () => {
    if (log.type === 'breastfeed') return { icon: 'water', color: Colors.primary };
    if (log.type === 'bottle') return { icon: 'beaker', color: Colors.secondary };
    return { icon: 'restaurant', color: Colors.accent };
  };
  const { icon, color } = getIcon();

  const getTitle = () => {
    if (log.type === 'breastfeed') return `Menyusui - ${log.breastfeedSide === 'left' ? 'Kiri' : 'Kanan'}`;
    if (log.type === 'bottle') return `Susu Botol - ${log.bottleType === 'asi' ? 'ASI Perah' : 'Formula'}`;
    return `MPASI - ${log.mpasiFood}`;
  };

  const getDetail = () => {
    if (log.type === 'breastfeed') return `${log.breastfeedDurationMinutes} menit`;
    if (log.type === 'bottle') return `${log.bottleAmountMl} ml`;
    if (log.mpasiAllergyNote) return `⚠️ Alergi: ${log.mpasiAllergyNote}`;
    return '';
  };

  const time = new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.logItem}>
      <View style={[styles.logItemIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.logItemInfo}>
        <Text style={styles.logItemTitle}>{getTitle()}</Text>
        {getDetail() ? <Text style={styles.logItemDetail}>{getDetail()}</Text> : null}
        {log.notes ? <Text style={styles.logItemNotes}>{log.notes}</Text> : null}
        <Text style={styles.logItemTime}>{time}</Text>
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.logDeleteBtn}>
        <Ionicons name="trash-outline" size={16} color={Colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

// =========== GALERI TAB ===========
function GaleriTab({ profileId, babyName }: { profileId: string; babyName?: string }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [newCaption, setNewCaption] = useState('');
  const [newCategory, setNewCategory] = useState<GalleryItem['category']>('daily');
  const [newImageUri, setNewImageUri] = useState('');

  const loadItems = useCallback(async () => {
    try {
      const data = (await getGalleryItems() as GalleryItem[] | null) || [];
      const filtered = data
        .filter((i) => i.profileId === profileId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(filtered);
    } catch (error) {
      console.error('Error loading gallery:', error);
    }
  }, [profileId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Izin akses galeri diperlukan untuk menambah foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setNewImageUri(result.assets[0].uri);
      setShowAddModal(true);
    }
  };

  const handleSavePhoto = async () => {
    if (!newImageUri) return;
    try {
      const allItems = (await getGalleryItems() as GalleryItem[] | null) || [];
      const newItem: GalleryItem = {
        id: Date.now().toString(),
        profileId,
        date: getTodayISO(),
        imageUri: newImageUri,
        caption: newCaption,
        category: newCategory,
        createdAt: new Date().toISOString(),
      };
      await saveGalleryItems([...allItems, newItem]);
      setShowAddModal(false);
      setNewCaption('');
      setNewImageUri('');
      setNewCategory('daily');
      loadItems();
    } catch (error) {
      console.error('Error saving photo:', error);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Hapus Foto', 'Yakin ingin menghapus foto ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            const allItems = (await getGalleryItems() as GalleryItem[] | null) || [];
            await saveGalleryItems(allItems.filter((i) => i.id !== id));
            loadItems();
          } catch (error) {
            console.error('Error deleting photo:', error);
          }
        },
      },
    ]);
  };

  // Group by date for timeline view
  const groupedByDate = items.reduce<Record<string, GalleryItem[]>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  return (
    <View style={{ flex: 1 }}>
      {/* Gallery Header */}
      <View style={styles.galleryHeaderRow}>
        <Text style={styles.gallerySectionTitle}>
          {babyName ? `Momen ${babyName}` : 'Momen Spesial'}
        </Text>
        <View style={styles.galleryActions}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'grid' && { backgroundColor: ROSE_GOLD }]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons name="grid" size={16} color={viewMode === 'grid' ? Colors.white : Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'timeline' && { backgroundColor: ROSE_GOLD }]}
            onPress={() => setViewMode('timeline')}
          >
            <Ionicons name="list" size={16} color={viewMode === 'timeline' ? Colors.white : Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
            <Ionicons name="camera" size={16} color={Colors.white} />
            <Text style={styles.addPhotoBtnText}>Tambah</Text>
          </TouchableOpacity>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyGallery}>
          <View style={styles.emptyGalleryIcon}>
            <Ionicons name="images-outline" size={48} color={ROSE_GOLD} />
          </View>
          <Text style={styles.emptyGalleryTitle}>Belum Ada Foto</Text>
          <Text style={styles.emptyGallerySubtitle}>Abadikan momen spesial USG, milestone, dan hari-hari bersama si kecil</Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={pickImage}>
            <Ionicons name="camera" size={18} color={Colors.white} />
            <Text style={styles.emptyAddBtnText}>Tambah Foto Pertama</Text>
          </TouchableOpacity>
        </View>
      ) : viewMode === 'grid' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 120 }}>
          {/* Category filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryCatScroll}>
            {GALLERY_CATEGORIES.map((cat) => {
              const count = items.filter((i) => i.category === cat.key).length;
              return (
                <View key={cat.key} style={[styles.galleryCatBadge, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon as any} size={14} color={cat.color} />
                  <Text style={[styles.galleryCatText, { color: cat.color }]}>{cat.label} ({count})</Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Grid */}
          <View style={styles.photoGrid}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.photoThumb}
                onPress={() => setSelectedItem(item)}
                onLongPress={() => handleDelete(item.id)}
              >
                <Image source={{ uri: item.imageUri }} style={styles.photoThumbImg} resizeMode="cover" />
                <View style={styles.photoThumbOverlay}>
                  <Text style={styles.photoThumbCaption} numberOfLines={1}>{item.caption || '...'}</Text>
                </View>
                <View style={[styles.photoCatDot, { backgroundColor: GALLERY_CATEGORIES.find((c) => c.key === item.category)?.color || ROSE_GOLD }]} />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.galleryHint}>Tekan lama untuk menghapus foto</Text>
        </ScrollView>
      ) : (
        // Timeline view
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 120 }}>
          {Object.entries(groupedByDate).map(([date, dateItems]) => (
            <View key={date} style={styles.timelineGroup}>
              <View style={styles.timelineDateRow}>
                <View style={styles.timelineDot} />
                <Text style={styles.timelineDate}>{formatDateFull(date)}</Text>
              </View>
              <View style={styles.timelineItems}>
                {dateItems.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.timelineItem} onPress={() => setSelectedItem(item)} onLongPress={() => handleDelete(item.id)}>
                    <Image source={{ uri: item.imageUri }} style={styles.timelineImg} resizeMode="cover" />
                    <View style={styles.timelineInfo}>
                      <View style={styles.timelineCatBadge}>
                        <Text style={[styles.timelineCatText, { color: GALLERY_CATEGORIES.find((c) => c.key === item.category)?.color || ROSE_GOLD }]}>
                          {GALLERY_CATEGORIES.find((c) => c.key === item.category)?.label}
                        </Text>
                      </View>
                      <Text style={styles.timelineCaption}>{item.caption || 'Tanpa keterangan'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Photo Detail Modal */}
      {selectedItem && (
        <Modal visible={!!selectedItem} animationType="fade" onRequestClose={() => setSelectedItem(null)}>
          <View style={styles.photoModal}>
            <TouchableOpacity style={styles.photoModalClose} onPress={() => setSelectedItem(null)}>
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
            <Image source={{ uri: selectedItem.imageUri }} style={styles.photoModalImg} resizeMode="contain" />
            <View style={styles.photoModalInfo}>
              <Text style={styles.photoModalDate}>{formatDateFull(selectedItem.date)}</Text>
              <Text style={styles.photoModalCaption}>{selectedItem.caption || 'Tanpa keterangan'}</Text>
              <View style={[styles.photoModalCat, { backgroundColor: GALLERY_CATEGORIES.find((c) => c.key === selectedItem.category)?.color + '30' || ROSE_GOLD_BG }]}>
                <Text style={{ color: GALLERY_CATEGORIES.find((c) => c.key === selectedItem.category)?.color || ROSE_GOLD, fontSize: FontSize.xs, fontWeight: FontWeight.semibold }}>
                  {GALLERY_CATEGORIES.find((c) => c.key === selectedItem.category)?.label}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.photoModalDelete}
                onPress={() => { setSelectedItem(null); handleDelete(selectedItem.id); }}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                <Text style={{ color: Colors.danger, fontSize: FontSize.sm }}>Hapus Foto</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Add Photo Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.addPhotoModal}>
          <View style={styles.addPhotoModalHeader}>
            <Text style={styles.addPhotoModalTitle}>Tambah Foto</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: Spacing.xl }}>
            {newImageUri ? (
              <Image source={{ uri: newImageUri }} style={styles.addPhotoPreview} resizeMode="cover" />
            ) : null}
            <Text style={styles.fieldLabel}>Kategori</Text>
            <View style={styles.catPickerRow}>
              {GALLERY_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.catPickerOption, newCategory === cat.key && { borderColor: cat.color, backgroundColor: cat.color + '15' }]}
                  onPress={() => setNewCategory(cat.key)}
                >
                  <Ionicons name={cat.icon as any} size={18} color={newCategory === cat.key ? cat.color : Colors.textSecondary} />
                  <Text style={[styles.catPickerText, newCategory === cat.key && { color: cat.color }]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Keterangan</Text>
            <TextInput
              style={[styles.inputField, { marginBottom: Spacing.xl }]}
              placeholder="Ceritakan momen ini..."
              placeholderTextColor={Colors.textTertiary}
              value={newCaption}
              onChangeText={setNewCaption}
              multiline
            />
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: ROSE_GOLD }]}
              onPress={handleSavePhoto}
            >
              <Ionicons name="save-outline" size={18} color={Colors.white} />
              <Text style={styles.saveBtnText}>Simpan Foto</Text>
            </TouchableOpacity>
            <View style={{ height: Spacing.massive }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noProfileText: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.md },

  // Segmented control
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    gap: Spacing.xs,
  },
  segmentBtnActive: { backgroundColor: Colors.secondary },
  segmentText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  segmentTextActive: { color: Colors.white, fontWeight: FontWeight.semibold },

  tabContent: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },

  // Date selector
  dateSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dateSelectorBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateSelectorBtnActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondaryBg },
  dateSelectorText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  dateSelectorTextActive: { color: Colors.secondaryDark },

  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },

  // Log type buttons
  logButtonsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  logTypeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  logTypeBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary },

  // Form
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  formTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.md },
  sideRow: { flexDirection: 'row', gap: Spacing.sm },
  sidePicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    gap: Spacing.xs,
  },
  sidePickerText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  inputField: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  formButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: FontSize.md, color: Colors.textSecondary },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  saveBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },

  // Log items
  emptyLogs: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyLogsText: { fontSize: FontSize.sm, color: Colors.textTertiary, marginTop: Spacing.sm },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  logItemIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, flexShrink: 0 },
  logItemInfo: { flex: 1 },
  logItemTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  logItemDetail: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  logItemNotes: { fontSize: FontSize.xs, color: Colors.textTertiary, fontStyle: 'italic', marginTop: 2 },
  logItemTime: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 4 },
  logDeleteBtn: { padding: Spacing.xs },

  // Gallery
  galleryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  gallerySectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  galleryActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  viewToggleBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ROSE_GOLD,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  addPhotoBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.white },
  emptyGallery: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xxxl },
  emptyGalleryIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: ROSE_GOLD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyGalleryTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyGallerySubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ROSE_GOLD,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyAddBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.white },

  galleryCatScroll: { marginVertical: Spacing.md },
  galleryCatBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, marginRight: Spacing.sm, gap: Spacing.xs },
  galleryCatText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photoThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumbImg: { width: '100%', height: '100%' },
  photoThumbOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  photoThumbCaption: { fontSize: 9, color: Colors.white },
  photoCatDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4 },
  galleryHint: { fontSize: FontSize.xs, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.md },

  // Timeline
  timelineGroup: { marginBottom: Spacing.xl },
  timelineDateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: ROSE_GOLD },
  timelineDate: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  timelineItems: { paddingLeft: Spacing.md, borderLeftWidth: 2, borderLeftColor: ROSE_GOLD_LIGHT, marginLeft: 5 },
  timelineItem: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: Spacing.md, ...Shadow.sm },
  timelineImg: { width: 80, height: 80 },
  timelineInfo: { flex: 1, padding: Spacing.md, justifyContent: 'center' },
  timelineCatBadge: { marginBottom: 4 },
  timelineCatText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  timelineCaption: { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 18 },

  // Photo modal
  photoModal: { flex: 1, backgroundColor: '#000' },
  photoModalClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: Spacing.sm },
  photoModalImg: { flex: 1, width: '100%' },
  photoModalInfo: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    paddingBottom: 40,
    gap: Spacing.sm,
  },
  photoModalDate: { fontSize: FontSize.xs, color: Colors.textTertiary },
  photoModalCaption: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  photoModalCat: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  photoModalDelete: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },

  // Add photo modal
  addPhotoModal: { flex: 1, backgroundColor: Colors.background },
  addPhotoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  addPhotoModalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addPhotoPreview: { width: '100%', height: 220, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  catPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  catPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    gap: Spacing.xs,
  },
  catPickerText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
});

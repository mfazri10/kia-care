// KIA Care - Education Hub (Edukasi) with KB Module & AI Smart Summary
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { getPregnancyWeek } from '@/utils/date';
import { useTextGeneration } from '@fastshot/ai';
import educationData from '@/data/education.json';

const TEAL = Colors.secondary;
const TEAL_BG = Colors.secondaryBg;
const TEAL_DARK = Colors.secondaryDark;

interface ArticleData {
  id: string;
  phase: string;
  weekNumber?: number;
  title: string;
  summary: string;
  content: string;
  category: string;
}

// KB (Keluarga Berencana) Methods Data
const KB_METHODS = [
  {
    id: 'iud',
    name: 'IUD / Spiral',
    icon: 'shield-checkmark',
    color: '#4D96FF',
    effectiveness: '99%+',
    duration: '3-12 tahun',
    whenToStart: 'Segera pasca melahirkan (48 jam) atau 6 minggu PP',
    howItWorks: 'Mencegah fertilisasi dan implantasi',
    sideEffects: 'Kram, pendarahan tidak teratur (awal)',
    whoSuitable: 'Ibu yang sudah punya anak, tidak ingin hamil 1-5 tahun',
    hormonal: false,
    longTerm: true,
  },
  {
    id: 'suntik',
    name: 'Suntik',
    icon: 'medkit',
    color: '#FF8C69',
    effectiveness: '96-99%',
    duration: '1 atau 3 bulan',
    whenToStart: '6 minggu pasca melahirkan (menyusui)',
    howItWorks: 'Progestogen menekan ovulasi',
    sideEffects: 'Siklus haid tidak teratur, peningkatan berat badan',
    whoSuitable: 'Ibu menyusui, tidak mau rutin minum pil',
    hormonal: true,
    longTerm: false,
  },
  {
    id: 'implan',
    name: 'Implan / Susuk',
    icon: 'fitness',
    color: '#A78BDA',
    effectiveness: '99%+',
    duration: '3 tahun',
    whenToStart: '6 minggu pasca melahirkan',
    howItWorks: 'Progestogen lepas lambat menekan ovulasi',
    sideEffects: 'Haid tidak teratur, flek',
    whoSuitable: 'Ibu yang ingin kontrasepsi jangka panjang tanpa suntik rutin',
    hormonal: true,
    longTerm: true,
  },
  {
    id: 'pil',
    name: 'Pil KB',
    icon: 'medical',
    color: '#6BCB77',
    effectiveness: '91-99%',
    duration: 'Diminum setiap hari',
    whenToStart: '6 minggu PP (menyusui: progesteron only)',
    howItWorks: 'Menekan ovulasi, mengentalkan lendir servik',
    sideEffects: 'Mual, sakit kepala (awal), perlu konsistensi',
    whoSuitable: 'Ibu yang disiplin minum obat setiap hari',
    hormonal: true,
    longTerm: false,
  },
  {
    id: 'kondom',
    name: 'Kondom',
    icon: 'shield-outline',
    color: '#FFD93D',
    effectiveness: '85-98%',
    duration: 'Sekali pakai',
    whenToStart: 'Kapan saja',
    howItWorks: 'Menghalangi sperma secara mekanis',
    sideEffects: 'Tidak ada efek hormonal',
    whoSuitable: 'Pasangan yang butuh perlindungan IMS/HIV',
    hormonal: false,
    longTerm: false,
  },
  {
    id: 'mow',
    name: 'Sterilisasi (MOW)',
    icon: 'cut',
    color: '#E8919B',
    effectiveness: '99.9%+',
    duration: 'Permanen',
    whenToStart: 'Sesudah melahirkan (dalam 48 jam)',
    howItWorks: 'Pemotongan/pengikatan tuba fallopi',
    sideEffects: 'Minimal (bedah minor)',
    whoSuitable: 'Ibu yang sudah tidak ingin punya anak lagi',
    hormonal: false,
    longTerm: true,
  },
];

const EDUCATION_PHASES = [
  { key: 'hamil', label: 'Hamil', icon: 'body-outline' },
  { key: 'pasca-melahirkan', label: 'Pasca Melahirkan', icon: 'happy-outline' },
  { key: 'pra-hamil', label: 'Pra Hamil', icon: 'heart-outline' },
];

const MAIN_TABS = [
  { key: 'artikel', label: 'Artikel', icon: 'book-outline' },
  { key: 'kb', label: 'KB', icon: 'people-outline' },
];

export default function EducationScreen() {
  const { activeProfile } = useApp();
  const router = useRouter();
  const [activeMainTab, setActiveMainTab] = useState<'artikel' | 'kb'>('artikel');
  const [selectedPhase, setSelectedPhase] = useState<string>(activeProfile?.phase || 'hamil');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKbMethod, setSelectedKbMethod] = useState<typeof KB_METHODS[0] | null>(null);

  // AI Smart Summary state
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [summaryArticle, setSummaryArticle] = useState<ArticleData | null>(null);
  const [summaryText, setSummaryText] = useState('');
  const { generateText, isLoading: aiLoading } = useTextGeneration({
    onError: (err) => console.error('AI error:', err),
  });

  const pregnancyWeek = useMemo(() => {
    if (selectedPhase === 'hamil' && activeProfile?.hpht) {
      return getPregnancyWeek(activeProfile.hpht);
    }
    return 0;
  }, [selectedPhase, activeProfile?.hpht]);

  const categories = useMemo(() => {
    const articles = (educationData as ArticleData[]).filter((a) => a.phase === selectedPhase);
    const cats = new Set(articles.map((a) => a.category));
    return ['Semua', ...Array.from(cats)];
  }, [selectedPhase]);

  // Reset category when phase changes
  const handlePhaseChange = (phase: string) => {
    setSelectedPhase(phase);
    setSelectedCategory('Semua');
    setSearchQuery('');
  };

  const filteredArticles = useMemo(() => {
    let articles = (educationData as ArticleData[]).filter((a) => a.phase === selectedPhase);
    if (selectedCategory !== 'Semua') articles = articles.filter((a) => a.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      articles = articles.filter((a) =>
        a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
      );
    }
    if (selectedPhase === 'hamil' && pregnancyWeek > 0) {
      articles.sort((a, b) => {
        const aW = a.weekNumber ?? Infinity;
        const bW = b.weekNumber ?? Infinity;
        return Math.abs(aW - pregnancyWeek) - Math.abs(bW - pregnancyWeek);
      });
    }
    return articles;
  }, [selectedPhase, selectedCategory, searchQuery, pregnancyWeek]);

  const handleAISummary = useCallback(async (article: ArticleData) => {
    setSummaryArticle(article);
    setSummaryText('');
    setSummaryModalVisible(true);

    const prompt = `Buat 3 poin ringkasan singkat dari artikel kesehatan ibu dan anak berikut. Format sebagai:
• Poin 1
• Poin 2
• Poin 3

Judul: "${article.title}"
Konten: ${article.content}

Berikan ringkasan dalam Bahasa Indonesia yang mudah dipahami ibu hamil/menyusui. Setiap poin maksimal 2 kalimat.`;

    const result = await generateText(prompt);
    if (result) setSummaryText(result);
  }, [generateText]);

  const handleOpenArticle = useCallback((articleId: string) => {
    router.push(`/education/${articleId}`);
  }, [router]);

  return (
    <View style={styles.container}>
      <Header
        title="Edukasi"
        subtitle="Pengetahuan kesehatan ibu & anak"
      />

      {/* Main Tabs: Artikel | KB */}
      <View style={styles.mainTabsRow}>
        {MAIN_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.mainTab, activeMainTab === tab.key && styles.mainTabActive]}
            onPress={() => setActiveMainTab(tab.key as any)}
          >
            <Ionicons name={tab.icon as any} size={16} color={activeMainTab === tab.key ? TEAL : Colors.textSecondary} />
            <Text style={[styles.mainTabText, activeMainTab === tab.key && styles.mainTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeMainTab === 'artikel' ? (
        <>
          {/* Phase selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.phaseTabsRow}
          >
            {EDUCATION_PHASES.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.phaseTab, selectedPhase === p.key && { backgroundColor: TEAL }]}
                onPress={() => handlePhaseChange(p.key)}
              >
                <Ionicons name={p.icon as any} size={14} color={selectedPhase === p.key ? Colors.white : Colors.textSecondary} />
                <Text style={[styles.phaseTabText, selectedPhase === p.key && { color: Colors.white }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search-outline" size={18} color={Colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari artikel..."
                placeholderTextColor={Colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && { backgroundColor: TEAL }]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryChipText, selectedCategory === cat && { color: Colors.white }]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Articles */}
          <ScrollView
            style={styles.articlesList}
            contentContainerStyle={styles.articlesContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedPhase === 'hamil' && pregnancyWeek > 0 && !searchQuery && selectedCategory === 'Semua' && (
              <View style={[styles.weekBanner, { backgroundColor: TEAL_BG }]}>
                <Ionicons name="calendar" size={14} color={TEAL} />
                <Text style={[styles.weekBannerText, { color: TEAL_DARK }]}>
                  Minggu ke-{pregnancyWeek} — artikel relevan ditampilkan pertama
                </Text>
              </View>
            )}

            <Text style={styles.articleCount}>{filteredArticles.length} artikel</Text>

            {filteredArticles.length === 0 ? (
              <EmptyState
                icon="document-text-outline"
                title="Tidak ada artikel"
                description={searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : 'Belum ada artikel untuk kategori ini.'}
                actionTitle={searchQuery ? 'Hapus Pencarian' : undefined}
                onAction={searchQuery ? () => setSearchQuery('') : undefined}
                color={TEAL}
              />
            ) : (
              filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onPress={() => handleOpenArticle(article.id)}
                  onAISummary={() => handleAISummary(article)}
                  phaseColor={TEAL}
                  pregnancyWeek={pregnancyWeek}
                  selectedPhase={selectedPhase}
                />
              ))
            )}
            <View style={{ height: Spacing.massive }} />
          </ScrollView>
        </>
      ) : (
        <KBScreen selectedMethod={selectedKbMethod} onSelectMethod={setSelectedKbMethod} />
      )}

      {/* AI Summary Modal */}
      <Modal visible={summaryModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSummaryModalVisible(false)}>
        <View style={styles.summaryModal}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryAiIcon}>
              <Ionicons name="sparkles" size={20} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle}>Ringkasan AI</Text>
              <Text style={styles.summarySubtitle} numberOfLines={1}>{summaryArticle?.title}</Text>
            </View>
            <TouchableOpacity onPress={() => setSummaryModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.summaryContent}>
            {aiLoading ? (
              <View style={styles.summaryLoading}>
                <ActivityIndicator size="large" color={TEAL} />
                <Text style={styles.summaryLoadingText}>Sedang membuat ringkasan...</Text>
              </View>
            ) : summaryText ? (
              <View style={styles.summaryPoints}>
                <Text style={styles.summaryText}>{summaryText}</Text>
                <TouchableOpacity
                  style={styles.readFullButton}
                  onPress={() => {
                    setSummaryModalVisible(false);
                    if (summaryArticle) handleOpenArticle(summaryArticle.id);
                  }}
                >
                  <Text style={styles.readFullText}>Baca Artikel Lengkap</Text>
                  <Ionicons name="arrow-forward" size={16} color={TEAL} />
                </TouchableOpacity>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// Article Card
function ArticleCard({ article, onPress, onAISummary, phaseColor, pregnancyWeek, selectedPhase }: {
  article: ArticleData;
  onPress: () => void;
  onAISummary: () => void;
  phaseColor: string;
  pregnancyWeek: number;
  selectedPhase: string;
}) {
  const isRelevant = selectedPhase === 'hamil' && article.weekNumber !== undefined && Math.abs(article.weekNumber - pregnancyWeek) <= 2;

  return (
    <Card style={isRelevant ? { ...styles.articleCard, borderLeftWidth: 3, borderLeftColor: phaseColor } : styles.articleCard} onPress={onPress}>
      <View style={styles.articleBadgesRow}>
        <View style={[styles.catBadge, { backgroundColor: phaseColor + '15' }]}>
          <Text style={[styles.catBadgeText, { color: phaseColor }]}>{article.category}</Text>
        </View>
        {article.weekNumber !== undefined && (
          <View style={[styles.catBadge, { backgroundColor: Colors.accentBg }]}>
            <Text style={[styles.catBadgeText, { color: Colors.accentDark }]}>Minggu ke-{article.weekNumber}</Text>
          </View>
        )}
      </View>
      <Text style={styles.articleTitle}>{article.title}</Text>
      <Text style={styles.articleSummary} numberOfLines={2}>{article.summary}</Text>
      <View style={styles.articleFooter}>
        <TouchableOpacity
          style={styles.aiSummaryBtn}
          onPress={(e) => { e.stopPropagation(); onAISummary(); }}
        >
          <Ionicons name="sparkles" size={14} color={TEAL} />
          <Text style={styles.aiSummaryBtnText}>Ringkasan AI</Text>
        </TouchableOpacity>
        <View style={styles.readMoreRow}>
          <Text style={[styles.readMoreText, { color: phaseColor }]}>Selengkapnya</Text>
          <Ionicons name="arrow-forward" size={14} color={phaseColor} />
        </View>
      </View>
    </Card>
  );
}

// KB Screen
function KBScreen({ selectedMethod, onSelectMethod }: {
  selectedMethod: typeof KB_METHODS[0] | null;
  onSelectMethod: (m: typeof KB_METHODS[0] | null) => void;
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.kbContent}>
      <View style={styles.kbHeader}>
        <Text style={styles.kbTitle}>Metode Kontrasepsi</Text>
        <Text style={styles.kbSubtitle}>Bandingkan pilihan KB yang tepat untuk Anda</Text>
      </View>

      {/* Method Cards */}
      {KB_METHODS.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[styles.kbMethodCard, selectedMethod?.id === method.id && { borderColor: method.color, borderWidth: 2 }]}
          onPress={() => onSelectMethod(selectedMethod?.id === method.id ? null : method)}
          activeOpacity={0.8}
        >
          <View style={styles.kbMethodHeader}>
            <View style={[styles.kbMethodIcon, { backgroundColor: method.color + '20' }]}>
              <Ionicons name={method.icon as any} size={24} color={method.color} />
            </View>
            <View style={styles.kbMethodInfo}>
              <Text style={styles.kbMethodName}>{method.name}</Text>
              <View style={styles.kbBadgesRow}>
                <View style={[styles.kbBadge, { backgroundColor: method.color + '15' }]}>
                  <Text style={[styles.kbBadgeText, { color: method.color }]}>Efektivitas: {method.effectiveness}</Text>
                </View>
                {method.longTerm && (
                  <View style={[styles.kbBadge, { backgroundColor: Colors.successBg }]}>
                    <Text style={[styles.kbBadgeText, { color: Colors.success }]}>Jangka Panjang</Text>
                  </View>
                )}
                {method.hormonal && (
                  <View style={[styles.kbBadge, { backgroundColor: Colors.warningBg }]}>
                    <Text style={[styles.kbBadgeText, { color: Colors.warning }]}>Hormonal</Text>
                  </View>
                )}
              </View>
            </View>
            <Ionicons
              name={selectedMethod?.id === method.id ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.textSecondary}
            />
          </View>

          {selectedMethod?.id === method.id && (
            <View style={styles.kbMethodDetails}>
              <View style={styles.kbDivider} />
              <KBDetailRow icon="time-outline" label="Durasi" value={method.duration} />
              <KBDetailRow icon="calendar-outline" label="Kapan Mulai" value={method.whenToStart} />
              <KBDetailRow icon="information-circle-outline" label="Cara Kerja" value={method.howItWorks} />
              <KBDetailRow icon="alert-circle-outline" label="Efek Samping" value={method.sideEffects} />
              <KBDetailRow icon="person-outline" label="Cocok untuk" value={method.whoSuitable} />
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* Comparison Table */}
      <Text style={styles.comparisonTitle}>Tabel Perbandingan</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={styles.comparisonTable}>
          {/* Header */}
          <View style={[styles.compRow, styles.compHeaderRow]}>
            <Text style={[styles.compCell, styles.compHeaderCell, styles.compFirstCol]}>Metode</Text>
            <Text style={[styles.compCell, styles.compHeaderCell]}>Efektivitas</Text>
            <Text style={[styles.compCell, styles.compHeaderCell]}>Hormonal</Text>
            <Text style={[styles.compCell, styles.compHeaderCell]}>Jangka Panjang</Text>
          </View>
          {KB_METHODS.map((m) => (
            <View key={m.id} style={styles.compRow}>
              <Text style={[styles.compCell, styles.compFirstCol, { color: m.color, fontWeight: FontWeight.semibold }]}>{m.name}</Text>
              <Text style={[styles.compCell, { color: Colors.success }]}>{m.effectiveness}</Text>
              <Text style={styles.compCell}>{m.hormonal ? '✓' : '✗'}</Text>
              <Text style={styles.compCell}>{m.longTerm ? '✓' : '✗'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.kbDisclaimer}>
        <Ionicons name="information-circle-outline" size={16} color={TEAL} />
        <Text style={styles.kbDisclaimerText}>
          Konsultasikan pilihan KB dengan bidan atau dokter Anda untuk mendapatkan saran yang sesuai kondisi kesehatan.
        </Text>
      </View>

      <View style={{ height: Spacing.massive }} />
    </ScrollView>
  );
}

function KBDetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.kbDetailRow}>
      <Ionicons name={icon as any} size={16} color={TEAL} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.kbDetailLabel}>{label}</Text>
        <Text style={styles.kbDetailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Main tabs
  mainTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    backgroundColor: Colors.background,
  },
  mainTabActive: { backgroundColor: TEAL_BG },
  mainTabText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  mainTabTextActive: { color: TEAL, fontWeight: FontWeight.semibold },

  // Phase tabs
  phaseTabsRow: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, gap: Spacing.sm },
  phaseTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
    gap: Spacing.xs,
  },
  phaseTabText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },

  // Search
  searchContainer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },

  // Categories
  categoryRow: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm, gap: Spacing.sm },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  categoryChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },

  // Articles
  articlesList: { flex: 1 },
  articlesContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  weekBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  weekBannerText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  articleCount: { fontSize: FontSize.xs, color: Colors.textTertiary, marginBottom: Spacing.md },
  articleCard: { marginBottom: Spacing.md },
  articleBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  catBadge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
  catBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  articleTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  articleSummary: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.sm },
  articleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiSummaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_BG,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  aiSummaryBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: TEAL },
  readMoreRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  readMoreText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  // AI Summary Modal
  summaryModal: { flex: 1, backgroundColor: Colors.background },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  summaryAiIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  summarySubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary },
  summaryContent: { flex: 1, padding: Spacing.xl },
  summaryLoading: { alignItems: 'center', marginTop: Spacing.xxxl, gap: Spacing.md },
  summaryLoadingText: { fontSize: FontSize.md, color: Colors.textSecondary },
  summaryPoints: { gap: Spacing.md },
  summaryText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 26,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadow.sm,
  },
  readFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: TEAL,
  },
  readFullText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: TEAL },

  // KB Screen
  kbContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  kbHeader: { marginBottom: Spacing.xl },
  kbTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  kbSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  kbMethodCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  kbMethodHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  kbMethodIcon: { width: 48, height: 48, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  kbMethodInfo: { flex: 1 },
  kbMethodName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 4 },
  kbBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  kbBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  kbBadgeText: { fontSize: 10, fontWeight: FontWeight.semibold },
  kbMethodDetails: { marginTop: Spacing.md },
  kbDivider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  kbDetailRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  kbDetailLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: TEAL },
  kbDetailValue: { fontSize: FontSize.sm, color: Colors.textPrimary, lineHeight: 20 },
  comparisonTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.xl },
  comparisonTable: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  compRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  compHeaderRow: { backgroundColor: TEAL_BG },
  compCell: {
    width: 120,
    padding: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  compHeaderCell: { fontWeight: FontWeight.bold, color: TEAL_DARK },
  compFirstCol: { width: 140, textAlign: 'left' },
  kbDisclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: TEAL_BG,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  kbDisclaimerText: { flex: 1, fontSize: FontSize.xs, color: TEAL_DARK, lineHeight: 18 },
});

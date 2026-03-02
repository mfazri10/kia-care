// KIA Care - Education Article Detail Screen
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, phaseConfig } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import educationData from '@/data/education.json';
import type { Phase } from '@/types';

interface ArticleData {
  id: string;
  phase: string;
  weekNumber?: number;
  title: string;
  summary: string;
  content: string;
  category: string;
}

function getPhaseBadgeLabel(phase: string): string {
  switch (phase) {
    case 'pra-hamil':
      return 'Pra Hamil';
    case 'hamil':
      return 'Hamil';
    case 'pasca-melahirkan':
      return 'Pasca Melahirkan';
    default:
      return '';
  }
}

function getCategoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case 'Nutrisi':
      return 'nutrition-outline';
    case 'Kesuburan':
      return 'flower-outline';
    case 'Pemeriksaan':
      return 'medkit-outline';
    case 'Gaya Hidup':
      return 'fitness-outline';
    case 'Imunisasi':
      return 'shield-checkmark-outline';
    case 'Perkembangan Janin':
      return 'body-outline';
    case 'Suplemen':
      return 'medical-outline';
    case 'Persalinan':
      return 'heart-outline';
    case 'ASI':
      return 'water-outline';
    case 'Perawatan Bayi':
      return 'happy-outline';
    case 'Kesehatan Mental':
      return 'heart-half-outline';
    case 'Pemulihan':
      return 'pulse-outline';
    case 'Tumbuh Kembang':
      return 'trending-up-outline';
    default:
      return 'document-text-outline';
  }
}

export default function ArticleDetailScreen() {
  const { articleId } = useLocalSearchParams<{ articleId: string }>();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { activeProfile } = useApp();

  const article = useMemo(() => {
    return (educationData as ArticleData[]).find((a) => a.id === articleId) ?? null;
  }, [articleId]);

  const phaseColor = useMemo(() => {
    if (!article) return Colors.primary;
    const phase = article.phase as Phase;
    return phaseConfig[phase]?.color ?? Colors.primary;
  }, [article]);

  const phaseBgColor = useMemo(() => {
    if (!article) return Colors.primaryBg;
    const phase = article.phase as Phase;
    return phaseConfig[phase]?.bgColor ?? Colors.primaryBg;
  }, [article]);

  if (!article) {
    return (
      <View style={styles.container}>
        <Header title="Artikel" showBack />
        <View style={styles.centerContent}>
          <EmptyState
            icon="document-text-outline"
            title="Artikel tidak ditemukan"
            description="Artikel yang Anda cari tidak tersedia atau telah dihapus."
            actionTitle="Kembali"
            onAction={() => router.back()}
            color={Colors.textTertiary}
          />
        </View>
      </View>
    );
  }

  const paragraphs = article.content.split('\n\n');

  return (
    <View style={styles.container}>
      <Header
        title="Artikel"
        showBack
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Article Header */}
        <View style={[styles.articleHeader, { backgroundColor: phaseBgColor }]}>
          <View style={styles.badgesRow}>
            <View style={[styles.phaseBadge, { backgroundColor: phaseColor + '20' }]}>
              <Text style={[styles.phaseBadgeText, { color: phaseColor }]}>
                {getPhaseBadgeLabel(article.phase)}
              </Text>
            </View>
            <View style={[styles.categoryBadge, { backgroundColor: phaseColor + '15' }]}>
              <Ionicons name={getCategoryIcon(article.category)} size={12} color={phaseColor} />
              <Text style={[styles.categoryBadgeText, { color: phaseColor }]}>
                {article.category}
              </Text>
            </View>
            {article.weekNumber !== undefined && (
              <View style={[styles.weekBadge, { backgroundColor: Colors.accentBg }]}>
                <Ionicons name="calendar-outline" size={12} color={Colors.accentDark} />
                <Text style={[styles.weekBadgeText, { color: Colors.accentDark }]}>
                  Minggu ke-{article.weekNumber}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.articleTitle}>{article.title}</Text>
          <Text style={styles.articleSummary}>{article.summary}</Text>
        </View>

        {/* Article Content */}
        <View style={styles.contentContainer}>
          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={phaseColor} />
            <Text style={[styles.infoTitle, { color: phaseColor }]}>Informasi Penting</Text>
          </View>
          <Text style={styles.infoText}>
            Artikel ini bersifat informatif dan bukan pengganti konsultasi medis.
            Selalu konsultasikan dengan dokter atau bidan Anda untuk penanganan yang
            sesuai dengan kondisi kesehatan Anda.
          </Text>
        </Card>

        {/* Related articles nudge */}
        <Card style={styles.relatedCard} onPress={() => router.back()}>
          <View style={styles.relatedRow}>
            <View style={[styles.relatedIcon, { backgroundColor: phaseColor + '15' }]}>
              <Ionicons name="library-outline" size={20} color={phaseColor} />
            </View>
            <View style={styles.relatedTextContainer}>
              <Text style={styles.relatedTitle}>Lihat Artikel Lainnya</Text>
              <Text style={styles.relatedSubtitle}>
                Temukan lebih banyak artikel edukasi untuk fase {getPhaseBadgeLabel(article.phase)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </View>
        </Card>

        <View style={{ height: Spacing.massive }} />
      </ScrollView>
    </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.massive,
  },
  // Article Header
  articleHeader: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  phaseBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  phaseBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  weekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  weekBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  articleTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    lineHeight: 32,
  },
  articleSummary: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  // Article Content
  contentContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  paragraph: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 26,
    marginBottom: Spacing.lg,
  },
  // Info Card
  infoCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 0,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  // Related Card
  relatedCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  relatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  relatedIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  relatedTextContainer: {
    flex: 1,
  },
  relatedTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  relatedSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

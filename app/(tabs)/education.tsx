// KIA Care - Education Hub (Edukasi)
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, phaseConfig } from '@/constants/theme';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { getPregnancyWeek } from '@/utils/date';
import type { Phase } from '@/types';
import educationData from '@/data/education.json';

interface ArticleData {
  id: string;
  phase: string;
  weekNumber?: number;
  title: string;
  summary: string;
  content: string;
  category: string;
}

const CATEGORY_ALL = 'Semua';

function getCategoriesForPhase(phase: Phase): string[] {
  const articles = (educationData as ArticleData[]).filter((a) => a.phase === phase);
  const categories = new Set(articles.map((a) => a.category));
  return [CATEGORY_ALL, ...Array.from(categories)];
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

export default function EducationScreen() {
  const { activeProfile } = useApp();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_ALL);
  const [searchQuery, setSearchQuery] = useState('');

  const currentPhase: Phase = activeProfile?.phase ?? 'hamil';
  const config = phaseConfig[currentPhase];
  const categories = useMemo(() => getCategoriesForPhase(currentPhase), [currentPhase]);

  const pregnancyWeek = useMemo(() => {
    if (currentPhase === 'hamil' && activeProfile?.hpht) {
      return getPregnancyWeek(activeProfile.hpht);
    }
    return 0;
  }, [currentPhase, activeProfile?.hpht]);

  const filteredArticles = useMemo(() => {
    let articles = (educationData as ArticleData[]).filter((a) => a.phase === currentPhase);

    if (selectedCategory !== CATEGORY_ALL) {
      articles = articles.filter((a) => a.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.summary.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query)
      );
    }

    if (currentPhase === 'hamil' && pregnancyWeek > 0) {
      articles.sort((a, b) => {
        const aWeek = a.weekNumber ?? Infinity;
        const bWeek = b.weekNumber ?? Infinity;
        const aDiff = Math.abs(aWeek - pregnancyWeek);
        const bDiff = Math.abs(bWeek - pregnancyWeek);
        if (aWeek !== Infinity && bWeek === Infinity) return -1;
        if (aWeek === Infinity && bWeek !== Infinity) return 1;
        return aDiff - bDiff;
      });
    }

    return articles;
  }, [currentPhase, selectedCategory, searchQuery, pregnancyWeek]);

  const handleOpenArticle = useCallback((articleId: string) => {
    router.push(`/education/${articleId}`);
  }, [router]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  if (!activeProfile) {
    return (
      <View style={styles.container}>
        <Header title="Edukasi" subtitle="Informasi kesehatan ibu & anak" />
        <View style={styles.centerContent}>
          <EmptyState
            icon="person-outline"
            title="Tidak ada profil aktif"
            description="Buat profil terlebih dahulu untuk mengakses artikel edukasi."
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Edukasi"
        subtitle={`Artikel untuk fase ${getPhaseBadgeLabel(currentPhase)}`}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari artikel..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((category) => {
            const isActive = category === selectedCategory;
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  isActive && { backgroundColor: config.color },
                ]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    isActive && styles.categoryTabTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Articles List */}
      <ScrollView
        style={styles.articlesList}
        contentContainerStyle={styles.articlesContent}
        showsVerticalScrollIndicator={false}
      >
        {currentPhase === 'hamil' && pregnancyWeek > 0 && !searchQuery && selectedCategory === CATEGORY_ALL && (
          <View style={styles.weekIndicator}>
            <Ionicons name="calendar" size={16} color={config.color} />
            <Text style={[styles.weekIndicatorText, { color: config.color }]}>
              Minggu ke-{pregnancyWeek} - Artikel relevan ditampilkan pertama
            </Text>
          </View>
        )}

        <Text style={styles.articleCount}>
          {filteredArticles.length} artikel ditemukan
        </Text>

        {filteredArticles.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="Tidak ada artikel ditemukan"
            description={
              searchQuery
                ? `Tidak ada artikel yang cocok dengan "${searchQuery}". Coba kata kunci lain.`
                : 'Belum ada artikel untuk kategori ini.'
            }
            actionTitle={searchQuery ? 'Hapus Pencarian' : undefined}
            onAction={searchQuery ? handleClearSearch : undefined}
            color={config.color}
          />
        ) : (
          filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onPress={() => handleOpenArticle(article.id)}
              phaseColor={config.color}
              pregnancyWeek={pregnancyWeek}
              currentPhase={currentPhase}
            />
          ))
        )}

        <View style={{ height: Spacing.massive }} />
      </ScrollView>
    </View>
  );
}

interface ArticleCardProps {
  article: ArticleData;
  onPress: () => void;
  phaseColor: string;
  pregnancyWeek: number;
  currentPhase: Phase;
}

function ArticleCard({
  article,
  onPress,
  phaseColor,
  pregnancyWeek,
  currentPhase,
}: ArticleCardProps) {
  const isRelevantWeek =
    currentPhase === 'hamil' &&
    article.weekNumber !== undefined &&
    Math.abs(article.weekNumber - pregnancyWeek) <= 2;

  return (
    <Card
      style={isRelevantWeek
        ? { ...styles.articleCard, borderLeftWidth: 3, borderLeftColor: phaseColor }
        : styles.articleCard
      }
      onPress={onPress}
    >
      <View style={styles.badgesRow}>
        <View style={[styles.categoryBadge, { backgroundColor: phaseColor + '15' }]}>
          <Text style={[styles.categoryBadgeText, { color: phaseColor }]}>{article.category}</Text>
        </View>
        {article.weekNumber !== undefined && (
          <View style={[styles.weekBadge, { backgroundColor: Colors.accentBg }]}>
            <Text style={[styles.weekBadgeText, { color: Colors.accentDark }]}>
              Minggu ke-{article.weekNumber}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.articleTitle}>{article.title}</Text>
      <Text style={styles.articleSummary} numberOfLines={2}>{article.summary}</Text>

      <View style={styles.readMoreRow}>
        <Text style={[styles.readMoreText, { color: phaseColor }]}>Baca selengkapnya</Text>
        <Ionicons name="arrow-forward" size={14} color={phaseColor} />
      </View>
    </Card>
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
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    paddingVertical: 0,
  },
  categoryWrapper: {
    paddingBottom: Spacing.md,
  },
  categoryContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  categoryTabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  categoryTabTextActive: {
    color: Colors.white,
    fontWeight: FontWeight.semibold,
  },
  articlesList: {
    flex: 1,
  },
  articlesContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  weekIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.sm,
  },
  weekIndicatorText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  articleCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.md,
  },
  articleCard: {
    marginBottom: Spacing.md,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  weekBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  weekBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  articleTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  articleSummary: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  readMoreText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});

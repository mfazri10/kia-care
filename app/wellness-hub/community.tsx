// KIA Care - Community Forum with AI Smart Summary
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTextGeneration } from '@fastshot/ai';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { getForumPosts, saveForumPosts } from '@/utils/storage';
import { ForumPost, ForumReply } from '@/types';

// Sample pre-seeded posts for community feel
const SEED_POSTS: ForumPost[] = [
  {
    id: 'seed-1',
    profileId: 'system',
    content: 'Ada yang punya tips mengatasi morning sickness di trimester pertama? Sudah 2 minggu mual terus 😣',
    anonymous: true,
    authorName: 'Anonim',
    likes: 12,
    replies: [
      {
        id: 'reply-1a',
        profileId: 'system',
        content: 'Coba makan crackers sebelum bangun tidur, ini sangat membantu saya!',
        anonymous: true,
        authorName: 'Anonim',
        createdAt: '2026-03-03T10:00:00Z',
      },
      {
        id: 'reply-1b',
        profileId: 'system',
        content: 'Jahe hangat juga bisa membantu. Semangat ya mama! 💪',
        anonymous: true,
        authorName: 'Anonim',
        createdAt: '2026-03-03T11:30:00Z',
      },
    ],
    createdAt: '2026-03-03T08:00:00Z',
  },
  {
    id: 'seed-2',
    profileId: 'system',
    content: 'Sharing pengalaman: Yoga prenatal sangat membantu untuk tidur lebih nyenyak. Sudah coba sejak minggu ke-20 dan badan terasa lebih rileks ✨',
    anonymous: true,
    authorName: 'Anonim',
    likes: 24,
    replies: [
      {
        id: 'reply-2a',
        profileId: 'system',
        content: 'Wah mau coba! Ada rekomendasi gerakan yang aman untuk pemula?',
        anonymous: true,
        authorName: 'Anonim',
        createdAt: '2026-03-02T14:00:00Z',
      },
    ],
    createdAt: '2026-03-02T09:00:00Z',
  },
  {
    id: 'seed-3',
    profileId: 'system',
    content: 'Baru aja selesai konsultasi dokter, katanya berat badan bayi sudah sesuai usia kehamilan. Alhamdulillah 🤲 Jangan lupa rutin kontrol ya mamas!',
    anonymous: true,
    authorName: 'Anonim',
    likes: 18,
    replies: [],
    createdAt: '2026-03-01T16:00:00Z',
  },
  {
    id: 'seed-4',
    profileId: 'system',
    content: 'Ada rekomendasi brand breast pump yang bagus dan terjangkau? Budget sekitar 500rb-1jt. Terima kasih sebelumnya 🙏',
    anonymous: true,
    authorName: 'Anonim',
    likes: 8,
    replies: [
      {
        id: 'reply-4a',
        profileId: 'system',
        content: 'Saya pakai Little Giant, harganya terjangkau dan performanya oke untuk pemula.',
        anonymous: true,
        authorName: 'Anonim',
        createdAt: '2026-03-01T09:00:00Z',
      },
    ],
    createdAt: '2026-02-28T20:00:00Z',
  },
];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeProfile } = useApp();

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { generateText, isLoading: isAiLoading } = useTextGeneration({
    onError: (err) => {
      console.error('AI summary error:', err);
      setAiSummary('Tidak dapat membuat ringkasan saat ini.');
    },
  });

  const loadPosts = useCallback(async () => {
    try {
      const stored = await getForumPosts();
      if (stored && stored.length > 0) {
        setPosts(stored);
      } else {
        setPosts(SEED_POSTS);
        await saveForumPosts(SEED_POSTS);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts(SEED_POSTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !activeProfile) return;

    const newPost: ForumPost = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      profileId: activeProfile.id,
      content: newPostContent.trim(),
      anonymous: isAnonymous,
      authorName: isAnonymous ? 'Anonim' : activeProfile.name,
      likes: 0,
      replies: [],
      createdAt: new Date().toISOString(),
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    await saveForumPosts(updatedPosts);
    setNewPostContent('');
    setShowNewPost(false);
  };

  const handleLike = async (postId: string) => {
    const updatedPosts = posts.map((p) =>
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    );
    setPosts(updatedPosts);
    await saveForumPosts(updatedPosts);
  };

  const handleReply = async (postId: string) => {
    if (!replyText.trim() || !activeProfile) return;

    const newReply: ForumReply = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      profileId: activeProfile.id,
      content: replyText.trim(),
      anonymous: true,
      authorName: 'Anonim',
      createdAt: new Date().toISOString(),
    };

    const updatedPosts = posts.map((p) =>
      p.id === postId ? { ...p, replies: [...p.replies, newReply] } : p
    );
    setPosts(updatedPosts);
    await saveForumPosts(updatedPosts);
    setReplyText('');
    setReplyingTo(null);
  };

  const handleGenerateSummary = async () => {
    setShowSummary(true);
    setAiSummary('');

    const topPosts = posts
      .slice(0, 10)
      .map((p) => `- "${p.content}" (${p.likes} likes, ${p.replies.length} replies)`)
      .join('\n');

    const prompt = `Kamu adalah asisten komunitas ibu hamil. Berikut adalah postingan terbaru di forum diskusi:\n\n${topPosts}\n\nBuatkan ringkasan "Smart Forum Summary" dalam bahasa Indonesia yang mencakup:\n1. Topik hangat yang paling banyak dibahas\n2. Tips berguna yang muncul dari diskusi\n3. Kekhawatiran umum yang perlu diperhatikan\n\nBuat ringkasan singkat (3-4 paragraf) yang informatif dan bermanfaat.`;

    const response = await generateText(prompt);
    if (response) {
      setAiSummary(response);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} hari lalu`;
    if (hours > 0) return `${hours} jam lalu`;
    return 'Baru saja';
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.skyBlue} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.skyBlueDark} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Forum Komunitas</Text>
          <Text style={styles.headerSubtitle}>{posts.length} diskusi aktif</Text>
        </View>
        <TouchableOpacity
          style={styles.summaryBtn}
          onPress={handleGenerateSummary}
        >
          <Ionicons name="sparkles" size={18} color={Colors.skyBlueDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* AI Smart Summary Button */}
        <TouchableOpacity
          style={styles.smartSummaryCard}
          onPress={handleGenerateSummary}
          activeOpacity={0.8}
        >
          <View style={styles.smartSummaryIcon}>
            <Ionicons name="sparkles" size={20} color={Colors.white} />
          </View>
          <View style={styles.smartSummaryText}>
            <Text style={styles.smartSummaryTitle}>Smart Forum Summary</Text>
            <Text style={styles.smartSummaryDesc}>
              AI ringkasan topik hangat & tips berguna
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.skyBlueDark} />
        </TouchableOpacity>

        {/* Posts */}
        {posts.map((post) => {
          const isExpanded = expandedPost === post.id;
          return (
            <View key={post.id} style={styles.postCard}>
              {/* Post Header */}
              <View style={styles.postHeader}>
                <View style={styles.postAuthorWrap}>
                  <View style={styles.postAvatar}>
                    <Ionicons
                      name={post.anonymous ? 'person' : 'person-circle'}
                      size={18}
                      color={Colors.skyBlue}
                    />
                  </View>
                  <Text style={styles.postAuthor}>{post.authorName}</Text>
                </View>
                <Text style={styles.postTime}>{formatTime(post.createdAt)}</Text>
              </View>

              {/* Post Content */}
              <Text style={styles.postContent}>{post.content}</Text>

              {/* Post Actions */}
              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleLike(post.id)}
                >
                  <Ionicons name="heart-outline" size={18} color={Colors.primary} />
                  <Text style={styles.actionCount}>{post.likes}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    setExpandedPost(isExpanded ? null : post.id);
                    setReplyingTo(null);
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={18} color={Colors.skyBlue} />
                  <Text style={styles.actionCount}>{post.replies.length}</Text>
                </TouchableOpacity>
              </View>

              {/* Replies */}
              {isExpanded && (
                <View style={styles.repliesSection}>
                  {post.replies.map((reply) => (
                    <View key={reply.id} style={styles.replyCard}>
                      <View style={styles.replyHeader}>
                        <Text style={styles.replyAuthor}>{reply.authorName}</Text>
                        <Text style={styles.replyTime}>{formatTime(reply.createdAt)}</Text>
                      </View>
                      <Text style={styles.replyContent}>{reply.content}</Text>
                    </View>
                  ))}

                  {/* Reply Input */}
                  <View style={styles.replyInputRow}>
                    <TextInput
                      style={styles.replyInput}
                      placeholder="Tulis balasan..."
                      placeholderTextColor={Colors.textTertiary}
                      value={replyingTo === post.id ? replyText : ''}
                      onChangeText={(text) => {
                        setReplyingTo(post.id);
                        setReplyText(text);
                      }}
                      onFocus={() => setReplyingTo(post.id)}
                      multiline
                    />
                    <TouchableOpacity
                      style={[
                        styles.replySendBtn,
                        (!replyText.trim() || replyingTo !== post.id) && styles.replySendBtnDisabled,
                      ]}
                      onPress={() => handleReply(post.id)}
                      disabled={!replyText.trim() || replyingTo !== post.id}
                    >
                      <Ionicons name="send" size={16} color={Colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: Spacing.massive + 60 }} />
      </ScrollView>

      {/* New Post FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + Spacing.xl }]}
        onPress={() => setShowNewPost(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* New Post Modal */}
      <Modal visible={showNewPost} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.xl }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Posting Baru</Text>
              <TouchableOpacity onPress={() => setShowNewPost(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.newPostInput}
              placeholder="Apa yang ingin Anda bagikan?"
              placeholderTextColor={Colors.textTertiary}
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              maxLength={500}
              autoFocus
            />

            <View style={styles.postOptionsRow}>
              <View style={styles.anonymousToggle}>
                <Ionicons name="eye-off-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.anonymousLabel}>Posting Anonim</Text>
                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  trackColor={{ false: Colors.border, true: Colors.skyBlueLight }}
                  thumbColor={isAnonymous ? Colors.skyBlue : Colors.surfaceSecondary}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.postButton,
                !newPostContent.trim() && styles.postButtonDisabled,
              ]}
              onPress={handleCreatePost}
              disabled={!newPostContent.trim()}
            >
              <Ionicons name="send" size={18} color={Colors.white} />
              <Text style={styles.postButtonText}>Kirim</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI Summary Modal */}
      <Modal visible={showSummary} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + Spacing.xl }]}>
            <View style={styles.modalHeader}>
              <View style={styles.summaryTitleRow}>
                <Ionicons name="sparkles" size={20} color={Colors.skyBlue} />
                <Text style={styles.modalTitle}>Smart Forum Summary</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSummary(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.summaryScroll} showsVerticalScrollIndicator={false}>
              {isAiLoading ? (
                <View style={styles.summaryLoading}>
                  <ActivityIndicator size="large" color={Colors.skyBlue} />
                  <Text style={styles.summaryLoadingText}>
                    AI sedang merangkum diskusi...
                  </Text>
                </View>
              ) : aiSummary ? (
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryText}>{aiSummary}</Text>
                </View>
              ) : (
                <Text style={styles.summaryEmpty}>
                  Tekan untuk membuat ringkasan forum.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.skyBlueBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.skyBlueLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.skyBlueDark,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.skyBlue,
    marginTop: 2,
  },
  summaryBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.skyBlue + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  smartSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.skyBlueBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.skyBlueLight,
  },
  smartSummaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.skyBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  smartSummaryText: {
    flex: 1,
  },
  smartSummaryTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.skyBlueDark,
  },
  smartSummaryDesc: {
    fontSize: FontSize.xs,
    color: Colors.skyBlue,
    marginTop: 2,
  },
  postCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  postAuthorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.skyBlueBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAuthor: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  postTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  postContent: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  postActions: {
    flexDirection: 'row',
    gap: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  repliesSection: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  replyCard: {
    backgroundColor: Colors.skyBlueBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  replyAuthor: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.skyBlueDark,
  },
  replyTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  replyContent: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  replyInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  replyInput: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 80,
  },
  replySendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.skyBlue,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  replySendBtnDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.skyBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    maxHeight: '80%',
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
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  newPostInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  postOptionsRow: {
    marginBottom: Spacing.lg,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  anonymousLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.skyBlue,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
  },
  postButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  postButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  summaryScroll: {
    maxHeight: 400,
  },
  summaryLoading: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  summaryLoadingText: {
    fontSize: FontSize.sm,
    color: Colors.skyBlue,
    fontStyle: 'italic',
  },
  summaryContent: {
    backgroundColor: Colors.skyBlueBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  summaryText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  summaryEmpty: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.xxl,
  },
});

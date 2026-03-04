// KIA Care - Floating AI Chat Assistant
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTextGeneration } from '@fastshot/ai';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '@/constants/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'Apa manfaat asam folat untuk ibu hamil?',
  'Berapa kali sebaiknya menyusui bayi?',
  'Tips mengatasi mual di trimester pertama?',
  'Tanda bahaya yang perlu diwaspadai ibu nifas?',
];

const SYSTEM_PROMPT = `Kamu adalah asisten kesehatan ibu dan anak yang bernama "Kia". Kamu membantu ibu-ibu Indonesia dengan pertanyaan seputar kehamilan, persalinan, menyusui, perawatan bayi, dan kesehatan ibu.

Berikan jawaban yang:
- Akurat dan berdasarkan panduan medis terpercaya
- Dalam bahasa Indonesia yang mudah dipahami
- Singkat, jelas, dan praktis (maksimal 3-4 paragraf)
- Selalu anjurkan konsultasi dokter untuk kondisi serius
- Empati dan mendukung ibu

Jangan memberikan diagnosis medis. Selalu rekomendasikan konsultasi tenaga kesehatan untuk kondisi yang memerlukan penanganan medis.`;

interface FloatingAIChatProps {
  tabBarHeight: number;
}

export default function FloatingAIChat({ tabBarHeight }: FloatingAIChatProps) {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { generateText, isLoading } = useTextGeneration({
    onError: (err) => {
      console.error('AI Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
          timestamp: new Date(),
        },
      ]);
    },
  });

  // Pulse animation for the button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Build conversation context
    const conversationContext = messages
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'User' : 'Kia'}: ${m.content}`)
      .join('\n');

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${conversationContext ? `Percakapan sebelumnya:\n${conversationContext}\n\n` : ''}User: ${text}\n\nKia:`;

    const response = await generateText(fullPrompt);
    if (response) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleOpen = () => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '0',
          role: 'assistant',
          content: 'Halo! 👋 Saya Kia, asisten kesehatan ibu & anak Anda. Ada yang ingin ditanyakan seputar kehamilan, menyusui, atau perawatan bayi?',
          timestamp: new Date(),
        },
      ]);
    }
    setIsOpen(true);
  };

  return (
    <>
      {/* Floating Button */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            bottom: tabBarHeight + Spacing.xl,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleOpen}
          style={styles.floatingButtonInner}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-ellipses" size={24} color={Colors.white} />
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { paddingTop: insets.top || Spacing.xl }]}>
            <View style={styles.headerLeft}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={18} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Asisten Kia</Text>
                <Text style={styles.headerSubtitle}>AI Kesehatan Ibu & Anak</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={Colors.secondary} />
                <Text style={styles.loadingText}>Kia sedang mengetik...</Text>
              </View>
            )}

            {/* Suggested questions (show when only greeting) */}
            {messages.length === 1 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Pertanyaan umum:</Text>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionChip}
                    onPress={() => handleSuggestedQuestion(q)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.suggestionText}>{q}</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.secondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={[styles.inputContainer, { paddingBottom: insets.bottom || Spacing.md }]}>
            <TextInput
              style={styles.textInput}
              placeholder="Tanya Kia seputar kesehatan..."
              placeholderTextColor={Colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              onPress={handleSend}
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons name="send" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.messageBubbleRow, isUser && styles.messageBubbleRowUser]}>
      {!isUser && (
        <View style={styles.assistantAvatarSmall}>
          <Ionicons name="sparkles" size={12} color={Colors.white} />
        </View>
      )}
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.assistantMessageText]}>
          {message.content}
        </Text>
        <Text style={[styles.messageTime, isUser && styles.messageTimeUser]}>
          {message.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: Spacing.xl,
    zIndex: 1000,
  },
  floatingButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  messageBubbleRowUser: {
    flexDirection: 'row-reverse',
  },
  assistantAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  userBubble: {
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    ...Shadow.sm,
  },
  messageText: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.white,
  },
  assistantMessageText: {
    color: Colors.textPrimary,
  },
  messageTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 4,
    textAlign: 'right',
  },
  messageTimeUser: {
    color: Colors.white + 'BB',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignSelf: 'flex-start',
    ...Shadow.sm,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    marginTop: Spacing.md,
  },
  suggestionsTitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.secondaryBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.secondaryLight,
  },
  suggestionText: {
    fontSize: FontSize.sm,
    color: Colors.secondaryDark,
    flex: 1,
    marginRight: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
});

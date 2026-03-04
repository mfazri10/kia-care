import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@fastshot/auth';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

const AUTH_COLORS = {
  peach: '#F4845F',
  peachBg: '#FFF5F2',
  warmWhite: '#FFFAF8',
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');

  const { resetPassword, isLoading, pendingPasswordReset, error, clearError } = useAuth();

  useEffect(() => {
    if (error) {
      Alert.alert('Gagal Mengirim', error.message, [
        { text: 'OK', onPress: clearError },
      ]);
    }
  }, [error, clearError]);

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Email Kosong', 'Masukkan alamat email Anda');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Format Email Salah', 'Masukkan alamat email yang valid');
      return;
    }

    try {
      await resetPassword(email.trim());
    } catch {
      // Error handled by onError callback
    }
  };

  // Success screen
  if (pendingPasswordReset) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-circle-outline" size={48} color={AUTH_COLORS.peach} />
          </View>
          <Text style={styles.successTitle}>Email Terkirim!</Text>
          <Text style={styles.successText}>
            Cek inbox Anda di{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <Text style={styles.successHint}>
            Ikuti instruksi di email untuk mengatur ulang kata sandi Anda.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Kembali ke Masuk</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={36} color={AUTH_COLORS.peach} />
          </View>
          <Text style={styles.title}>Lupa Kata Sandi?</Text>
          <Text style={styles.subtitle}>
            Masukkan email yang terdaftar dan kami akan mengirimkan link untuk mengatur ulang kata sandi Anda.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.textTertiary} />
            <TextInput
              style={styles.input}
              placeholder="Alamat Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={handleReset}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send-outline" size={20} color={Colors.white} />
                <Text style={styles.primaryButtonText}>Kirim Link Reset</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Back to login */}
        <TouchableOpacity
          style={styles.backToLogin}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={16} color={AUTH_COLORS.peach} />
          <Text style={styles.backToLoginText}>Kembali ke Masuk</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.warmWhite,
  },
  content: {
    flex: 1,
    padding: Spacing.xxl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AUTH_COLORS.peachBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  form: {
    gap: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AUTH_COLORS.peach,
    borderRadius: BorderRadius.lg,
    height: 52,
    gap: Spacing.sm,
    shadowColor: AUTH_COLORS.peach,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
    gap: Spacing.xs,
  },
  backToLoginText: {
    color: AUTH_COLORS.peach,
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  // Success screen
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AUTH_COLORS.peachBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  successTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  successText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    lineHeight: 24,
  },
  emailHighlight: {
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  successHint: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    lineHeight: 20,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@fastshot/auth';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

const AUTH_COLORS = {
  peach: '#F4845F',
  peachLight: '#FFD4C7',
  peachBg: '#FFF5F2',
  coral: '#FF7F6E',
  warmWhite: '#FFFAF8',
};

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    signInWithEmail,
    signInWithGoogle,
    signInWithApple,
    isLoading,
    error,
    clearError,
  } = useAuth();

  useEffect(() => {
    if (error && error.type !== 'BROWSER_DISMISSED') {
      Alert.alert('Gagal Masuk', error.message, [
        { text: 'OK', onPress: clearError },
      ]);
    }
  }, [error, clearError]);

  const validateEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const handleEmailSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Data Tidak Lengkap', 'Masukkan email dan kata sandi Anda');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Format Email Salah', 'Masukkan alamat email yang valid');
      return;
    }

    try {
      await signInWithEmail(email.trim(), password);
    } catch {
      // Error handled by onError callback
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            <Text style={styles.title}>Selamat Datang{'\n'}Kembali</Text>
            <Text style={styles.subtitle}>Masuk untuk melanjutkan perjalanan Anda</Text>
          </View>

          {/* Google Sign-In */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={signInWithGoogle}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text style={styles.googleButtonText}>Masuk dengan Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.appleButton}
              onPress={signInWithApple}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-apple" size={20} color="#fff" />
              <Text style={styles.appleButtonText}>Masuk dengan Apple</Text>
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau masuk dengan email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Form */}
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

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Kata Sandi"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor={Colors.textTertiary}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.textTertiary}
                />
              </TouchableOpacity>
            </View>

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Lupa Kata Sandi?</Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleEmailSignIn}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Masuk</Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Belum punya akun? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.signUpLink}>Daftar</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AUTH_COLORS.warmWhite,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xxl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xxxl,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 38,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    height: 52,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  googleButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderRadius: BorderRadius.lg,
    height: 52,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  appleButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
  },
  form: {
    marginBottom: Spacing.xxl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.xs,
  },
  forgotPasswordText: {
    color: AUTH_COLORS.peach,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
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
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingBottom: Spacing.lg,
  },
  signUpText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  signUpLink: {
    color: AUTH_COLORS.peach,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});

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

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    isLoading,
    error,
    pendingEmailVerification,
    clearError,
  } = useAuth();

  useEffect(() => {
    if (error) {
      Alert.alert('Gagal Mendaftar', error.message, [
        { text: 'OK', onPress: clearError },
      ]);
    }
  }, [error, clearError]);

  const validateEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  const getPasswordStrength = (pass: string): { label: string; color: string; width: number } => {
    if (pass.length === 0) return { label: '', color: 'transparent', width: 0 };
    if (pass.length < 6) return { label: 'Lemah', color: Colors.danger, width: 0.25 };
    if (pass.length < 8) return { label: 'Cukup', color: Colors.warning, width: 0.5 };
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (score >= 2) return { label: 'Kuat', color: Colors.success, width: 1 };
    return { label: 'Sedang', color: AUTH_COLORS.peach, width: 0.75 };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Data Tidak Lengkap', 'Mohon lengkapi semua kolom');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Format Email Salah', 'Masukkan alamat email yang valid');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Kata Sandi Lemah', 'Kata sandi minimal 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Kata Sandi Tidak Cocok', 'Konfirmasi kata sandi tidak sesuai');
      return;
    }

    try {
      const result = await signUpWithEmail(email.trim(), password, {
        data: { full_name: name.trim() },
      });

      if (result.emailConfirmationRequired) {
        // Verification screen will show via pendingEmailVerification state
      }
    } catch {
      // Error handled by onError callback
    }
  };

  // Show verification pending screen
  if (pendingEmailVerification) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.verificationContainer}>
          <View style={styles.verificationIconCircle}>
            <Ionicons name="mail-outline" size={48} color={AUTH_COLORS.peach} />
          </View>
          <Text style={styles.verificationTitle}>Cek Email Anda</Text>
          <Text style={styles.verificationText}>
            Kami telah mengirimkan link verifikasi ke{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
          <Text style={styles.verificationHint}>
            Klik link di email untuk memverifikasi akun Anda, lalu kembali ke sini untuk masuk.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Ke Halaman Masuk</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
            <Text style={styles.title}>Buat Akun Baru</Text>
            <Text style={styles.subtitle}>Daftar untuk memulai perjalanan Anda</Text>
          </View>

          {/* OAuth Buttons */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={signInWithGoogle}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text style={styles.googleButtonText}>Daftar dengan Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.appleButton}
              onPress={signInWithApple}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-apple" size={20} color="#fff" />
              <Text style={styles.appleButtonText}>Daftar dengan Apple</Text>
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau daftar dengan email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Nama Lengkap"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

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

            {/* Password strength indicator */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        backgroundColor: passwordStrength.color,
                        width: `${passwordStrength.width * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="Konfirmasi Kata Sandi"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor={Colors.textTertiary}
              />
              {confirmPassword.length > 0 && (
                <Ionicons
                  name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={password === confirmPassword ? Colors.success : Colors.danger}
                />
              )}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Buat Akun</Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Sudah punya akun? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.signInLink}>Masuk</Text>
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
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
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
    marginVertical: Spacing.xl,
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
    gap: Spacing.sm,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: FontSize.xs,
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
    marginTop: Spacing.sm,
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
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: Spacing.lg,
  },
  signInText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  signInLink: {
    color: AUTH_COLORS.peach,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  // Verification screen
  verificationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  verificationIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AUTH_COLORS.peachBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  verificationTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  verificationText: {
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
  verificationHint: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    lineHeight: 20,
  },
});

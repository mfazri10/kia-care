import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import { Phase } from '@/types';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  phaseConfig,
} from '@/constants/theme';

const phases: Phase[] = ['pra-hamil', 'hamil', 'pasca-melahirkan'];

export default function PhaseSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handlePhaseSelect = (phase: Phase) => {
    router.push({
      pathname: '/onboarding/profile-setup',
      params: { phase },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>Langkah 1 dari 2</Text>
        <Text style={styles.title}>Pilih Tahap Anda</Text>
        <Text style={styles.subtitle}>
          Pilih tahap yang sesuai dengan kondisi Anda saat ini
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.cardsContainer}
        showsVerticalScrollIndicator={false}
      >
        {phases.map((phase) => {
          const config = phaseConfig[phase];
          return (
            <Card
              key={phase}
              variant="elevated"
              onPress={() => handlePhaseSelect(phase)}
              style={{ ...styles.phaseCard, borderLeftColor: config.color, borderLeftWidth: 4 }}
            >
              <View style={styles.phaseCardContent}>
                <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
                  <Ionicons name={config.icon} size={36} color={config.color} />
                </View>

                <View style={styles.phaseInfo}>
                  <Text style={styles.phaseLabel}>{config.label}</Text>
                  <Text style={styles.phaseDescription}>{config.description}</Text>
                  {phase === 'pra-hamil' && (
                    <View style={styles.phaseDetails}>
                      <DetailItem text="Persiapan kehamilan" />
                      <DetailItem text="Kalender kesuburan" />
                      <DetailItem text="Checklist pra-hamil" />
                    </View>
                  )}
                  {phase === 'hamil' && (
                    <View style={styles.phaseDetails}>
                      <DetailItem text="Pemeriksaan kehamilan (ANC)" />
                      <DetailItem text="Tablet tambah darah" />
                      <DetailItem text="Tanda bahaya kehamilan" />
                    </View>
                  )}
                  {phase === 'pasca-melahirkan' && (
                    <View style={styles.phaseDetails}>
                      <DetailItem text="Kunjungan nifas" />
                      <DetailItem text="Catatan menyusui" />
                      <DetailItem text="Tumbuh kembang bayi" />
                    </View>
                  )}
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={Colors.textTertiary}
                  style={styles.chevron}
                />
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

function DetailItem({ text }: { text: string }) {
  return (
    <View style={styles.detailItem}>
      <Ionicons name="checkmark-circle" size={14} color={Colors.secondary} />
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
  },
  stepLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  phaseCard: {
    padding: Spacing.xl,
  },
  phaseCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  phaseInfo: {
    flex: 1,
  },
  phaseLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  phaseDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  phaseDetails: {
    gap: Spacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  chevron: {
    marginLeft: Spacing.sm,
    alignSelf: 'center',
  },
});

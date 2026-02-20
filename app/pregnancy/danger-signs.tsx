import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  Shadow,
} from '@/constants/theme';
import { DANGER_SIGNS_HAMIL, DANGER_SIGNS_PASCA } from '@/constants/data';
import { DangerSign } from '@/types';

export default function DangerSignsScreen() {
  const { activeProfile } = useApp();
  const [checkedSigns, setCheckedSigns] = useState<Set<string>>(new Set());

  const phase = activeProfile?.phase ?? 'hamil';
  const isPostpartum = phase === 'pasca-melahirkan';

  const dangerSigns: DangerSign[] = useMemo(() => {
    if (isPostpartum) {
      return DANGER_SIGNS_PASCA;
    }
    return DANGER_SIGNS_HAMIL;
  }, [isPostpartum]);

  const hasCheckedSigns = checkedSigns.size > 0;

  const checkedDangerCount = useMemo(() => {
    return dangerSigns.filter(
      (sign) => checkedSigns.has(sign.id) && sign.severity === 'danger'
    ).length;
  }, [checkedSigns, dangerSigns]);

  const toggleSign = (signId: string) => {
    setCheckedSigns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(signId)) {
        newSet.delete(signId);
      } else {
        newSet.add(signId);
      }
      return newSet;
    });
  };

  const handleCallEmergency = () => {
    const url = 'tel:119';
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Tidak dapat membuka aplikasi telepon.');
        }
      })
      .catch((error) => {
        console.error('Error opening phone:', error);
        Alert.alert('Error', 'Gagal membuka aplikasi telepon.');
      });
  };

  const handleCallContact = () => {
    if (
      activeProfile &&
      formattedEmergencyContacts.length > 0
    ) {
      const firstContact = formattedEmergencyContacts[0];
      const url = `tel:${firstContact.phone}`;
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Alert.alert('Error', 'Tidak dapat membuka aplikasi telepon.');
          }
        })
        .catch((error) => {
          console.error('Error opening phone:', error);
          Alert.alert('Error', 'Gagal membuka aplikasi telepon.');
        });
    } else {
      Alert.alert(
        'Kontak Darurat',
        'Belum ada kontak darurat yang tersimpan. Silakan isi data P4K terlebih dahulu.'
      );
    }
  };

  // Try to get emergency contacts from context - for now just provide the call buttons
  const formattedEmergencyContacts: { name: string; phone: string }[] = [];

  const handleReset = () => {
    setCheckedSigns(new Set());
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Tanda Bahaya"
        subtitle={isPostpartum ? 'Pasca Melahirkan' : 'Kehamilan'}
        showBack
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="warning-outline" size={20} color={Colors.warning} />
            <Text style={styles.infoText}>Periksa Tanda Bahaya</Text>
          </View>
          <Text style={styles.infoDescription}>
            {isPostpartum
              ? 'Centang jika Anda mengalami salah satu tanda bahaya berikut setelah melahirkan. Segera hubungi tenaga kesehatan jika ada tanda bahaya.'
              : 'Centang jika Anda mengalami salah satu tanda bahaya berikut selama kehamilan. Segera hubungi tenaga kesehatan jika ada tanda bahaya.'}
          </Text>
        </Card>

        {/* ALERT - shown when any sign is checked */}
        {hasCheckedSigns && (
          <View style={styles.alertContainer}>
            <Card style={styles.alertCard}>
              <View style={styles.alertIconContainer}>
                <Ionicons name="alert-circle" size={48} color={Colors.danger} />
              </View>
              <Text style={styles.alertTitle}>PERINGATAN!</Text>
              <Text style={styles.alertText}>
                Anda mencentang {checkedSigns.size} tanda bahaya
                {checkedDangerCount > 0
                  ? ` (${checkedDangerCount} tanda serius)`
                  : ''}
                . Segera hubungi tenaga kesehatan atau kunjungi fasilitas kesehatan terdekat!
              </Text>

              <View style={styles.alertActions}>
                <Button
                  title="Hubungi 119"
                  onPress={handleCallEmergency}
                  variant="danger"
                  size="lg"
                  fullWidth
                  icon="call-outline"
                  style={styles.emergencyButton}
                />
                <Button
                  title="Hubungi Kontak Darurat"
                  onPress={handleCallContact}
                  variant="outline"
                  size="lg"
                  fullWidth
                  icon="people-outline"
                  color={Colors.danger}
                  style={styles.contactButton}
                />
              </View>
            </Card>
          </View>
        )}

        {/* Danger Signs List */}
        <View style={styles.signsList}>
          {dangerSigns.map((sign) => {
            const isChecked = checkedSigns.has(sign.id);
            const isDanger = sign.severity === 'danger';
            const severityColor = isDanger ? Colors.danger : Colors.warning;

            return (
              <TouchableOpacity
                key={sign.id}
                style={[
                  styles.signItem,
                  isChecked && {
                    backgroundColor: severityColor + '10',
                    borderColor: severityColor,
                  },
                ]}
                onPress={() => toggleSign(sign.id)}
                activeOpacity={0.7}
              >
                <View style={styles.signContent}>
                  <View
                    style={[
                      styles.checkbox,
                      isChecked && {
                        backgroundColor: severityColor,
                        borderColor: severityColor,
                      },
                    ]}
                  >
                    {isChecked && (
                      <Ionicons name="checkmark" size={16} color={Colors.white} />
                    )}
                  </View>

                  <View style={styles.signInfo}>
                    <View style={styles.signTitleRow}>
                      <Text
                        style={[
                          styles.signTitle,
                          isChecked && { color: severityColor },
                        ]}
                      >
                        {sign.title}
                      </Text>
                      <View
                        style={[
                          styles.severityBadge,
                          { backgroundColor: severityColor + '20' },
                        ]}
                      >
                        <Ionicons
                          name={isDanger ? 'alert-circle' : 'warning'}
                          size={12}
                          color={severityColor}
                        />
                        <Text style={[styles.severityText, { color: severityColor }]}>
                          {isDanger ? 'Bahaya' : 'Waspada'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.signDescription}>{sign.description}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Reset Button */}
        {hasCheckedSigns && (
          <Button
            title="Reset Semua Centang"
            onPress={handleReset}
            variant="ghost"
            size="md"
            icon="refresh-outline"
            style={styles.resetButton}
            color={Colors.textSecondary}
          />
        )}

        {/* Important Notes */}
        <Card style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.secondary} />
            <Text style={styles.notesTitle}>Catatan Penting</Text>
          </View>
          <Text style={styles.noteText}>
            {'\u2022'} Alat ini bukan pengganti pemeriksaan medis profesional.
          </Text>
          <Text style={styles.noteText}>
            {'\u2022'} Jika mengalami salah satu tanda bahaya, segera ke fasilitas kesehatan terdekat.
          </Text>
          <Text style={styles.noteText}>
            {'\u2022'} Jangan menunggu tanda bahaya memburuk sebelum mencari pertolongan.
          </Text>
          <Text style={styles.noteText}>
            {'\u2022'} Simpan nomor darurat dan kontak bidan Anda di tempat yang mudah dijangkau.
          </Text>
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  infoCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.warningBg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.warning,
    marginLeft: Spacing.sm,
  },
  infoDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  alertContainer: {
    marginBottom: Spacing.lg,
  },
  alertCard: {
    backgroundColor: Colors.dangerBg,
    borderWidth: 2,
    borderColor: Colors.danger,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  alertIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.danger + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  alertTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.danger,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  alertText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  alertActions: {
    width: '100%',
  },
  emergencyButton: {
    marginBottom: Spacing.sm,
  },
  contactButton: {
    marginBottom: 0,
  },
  signsList: {
    marginBottom: Spacing.md,
  },
  signItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  signContent: {
    flexDirection: 'row',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  signInfo: {
    flex: 1,
  },
  signTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  signTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  severityText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginLeft: 4,
  },
  signDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  resetButton: {
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  notesCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.secondaryBg,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  notesTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.secondaryDark,
    marginLeft: Spacing.sm,
  },
  noteText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
  bottomPadding: {
    height: Spacing.huge,
  },
});

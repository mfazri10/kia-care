// KIA Care - Unified Calendar (Jadwal)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow, phaseConfig } from '@/constants/theme';
import { ANC_SCHEDULE, KF_SCHEDULE } from '@/constants/data';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import {
  getCalendarDates,
  formatDateID,
  getTodayISO,
  getPregnancyWeek,
} from '@/utils/date';
import {
  getCalendarEvents,
  saveCalendarEvents,
} from '@/utils/storage';
import type { CalendarEvent, Phase } from '@/types';
import scheduleData from '@/data/schedule.json';

const DAYS_OF_WEEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

type EventType = CalendarEvent['type'];

interface ScheduleItem {
  id: string;
  title: string;
  type: string;
  description: string;
  dayOffset?: number;
  weekOffset?: number;
}

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: 'anc', label: 'Kunjungan ANC' },
  { value: 'kf', label: 'Kunjungan Nifas (KF)' },
  { value: 'ttd', label: 'Tablet Tambah Darah' },
  { value: 'imunisasi', label: 'Imunisasi' },
  { value: 'kontrol', label: 'Kontrol' },
  { value: 'lainnya', label: 'Lainnya' },
];

function getEventColor(type: EventType): string {
  switch (type) {
    case 'anc':
      return Colors.secondary;
    case 'kf':
      return Colors.pascaMelahirkan;
    case 'ttd':
      return Colors.accent;
    case 'imunisasi':
      return Colors.praHamil;
    case 'kontrol':
      return Colors.primaryDark;
    case 'lainnya':
    default:
      return Colors.primary;
  }
}

function getEventTypeLabel(type: EventType): string {
  const option = EVENT_TYPE_OPTIONS.find((o) => o.value === type);
  return option?.label ?? 'Lainnya';
}

function dateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CalendarScreen() {
  const { activeProfile } = useApp();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISO());
  const [storedEvents, setStoredEvents] = useState<CalendarEvent[]>([]);
  const [, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Add event form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<EventType>('lainnya');
  const [newNotes, setNewNotes] = useState('');

  const profileId = activeProfile?.id ?? '';
  const currentPhase: Phase = activeProfile?.phase ?? 'hamil';
  const config = phaseConfig[currentPhase];

  // Load events from storage
  const loadEvents = useCallback(async () => {
    if (!profileId) {
      setIsLoading(false);
      return;
    }
    try {
      const events = await getCalendarEvents();
      const profileEvents = (events || []).filter(
        (e: CalendarEvent) => e.profileId === profileId
      );
      setStoredEvents(profileEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Generate schedule-based events from schedule.json
  const scheduleEvents = useMemo((): CalendarEvent[] => {
    if (!activeProfile) return [];
    const events: CalendarEvent[] = [];
    const phase = activeProfile.phase;

    const phaseSchedule = (scheduleData as Record<string, ScheduleItem[]>)[phase];
    if (!phaseSchedule) return [];

    let referenceDate: Date | null = null;

    if (phase === 'pra-hamil') {
      // Use profile creation date as reference
      referenceDate = new Date(activeProfile.createdAt);
    } else if (phase === 'hamil' && activeProfile.hpht) {
      referenceDate = new Date(activeProfile.hpht);
    } else if (phase === 'pasca-melahirkan' && activeProfile.babyDob) {
      referenceDate = new Date(activeProfile.babyDob);
    }

    if (!referenceDate) return [];

    phaseSchedule.forEach((item) => {
      const eventDate = new Date(referenceDate!);

      if (item.weekOffset !== undefined) {
        eventDate.setDate(eventDate.getDate() + item.weekOffset * 7);
      } else if (item.dayOffset !== undefined) {
        eventDate.setDate(eventDate.getDate() + item.dayOffset);
      }

      const eventType = EVENT_TYPE_OPTIONS.find(o => o.value === item.type)
        ? (item.type as EventType)
        : 'lainnya';

      events.push({
        id: `schedule-${item.id}`,
        profileId: activeProfile.id,
        date: dateToISO(eventDate),
        title: item.title,
        type: eventType,
        completed: false,
        notes: item.description,
      });
    });

    return events;
  }, [activeProfile]);

  // Generate auto-events from ANC/KF schedules (legacy support)
  const autoEvents = useMemo((): CalendarEvent[] => {
    if (!activeProfile) return [];
    const events: CalendarEvent[] = [];

    // ANC visit events from stored ANC visits
    if (activeProfile.phase === 'hamil' && activeProfile.hpht) {
      const hphtDate = new Date(activeProfile.hpht);
      ANC_SCHEDULE.forEach((schedule) => {
        const weekRange = schedule.weekRange.split('-');
        const startWeek = parseInt(weekRange[0], 10);
        const visitDate = new Date(hphtDate);
        visitDate.setDate(visitDate.getDate() + startWeek * 7);
        events.push({
          id: `auto-anc-${schedule.visitNumber}`,
          profileId: activeProfile.id,
          date: dateToISO(visitDate),
          title: schedule.label,
          type: 'anc',
          completed: false,
          notes: schedule.description,
        });
      });
    }

    // KF visit events
    if (activeProfile.phase === 'pasca-melahirkan' && activeProfile.babyDob) {
      const babyDob = new Date(activeProfile.babyDob);
      KF_SCHEDULE.forEach((schedule) => {
        let daysAfter = 0;
        if (schedule.visitNumber === 1) daysAfter = 1;
        else if (schedule.visitNumber === 2) daysAfter = 5;
        else if (schedule.visitNumber === 3) daysAfter = 14;
        else if (schedule.visitNumber === 4) daysAfter = 35;

        const visitDate = new Date(babyDob);
        visitDate.setDate(visitDate.getDate() + daysAfter);
        events.push({
          id: `auto-kf-${schedule.visitNumber}`,
          profileId: activeProfile.id,
          date: dateToISO(visitDate),
          title: schedule.label,
          type: 'kf',
          completed: false,
          notes: schedule.description,
        });
      });
    }

    return events;
  }, [activeProfile]);

  // Combine all event sources
  const allEvents = useMemo(() => {
    const eventMap = new Map<string, CalendarEvent>();
    // Schedule.json events first (lowest priority)
    scheduleEvents.forEach((e) => eventMap.set(e.id, e));
    // Auto events (medium priority)
    autoEvents.forEach((e) => eventMap.set(e.id, e));
    // Stored/user events (highest priority)
    storedEvents.forEach((e) => eventMap.set(e.id, e));
    return Array.from(eventMap.values());
  }, [storedEvents, autoEvents, scheduleEvents]);

  // Calendar dates for current month
  const calendarDates = useMemo(
    () => getCalendarDates(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // Events for the selected date
  const selectedDateEvents = useMemo(
    () => allEvents.filter((e) => e.date === selectedDate),
    [allEvents, selectedDate]
  );

  // Upcoming events (next 30 days)
  const upcomingEvents = useMemo(() => {
    const todayStr = getTodayISO();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const thirtyStr = dateToISO(thirtyDaysLater);
    return allEvents
      .filter((e) => e.date >= todayStr && e.date <= thirtyStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [allEvents]);

  // Events map for quick lookup (date -> event types)
  const eventsMap = useMemo(() => {
    const map = new Map<string, Set<EventType>>();
    allEvents.forEach((e) => {
      const dateKey = e.date;
      if (!map.has(dateKey)) {
        map.set(dateKey, new Set());
      }
      map.get(dateKey)!.add(e.type);
    });
    return map;
  }, [allEvents]);

  // Navigation
  const goToPrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }, [currentMonth]);

  const goToToday = useCallback(() => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(getTodayISO());
  }, []);

  const resetForm = useCallback(() => {
    setNewTitle('');
    setNewType('lainnya');
    setNewNotes('');
    setShowTypeDropdown(false);
  }, []);

  // Add event
  const handleAddEvent = useCallback(async () => {
    if (!newTitle.trim()) {
      Alert.alert('Perhatian', 'Judul acara tidak boleh kosong.');
      return;
    }
    if (!profileId) {
      Alert.alert('Perhatian', 'Tidak ada profil aktif.');
      return;
    }

    const newEvent: CalendarEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      profileId,
      date: selectedDate,
      title: newTitle.trim(),
      type: newType,
      completed: false,
      notes: newNotes.trim() || undefined,
    };

    try {
      const existingEvents = await getCalendarEvents();
      const updatedEvents = [...(existingEvents || []), newEvent];
      await saveCalendarEvents(updatedEvents);
      setStoredEvents((prev) => [...prev, newEvent]);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Gagal', 'Gagal menyimpan acara. Silakan coba lagi.');
    }
  }, [newTitle, newType, newNotes, selectedDate, profileId, resetForm]);

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    resetForm();
  }, [resetForm]);

  if (!activeProfile) {
    return (
      <View style={styles.container}>
        <Header title="Jadwal" subtitle="Jadwal dan acara" />
        <View style={styles.centerContent}>
          <EmptyState
            icon="person-outline"
            title="Tidak ada profil aktif"
            description="Buat profil terlebih dahulu untuk mengakses jadwal."
          />
        </View>
      </View>
    );
  }

  const todayISO = getTodayISO();

  return (
    <View style={styles.container}>
      <Header
        title="Jadwal"
        subtitle={`Fase ${config.label}`}
        rightAction={{
          icon: 'today-outline',
          onPress: goToToday,
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Phase Event Summary */}
        <View style={[styles.phaseSummary, { backgroundColor: config.bgColor }]}>
          <View style={styles.phaseSummaryRow}>
            <Ionicons name="calendar" size={16} color={config.color} />
            <Text style={[styles.phaseSummaryText, { color: config.color }]}>
              {upcomingEvents.length} jadwal dalam 30 hari ke depan
            </Text>
          </View>
          {currentPhase === 'hamil' && activeProfile.hpht && (
            <Text style={[styles.phaseSummarySubtext, { color: config.color + 'AA' }]}>
              Minggu ke-{getPregnancyWeek(activeProfile.hpht)} kehamilan
            </Text>
          )}
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTHS_ID[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <Card style={styles.calendarCard}>
          {/* Days of Week Header */}
          <View style={styles.daysOfWeekRow}>
            {DAYS_OF_WEEK.map((day) => (
              <View key={day} style={styles.dayOfWeekCell}>
                <Text style={[
                  styles.dayOfWeekText,
                  day === 'Min' && { color: Colors.danger },
                ]}>
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Date Grid */}
          <View style={styles.dateGrid}>
            {calendarDates.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dateCell} />;
              }

              const dateISO = dateToISO(date);
              const isToday = dateISO === todayISO;
              const isSelected = dateISO === selectedDate;
              const isSunday = date.getDay() === 0;
              const eventTypes = eventsMap.get(dateISO);
              const hasEvents = eventTypes && eventTypes.size > 0;

              return (
                <TouchableOpacity
                  key={dateISO}
                  style={[
                    styles.dateCell,
                    isSelected && styles.dateCellSelected,
                    isToday && !isSelected && styles.dateCellToday,
                  ]}
                  onPress={() => setSelectedDate(dateISO)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dateText,
                      isSunday && styles.dateTextSunday,
                      isToday && styles.dateTextToday,
                      isSelected && styles.dateTextSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  {/* Event Dots */}
                  {hasEvents && (
                    <View style={styles.dotsRow}>
                      {Array.from(eventTypes).slice(0, 3).map((type) => (
                        <View
                          key={type}
                          style={[
                            styles.eventDot,
                            { backgroundColor: isSelected ? Colors.white : getEventColor(type) },
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Selected Date Events */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.eventsSectionTitle}>
              {formatDateID(selectedDate)}
            </Text>
            <Button
              title="Tambah"
              onPress={() => setShowAddModal(true)}
              variant="secondary"
              size="sm"
              icon="add-outline"
              color={config.color}
            />
          </View>

          {selectedDateEvents.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="Tidak ada acara"
              description="Belum ada jadwal atau acara pada tanggal ini."
              actionTitle="Tambah Acara"
              onAction={() => setShowAddModal(true)}
              color={Colors.textTertiary}
            />
          ) : (
            selectedDateEvents.map((event) => (
              <Card key={event.id} style={styles.eventCard}>
                <View style={styles.eventRow}>
                  <View style={[styles.eventColorBar, { backgroundColor: getEventColor(event.type) }]} />
                  <View style={styles.eventContent}>
                    <View style={styles.eventTitleRow}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={[styles.eventTypeBadge, { backgroundColor: getEventColor(event.type) + '15' }]}>
                        <Text style={[styles.eventTypeBadgeText, { color: getEventColor(event.type) }]}>
                          {getEventTypeLabel(event.type)}
                        </Text>
                      </View>
                    </View>
                    {event.notes ? (
                      <Text style={styles.eventNotes} numberOfLines={2}>
                        {event.notes}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Upcoming Events Section */}
        {upcomingEvents.length > 0 && (
          <View style={styles.upcomingSection}>
            <Text style={styles.upcomingSectionTitle}>
              <Ionicons name="time-outline" size={16} color={Colors.textPrimary} />
              {'  '}Jadwal Mendatang
            </Text>
            {upcomingEvents.slice(0, 5).map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.upcomingItem}
                onPress={() => {
                  const eventDate = new Date(event.date);
                  setSelectedDate(event.date);
                  setCurrentYear(eventDate.getFullYear());
                  setCurrentMonth(eventDate.getMonth());
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.upcomingDot, { backgroundColor: getEventColor(event.type) }]} />
                <View style={styles.upcomingTextContainer}>
                  <Text style={styles.upcomingTitle} numberOfLines={1}>{event.title}</Text>
                  <Text style={styles.upcomingDate}>{formatDateID(event.date)}</Text>
                </View>
                <View style={[styles.upcomingTypeBadge, { backgroundColor: getEventColor(event.type) + '15' }]}>
                  <Text style={[styles.upcomingTypeText, { color: getEventColor(event.type) }]}>
                    {getEventTypeLabel(event.type)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Legend */}
        <Card style={styles.legendCard}>
          <Text style={styles.legendTitle}>Keterangan Warna</Text>
          <View style={styles.legendGrid}>
            {EVENT_TYPE_OPTIONS.map((option) => (
              <View key={option.value} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: getEventColor(option.value) }]} />
                <Text style={styles.legendText}>{option.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ height: Spacing.massive }} />
      </ScrollView>

      {/* Add Event Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Acara</Text>
              <TouchableOpacity onPress={handleCloseModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDateLabel}>
              Tanggal: {formatDateID(selectedDate)}
            </Text>

            {/* Title Input */}
            <Text style={styles.inputLabel}>Judul *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Masukkan judul acara"
              placeholderTextColor={Colors.textTertiary}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            {/* Type Dropdown */}
            <Text style={styles.inputLabel}>Jenis Acara</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
              activeOpacity={0.7}
            >
              <View style={[styles.dropdownDot, { backgroundColor: getEventColor(newType) }]} />
              <Text style={styles.dropdownButtonText}>
                {getEventTypeLabel(newType)}
              </Text>
              <Ionicons
                name={showTypeDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            {showTypeDropdown && (
              <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownItem,
                      newType === option.value && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setNewType(option.value);
                      setShowTypeDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.dropdownItemDot, { backgroundColor: getEventColor(option.value) }]} />
                    <Text style={[
                      styles.dropdownItemText,
                      newType === option.value && styles.dropdownItemTextActive,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Notes Input */}
            <Text style={styles.inputLabel}>Catatan</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              placeholder="Tambahkan catatan (opsional)"
              placeholderTextColor={Colors.textTertiary}
              value={newNotes}
              onChangeText={setNewNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Button
                title="Batal"
                onPress={handleCloseModal}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title="Simpan"
                onPress={handleAddEvent}
                variant="primary"
                style={{ flex: 1 }}
                icon="checkmark-outline"
              />
            </View>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  // Phase Summary
  phaseSummary: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  phaseSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  phaseSummaryText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  phaseSummarySubtext: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xl + Spacing.sm,
  },
  // Month Navigation
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  // Calendar
  calendarCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  dayOfWeekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  dayOfWeekText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
  },
  dateCellSelected: {
    backgroundColor: Colors.primary,
  },
  dateCellToday: {
    backgroundColor: Colors.primaryBg,
  },
  dateText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  dateTextSunday: {
    color: Colors.danger,
  },
  dateTextToday: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  dateTextSelected: {
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
    position: 'absolute',
    bottom: 4,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  // Events Section
  eventsSection: {
    marginBottom: Spacing.lg,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  eventsSectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  eventCard: {
    marginBottom: Spacing.sm,
    padding: 0,
    overflow: 'hidden',
  },
  eventRow: {
    flexDirection: 'row',
  },
  eventColorBar: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: Spacing.md,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  eventTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  eventTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  eventTypeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  eventNotes: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  // Upcoming Events
  upcomingSection: {
    marginBottom: Spacing.lg,
  },
  upcomingSectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  upcomingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.md,
  },
  upcomingTextContainer: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  upcomingDate: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  upcomingTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  upcomingTypeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  // Legend
  legendCard: {
    marginBottom: Spacing.md,
  },
  legendTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.massive,
    maxHeight: '85%',
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
  modalDateLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  textAreaInput: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  dropdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  dropdownList: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    maxHeight: 200,
    ...Shadow.sm,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropdownItemActive: {
    backgroundColor: Colors.primaryBg,
  },
  dropdownItemDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dropdownItemText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  dropdownItemTextActive: {
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});

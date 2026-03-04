// KIA Care - AsyncStorage Utilities (Offline-First)

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SETTINGS: '@kia_settings',
  PROFILES: '@kia_profiles',
  ANC_VISITS: '@kia_anc_visits',
  TTD_LOG: '@kia_ttd_log',
  P4K_DATA: '@kia_p4k_data',
  KF_VISITS: '@kia_kf_visits',
  BREASTFEEDING: '@kia_breastfeeding',
  MILK_STOCK: '@kia_milk_stock',
  BABY_GROWTH: '@kia_baby_growth',
  BABY_BLUES: '@kia_baby_blues',
  PRE_PREGNANCY_CHECKLIST: '@kia_pre_pregnancy_checklist',
  FERTILITY: '@kia_fertility',
  CALENDAR_EVENTS: '@kia_calendar_events',
  DANGER_SIGN_CHECKS: '@kia_danger_checks',
  NOTIFICATIONS: '@kia_notifications',
  APPOINTMENTS: '@kia_appointments',
  DAILY_SUPPLEMENTS: '@kia_daily_supplements',
  NUTRITION_LOGS: '@kia_nutrition_logs',
  GALLERY_ITEMS: '@kia_gallery_items',
  MOOD_ENTRIES: '@kia_mood_entries',
  HOSPITAL_BAG: '@kia_hospital_bag',
  FORUM_POSTS: '@kia_forum_posts',
  PARTNER_SYNC: '@kia_partner_sync',
  CLOUD_SYNC_ENABLED: '@kia_cloud_sync',
} as const;

// Generic storage functions
async function getItem<T>(key: string): Promise<T | null> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return null;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
  }
}

// Settings
export const getSettings = () => getItem(STORAGE_KEYS.SETTINGS);
export const saveSettings = (settings: any) => setItem(STORAGE_KEYS.SETTINGS, settings);

// Profiles
export const getProfiles = () => getItem<any[]>(STORAGE_KEYS.PROFILES);
export const saveProfiles = (profiles: any[]) => setItem(STORAGE_KEYS.PROFILES, profiles);

// ANC Visits
export const getANCVisits = () => getItem<any[]>(STORAGE_KEYS.ANC_VISITS);
export const saveANCVisits = (visits: any[]) => setItem(STORAGE_KEYS.ANC_VISITS, visits);

// TTD Log
export const getTTDLog = () => getItem<any[]>(STORAGE_KEYS.TTD_LOG);
export const saveTTDLog = (log: any[]) => setItem(STORAGE_KEYS.TTD_LOG, log);

// P4K Data
export const getP4KData = () => getItem(STORAGE_KEYS.P4K_DATA);
export const saveP4KData = (data: any) => setItem(STORAGE_KEYS.P4K_DATA, data);

// KF Visits
export const getKFVisits = () => getItem<any[]>(STORAGE_KEYS.KF_VISITS);
export const saveKFVisits = (visits: any[]) => setItem(STORAGE_KEYS.KF_VISITS, visits);

// Breastfeeding Sessions
export const getBreastfeedingSessions = () => getItem<any[]>(STORAGE_KEYS.BREASTFEEDING);
export const saveBreastfeedingSessions = (sessions: any[]) => setItem(STORAGE_KEYS.BREASTFEEDING, sessions);

// Milk Stock
export const getMilkStock = () => getItem<any[]>(STORAGE_KEYS.MILK_STOCK);
export const saveMilkStock = (stock: any[]) => setItem(STORAGE_KEYS.MILK_STOCK, stock);

// Baby Growth
export const getBabyGrowth = () => getItem<any[]>(STORAGE_KEYS.BABY_GROWTH);
export const saveBabyGrowth = (growth: any[]) => setItem(STORAGE_KEYS.BABY_GROWTH, growth);

// Baby Blues Screening
export const getBabyBluesScreenings = () => getItem<any[]>(STORAGE_KEYS.BABY_BLUES);
export const saveBabyBluesScreenings = (screenings: any[]) => setItem(STORAGE_KEYS.BABY_BLUES, screenings);

// Pre-Pregnancy Checklist
export const getPrePregnancyChecklist = () => getItem(STORAGE_KEYS.PRE_PREGNANCY_CHECKLIST);
export const savePrePregnancyChecklist = (checklist: any) => setItem(STORAGE_KEYS.PRE_PREGNANCY_CHECKLIST, checklist);

// Fertility Data
export const getFertilityData = () => getItem(STORAGE_KEYS.FERTILITY);
export const saveFertilityData = (data: any) => setItem(STORAGE_KEYS.FERTILITY, data);

// Calendar Events
export const getCalendarEvents = () => getItem<any[]>(STORAGE_KEYS.CALENDAR_EVENTS);
export const saveCalendarEvents = (events: any[]) => setItem(STORAGE_KEYS.CALENDAR_EVENTS, events);

// Danger Sign Checks
export const getDangerSignChecks = () => getItem<any[]>(STORAGE_KEYS.DANGER_SIGN_CHECKS);
export const saveDangerSignChecks = (checks: any[]) => setItem(STORAGE_KEYS.DANGER_SIGN_CHECKS, checks);

// Notifications
export const getNotifications = () => getItem<any[]>(STORAGE_KEYS.NOTIFICATIONS);
export const saveNotifications = (notifications: any[]) => setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);

// Appointments
export const getAppointments = () => getItem<any[]>(STORAGE_KEYS.APPOINTMENTS);
export const saveAppointments = (appointments: any[]) => setItem(STORAGE_KEYS.APPOINTMENTS, appointments);

// Daily Supplements
export const getDailySupplements = () => getItem<any[]>(STORAGE_KEYS.DAILY_SUPPLEMENTS);
export const saveDailySupplements = (logs: any[]) => setItem(STORAGE_KEYS.DAILY_SUPPLEMENTS, logs);

// Nutrition Logs
export const getNutritionLogs = () => getItem<any[]>(STORAGE_KEYS.NUTRITION_LOGS);
export const saveNutritionLogs = (logs: any[]) => setItem(STORAGE_KEYS.NUTRITION_LOGS, logs);

// Gallery Items
export const getGalleryItems = () => getItem<any[]>(STORAGE_KEYS.GALLERY_ITEMS);
export const saveGalleryItems = (items: any[]) => setItem(STORAGE_KEYS.GALLERY_ITEMS, items);

// Mood Entries
export const getMoodEntries = () => getItem<any[]>(STORAGE_KEYS.MOOD_ENTRIES);
export const saveMoodEntries = (entries: any[]) => setItem(STORAGE_KEYS.MOOD_ENTRIES, entries);

// Hospital Bag
export const getHospitalBag = () => getItem(STORAGE_KEYS.HOSPITAL_BAG);
export const saveHospitalBag = (data: any) => setItem(STORAGE_KEYS.HOSPITAL_BAG, data);

// Forum Posts
export const getForumPosts = () => getItem<any[]>(STORAGE_KEYS.FORUM_POSTS);
export const saveForumPosts = (posts: any[]) => setItem(STORAGE_KEYS.FORUM_POSTS, posts);

// Partner Sync
export const getPartnerSync = () => getItem(STORAGE_KEYS.PARTNER_SYNC);
export const savePartnerSync = (data: any) => setItem(STORAGE_KEYS.PARTNER_SYNC, data);

// Cloud Sync
export const getCloudSyncEnabled = () => getItem<boolean>(STORAGE_KEYS.CLOUD_SYNC_ENABLED);
export const saveCloudSyncEnabled = (enabled: boolean) => setItem(STORAGE_KEYS.CLOUD_SYNC_ENABLED, enabled);

// Clear all data
export const clearAllData = async () => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

export { STORAGE_KEYS, getItem, setItem, removeItem };

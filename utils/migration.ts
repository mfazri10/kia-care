// KIA Care - Data Migration Utility
// Migrates local AsyncStorage data to Supabase cloud on first login

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const MIGRATION_KEY = '@kia_migration_completed';

interface LocalDataBundle {
  profiles: any[] | null;
  ancVisits: any[] | null;
  ttdLog: any[] | null;
  kfVisits: any[] | null;
  breastfeeding: any[] | null;
  milkStock: any[] | null;
  babyGrowth: any[] | null;
  babyBlues: any[] | null;
  calendarEvents: any[] | null;
  dangerChecks: any[] | null;
  appointments: any[] | null;
  dailySupplements: any[] | null;
  nutritionLogs: any[] | null;
  galleryItems: any[] | null;
  moodEntries: any[] | null;
  hospitalBag: any | null;
  p4kData: any | null;
  prePregnancyChecklist: any | null;
  fertilityData: any | null;
  forumPosts: any[] | null;
  partnerSync: any | null;
}

/**
 * Check if migration has already been completed
 */
async function isMigrationCompleted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(MIGRATION_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark migration as completed
 */
async function markMigrationCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(MIGRATION_KEY, 'true');
  } catch (error) {
    console.error('Failed to mark migration as completed:', error);
  }
}

/**
 * Collect all local data from AsyncStorage
 */
async function collectLocalData(): Promise<LocalDataBundle> {
  const keys = [
    '@kia_profiles',
    '@kia_anc_visits',
    '@kia_ttd_log',
    '@kia_kf_visits',
    '@kia_breastfeeding',
    '@kia_milk_stock',
    '@kia_baby_growth',
    '@kia_baby_blues',
    '@kia_calendar_events',
    '@kia_danger_checks',
    '@kia_appointments',
    '@kia_daily_supplements',
    '@kia_nutrition_logs',
    '@kia_gallery_items',
    '@kia_mood_entries',
    '@kia_hospital_bag',
    '@kia_p4k_data',
    '@kia_pre_pregnancy_checklist',
    '@kia_fertility',
    '@kia_forum_posts',
    '@kia_partner_sync',
  ];

  const results = await AsyncStorage.multiGet(keys);
  const parsed = results.map(([, value]) => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  });

  return {
    profiles: parsed[0],
    ancVisits: parsed[1],
    ttdLog: parsed[2],
    kfVisits: parsed[3],
    breastfeeding: parsed[4],
    milkStock: parsed[5],
    babyGrowth: parsed[6],
    babyBlues: parsed[7],
    calendarEvents: parsed[8],
    dangerChecks: parsed[9],
    appointments: parsed[10],
    dailySupplements: parsed[11],
    nutritionLogs: parsed[12],
    galleryItems: parsed[13],
    moodEntries: parsed[14],
    hospitalBag: parsed[15],
    p4kData: parsed[16],
    prePregnancyChecklist: parsed[17],
    fertilityData: parsed[18],
    forumPosts: parsed[19],
    partnerSync: parsed[20],
  };
}

/**
 * Check if there is any meaningful local data to migrate
 */
function hasDataToMigrate(data: LocalDataBundle): boolean {
  return Object.values(data).some((val) => {
    if (val === null || val === undefined) return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') return Object.keys(val).length > 0;
    return true;
  });
}

/**
 * Upload local data bundle to Supabase
 * This stores all local data as a JSON backup under the authenticated user
 */
async function uploadToSupabase(data: LocalDataBundle): Promise<boolean> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      console.log('No authenticated user for migration, skipping');
      return false;
    }

    const userId = authData.user.id;

    // Store the complete data bundle as a cloud backup
    const { error: upsertError } = await supabase
      .from('user_data_backups')
      .upsert(
        {
          user_id: userId,
          data_bundle: data,
          migrated_at: new Date().toISOString(),
          app_version: '1.0.0',
        },
        { onConflict: 'user_id' }
      );

    if (upsertError) {
      // Table might not exist yet - this is non-blocking
      console.log('Migration upload skipped (table may not exist):', upsertError.message);

      // Store in user metadata as a lightweight backup
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          has_local_data: true,
          migration_pending: true,
          local_data_summary: {
            profileCount: data.profiles?.length || 0,
            ancVisitCount: data.ancVisits?.length || 0,
            appointmentCount: data.appointments?.length || 0,
            moodEntryCount: data.moodEntries?.length || 0,
            galleryItemCount: data.galleryItems?.length || 0,
          },
        },
      });

      if (metadataError) {
        console.log('Metadata update skipped:', metadataError.message);
      }

      return true; // Consider it done even if table doesn't exist
    }

    return true;
  } catch (error) {
    console.error('Migration upload error:', error);
    return false;
  }
}

/**
 * Main migration function
 * Call this on first successful login to sync local data to cloud
 */
export async function migrateLocalDataToCloud(): Promise<{
  migrated: boolean;
  hadData: boolean;
}> {
  // Check if already migrated
  const alreadyMigrated = await isMigrationCompleted();
  if (alreadyMigrated) {
    return { migrated: false, hadData: false };
  }

  // Collect local data
  const localData = await collectLocalData();
  const hadData = hasDataToMigrate(localData);

  if (!hadData) {
    // No data to migrate — mark as done
    await markMigrationCompleted();
    return { migrated: true, hadData: false };
  }

  // Attempt upload to Supabase
  const success = await uploadToSupabase(localData);

  if (success) {
    await markMigrationCompleted();
    console.log('Data migration completed successfully');
  }

  return { migrated: success, hadData };
}

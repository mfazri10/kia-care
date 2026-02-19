// KIA Care - Global App Context

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppSettings, UserProfile, Phase } from '@/types';
import { getSettings, saveSettings, getProfiles, saveProfiles } from '@/utils/storage';

interface AppContextType {
  // State
  isLoading: boolean;
  settings: AppSettings;
  profiles: UserProfile[];
  activeProfile: UserProfile | null;

  // Actions
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  addProfile: (profile: UserProfile) => Promise<void>;
  updateProfile: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  setActiveProfile: (id: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  pinEnabled: false,
  biometricEnabled: false,
  activeProfileId: null,
  onboardingCompleted: false,
  notificationsEnabled: true,
  language: 'id',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  const activeProfile = profiles.find(p => p.id === settings.activeProfileId) || null;

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedSettings, savedProfiles] = await Promise.all([
        getSettings(),
        getProfiles(),
      ]);

      if (savedSettings) {
        setSettings(savedSettings as AppSettings);
      }
      if (savedProfiles) {
        setProfiles(savedProfiles as UserProfile[]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await saveSettings(newSettings);
  }, [settings]);

  const addProfile = useCallback(async (profile: UserProfile) => {
    const newProfiles = [...profiles, profile];
    setProfiles(newProfiles);
    await saveProfiles(newProfiles);
    // Auto-set as active if first profile
    if (newProfiles.length === 1) {
      await updateSettings({ activeProfileId: profile.id });
    }
  }, [profiles, updateSettings]);

  const updateProfile = useCallback(async (id: string, updates: Partial<UserProfile>) => {
    const newProfiles = profiles.map(p =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    setProfiles(newProfiles);
    await saveProfiles(newProfiles);
  }, [profiles]);

  const deleteProfile = useCallback(async (id: string) => {
    const newProfiles = profiles.filter(p => p.id !== id);
    setProfiles(newProfiles);
    await saveProfiles(newProfiles);
    // If deleted profile was active, set first profile as active
    if (settings.activeProfileId === id) {
      await updateSettings({
        activeProfileId: newProfiles.length > 0 ? newProfiles[0].id : null,
      });
    }
  }, [profiles, settings, updateSettings]);

  const setActiveProfile = useCallback(async (id: string) => {
    await updateSettings({ activeProfileId: id });
  }, [updateSettings]);

  const completeOnboarding = useCallback(async () => {
    await updateSettings({ onboardingCompleted: true });
  }, [updateSettings]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        isLoading,
        settings,
        profiles,
        activeProfile,
        updateSettings,
        addProfile,
        updateProfile,
        deleteProfile,
        setActiveProfile,
        completeOnboarding,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

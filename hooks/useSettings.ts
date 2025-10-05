import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export interface AppSettings {
  animationsEnabled: boolean;
  backgroundAnimationsEnabled: boolean;
  soundEnabled: boolean;
  hapticFeedbackEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  animationsEnabled: true,
  backgroundAnimationsEnabled: true,
  soundEnabled: true,
  hapticFeedbackEnabled: true,
};

const SETTINGS_STORAGE_KEY = '@app_settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load settings from storage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    saveSettings({ [key]: value });
  };

  const resetSettings = () => {
    saveSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    loading,
    updateSetting,
    saveSettings,
    resetSettings,
  };
};

// Global settings instance for easy access
let globalSettings: AppSettings = DEFAULT_SETTINGS;

export const getGlobalSettings = () => globalSettings;

export const updateGlobalSettings = (settings: AppSettings) => {
  globalSettings = settings;
};
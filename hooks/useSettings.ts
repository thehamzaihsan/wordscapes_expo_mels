import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export interface AppSettings {
  animationsEnabled: boolean;
  soundEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  useGestureWheel?: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  animationsEnabled: true,
  soundEnabled: true,
  hapticFeedbackEnabled: true,
  useGestureWheel: true,
};

const SETTINGS_STORAGE_KEY = '@app_settings';

// Global settings instance for easy access
let globalSettings: AppSettings = DEFAULT_SETTINGS;
let globalSettingsListeners: ((settings: AppSettings) => void)[] = [];

export const getGlobalSettings = () => globalSettings;

export const updateGlobalSettings = (settings: AppSettings) => {
  globalSettings = settings;
  globalSettingsListeners.forEach(listener => listener(settings));
};

export const subscribeToGlobalSettings = (listener: (settings: AppSettings) => void) => {
  globalSettingsListeners.push(listener);
  return () => {
    globalSettingsListeners = globalSettingsListeners.filter(l => l !== listener);
  };
};

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
      updateGlobalSettings(updatedSettings);
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

  const resetSettings = async () => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      setSettings(DEFAULT_SETTINGS);
      updateGlobalSettings(DEFAULT_SETTINGS);
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  // Update global settings when local settings change
  useEffect(() => {
    updateGlobalSettings(settings);
  }, [settings]);

  return {
    settings,
    loading,
    updateSetting,
    saveSettings,
    resetSettings,
  };
};
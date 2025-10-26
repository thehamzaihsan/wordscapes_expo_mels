import { CategoryType } from "@/hooks/useCurrentCategory";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

interface BackgroundContextType {
  selectedBackground: CategoryType | null;
  loading: boolean;
  saveBackground: (category: CategoryType | null) => Promise<void>;
  clearBackground: () => Promise<void>;
  refreshBackground: () => Promise<void>;
}

const BackgroundContext = createContext<BackgroundContextType | null>(null);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [selectedBackground, setSelectedBackground] = useState<CategoryType | null>(null);
  const [loading, setLoading] = useState(true);

  // Load background from storage
  const loadBackground = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem("selectedBackground");
      console.log(`[BackgroundProvider] Loaded from storage: ${saved}`);
      setSelectedBackground(saved as CategoryType | null);
    } catch (error) {
      console.warn("Failed to load background selection:", error);
      setSelectedBackground(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save background to storage
  const saveBackground = useCallback(async (category: CategoryType | null) => {
    try {
      if (category) {
        await AsyncStorage.setItem("selectedBackground", category);
        console.log(`[BackgroundProvider] Saved to storage: ${category}`);
      } else {
        await AsyncStorage.removeItem("selectedBackground");
        console.log(`[BackgroundProvider] Removed from storage`);
      }
      setSelectedBackground(category);
    } catch (error) {
      console.warn("Failed to save background selection:", error);
    }
  }, []);

  // Clear background selection
  const clearBackground = useCallback(async () => {
    await saveBackground(null);
  }, [saveBackground]);

  // Load on mount
  useEffect(() => {
    loadBackground();
  }, [loadBackground]);

  const value: BackgroundContextType = {
    selectedBackground,
    loading,
    saveBackground,
    clearBackground,
    refreshBackground: loadBackground,
  };

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackgroundSelection() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error("useBackgroundSelection must be used within a BackgroundProvider");
  }
  return context;
}
import { Difficulty } from "@/constants/difficulty";
import economy from "@/constants/economy.json";
import levelsData from "@/constants/levels.json";
import { initializeGameManager } from "@/hooks/game-manager";
import type { GuestMeta, GuestProgressPayload } from "@/hooks/guest-progress";
import {
    buildInitialProgress,
    loadGuestProgress,
    saveGuestProgress,
} from "@/hooks/guest-progress";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { getLocalSnapshot, pullRemote } from "@/lib/sync";
import type { LocalUserSnapshot } from "@/lib/syncTypes";
import { useFocusEffect } from "expo-router";
import React, { useState } from "react";

import { Platform, StatusBar, StyleSheet, View } from "react-native";

// Import the level components
import AdComponent from "../common/AdComponent";
import LoadingScreen from "../common/LoadingScreen";
import CategoryTabs from "../levels/CategoryTabs";
import LevelGrid from "../levels/LevelGrid";
import LevelHeader from "../levels/LevelHeader";

interface LevelData {
  level: number;
  baseWord: string;
  letters: string[];
  crosswordWords: string[];
  difficulty: Difficulty;
  isUnlocked?: boolean;
  isCompleted?: boolean;
}

interface LevelScreenProps {
  onNavigate: (
    screen: string,
    levelData?: {
      baseWord: string;
      difficulty: Difficulty;
      levelTitle: string;
      categoryName: string;
      levelData: {
        level: number;
        baseWord: string;
        letters: string[];
        crosswordWords: string[];
        difficulty: Difficulty;
      };
    }
  ) => void;
}

const LevelScreen: React.FC<LevelScreenProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Mountain");
  const [guestMeta, setGuestMeta] = useState<GuestMeta | null>(null);
  const [levelCategories, setLevelCategories] = useState<{
    [key: string]: LevelData[];
  }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [snapshotProfileName, setSnapshotProfileName] = useState<string | null>(
    null
  );
  const { user } = useSupabaseAuth();

  const authDisplayName = React.useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as Record<string, any>;
    const candidate =
      meta?.username || meta?.display_name || meta?.full_name || meta?.name;
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
    return null;
  }, [user]);

  const displayName = React.useMemo(() => {
    const candidates = [
      guestMeta?.playerName?.trim(),
      snapshotProfileName?.trim(),
      authDisplayName,
      user?.email ? user.email.split("@")[0] : null,
    ].filter((v): v is string => !!v && v.length > 0);
    return (candidates[0] || "Guest").toUpperCase();
  }, [
    guestMeta?.playerName,
    snapshotProfileName,
    authDisplayName,
    user?.email,
  ]);

  // Initialize game manager and load levels
  // Initial load + subsequent refresh when returning to this screen
  // Extracted load function so we can call it manually after returning from game
  const refreshProgress = React.useCallback(async () => {
    initializeGameManager();
    try {
      // ALWAYS load local progress first - it's the source of truth
      const existing = await loadGuestProgress();
      let progressToUse: GuestProgressPayload | null = existing;
      
      // Only pull snapshot if we need to initialize for the first time
      let snapshot: LocalUserSnapshot | null = null;
      if (
        !progressToUse ||
        !progressToUse.categories ||
        typeof progressToUse.categories !== "object" ||
        Array.isArray(progressToUse.categories) ||
        Object.keys(progressToUse.categories).length === 0
      ) {
        console.warn("Guest progress missing or invalid, pulling snapshot");
        if (user?.id) {
          try {
            snapshot = await pullRemote(user.id);
          } catch (err) {
            console.warn("Failed to pull remote snapshot", err);
          }
        }
        if (!snapshot) {
          snapshot = await getLocalSnapshot();
        }
        setSnapshotProfileName(snapshot?.profile?.username ?? null);
        
        console.warn("Rebuilding initial structure from snapshot");
        const preferredName = authDisplayName || snapshot?.profile?.username || undefined;
        let playerLevel = 0;
        if (snapshot?.stats?.xp) {
          const { derivePlayerLevel } = await import("@/hooks/guest-progress");
          const derived = derivePlayerLevel(snapshot.stats.xp);
          playerLevel = derived.level;
        }
        progressToUse = buildInitialProgress(levelsData as any, preferredName, playerLevel);
        // Only use snapshot XP/gems when building initial progress (no existing progress)
        if (snapshot?.stats?.xp) {
          progressToUse.meta.xp = snapshot.stats.xp;
          progressToUse.meta.gems = snapshot.stats.gems || 0;
          progressToUse.meta.playerLevel = playerLevel;
        }
        await saveGuestProgress(progressToUse);
      } else {
        // We have existing progress - just get snapshot for profile name if needed
        if (!snapshotProfileName) {
          if (user?.id) {
            try {
              snapshot = await pullRemote(user.id);
            } catch (err) {
              console.warn("Failed to pull remote snapshot", err);
            }
          }
          if (!snapshot) {
            snapshot = await getLocalSnapshot();
          }
          setSnapshotProfileName(snapshot?.profile?.username ?? null);
        }
      }
      
      // Update player name if needed (only during initial setup, not on every refresh)
      if (progressToUse && authDisplayName && !existing) {
        const currentName = (progressToUse.meta.playerName || "").trim();
        const isDefault = currentName.length === 0 || currentName.toLowerCase() === "guest";
        if (isDefault && currentName !== authDisplayName) {
          progressToUse.meta.playerName = authDisplayName;
          progressToUse.updatedAt = new Date().toISOString();
          await saveGuestProgress(progressToUse);
        }
      }
      
      // Ensure categories are unlocked
      const { ensureCategoriesUnlocked } = await import("@/hooks/guest-progress");
      progressToUse = await ensureCategoriesUnlocked(progressToUse);
      
      // Reload one final time to get the absolute latest data
      progressToUse = await loadGuestProgress() || progressToUse;
      const mapped: { [key: string]: LevelData[] } = {};
      Object.keys(progressToUse.categories).forEach((cat) => {
        mapped[cat] = progressToUse!.categories[cat].map((l) => ({
          level: l.level,
          baseWord: l.baseWord,
          letters: [],
          crosswordWords: [],
          difficulty: l.difficulty as Difficulty,
          isUnlocked: l.isUnlocked,
          isCompleted: l.isCompleted,
        }));
      });
      setLevelCategories(mapped);
      setGuestMeta(progressToUse.meta);
      
      console.log('[LevelScreen] Progress loaded and UI updated:', {
        gems: progressToUse.meta.gems,
        xp: progressToUse.meta.xp,
        playerLevel: progressToUse.meta.playerLevel,
        energy: progressToUse.meta.energy,
      });
      
      const { getUnlockedCategories } = await import("@/hooks/guest-progress");
      const unlockedCategories = getUnlockedCategories(progressToUse.meta.playerLevel);
      if (unlockedCategories.length > 0 && !unlockedCategories.includes(selectedCategory)) {
        setSelectedCategory(unlockedCategories[0]);
      }
    } catch (e) {
      console.error("Failed to refresh guest progress", e);
    }
  }, [authDisplayName, selectedCategory, user?.id]);

  // Initial + focus refresh
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        setIsLoading(true);
        await refreshProgress();
        if (mounted) setIsLoading(false);
      })();
      return () => {
        mounted = false;
      };
    }, [refreshProgress])
  );

  const handleShopPress = () => {
    onNavigate("shop");
  };

  const handleLevelPress = async (level: LevelData, categoryName: string) => {
    if (!level.isUnlocked || level.isCompleted) return;

    // Check if player has enough energy to play the level (but don't deduct yet)
    const energyCost = economy.energy.costPerLevel;
    const currentEnergy = guestMeta?.energy || 0;

    if (currentEnergy < energyCost) {
      // Show energy insufficient message or navigate to shop
      console.warn("Insufficient energy to play level", {
        required: energyCost,
        current: currentEnergy,
      });
      // For now, just prevent navigation. Could show a modal later.
      return;
    }

    // Retrieve full level definition (letters + crossword words) from static levels.json
    const categoryDefs: any[] = (levelsData as any)[categoryName] || [];
    const fullDef = categoryDefs.find((d) => d.level === level.level);
    const resolvedLetters: string[] =
      fullDef?.letters || fullDef?.baseWord?.split("") || [];
    const resolvedCrosswordWords: string[] = fullDef?.crosswordWords || [];

    onNavigate("game", {
      baseWord: level.baseWord,
      difficulty: level.difficulty,
      levelTitle: level.baseWord,
      categoryName,
      levelData: {
        level: level.level,
        baseWord: level.baseWord,
        letters: resolvedLetters,
        crosswordWords: resolvedCrosswordWords,
        difficulty: level.difficulty,
      },
    });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const adsEnabled = process.env.EXPO_PUBLIC_ENABLE_ADS === "1" || false;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121213" />

      <LevelHeader
        displayName={displayName}
        guestMeta={guestMeta}
        onBackPress={() => onNavigate("index")}
        onShopPress={handleShopPress}
        onProfilePress={() => onNavigate("profile")}
        onNavigate={onNavigate}
      />

      <CategoryTabs
        guestMeta={guestMeta}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      <LevelGrid
        selectedCategory={selectedCategory}
        levelCategories={levelCategories}
        guestMeta={guestMeta}
        onLevelPress={handleLevelPress}
      />
      {adsEnabled && <AdComponent />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    // Web: center the content with a max width for desktop layouts.
    // Mobile: take full width so the screen is visible on small devices.
    ...(Platform.OS === "web"
      ? { width: "100%", maxWidth: 1024, alignSelf: "center", paddingHorizontal: 12 }
      : { width: "100%" }),
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Loading styles removed - now using LoadingScreen component
});

export default LevelScreen;

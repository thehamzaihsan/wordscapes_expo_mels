import economy from "@/constants/economy.json";
import { Difficulty } from "@/constants/difficulty";
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
import { StatusBar, StyleSheet, Text, View } from "react-native";

// Import the level components
import CategoryTabs from "../levels/CategoryTabs";
import LevelGrid from "../levels/LevelGrid";
import LevelHeader from "../levels/LevelHeader";
import LoadingScreen from "../common/LoadingScreen";

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
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const load = async () => {
        setIsLoading(true);
        initializeGameManager();
        try {
          let snapshot: LocalUserSnapshot | null = null;
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
          if (!isMounted) return;
          setSnapshotProfileName(snapshot?.profile?.username ?? null);
          const existing = await loadGuestProgress();
          let progressToUse: GuestProgressPayload | null = existing;
          // Validate shape; if corrupted or missing categories rebuild
          if (
            !progressToUse ||
            !progressToUse.categories ||
            typeof progressToUse.categories !== "object" ||
            Array.isArray(progressToUse.categories) ||
            Object.keys(progressToUse.categories).length === 0
          ) {
            console.warn(
              "Guest progress missing or invalid, rebuilding initial structure"
            );
            const preferredName =
              authDisplayName || snapshot?.profile?.username || undefined;
            progressToUse = buildInitialProgress(
              levelsData as any,
              preferredName
            );
            
            // If we have a snapshot with XP, ensure categories are properly unlocked
            if (snapshot?.stats?.xp) {
              const { derivePlayerLevel, getUnlockedCategories } = await import(
                "@/hooks/guest-progress"
              );
              const derived = derivePlayerLevel(snapshot.stats.xp);
              progressToUse.meta.xp = snapshot.stats.xp;
              progressToUse.meta.playerLevel = derived.level;
              
              // Add any newly unlocked categories based on XP
              const unlockedCategories = getUnlockedCategories(progressToUse.meta.playerLevel);
              const levelDefinitions = levelsData as Record<string, any[]>;
              
              unlockedCategories.forEach((categoryName) => {
                if (!progressToUse!.categories[categoryName] && levelDefinitions[categoryName]) {
                  progressToUse!.categories[categoryName] = levelDefinitions[categoryName].map(
                    (lvl: any, idx: number) => ({
                      level: lvl.level ?? idx + 1,
                      baseWord: lvl.baseWord,
                      difficulty: lvl.difficulty,
                      isUnlocked: idx === 0, // unlock only first level of new category
                      isCompleted: false,
                      bestScore: 0,
                      attempts: 0,
                    })
                  );
                  console.log(
                    `[Category Unlock] Rebuilding progress - unlocked category: ${categoryName}`
                  );
                }
              });
            }
            
            await saveGuestProgress(progressToUse);
          }

          if (isMounted && progressToUse && authDisplayName) {
            const currentName = (progressToUse.meta.playerName || "").trim();
            const isDefault =
              currentName.length === 0 || currentName.toLowerCase() === "guest";
            if (isDefault && currentName !== authDisplayName) {
              progressToUse.meta.playerName = authDisplayName;
              progressToUse.updatedAt = new Date().toISOString();
              await saveGuestProgress(progressToUse);
            }
          }
          if (!isMounted) return;
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

          // Set initial category to first unlocked category
          const { getUnlockedCategories } = await import(
            "@/hooks/guest-progress"
          );
          const unlockedCategories = getUnlockedCategories(
            progressToUse.meta.playerLevel
          );
          if (
            unlockedCategories.length > 0 &&
            !unlockedCategories.includes(selectedCategory)
          ) {
            setSelectedCategory(unlockedCategories[0]);
          }
        } catch (e) {
          console.error("Failed to refresh guest progress", e);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      };
      load();
      return () => {
        isMounted = false;
      };
    }, [authDisplayName, selectedCategory, user?.id])
  );

  const handleShopPress = () => {
    onNavigate("shop");
  };

  const handleLevelPress = async (level: LevelData, categoryName: string) => {
    if (!level.isUnlocked || level.isCompleted) return;

    // Check if player has enough energy to play the level
    const energyCost = economy.energy.costPerLevel;
    const currentEnergy = guestMeta?.energy || 0;
    
    if (currentEnergy < energyCost) {
      // Show energy insufficient message or navigate to shop
      console.warn("Insufficient energy to play level", { 
        required: energyCost, 
        current: currentEnergy 
      });
      // For now, just prevent navigation. Could show a modal later.
      return;
    }

    // Deduct energy before starting the level
    const { deductEnergyForLevel } = await import("@/hooks/guest-progress");
    const energyDeducted = await deductEnergyForLevel();
    
    if (!energyDeducted) {
      console.warn("Failed to deduct energy for level");
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  // Loading styles removed - now using LoadingScreen component
});

export default LevelScreen;

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
import { getLocalSnapshot } from "@/lib/sync";
import { useFocusEffect } from "expo-router";
import React, { useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Import the new components
import LevelHeader from "./LevelHeader";
import CategoryTabs from "./CategoryTabs";
import LevelGrid from "./LevelGrid";

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
      authDisplayName,
      snapshotProfileName?.trim(),
      guestMeta?.playerName?.trim(),
      user?.email ? user.email.split("@")[0] : null,
    ].filter((v): v is string => !!v && v.length > 0);
    return (candidates[0] || "Guest").toUpperCase();
  }, [
    authDisplayName,
    snapshotProfileName,
    guestMeta?.playerName,
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
          const snapshot = await getLocalSnapshot();
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
            await saveGuestProgress(progressToUse);
          }

          if (
            isMounted &&
            progressToUse &&
            authDisplayName &&
            progressToUse.meta.playerName !== authDisplayName
          ) {
            progressToUse.meta.playerName = authDisplayName;
            progressToUse.updatedAt = new Date().toISOString();
            await saveGuestProgress(progressToUse);
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
          const { getUnlockedCategories } = await import('@/hooks/guest-progress');
          const unlockedCategories = getUnlockedCategories(progressToUse.meta.playerLevel);
          if (unlockedCategories.length > 0 && !unlockedCategories.includes(selectedCategory)) {
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
    }, [authDisplayName, selectedCategory])
  );

  const handleShopPress = () => {
    onNavigate("shop");
  };

  const handleLevelPress = (level: LevelData, categoryName: string) => {
    if (!level.isUnlocked) return;

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
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#121213" />
        <Text style={styles.loadingText}>Loading levels...</Text>
      </View>
    );
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    backgroundColor: "#121213",
  },
  loadingText: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default LevelScreen;

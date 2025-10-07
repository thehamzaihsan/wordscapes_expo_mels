import { Difficulty, getDifficultyConfig } from "@/constants/difficulty";
import economy from "@/constants/economy.json";
import levelsData from "@/constants/levels.json";
import { initializeGameManager } from "@/hooks/game-manager";
import type { GuestMeta, GuestProgressPayload } from "@/hooks/guest-progress";
import {
  buildInitialProgress,
  derivePlayerLevel,
  loadGuestProgress,
  saveGuestProgress,
} from "@/hooks/guest-progress";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { getLocalSnapshot } from "@/lib/sync";
import { useFocusEffect } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Storage key managed by guest-progress hook

interface LevelData {
  level: number;
  baseWord: string;
  letters: string[];
  crosswordWords: string[];
  difficulty: Difficulty;
  isUnlocked?: boolean;
  isCompleted?: boolean;
}

interface LevelCardProps {
  level: LevelData;
  categoryName: string;
  onPress: (level: LevelData, categoryName: string) => void;
}

interface LevelScreenProps {
  onNavigate: (
    screen: string,
    levelData?: {
      baseWord: string;
      difficulty: Difficulty;
      levelTitle: string;
      categoryName: string; // LOCAL STORAGE: Pass category name to GameScreen
      levelData: {
        level: number; // LOCAL STORAGE: Pass level number to GameScreen
        baseWord: string;
        letters: string[];
        crosswordWords: string[];
        difficulty: Difficulty;
      };
    }
  ) => void;
}

const LevelScreen: React.FC<LevelScreenProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Forest");
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
    }, [authDisplayName])
  );

  const getDifficultyColor = (difficulty: Difficulty): string => {
    const config = getDifficultyConfig(difficulty);
    return config.color;
  };

  const handleLevelPress = (level: LevelData, categoryName: string): void => {
    if (level.isUnlocked) {
      if ((guestMeta?.energy ?? 0) < 10) {
        Alert.alert(
          "Not enough energy!",
          "Wait or buy more energy to continue playing."
        );
      } else {
        console.log(
          `🎮 Selected level: ${level.baseWord} (${level.difficulty}) from ${categoryName}`
        );
        console.log(`📊 Level data:`, level);

        // Retrieve full level definition (letters + crossword words) from static levels.json
        const categoryDefs: any[] = (levelsData as any)[categoryName] || [];
        const fullDef = categoryDefs.find((d) => d.level === level.level);
        const resolvedLetters: string[] =
          fullDef?.letters || fullDef?.baseWord?.split("") || [];
        const resolvedCrosswordWords: string[] = fullDef?.crosswordWords || [];

        // Navigate to game with complete level data
        onNavigate("game", {
          baseWord: level.baseWord,
          difficulty: level.difficulty,
          levelTitle: `${level.baseWord} - Level ${level.level}`,
          categoryName,
          levelData: {
            level: level.level,
            baseWord: level.baseWord,
            letters: resolvedLetters,
            crosswordWords: resolvedCrosswordWords,
            difficulty: level.difficulty,
          },
        });
      }
    } else {
      Alert.alert("Locked", "Complete the previous level to unlock this one.");
    }
  };

  const handleShopPress = (): void => {
    onNavigate("shop");
  };

  const LevelCard: React.FC<LevelCardProps> = ({
    level,
    categoryName,
    onPress,
  }) => {
    const difficultyColor = getDifficultyColor(level.difficulty);
    const difficultyConfig = getDifficultyConfig(level.difficulty);

    return (
      <TouchableOpacity
        onPress={() => onPress(level, categoryName)}
        style={[styles.levelCard, !level.isUnlocked && styles.levelCardLocked]}
        activeOpacity={0.8}
      >
        {/* Lock Overlay */}
        {!level.isUnlocked && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockText}>Locked</Text>
          </View>
        )}

        {/* Level Content */}
        <View style={styles.levelContent}>
          {/* Header */}
          <View style={styles.levelHeader}>
            <Text
              style={[
                styles.levelName,
                !level.isUnlocked && styles.levelNameLocked,
              ]}
            >
              {level.baseWord}
            </Text>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: difficultyColor },
              ]}
            >
              <Text style={styles.difficultyText}>
                {difficultyConfig.icon} {difficultyConfig.label}
              </Text>
            </View>
          </View>

          {/* Level Info */}
          <View style={styles.levelInfo}>
            <Text style={styles.levelNumber}>Level {level.level}</Text>
            {/* Reward Info - only show for uncompleted levels */}
            {!level.isCompleted && (
              <View style={styles.rewardContainer}>
                <Text style={styles.rewardText}>+{economy.gems.earnPerLevel} 💎</Text>
              </View>
            )}
            {/* Completed indicator */}
            {level.isCompleted && (
              <View style={styles.completedRewardContainer}>
                <Text style={styles.completedRewardText}>Completed ✓</Text>
              </View>
            )}
          </View>

          {/* Status Badge */}
          <View style={styles.statusSection}>
            {level.isCompleted ? (
              <View style={[styles.statusBadge, styles.completedBadge]}>
                <Text style={styles.statusText}>✓ Replay Available</Text>
              </View>
            ) : level.isUnlocked ? (
              <View style={[styles.statusBadge, styles.newBadge]}>
                <Text style={styles.statusText}>Ready to Play</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.inProgressBadge]}>
                <Text style={styles.statusText}>Locked</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121213" />

      {/* Header */}
      <View style={styles.header}>
        {/* Top Row: Back Button on left, Resources and Avatar on right */}
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => onNavigate("index")}
          >
            <ChevronLeft size={20} color="white" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <View style={styles.resourcesContainer}>
            <TouchableOpacity
              style={styles.resourceItem}
              onPress={handleShopPress}
              activeOpacity={0.7}
            >
              <Text style={styles.resourceIcon}>💎</Text>
              <Text style={styles.resourceText}>{guestMeta?.gems ?? 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceItem}
              onPress={handleShopPress}
              activeOpacity={0.7}
            >
              <Text style={styles.resourceIcon}>🟡</Text>
              <Text
                style={[
                  styles.resourceText,
                  {
                    color:
                      (guestMeta?.energy ?? 0) > 50 ? "#10B981" : "#EF4444",
                  },
                ]}
              >
                {guestMeta?.energy ?? 0}/100
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onNavigate("profile")}
              style={styles.avatarButton}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarIcon}>{guestMeta?.avatar || "🧩"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.playerInfo}>
          <Text
            style={styles.playerName}
            onLongPress={async () => {
              const gp = await loadGuestProgress();
              console.log("[DEBUG] Guest progress:", gp);
              Alert.alert("Debug", "Guest progress logged to console.");
            }}
          >
            {displayName}
          </Text>
          <Text style={styles.playerLevel}>
            Lvl {guestMeta?.playerLevel ?? 0}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.xpContainer}>
          {(() => {
            const xp = guestMeta?.xp ?? 0;
            const derived = derivePlayerLevel(xp);
            const within = derived.levelXp;
            const needed = derived.nextLevelXp;
            const pct = Math.min(100, Math.max(0, (within / needed) * 100));
            return (
              <>
                <Text style={styles.xpLabel}>
                  {within}/{needed} XP (Total {xp})
                </Text>
                <View style={styles.xpBarContainer}>
                  <View style={styles.xpBarBackground}>
                    <View style={[styles.xpBar, { width: `${pct}%` }]} />
                  </View>
                </View>
              </>
            );
          })()}
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {Object.keys(levelCategories).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                selectedCategory === category && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category === "Forest"
                  ? "🌲"
                  : category === "Ocean"
                  ? "🌊"
                  : "🏔️"}{" "}
                {category.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Level Cards */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading levels...</Text>
          </View>
        ) : levelCategories[selectedCategory]?.length > 0 ? (
          levelCategories[selectedCategory].map((level) => (
            <LevelCard
              key={`${selectedCategory}-${level.level}`}
              level={level}
              categoryName={selectedCategory}
              onPress={handleLevelPress}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No levels available in {selectedCategory}
            </Text>
            <Text style={styles.emptySubtext}>
              Check back later for new content!
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    backgroundColor: "rgba(31,41,55,0.85)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#374151",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    paddingEnd: 16,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  resourcesContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  resourceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  resourceIcon: {
    fontSize: 16,
  },
  resourceText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  playerInfo: {
    alignItems: "center",
    marginBottom: 12,
  },
  playerName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  playerLevel: {
    color: "#8B5CF6",
    fontSize: 14,
    fontWeight: "600",
  },
  xpContainer: {
    gap: 6,
  },
  xpLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
  },
  xpBarContainer: {
    alignItems: "center",
  },
  xpBarBackground: {
    width: "80%",
    height: 8,
    backgroundColor: "rgba(55,65,81,0.85)",
    borderRadius: 4,
    overflow: "hidden",
  },
  xpBar: {
    height: "100%",
    backgroundColor: "rgba(139,92,246,0.7)",
    borderRadius: 4,
  },
  categoryContainer: {
    backgroundColor: "rgba(31,41,55,0.85)",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(55,65,81,0.85)",
  },
  categoryTabActive: {
    backgroundColor: "rgba(139,92,246,0.7)",
  },
  categoryText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "bold",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  levelCard: {
    backgroundColor: "rgba(31,41,55,0.85)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#374151",
    overflow: "hidden",
    position: "relative",
  },
  levelCardLocked: {
    opacity: 0.6,
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  lockIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  lockText: {
    color: "#9CA3AF",
    fontSize: 16,
    fontWeight: "600",
  },
  levelContent: {
    padding: 20,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  levelName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  levelNameLocked: {
    color: "#6B7280",
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  levelInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  levelNumber: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "500",
  },
  statusSection: {
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  progressSection: {
    gap: 12,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    color: "#D1D5DB",
    fontSize: 14,
  },
  progressPercent: {
    color: "#8B5CF6",
    fontSize: 14,
    fontWeight: "bold",
  },
  progressBarContainer: {
    marginVertical: 4,
  },
  progressBarBackground: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(55,65,81,0.85)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  starsAndRewardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rewardContainer: {
    backgroundColor: "rgba(31,41,55,0.85)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  rewardText: {
    color: "#F59E0B",
    fontSize: 15,
    fontWeight: "600",
  },
  completedRewardContainer: {
    backgroundColor: "rgba(16,185,129,0.15)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  completedRewardText: {
    color: "#10B981",
    fontSize: 15,
    fontWeight: "600",
  },
  statusContainer: {
    alignItems: "center",
  },
  // statusBadge: duplicate removed
  completedBadge: {
    backgroundColor: "rgba(16,185,129,0.7)",
  },
  inProgressBadge: {
    backgroundColor: "rgba(59,130,246,0.7)",
  },
  newBadge: {
    backgroundColor: "rgba(139,92,246,0.7)",
  },
  // statusText: duplicate removed
  bottomSpacing: {
    height: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  avatarButton: {
    width: 37,
    height: 37,
    borderRadius: 100,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#8B5CF6",
  },
  avatarIcon: {
    fontSize: 20,
  },
});

export default LevelScreen;

import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import LevelCard from "./LevelCard";
import { Difficulty } from "@/constants/difficulty";

interface LevelData {
  level: number;
  baseWord: string;
  letters: string[];
  crosswordWords: string[];
  difficulty: Difficulty;
  isUnlocked?: boolean;
  isCompleted?: boolean;
}

interface LevelGridProps {
  selectedCategory: string;
  levelCategories: { [key: string]: LevelData[] };
  guestMeta: any;
  onLevelPress: (level: LevelData, categoryName: string) => void;
}

const LevelGrid: React.FC<LevelGridProps> = ({
  selectedCategory,
  levelCategories,
  guestMeta,
  onLevelPress,
}) => {
  const { getUnlockedCategories } = require('@/hooks/guest-progress');
  
  const currentLevels = levelCategories[selectedCategory] || [];
  const unlockedCategories = getUnlockedCategories(guestMeta?.playerLevel || 0);
  const isCategoryUnlocked = unlockedCategories.includes(selectedCategory);

  // Show empty state when no levels are available
  if (currentLevels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No levels available</Text>
        <Text style={styles.emptySubtext}>
          Check back later for new content!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isCategoryUnlocked && (
        <BlurView intensity={10} style={styles.blurOverlay}>
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockTitle}>Category Locked</Text>
            <Text style={styles.lockSubtitle}>
              Play more levels to unlock {selectedCategory}!
            </Text>
            <Text style={styles.lockRequirement}>
              Required: Player Level {(() => {
                const { getCategoryOrder, xpNeededToUnlockCategory, derivePlayerLevel } = require('@/hooks/guest-progress');
                const categoryOrder = getCategoryOrder();
                const categoryIndex = categoryOrder.indexOf(selectedCategory);
                const requiredXP = xpNeededToUnlockCategory(categoryIndex);
                return requiredXP > 0 ? derivePlayerLevel(requiredXP).level : 0;
              })()}
            </Text>
            <Text style={styles.currentLevel}>
              Current Level: {guestMeta?.playerLevel || 0}
            </Text>
          </View>
        </BlurView>
      )}
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentLevels.map((level) => (
          <LevelCard
            key={level.level}
            level={level}
            categoryName={selectedCategory}
            onPress={onLevelPress}
          />
        ))}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  blurOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  lockOverlay: {
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    marginHorizontal: 20,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  lockTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  lockSubtitle: {
    color: "#D1D5DB",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  lockRequirement: {
    color: "#8B5CF6",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  currentLevel: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
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
  bottomSpacing: {
    height: 40,
  },
});

export default LevelGrid;
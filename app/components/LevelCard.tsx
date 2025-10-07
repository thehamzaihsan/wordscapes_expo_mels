import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Difficulty, getDifficultyConfig } from "@/constants/difficulty";
import economy from "@/constants/economy.json";

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

const LevelCard: React.FC<LevelCardProps> = ({ level, categoryName, onPress }) => {
  const getDifficultyColor = (difficulty: Difficulty): string => {
    const config = getDifficultyConfig(difficulty);
    return config.color;
  };

  const handleShopPress = () => {
    // Handle shop press if needed
    console.log("Shop pressed from level card");
  };

  if (!level.isUnlocked) {
    return (
      <View style={[styles.levelCard, styles.lockedCard]}>
        <View style={styles.lockOverlay}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockText}>Locked</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.levelCard,
        !level.isUnlocked && styles.levelCardLocked,
      ]}
      onPress={() => onPress(level, categoryName)}
      disabled={!level.isUnlocked}
      activeOpacity={0.8}
    >
      <View style={styles.levelContent}>
        {/* Level Header */}
        <View style={styles.levelHeader}>
          <Text
            style={[
              styles.levelName,
              !level.isUnlocked && styles.levelNameLocked,
            ]}
            numberOfLines={1}
          >
            {level.baseWord}
          </Text>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(level.difficulty) },
            ]}
          >
            <Text style={styles.difficultyText}>
              {level.difficulty.toUpperCase()}
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

const styles = StyleSheet.create({
  levelCard: {
    backgroundColor: "rgba(31,41,55,0.85)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#374151",
    overflow: "hidden",
  },
  levelCardLocked: {
    opacity: 0.6,
  },
  lockedCard: {
    backgroundColor: "rgba(31,41,55,0.4)",
    borderColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 140,
  },
  lockOverlay: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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
  completedBadge: {
    backgroundColor: "rgba(16,185,129,0.7)",
  },
  inProgressBadge: {
    backgroundColor: "rgba(59,130,246,0.7)",
  },
  newBadge: {
    backgroundColor: "rgba(139,92,246,0.7)",
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
});

export default LevelCard;
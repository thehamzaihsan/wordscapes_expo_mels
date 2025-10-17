import { Difficulty } from "@/constants/difficulty";
import economy from "@/constants/economy.json";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import ThemedCard from "../ui/ThemedCard";
import ThemedText from "../ui/ThemedText";

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
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  
  const getDifficultyColor = (difficulty: Difficulty): string => {
    // Use theme difficulty colors
    switch (difficulty) {
      case 'easy':
        return theme.colors.easy;
      case 'medium':
        return theme.colors.medium;
      case 'hard':
        return theme.colors.hard;
      default:
        return theme.colors.medium;
    }
  };

  if (!level.isUnlocked) {
    return (
      <ThemedCard variant="glassStrong" padding="lg" style={styles.lockedCard}>
        <View style={styles.lockOverlay}>
          <ThemedText variant="heading1" color="textInverse">🔒</ThemedText>
          <ThemedText variant="body2" color="textSecondary">
            Locked
          </ThemedText>
        </View>
      </ThemedCard>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => onPress(level, categoryName)}
      disabled={!level.isUnlocked || level.isCompleted}
      activeOpacity={0.8}
    >
      <ThemedCard
        variant="glassStrong"
        padding="lg"
        style={[
          styles.levelCard,
          !level.isUnlocked && styles.levelCardLocked,
        ]}
      >
        <View style={styles.levelContent}>
          {/* Level Header */}
          <View style={styles.levelHeader}>
            <ThemedText
              variant="heading4"
              color={!level.isUnlocked ? "textTertiary" : "text"}
              weight="bold"
              style={styles.levelName}
            >
              {level.baseWord}
            </ThemedText>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(level.difficulty) },
              ]}
            >
              <ThemedText variant="caption" color="textInverse" weight="semibold">
                {level.difficulty.toUpperCase()}
              </ThemedText>
            </View>
          </View>

          {/* Level Info */}
          <View style={styles.levelInfo}>
            <ThemedText variant="body2" color="textSecondary">
              Level {level.level}
            </ThemedText>
            {/* Reward Info - only show for uncompleted levels */}
            {!level.isCompleted && (
              <View style={styles.rewardContainer}>
                <ThemedText variant="body2" color="warning">
                  +{economy.gems.earnPerLevel} 💎
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </ThemedCard>
    </TouchableOpacity>
  );
};

const createStyles = (theme: any) => ({
  levelCard: {
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  levelCardLocked: {
    opacity: 0.6,
  },
  lockedCard: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    minHeight: 140,
  },
  lockOverlay: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  levelContent: {
    // Padding is handled by ThemedCard
  },
  levelHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.base,
  },
  levelName: {
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  levelInfo: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.md,
  },
  rewardContainer: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
});

export default LevelCard;
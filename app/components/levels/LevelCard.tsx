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
  guestMeta?: any; // Add guestMeta to access energy
  onPress: (level: LevelData, categoryName: string) => void;
}

const LevelCard: React.FC<LevelCardProps> = ({ level, categoryName, guestMeta, onPress }) => {
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

  // Check energy requirements
  const energyCost = economy.energy.costPerLevel;
  const currentEnergy = guestMeta?.energy || 0;
  const hasEnoughEnergy = currentEnergy >= energyCost;

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

  // Show energy insufficient state for unlocked levels that can't be played
  if (level.isUnlocked && !level.isCompleted && !hasEnoughEnergy) {
    return (
      <ThemedCard variant="glassStrong" padding="lg" style={styles.energyInsufficientCard}>
        <View style={styles.energyInsufficientOverlay}>
          <ThemedText variant="heading1" color="textInverse">⚡</ThemedText>
          <ThemedText variant="body2" color="textSecondary">
            Need {energyCost} Energy
          </ThemedText>
        </View>
      </ThemedCard>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => onPress(level, categoryName)}
      disabled={!level.isUnlocked || level.isCompleted || !hasEnoughEnergy}
      activeOpacity={0.8}
    >
      <ThemedCard
        variant="glassStrong"
        padding="lg"
        style={[
          styles.levelCard,
          !level.isUnlocked && styles.levelCardLocked,
          !hasEnoughEnergy && level.isUnlocked && !level.isCompleted && styles.levelCardEnergyInsufficient,
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
  levelCardEnergyInsufficient: {
    opacity: 0.7,
  },
  lockedCard: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    minHeight: 140,
  },
  energyInsufficientCard: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    minHeight: 140,
    opacity: 0.8,
    backgroundColor: 'rgba(255, 165, 0, 0.1)', // Orange tint for energy warning
  },
  lockOverlay: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  energyInsufficientOverlay: {
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
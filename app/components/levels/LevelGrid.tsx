import React from "react";
import { View, ScrollView } from "react-native";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { Lock, TrendingUp, Zap } from "lucide-react-native";
import LevelCard from "./LevelCard";
import { Difficulty } from "@/constants/difficulty";
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
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { getUnlockedCategories } = require('@/hooks/guest-progress');
  
  const allCurrentLevels = levelCategories[selectedCategory] || [];
  // Filter out completed levels - show locked and unlocked levels that haven't been completed
  const currentLevels = allCurrentLevels.filter(level => 
    !level.isCompleted
  );
  const unlockedCategories = getUnlockedCategories(guestMeta?.playerLevel || 0);
  const isCategoryUnlocked = unlockedCategories.includes(selectedCategory);

  // Show empty state when no levels are available or all levels are completed
  if (currentLevels.length === 0) {
    // Check if there are levels but they're all completed
    const hasCompletedLevels = allCurrentLevels.some(level => level.isCompleted);
    const allLevelsCompleted = allCurrentLevels.length > 0 && allCurrentLevels.every(level => level.isCompleted);
    
    return (
      <View style={styles.emptyContainer}>
        <ThemedCard variant="glassStrong" padding="xl" style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <ThemedText variant="heading1" style={styles.emptyIcon}>
              {allLevelsCompleted ? "🏆" : "🎯"}
            </ThemedText>
            <ThemedText variant="heading3" weight="bold" align="center" style={styles.emptyTitle}>
              {allLevelsCompleted ? "Category Complete!" : "No levels available"}
            </ThemedText>
            <ThemedText variant="body2" align="center" color="textSecondary" style={styles.emptySubtext}>
              {allLevelsCompleted 
                ? "Congratulations! You've completed all levels in this category." 
                : "Check back later for new content!"
              }
            </ThemedText>
          </View>
        </ThemedCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isCategoryUnlocked && (
        <View style={styles.lockOverlayContainer}>
          <ThemedCard variant="glassStrong" padding="xl" style={styles.lockCard}>
            <View style={styles.lockContent}>
              <Lock size={48} color={theme.colors.primary} style={styles.lockIcon} />
              
              <ThemedText variant="heading3" weight="bold" align="center" style={styles.lockTitle}>
                Category Locked
              </ThemedText>
              
              <ThemedText variant="body2" align="center" color="textSecondary" style={styles.lockSubtitle}>
                Play more levels to unlock {selectedCategory}!
              </ThemedText>
              
              {(() => {
                const { getCategoryOrder, xpNeededToUnlockCategory, derivePlayerLevel } = require('@/hooks/guest-progress');
                const categoryOrder = getCategoryOrder();
                const categoryIndex = categoryOrder.indexOf(selectedCategory);
                const requiredXP = xpNeededToUnlockCategory(categoryIndex);
                const requiredLevel = requiredXP > 0 ? derivePlayerLevel(requiredXP).level : 0;
                const currentXP = guestMeta?.xp || 0;
                const xpRemaining = Math.max(0, requiredXP - currentXP);
                const progressPercent = requiredXP > 0 ? Math.min(100, (currentXP / requiredXP) * 100) : 100;
                
                return (
                  <View style={styles.progressInfo}>
                    <View style={styles.levelRequirement}>
                      <TrendingUp size={20} color={theme.colors.primary} />
                      <ThemedText variant="body1" weight="semibold" color="primary" style={styles.lockRequirementText}>
                        Required: Player Level {requiredLevel}
                      </ThemedText>
                    </View>
                    
                    <ThemedText variant="body2" color="textSecondary" style={styles.currentLevelText}>
                      Current Level: {guestMeta?.playerLevel || 0}
                    </ThemedText>
                    
                    <View style={styles.xpSection}>
                      <View style={styles.xpHeader}>
                        <Zap size={16} color={theme.colors.warning} />
                        <ThemedText variant="body2" weight="bold" color="warning">
                          {xpRemaining} XP needed
                        </ThemedText>
                      </View>
                      
                      <ThemedText variant="caption" color="textTertiary" style={styles.xpCurrentText}>
                        {currentXP} / {requiredXP} XP
                      </ThemedText>
                      
                      {/* XP Progress Bar */}
                      <View style={styles.xpProgressContainer}>
                        <View style={[styles.xpProgressBackground, { backgroundColor: theme.colors.backgroundSecondary }]}>
                          <View style={[
                            styles.xpProgressBar, 
                            { 
                              width: `${progressPercent}%`,
                              backgroundColor: theme.colors.primary 
                            }
                          ]} />
                        </View>
                        <ThemedText variant="caption" color="primary" weight="medium" style={styles.xpProgressText}>
                          {Math.round(progressPercent)}%
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>
          </ThemedCard>
        </View>
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
            guestMeta={guestMeta}
            onPress={onLevelPress}
          />
        ))}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => ({
  container: {
    flex: 1,
    position: 'relative' as const,
  },
  lockOverlayContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: theme.spacing.lg,
  },
  lockCard: {
    maxWidth: 400,
    width: '100%',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  lockContent: {
    alignItems: 'center' as const,
  },
  lockIcon: {
    marginBottom: theme.spacing.lg,
  },
  lockTitle: {
    marginBottom: theme.spacing.sm,
  },
  lockSubtitle: {
    marginBottom: theme.spacing.xl2,
    lineHeight: 22,
  },
  progressInfo: {
    alignItems: 'center' as const,
    width: '100%',
    gap: theme.spacing.md,
  },
  levelRequirement: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.sm,
  },
  lockRequirementText: {
    // No additional styles needed
  },
  currentLevelText: {
    // No additional styles needed
  },
  xpSection: {
    width: '100%',
    alignItems: 'center' as const,
    gap: theme.spacing.sm,
  },
  xpHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
  },
  xpCurrentText: {
    // No additional styles needed
  },
  xpProgressContainer: {
    width: '100%',
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
  },
  xpProgressBackground: {
    width: '100%',
    height: 12,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  xpProgressBar: {
    height: '100%',
    borderRadius: theme.borderRadius.md,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  xpProgressText: {
    // No additional styles needed
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl4,
  },
  emptyCard: {
    maxWidth: 320,
    width: '100%',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  emptyContent: {
    alignItems: 'center' as const,
  },
  emptyIcon: {
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    lineHeight: 20,
  },
  bottomSpacing: {
    height: theme.spacing.xl2,
  },
});

export default LevelGrid;
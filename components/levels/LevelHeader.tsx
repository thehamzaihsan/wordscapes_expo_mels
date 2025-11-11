import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import ThemedButton from "../ui/ThemedButton";
import ThemedCard from "../ui/ThemedCard";
import ThemedText from "../ui/ThemedText";

interface LevelHeaderProps {
  displayName: string;
  guestMeta: any;
  onBackPress: () => void;
  onShopPress: () => void;
  onProfilePress: () => void;
  onNavigate: (screen: string) => void;
}

const LevelHeader: React.FC<LevelHeaderProps> = ({
  displayName,
  guestMeta,
  onBackPress,
  onShopPress,
  onProfilePress,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { derivePlayerLevel } = require('@/hooks/guest-progress');
  
  return (
    <ThemedCard variant="glassStrong" padding="md" style={styles.header}>
      {/* Top Row: Back Button on left, Resources and Avatar on right */}
      <View style={styles.headerTop}>
        <ThemedButton
          title="Back"
          variant="glass"
          size="sm"
          leftIcon={<ChevronLeft size={20} color={theme.colors.text} />}
          onPress={onBackPress}
          style={styles.backButton}
        />
        
        <View style={styles.resourcesContainer}>
          <TouchableOpacity
            style={[styles.resourceItem, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}
            onPress={onShopPress}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.resourceIcon}>💎</ThemedText>
            <ThemedText variant="body2" weight="semibold" style={styles.resourceText as any}>
              {guestMeta?.gems ?? 0}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resourceItem, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}
            onPress={onShopPress}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.resourceIcon}>⚡</ThemedText>
            <ThemedText
              variant="body2"
              weight="semibold"
              style={{
                ...(styles.resourceText as any),
                color:
                  (guestMeta?.energy ?? 0) > 50
                    ? theme.colors.success
                    : theme.colors.error,
              }}
            >
              {guestMeta?.energy ?? 0}/100
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onProfilePress}
            style={[styles.avatarButton, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.primary }]}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.avatarIcon}>{guestMeta?.avatar || "🧩"}</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Player Info */}
      <View style={styles.playerInfo}>
  <ThemedText variant="heading3" weight="bold" style={styles.playerName as any}>
          {displayName}
        </ThemedText>
        <View style={styles.levelContainer}>
        <ThemedText variant="body1" weight="semibold" color="primary" style={styles.levelText}>
          XP Level {guestMeta?.playerLevel ?? 0}
        </ThemedText>
        <ThemedButton
          title="Change Background"
          variant="ghost"
          size="sm"
          onPress={() => onNavigate('backgrounds')}
        />
      </View>
        
        {/* XP Progress Bar */}
        {(() => {
          const xp = guestMeta?.xp ?? 0;
          const derived = derivePlayerLevel(xp);
          const currentLevel = derived.level;
          const progressInCurrentLevel = derived.levelXp;
          const xpNeededForNextLevel = derived.nextLevelXp;
          const progressPercentage = Math.min(100, Math.max(0, (progressInCurrentLevel / xpNeededForNextLevel) * 100));
          
          // Check next category unlock
          const { getCategoryOrder, getUnlockedCategories, xpNeededToUnlockCategory } = require('@/hooks/guest-progress');
          const categoryOrder = getCategoryOrder();
          const unlockedCategories = getUnlockedCategories(currentLevel);
          const nextCategoryIndex = unlockedCategories.length;
          const nextCategory = categoryOrder[nextCategoryIndex];
          const nextCategoryXP = nextCategory ? xpNeededToUnlockCategory(nextCategoryIndex) : 0;
          const nextCategoryRemaining = Math.max(0, nextCategoryXP - xp);
          
          return (
            <>
              <View style={styles.xpLabelContainer}>
                <View style={styles.xpInfoContainer}>
                  <ThemedText variant="caption" color="textSecondary" style={styles.xpLabel}>
                    XP Level {currentLevel} Progress
                  </ThemedText>
                  <ThemedText variant="caption" color="textTertiary" style={styles.xpNumbers}>
                    {progressInCurrentLevel} / {xpNeededForNextLevel} XP
                  </ThemedText>
                </View>
                <ThemedButton
                  title="⚡ Buy XP"
                  variant="outline"
                  size="sm"
                  onPress={() => onNavigate('xpshop')}
                  style={{
                    ...styles.buyXpButton,
                    borderColor: theme.colors.primary,
                  }}
                />
              </View>
              
              {/* Progress Bar */}
              <View style={styles.xpBarContainer}>
                <View
                  style={{
                    ...styles.xpBarBackground,
                    backgroundColor: theme.colors.border,
                    position: 'relative',
                  }}
                >
                  <View
                    style={{
                      ...(styles.xpBar as any),
                      backgroundColor: theme.colors.primary,
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: `${progressPercentage}%`,
                    }}
                  />
                </View>
          <ThemedText variant="caption" color="primary" weight="medium" style={styles.progressText as any}>
                  {Math.round(progressPercentage)}% to XP Level {currentLevel + 1}
                </ThemedText>
              </View>
              
              {nextCategory && nextCategoryRemaining > 0 && (
                <View style={styles.nextUnlockContainer}>
                  <ThemedText variant="caption" color="primary" weight="semibold" style={styles.nextUnlockText}>
                    🔓 Next: {nextCategory} category ({nextCategoryRemaining} XP needed)
                  </ThemedText>
                </View>
              )}
            </>
          );
        })()}
      </View>
    </ThemedCard>
  );
};

const createStyles = (theme: any) => ({
  header: {
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderRadius: 0,
  },
  headerTop: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.sm,
  },
  backButton: {
    alignSelf: 'flex-start' as const,
  },
  resourcesContainer: {
    flexDirection: 'row' as const,
    gap: theme.spacing.xs,
    alignItems: 'center' as const,
  },
  resourceItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.lg,
    gap: 4,
    borderWidth: 1,
  },
  resourceIcon: {
    fontSize: 14,
  },
  resourceText: {
    fontSize: 12,
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
  },
  avatarIcon: {
    fontSize: 18,
  },
  playerInfo: {
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: theme.spacing.xs,
  },
  playerName: {
    fontSize: 18,
  },
  levelContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
  },
  levelText: {
    fontSize: 14,
  },
  xpLabelContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.xs,
    width: '100%' as const,
  },
  xpInfoContainer: {
    flex: 1,
    alignItems: 'flex-start' as const,
  },
  xpLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  xpNumbers: {
    fontSize: 11,
  },
  buyXpButton: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
  },
  xpBarContainer: {
    alignItems: 'center' as const,
    width: '100%' as const,
    marginBottom: 6,
  },
  xpBarBackground: {
    width: '100%' as const,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden' as const,
    borderWidth: 1,
    marginBottom: theme.spacing.xs,
  },
  xpBar: {
    height: '100%',
    borderRadius: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  nextUnlockContainer: {
    width: '100%' as const,
    alignItems: 'center' as const,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '40',
  },
  nextUnlockText: {
    fontSize: 10,
    textAlign: 'center' as const,
    fontWeight: '600' as const,
  },
});

export default LevelHeader;
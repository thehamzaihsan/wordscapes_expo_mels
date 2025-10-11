import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { Lock } from "lucide-react-native";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import ThemedCard from "../ui/ThemedCard";
import ThemedText from "../ui/ThemedText";

interface CategoryTabsProps {
  guestMeta: any;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  guestMeta,
  selectedCategory,
  onCategorySelect,
}) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { getCategoryOrder, getUnlockedCategories, xpNeededToUnlockCategory, derivePlayerLevel } = require('@/hooks/guest-progress');
  
  const categoryOrder = getCategoryOrder();
  const unlockedCategories = getUnlockedCategories(guestMeta?.playerLevel || 0);

  const handleCategoryPress = (category: string, index: number) => {
    const isUnlocked = unlockedCategories.includes(category);
    if (isUnlocked) {
      onCategorySelect(category);
    } else {
      const requiredXP = xpNeededToUnlockCategory(index);
      const requiredLevel = requiredXP > 0 ? derivePlayerLevel(requiredXP).level : 0;
      // Don't show alert, just don't allow selection
    }
  };

  // Category emoji mapping
  const getCategoryEmoji = (cat: string) => {
    switch(cat) {
      case 'Mountain': return '🏔️';
      case 'Ocean': return '🌊';
      case 'Forest': return '🌲';
      default: return '🎯';
    }
  };

  return (
    <ThemedCard variant="glass" padding="md" style={styles.categoryContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {categoryOrder.map((category: string, index: number) => {
          const isUnlocked = unlockedCategories.includes(category);
          const isSelected = selectedCategory === category;
          const requiredXP = xpNeededToUnlockCategory(index);
          const requiredLevel = requiredXP > 0 ? derivePlayerLevel(requiredXP).level : 0;
          const currentXP = guestMeta?.xp || 0;
          const xpProgress = Math.min(currentXP, requiredXP);
          const xpRemaining = Math.max(0, requiredXP - currentXP);
          const progressPercent = requiredXP > 0 ? (xpProgress / requiredXP) * 100 : 100;
          
          return (
            <TouchableOpacity
              key={category}
              onPress={() => handleCategoryPress(category, index)}
              activeOpacity={0.8}
            >
              <ThemedCard
                variant={isSelected ? "primary" : isUnlocked ? "elevated" : "ghost"}
                padding="md"
                style={[
                  styles.categoryTab,
                  isSelected && styles.categoryTabActive,
                  !isUnlocked && styles.categoryTabLocked,
                ]}
              >
                <View style={styles.categoryContent}>
                  <View style={styles.categoryHeader}>
                    {/* <ThemedText 
                      variant="body2" 
                      style={styles.categoryEmoji}
                    >
                      {getCategoryEmoji(category)}
                    </ThemedText> */}
                      {!isUnlocked ? <Lock size={12} color={theme.colors.textTertiary} /> : ''}
                    <ThemedText
                      variant="body2"
                      // style={{ textAlign: 'center' , paddingHorizontal: 4}}
                      align="center"
                      color={isUnlocked ? (isSelected ? "primary" : "text") : "textTertiary"}
                    >
                      {category}
                    </ThemedText>
                  </View>
                  
                  {/* {!isUnlocked && (
                    <View style={styles.lockInfo}>
                      <View style={styles.lockHeader}>
                        <Lock size={12} color={theme.colors.textTertiary} />
                        <ThemedText variant="caption" color="textTertiary" weight="medium">
                          Lvl {requiredLevel}
                        </ThemedText>
                      </View>
                      
                      
                      
                    </View>
                  )} */}
                </View>
              </ThemedCard>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </ThemedCard>
  );
};

const createStyles = (theme: any) => ({
  categoryContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderTopWidth: 0,
  },
  categoryScrollContent: {
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  categoryTab: {
 
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  categoryTabActive: {
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  categoryTabLocked: {
    opacity: 0.6,
    minHeight: 80,
  },
  categoryContent: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  categoryHeader: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: theme.spacing.xs,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  lockInfo: {
    alignItems: 'center' as const,
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  lockHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
  },
  miniProgressContainer: {
    width: 60,
    marginTop: theme.spacing.xs,
  },
  miniProgressBar: {
    width: '100%',
    height: 3,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden' as const,
  },
  miniProgress: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
});

export default CategoryTabs;
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

  return (
    <View style={styles.categoryContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {categoryOrder.map((category: string, index: number) => {
          const isUnlocked = unlockedCategories.includes(category);
          const requiredXP = xpNeededToUnlockCategory(index);
          const requiredLevel = requiredXP > 0 ? derivePlayerLevel(requiredXP).level : 0;
          const currentXP = guestMeta?.xp || 0;
          const xpProgress = Math.min(currentXP, requiredXP);
          const xpRemaining = Math.max(0, requiredXP - currentXP);
          const progressPercent = requiredXP > 0 ? (xpProgress / requiredXP) * 100 : 100;
          
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
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                selectedCategory === category && styles.categoryTabActive,
                !isUnlocked && styles.categoryTabLocked,
              ]}
              onPress={() => handleCategoryPress(category, index)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                  !isUnlocked && styles.categoryTextLocked,
                ]}
              >
                {getCategoryEmoji(category)} {category}
              </Text>
              {!isUnlocked && (
                <View style={styles.lockInfo}>
                  <Text style={styles.categoryLockText}>Lvl {requiredLevel}</Text>
                  <Text style={styles.xpRemainingText}>
                    {xpRemaining} XP needed
                  </Text>
                  {/* Mini progress bar */}
                  <View style={styles.miniProgressBar}>
                    <View style={[styles.miniProgress, { width: `${progressPercent}%` }]} />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  categoryContainer: {
    backgroundColor: "rgba(31,41,55,0.85)",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryTab: {
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginVertical: 4,
    borderRadius: 2400,
    backgroundColor: "rgba(55,65,81,0.6)",
    borderWidth: 2,
    borderColor: "rgba(75,85,99,0.3)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 90,
    alignItems: "center",
  },
  categoryTabActive: {
    backgroundColor: "rgba(139,92,246,0.9)",
    borderColor: "rgba(139,92,246,1)",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    transform: [{ scale: 1.05 }],
  },
  categoryText: {
    color: "#D1D5DB",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  categoryTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  categoryTabLocked: {
    backgroundColor: "rgba(55,65,81,0.25)",
    borderColor: "rgba(75,85,99,0.2)",
    opacity: 0.6,
    minHeight: 80,
  },
  categoryTextLocked: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "500",
  },
  lockInfo: {
    alignItems: "center",
    marginTop: 4,
    gap: 2,
  },
  categoryLockText: {
    color: "#6B7280",
    fontSize: 10,
    fontWeight: "500",
    fontStyle: "italic",
  },
  xpRemainingText: {
    color: "#8B5CF6",
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
  miniProgressBar: {
    width: 60,
    height: 3,
    backgroundColor: "rgba(55,65,81,0.5)",
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 2,
  },
  miniProgress: {
    height: "100%",
    backgroundColor: "rgba(139,92,246,0.7)",
    borderRadius: 2,
  },
});

export default CategoryTabs;
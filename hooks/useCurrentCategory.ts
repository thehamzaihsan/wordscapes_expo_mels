import { useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { loadGuestProgress, getCategoryOrder, getUnlockedCategories } from './guest-progress';

export type CategoryType = 'Mountain' | 'Ocean' | 'Forest';

/**
 * Hook to determine the current active category based on user progress and context
 * This determines which background image should be displayed
 */
export function useCurrentCategory(): {
  currentCategory: CategoryType;
  isLoading: boolean;
  availableCategories: string[];
  categoryIndex: number;
} {
  const [currentCategory, setCurrentCategory] = useState<CategoryType>('Mountain');
  const [isLoading, setIsLoading] = useState(true);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [categoryIndex, setCategoryIndex] = useState(0);

  const loadCurrentCategory = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get user progress to determine unlocked categories and current progression
      const progress = await loadGuestProgress();
      
      if (!progress) {
        // No progress, default to first category
        setCurrentCategory('Mountain');
        setAvailableCategories(['Mountain']);
        setCategoryIndex(0);
        return;
      }

      // Get category order and unlocked categories
      const categoryOrder = getCategoryOrder();
      const unlockedCategories = getUnlockedCategories(progress.meta.playerLevel);
      
      setAvailableCategories(unlockedCategories);

      // Determine the "current" category based on progression:
      // 1. Last category with active/incomplete levels
      // 2. Most recently unlocked category
      // 3. Category with highest progress
      
      let activeCategory = categoryOrder[0]; // Default to first category
      let maxProgress = -1;
      let latestActivity = '';

      for (const categoryName of unlockedCategories) {
        const categoryLevels = progress.categories[categoryName];
        
        if (!categoryLevels) continue;

        // Calculate progress metrics
        const completedLevels = categoryLevels.filter(l => l.isCompleted).length;
        const totalLevels = categoryLevels.length;
        const progressRatio = totalLevels > 0 ? completedLevels / totalLevels : 0;
        
        // Find latest activity in this category
        const latestCompletion = categoryLevels
          .filter(l => l.lastCompletedAt)
          .sort((a, b) => new Date(b.lastCompletedAt!).getTime() - new Date(a.lastCompletedAt!).getTime())[0];

        // Prefer categories with recent activity
        if (latestCompletion && latestCompletion.lastCompletedAt! > latestActivity) {
          latestActivity = latestCompletion.lastCompletedAt!;
          activeCategory = categoryName;
        }
        // Otherwise prefer categories with highest progress
        else if (!latestActivity && progressRatio > maxProgress) {
          maxProgress = progressRatio;
          activeCategory = categoryName;
        }
        // If no completion data, prefer the furthest unlocked category
        else if (!latestActivity && maxProgress === -1) {
          activeCategory = categoryName;
        }
      }

      // Ensure we have a valid category from our available options
      const validCategory = (['Mountain', 'Ocean', 'Forest'] as CategoryType[])
        .find(cat => cat === activeCategory) || 'Mountain';
      
      setCurrentCategory(validCategory);
      setCategoryIndex(categoryOrder.indexOf(activeCategory));
      
      console.log(`[CurrentCategory] Active category: ${validCategory} (index: ${categoryOrder.indexOf(activeCategory)})`);
      
    } catch (error) {
      console.warn('Failed to determine current category:', error);
      setCurrentCategory('Mountain');
      setAvailableCategories(['Mountain']);
      setCategoryIndex(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount and when screen comes into focus
  useEffect(() => {
    loadCurrentCategory();
  }, [loadCurrentCategory]);

  // Reload when the screen comes into focus (user navigates back from other screens)
  useFocusEffect(
    useCallback(() => {
      loadCurrentCategory();
    }, [loadCurrentCategory])
  );

  return {
    currentCategory,
    isLoading,
    availableCategories,
    categoryIndex
  };
}
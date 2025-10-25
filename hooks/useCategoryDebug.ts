/**
 * Debug utility to help test and understand the category background system
 */

import { loadGuestProgress, getCategoryOrder, getUnlockedCategories } from './guest-progress';

export async function debugCategorySystem() {
  console.log('\n🔍 Debug: Category Background System');
  console.log('=====================================');
  
  try {
    // Get current progress
    const progress = await loadGuestProgress();
    
    if (!progress) {
      console.log('❌ No user progress found - will default to Mountain');
      return {
        currentCategory: 'Mountain',
        reason: 'No progress data'
      };
    }
    
    console.log(`👤 Player Level: ${progress.meta.playerLevel}`);
    console.log(`🏆 Player XP: ${progress.meta.xp}`);
    
    // Get category information
    const categoryOrder = getCategoryOrder();
    const unlockedCategories = getUnlockedCategories(progress.meta.playerLevel);
    
    console.log(`📚 Available Categories: ${categoryOrder.join(', ')}`);
    console.log(`🔓 Unlocked Categories: ${unlockedCategories.join(', ')}`);
    
    // Analyze each category's progress
    console.log('\n📊 Category Progress Analysis:');
    
    let activeCategory = categoryOrder[0];
    let analysisResults: any[] = [];
    
    for (const categoryName of unlockedCategories) {
      const categoryLevels = progress.categories[categoryName];
      
      if (!categoryLevels) {
        console.log(`  ${categoryName}: No data`);
        continue;
      }
      
      const completedLevels = categoryLevels.filter(l => l.isCompleted).length;
      const totalLevels = categoryLevels.length;
      const progressRatio = totalLevels > 0 ? completedLevels / totalLevels : 0;
      
      const latestCompletion = categoryLevels
        .filter(l => l.lastCompletedAt)
        .sort((a, b) => new Date(b.lastCompletedAt!).getTime() - new Date(a.lastCompletedAt!).getTime())[0];
      
      const result = {
        category: categoryName,
        completed: completedLevels,
        total: totalLevels,
        progressPercent: Math.round(progressRatio * 100),
        lastActivity: latestCompletion?.lastCompletedAt || 'Never',
        isActive: false
      };
      
      analysisResults.push(result);
      
      console.log(`  ${categoryName}: ${completedLevels}/${totalLevels} (${result.progressPercent}%) - Last: ${result.lastActivity}`);
    }
    
    // Determine active category based on latest activity
    const categoryWithLatestActivity = analysisResults
      .filter(r => r.lastActivity !== 'Never')
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())[0];
    
    if (categoryWithLatestActivity) {
      activeCategory = categoryWithLatestActivity.category;
      categoryWithLatestActivity.isActive = true;
      console.log(`\n🎯 Active Category: ${activeCategory} (based on latest activity)`);
    } else {
      console.log(`\n🎯 Active Category: ${activeCategory} (default - no activity found)`);
    }
    
    // Map to background image type
    const validCategory = (['Mountain', 'Ocean', 'Forest'] as const)
      .find(cat => cat === activeCategory) || 'Mountain';
    
    console.log(`🖼️  Background Image: ${validCategory.toLowerCase()}.${validCategory === 'Forest' ? 'png' : 'jpg'}`);
    
    return {
      currentCategory: validCategory,
      reason: categoryWithLatestActivity ? 'Latest activity' : 'Default fallback',
      analysis: analysisResults,
      playerLevel: progress.meta.playerLevel,
      unlockedCategories
    };
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return {
      currentCategory: 'Mountain',
      reason: 'Error occurred',
      error: error.message
    };
  }
}

/**
 * Quick test function to simulate category progression
 */
export function testCategoryProgression() {
  console.log('\n🧪 Test: Category Progression');
  console.log('==============================');
  
  const testLevels = [0, 1, 2, 3, 4, 5, 10, 15, 20];
  
  for (const level of testLevels) {
    const unlockedCategories = getUnlockedCategories(level);
    console.log(`Level ${level}: ${unlockedCategories.join(', ') || 'None'}`);
  }
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).debugCategorySystem = debugCategorySystem;
  (window as any).testCategoryProgression = testCategoryProgression;
}
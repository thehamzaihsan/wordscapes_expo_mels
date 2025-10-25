# Dynamic Background Images Based on User Category Progress

## Overview
Implemented a dynamic background system that automatically shows different background images (Mountain, Ocean, Forest) based on the user's current category progression and activity in the Wordscapes game.

## Files Modified/Created

### 1. `/hooks/useCurrentCategory.ts` (NEW)
- **Purpose**: Hook to determine the current active category based on user progress
- **Logic**: 
  - Analyzes user's level progress across all categories
  - Determines active category based on:
    1. Most recent activity (latest completed level)
    2. Highest progress ratio if no recent activity
    3. Furthest unlocked category as fallback
  - Returns the appropriate CategoryType ('Mountain' | 'Ocean' | 'Forest')
- **Features**:
  - Loads progress on mount and when screen comes into focus
  - Provides loading state to prevent flicker
  - Returns available categories and category index

### 2. `/components/common/BackgroundImage.tsx` (MODIFIED)
- **Purpose**: Updated to use dynamic category-based backgrounds
- **Changes**:
  - Imports and uses `useCurrentCategory` hook
  - Maps categories to appropriate image files:
    - Mountain → `mountain.jpg`
    - Ocean → `ocean.jpg` 
    - Forest → `forest.png`
  - Provides smooth transitions with CSS animations on web
  - Maintains overlay support for dark themes
  - Handles both mobile (ImageBackground) and web (CSS background) platforms

### 3. Image Assets Setup
- **Mobile**: Images stored in `/images/` folder
  - `mountain.jpg` (173KB)
  - `ocean.jpg` (301KB)
  - `forest.png` (2.5MB)
- **Web**: Images copied to `/public/images/` for web access
- **Fallback**: `default_background.jpg` for error cases

### 4. `/hooks/useCategoryDebug.ts` (NEW - DEBUG UTILITY)
- **Purpose**: Debug utility for testing and understanding the category system
- **Functions**:
  - `debugCategorySystem()`: Analyzes current user progress and explains category selection
  - `testCategoryProgression()`: Shows which categories unlock at different levels
- **Available in browser console**: `window.debugCategorySystem()` and `window.testCategoryProgression()`

## How It Works

### Category Detection Logic
1. **Load User Progress**: Gets current guest progress from local storage
2. **Analyze Categories**: For each unlocked category:
   - Calculate completion percentage
   - Find latest activity (last completed level)
   - Track progress metrics
3. **Determine Active Category**:
   - **Priority 1**: Category with most recent activity
   - **Priority 2**: Category with highest progress if no recent activity  
   - **Priority 3**: First unlocked category as fallback
4. **Map to Background**: Convert category name to valid CategoryType

### Category Unlocking
- **Mountain**: Always unlocked (default)
- **Ocean**: Unlocks at player level 2 (1100+ XP)
- **Forest**: Unlocks at player level 4 (2800+ XP)

### Background Selection
- **Mountain**: Shows mountain landscape
- **Ocean**: Shows ocean/beach scene
- **Forest**: Shows forest/nature scene
- **Default**: Falls back to default background if issues occur

## Features

### ✅ Implemented
- Dynamic background switching based on user progress
- Smooth transitions on web platform
- Mobile and web platform support
- Loading state handling to prevent flicker
- Error handling with fallback to default
- Debug utilities for testing
- Proper TypeScript typing

### 🎯 Smart Category Detection
- Detects user's "current" category based on activity patterns
- Prioritizes categories where user has been recently active
- Falls back gracefully for new users or edge cases
- Updates automatically when user progresses

### 🖼️ Image Management
- Optimized image loading for different platforms
- Proper asset organization for mobile/web
- CSS transitions for smooth changes on web
- ImageBackground component for mobile overlay support

## Usage

The background automatically updates based on user progress. No manual intervention required.

### For Testing/Debugging:
```javascript
// In browser console
await debugCategorySystem()  // Shows detailed analysis
testCategoryProgression()    // Shows unlock progression
```

### For Development:
```typescript
// Use the hook in any component
const { currentCategory, isLoading, availableCategories } = useCurrentCategory();
```

## Performance Considerations

- **Lazy Loading**: Category detection only runs when needed
- **Caching**: Uses React hooks for efficient re-renders
- **Focus-Based Updates**: Refreshes when screen comes into focus
- **Minimal Dependencies**: Uses existing progress system, no additional storage

## Error Handling

- **No Progress Data**: Defaults to Mountain background
- **Invalid Category**: Falls back to Mountain background  
- **Image Load Errors**: Browser/app handles with default background
- **Hook Errors**: Graceful fallback to default state

## Visual Flow

```
User Progress → Category Analysis → Background Selection → Image Display
      ↓              ↓                    ↓                ↓
  XP/Levels → Most Recent Activity → Mountain/Ocean/Forest → mountain.jpg/ocean.jpg/forest.png
```

This implementation provides a personalized visual experience that adapts to the user's gameplay progression, making the app feel more dynamic and responsive to their journey through different themed categories.
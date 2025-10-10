# Components Organization Guide

This document describes the organization of the components folder and provides guidelines for maintaining clean architecture.

## 📁 Current Structure Overview

The components are currently organized in a flat structure but are categorized logically in the `ui-components.ts` export file. Each category serves a specific purpose:

## 🎨 UI Components
**Purpose**: Basic reusable UI elements that can be used across the entire application.

**Files**:
- `ThemedButton.tsx` - Customizable button component with theme support
- `ThemedCard.tsx` - Card container with theme-aware styling  
- `ThemedInput.tsx` - Input fields with consistent theming
- `ThemedText.tsx` - Text components with typography variants
- `ThemedModal.tsx` - Modal dialogs with theme integration
- `ThemedComponents.tsx` - Enhanced component variants
- `ThemeSwitcher.tsx` - Theme selection component
- `SimpleText.tsx` - Basic text component

**Usage**: Import from `ui-components.ts` for consistent theming

## 🎮 Game Components
**Purpose**: Components specifically designed for gameplay functionality.

**Files**:
- `GameScreen.tsx` - Main game screen container
- `GameGrid.tsx` - Crossword grid display
- `GameHeader.tsx` - Game header with score/progress
- `GameCompletionModal.tsx` - Level completion celebrations
- `GameSoundManager.tsx` - Audio management for games
- `inputWheel.tsx` - Letter input wheel interface
- `useGameLogic.tsx` - Game state management hook

**Usage**: Core gameplay components with game-specific logic

## 📱 Screen Components
**Purpose**: Full-screen components representing different app screens.

**Files**:
- `CreateAccountScreen.tsx` - Account creation flow
- `EmailConfirmationScreen.tsx` - Email verification
- `GuestNameScreen.tsx` - Guest user setup
- `LevelScreen.tsx` - Level selection interface
- `Login.tsx` - Authentication screen
- `PlayerProfileScreen.tsx` - User profile management
- `SettingsScreen.tsx` - App configuration
- `StoreScreen.tsx` - In-app purchases
- `XPShopScreen.tsx` - Experience points store

**Usage**: Imported directly by route components

## 🎯 Level Components
**Purpose**: Components related to level selection and management.

**Files**:
- `LevelCard.tsx` - Individual level display card
- `LevelGrid.tsx` - Grid layout for levels
- `LevelHeader.tsx` - Level screen header
- `CategoryTabs.tsx` - Level category navigation
- `DifficultySelection.tsx` - Difficulty picker

**Usage**: Used within level selection flows

## ✨ Animation Components  
**Purpose**: Components focused on animations and visual effects.

**Files**:
- `BackgroundAnimation.tsx` - Animated backgrounds
- `LetterAnimations.tsx` - Letter movement effects

**Usage**: Enhance visual experience across the app

## 🎣 Hooks
**Purpose**: Custom React hooks for component logic.

**Files**:
- `useSoundSettings.tsx` - Audio settings management

**Usage**: Shared logic between components

## 🔧 Common Components
**Purpose**: Shared utility components used across the app.

**Files**:
- `logo.tsx` - App branding component
- `CompleteShowcase.tsx` - Component demonstration

**Usage**: General purpose components

## 📝 Development Guidelines

### Adding New Components

1. **Determine Category**: Identify which category your component belongs to
2. **Follow Naming**: Use PascalCase for component files
3. **Include Types**: Define proper TypeScript interfaces
4. **Theme Support**: Use themed styling where appropriate
5. **Export**: Add to the appropriate section in `ui-components.ts`

### Component Structure
```tsx
interface ComponentProps {
  // Define your props here
}

const ComponentName: React.FC<ComponentProps> = ({ ...props }) => {
  // Component logic
  return (
    // JSX
  );
};

export default ComponentName;
```

### Import Guidelines

```tsx
// ✅ Good - Import from organized exports
import { ThemedButton, GameScreen } from '@/app/components/ui-components';

// ❌ Avoid - Direct file imports when possible
import ThemedButton from '@/app/components/ThemedButton';
```

## 🧹 Cleanup Completed

The following unused files have been removed:
- ❌ `ComponentLibraryDemo.tsx` - Demo component not used in production
- ❌ `QuickStartExample.tsx` - Example component not used in production  
- ❌ `GameScreenClean.tsx` - Unused alternative implementation
- ❌ `GameScreenRefactored.tsx` - Unused alternative implementation
- ❌ `test.tsx` - Test component removed from app routes
- ❌ `input-test.tsx` - Test component removed
- ❌ All `test_*.js` files - Test scripts removed from root

## 🚀 Future Improvements

Consider these architectural improvements for the future:

1. **Physical Folder Structure**: Move components into category folders
2. **Barrel Exports**: Create index files for each category
3. **Storybook Integration**: Add component documentation
4. **Unit Tests**: Add tests for each component category
5. **Performance**: Implement lazy loading for screen components

## 📖 Related Documentation

- [Theme System](../../constants/themes.ts) - App theming configuration
- [Component Library Docs](../../COMPONENT_LIBRARY_DOCS.md) - Detailed component usage
- [Hooks Documentation](../../hooks/README.md) - Custom hooks reference
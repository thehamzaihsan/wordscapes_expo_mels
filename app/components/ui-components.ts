/**
 * Centralized Components Export - ORGANIZED STRUCTURE
 * Components are now organized into logical categories
 */

// ==========================================
// UI COMPONENTS - Basic reusable UI elements
// ==========================================
export { default as SimpleText } from './ui/SimpleText';
export { default as ThemedButton } from './ui/ThemedButton';
export { default as ThemedCard } from './ui/ThemedCard';
export { default as ThemedInput } from './ui/ThemedInput';
export { default as ThemedModal } from './ui/ThemedModal';
export { default as ThemedText } from './ui/ThemedText';
export { default as ThemeSwitcher } from './ui/ThemeSwitcher';

// Enhanced components for better consistency
export { EnhancedButton, EnhancedCard, EnhancedText } from './ui/ThemedComponents';

// ==========================================
// GAME COMPONENTS - Game-specific functionality
// ==========================================
export { default as InputWheel } from './game/inputWheel';
export { default as useGameLogic } from './game/useGameLogic';

// ==========================================
// SCREEN COMPONENTS - Full screen components
// ==========================================
export { default as CreateAccountScreen } from './screens/CreateAccountScreen';
export { default as EmailConfirmationScreen } from './screens/EmailConfirmationScreen';
export { default as GameScreen } from './screens/GameScreen';
export { default as GuestNameScreen } from './screens/GuestNameScreen';
export { default as LevelScreen } from './screens/LevelScreen';
export { default as Login } from './screens/Login';
export { default as PlayerProfileScreen } from './screens/PlayerProfileScreen';
export { default as XPShopScreen } from './screens/XPShopScreen';
export { default as SettingsScreen } from './screens/SettingsScreen';
export { default as StoreScreen } from './screens/StoreScreen';

// ==========================================
// LEVEL COMPONENTS - Level selection and management
// ==========================================
export { default as CategoryTabs } from './levels/CategoryTabs';
export { default as DifficultySelection } from './levels/DifficultySelection';
export { default as LevelCard } from './levels/LevelCard';
export { default as LevelGrid } from './levels/LevelGrid';
export { default as LevelHeader } from './levels/LevelHeader';

// ==========================================
// ANIMATION COMPONENTS - Visual effects
// ==========================================
export { default as BackgroundAnimation } from './animations/BackgroundAnimation';
export { default as LetterAnimations } from './animations/LetterAnimations';

// ==========================================
// HOOKS - Custom React hooks
// ==========================================
export { default as useSoundSettings } from './hooks/useSoundSettings';

// ==========================================
// COMMON COMPONENTS - Shared utilities
// ==========================================
export { default as Logo } from './common/Logo';

// Re-export theme utilities
export { DarkTheme, GameTheme, LightTheme, themes } from '@/constants/themes';
export type { Theme, ThemeName } from '@/constants/themes';
export { ThemeProvider, useTheme, useThemedStyles } from '@/hooks/useTheme';


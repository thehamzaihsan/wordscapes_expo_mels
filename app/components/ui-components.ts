/**
 * Centralized Components Export
 * Organized by category for better maintainability
 */

// ==========================================
// UI COMPONENTS - Basic reusable UI elements
// ==========================================
export { default as ThemedButton } from './ThemedButton';
export { default as ThemedCard } from './ThemedCard';
export { default as ThemedInput } from './ThemedInput';
export { default as ThemedText } from './ThemedText';
export { default as ThemedModal } from './ThemedModal';
export { default as ThemeSwitcher } from './ThemeSwitcher';
export { default as SimpleText } from './SimpleText';

// Enhanced components for better consistency
export { EnhancedButton, EnhancedCard, EnhancedText } from './ThemedComponents';

// ==========================================
// GAME COMPONENTS - Game-specific functionality
// ==========================================
export { default as GameScreen } from './GameScreen';
export { default as GameGrid } from './GameGrid';
export { default as GameHeader } from './GameHeader';
export { default as GameCompletionModal } from './GameCompletionModal';
export { default as GameSoundManager } from './GameSoundManager';
export { default as InputWheel } from './inputWheel';
export { default as useGameLogic } from './useGameLogic';

// ==========================================
// SCREEN COMPONENTS - Full screen components
// ==========================================
export { default as CreateAccountScreen } from './CreateAccountScreen';
export { default as EmailConfirmationScreen } from './EmailConfirmationScreen';
export { default as GuestNameScreen } from './GuestNameScreen';
export { default as LevelScreen } from './LevelScreen';
export { default as Login } from './Login';
export { default as PlayerProfileScreen } from './PlayerProfileScreen';
export { default as SettingsScreen } from './SettingsScreen';
export { default as StoreScreen } from './StoreScreen';
export { default as XPShopScreen } from './XPShopScreen';

// ==========================================
// LEVEL COMPONENTS - Level selection and management
// ==========================================
export { default as LevelCard } from './LevelCard';
export { default as LevelGrid } from './LevelGrid';
export { default as LevelHeader } from './LevelHeader';
export { default as CategoryTabs } from './CategoryTabs';
export { default as DifficultySelection } from './DifficultySelection';

// ==========================================
// ANIMATION COMPONENTS - Visual effects
// ==========================================
export { default as BackgroundAnimation } from './BackgroundAnimation';
export { default as LetterAnimations } from './LetterAnimations';

// ==========================================
// HOOKS - Custom React hooks
// ==========================================
export { default as useSoundSettings } from './useSoundSettings';

// ==========================================
// COMMON COMPONENTS - Shared utilities
// ==========================================
export { default as Logo } from './logo';
export { default as CompleteShowcase } from './CompleteShowcase';

// Re-export theme utilities
export { useTheme, useThemedStyles, ThemeProvider } from '@/hooks/useTheme';
export { themes, LightTheme, DarkTheme, GameTheme } from '@/constants/themes';
export type { Theme, ThemeName } from '@/constants/themes';
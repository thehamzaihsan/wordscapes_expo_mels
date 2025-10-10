# Centralized Component Library Documentation

This documentation explains how to use the centralized theme system and component library created for the Wordscapes Expo app.

## 🎨 Theme System

### Overview
The theme system provides centralized styling with support for multiple themes (light, dark, game) and consistent design tokens.

### Available Themes
- **Light Theme**: Clean and bright appearance
- **Dark Theme**: Easy on the eyes for low-light environments  
- **Game Theme**: Immersive gaming experience with translucent overlays

### Theme Structure
```typescript
interface Theme {
  colors: {
    primary, secondary, success, error, warning, info,
    background, surface, text, border, gameBackground, etc.
  },
  typography: {
    fontFamilies, fontSizes, lineHeights, fontWeights
  },
  spacing: { 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16, 20, 24, 32 },
  borderRadius: { none, sm, base, md, lg, xl, '2xl', '3xl', full },
  shadows: { sm, base, lg, xl }
}
```

## 🔧 Setup

### 1. Wrap your app with ThemeProvider
```tsx
import { ThemeProvider } from '@/hooks/useTheme';

export default function App() {
  return (
    <ThemeProvider defaultTheme="game">
      <YourAppContent />
    </ThemeProvider>
  );
}
```

### 2. Use theme in components
```tsx
import { useTheme } from '@/hooks/useTheme';

const MyComponent = () => {
  const { theme, themeName, setTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.text }}>Hello World</Text>
    </View>
  );
};
```

## 🧩 UI Components

### ThemedButton
Dynamic button component with theme support.

```tsx
import { ThemedButton } from '@/app/components/ui-components';

<ThemedButton
  title="Click Me"
  variant="primary" // primary, secondary, success, error, warning, info, ghost, outline
  size="md" // sm, md, lg, xl
  onPress={() => console.log('Pressed')}
  leftIcon={<Icon />}
  isLoading={false}
  fullWidth={true}
/>
```

**Variants**: primary, secondary, success, error, warning, info, ghost, outline
**Sizes**: sm (36px), md (44px), lg (52px), xl (60px)

### ThemedCard
Container component with elevation and theming.

```tsx
import { ThemedCard } from '@/app/components/ui-components';

<ThemedCard
  variant="elevated" // default, elevated, outlined, flat
  padding="md" // none, sm, md, lg, xl
  touchable={true} // Makes it touchable
  onPress={() => {}}
>
  <ThemedText>Card Content</ThemedText>
</ThemedCard>
```

### ThemedText
Typography component with semantic variants.

```tsx
import { ThemedText } from '@/app/components/ui-components';

<ThemedText
  variant="heading1" // display, heading1-4, body1-2, caption, overline, button
  color="primary" // primary, secondary, text, textSecondary, success, error, etc.
  weight="bold" // light, normal, medium, semibold, bold, extrabold
  align="center" // left, center, right, justify
>
  Hello World
</ThemedText>
```

### ThemedInput
Form input component with validation states.

```tsx
import { ThemedInput } from '@/app/components/ui-components';

<ThemedInput
  label="Email"
  placeholder="Enter your email"
  variant="outlined" // default, outlined, filled, underlined
  size="md" // sm, md, lg
  error="Invalid email"
  leftIcon={<EmailIcon />}
  required={true}
  value={email}
  onChangeText={setEmail}
/>
```

### ThemedModal
Modal component with backdrop options.

```tsx
import { ThemedModal } from '@/app/components/ui-components';

<ThemedModal
  isVisible={showModal}
  onClose={() => setShowModal(false)}
  title="Modal Title"
  subtitle="Optional subtitle"
  size="medium" // small, medium, large, fullscreen
  position="center" // center, top, bottom
  backdrop="blur" // blur, solid, transparent
  showCloseButton={true}
>
  <ThemedText>Modal content</ThemedText>
</ThemedModal>
```

## 🎭 Theme Switching

### ThemeSwitcher Component
Pre-built component for theme selection.

```tsx
import ThemeSwitcher from '@/app/components/ThemeSwitcher';

<ThemeSwitcher showTitle={true} />
```

### Manual Theme Switching
```tsx
const { setTheme, toggleTheme } = useTheme();

// Set specific theme
setTheme('dark');

// Cycle through themes
toggleTheme();
```

## 🎨 Styling with Theme

### Using useThemedStyles Hook
```tsx
import { useThemedStyles } from '@/hooks/useTheme';

const MyComponent = () => {
  const styles = useThemedStyles((theme) => StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing[4],
      borderRadius: theme.borderRadius.lg,
    },
    text: {
      color: theme.colors.text,
      fontSize: theme.typography.fontSizes.base,
    },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Themed Component</Text>
    </View>
  );
};
```

### Direct Theme Usage
```tsx
const MyComponent = () => {
  const { theme } = useTheme();
  
  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      padding: theme.spacing[4],
      borderRadius: theme.borderRadius.md,
      ...theme.shadows.base,
    }}>
      <Text style={{
        color: theme.colors.text,
        fontSize: theme.typography.fontSizes.lg,
        fontWeight: theme.typography.fontWeights.semibold,
      }}>
        Hello World
      </Text>
    </View>
  );
};
```

## 🔄 Migration Guide

### Converting Existing Components

**Before:**
```tsx
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

**After:**
```tsx
import { useTheme } from '@/hooks/useTheme';

const createStyles = (theme: Theme) => StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.md,
  },
  text: {
    color: theme.colors.textInverse,
    fontSize: theme.typography.fontSizes.base,
    fontWeight: theme.typography.fontWeights.bold,
  },
});

const MyComponent = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  // ... component logic
};
```

## 🎯 Best Practices

1. **Always use theme colors** instead of hardcoded hex values
2. **Use semantic color names** (primary, success, error) rather than specific colors
3. **Leverage spacing system** for consistent padding/margins
4. **Use typography scale** for consistent text sizing
5. **Create styled variants** for component variations rather than custom styles
6. **Test in all themes** to ensure proper contrast and readability

## 📱 Component Examples

### Game Level Card (Converted)
```tsx
// Using the new themed components
<ThemedCard touchable onPress={onPress} variant="elevated" padding="lg">
  <View style={styles.header}>
    <ThemedText variant="heading4" weight="bold">{level.baseWord}</ThemedText>
    <View style={[styles.badge, { backgroundColor: getDifficultyColor(difficulty) }]}>
      <ThemedText variant="caption" color="textInverse" weight="bold">
        {difficulty.toUpperCase()}
      </ThemedText>
    </View>
  </View>
  
  <ThemedText variant="body2" color="textSecondary">
    Level {level.number}
  </ThemedText>
</ThemedCard>
```

### Settings Screen
```tsx
<ThemeSwitcher />

<ThemedCard padding="lg">
  <ThemedText variant="heading4" weight="semibold">🎨 Animations</ThemedText>
  
  <View style={styles.settingItem}>
    <ThemedText variant="body1" weight="medium">Background Animations</ThemedText>
    <Switch value={enabled} onValueChange={toggle} />
  </View>
</ThemedCard>
```

This component library provides a solid foundation for consistent, themeable UI components throughout your app. The system is extensible and can be easily customized for specific design requirements.
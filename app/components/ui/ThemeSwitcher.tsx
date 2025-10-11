/**
 * Theme Switcher Component
 * Allows users to switch between different themes
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import ThemedButton from './ThemedButton';
import ThemedText from './ThemedText';
import ThemedCard from './ThemedCard';

interface ThemeSwitcherProps {
  showTitle?: boolean;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ showTitle = true }) => {
  const { theme, themeName, setTheme } = useTheme();
  const styles = createStyles(theme);

  const themes = [
    { name: 'light', label: '☀️ Light', description: 'Clean and bright' },
    // Hide dark and game themes for now
    // { name: 'dark', label: '🌙 Dark', description: 'Easy on the eyes' },
    // { name: 'game', label: '🎮 Game', description: 'Immersive gaming' },
  ] as const;

  return (
    <ThemedCard padding="lg" style={styles.container}>
      {showTitle && (
        <ThemedText variant="heading4" weight="semibold" style={styles.title}>
          Theme Selection
        </ThemedText>
      )}
      
      <View style={styles.buttonContainer}>
        {themes.map((themeOption) => (
          <ThemedButton
            key={themeOption.name}
            title={themeOption.label}
            variant={themeName === themeOption.name ? 'primary' : 'outline'}
            size="md"
            onPress={() => setTheme(themeOption.name)}
            style={styles.themeButton}
          />
        ))}
      </View>
      
      <ThemedText variant="caption" color="textSecondary" align="center" style={styles.description}>
        {themes.find(t => t.name === themeName)?.description || 'Current theme'}
      </ThemedText>
    </ThemedCard>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginVertical: theme.spacing.sm,
  },
  title: {
    marginBottom: theme.spacing.base,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  themeButton: {
    flex: 1,
    marginRight: theme.spacing.xs,
  },
  description: {
    marginTop: theme.spacing.xs,
  },
});

export default ThemeSwitcher;
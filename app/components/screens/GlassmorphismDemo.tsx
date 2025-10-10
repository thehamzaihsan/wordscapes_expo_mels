/**
 * Glassmorphism Demo Component
 * Showcases improved glassmorphism buttons and cards that work in all themes
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import ThemedButton from '../ui/ThemedButton';
import ThemedCard from '../ui/ThemedCard';
import ThemedText from '../ui/ThemedText';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import { Star, Settings, Heart, ShoppingCart, Play, Pause } from 'lucide-react-native';

const GlassmorphismDemo: React.FC = () => {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Header */}
      <ThemedCard variant="glass" padding="lg" style={styles.headerCard}>
        <ThemedText variant="heading1" weight="bold" align="center" style={styles.title}>
          ✨ Glassmorphism Fixed!
        </ThemedText>
        <ThemedText variant="body1" align="center" color="textSecondary">
          Beautiful glassmorphism effects that work perfectly in all themes
        </ThemedText>
        <ThemedCard variant="glassStrong" padding="md" style={{ marginTop: theme.spacing.md }}>
          <ThemedText variant="caption" align="center" color="primary" weight="bold">
            🎯 Light Mode Issue SOLVED: Now uses dark transparency for perfect visibility!
          </ThemedText>
        </ThemedCard>
      </ThemedCard>

      {/* Theme Switcher */}
      <ThemeSwitcher />

      {/* Button Variants Demo */}
      <ThemedCard variant="glassStrong" padding="lg" style={styles.sectionCard}>
        <ThemedText variant="heading3" weight="semibold" style={styles.sectionTitle}>
          🎮 Glassmorphism Buttons
        </ThemedText>
        
        {/* Primary Action */}
        <ThemedButton
          title="Start Game"
          variant="primary"
          size="lg"
          fullWidth
          leftIcon={<Play size={20} color={theme.colors.textInverse} />}
          style={styles.buttonSpacing}
        />

        {/* Secondary Glassmorphism (Fixed!) */}
        <ThemedButton
          title="Continue"
          variant="secondary"
          size="lg"
          fullWidth
          leftIcon={<Star size={20} color={theme.colors.text} />}
          style={styles.buttonSpacing}
        />

        {/* Glass Variants */}
        <View style={styles.buttonRow}>
          <ThemedButton
            title="Glass Light"
            variant="glass"
            size="md"
            leftIcon={<Settings size={16} color={theme.colors.text} />}
            style={styles.buttonThird}
          />
          <ThemedButton
            title="Glass Strong"
            variant="glassStrong"
            size="md"
            leftIcon={<Heart size={16} color={theme.colors.text} />}
            style={styles.buttonThird}
          />
          <ThemedButton
            title="Glass Premium"
            variant="glassPremium"
            size="md"
            leftIcon={<Star size={16} color={theme.colors.primary} />}
            style={styles.buttonThird}
          />
        </View>

        {/* Interactive Button */}
        <ThemedButton
          title={isPlaying ? "Pause Music" : "Play Music"}
          variant="glass"
          size="lg"
          fullWidth
          leftIcon={isPlaying ? 
            <Pause size={20} color={theme.colors.text} /> : 
            <Play size={20} color={theme.colors.text} />
          }
          onPress={() => setIsPlaying(!isPlaying)}
          style={styles.buttonSpacing}
        />

        {/* Small Glass Buttons */}
        <View style={styles.buttonRow}>
          <ThemedButton
            title="Profile"
            variant="glass"
            size="sm"
            style={styles.buttonQuarter}
          />
          <ThemedButton
            title="Settings"
            variant="glassStrong"
            size="sm"
            style={styles.buttonQuarter}
          />
          <ThemedButton
            title="Shop"
            variant="glass"
            size="sm"
            leftIcon={<ShoppingCart size={14} color={theme.colors.text} />}
            style={styles.buttonQuarter}
          />
          <ThemedButton
            title="Help"
            variant="outline"
            size="sm"
            style={styles.buttonQuarter}
          />
        </View>
      </ThemedCard>

      {/* Card Variants Demo */}
      <ThemedCard variant="glass" padding="lg" style={styles.sectionCard}>
        <ThemedText variant="heading3" weight="semibold" style={styles.sectionTitle}>
          🃏 Glassmorphism Cards
        </ThemedText>
        
        <View style={styles.cardGrid}>
          <ThemedCard variant="glass" padding="md" style={styles.demoCard}>
            <ThemedText variant="body2" weight="medium">Glass Card</ThemedText>
            <ThemedText variant="caption" color="textSecondary">Light glassmorphism</ThemedText>
          </ThemedCard>
          
          <ThemedCard variant="glassStrong" padding="md" style={styles.demoCard}>
            <ThemedText variant="body2" weight="medium">Strong Glass</ThemedText>
            <ThemedText variant="caption" color="textSecondary">Enhanced effect</ThemedText>
          </ThemedCard>
        </View>
      </ThemedCard>

      {/* Usage Examples */}
      <ThemedCard variant="default" padding="lg" style={styles.sectionCard}>
        <ThemedText variant="heading3" weight="semibold" style={styles.sectionTitle}>
          📝 Usage Guide
        </ThemedText>
        
        <ThemedText variant="body2" style={styles.usageText}>
          <ThemedText variant="body2" weight="bold">Button Variants:</ThemedText>
          {'\n'}• secondary - Enhanced glassmorphism that adapts perfectly to all themes
          {'\n'}• glass - Light glassmorphism effect with subtle shadows
          {'\n'}• glassStrong - Enhanced glassmorphism with stronger blur and depth
          {'\n'}• glassPremium - Premium glassmorphism with colored borders and glow
          {'\n\n'}
          <ThemedText variant="body2" weight="bold">Card Variants:</ThemedText>
          {'\n'}• glass - Light glassmorphism background
          {'\n'}• glassStrong - Enhanced glassmorphism with better visibility
          {'\n\n'}
          <ThemedText variant="body2" weight="bold">Light Mode Fix:</ThemedText>
          {'\n'}• Now uses dark transparency (rgba(0,0,0,0.08)) for perfect visibility
          {'\n'}• Subtle shadows enhance the glassmorphism effect
          {'\n'}• Beautiful contrast on light backgrounds
        </ThemedText>

        <ThemedCard variant="glass" padding="md" style={{ marginTop: theme.spacing.md }}>
          <ThemedText variant="caption" color="textSecondary" align="center">
            💡 All glassmorphism effects automatically adapt to light and dark themes!
          </ThemedText>
        </ThemedCard>
      </ThemedCard>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  headerCard: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.sm,
  },
  sectionCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.lg,
  },
  buttonSpacing: {
    marginBottom: theme.spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  buttonHalf: {
    flex: 1,
  },
  buttonThird: {
    flex: 1,
  },
  cardGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  demoCard: {
    flex: 1,
    alignItems: 'center',
  },
  usageText: {
    lineHeight: 20,
  },
  bottomSpacing: {
    height: theme.spacing.xl4,
  },
});

export default GlassmorphismDemo;
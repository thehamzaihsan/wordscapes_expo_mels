import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { showToast } from '@/lib/toast';
import { ChevronLeft, Settings as SettingsIcon } from 'lucide-react-native';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  Switch,
  View
} from 'react-native';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import ThemedCard from '../ui/ThemedCard';
import ThemedText from '../ui/ThemedText';
import ThemedButton from '../ui/ThemedButton';
import { useThemedStyles } from '@/hooks/useTheme';

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const { settings, updateSetting, resetSettings, loading } = useSettings();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    updateSetting(key, value);
    showToast(
      `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${value ? 'enabled' : 'disabled'}`,
      'info'
    );
  };

  const handleReset = () => {
    resetSettings();
    showToast('Settings reset to default', 'success');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.statusBar} />
        <View style={styles.loadingContainer}>
          <ThemedText variant="body1" color="primary" weight="semibold">
            Loading settings...
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.statusBar} />
      
      {/* Header */}
      <View style={styles.header}>
        <ThemedButton
          title="Back"
          variant="ghost"
          size="sm"
          leftIcon={<ChevronLeft size={16} color={theme.colors.text} />}
          onPress={() => onNavigate('back')}
          style={styles.backButton}
          textStyle={{ color: theme.colors.text }}
        />
        
        <View style={styles.headerTitle}>
          <SettingsIcon size={24} color={theme.colors.primary} />
          <ThemedText variant="heading3" weight="semibold" style={{ marginLeft: theme.spacing.sm }}>
            Settings
          </ThemedText>
        </View>
        
        {/* Spacer for centering */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Theme Settings */}
        <View style={styles.sectionContainer}>
          <ThemeSwitcher />
        </View>

        {/* Animation Settings */}
        <View style={styles.sectionContainer}>
          <ThemedCard variant="elevated" padding="lg" style={styles.card}>
            <ThemedText variant="heading4" weight="semibold" style={styles.sectionTitle}>
              🎨 Animations
            </ThemedText>
          
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <ThemedText variant="body1" weight="semibold" style={styles.settingLabel}>
                  Background Animations
                </ThemedText>
                <ThemedText variant="body2" color="textSecondary">
                  Floating bubble animations in the background
                </ThemedText>
              </View>
              <Switch
                value={settings.backgroundAnimationsEnabled}
                onValueChange={(value) => handleToggle('backgroundAnimationsEnabled', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={settings.backgroundAnimationsEnabled ? theme.colors.textInverse : theme.colors.textTertiary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <ThemedText variant="body1" weight="semibold" style={styles.settingLabel}>
                  UI Animations
                </ThemedText>
                <ThemedText variant="body2" color="textSecondary">
                  Button presses, transitions, and other UI animations
                </ThemedText>
              </View>
              <Switch
                value={settings.animationsEnabled}
                onValueChange={(value) => handleToggle('animationsEnabled', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={settings.animationsEnabled ? theme.colors.textInverse : theme.colors.textTertiary}
              />
            </View>
          </ThemedCard>
        </View>

        {/* Audio Settings */}
        <View style={styles.sectionContainer}>
          <ThemedCard variant="elevated" padding="lg" style={styles.card}>
            <ThemedText variant="heading4" weight="semibold" style={styles.sectionTitle}>
              🔊 Audio
            </ThemedText>
          
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <ThemedText variant="body1" weight="semibold" style={styles.settingLabel}>
                  Sound Effects
                </ThemedText>
                <ThemedText variant="body2" color="textSecondary">
                  Game sounds, button clicks, and audio feedback
                </ThemedText>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(value) => handleToggle('soundEnabled', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={settings.soundEnabled ? theme.colors.textInverse : theme.colors.textTertiary}
              />
            </View>
          </ThemedCard>
        </View>

        {/* Feedback Settings */}
        <View style={styles.sectionContainer}>
          <ThemedCard variant="elevated" padding="lg" style={styles.card}>
            <ThemedText variant="heading4" weight="semibold" style={styles.sectionTitle}>
              📳 Feedback
            </ThemedText>
          
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <ThemedText variant="body1" weight="semibold" style={styles.settingLabel}>
                  Haptic Feedback
                </ThemedText>
                <ThemedText variant="body2" color="textSecondary">
                  Vibration feedback for actions and interactions
                </ThemedText>
              </View>
              <Switch
                value={settings.hapticFeedbackEnabled}
                onValueChange={(value) => handleToggle('hapticFeedbackEnabled', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={settings.hapticFeedbackEnabled ? theme.colors.textInverse : theme.colors.textTertiary}
              />
            </View>
          </ThemedCard>
        </View>

        {/* Reset Section */}
        <View style={styles.sectionContainer}>
          <ThemedCard variant="elevated" padding="lg" style={styles.card}>
            <ThemedText variant="heading4" weight="semibold" style={styles.sectionTitle}>
              🔄 Reset
            </ThemedText>
            
            <ThemedButton
              title="Reset to Default Settings"
              variant="error"
              size="md"
              fullWidth
              onPress={handleReset}
            />
          </ThemedCard>
        </View>

        {/* App Info */}
        <ThemedCard variant="elevated" padding="lg" style={styles.card}>
          <ThemedText variant="heading4" weight="semibold" style={styles.sectionTitle}>
            ℹ️ About
          </ThemedText>
          <View style={styles.infoContainer}>
            <ThemedText variant="body1" weight="semibold" style={styles.settingLabel}>
              Wordscapes Game
            </ThemedText>
            <ThemedText variant="body2" color="textSecondary" style={styles.settingLabel}>
              Version 1.0.0
            </ThemedText>
            <ThemedText variant="body2" color="textSecondary" align="center">
              Configure your game experience with these settings
            </ThemedText>
          </View>
        </ThemedCard>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  header: {
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  backButton: {
    alignSelf: 'flex-start' as const,
  },
  headerTitle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    justifyContent: 'center' as const,
  },
  headerSpacer: {
    width: 80, // Same width as back button for proper centering
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  sectionContainer: {
    marginBottom: theme.spacing.base,
  },
  card: {
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  sectionTitle: {
    marginBottom: theme.spacing.base,
  },
  settingItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSecondary,
    marginBottom: theme.spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.base,
  },
  settingLabel: {
    marginBottom: theme.spacing.xs,
  },
  infoContainer: {
    alignItems: 'center' as const,
  },
});

export default SettingsScreen;
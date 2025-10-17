import { useSettings } from '@/hooks/useSettings';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { showToast } from '@/lib/toast';
import { ChevronLeft, Settings as SettingsIcon, Users } from 'lucide-react-native';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  Switch,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import ThemedCard from '../ui/ThemedCard';
import ThemedText from '../ui/ThemedText';
import ThemedButton from '../ui/ThemedButton';

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const insets = useSafeAreaInsets();
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

  const handleReset = async () => {
    await resetSettings();
    showToast('Settings reset to default', 'success');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, {
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          paddingLeft: insets.left + theme.spacing.lg,
          paddingRight: insets.right + theme.spacing.lg,
        }]}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Back Button */}
        <ThemedButton
          title="Back"
          variant="glass"
          size="sm"
          leftIcon={<ChevronLeft size={20} color={theme.colors.text} />}
          onPress={() => onNavigate('back')}
          style={styles.backButton}
        />

        {/* Header Card */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.headerCard}>
          <View style={styles.headerTitle}>
            <SettingsIcon size={24} color={theme.colors.primary} />
            <ThemedText variant="heading2" weight="bold" align="center" style={styles.title}>
              Settings
            </ThemedText>
          </View>
          <ThemedText variant="body2" align="center" color="textSecondary" style={styles.subtitle}>
            Configure your game experience
          </ThemedText>
        </ThemedCard>
        {/* Theme Settings */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemeSwitcher />
        </ThemedCard>

        {/* Animation Settings */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" style={styles.sectionTitle}>
            🎨 Animations
          </ThemedText>
          
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

        {/* Audio Settings */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" style={styles.sectionTitle}>
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

        {/* Feedback Settings */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" style={styles.sectionTitle}>
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

        {/* Reset Section */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" style={styles.sectionTitle}>
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

        {/* App Info */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" style={styles.sectionTitle}>
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

        {/* Credits Section */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText variant="heading3" weight="bold" style={styles.sectionTitle}>
            👥 Team
          </ThemedText>
          
          <ThemedButton
            title="Meet the Development Team"
            variant="ghost"
            size="md"
            fullWidth
            leftIcon={<Users size={20} color={theme.colors.primary} />}
            onPress={() => onNavigate('credits')}
            style={styles.creditsButton}
          />
          
          <ThemedText variant="body2" color="textSecondary" align="center" style={styles.creditsDescription}>
            Learn more about the amazing developers who created this game
          </ThemedText>
        </ThemedCard>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => ({
  container: {
    flex: 1,
    position: 'relative' as const,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start' as const,
  },
  backButton: {
    alignSelf: 'flex-start' as const,
    marginBottom: theme.spacing.lg,
  },
  headerCard: {
    marginBottom: theme.spacing.lg,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  headerTitle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: theme.spacing.xs,
  },
  title: {
    marginLeft: theme.spacing.sm,
  },
  subtitle: {
    lineHeight: 18,
  },
  card: {
    marginBottom: theme.spacing.lg,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
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
  creditsButton: {
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  creditsDescription: {
    lineHeight: 18,
  },
  bottomSpacing: {
    height: theme.spacing.xl4,
  },
});

export default SettingsScreen;
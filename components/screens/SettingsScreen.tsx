import { APP_NAME } from "@/constants/brand";
import { useSettings } from "@/hooks/useSettings";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { showToast } from "@/lib/toast";
import { Bug, ChevronLeft, Users } from "lucide-react-native";
import React from "react";
import { Platform, ScrollView, StatusBar, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemeSwitcher from "../ui/ThemeSwitcher";
import ThemedButton from "../ui/ThemedButton";
import ThemedCard from "../ui/ThemedCard";
import ThemedText from "../ui/ThemedText";

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
      `${key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())} ${
        value ? "enabled" : "disabled"
      }`,
      "info"
    );
  };

  const handleReset = async () => {
    await resetSettings();
    showToast("Settings reset to default", "success");
  };

  const renderToggleRow = (
    label: string,
    description: string,
    key: keyof typeof settings,
    isLast = false
  ) => (
    <View style={[styles.settingItem, isLast && styles.settingItemLast]}>
      <View style={styles.settingInfo}>
        <ThemedText variant="body1" weight="semibold">
          {label}
        </ThemedText>
        <ThemedText variant="body2" color="textSecondary">
          {description}
        </ThemedText>
      </View>
      <Switch
        value={settings[key] as boolean}
        onValueChange={(value) => handleToggle(key, value)}
        trackColor={{
          false: theme.colors.border,
          true: theme.colors.primary,
        }}
        thumbColor={
          (settings[key] as boolean)
            ? theme.colors.textInverse
            : theme.colors.textTertiary
        }
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
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
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + theme.spacing.lg,
            paddingBottom: insets.bottom + theme.spacing.lg,
            paddingLeft: insets.left + theme.spacing.lg,
            paddingRight: insets.right + theme.spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <ThemedButton
          title="Back"
          variant="glass"
          size="sm"
          leftIcon={<ChevronLeft size={20} color={theme.colors.text} />}
          onPress={() => onNavigate("back")}
          style={styles.backButton}
        />

        {/* Single settings card */}
        <ThemedCard variant="glassStrong" padding="xl" style={styles.card}>
          <ThemedText variant="heading2" style={styles.title}>
            Settings
          </ThemedText>
          <ThemedText
            variant="body2"
            color="textSecondary"
            style={styles.subtitle}
          >
            Configure your game experience
          </ThemedText>

          <View style={styles.divider} />

          {/* Theme */}
          <ThemeSwitcher />

          <View style={styles.divider} />

          {/* Preferences */}
          <ThemedText
            variant="overline"
            color="textSecondary"
            style={styles.sectionTitle}
          >
            PREFERENCES
          </ThemedText>
          {renderToggleRow(
            "UI Animations",
            "Button presses, transitions, and other UI animations",
            "animationsEnabled"
          )}
          {renderToggleRow(
            "Sound Effects",
            "Game sounds, button clicks, and audio feedback",
            "soundEnabled"
          )}
          {renderToggleRow(
            "Haptic Feedback",
            "Vibration feedback for actions and interactions",
            "hapticFeedbackEnabled",
            true
          )}

          <View style={styles.divider} />

          {/* More */}
          <ThemedText
            variant="overline"
            color="textSecondary"
            style={styles.sectionTitle}
          >
            MORE
          </ThemedText>
          <ThemedButton
            title="Meet the Development Team"
            variant="ghost"
            size="md"
            fullWidth
            leftIcon={<Users size={20} color={theme.colors.primary} />}
            onPress={() => onNavigate("credits")}
            style={styles.linkButton}
          />
          <ThemedButton
            title="Debug Tools"
            variant="ghost"
            size="md"
            fullWidth
            leftIcon={<Bug size={20} color={theme.colors.warning} />}
            onPress={() => onNavigate("debug")}
            style={styles.linkButton}
          />
          <ThemedButton
            title="Reset to Default Settings"
            variant="outline"
            size="md"
            fullWidth
            onPress={handleReset}
            style={styles.resetButton}
            textStyle={{ color: theme.colors.error }}
          />

          <View style={styles.divider} />

          {/* About */}
          <View style={styles.infoContainer}>
            <ThemedText variant="body2" color="textSecondary">
              {APP_NAME} · Version 1.0.0
            </ThemedText>
          </View>
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
    position: "relative" as const,
    backgroundColor: "transparent",
    ...(Platform.OS === "web"
      ? { width: "100%" as const, maxWidth: 1600, alignSelf: "center" as const }
      : {}),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start" as const,
  },
  backButton: {
    alignSelf: "flex-start" as const,
    marginBottom: theme.spacing.lg,
  },
  card: {
    width: "100%" as const,
    maxWidth: 560,
    alignSelf: "center" as const,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.glassmorphismBorder,
    marginVertical: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  settingItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingVertical: theme.spacing.md,
  },
  settingItemLast: {
    paddingBottom: 0,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.base,
    gap: 2,
  },
  infoContainer: {
    alignItems: "center" as const,
  },
  linkButton: {
    marginBottom: theme.spacing.xs,
  },
  resetButton: {
    marginTop: theme.spacing.sm,
    borderColor: theme.colors.error,
  },
  bottomSpacing: {
    height: theme.spacing.xl4,
  },
});

export default SettingsScreen;

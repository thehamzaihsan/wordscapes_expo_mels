import {
  aggregateGuestStats,
  clearGuestProgress,
  derivePlayerLevel,
  loadGuestProgress,
  triggerEnergyRegenCheck,
  updateGuestAvatar,
  updateGuestName,
  type GuestProgressPayload,
} from "@/hooks/guest-progress";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { getDefaultEnergy, getTimeUntilNextEnergyRegen } from "@/lib/energy";
import { pullRemote, syncUser } from "@/lib/sync";
import { showToast } from "@/lib/toast";
import {
  ChevronLeft,
  Clock,
  Edit3,
  LogOut,
  Trash2,
  User,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemedButton from "../ui/ThemedButton";
import ThemedCard from "../ui/ThemedCard";
import ThemedInput from "../ui/ThemedInput";
import ThemedText from "../ui/ThemedText";

interface PlayerProfileScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

const PlayerProfileScreen: React.FC<PlayerProfileScreenProps> = ({
  onNavigate,
  onLogout,
}) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useSupabaseAuth();
  const [progress, setProgress] = useState<GuestProgressPayload | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [energyRegenInfo, setEnergyRegenInfo] = useState<{
    timeRemaining: string;
    nextRegenTime: Date;
  } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (user?.id) {
        try {
          await pullRemote(user.id);
        } catch (err) {
          console.warn("Failed to refresh profile snapshot", err);
        }
      }
      if (!active) return;
      // Trigger energy regeneration check first
      const gp =
        (await triggerEnergyRegenCheck()) || (await loadGuestProgress());
      if (!active) return;
      setProgress(gp);
      if (gp?.meta.playerName) setNameDraft(gp.meta.playerName);
      if (gp?.meta.avatar) setAvatarDraft(gp.meta.avatar);

      // Update energy regeneration info
      updateEnergyRegenInfo(gp);
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Function to update energy regeneration info
  const updateEnergyRegenInfo = (gp: GuestProgressPayload | null) => {
    if (!gp || !gp.meta.lastEnergyUpdate) {
      setEnergyRegenInfo(null);
      return;
    }

    const maxEnergy = getDefaultEnergy();

    // If energy is already at max, no need to show regen timer
    if (gp.meta.energy >= maxEnergy) {
      setEnergyRegenInfo(null);
      return;
    }

    const regenInfo = getTimeUntilNextEnergyRegen(gp.meta.lastEnergyUpdate);
    setEnergyRegenInfo({
      timeRemaining: regenInfo.formattedTime,
      nextRegenTime: regenInfo.nextRegenTime,
    });
  };

  // Set up interval to update energy regeneration timer every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (progress) {
        updateEnergyRegenInfo(progress);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [progress]);

  const handleSaveName = async () => {
    if (!nameDraft.trim()) {
      showToast("Name required", "error");
      return;
    }
    setSavingName(true);
    try {
      const sanitized = nameDraft.trim().slice(0, 20);
      const updated = await updateGuestName(sanitized);
      setProgress(updated);
      updateEnergyRegenInfo(updated);
      showToast("Display name updated", "success");
      if (user?.id) {
        syncUser(user.id).catch(() => {});
      }
    } catch {
      showToast("Failed to update name", "error");
    } finally {
      setSavingName(false);
    }
  };

  // --- Avatar Handling ---
  const avatars = [
    "🧩",
    "🐺",
    "🦊",
    "🦉",
    "🐉",
    "⚡",
    "🔥",
    "🌙",
    "⭐",
    "🛡️",
    "🧠",
    "🎯",
  ];

  const handleSelectAvatar = (icon: string) => {
    setAvatarDraft(icon);
  };

  const handleUpdateAvatar = async () => {
    if (!avatarDraft) return;
    setSavingAvatar(true);
    try {
      const updated = await updateGuestAvatar(avatarDraft);
      setProgress(updated);
      updateEnergyRegenInfo(updated);
      showToast("Avatar updated", "success");
      if (user?.id) {
        syncUser(user.id).catch(() => {});
      }
    } catch {
      showToast("Failed to update avatar", "error");
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will remove all your local progress and profile data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await clearGuestProgress();
            showToast("Local account data cleared", "info");
            onLogout();
          },
        },
      ]
    );
  };

  const stats = progress ? aggregateGuestStats(progress) : null;
  const derived = progress ? derivePlayerLevel(progress.meta.xp) : null;

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
          onPress={() => onNavigate("levels")}
          style={styles.backButton}
        />

        {/* Header Card */}
        <ThemedCard
          variant="glassStrong"
          padding="lg"
          style={styles.headerCard}
        >
          <ThemedText
            variant="heading2"
            weight="bold"
            align="center"
            style={styles.title}
          >
            PLAYER PROFILE
          </ThemedText>
          <ThemedText
            variant="body2"
            align="center"
            color="textSecondary"
            style={styles.subtitle}
          >
            Account & Progress Overview
          </ThemedText>
        </ThemedCard>

        {/* Identity Section */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText
            variant="heading3"
            weight="bold"
            style={styles.sectionTitle}
          >
            Identity
          </ThemedText>

          <View style={styles.inputContainer}>
            <ThemedInput
              label="Display Name"
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Display Name"
              variant="outlined"
              leftIcon={<User size={20} color={theme.colors.textSecondary} />}
              maxLength={20}
              style={styles.input}
            />
          </View>

          <ThemedButton
            title={savingName ? "Saving..." : "Update Name"}
            variant="primary"
            size="md"
            fullWidth
            isLoading={savingName}
            disabled={savingName || !nameDraft.trim()}
            onPress={handleSaveName}
            leftIcon={<Edit3 size={16} color={theme.colors.textInverse} />}
            style={styles.updateButton}
          />
        </ThemedCard>

        {/* Avatar Section */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText
            variant="heading3"
            weight="bold"
            style={styles.sectionTitle}
          >
            Avatar
          </ThemedText>

          <View style={styles.avatarGrid}>
            {avatars.map((icon, idx) => {
              const isSelected = avatarDraft === icon;
              return (
                <TouchableOpacity
                  key={icon + idx}
                  style={[
                    styles.avatarItem,
                    {
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                    {
                      backgroundColor: isSelected
                        ? `${theme.colors.primary}20`
                        : theme.colors.surfaceSecondary,
                    },
                  ]}
                  onPress={() => handleSelectAvatar(icon)}
                >
                  <ThemedText style={styles.avatarText}>{icon}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {avatarDraft && avatarDraft !== progress?.meta.avatar && (
            <ThemedButton
              title={savingAvatar ? "Updating..." : "Update Avatar"}
              variant="outline"
              size="md"
              fullWidth
              isLoading={savingAvatar}
              disabled={savingAvatar}
              onPress={handleUpdateAvatar}
              style={styles.updateButton}
            />
          )}
        </ThemedCard>

        {/* Progress Overview */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedText
            variant="heading3"
            weight="bold"
            style={styles.sectionTitle}
          >
            Progress Overview
          </ThemedText>

          {stats && (
            <View style={styles.statsGrid}>
              <View
                style={[
                  styles.statBox,
                  {
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <ThemedText variant="heading3" weight="bold" color="primary">
                  {stats.completedLevels}
                </ThemedText>
                <ThemedText variant="caption" color="textSecondary">
                  Completed
                </ThemedText>
              </View>
              <View
                style={[
                  styles.statBox,
                  {
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <ThemedText variant="heading3" weight="bold" color="primary">
                  {stats.completionPercent}%
                </ThemedText>
                <ThemedText variant="caption" color="textSecondary">
                  Progress
                </ThemedText>
              </View>
              <View
                style={[
                  styles.statBox,
                  {
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <ThemedText variant="heading3" weight="bold" color="primary">
                  {stats.categories}
                </ThemedText>
                <ThemedText variant="caption" color="textSecondary">
                  Categories
                </ThemedText>
              </View>
            </View>
          )}
        </ThemedCard>

        {/* Player Stats */}
        {progress && derived && (
          <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
            <ThemedText
              variant="heading3"
              weight="bold"
              style={styles.sectionTitle}
            >
              Player Stats
            </ThemedText>

            <View style={styles.resourceRow}>
              <View
                style={[
                  styles.resourcePill,
                  {
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <ThemedText style={styles.resourceEmoji}>💎</ThemedText>
                <ThemedText variant="body2" weight="semibold">
                  {progress.meta.gems}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.resourcePill,
                  {
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <ThemedText style={styles.resourceEmoji}>⚡</ThemedText>
                <ThemedText variant="body2" weight="semibold">
                  {progress.meta.energy}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.resourcePill,
                  {
                    backgroundColor: theme.colors.surfaceSecondary,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <ThemedText style={styles.resourceEmoji}>💡</ThemedText>
                <ThemedText variant="body2" weight="semibold">
                  {progress.meta.hints || 0}
                </ThemedText>
              </View>
            </View>

            {/* Energy Regeneration Timer */}
            {energyRegenInfo && (
              <View style={styles.energyRegenSection}>
                <View style={styles.energyRegenHeader}>
                  <Clock size={16} color={theme.colors.primary} />
                  <ThemedText
                    variant="body2"
                    weight="semibold"
                    color="primary"
                    style={styles.energyRegenTitle}
                  >
                    Next Energy Regen
                  </ThemedText>
                </View>
                <ThemedText
                  variant="body2"
                  color="textSecondary"
                  style={styles.energyRegenTime}
                >
                  +5 energy in {energyRegenInfo.timeRemaining}
                </ThemedText>
                <ThemedText
                  variant="caption"
                  color="textTertiary"
                  style={styles.energyRegenNote}
                >
                  Energy automatically regenerates every hour when below maximum
                </ThemedText>
              </View>
            )}

            {/* XP Progress Bar */}
            <View style={styles.xpSection}>
              <View style={styles.xpLabelRow}>
                <ThemedText variant="body2" weight="semibold">
                  Level {derived.level}
                </ThemedText>
                <ThemedText variant="caption" color="textSecondary">
                  {derived.levelXp} / {derived.nextLevelXp} XP
                </ThemedText>
              </View>
              <View
                style={[
                  styles.xpBarBackground,
                  { backgroundColor: theme.colors.border },
                ]}
              >
                <View
                  style={[
                    styles.xpBarFill,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${
                        (derived.levelXp / derived.nextLevelXp) * 100
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
          </ThemedCard>
        )}

        {/* Advanced Section */}
        <ThemedCard variant="glassStrong" padding="lg" style={styles.card}>
          <ThemedButton
            title={showAdvanced ? "Hide Advanced" : "Show Advanced"}
            variant="ghost"
            size="sm"
            onPress={() => setShowAdvanced(!showAdvanced)}
            style={styles.toggleButton}
          />

          {showAdvanced && (
            <View style={styles.advancedSection}>
              <ThemedButton
                title="Delete Local Data"
                variant="outline"
                size="md"
                fullWidth
                onPress={handleDeleteAccount}
                leftIcon={<Trash2 size={16} color={theme.colors.error} />}
                style={[
                  styles.dangerButton,
                  { borderColor: theme.colors.error },
                ]}
              />
            </View>
          )}
        </ThemedCard>

        {/* Logout Button */}
        <ThemedButton
          title="Sign Out"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={onLogout}
          leftIcon={<LogOut size={20} color={theme.colors.text} />}
          style={styles.logoutButton}
        />

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
      ? { maxWidth: 1600, alignSelf: "center" as const }
      : {}),
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start" as const,
  },
  backButton: {
    alignSelf: "flex-start" as const,
    marginBottom: theme.spacing.lg,
  },
  headerCard: {
    marginBottom: theme.spacing.lg,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  card: {
    marginBottom: theme.spacing.lg,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    lineHeight: 18,
  },
  sectionTitle: {
    marginBottom: theme.spacing.base,
  },
  inputContainer: {
    marginBottom: theme.spacing.base,
  },
  input: {
    borderRadius: theme.borderRadius.md,
  },
  updateButton: {
    marginTop: theme.spacing.sm,
  },
  avatarGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.base,
  },
  avatarItem: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 26,
  },
  statsGrid: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    gap: theme.spacing.sm,
  },
  statBox: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: "center" as const,
    borderWidth: 1,
  },
  resourceRow: {
    flexDirection: "row" as const,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.base,
    justifyContent: "center" as const,
  },
  resourcePill: {
    flexDirection: "row" as const,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 20,
    alignItems: "center" as const,
    gap: 6,
    borderWidth: 1,
  },
  resourceEmoji: {
    fontSize: 14,
  },
  xpSection: {
    marginTop: theme.spacing.sm,
  },
  xpLabelRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: theme.spacing.xs,
  },
  xpBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden" as const,
  },
  xpBarFill: {
    height: "100%",
  },
  energyRegenSection: {
    marginTop: theme.spacing.base,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  energyRegenHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  energyRegenTitle: {
    fontSize: 14,
  },
  energyRegenTime: {
    fontSize: 14,
    marginBottom: theme.spacing.xs,
  },
  energyRegenNote: {
    fontSize: 11,
    lineHeight: 14,
  },
  toggleButton: {
    alignSelf: "center" as const,
  },
  advancedSection: {
    marginTop: theme.spacing.base,
  },
  dangerButton: {
    marginTop: theme.spacing.sm,
  },
  logoutButton: {
    marginTop: theme.spacing.base,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  bottomSpacing: {
    height: theme.spacing.xl4,
  },
});

export default PlayerProfileScreen;

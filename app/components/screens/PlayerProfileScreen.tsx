import {
  aggregateGuestStats,
  clearGuestProgress,
  derivePlayerLevel,
  loadGuestProgress,
  updateGuestAvatar,
  updateGuestName,
  type GuestProgressPayload,
} from "@/hooks/guest-progress";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { pullRemote, syncUser } from "@/lib/sync";
import { showToast } from "@/lib/toast";
import { BlurView } from "expo-blur";
import { ChevronLeft } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface PlayerProfileScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

const PlayerProfileScreen: React.FC<PlayerProfileScreenProps> = ({
  onNavigate,
  onLogout,
}) => {
  const { user } = useSupabaseAuth();
  const [progress, setProgress] = useState<GuestProgressPayload | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);

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
      const gp = await loadGuestProgress();
      if (!active) return;
      setProgress(gp);
      if (gp?.meta.playerName) setNameDraft(gp.meta.playerName);
      if (gp?.meta.avatar) setAvatarDraft(gp.meta.avatar);
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

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
      <BlurView intensity={50} tint="dark" style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onNavigate("levels")}
        >
          <ChevronLeft size={20} color="white" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>PLAYER PROFILE</Text>
        <Text style={styles.subtitle}>Account & Progress Overview</Text>
      </BlurView>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Identity</Text>
          <View style={styles.rowGap}>
            <TextInput
              style={styles.input}
              value={nameDraft}
              onChangeText={setNameDraft}
              placeholder="Display Name"
              placeholderTextColor="#6B7280"
              maxLength={20}
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={handleSaveName}
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSaveName}
              disabled={savingName}
            >
              <Text style={styles.primaryButtonText}>
                {savingName ? "Saving..." : "Save Name"}
              </Text>
            </TouchableOpacity>
          </View>
          {progress && (
            <Text style={styles.muted}>
              {progress.meta.avatar || "🧩"} Player Level:{" "}
              {progress.meta.playerLevel} • Total XP: {progress.meta.xp}
            </Text>
          )}
          {derived && (
            <View style={styles.xpBarWrapper}>
              <View style={styles.xpLabelRow}>
                <Text style={styles.xpCaption}>
                  {derived.levelXp}/{derived.nextLevelXp} XP to next level
                </Text>
                <TouchableOpacity
                  style={styles.buyXpButton}
                  onPress={() => onNavigate("xpshop")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.buyXpText}>⚡ Buy XP</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.xpBarBackground}>
                <View
                  style={[
                    styles.xpBarFill,
                    {
                      width: `${
                        (derived.levelXp / derived.nextLevelXp) * 100
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Stats</Text>
          {stats ? (
            <View style={styles.statsGrid}>
              <Stat
                label="Levels"
                value={`${stats.completedLevels}/${stats.totalLevels}`}
              />
              <Stat label="Completion" value={`${stats.completionPercent}%`} />
              <Stat label="Attempts" value={`${stats.totalAttempts}`} />
              <Stat label="Categories" value={`${stats.categories}`} />
            </View>
          ) : (
            <Text style={styles.muted}>Loading stats...</Text>
          )}
        </View>

        {/* Avatar Selection */}
        {progress && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Avatar</Text>
            <View style={styles.avatarGrid}>
              {avatars.map((a) => {
                const active = (avatarDraft ?? progress.meta.avatar) === a;
                return (
                  <TouchableOpacity
                    key={a}
                    style={[
                      styles.avatarItem,
                      active && styles.avatarItemActive,
                    ]}
                    onPress={() => handleSelectAvatar(a)}
                  >
                    <Text style={styles.avatarText}>{a}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {avatarDraft !== (progress.meta.avatar ?? null) && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleUpdateAvatar}
                disabled={savingAvatar}
              >
                <Text style={styles.primaryButtonText}>
                  {savingAvatar ? "Updating..." : "Update Avatar"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Account Management */}
        <View style={styles.card}>
          <TouchableOpacity onPress={() => setShowAdvanced((v) => !v)}>
            <Text style={styles.sectionTitle}>
              {showAdvanced ? "Account ▲" : "Account ▼"}
            </Text>
          </TouchableOpacity>
          {showAdvanced && (
            <View style={styles.rowGap}>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.dangerButtonText}>
                  Delete Account (Local)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => showToast("Cloud sync coming soon", "info")}
              >
                <Text style={styles.outlineButtonText}>Sync (Future)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Logout */}
        <View style={styles.footerSpace} />
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121213" },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  subtitle: { color: "#9CA3AF", fontSize: 12, marginTop: 4 },
  scroll: { padding: 20, paddingBottom: 120, gap: 20 },
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#374151",
    gap: 12,
  },
  sectionTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  rowGap: { gap: 12 },
  input: {
    backgroundColor: "#374151",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  secondaryButton: {
    backgroundColor: "#334155",
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#FBBF24", fontSize: 13, fontWeight: "600" },
  dangerButton: {
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  dangerButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#8B5CF6",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  outlineButtonText: { color: "#8B5CF6", fontSize: 13, fontWeight: "600" },
  logoutButton: {
    backgroundColor: "#475569",
    paddingVertical: 14,
    marginHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
  },
  logoutButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  muted: { color: "#9CA3AF", fontSize: 12 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 16,
    columnGap: 12,
  },
  statBox: {
    width: "30%",
    backgroundColor: "#111827",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  statValue: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  statLabel: { color: "#9CA3AF", fontSize: 11, marginTop: 4 },
  inlineStats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  resourcePill: {
    flexDirection: "row",
    backgroundColor: "#111827",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  resourceEmoji: { fontSize: 14 },
  resourceText: { color: "#F1F5F9", fontSize: 13, fontWeight: "600" },
  xpBarWrapper: { marginTop: 10, gap: 6 },
  xpLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  buyXpButton: {
    backgroundColor: "rgba(139,92,246,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.4)",
  },
  buyXpText: {
    color: "#8B5CF6",
    fontSize: 10,
    fontWeight: "600",
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: "#374151",
    borderRadius: 4,
    overflow: "hidden",
  },
  xpBarFill: { height: "100%", backgroundColor: "#8B5CF6" },
  xpCaption: { color: "#9CA3AF", fontSize: 11 },
  footerSpace: { height: 40 },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  avatarItem: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1f2937",
  },
  avatarItemActive: {
    borderColor: "#8B5CF6",
    backgroundColor: "#1e1b4b",
  },
  avatarText: { fontSize: 26 },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    alignSelf: "flex-start",
    paddingEnd: 16,
    marginBottom: 16,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PlayerProfileScreen;

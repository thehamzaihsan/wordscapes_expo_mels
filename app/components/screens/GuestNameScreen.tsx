import levelsData from "@/constants/levels.json";
import {
    createNewGuestProfile,
    updateGuestAvatar,
} from "@/hooks/guest-progress";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
    Keyboard,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface GuestNameScreenProps {
  onNavigate: (screen: string) => void;
  onCancel: () => void;
}

const AVATARS = [
  "🛡️",
  "🐺",
  "🦊",
  "🦅",
  "🐉",
  "⚡",
  "🔥",
  "🌙",
  "⭐",
  "🧠",
  "🎯",
];

const GuestNameScreen: React.FC<GuestNameScreenProps> = ({
  onNavigate,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const inputRef = useRef<TextInput | null>(null);

  const adjectives = useMemo(
    () => [
      "Swift",
      "Shadow",
      "Crimson",
      "Silent",
      "Lucky",
      "Iron",
      "Golden",
      "Frost",
      "Rapid",
      "Arcane",
      "Lunar",
      "Solar",
      "Wild",
      "Nimble",
      "Brave",
    ],
    []
  );
  const nouns = useMemo(
    () => [
      "Wolf",
      "Phoenix",
      "Raven",
      "Blade",
      "Comet",
      "Drake",
      "Knight",
      "Vortex",
      "Tiger",
      "Wizard",
      "Ranger",
      "Saber",
      "Giant",
      "Spirit",
      "Falcon",
    ],
    []
  );

  const generateRandomName = useCallback(() => {
    const a = adjectives[Math.floor(Math.random() * adjectives.length)];
    const n = nouns[Math.floor(Math.random() * nouns.length)];
    const combo = `${a}${n}`.slice(0, 16);
    setName(combo);
    setInputError(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [adjectives, nouns]);

  const sanitize = (raw: string) => raw.replace(/[^a-zA-Z0-9_\- ]/g, "").trim();

  const handleContinue = async () => {
    const cleaned = sanitize(name);
    if (!cleaned) {
      setInputError("Please enter a name");
      return;
    }
    if (cleaned.length < 3) {
      setInputError("Min 3 characters");
      return;
    }
    setInputError(null);
    setSaving(true);
    try {
      await createNewGuestProfile({
        playerName: cleaned,
        levelDefs: levelsData as any,
      });
      await updateGuestAvatar(avatar);
      onNavigate("levels");
    } catch (e) {
      console.warn("Failed to init guest profile", e);
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={Platform.OS === "android" ? "light-content" : "light-content"}
        backgroundColor="#121213"
      />
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Create Guest Profile</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Choose a Name</Text>
        <Text style={styles.subtitle}>
          You can change this later in your profile.
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Enter player name"
            placeholderTextColor="#6B7280"
            value={name}
            maxLength={16}
            onChangeText={(t) => {
              setName(t);
              if (inputError) setInputError(null);
            }}
            returnKeyType="done"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            blurOnSubmit={false}
            onSubmitEditing={() => {
              Keyboard.dismiss();
              handleContinue();
            }}
            selectionColor="#8B5CF6"
          />
          <TouchableOpacity
            style={styles.randomButton}
            onPress={generateRandomName}
          >
            <Text style={styles.randomButtonText}>🎲</Text>
          </TouchableOpacity>
        </View>
        {inputError && <Text style={styles.errorText}>{inputError}</Text>}
        <Text style={styles.avatarLabel}>Select an Avatar</Text>
        <View style={styles.avatarGrid}>
          {AVATARS.map((a, idx) => {
            const active = avatar === a;
            return (
              <TouchableOpacity
                key={a + "-" + idx}
                style={[styles.avatarItem, active && styles.avatarItemActive]}
                onPress={() => setAvatar(a)}
                accessibilityLabel={`Avatar ${a}`}
              >
                <Text style={styles.avatarText}>{a}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!name.trim() || saving) && styles.primaryButtonDisabled,
          ]}
          disabled={!name.trim() || saving}
          onPress={handleContinue}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? "CREATING..." : "CONTINUE"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: { paddingVertical: 6, paddingHorizontal: 6 },
  backButtonText: { color: "#9CA3AF", fontSize: 14 },
  screenTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginBottom: 8 },
  subtitle: { color: "#9CA3AF", fontSize: 13, marginBottom: 20 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  input: {
    flex: 1,
  backgroundColor: "rgba(31,41,55,0.85)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#374151",
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 16,
  },
  randomButton: {
  backgroundColor: "rgba(55,65,81,0.85)",
    borderWidth: 2,
    borderColor: "#4B5563",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  randomButtonText: { fontSize: 20 },
  errorText: {
    color: "#EF4444",
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "600",
  },
  avatarLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 10,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 30,
  },
  avatarItem: {
    width: 60,
    height: 60,
  backgroundColor: "rgba(17,24,39,0.85)",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1f2937",
  },
  avatarItemActive: { borderColor: "#8B5CF6", backgroundColor: "rgba(30,27,75,0.7)" },
  avatarText: { fontSize: 28 },
  primaryButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  primaryButtonDisabled: { backgroundColor: "#4B5563", borderColor: "#6B7280" },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
});

export default GuestNameScreen;

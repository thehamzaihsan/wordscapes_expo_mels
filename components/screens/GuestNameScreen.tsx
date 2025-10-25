import levelsData from "@/constants/levels.json";
import {
  createNewGuestProfile,
  updateGuestAvatar,
} from "@/hooks/guest-progress";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { ChevronLeft, Dices } from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Keyboard,
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
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const inputRef = useRef<any>(null);

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
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
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
          onPress={onCancel}
          style={styles.backButton}
        />

        {/* Create Profile Card */}
        <ThemedCard
          variant="glassStrong"
          padding="xl"
          style={styles.profileCard}
        >
          <ThemedText
            variant="heading2"
            weight="bold"
            align="center"
            style={styles.title}
          >
            Create Guest Profile
          </ThemedText>

          <ThemedText
            variant="body2"
            align="center"
            color="textSecondary"
            style={styles.subtitle}
          >
            You can change this later in your profile.
          </ThemedText>

          {/* Name Input with Random Button */}
          <View style={styles.inputContainer}>
            <ThemedInput
              ref={inputRef}
              label="Choose a Name"
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (inputError) setInputError(null);
              }}
              placeholder="Enter player name"
              variant="outlined"
              maxLength={16}
              returnKeyType="done"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              rightIcon={<Dices size={20} color={theme.colors.textSecondary} />}
              onRightIconPress={generateRandomName}
              error={inputError}
              onSubmitEditing={() => {
                Keyboard.dismiss();
                handleContinue();
              }}
              style={styles.input}
            />
          </View>

          {/* Avatar Selection */}
          <ThemedText
            variant="body1"
            weight="semibold"
            style={styles.avatarLabel}
          >
            Select an Avatar
          </ThemedText>
          <View style={styles.avatarGrid}>
            {AVATARS.map((a, idx) => {
              const active = avatar === a;
              return (
                <TouchableOpacity
                  key={a + "-" + idx}
                  style={[
                    styles.avatarItem,
                    {
                      borderColor: active
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                    {
                      backgroundColor: active
                        ? `${theme.colors.primary}20`
                        : theme.colors.surfaceSecondary,
                    },
                  ]}
                  onPress={() => setAvatar(a)}
                  accessibilityLabel={`Avatar ${a}`}
                >
                  <ThemedText style={styles.avatarText}>{a}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Continue Button */}
          <ThemedButton
            title={saving ? "CREATING..." : "CONTINUE"}
            variant="primary"
            size="lg"
            fullWidth
            isLoading={saving}
            disabled={!name.trim() || saving}
            onPress={handleContinue}
            style={styles.continueButton}
          />
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
    marginLeft: theme.spacing.base - 3,
  },
  profileCard: {
    maxWidth: 400,
    alignSelf: "center" as const,
    width: "100%",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  title: {
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    marginBottom: theme.spacing.xl2,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  input: {
    borderRadius: theme.borderRadius.md,
  },
  avatarLabel: {
    marginBottom: theme.spacing.base,
    marginTop: theme.spacing.base,
  },
  avatarGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl2,
    justifyContent: "space-between" as const,
  },
  avatarItem: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 2,
  },
  avatarText: {
    fontSize: 25,
  },
  continueButton: {
    marginTop: theme.spacing.sm,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    backgroundColor: theme.colors.primary,
  },
  bottomSpacing: {
    height: theme.spacing.xl4,
  },
});

export default GuestNameScreen;

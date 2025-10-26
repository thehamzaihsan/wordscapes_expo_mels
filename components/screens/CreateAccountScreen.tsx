import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { sendSignupOtp } from "@/lib/auth";
import { isSupabaseEnabled } from "@/lib/supabase";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
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

interface CreateAccountScreenProps {
  onNavigate: (screen: string, params?: { email?: string }) => void;
  onCancel: () => void;
  initialEmail?: string;
  googlePrefill?: boolean; // Google flow disabled for now
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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({
  onNavigate,
  onCancel,
  initialEmail,
  googlePrefill,
}) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  // Single-step flow (Google flow disabled)
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail || "");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Google flow disabled for now
  const nameRef = useRef<any>(null);
  const emailRef = useRef<any>(null);
  const passRef = useRef<any>(null);

  const validateCommon = useCallback((n: string) => {
    if (!n.trim()) return "Name required";
    if (n.trim().length < 3) return "Name too short";
    if (n.trim().length > 20) return "Name too long";
    return null;
  }, []);

  const handleLocalCreate = async () => {
    const nameErr = validateCommon(name);
    if (nameErr) {
      setError(nameErr);
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setError("Invalid email");
      return;
    }
    if (password.length < 6) {
      setError("Password ≥ 6 chars");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (!isSupabaseEnabled()) {
        setError("Supabase not configured");
      } else {
        const res = await sendSignupOtp({
          email: email.trim().toLowerCase(),
          password,
          username: name.trim(),
          avatar,
        });
        if (!res.ok) {
          setError(res.error || "Failed to send OTP");
        } else {
          onNavigate("otp-verify", { email: email.trim().toLowerCase() });
        }
      }
    } catch (e: any) {
      setError(e?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // Google sign-in handler removed

  // Google completion removed

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

        {/* Create Account Card */}
        <ThemedCard
          variant="glassStrong"
          padding="xl"
          style={styles.accountCard}
        >
          <ThemedText
            variant="heading2"
            weight="bold"
            align="center"
            style={styles.title}
          >
            Create Account
          </ThemedText>

          <ThemedText
            variant="body2"
            align="center"
            color="textSecondary"
            style={styles.subtitle}
          >
            Join the word journey and save your progress
          </ThemedText>

          {!googlePrefill && (
            <>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <ThemedInput
                  ref={nameRef}
                  label="Your Name"
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your name"
                  variant="outlined"
                  leftIcon={
                    <User size={20} color={theme.colors.textSecondary} />
                  }
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  autoCapitalize="words"
                  style={styles.input}
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <ThemedInput
                  ref={emailRef}
                  label="Email Address"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  variant="outlined"
                  leftIcon={
                    <Mail size={20} color={theme.colors.textSecondary} />
                  }
                  returnKeyType="next"
                  onSubmitEditing={() => passRef.current?.focus()}
                  style={styles.input}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <ThemedInput
                  ref={passRef}
                  label="Password"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  variant="outlined"
                  leftIcon={
                    <Lock size={20} color={theme.colors.textSecondary} />
                  }
                  rightIcon={
                    showPassword ? (
                      <EyeOff size={20} color={theme.colors.textSecondary} />
                    ) : (
                      <Eye size={20} color={theme.colors.textSecondary} />
                    )
                  }
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    Keyboard.dismiss();
                    handleLocalCreate();
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
                Choose Avatar
              </ThemedText>
              <View style={styles.avatarGrid}>
                {AVATARS.map((a, i) => {
                  const active = avatar === a;
                  return (
                    <TouchableOpacity
                      key={a + i}
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
                    >
                      <ThemedText style={styles.avatarText}>{a}</ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Error Display */}
              {error && (
                <ThemedText
                  variant="body2"
                  color="error"
                  style={styles.errorText}
                >
                  {error}
                </ThemedText>
              )}

              {/* Create Account Button */}
              <ThemedButton
                title={loading ? "CREATING..." : "CREATE ACCOUNT"}
                variant="primary"
                size="lg"
                fullWidth
                isLoading={loading}
                disabled={loading}
                onPress={handleLocalCreate}
                style={styles.createButton}
              />
            </>
          )}
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
  },
  accountCard: {
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
    marginBottom: theme.spacing.lg,
    justifyContent: "space-between" as const,
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
    fontSize: 24,
  },
  errorText: {
    marginBottom: theme.spacing.base,
    textAlign: "center" as const,
  },
  createButton: {
    marginTop: theme.spacing.sm,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  bottomSpacing: {
    height: theme.spacing.xl4,
  },
});

export default CreateAccountScreen;

import React, { useCallback, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Keyboard,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import levelsData from "@/constants/levels.json";
import {
  createNewGuestProfile,
  updateGuestAvatar,
} from "@/hooks/guest-progress";
import {
  createLocalAccount,
  createGoogleAccount,
  mockGoogleSignIn,
} from "@/hooks/account";

interface CreateAccountScreenProps {
  onNavigate: (screen: string) => void;
  onCancel: () => void;
  initialEmail?: string;
  googlePrefill?: boolean; // if coming from login google and need only name+avatar
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
  const [step, setStep] = useState<"form" | "googleName">(
    googlePrefill ? "googleName" : "form"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail || "");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const nameRef = useRef<TextInput | null>(null);
  const emailRef = useRef<TextInput | null>(null);
  const passRef = useRef<TextInput | null>(null);

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
      await createLocalAccount({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      await createNewGuestProfile({
        playerName: name.trim(),
        levelDefs: levelsData as any,
      });
      await updateGuestAvatar(avatar);
      onNavigate("levels");
    } catch {
      setError("Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await mockGoogleSignIn();
      setGoogleEmail(res.email);
      setStep("googleName");
      requestAnimationFrame(() => nameRef.current?.focus());
    } catch {
      setError("Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleComplete = async () => {
    const nameErr = validateCommon(name);
    if (nameErr) {
      setError(nameErr);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await createGoogleAccount({ name: name.trim(), email: googleEmail });
      await createNewGuestProfile({
        playerName: name.trim(),
        levelDefs: levelsData as any,
      });
      await updateGuestAvatar(avatar);
      onNavigate("levels");
    } catch {
      setError("Failed finishing account");
    } finally {
      setLoading(false);
    }
  };

  const AvatarPicker = (
    <View>
      <Text style={styles.sectionLabel}>Choose Avatar</Text>
      <View style={styles.avatarGrid}>
        {AVATARS.map((a, i) => {
          const active = avatar === a;
          return (
            <TouchableOpacity
              key={a + i}
              style={[styles.avatarItem, active && styles.avatarItemActive]}
              onPress={() => setAvatar(a)}
            >
              <Text style={styles.avatarText}>{a}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={Platform.OS === "android" ? "light-content" : "light-content"}
        backgroundColor="#121213"
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Account</Text>
        {step === "form" && !googlePrefill && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Your Info</Text>
            <TextInput
              ref={nameRef}
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (error) setError(null);
              }}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              autoCapitalize="words"
              selectionColor="#8B5CF6"
            />
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#6B7280"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (error) setError(null);
              }}
              returnKeyType="next"
              onSubmitEditing={() => passRef.current?.focus()}
              selectionColor="#8B5CF6"
            />
            <TextInput
              ref={passRef}
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#6B7280"
              secureTextEntry
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (error) setError(null);
              }}
              returnKeyType="done"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                handleLocalCreate();
              }}
              selectionColor="#8B5CF6"
            />
            {AvatarPicker}
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity
              disabled={loading}
              style={[
                styles.primaryButton,
                loading && styles.primaryButtonDisabled,
              ]}
              onPress={handleLocalCreate}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>CREATE ACCOUNT</Text>
              )}
            </TouchableOpacity>
            <View style={styles.dividerRow}>
              <View style={styles.hr} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.hr} />
            </View>
            <TouchableOpacity
              disabled={loading}
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
            >
              {loading ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <View style={styles.googleContentRow}>
                  <Image
                    source={{
                      uri: "https://developers.google.com/identity/images/g-logo.png",
                    }}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>
                    SIGN IN WITH GOOGLE
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
        {(step === "googleName" || googlePrefill) && (
          <View style={styles.card}>
            <Text style={styles.subtitleCenter}>
              Signed in as {googleEmail || email}
            </Text>
            <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
              Pick a Display Name
            </Text>
            <TextInput
              ref={nameRef}
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (error) setError(null);
              }}
              returnKeyType="done"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                handleGoogleComplete();
              }}
              selectionColor="#8B5CF6"
              autoCapitalize="words"
            />
            {AvatarPicker}
            {error && <Text style={styles.errorText}>{error}</Text>}
            <TouchableOpacity
              disabled={loading}
              style={[
                styles.primaryButton,
                loading && styles.primaryButtonDisabled,
              ]}
              onPress={handleGoogleComplete}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>FINISH</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              disabled={loading}
              style={styles.secondaryButton}
              onPress={() => {
                setStep("form");
                setGoogleEmail("");
                setName("");
              }}
            >
              <Text style={styles.secondaryButtonText}>
                ← Use Email Instead
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#121213" },
  scroll: { padding: 20, paddingBottom: 40 },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#1F2937",
    borderRadius: 8,
    marginBottom: 12,
  },
  backButtonText: { color: "#9CA3AF", fontSize: 14 },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 1,
  },
  sectionLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  card: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "#374151",
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#374151",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 16,
    borderWidth: 2,
    borderColor: "#4B5563",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#7C3AED",
    marginTop: 8,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1,
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  googleButtonText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  googleContentRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  googleIcon: { width: 18, height: 18, resizeMode: "contain" },
  secondaryButton: {
    backgroundColor: "#374151",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4B5563",
    marginTop: 12,
  },
  secondaryButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  avatarItem: {
    width: 56,
    height: 56,
    backgroundColor: "#111827",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1f2937",
  },
  avatarItemActive: { borderColor: "#8B5CF6", backgroundColor: "#1e1b4b" },
  avatarText: { fontSize: 26 },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 18,
  },
  hr: { flex: 1, height: 1, backgroundColor: "#374151" },
  orText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  subtitleCenter: {
    color: "#9CA3AF",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
});

export default CreateAccountScreen;

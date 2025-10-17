import { sendPasswordResetOtp } from "@/lib/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BackgroundImage from "./components/common/BackgroundImage";

export default function ForgotPasswordEmail() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSend = async () => {
    if (!email.includes("@")) return setError("Enter a valid email");
    setLoading(true);
    setError(null);
    const res = await sendPasswordResetOtp(email);
    setLoading(false);
    if (!res.ok) return setError(res.error || "Failed to send OTP");
    router.push({ pathname: "/forgot-password-otp", params: { email } });
  };

  return (
    <View style={styles.container}>
      <BackgroundImage />
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter your email to receive a 6-digit code.
      </Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor="#6B7280"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        onPress={onSend}
        style={styles.button}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>SEND CODE</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121213",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#9CA3AF", fontSize: 14, textAlign: "center" },
  input: {
    width: "100%",
    backgroundColor: "#1F2937",
    color: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#374151",
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#7C3AED",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  error: { color: "#EF4444", fontWeight: "600" },
  back: { color: "#9CA3AF", marginTop: 8 },
});

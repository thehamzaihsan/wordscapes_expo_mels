import { sendLoginMagicLink } from "@/lib/auth";
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

export default function LoginMagicLink() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSend = async () => {
    if (!email.includes("@")) return setError("Enter a valid email");
    setLoading(true);
    setError(null);
    const res = await sendLoginMagicLink(email);
    setLoading(false);
    if (!res.ok) return setError(res.error || "Failed to send link");
    setSent(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Magic link sign‑in</Text>
      <Text style={styles.subtitle}>
        {sent
          ? "Check your inbox and open the link on this device."
          : "We'll email you a secure sign‑in link."}
      </Text>
      {!sent && (
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#6B7280"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      {!sent ? (
        <TouchableOpacity
          onPress={onSend}
          style={styles.button}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>EMAIL ME A LINK</Text>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => router.replace("/login")}
          style={styles.button}
        >
          <Text style={styles.buttonText}>BACK TO LOGIN</Text>
        </TouchableOpacity>
      )}
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

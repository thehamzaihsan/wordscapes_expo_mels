import BackgroundImage from "@/components/common/BackgroundImage";
import { verifyLoginOtp } from "@/lib/auth";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginEmailCode() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email || "").toString();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onVerify = async () => {
    if (code.trim().length !== 6) return setError("Enter 6-digit code");
    setLoading(true);
    setError(null);
    const res = await verifyLoginOtp({ email, token: code });
    setLoading(false);
    if (!res.ok) return setError(res.error || "Verification failed");
    router.replace("/levels");
  };

  return (
    <View style={styles.container}>
      <BackgroundImage />
      <Text style={styles.title}>Enter the code</Text>
      <Text style={styles.subtitle}>We sent a 6‑digit code to {email}</Text>
      <TextInput
        style={styles.code}
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        placeholderTextColor="#85A09B"
        keyboardType="number-pad"
        maxLength={6}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        onPress={onVerify}
        style={styles.button}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>VERIFY</Text>
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
  code: {
    width: 180,
    textAlign: "center",
    backgroundColor: "#132322",
    color: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#38504B",
    paddingVertical: 12,
    fontSize: 20,
    letterSpacing: 8,
    marginTop: 8,
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

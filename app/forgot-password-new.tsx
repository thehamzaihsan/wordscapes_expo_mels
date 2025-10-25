import BackgroundImage from "@/components/common/BackgroundImage";
import { updatePassword } from "@/lib/auth";
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

export default function ForgotPasswordNew() {
  const router = useRouter();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSet = async () => {
    if (pass.length < 6) return setError("Password ≥ 6 characters");
    if (pass !== confirm) return setError("Passwords do not match");
    setLoading(true);
    setError(null);
    const res = await updatePassword(pass);
    setLoading(false);
    if (!res.ok) return setError(res.error || "Failed to update password");
    router.replace("/levels");
  };

  return (
    <View style={styles.container}>
      <BackgroundImage />
      <Text style={styles.title}>Set a new password</Text>
      <TextInput
        style={styles.input}
        value={pass}
        onChangeText={setPass}
        placeholder="New password"
        placeholderTextColor="#6B7280"
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Confirm password"
        placeholderTextColor="#6B7280"
        secureTextEntry
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        onPress={onSet}
        style={styles.button}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>UPDATE PASSWORD</Text>
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

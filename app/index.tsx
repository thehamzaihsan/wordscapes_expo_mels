import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRouter } from "expo-router";
import { Play, Settings } from "lucide-react-native";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Logo from "./components/logo";

export default function Index() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loading, session } = useSupabaseAuth();

  const handlePlay = () => {
    if (session) router.push("/levels");
    else router.push("/login");
  };
  const handleSettings = () => router.push("/settings");

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <View style={styles.mainContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logoSection}>
            <Logo />
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handlePlay} style={styles.primaryButton}>
            <Play size={18} color={"white"} />
            <Text style={styles.primaryButtonText}> Play Game</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSettings}
            style={styles.secondaryButton}
          >
            <Settings size={18} color={"white"} />
            <Text style={styles.secondaryButtonText}> Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#121213",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logoSection: {
    alignItems: "center",
    position: "relative",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
  },
  primaryButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#7C3AED",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  secondaryButton: {
    backgroundColor: "#374151",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4B5563",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});

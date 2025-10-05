import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { Alert, BackHandler, Platform } from "react-native";
import LoginScreen from "./components/Login";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export default function LoginRoute() {
  const router = useRouter();
  const { session, loading } = useSupabaseAuth();

  // If already logged in, push to levels immediately
  useEffect(() => {
    if (!loading && session) {
      router.replace("/levels");
    }
  }, [loading, session, router]);

  // Handle Android back button on login screen
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Show exit confirmation on login screen
        Alert.alert("Exit App", "Are you sure you want to exit?", [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", onPress: () => BackHandler.exitApp() },
        ]);
        return true; // Prevent default behavior
      };

      if (Platform.OS === "android") {
        const subscription = BackHandler.addEventListener(
          "hardwareBackPress",
          onBackPress
        );
        return () => subscription.remove();
      }
    }, [])
  );

  const handleNavigate = (screen: string) => {
    if (screen === "levels") {
      router.push("/levels");
    } else if (screen === "guest-name") {
      router.push("/guest-name");
    } else if (screen === "create-account") {
      router.push("/create-account");
    } else if (screen === "settings") {
      router.push("/settings");
    }
  };

  return <LoginScreen onNavigate={handleNavigate} />;
}

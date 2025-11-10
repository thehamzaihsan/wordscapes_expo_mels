import BackgroundImage from "@/components/common/BackgroundImage";
import LoadingScreen from "@/components/common/LoadingScreen";
import LoginScreen from "@/components/screens/Login";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";


export default function LoginRoute() {
  const router = useRouter();
  const { session, loading } = useSupabaseAuth();

  // Redirect to levels only when this route is focused, to avoid stealing
  // control during flows like password recovery on other screens.
  useFocusEffect(
    useCallback(() => {
      if (!loading && session) {
        router.replace("/levels");
      }
      return undefined;
    }, [loading, session, router])
  );

  const [isLoading, setIsLoading] = useState(false);

  const handleNavigate = async (screen: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800)); // Wait for loading animation

    if (screen === "levels") {
      await router.push("/levels");
    } else if (screen === "guest-name") {
      await router.push("/guest-name");
    } else if (screen === "create-account") {
      await router.push("/create-account");
    } else if (screen === "settings") {
      await router.push("/settings");
    } else if (screen === "forgot-password") {
      await router.push("/forgot-password-email" as any);
    } else if (screen === "login-email") {
      await router.push("/login-email" as any);
    } else if (screen === "back") {
      await router.push("/");
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <BackgroundImage />
        <LoadingScreen />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <BackgroundImage />
      <LoginScreen onNavigate={handleNavigate} />
    </View>
  );
}

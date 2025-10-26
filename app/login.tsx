import BackgroundImage from "@/components/common/BackgroundImage";
import LoadingScreen from "@/components/common/LoadingScreen";
import LoginScreen from "@/components/screens/Login";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
<<<<<<< HEAD
import LoginScreen from "./components/screens/Login";
import LoadingScreen from "./components/common/LoadingScreen";
=======
import { View } from "react-native";

>>>>>>> ui-overhall

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

<<<<<<< HEAD


  const handleNavigate = (screen: string) => {
=======
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigate = async (screen: string) => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800)); // Wait for loading animation

>>>>>>> ui-overhall
    if (screen === "levels") {
      router.push("/levels");
    } else if (screen === "guest-name") {
      router.push("/guest-name");
    } else if (screen === "create-account") {
      router.push("/create-account");
    } else if (screen === "settings") {
      router.push("/settings");
    } else if (screen === "forgot-password") {
      router.push("/forgot-password-email" as any);
    } else if (screen === "login-email") {
      router.push("/login-email" as any);
    }
<<<<<<< HEAD
=======

    setIsLoading(false);
>>>>>>> ui-overhall
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <BackgroundImage />
      <LoginScreen onNavigate={handleNavigate} />
    </View>
  );
}

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import LoginScreen from "./components/screens/Login";

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



  const handleNavigate = (screen: string) => {
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
  };

  return <LoginScreen onNavigate={handleNavigate} />;
}

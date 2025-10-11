import React from "react";
import { useRouter } from "expo-router";
import LoadingScreen from "./components/common/LoadingScreen";
import { signOutSupabase } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import PlayerProfileScreen from "./components/screens/PlayerProfileScreen";

export default function ProfileRoute() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const handleNavigate = async (screen: string) => {
    setIsLoading(true);
    setTimeout(() => {
      if (screen === "levels") {
        router.back();
      } else if (screen === "xpshop") {
        router.push("/xpshop");
      }
      setIsLoading(false);
    }, 600); // Show loading for 600ms before navigating
  };
  const handleLogout = async () => {
    setIsLoading(true);
    const res = await signOutSupabase();
    if (!res.ok) showToast(res.error || "Sign out failed", "error");
    else showToast("Signed out", "info");
    router.replace("/login");
    setTimeout(() => setIsLoading(false), 600);
  };
  return (
    <>
      {isLoading && <LoadingScreen progress={0.7} />}
      <PlayerProfileScreen onNavigate={handleNavigate} onLogout={handleLogout} />
    </>
  );
}

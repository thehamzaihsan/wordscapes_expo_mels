import { useRouter } from "expo-router";
import { signOutSupabase } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import React from "react";
import PlayerProfileScreen from "./components/screens/PlayerProfileScreen";

export default function ProfileRoute() {
  const router = useRouter();
  const handleNavigate = (screen: string) => {
    if (screen === "levels") {
      router.back();
    } else if (screen === "xpshop") {
      router.push("/xpshop");
    }
  };
  const handleLogout = async () => {
    const res = await signOutSupabase();
    if (!res.ok) showToast(res.error || "Sign out failed", "error");
    else showToast("Signed out", "info");
    router.replace("/login");
  };
  return (
    <PlayerProfileScreen onNavigate={handleNavigate} onLogout={handleLogout} />
  );
}

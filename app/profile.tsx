<<<<<<< HEAD
import { useRouter } from "expo-router";
import LoadingScreen from "./components/common/LoadingScreen";
import { signOutSupabase } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import PlayerProfileScreen from "./components/screens/PlayerProfileScreen";
=======
import BackgroundImage from "@/components/common/BackgroundImage";
import LoadingScreen from "@/components/common/LoadingScreen";
import PlayerProfileScreen from "@/components/screens/PlayerProfileScreen";
import { signOutSupabase } from "@/lib/auth";
import { showToast } from "@/lib/toast";
import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
>>>>>>> ui-overhall

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
    <>
      {isLoading && <LoadingScreen progress={0.7} />}
<<<<<<< HEAD
      <PlayerProfileScreen onNavigate={handleNavigate} onLogout={handleLogout} />
    </>
=======
      <PlayerProfileScreen
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
    </View>
>>>>>>> ui-overhall
  );
}

import { useRouter } from "expo-router";
import React from "react";
import PlayerProfileScreen from "./components/PlayerProfileScreen";

export default function ProfileRoute() {
  const router = useRouter();
  const handleNavigate = (screen: string) => {
    if (screen === "levels") router.back();
  };
  const handleLogout = () => {
    // Navigate back to login root
    router.replace("/login");
  };
  return (
    <PlayerProfileScreen onNavigate={handleNavigate} onLogout={handleLogout} />
  );
}

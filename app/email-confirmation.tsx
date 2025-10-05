import { useRouter } from "expo-router";
import React from "react";
import EmailConfirmationScreen from "./components/EmailConfirmationScreen";
import { useLocalSearchParams } from "expo-router";

export default function EmailConfirmationRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();

  const handleNavigate = (screen: string) => {
    if (screen === "login") {
      router.push("/login");
    } else if (screen === "create-account") {
      router.push("/create-account");
    }
  };

  return (
    <EmailConfirmationScreen
      onNavigate={handleNavigate}
      email={params.email}
    />
  );
}
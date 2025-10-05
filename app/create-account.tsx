import { useRouter } from "expo-router";
import React from "react";
import CreateAccountScreen from "./components/CreateAccountScreen";
import { useLocalSearchParams } from "expo-router";

export default function CreateAccountRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; google?: string }>();

  const handleNavigate = (screen: string) => {
    if (screen === "levels") router.push("/levels");
  };

  return (
    <CreateAccountScreen
      onNavigate={handleNavigate}
      onCancel={() => router.back()}
      initialEmail={params.email}
      googlePrefill={params.google === "1"}
    />
  );
}

import BackgroundImage from "@/components/common/BackgroundImage";
import LoadingScreen from "@/components/common/LoadingScreen";
import GuestNameScreen from "@/components/screens/GuestNameScreen";
import { loadGuestProgress } from "@/hooks/guest-progress";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function GuestNameRoute() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);

  // Only skip if a proper named profile (not default "Guest") exists and categories are non-empty
  useEffect(() => {
    (async () => {
      try {
        const existing = await loadGuestProgress();
        if (
          existing &&
          existing.meta?.playerName &&
          existing.meta.playerName !== "Guest" &&
          existing.categories &&
          Object.keys(existing.categories).length > 0
        ) {
          router.replace("/levels");
          return;
        }
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  const [isLoading, setIsLoading] = useState(false);

  const handleNavigate = (screen: string) => {
    setIsLoading(true);
    setTimeout(() => {
      if (screen === "levels") {
        router.replace("/levels");
      }
      setIsLoading(false);
    }, 600);
  };

  const handleCancel = () => {
    setIsLoading(true);
    setTimeout(() => {
      router.back();
      setIsLoading(false);
    }, 600);
  };

  if (checking)
    return (
      <View style={{ flex: 1 }}>
        <BackgroundImage />
        <LoadingScreen />
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      <BackgroundImage />
      {isLoading && <LoadingScreen />}
      <GuestNameScreen onNavigate={handleNavigate} onCancel={handleCancel} />
    </View>
  );
}

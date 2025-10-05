import { useRouter } from "expo-router";
import GuestNameScreen from "./components/GuestNameScreen";
import { loadGuestProgress } from "@/hooks/guest-progress";
import { useEffect, useState } from "react";

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

  const handleNavigate = (screen: string) => {
    if (screen === "levels") {
      router.replace("/levels");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (checking) return null; // Could show a splash/loader if desired
  return (
    <GuestNameScreen onNavigate={handleNavigate} onCancel={handleCancel} />
  );
}

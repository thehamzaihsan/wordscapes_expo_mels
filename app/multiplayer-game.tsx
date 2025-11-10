import MultiplayerGameScreen from "@/components/screens/MultiplayerGameScreen";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function MultiplayerGameRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const matchId = typeof params.match === "string" ? params.match : null;

  const handleNavigate = (screen: string) => {
    router.push(`/${screen}` as any);
  };

  return (
    <MultiplayerGameScreen onNavigate={handleNavigate} matchId={matchId} />
  );
}

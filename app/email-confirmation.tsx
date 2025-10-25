import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";

import BackgroundImage from "@/components/common/BackgroundImage";
import EmailConfirmationScreen from "@/components/screens/EmailConfirmationScreen";

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
    <View style={{ flex: 1 }}>
      <BackgroundImage />
      <EmailConfirmationScreen
        onNavigate={handleNavigate}
        email={params.email}
      />
    </View>
  );
}

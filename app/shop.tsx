import BackgroundImage from "@/components/common/BackgroundImage";
import LoadingScreen from "@/components/common/LoadingScreen";
import StoreScreen from "@/components/screens/StoreScreen";
import ThemedButton from "@/components/ui/ThemedButton";
import ThemedModal from "@/components/ui/ThemedModal";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useFocusEffect, useRouter } from "expo-router";
import { UserX } from "lucide-react-native";
import React, { useCallback } from "react";
import { BackHandler, Platform, View } from "react-native";

export default function ShopRoute() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const { session, loading } = useSupabaseAuth();
  const [showGuestNotice, setShowGuestNotice] = React.useState(false);
  const noticeShownRef = React.useRef(false);

  // Signed-out visitors can still browse the shop; instead of bouncing them
  // to the login screen, show a one-time notice that purchases need an account.
  useFocusEffect(
    useCallback(() => {
      if (!loading && !session && !noticeShownRef.current) {
        noticeShownRef.current = true;
        setShowGuestNotice(true);
      }
      return undefined;
    }, [loading, session])
  );

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.push("/levels"); // Navigate back to levels
        return true; // Prevent default behavior
      };

      if (Platform.OS === "android") {
        const subscription = BackHandler.addEventListener(
          "hardwareBackPress",
          onBackPress
        );
        return () => subscription.remove();
      }
    }, [router])
  );

  const handleNavigate = (screen: string) => {
    setIsLoading(true);
    setTimeout(() => {
      if (screen === "levels") {
        router.push("/levels");
      }
      setTimeout(() => setIsLoading(false), 100);
    }, 600);
  };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundImage />
      {isLoading && <LoadingScreen />}
      <StoreScreen onNavigate={handleNavigate} />

      {/* Not-signed-in notice: stay in the shop, offer sign-in */}
      <ThemedModal
        isVisible={showGuestNotice}
        onClose={() => setShowGuestNotice(false)}
        title="You're not signed in"
        subtitle="You can browse the shop, but buying gems needs an account so your purchases are saved."
        backdrop="blur"
        showCloseButton
        size="small"
      >
        <View style={{ gap: 8 }}>
          <View style={{ alignItems: "center", paddingBottom: 8 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "rgba(223, 160, 46, 0.15)",
                borderWidth: 2,
                borderColor: "rgba(223, 160, 46, 0.35)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserX size={32} color="#DFA02E" />
            </View>
          </View>
          <ThemedButton
            title="Sign in"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => {
              setShowGuestNotice(false);
              router.push("/login");
            }}
          />
          <ThemedButton
            title="Keep browsing"
            variant="ghost"
            size="md"
            fullWidth
            onPress={() => setShowGuestNotice(false)}
          />
        </View>
      </ThemedModal>
    </View>
  );
}

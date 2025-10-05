import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { remapGuestSnapshotToUser } from "@/lib/guestSnapshot";
import { syncUser } from "@/lib/sync";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [status, setStatus] = useState("Completing sign-in...");

  useEffect(() => {
    let active = true;
    (async () => {
      for (let i = 0; i < 25; i++) {
        // ~5s polling
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setStatus("Finalizing session...");
          await remapGuestSnapshotToUser(session.user.id);
          syncUser(session.user.id).catch(() => {});
          if (!active) return;
          setStatus("Signed in! Redirecting...");
          setTimeout(() => router.replace("/levels"), 600);
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      setStatus("No active session found. You can close this screen.");
    })();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#121213",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text
        style={{
          color: "#fff",
          marginTop: 20,
          fontSize: 16,
          textAlign: "center",
        }}
      >
        {status}
      </Text>
    </View>
  );
}

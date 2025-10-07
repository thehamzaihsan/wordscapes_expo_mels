import { Redirect } from "expo-router";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { loading, session } = useSupabaseAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",   
          backgroundColor: "#121213",
        }}
      >
        <ActivityIndicator color="#8B5CF6" />
      </View>
    );
  }

  // If session exists go to levels (home/dashboard), else login
  return <Redirect href={session ? "/levels" : "/login"} />;
}

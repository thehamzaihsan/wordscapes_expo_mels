import { useLocalSearchParams, useRouter } from "expo-router";
import CreateAccountScreen from "./components/CreateAccountScreen";

export default function CreateAccountRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; google?: string }>();

  const handleNavigate = (screen: string, params?: { email?: string }) => {
    if (screen === "levels") {
      router.push("/levels");
    } else if (screen === "email-confirmation") {
      // Backward compatibility: redirect to new OTP flow
      router.push({
        pathname: "/otp-verify",
        params: { email: params?.email },
      } as any);
    } else if (screen === "otp-verify") {
      router.push({
        pathname: "/otp-verify",
        params: { email: params?.email },
      } as any);
    }
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

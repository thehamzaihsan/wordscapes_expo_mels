import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

const API_URL = "https://lehautndkzaltartzezt.functions.supabase.co";

export async function startPurchase(usd: number) {
  try {
    const res = await fetch(`${API_URL}/create-order-1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usd }),
    });

    const data = await res.json();
    console.log("Payment response:", data);
    const approvalUrl = data.links?.find((l: any) => l.rel === "approve")?.href;

    if (!approvalUrl) {
      console.error("No approval URL found", data);
      return;
    }

    // Start PayPal session and wait for redirect to your scheme
    const redirectUrl = Linking.createURL("/");

    const result = await WebBrowser.openAuthSessionAsync(
      approvalUrl,
      redirectUrl
    );

    if (result.type === "success") {
      if (result.url.includes("payment-success")) {
        console.log("✅ Payment Successful!");
        // Call another Supabase function here to capture payment and credit gems
      } else if (result.url.includes("payment-cancel")) {
        console.log("❌ Payment Cancelled by user");
      }
    }
  } catch (err) {
    console.error("Payment error:", err);
  }
}

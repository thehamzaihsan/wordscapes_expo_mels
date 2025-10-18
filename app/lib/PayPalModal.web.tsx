import Constants from "expo-constants";
import { useEffect, useMemo, useRef, useState } from "react";

export type PayPalSuccess = {
  id?: string;
  status?: string;
  [key: string]: any;
};

type Props = {
  visible: boolean;
  amount: number; // USD amount
  currency?: string;
  onRequestClose: () => void;
  onSuccess: (details: PayPalSuccess) => void;
  onCancel?: () => void;
};

// A very small web-only modal that injects the PayPal JS SDK and renders buttons.
// This avoids the "React Native WebView does not support this platform" error on web.
export default function PayPalModalWeb({
  visible,
  amount,
  currency = "USD",
  onRequestClose,
  onSuccess,
  onCancel,
}: Props) {
  const clientId =
    ((Constants as any)?.expoConfig?.extra?.paypalClientId as
      | string
      | undefined) ||
    (process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID as string | undefined) ||
    (process.env.EXPO_PAYPAL_CLIENT_ID as string | undefined) ||
    "";
  // Use a lax any ref to avoid depending on DOM lib typings
  const containerRef = useRef<any>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const value = useMemo(() => amount.toFixed(2), [amount]);

  useEffect(() => {
    if (!visible) return;
    if (!clientId) return;

    // Load the PayPal SDK if needed
    const g: any = typeof globalThis !== "undefined" ? (globalThis as any) : {};
    const doc: any = g.document;
    if (!sdkLoaded && doc) {
      const existing = doc.querySelector(
        'script[src^="https://www.paypal.com/sdk/js"]'
      ) as any;
      if (existing) {
        setSdkLoaded(true);
      } else {
        const s = doc.createElement("script");
        s.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture&commit=true&components=buttons&disable-funding=paylater,card`;
        s.async = true;
        s.onload = () => setSdkLoaded(true);
        doc.head.appendChild(s);
      }
    }
  }, [visible, clientId, currency, sdkLoaded]);

  useEffect(() => {
    if (!visible || !sdkLoaded || !containerRef.current) return;
    const paypal: any =
      typeof globalThis !== "undefined"
        ? (globalThis as any).paypal
        : undefined;
    if (!paypal) return;

    if (containerRef.current) containerRef.current.innerHTML = "";

    paypal
      .Buttons({
        createOrder: (_data: any, actions: any) =>
          actions.order.create({
            purchase_units: [
              {
                amount: { value: value, currency_code: currency },
              },
            ],
            application_context: {
              user_action: "PAY_NOW",
              shipping_preference: "NO_SHIPPING",
            },
          }),
        onApprove: (_data: any, actions: any) =>
          actions.order.capture().then((details: any) => onSuccess(details)),
        onCancel: () => onCancel && onCancel(),
        onError: (err: any) => {
          console.warn("PayPal Web error:", err);
          // Keep modal open so user can retry; no-op here
        },
      })
      .render(containerRef.current);
  }, [visible, sdkLoaded, value, currency, onSuccess, onCancel]);

  if (!visible) return null;

  if (!clientId) {
    return (
      <div style={{ padding: 24 }}>
        <h3 style={{ color: "#c00", margin: 0 }}>Missing PayPal Client ID</h3>
        <p style={{ color: "#666" }}>
          Please set EXPO_PUBLIC_PAYPAL_CLIENT_ID in your .env
        </p>
        <button onClick={onRequestClose} style={{ marginTop: 12 }}>
          Close
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 16,
          width: 420,
          maxWidth: "90vw",
          borderRadius: 8,
        }}
      >
        <div ref={containerRef} />
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button onClick={onRequestClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

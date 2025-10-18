import Constants from "expo-constants";
import { useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

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

export default function PayPalModal({
  visible,
  amount,
  currency = "USD",
  onRequestClose,
  onSuccess,
  onCancel,
}: Props) {
  const webviewRef = useRef<WebView>(null);
  const clientId =
    ((Constants as any)?.expoConfig?.extra?.paypalClientId as
      | string
      | undefined) ||
    (process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID as string | undefined) ||
    (process.env.EXPO_PAYPAL_CLIENT_ID as string | undefined) ||
    "";

  const html = useMemo(() => {
    if (!clientId) {
      return '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /><style>body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px}h3{color:#c00;margin:0 0 8px}p{color:#666;margin:0}</style></head><body><h3>Missing PayPal Client ID</h3><p>Please set EXPO_PUBLIC_PAYPAL_CLIENT_ID in your .env</p></body></html>';
    }

    const value = amount.toFixed(2);
    return `<!doctype html><html><head><meta http-equiv=\"Content-Security-Policy\" content=\"default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" /><style>html,body{height:100%}body{margin:0;display:flex;align-items:center;justify-content:center;background:#fff;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}#container{width:90vw;max-width:420px}#paypal-button-container>div{width:100%!important}</style></head><body><div id=\"container\"><div id=\"paypal-button-container\"></div></div><script>(function(){})(); var load=function(){var s=document.createElement('script');
      s.src='https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture&commit=true&components=buttons&debug=true';
      s.async=true; s.onload=function(){
        if(!window.paypal){window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',message:'paypal-sdk-missing'}));return;}
        window.paypal.Buttons({
          onClick:function(){try{window.ReactNativeWebView.postMessage(JSON.stringify({type:'log',message:'clicked'}));}catch(e){}},
          createOrder:function(data,actions){return actions.order.create({
            purchase_units:[{amount:{value:'${value}',currency_code:'${currency}'}}],
            application_context:{user_action:'PAY_NOW',shipping_preference:'NO_SHIPPING'}
          });},
          onApprove:function(data,actions){return actions.order.capture().then(function(details){window.ReactNativeWebView.postMessage(JSON.stringify({type:'success',details:details}));});},
          onCancel:function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'cancel'}));},
          onError:function(err){window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',message:String(err)}));}
        }).render('#paypal-button-container');
      }; document.head.appendChild(s);}; load();
    </script></body></html>`;
  }, [clientId, amount, currency]);

  function handleMessageData(raw: string) {
    try {
      const data = JSON.parse(raw);
      if (data.type === "success") {
        onSuccess(data.details as PayPalSuccess);
      } else if (data.type === "cancel") {
        onCancel && onCancel();
      } else if (data.type === "log") {
        // Surface SDK logs to help diagnose click issues
        console.log("PayPal WebView log:", data.message ?? data);
      } else if (data.type === "error") {
        console.warn("PayPal WebView error:", data.message ?? data);
      }
    } catch {
      // ignore
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onRequestClose}
      transparent={false}
    >
      <View style={styles.container}>
        {!clientId ? (
          <View style={styles.center}>
            <Text style={styles.warn}>Missing PayPal client id</Text>
            <Text style={styles.sub}>
              Set EXPO_PUBLIC_PAYPAL_CLIENT_ID in your .env
            </Text>
            <TouchableOpacity onPress={onRequestClose} style={styles.button}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            originWhitelist={["*"]}
            // Provide a secure origin so PayPal can open its secure browser flow
            source={{ html, baseUrl: "https://www.paypal.com" }}
            onMessage={(e) => handleMessageData(e.nativeEvent.data)}
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            setSupportMultipleWindows={true}
            javaScriptCanOpenWindowsAutomatically={true}
            sharedCookiesEnabled={true}
            onShouldStartLoadWithRequest={() => true}
            onOpenWindow={(e) => {
              const url = e.nativeEvent?.targetUrl;
              if (url) {
                // Force navigation into the same webview
                const escaped = url.replace(/'/g, "\\'");
                webviewRef.current?.injectJavaScript(
                  `window.location.href='${escaped}'; true;`
                );
              }
            }}
            injectedJavaScriptBeforeContentLoaded={undefined}
            startInLoadingState
            userAgent="Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36"
            mixedContentMode="always"
            cacheEnabled={false}
            onError={(syntheticEvent) => {
              console.warn("WebView PayPal error", syntheticEvent.nativeEvent);
            }}
            renderLoading={() => (
              <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 12 }}>Loading PayPal...</Text>
              </View>
            )}
            style={styles.webview}
            ref={webviewRef}
          />
        )}
        <View style={styles.footer}>
          <TouchableOpacity onPress={onRequestClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  webview: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  warn: { fontSize: 18, fontWeight: "700", color: "#c00", marginBottom: 8 },
  sub: { color: "#666", marginBottom: 16 },
  button: {
    backgroundColor: "#1976D2",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  footer: { padding: 12, borderTopWidth: 1, borderTopColor: "#eee" },
  closeBtn: { alignSelf: "center" },
  closeText: { color: "#1976D2" },
});

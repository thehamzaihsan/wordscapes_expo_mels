import { usePayPalPurchase } from "@/lib/paypal";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  usd: number;
  gems: number;
  label?: string;
};

export function PayPalPurchaseCard({ usd, gems, label }: Props) {
  const { open, Modal } = usePayPalPurchase();

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.title}>{label || `${gems} gems`}</Text>
        <Text style={styles.sub}>${usd.toFixed(2)}</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => open({ usd, gems })}
        >
          <Text style={styles.btnText}>Buy</Text>
        </TouchableOpacity>
      </View>
      {Modal}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    margin: 8,
  },
  title: { fontSize: 18, fontWeight: "700" },
  sub: { color: "#666", marginTop: 4 },
  btn: {
    marginTop: 10,
    backgroundColor: "#0070BA",
    padding: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  btnText: { color: "#fff", fontWeight: "600" },
});

export default PayPalPurchaseCard;

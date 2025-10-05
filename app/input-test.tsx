import React, { useRef } from "react";
import { SafeAreaView, TextInput, StyleSheet, Text, View } from "react-native";

export default function InputTest() {
  const ref1 = useRef<TextInput | null>(null);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.title}>Minimal Input Test</Text>
        <Text style={styles.subtitle}>
          If typing here fails, it&apos;s an environment / emulator keyboard
          issue, not app code.
        </Text>
        <TextInput
          ref={ref1}
          style={styles.input}
          placeholder="Type here"
          placeholderTextColor="#6B7280"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => console.log("[InputTest] focused")}
          onChangeText={(t) => console.log("[InputTest] change", t)}
          onKeyPress={(e) => console.log("[InputTest] key", e.nativeEvent.key)}
          autoFocus
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#121213" },
  body: { padding: 24 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 12 },
  subtitle: { color: "#9CA3AF", fontSize: 13, marginBottom: 20 },
  input: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#374151",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
  },
});

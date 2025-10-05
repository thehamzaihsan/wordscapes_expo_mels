import React, { useEffect, useState } from "react";
import { Animated, Easing, Text, View, StyleSheet } from "react-native";

export type ToastVariant = "info" | "success" | "error" | "warning";
export interface ToastMessage {
  id: number;
  type: ToastVariant;
  text: string;
  duration: number;
}

interface ToastConfigEntry {
  backgroundColor: string;
  defaultDuration: number;
}
const TOAST_CONFIG: Record<ToastVariant, ToastConfigEntry> = {
  info: { backgroundColor: "#4b5563", defaultDuration: 2500 },
  success: { backgroundColor: "#059669", defaultDuration: 2200 },
  error: { backgroundColor: "#dc2626", defaultDuration: 3200 },
  warning: { backgroundColor: "#d97706", defaultDuration: 3000 },
};

let listeners: ((msgs: ToastMessage[]) => void)[] = [];
let queue: ToastMessage[] = [];
let idCounter = 1;

export function showToast(
  text: string,
  type: ToastVariant = "info",
  duration?: number
) {
  const cfg = TOAST_CONFIG[type];
  const msg: ToastMessage = {
    id: idCounter++,
    type,
    text,
    duration: duration ?? cfg.defaultDuration,
  };
  queue = [...queue, msg];
  listeners.forEach((l) => l(queue));
  setTimeout(() => {
    queue = queue.filter((m) => m.id !== msg.id);
    listeners.forEach((l) => l(queue));
  }, msg.duration);
}

export const ToastHost: React.FC = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const [anim] = useState(new Animated.Value(0));

  useEffect(() => {
    const sub = (msgs: ToastMessage[]) => {
      setMessages(msgs);
      Animated.timing(anim, {
        toValue: msgs.length ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    };
    listeners.push(sub);
    return () => {
      listeners = listeners.filter((l) => l !== sub);
    };
  }, [anim]);

  if (!messages.length) return null;
  return (
    <View pointerEvents="none" style={styles.wrapper}>
      {messages.map((m) => (
        <Animated.View
          key={m.id}
          style={[
            styles.toast,
            { backgroundColor: TOAST_CONFIG[m.type].backgroundColor },
            {
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
              opacity: anim,
            },
          ]}
        >
          <Text style={styles.text}>{m.text}</Text>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 8,
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 160,
    maxWidth: "85%",
  },
  text: { color: "#fff", fontSize: 13, fontWeight: "600", textAlign: "center" },
  info: { backgroundColor: "#4b5563" },
  success: { backgroundColor: "#059669" },
  error: { backgroundColor: "#dc2626" },
});

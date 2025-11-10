import ThemedButton from "@/components/ui/ThemedButton";
import Card from "@/components/ui/ThemedCard";
import ThemedText from "@/components/ui/ThemedText";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/lib/toast";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Minimal DB row shape we need
type MatchRow = {
  id: string;
  player1: string;
  player2: string;
  status: "pending" | "active" | "completed" | "declined" | string;
  created_at?: string | null;
  level?: number | null;
};

export default function ChallengeProvider() {
  const { session } = useSupabaseAuth();
  const router = useRouter();
  useTheme(); // ensure theme context is initialized; local value not needed
  const insets = useSafeAreaInsets();

  const [queue, setQueue] = useState<MatchRow[]>([]);
  const [current, setCurrent] = useState<MatchRow | null>(null);
  const slideY = useRef(new Animated.Value(-140)).current;

  // no-op to avoid unused warnings in certain bundlers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _noop = useCallback((..._args: any[]) => {}, []);

  const showBar = useCallback(() => {
    Animated.timing(slideY, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slideY]);

  const hideBar = useCallback(
    (cb?: () => void) => {
      Animated.timing(slideY, {
        toValue: -160,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) cb?.();
      });
    },
    [slideY]
  );

  useEffect(() => {
    if (!current && queue.length > 0) {
      const [head, ...rest] = queue;
      setCurrent(head);
      setQueue(rest);
    }
  }, [queue, current]);

  useEffect(() => {
    if (current) showBar();
  }, [current, showBar]);

  // Subscribe for incoming challenges and activation updates
  useEffect(() => {
    if (!session?.user?.id) return;

    const uid = session.user.id;
    const channel = supabase
      .channel(`challenges-${uid}`)
      // New challenges targeting me (assumes challenger is player1)
      .on(
        "postgres_changes",
        {
          schema: "public",
          table: "matches",
          event: "INSERT",
          filter: `player2=eq.${uid}`,
        },
        async (payload: any) => {
          const row = payload.new as MatchRow;
          if (row.status !== "pending") return;
          // Ignore stale (>10 minutes)
          const created = row.created_at
            ? new Date(row.created_at).getTime()
            : Date.now();
          if (Date.now() - created > 10 * 60 * 1000) return;
          setQueue((q) => [...q, row]);
        }
      )
      // Activation updates for me (either side)
      .on(
        "postgres_changes",
        {
          schema: "public",
          table: "matches",
          event: "UPDATE",
          filter: `player1=eq.${uid}`,
        },
        (payload: any) => {
          const row = payload.new as MatchRow;
          if (row.status === "active") {
            router.push(`/multiplayer-game?match=${row.id}` as any);
          } else if (row.status === "declined") {
            showToast("Challenge declined", "info");
          }
        }
      )
      .on(
        "postgres_changes",
        {
          schema: "public",
          table: "matches",
          event: "UPDATE",
          filter: `player2=eq.${uid}`,
        },
        (payload: any) => {
          const row = payload.new as MatchRow;
          if (row.status === "active") {
            router.push(`/multiplayer-game?match=${row.id}` as any);
          }
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [session?.user?.id, router]);

  const [challengerName, setChallengerName] = useState<string>("Player");
  useEffect(() => {
    (async () => {
      if (!current) return;
      try {
        const challenger = current.player1;
        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", challenger)
          .maybeSingle();
        setChallengerName(data?.username || current.player1.slice(0, 6));
      } catch {
        setChallengerName(current.player1.slice(0, 6));
      }
    })();
  }, [current]);

  const onAccept = async () => {
    if (!current) return;
    const id = current.id;
    hideBar(() => setCurrent(null));
    // Flip to active atomically if still pending
    const { error } = await supabase
      .from("matches")
      .update({ status: "active" })
      .eq("id", id)
      .eq("status", "pending");
    if (error) {
      showToast("Unable to accept challenge", "error");
      return;
    }
    // Navigation will be triggered by the UPDATE listener
  };

  const onDecline = async () => {
    if (!current) return;
    const id = current.id;
    hideBar(() => setCurrent(null));
    await supabase
      .from("matches")
      .update({ status: "declined" })
      .eq("id", id)
      .eq("status", "pending");
  };

  if (!current) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          transform: [{ translateY: slideY }],
          top: insets.top + (Platform.OS === "ios" ? 4 : 0),
        },
      ]}
    >
      <Card variant="glassStrong" padding="md" style={styles.bar}>
        <View style={{ flex: 1 }}>
          <ThemedText variant="body1" weight="semibold">
            Challenge request
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary">
            {challengerName} invited you to play
          </ThemedText>
        </View>
        <ThemedButton
          title="Decline"
          size="sm"
          variant="secondary"
          onPress={onDecline}
        />
        <ThemedButton
          title="Accept"
          size="sm"
          variant="primary"
          onPress={onAccept}
        />
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 64,
    width: "96%",
  },
});

import BackgroundImage from "@/components/common/BackgroundImage";
import WordSpringsText from "@/components/common/WordSpringsText";
import ThemedButton from "@/components/ui/ThemedButton";
import Card from "@/components/ui/ThemedCard";
import Modal from "@/components/ui/ThemedModal";
import ThemedText from "@/components/ui/ThemedText";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Crown, Search, Trophy } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Row {
  id: string;
  username: string | null;
  ranking_points: number;
  xp: number | null;
}

export default function LeaderboardRoute() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { session, loading: authLoading } = useSupabaseAuth();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [meRank, setMeRank] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [profileRow, setProfileRow] = useState<Row | null>(null);

  // Presence
  const presenceRef = useRef<any>(null);
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Join profiles + stats
      const { data, error } = await supabase
        .from("user_stats")
        .select("user_id, ranking_points, xp, profiles:profiles(id,username)")
        .order("ranking_points", { ascending: false })
        .limit(100);
      if (error) {
        setRows([]);
        setLoading(false);
        return;
      }
      const mapped: Row[] = (data || []).map((r: any) => ({
        id: r.user_id,
        username: r.profiles?.username ?? null,
        ranking_points:
          typeof r.ranking_points === "number" ? r.ranking_points : 200,
        xp: r.xp ?? null,
      }));
      setRows(mapped);
      // compute my rank (global)
      if (session?.user?.id) {
        const { data: allIds } = await supabase
          .from("user_stats")
          .select("user_id, ranking_points")
          .order("ranking_points", { ascending: false })
          .limit(10000);
        if (allIds && Array.isArray(allIds)) {
          const idx = (allIds as any[]).findIndex(
            (r) => r.user_id === session.user!.id
          );
          setMeRank(idx >= 0 ? idx + 1 : null);
        } else setMeRank(null);
      }
      setLoading(false);
    };
    load();
  }, [session?.user?.id, session?.user]);

  // Realtime presence
  useEffect(() => {
    const ch = supabase.channel("presence-leaderboard", {
      config: {
        presence: { key: session?.user?.id || `anon-${Math.random()}` },
      },
    });
    presenceRef.current = ch;
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState() as Record<string, any[]>;
      const map: Record<string, boolean> = {};
      Object.keys(state).forEach(
        (uid) => (map[uid] = (state[uid] || []).length > 0)
      );
      setOnlineMap(map);
    }).subscribe(async (status) => {
      if (status === "SUBSCRIBED") await ch.track({ online: true });
    });
    return () => {
      try {
        supabase.removeChannel(ch);
      } catch {}
      presenceRef.current = null;
    };
  }, [session?.user?.id]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        (r.username || "").toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }, [rows, query]);

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <BackgroundImage />
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <ThemedText
          variant="body2"
          color="textSecondary"
          style={{ marginTop: theme.spacing.base }}
        >
          Loading leaderboard...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackgroundImage />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + theme.spacing.md,
            paddingBottom: insets.bottom + theme.spacing.xl2,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <ThemedButton
            title="back"
            size="sm"
            variant="glass"
            onPress={() => router.back()}
          />
          <WordSpringsText style={styles.title}>Leaderboard</WordSpringsText>
        </View>

        <Card
          variant="glassStrong"
          padding="lg"
          style={{ gap: theme.spacing.sm }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.sm,
              alignItems: "center",
            }}
          >
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search players"
              placeholderTextColor={theme.colors.textSecondary}
              style={{
                flex: 1,
                color: theme.colors.text,
                fontSize: 16,
                paddingVertical: 8,
              }}
              autoCapitalize="none"
            />
            <Search size={18} color={theme.colors.textSecondary} />
          </View>
          {meRank != null && (
            <ThemedText variant="caption" color="textSecondary">
              Your rank: #{meRank}
            </ThemedText>
          )}
        </Card>

        <View style={{ marginTop: theme.spacing.lg }}>
          {filtered.map((r, index) => (
            <Card
              key={r.id}
              variant={index < 3 ? "glassStrong" : "glass"}
              padding="md"
              style={styles.row}
            >
              <View style={styles.rowLeft}>
                <View style={{ width: 24, alignItems: "center" }}>
                  {index < 3 ? (
                    <Crown
                      size={16}
                      color={
                        index === 0
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                      }
                    />
                  ) : (
                    <ThemedText variant="body2" weight="bold">
                      {index + 1}
                    </ThemedText>
                  )}
                </View>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: onlineMap[r.id]
                      ? theme.colors.success
                      : theme.colors.textSecondary,
                  }}
                />
                <ThemedText
                  variant="body2"
                  weight="semibold"
                  style={{ marginLeft: theme.spacing.xs }}
                >
                  {r.username || r.id.slice(0, 6)}
                </ThemedText>
              </View>
              <View style={styles.rowRight}>
                <Trophy size={14} color={theme.colors.textSecondary} />
                <ThemedText variant="body2" weight="semibold">
                  {r.ranking_points}
                </ThemedText>
                <ThemedButton
                  title="Profile"
                  size="sm"
                  variant="secondary"
                  onPress={() => setProfileRow(r)}
                />
              </View>
            </Card>
          ))}
          {filtered.length === 0 && (
            <ThemedText
              variant="body2"
              color="textSecondary"
              style={{ textAlign: "center", marginTop: theme.spacing.lg }}
            >
              No players found.
            </ThemedText>
          )}
        </View>
      </ScrollView>

      <ProfileModal row={profileRow} onClose={() => setProfileRow(null)} />
    </View>
  );
}

const ProfileModal: React.FC<{ row: Row | null; onClose: () => void }> = ({
  row,
  onClose,
}) => {
  const { theme } = useTheme();
  const [derived, setDerived] = useState<{
    level: number;
    levelXp: number;
    nextLevelXp: number;
  } | null>(null);
  useEffect(() => {
    (async () => {
      if (!row) {
        setDerived(null);
        return;
      }
      try {
        const { derivePlayerLevel } = await import("@/hooks/guest-progress");
        const d = derivePlayerLevel(row.xp ?? 0);
        setDerived({
          level: d.level,
          levelXp: d.levelXp,
          nextLevelXp: d.nextLevelXp,
        });
      } catch {
        setDerived(null);
      }
    })();
  }, [row]);
  return (
    <Modal
      isVisible={!!row}
      onClose={onClose}
      title={row ? row.username || "Player" : "Profile"}
      backdrop="blur"
      showCloseButton
      size="small"
    >
      {row && (
        <View style={{ gap: theme.spacing.xs }}>
          <ThemedText variant="body2" color="textSecondary">
            ID: {row.id}
          </ThemedText>
          <ThemedText variant="body2">Ranking: {row.ranking_points}</ThemedText>
          <ThemedText variant="body2">XP: {row.xp ?? 0}</ThemedText>
          {derived && (
            <ThemedText variant="caption" color="textSecondary">
              Level {derived.level} • {derived.levelXp}/{derived.nextLevelXp} XP
            </ThemedText>
          )}
          <ThemedButton title="Close" variant="secondary" onPress={onClose} />
        </View>
      )}
    </Modal>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: theme.spacing.lg },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    title: { fontSize: 32, flex: 1 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.xs,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    rowRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
  });

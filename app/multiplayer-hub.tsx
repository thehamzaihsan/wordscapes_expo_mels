import BackgroundImage from "@/components/common/BackgroundImage";
import WordSpringsText from "@/components/common/WordSpringsText";
import ThemedButton from "@/components/ui/ThemedButton";
import Card from "@/components/ui/ThemedCard";
import Modal from "@/components/ui/ThemedModal";
import ThemedText from "@/components/ui/ThemedText";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/lib/toast";
import { useRouter } from "expo-router";
import { Search, Trophy } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ProfileRow {
  id: string;
  username: string;
  avatar?: string | null;
  is_guest?: boolean;
}
interface FriendRow {
  id: number;
  requester: string;
  addressee: string;
  status: string;
}

export default function MultiplayerHubScreen() {
  const insets = useSafeAreaInsets();
  const { session, loading: authLoading } = useSupabaseAuth();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  // Keep minimal tracking of accepted friends (used for potential future challenge modal)
  // Currently not referenced; suppress lint by conditional dev-only log.
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | { mode: "find" | "friend" }>(null);
  // Simplified hub: friendProfiles and selectedFriend removed

  // Presence tracking removed for simplified hub

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const [{ data: p }, { data: fr }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,username,avatar,is_guest")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase
          .from("friend_relationships")
          .select("id,requester,addressee,status")
          .or(`requester.eq.${session.user.id},addressee.eq.${session.user.id}`)
          .eq("status", "accepted"),
      ]);
      if (cancelled) return;
      setProfile(p || null);
      setFriends(fr || []);
      setLoading(false);
    };
    run();
    // Subscribe to realtime changes for friend relationships (accepted only)
    const chan = supabase
      .channel(`fr-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friend_relationships" },
        () => {
          // Re-fetch accepted friends on any change affecting visible rows (RLS will scope rows)
          (async () => {
            const { data: fr } = await supabase
              .from("friend_relationships")
              .select("id,requester,addressee,status")
              .or(
                `requester.eq.${session.user!.id},addressee.eq.${
                  session.user!.id
                }`
              )
              .eq("status", "accepted");
            setFriends(fr || []);
          })();
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      try {
        supabase.removeChannel(chan);
      } catch {}
    };
  }, [session?.user?.id, session?.user]);

  // Friend stats/presence removed in minimal hub

  const sendFriendRequest = async (usernameOrId: string) => {
    if (!session?.user?.id) return;
    if (!usernameOrId.trim()) {
      showToast("Enter a username or ID", "warning");
      return;
    }
    // Resolve to user id
    let targetId = usernameOrId.trim();
    if (targetId.includes("@")) {
      const { data: res, error } = await supabase.rpc("resolve_user_by_email", {
        p_email: targetId,
      });
      if (error || !res?.id) {
        showToast("User not found", "error");
        return;
      }
      targetId = res.id as string;
    } else if (targetId.length < 36) {
      // assume it might be username
      const { data: matchUser } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", targetId)
        .maybeSingle();
      if (!matchUser) {
        showToast("User not found", "error");
        return;
      }
      targetId = matchUser.id;
    }
    if (targetId === session.user.id) {
      showToast("Cannot friend yourself", "warning");
      return;
    }
    const { error } = await supabase.from("friend_relationships").insert({
      requester: session.user.id,
      addressee: targetId,
      status: "pending",
    });
    if (error) showToast(error.message, "error");
    else {
      showToast("Request sent", "success");
      setModal(null);
    }
  };

  const sendChallenge = async (usernameOrId: string) => {
    if (!session?.user?.id) return;
    let target = usernameOrId.trim();
    if (!target) {
      showToast("Enter a username or ID", "warning");
      return;
    }
    if (target.includes("@")) {
      const { data: res } = await supabase.rpc("resolve_user_by_email", {
        p_email: target,
      });
      if (!res?.id) {
        showToast("User not found", "error");
        return;
      }
      target = res.id;
    } else if (target.length < 36) {
      const { data: matchUser } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", target)
        .maybeSingle();
      if (!matchUser) {
        showToast("User not found", "error");
        return;
      }
      target = matchUser.id;
    }
    if (target === session.user.id) {
      showToast("Cannot challenge yourself", "warning");
      return;
    }

    // Busy check: is target already in a pending or active match?
    try {
      const { data: busy } = await supabase
        .from("matches")
        .select("id,status")
        .or(`player1.eq.${target},player2.eq.${target}`)
        .in("status", ["active", "pending"])
        .limit(1);
      if (busy && busy.length > 0) {
        const st = busy[0].status;
        if (st === "active") showToast("Player is already in a game", "info");
        else showToast("Player already has a pending challenge", "info");
        return;
      }
    } catch {}

    // Fetch current ranking points for both players; fallback to 200 if missing
    type StatRow = { user_id: string; ranking_points: number | null };
    let p1Start = 200;
    let p2Start = 200;
    try {
      const { data: stats } = await supabase
        .from("user_stats")
        .select("user_id, ranking_points")
        .in("user_id", [session.user.id, target]);
      if (stats && Array.isArray(stats)) {
        const byId: Record<string, number> = {};
        (stats as StatRow[]).forEach((row) => {
          if (row?.user_id) {
            byId[row.user_id] =
              typeof row.ranking_points === "number" &&
              !isNaN(row.ranking_points)
                ? row.ranking_points
                : 200;
          }
        });
        p1Start = byId[session.user.id] ?? 200;
        p2Start = byId[target] ?? 200;
      }
    } catch {}

    const { error } = await supabase.from("matches").insert({
      player1: session.user.id,
      player2: target,
      status: "pending",
      level: 1,
      player1_ranking_start: p1Start,
      player2_ranking_start: p2Start,
    });
    if (error) showToast(error.message, "error");
    else {
      showToast("Challenge sent — waiting for accept", "success");
      setModal(null);
    }
  };

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <BackgroundImage />
        <StatusBar barStyle="light-content" translucent />
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <ThemedText
          variant="body1"
          color="textSecondary"
          style={{ marginTop: theme.spacing.base }}
        >
          Loading multiplayer...
        </ThemedText>
      </View>
    );
  }

  if (!session?.user?.id || profile?.is_guest) {
    return (
      <View style={styles.loadingContainer}>
        <BackgroundImage />
        <WordSpringsText style={{ fontSize: 32 }}>
          Multiplayer Locked
        </WordSpringsText>
        <ThemedText
          variant="body2"
          color="textSecondary"
          style={{ marginTop: theme.spacing.base }}
        >
          {profile?.is_guest
            ? "Guest accounts cannot access multiplayer."
            : "Sign in to continue."}
        </ThemedText>
        <ThemedButton
          title={profile?.is_guest ? "Sign In" : "Login"}
          variant="primary"
          onPress={() => router.push("/login")}
          style={{ marginTop: theme.spacing.lg }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackgroundImage />
      <StatusBar barStyle="light-content" translucent />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.safeArea,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
        >
          {process.env.EXPO_PUBLIC_ENV === "dev" && friends.length === -1 && (
            <ThemedText variant="caption" color="textSecondary">
              friends: {friends.length}
            </ThemedText>
          )}
          {/* Top bar: back | Profile | friend */}
          <View
            style={{
              flexDirection: "row",
              gap: theme.spacing.sm,
              alignItems: "center",
            }}
          >
            <ThemedButton
              title="back"
              size="sm"
              variant="glass"
              onPress={() => router.back()}
            />
            <ThemedButton
              title="Profile button"
              size="sm"
              variant="secondary"
              onPress={() => router.push("/profile")}
            />
            <ThemedButton
              title="friend"
              size="sm"
              variant="secondary"
              onPress={() => router.push("/friends")}
            />
          </View>

          {/* Large card: search for the match */}
          <Card
            variant="glassStrong"
            padding="xl"
            style={{ marginTop: theme.spacing.xl }}
          >
            <ThemedButton
              title="search for the match"
              variant="primary"
              fullWidth
              leftIcon={<Search size={18} color="white" />}
              onPress={() => router.push("/matchfinding")}
            />
          </Card>

          {/* Large card: leaderboard button */}
          <Card
            variant="glassStrong"
            padding="xl"
            style={{ marginTop: theme.spacing.xl }}
          >
            <ThemedButton
              title="leaderboard button"
              variant="secondary"
              fullWidth
              leftIcon={<Trophy size={18} color={theme.colors.text} />}
              onPress={() => router.push("/leaderboard")}
            />
          </Card>
        </View>
      </ScrollView>

      {/* Quick Add Friend modal (optional) */}
      <Modal
        isVisible={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === "find" ? "Friendly Match" : "Add Friend"}
        backdrop="blur"
        showCloseButton
        size="small"
      >
        <FriendSearchForm
          onSubmit={modal?.mode === "find" ? sendChallenge : sendFriendRequest}
          cancel={() => setModal(null)}
          mode={modal?.mode || "friend"}
        />
      </Modal>

      {/* Friend profile modal removed */}
    </View>
  );
}

const FriendSearchForm: React.FC<{
  onSubmit: (v: string) => void;
  cancel: () => void;
  mode: "find" | "friend";
}> = ({ onSubmit, cancel, mode }) => {
  const { theme } = useTheme();
  const [value, setValue] = useState("");
  return (
    <View style={{ gap: theme.spacing.md }}>
      <ThemedText variant="body2" color="textSecondary">
        Enter a username, email, or player ID:
      </ThemedText>
      <Card
        variant="glassStrong"
        padding="lg"
        style={{ gap: theme.spacing.sm }}
      >
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="username / email / UUID"
          placeholderTextColor={theme.colors.textSecondary}
          style={{ color: theme.colors.text, fontSize: 16, paddingVertical: 8 }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <ThemedButton
            title="Clear"
            size="sm"
            variant="secondary"
            onPress={() => setValue("")}
          />
        </View>
      </Card>
      <ThemedButton
        title={mode === "find" ? "Send Match Request" : "Send Friend Request"}
        variant="primary"
        onPress={() => onSubmit(value)}
        fullWidth
      />
      <ThemedButton
        title="Cancel"
        variant="secondary"
        onPress={cancel}
        fullWidth
      />
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
    },
    container: { flex: 1, backgroundColor: "transparent" },
    safeArea: {
      width: "100%",
      maxWidth: 560,
      alignSelf: "center",
      gap: theme.spacing.xl2,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "flex-start",
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl4,
    },
    header: {
      alignItems: "flex-start",
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.sm,
    },
    section: { marginBottom: theme.spacing.xl, gap: theme.spacing.sm },
    sectionTitle: { fontSize: 24 },
    requestRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: theme.spacing.xs,
    },
  });

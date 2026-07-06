import BackgroundImage from "@/components/common/BackgroundImage";
import LoadingScreen from "@/components/common/LoadingScreen";
import BrandText from "@/components/common/BrandText";
import ThemedButton from "@/components/ui/ThemedButton";
import Card from "@/components/ui/ThemedCard";
import Modal from "@/components/ui/ThemedModal";
import ThemedText from "@/components/ui/ThemedText";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/lib/toast";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Search, Swords, Trophy, UserPlus, Users } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
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
  const { theme, themeName } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | { mode: "find" | "friend" }>(null);
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  // Animate on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
    return <LoadingScreen />;
  }

  if (!session?.user?.id || profile?.is_guest) {
    return (
      <View style={styles.loadingContainer}>
        <BackgroundImage />
        <BrandText style={{ fontSize: 32 }}>
          Multiplayer Locked
        </BrandText>
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.safeArea,
            { 
              paddingTop: insets.top + theme.spacing.xl, 
              paddingBottom: insets.bottom,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {process.env.EXPO_PUBLIC_ENV === "dev" && friends.length === -1 && (
            <ThemedText variant="caption" color="textSecondary">
              friends: {friends.length}
            </ThemedText>
          )}
          
          {/* Header with back button */}
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              onPress={() => router.push("/")}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <BrandText variant="h1" style={[styles.headerTitle, { color: 'white' }]}>
                Multiplayer Hub
              </BrandText>
              <ThemedText variant="body2" style={[styles.subtitle, { color: 'white' }]}>
                Challenge players worldwide
              </ThemedText>
            </View>
          </View>

          {/* Stats Card */}
          {profile && (
            <Card variant="glassStrong" padding="lg" style={styles.statsCard}>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Users size={20} color={theme.colors.primary} />
                  <ThemedText variant="h3" style={styles.statValue}>
                    {friends.length}
                  </ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    Friends
                  </ThemedText>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Trophy size={20} color={theme.colors.warning} />
                  <ThemedText variant="h3" style={styles.statValue}>
                    {profile.username || 'Player'}
                  </ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    Username
                  </ThemedText>
                </View>
              </View>
            </Card>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <ThemedText variant="h3" style={[styles.sectionTitle, { color: 'white' }]}>
              Quick Actions
            </ThemedText>
            <View style={styles.quickActionsGrid}>
              <Card 
                variant="glassStrong" 
                padding="lg" 
                style={styles.quickActionCard}
                touchable
                onPress={() => router.push("/multiplayer-profile")}
              >
                <View style={styles.quickActionContent}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Users size={24} color={theme.colors.primary} />
                  </View>
                  <ThemedText variant="body1" style={styles.quickActionText}>
                    Profile
                  </ThemedText>
                </View>
              </Card>
              
              <Card 
                variant="glassStrong" 
                padding="lg" 
                style={styles.quickActionCard}
                touchable
                onPress={() => router.push("/friends")}
              >
                <View style={styles.quickActionContent}>
                  <View style={[styles.iconCircle, { backgroundColor: theme.colors.success + '20' }]}>
                    <UserPlus size={24} color={theme.colors.success} />
                  </View>
                  <ThemedText variant="body1" style={styles.quickActionText}>
                    Friends
                  </ThemedText>
                </View>
              </Card>
            </View>
          </View>

          {/* Main Actions */}
          <View style={styles.mainActionsContainer}>
            <ThemedText variant="h3" style={[styles.sectionTitle, { color: 'white' }]}>
              Game Modes
            </ThemedText>
            
            {/* Find Match Card */}
            <Card
              variant="glassStrong"
              padding="none"
              style={styles.actionCard}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primary + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCard}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardIcon}>
                    <Swords size={32} color="white" />
                  </View>
                  <View style={styles.actionCardTextContainer}>
                    <ThemedText variant="h3" style={styles.actionCardTitle}>
                      Find a Match
                    </ThemedText>
                    <ThemedText variant="body2" style={styles.actionCardSubtitle}>
                      Battle random opponents online
                    </ThemedText>
                  </View>
                </View>
                <ThemedButton
                  title="Search Now"
                  variant="glass"
                  size="lg"
                  leftIcon={<Search size={20} color={themeName === 'light' ? 'black' : 'white'} />}
                  onPress={() => router.push("/matchfinding")}
                  style={styles.actionButton}
                />
              </LinearGradient>
            </Card>

            {/* Leaderboard Card */}
            <Card
              variant="glassStrong"
              padding="none"
              style={styles.actionCard}
            >
              <LinearGradient
                colors={[theme.colors.warning, theme.colors.warning + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCard}
              >
                <View style={styles.actionCardContent}>
                  <View style={styles.actionCardIcon}>
                    <Trophy size={32} color="white" />
                  </View>
                  <View style={styles.actionCardTextContainer}>
                    <ThemedText variant="h3" style={styles.actionCardTitle}>
                      Leaderboard
                    </ThemedText>
                    <ThemedText variant="body2" style={styles.actionCardSubtitle}>
                      See top players and your rank
                    </ThemedText>
                  </View>
                </View>
                <ThemedButton
                  title="View Rankings"
                  variant="glass"
                  size="lg"
                  leftIcon={<Trophy size={20} color={themeName === 'light' ? 'black' : 'white'} />}
                  onPress={() => router.push("/leaderboard")}
                  style={styles.actionButton}
                />
              </LinearGradient>
            </Card>
          </View>
        </Animated.View>
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
    container: { 
      flex: 1, 
      backgroundColor: "transparent" 
    },
    safeArea: {
      width: "100%",
      maxWidth: 560,
      alignSelf: "center",
      paddingHorizontal: theme.spacing.lg,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: theme.spacing.xl4,
    },
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surfaceVariant + '40',
      justifyContent: "center",
      alignItems: "center",
      backdropFilter: "blur(10px)",
    },
    headerTextContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 28,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: 14,
      opacity: 0.8,
    },
    statsCard: {
      marginBottom: theme.spacing.lg,
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
    },
    statItem: {
      flex: 1,
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    statValue: {
      fontSize: 20,
      fontWeight: "bold",
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.colors.border,
      opacity: 0.3,
    },
    quickActionsContainer: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: 20,
      marginBottom: theme.spacing.md,
      fontWeight: "600",
    },
    quickActionsGrid: {
      flexDirection: "row",
      gap: theme.spacing.md,
    },
    quickActionCard: {
      flex: 1,
    },
    quickActionContent: {
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
    },
    quickActionText: {
      fontSize: 14,
      fontWeight: "500",
    },
    mainActionsContainer: {
      gap: theme.spacing.lg,
    },
    actionCard: {
      marginBottom: theme.spacing.md,
      overflow: "hidden",
    },
    gradientCard: {
      padding: theme.spacing.xl,
      gap: theme.spacing.lg,
    },
    actionCardContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    actionCardIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    actionCardTextContainer: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    actionCardTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: "white",
    },
    actionCardSubtitle: {
      fontSize: 13,
      color: "rgba(255, 255, 255, 0.9)",
    },
    actionButton: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    requestRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: theme.spacing.xs,
    },
  });

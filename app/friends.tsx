import BackgroundImage from "@/components/common/BackgroundImage";
import LoadingScreen from "@/components/common/LoadingScreen";
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
import {
  ArrowLeft,
  CheckCircle,
  Gamepad2,
  Info,
  Search,
  UserMinus,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FriendRelationshipRow {
  id: number;
  requester: string;
  addressee: string;
  status: string;
}
interface ProfileRow {
  id: string;
  username: string;
  avatar?: string | null;
  is_guest?: boolean;
}

export default function FriendsRoute() {
  const insets = useSafeAreaInsets();
  const { session, loading: authLoading } = useSupabaseAuth();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();

  const [tab, setTab] = useState<"friends" | "requests" | "search">("friends");
  const [loading, setLoading] = useState(true);
  const [friendRows, setFriendRows] = useState<FriendRelationshipRow[]>([]);
  const [requestRows, setRequestRows] = useState<FriendRelationshipRow[]>([]);
  const [profiles, setProfiles] = useState<
    (ProfileRow & { ranking_points?: number | null; xp?: number | null })[]
  >([]);
  const [selectedFriend, setSelectedFriend] = useState<
    (ProfileRow & { ranking_points?: number | null; xp?: number | null }) | null
  >(null);
  const [actionTarget, setActionTarget] = useState<
    (ProfileRow & { ranking_points?: number | null; xp?: number | null }) | null
  >(null);
  const [searchValue, setSearchValue] = useState("");
  const [searchResult, setSearchResult] = useState<
    (ProfileRow & { ranking_points?: number | null; xp?: number | null }) | null
  >(null);
  const presenceChannelRef = useRef<any>(null);
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Initial load & realtime subscription
  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const myId = session.user.id;
      const [{ data: fr }, { data: rq }] = await Promise.all([
        supabase
          .from("friend_relationships")
          .select("id,requester,addressee,status")
          .or(`requester.eq.${myId},addressee.eq.${myId}`)
          .eq("status", "accepted"),
        supabase
          .from("friend_relationships")
          .select("id,requester,addressee,status")
          .eq("addressee", myId)
          .eq("status", "pending"),
      ]);
      if (cancelled) return;
      setFriendRows(fr || []);
      setRequestRows(rq || []);
      setLoading(false);
    };
    load();
    const chan = supabase
      .channel(`friends-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friend_relationships" },
        () => load()
      )
      .subscribe();
    return () => {
      cancelled = true;
      try {
        supabase.removeChannel(chan);
      } catch {}
    };
  }, [session?.user?.id, session?.user]);

  // Fetch profiles + stats for friends
  useEffect(() => {
    const fetchProfiles = async () => {
      if (!session?.user?.id || friendRows.length === 0) {
        setProfiles([]);
        return;
      }
      const myId = session.user.id;
      const ids = friendRows.map((r) =>
        r.requester === myId ? r.addressee : r.requester
      );
      const [{ data: profs }, { data: stats }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,username,avatar,is_guest")
          .in("id", ids),
        supabase
          .from("user_stats")
          .select("user_id,ranking_points,xp")
          .in("user_id", ids),
      ]);
      const statMap: Record<
        string,
        { ranking_points?: number | null; xp?: number | null }
      > = {};
      (stats || []).forEach((s: any) => {
        statMap[s.user_id] = {
          ranking_points: s.ranking_points ?? null,
          xp: s.xp ?? null,
        };
      });
      const merged = (profs || []).map((p: any) => ({
        ...p,
        ranking_points: statMap[p.id]?.ranking_points ?? null,
        xp: statMap[p.id]?.xp ?? null,
      }));
      setProfiles(merged);
    };
    fetchProfiles();
  }, [friendRows, session?.user?.id]);

  // Presence tracking
  useEffect(() => {
    if (!session?.user?.id) return;
    const channel = supabase.channel("presence-friends", {
      config: { presence: { key: session.user.id } },
    });
    presenceChannelRef.current = channel;
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, any[]>;
        const map: Record<string, boolean> = {};
        Object.keys(state).forEach((uid) => {
          map[uid] = (state[uid] || []).length > 0;
        });
        setOnlineMap(map);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ online: true });
      });
    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
      presenceChannelRef.current = null;
    };
  }, [session?.user?.id]);

  const onlineFriendIds = useMemo(() => {
    if (!session?.user?.id) return new Set<string>();
    const myId = session.user.id;
    const ids = friendRows.map((r) =>
      r.requester === myId ? r.addressee : r.requester
    );
    return new Set(ids.filter((id) => onlineMap[id]));
  }, [friendRows, onlineMap, session?.user?.id]);

  const sortedProfiles = useMemo(() => {
    return [...profiles].sort((a, b) => {
      const ao = onlineFriendIds.has(a.id) ? 1 : 0;
      const bo = onlineFriendIds.has(b.id) ? 1 : 0;
      if (ao !== bo) return bo - ao; // online first
      return (a.username || "").localeCompare(b.username || "");
    });
  }, [profiles, onlineFriendIds]);

  const removeFriend = async (friend: ProfileRow) => {
    if (!session?.user?.id) return;
    const myId = session.user.id;
    const row = friendRows.find(
      (r) =>
        (r.requester === myId && r.addressee === friend.id) ||
        (r.addressee === myId && r.requester === friend.id)
    );
    if (!row) {
      showToast("Relationship not found", "error");
      return;
    }
    const { error } = await supabase
      .from("friend_relationships")
      .delete()
      .eq("id", row.id);
    if (error) showToast(error.message, "error");
    else {
      showToast("Removed friend", "success");
      setActionTarget(null);
    }
  };

  const sendGameRequest = async (friend: ProfileRow) => {
    if (!session?.user?.id) return;
    const players = [session.user.id, friend.id].sort();
    // Get ranking points
    const { data: stats } = await supabase
      .from("user_stats")
      .select("user_id,ranking_points")
      .in("user_id", players);
    const map: Record<string, number> = {};
    (stats || []).forEach(
      (s: any) =>
        (map[s.user_id] =
          typeof s.ranking_points === "number" ? s.ranking_points : 200)
    );
    const { error } = await supabase.from("matches").insert({
      player1: players[0],
      player2: players[1],
      status: "pending",
      level: 1,
      player1_ranking_start: map[players[0]] ?? 200,
      player2_ranking_start: map[players[1]] ?? 200,
    });
    if (error) showToast(error.message, "error");
    else showToast("Game request sent", "success");
  };

  const acceptRequest = async (row: FriendRelationshipRow) => {
    const { error } = await supabase
      .from("friend_relationships")
      .update({ status: "accepted" })
      .eq("id", row.id);
    if (error) showToast("Accept failed", "error");
    else showToast("Friend added", "success");
  };
  const declineRequest = async (row: FriendRelationshipRow) => {
    const { error } = await supabase
      .from("friend_relationships")
      .update({ status: "declined" })
      .eq("id", row.id);
    if (error) showToast("Decline failed", "error");
    else showToast("Declined", "info");
  };

  const runSearch = async () => {
    if (!searchValue.trim()) {
      showToast("Enter search text", "warning");
      return;
    }
    let target = searchValue.trim();
    let profile: any = null;
    if (target.includes("@")) {
      const { data: res, error } = await supabase.rpc("resolve_user_by_email", {
        p_email: target,
      });
      if (error || !res?.id) {
        showToast("User not found", "error");
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("id,username,avatar,is_guest")
        .eq("id", res.id)
        .maybeSingle();
      profile = prof;
    } else if (target.length === 36) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id,username,avatar,is_guest")
        .eq("id", target)
        .maybeSingle();
      profile = prof;
    } else {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id,username,avatar,is_guest")
        .ilike("username", target)
        .maybeSingle();
      profile = prof;
    }
    if (!profile) {
      showToast("User not found", "error");
      return;
    }
    // stats
    const { data: stat } = await supabase
      .from("user_stats")
      .select("user_id,ranking_points,xp")
      .eq("user_id", profile.id)
      .maybeSingle();
    setSearchResult({
      ...profile,
      ranking_points: stat?.ranking_points ?? null,
      xp: stat?.xp ?? null,
    });
  };

  const sendFriendRequest = async (targetId: string) => {
    if (!session?.user?.id) return;
    if (targetId === session.user.id) {
      showToast("Cannot friend yourself", "warning");
      return;
    }
    const { data: existing } = await supabase
      .from("friend_relationships")
      .select("id,status,requester,addressee")
      .or(
        `and(requester.eq.${session.user.id},addressee.eq.${targetId}),and(requester.eq.${targetId},addressee.eq.${session.user.id})`
      )
      .maybeSingle();
    if (existing) {
      if (existing.status === "accepted") {
        showToast("Already friends", "info");
        return;
      }
      if (existing.status === "pending") {
        showToast("Request pending", "info");
        return;
      }
    }
    const { error } = await supabase
      .from("friend_relationships")
      .insert({
        requester: session.user.id,
        addressee: targetId,
        status: "pending",
      });
    if (error) showToast(error.message, "error");
    else showToast("Request sent", "success");
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!session?.user?.id) {
    return (
      <View style={styles.loadingContainer}>
        <BackgroundImage />
        <WordSpringsText style={{ fontSize: 32 }}>
          Sign in required
        </WordSpringsText>
        <ThemedButton
          title="Login"
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
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + theme.spacing.xl,
              paddingBottom: insets.bottom + theme.spacing.xl2,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <WordSpringsText variant="h1" style={[styles.title, { color: 'white' }]}>
                Friends
              </WordSpringsText>
              <ThemedText variant="body2" style={[styles.subtitle, { color: 'white' }]}>
                Connect and compete
              </ThemedText>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <ThemedButton
              title="Friends"
              size="md"
              variant={tab === "friends" ? "primary" : "glass"}
              onPress={() => setTab("friends")}
              leftIcon={<Users size={16} color={tab === "friends" ? "white" : theme.colors.text} />}
              style={styles.tabButton}
            />
            <ThemedButton
              title={`Requests${requestRows.length > 0 ? ` (${requestRows.length})` : ''}`}
              size="md"
              variant={tab === "requests" ? "primary" : "glass"}
              onPress={() => setTab("requests")}
              style={styles.tabButton}
            />
            <ThemedButton
              title="Search"
              size="md"
              variant={tab === "search" ? "primary" : "glass"}
              onPress={() => setTab("search")}
              leftIcon={<Search size={16} color={tab === "search" ? "white" : theme.colors.text} />}
              style={styles.tabButton}
            />
          </View>
          {/* Content */}
          {tab === "friends" && (
            <View style={styles.panel}>
              {/* Stats Card */}
              <Card variant="glassStrong" padding="lg" style={styles.statsCard}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Users size={20} color={theme.colors.primary} />
                    <ThemedText variant="h3">{sortedProfiles.length}</ThemedText>
                    <ThemedText variant="caption" color="textSecondary">
                      Total Friends
                    </ThemedText>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <View style={[styles.onlineDot, { backgroundColor: theme.colors.success, width: 12, height: 12 }]} />
                    <ThemedText variant="h3">{Array.from(onlineFriendIds).length}</ThemedText>
                    <ThemedText variant="caption" color="textSecondary">
                      Online Now
                    </ThemedText>
                  </View>
                </View>
              </Card>

              {/* Friends List */}
              <ThemedText variant="h3" style={[styles.sectionTitle, { color: 'white' }]}>
                Your Friends
              </ThemedText>
              
              <View style={styles.listContainer}>
                {sortedProfiles.map((fp) => (
                  <Card
                    key={fp.id}
                    variant="glassStrong"
                    padding="md"
                    style={styles.friendCard}
                    touchable
                    onPress={() => setActionTarget(fp)}
                  >
                    <View style={styles.friendRow}>
                      <View style={styles.friendLeft}>
                        <View
                          style={[
                            styles.onlineDot,
                            {
                              backgroundColor: onlineFriendIds.has(fp.id)
                                ? theme.colors.success
                                : theme.colors.textSecondary,
                            },
                          ]}
                        />
                        <View style={styles.friendInfo}>
                          <ThemedText variant="body1" weight="semibold">
                            {fp.username || fp.id.slice(0, 8)}
                          </ThemedText>
                          {typeof fp.ranking_points === "number" && (
                            <ThemedText variant="caption" color="textSecondary">
                              {fp.ranking_points} Ranking Points
                            </ThemedText>
                          )}
                        </View>
                      </View>
                      <View style={styles.friendRight}>
                        {onlineFriendIds.has(fp.id) && (
                          <View style={styles.onlineBadge}>
                            <ThemedText variant="caption" style={{ color: theme.colors.success, fontWeight: '600' }}>
                              Online
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    </View>
                  </Card>
                ))}
                {sortedProfiles.length === 0 && (
                  <Card variant="glassStrong" padding="xl" style={styles.emptyCard}>
                    <Users size={48} color={theme.colors.textSecondary} />
                    <ThemedText
                      variant="body1"
                      color="textSecondary"
                      style={{ textAlign: "center", marginTop: theme.spacing.md }}
                    >
                      No friends yet
                    </ThemedText>
                    <ThemedText
                      variant="body2"
                      color="textSecondary"
                      style={{ textAlign: "center" }}
                    >
                      Search for players to add
                    </ThemedText>
                  </Card>
                )}
              </View>
            </View>
          )}
          {tab === "requests" && (
            <View style={styles.panel}>
              <ThemedText variant="h3" style={[styles.sectionTitle, { color: 'white' }]}>
                Friend Requests
              </ThemedText>
              
              <View style={styles.listContainer}>
                {requestRows.map((r) => (
                  <Card
                    key={r.id}
                    variant="glassStrong"
                    padding="md"
                    style={styles.requestCard}
                  >
                    <View style={styles.requestRow}>
                      <View style={styles.requestLeft}>
                        <UserPlus size={20} color={theme.colors.primary} />
                        <ThemedText variant="body1" weight="semibold">
                          {r.requester.slice(0, 8)}...
                        </ThemedText>
                      </View>
                      <View style={styles.requestActions}>
                        <ThemedButton
                          title="Accept"
                          size="sm"
                          variant="primary"
                          leftIcon={<CheckCircle size={14} color="white" />}
                          onPress={() => acceptRequest(r)}
                        />
                        <ThemedButton
                          title="Decline"
                          size="sm"
                          variant="secondary"
                          leftIcon={<XCircle size={14} color={theme.colors.text} />}
                          onPress={() => declineRequest(r)}
                        />
                      </View>
                    </View>
                  </Card>
                ))}
                {requestRows.length === 0 && (
                  <Card variant="glassStrong" padding="xl" style={styles.emptyCard}>
                    <UserPlus size={48} color={theme.colors.textSecondary} />
                    <ThemedText
                      variant="body1"
                      color="textSecondary"
                      style={{ textAlign: "center", marginTop: theme.spacing.md }}
                    >
                      No pending requests
                    </ThemedText>
                    <ThemedText
                      variant="body2"
                      color="textSecondary"
                      style={{ textAlign: "center" }}
                    >
                      Friend requests will appear here
                    </ThemedText>
                  </Card>
                )}
              </View>
            </View>
          )}
          {tab === "search" && (
            <View style={styles.panel}>
              <ThemedText variant="h3" style={[styles.sectionTitle, { color: 'white' }]}>
                Find Players
              </ThemedText>
              
              <Card variant="glassStrong" padding="lg" style={styles.searchCard}>
                <ThemedText variant="body2" color="textSecondary" style={{ marginBottom: theme.spacing.sm }}>
                  Search by username, email, or player ID
                </ThemedText>
                <View style={styles.searchInputContainer}>
                  <Search size={20} color={theme.colors.textSecondary} />
                  <TextInput
                    value={searchValue}
                    onChangeText={setSearchValue}
                    placeholder="Enter username or email..."
                    placeholderTextColor={theme.colors.textSecondary}
                    style={[styles.searchInput, { color: theme.colors.text }]}
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.searchActions}>
                  <ThemedButton
                    title="Search"
                    variant="primary"
                    size="md"
                    onPress={runSearch}
                    fullWidth
                  />
                  <ThemedButton
                    title="Clear"
                    variant="secondary"
                    size="md"
                    onPress={() => {
                      setSearchValue("");
                      setSearchResult(null);
                    }}
                    fullWidth
                  />
                </View>
              </Card>

              {searchResult && (
                <Card variant="glassStrong" padding="lg" style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <ThemedText variant="h3">
                      {searchResult.username || searchResult.id.slice(0, 8)}
                    </ThemedText>
                    <ThemedText variant="caption" color="textSecondary">
                      ID: {searchResult.id.slice(0, 8)}...
                    </ThemedText>
                  </View>
                  <View style={styles.resultStats}>
                    <View style={styles.resultStatItem}>
                      <ThemedText variant="body2" color="textSecondary">
                        Ranking
                      </ThemedText>
                      <ThemedText variant="body1" weight="bold">
                        {searchResult.ranking_points ?? 200}
                      </ThemedText>
                    </View>
                    <View style={styles.resultStatItem}>
                      <ThemedText variant="body2" color="textSecondary">
                        XP
                      </ThemedText>
                      <ThemedText variant="body1" weight="bold">
                        {searchResult.xp ?? 0}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.resultActions}>
                    <ThemedButton
                      title="Add Friend"
                      size="md"
                      variant="primary"
                      leftIcon={<UserPlus size={16} color="white" />}
                      onPress={() => sendFriendRequest(searchResult.id)}
                      fullWidth
                    />
                    <ThemedButton
                      title="Challenge"
                      size="md"
                      variant="secondary"
                      leftIcon={<Gamepad2 size={16} color={theme.colors.text} />}
                      onPress={() => sendGameRequest(searchResult)}
                      fullWidth
                    />
                    <ThemedButton
                      title="View Profile"
                      size="md"
                      variant="ghost"
                      leftIcon={<Info size={16} color={theme.colors.text} />}
                      onPress={() => setSelectedFriend(searchResult)}
                      fullWidth
                    />
                  </View>
                </Card>
              )}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Profile Modal */}
      <FriendProfileModal
        friend={selectedFriend}
        onClose={() => setSelectedFriend(null)}
      />
      {/* Action Modal */}
      <Modal
        isVisible={!!actionTarget}
        onClose={() => setActionTarget(null)}
        title={actionTarget ? actionTarget.username || "Friend" : "Friend"}
        backdrop="blur"
        showCloseButton
        size="small"
      >
        {actionTarget && (
          <View style={{ gap: theme.spacing.sm }}>
            <ThemedButton
              title="Send Game Request"
              variant="primary"
              leftIcon={<Gamepad2 size={16} color="white" />}
              onPress={() => sendGameRequest(actionTarget)}
            />
            <ThemedButton
              title="Profile"
              variant="secondary"
              leftIcon={<Info size={16} color={theme.colors.text} />}
              onPress={() => {
                setSelectedFriend(actionTarget);
                setActionTarget(null);
              }}
            />
            <ThemedButton
              title="Remove"
              variant="secondary"
              leftIcon={<UserMinus size={16} color="white" />}
              onPress={() => removeFriend(actionTarget)}
            />
            <ThemedButton
              title="Close"
              variant="ghost"
              onPress={() => setActionTarget(null)}
            />
          </View>
        )}
      </Modal>
    </View>
  );
}

const FriendProfileModal: React.FC<{
  friend:
    | (ProfileRow & { ranking_points?: number | null; xp?: number | null })
    | null;
  onClose: () => void;
}> = ({ friend, onClose }) => {
  const { theme } = useTheme();
  const [derived, setDerived] = useState<{
    level: number;
    levelXp: number;
    nextLevelXp: number;
  } | null>(null);
  useEffect(() => {
    (async () => {
      if (!friend) {
        setDerived(null);
        return;
      }
      try {
        const { derivePlayerLevel } = await import("@/hooks/guest-progress");
        const d = derivePlayerLevel(friend.xp ?? 0);
        setDerived({
          level: d.level,
          levelXp: d.levelXp,
          nextLevelXp: d.nextLevelXp,
        });
      } catch {
        setDerived(null);
      }
    })();
  }, [friend]);
  return (
    <Modal
      isVisible={!!friend}
      onClose={onClose}
      title={friend ? friend.username || "Player" : "Profile"}
      backdrop="blur"
      showCloseButton
      size="small"
    >
      {friend && (
        <View style={{ gap: theme.spacing.xs }}>
          <ThemedText variant="body2" color="textSecondary">
            ID: {friend.id}
          </ThemedText>
          <ThemedText variant="body2">
            Ranking: {friend.ranking_points ?? 200}
          </ThemedText>
          <ThemedText variant="body2">XP: {friend.xp ?? 0}</ThemedText>
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
    scrollContent: { 
      flexGrow: 1, 
      paddingHorizontal: theme.spacing.lg,
      width: "100%",
      maxWidth: 560,
      alignSelf: "center",
    },
    header: {
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
    },
    headerTextContainer: {
      flex: 1,
    },
    title: { 
      fontSize: 32,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: 14,
      opacity: 0.8,
    },
    tabs: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    tabButton: {
      flex: 1,
    },
    panel: { 
      gap: theme.spacing.md 
    },
    statsCard: {
      marginBottom: theme.spacing.md,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
    },
    statItem: {
      flex: 1,
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.colors.border,
      opacity: 0.3,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      marginBottom: theme.spacing.sm,
    },
    listContainer: { 
      gap: theme.spacing.sm 
    },
    friendCard: {
      marginBottom: theme.spacing.xs,
    },
    friendRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    friendLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      flex: 1,
    },
    friendInfo: {
      flex: 1,
      gap: theme.spacing.xs / 2,
    },
    friendRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    onlineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: "white",
    },
    onlineBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs / 2,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.success + '20',
    },
    requestCard: {
      marginBottom: theme.spacing.xs,
    },
    requestRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    requestLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      flex: 1,
    },
    requestActions: {
      flexDirection: "row",
      gap: theme.spacing.xs,
    },
    searchCard: {
      marginBottom: theme.spacing.md,
    },
    searchInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.surfaceVariant + '40',
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      paddingVertical: theme.spacing.sm,
    },
    searchActions: {
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    resultCard: {
      gap: theme.spacing.md,
    },
    resultHeader: {
      gap: theme.spacing.xs / 2,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '40',
      paddingBottom: theme.spacing.sm,
    },
    resultStats: {
      flexDirection: "row",
      gap: theme.spacing.md,
    },
    resultStatItem: {
      flex: 1,
      alignItems: "center",
      gap: theme.spacing.xs / 2,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.surfaceVariant + '20',
      borderRadius: theme.borderRadius.md,
    },
    resultActions: {
      gap: theme.spacing.sm,
    },
    emptyCard: {
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
  });

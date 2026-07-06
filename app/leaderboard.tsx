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
import { useRouter } from "expo-router";
import { ArrowLeft, Crown, Medal, Search, Trophy } from "lucide-react-native";
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
import { LinearGradient } from "expo-linear-gradient";

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session?.user?.id) {
      router.replace("/multiplayer-hub");
    }
  }, [authLoading, session, router]);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [meRank, setMeRank] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [profileRow, setProfileRow] = useState<Row | null>(null);
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

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
    return <LoadingScreen />;
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
              <BrandText variant="h1" style={[styles.title, { color: 'white' }]}>
                Leaderboard
              </BrandText>
              <ThemedText variant="body2" style={[styles.subtitle, { color: 'white' }]}>
                Top {rows.length} players worldwide
              </ThemedText>
            </View>
          </View>

          {/* My Rank Card */}
          {session?.user?.id && meRank !== null && (
            <Card variant="glassStrong" padding="none" style={styles.myRankCard}>
              <LinearGradient
                colors={[theme.colors.primary + 'AA', theme.colors.primary + '66']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.myRankGradient}
              >
                <View style={styles.myRankContent}>
                  <View style={styles.myRankLeft}>
                    <Trophy size={24} color="white" />
                    <View>
                      <ThemedText variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
                        Your Rank
                      </ThemedText>
                      <BrandText variant="h2" style={{ color: 'white' }}>
                        #{meRank}
                      </BrandText>
                    </View>
                  </View>
                  <View style={styles.myRankRight}>
                    <Medal size={20} color="white" />
                    <ThemedText variant="body1" style={{ color: 'white', fontWeight: '600' }}>
                      {rows.find(r => r.id === session.user.id)?.ranking_points || 0} pts
                    </ThemedText>
                  </View>
                </View>
              </LinearGradient>
            </Card>
          )}

          {/* Search Bar */}
          <Card variant="glassStrong" padding="md" style={styles.searchCard}>
            <View style={styles.searchContainer}>
              <Search size={20} color={theme.colors.textSecondary} />
              <TextInput
                placeholder="Search players..."
                placeholderTextColor={theme.colors.textSecondary}
                value={query}
                onChangeText={setQuery}
                style={[styles.searchInput, { color: theme.colors.text }]}
                autoCapitalize="none"
              />
            </View>
          </Card>

          {/* Top 3 Podium */}
          {filtered.length >= 3 && !query.trim() && (
            <View style={styles.podiumContainer}>
              {/* 2nd Place */}
              <View style={styles.podiumItem}>
                <Card
                  variant="glassStrong"
                  padding="none"
                  style={[styles.podiumCard, styles.secondPlace]}
                  touchable
                  onPress={() => setProfileRow(filtered[1])}
                >
                  <LinearGradient
                    colors={['#C0C0C0', '#A8A8A8']}
                    style={styles.podiumGradient}
                  >
                    <Crown size={28} color="white" />
                    <ThemedText variant="h2" style={styles.podiumRank}>2</ThemedText>
                    <View style={styles.onlineIndicator}>
                      <View
                        style={[
                          styles.onlineDot,
                          {
                            backgroundColor: onlineMap[filtered[1].id]
                              ? theme.colors.success
                              : 'rgba(255,255,255,0.3)',
                          },
                        ]}
                      />
                    </View>
                    <ThemedText variant="body1" style={styles.podiumName} numberOfLines={1}>
                      {filtered[1].username || filtered[1].id.slice(0, 8)}
                    </ThemedText>
                    <ThemedText variant="body2" style={styles.podiumPoints}>
                      {filtered[1].ranking_points} pts
                    </ThemedText>
                  </LinearGradient>
                </Card>
              </View>

              {/* 1st Place */}
              <View style={styles.podiumItem}>
                <Card
                  variant="glassStrong"
                  padding="none"
                  style={[styles.podiumCard, styles.firstPlace]}
                  touchable
                  onPress={() => setProfileRow(filtered[0])}
                >
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.podiumGradient}
                  >
                    <Crown size={36} color="white" />
                    <ThemedText variant="h1" style={styles.podiumRank}>1</ThemedText>
                    <View style={styles.onlineIndicator}>
                      <View
                        style={[
                          styles.onlineDot,
                          {
                            backgroundColor: onlineMap[filtered[0].id]
                              ? theme.colors.success
                              : 'rgba(255,255,255,0.3)',
                          },
                        ]}
                      />
                    </View>
                    <ThemedText variant="body1" style={styles.podiumName} numberOfLines={1}>
                      {filtered[0].username || filtered[0].id.slice(0, 8)}
                    </ThemedText>
                    <ThemedText variant="body2" style={styles.podiumPoints}>
                      {filtered[0].ranking_points} pts
                    </ThemedText>
                  </LinearGradient>
                </Card>
              </View>

              {/* 3rd Place */}
              <View style={styles.podiumItem}>
                <Card
                  variant="glassStrong"
                  padding="none"
                  style={[styles.podiumCard, styles.thirdPlace]}
                  touchable
                  onPress={() => setProfileRow(filtered[2])}
                >
                  <LinearGradient
                    colors={['#CD7F32', '#B87333']}
                    style={styles.podiumGradient}
                  >
                    <Crown size={24} color="white" />
                    <ThemedText variant="h3" style={styles.podiumRank}>3</ThemedText>
                    <View style={styles.onlineIndicator}>
                      <View
                        style={[
                          styles.onlineDot,
                          {
                            backgroundColor: onlineMap[filtered[2].id]
                              ? theme.colors.success
                              : 'rgba(255,255,255,0.3)',
                          },
                        ]}
                      />
                    </View>
                    <ThemedText variant="body1" style={styles.podiumName} numberOfLines={1}>
                      {filtered[2].username || filtered[2].id.slice(0, 8)}
                    </ThemedText>
                    <ThemedText variant="body2" style={styles.podiumPoints}>
                      {filtered[2].ranking_points} pts
                    </ThemedText>
                  </LinearGradient>
                </Card>
              </View>
            </View>
          )}

          {/* Rest of Rankings */}
          <View style={styles.listContainer}>
            <ThemedText variant="h3" style={[styles.sectionTitle, { color: 'white' }]}>
              {query.trim() ? 'Search Results' : 'All Rankings'}
            </ThemedText>

            {filtered.slice(query.trim() ? 0 : 3).map((r, index) => {
              const actualIndex = query.trim() ? index : index + 3;
              const isMe = r.id === session?.user?.id;
              
              return (
                <Card
                  key={r.id}
                  variant="glassStrong"
                  padding="md"
                  style={[
                    styles.rankCard,
                    isMe && styles.myRankHighlight,
                  ]}
                  touchable
                  onPress={() => setProfileRow(r)}
                >
                  <View style={styles.rankCardContent}>
                    <View style={styles.rankLeft}>
                      <View style={styles.rankNumber}>
                        <ThemedText 
                          variant="body1" 
                          weight="bold"
                          style={{ 
                            color: actualIndex < 3 
                              ? theme.colors.warning 
                              : theme.colors.text 
                          }}
                        >
                          #{actualIndex + 1}
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.onlineDot,
                          {
                            backgroundColor: onlineMap[r.id]
                              ? theme.colors.success
                              : theme.colors.textSecondary,
                          },
                        ]}
                      />
                      <View style={styles.playerInfo}>
                        <ThemedText variant="body1" weight="semibold">
                          {r.username || r.id.slice(0, 8)}
                        </ThemedText>
                        {isMe && (
                          <ThemedText 
                            variant="caption" 
                            style={{ color: theme.colors.primary }}
                          >
                            You
                          </ThemedText>
                        )}
                      </View>
                    </View>
                    <View style={styles.rankRight}>
                      <Trophy size={16} color={theme.colors.warning} />
                      <ThemedText variant="body1" weight="bold">
                        {r.ranking_points}
                      </ThemedText>
                    </View>
                  </View>
                </Card>
              );
            })}

            {filtered.length === 0 && (
              <Card variant="glassStrong" padding="xl" style={styles.emptyCard}>
                <Search size={48} color={theme.colors.textSecondary} />
                <ThemedText
                  variant="body1"
                  color="textSecondary"
                  style={{ textAlign: "center", marginTop: theme.spacing.md }}
                >
                  No players found
                </ThemedText>
                <ThemedText
                  variant="body2"
                  color="textSecondary"
                  style={{ textAlign: "center" }}
                >
                  Try a different search term
                </ThemedText>
              </Card>
            )}
          </View>
        </ScrollView>
      </Animated.View>

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
    myRankCard: {
      marginBottom: theme.spacing.lg,
      overflow: "hidden",
    },
    myRankGradient: {
      padding: theme.spacing.lg,
    },
    myRankContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    myRankLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    myRankRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    searchCard: {
      marginBottom: theme.spacing.xl,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      paddingVertical: theme.spacing.xs,
    },
    podiumContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "flex-end",
      marginBottom: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    podiumItem: {
      flex: 1,
      maxWidth: 120,
    },
    podiumCard: {
      overflow: "hidden",
    },
    firstPlace: {
      transform: [{ scale: 1.1 }],
    },
    secondPlace: {
      marginBottom: theme.spacing.md,
    },
    thirdPlace: {
      marginBottom: theme.spacing.lg,
    },
    podiumGradient: {
      padding: theme.spacing.lg,
      alignItems: "center",
      gap: theme.spacing.xs,
      minHeight: 160,
      justifyContent: "center",
    },
    podiumRank: {
      color: "white",
      fontWeight: "bold",
    },
    podiumName: {
      color: "white",
      fontWeight: "600",
      textAlign: "center",
    },
    podiumPoints: {
      color: "rgba(255,255,255,0.9)",
      fontSize: 12,
    },
    onlineIndicator: {
      marginVertical: theme.spacing.xs,
    },
    onlineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: "white",
    },
    listContainer: {
      gap: theme.spacing.sm,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      marginBottom: theme.spacing.md,
    },
    rankCard: {
      marginBottom: theme.spacing.sm,
    },
    myRankHighlight: {
      borderWidth: 2,
      borderColor: theme.colors.primary + '80',
    },
    rankCardContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rankLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      flex: 1,
    },
    rankNumber: {
      width: 36,
      alignItems: "center",
    },
    playerInfo: {
      flex: 1,
      gap: theme.spacing.xs / 2,
    },
    rankRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
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

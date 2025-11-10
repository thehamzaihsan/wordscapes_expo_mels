import BackgroundImage from "@/components/common/BackgroundImage";
import LoadingScreen from "@/components/common/LoadingScreen";
import WordSpringsText from "@/components/common/WordSpringsText";
import ThemedButton from "@/components/ui/ThemedButton";
import Card from "@/components/ui/ThemedCard";
import ThemedInput from "@/components/ui/ThemedInput";
import ThemedText from "@/components/ui/ThemedText";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/lib/toast";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Award,
  Edit3,
  LogOut,
  Mail,
  Shield,
  Swords,
  Trophy,
  User,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { signOutSupabase } from "@/lib/auth";

interface ProfileData {
  id: string;
  username: string | null;
  avatar: string | null;
  is_guest: boolean;
  created_at: string;
}

interface StatsData {
  user_id: string;
  ranking_points: number;
  wins: number;
  losses: number;
  draws: number;
}

export default function MultiplayerProfileRoute() {
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
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Load profile and stats
  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) return;
      setLoading(true);

      const [{ data: profileData }, { data: statsData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, avatar, is_guest, created_at")
          .eq("id", session.user.id)
          .maybeSingle(),
        supabase
          .from("user_stats")
          .select("user_id, ranking_points, wins, losses, draws")
          .eq("user_id", session.user.id)
          .maybeSingle(),
      ]);

      setProfile(profileData);
      setStats(statsData);
      setUsernameDraft(profileData?.username || "");
      setLoading(false);
    };

    loadData();
  }, [session?.user?.id]);

  const handleSaveUsername = async () => {
    if (!session?.user?.id || !usernameDraft.trim()) {
      showToast("Username cannot be empty", "warning");
      return;
    }

    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", usernameDraft.trim())
      .neq("id", session.user.id)
      .maybeSingle();

    if (existingUser) {
      showToast("Username already taken", "error");
      return;
    }

    setSavingUsername(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: usernameDraft.trim() })
      .eq("id", session.user.id);

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Username updated", "success");
      setProfile((prev) => (prev ? { ...prev, username: usernameDraft.trim() } : null));
      setEditingUsername(false);
    }
    setSavingUsername(false);
  };

  const handleLogout = async () => {
    const res = await signOutSupabase();
    if (!res.ok) {
      showToast(res.error || "Sign out failed", "error");
    } else {
      showToast("Signed out", "info");
      router.replace("/login");
    }
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

  const totalGames = (stats?.wins || 0) + (stats?.losses || 0) + (stats?.draws || 0);
  const winRate = totalGames > 0 ? ((stats?.wins || 0) / totalGames) * 100 : 0;

  return (
    <View style={styles.container}>
      <BackgroundImage />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
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
              onPress={() => router.push("/multiplayer-hub")}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <WordSpringsText variant="h1" style={[styles.title, { color: 'white' }]}>
                Multiplayer Profile
              </WordSpringsText>
              <ThemedText variant="body2" style={[styles.subtitle, { color: 'white' }]}>
                Your competitive stats
              </ThemedText>
            </View>
          </View>

          {/* Profile Card */}
          <Card variant="glassStrong" padding="none" style={styles.profileCard}>
            <LinearGradient
              colors={[theme.colors.primary + 'AA', theme.colors.primary + '66']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileGradient}
            >
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <User size={48} color="white" />
                </View>
                <View style={styles.profileInfo}>
                  {editingUsername ? (
                    <View style={styles.editUsernameContainer}>
                      <ThemedInput
                        value={usernameDraft}
                        onChangeText={setUsernameDraft}
                        placeholder="Enter username"
                        style={styles.usernameInput}
                      />
                      <View style={styles.editActions}>
                        <ThemedButton
                          title="Save"
                          size="sm"
                          variant="success"
                          onPress={handleSaveUsername}
                          isLoading={savingUsername}
                        />
                        <ThemedButton
                          title="Cancel"
                          size="sm"
                          variant="ghost"
                          onPress={() => {
                            setEditingUsername(false);
                            setUsernameDraft(profile?.username || "");
                          }}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.usernameRow}>
                      <ThemedText variant="body1" weight="semibold" style={{ color: 'white' }}>
                        {profile?.username || "Player"}
                      </ThemedText>
                      <TouchableOpacity onPress={() => setEditingUsername(true)}>
                        <Edit3 size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <ThemedText variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    ID: {profile?.id.slice(0, 8)}...
                  </ThemedText>
                </View>
              </View>
            </LinearGradient>
          </Card>

          {/* Stats Overview */}
          <ThemedText variant="h3" style={[styles.sectionTitle, { color: 'white' }]}>
            Battle Statistics
          </ThemedText>

          <Card variant="glassStrong" padding="xl" style={styles.statCard}>
            <Trophy size={48} color={theme.colors.warning} />
            <ThemedText variant="h1" style={styles.statValue}>
              {stats?.ranking_points || 200}
            </ThemedText>
            <ThemedText variant="body1" color="textSecondary">
              Ranking Points
            </ThemedText>
          </Card>

          {/* Match History Stats */}
          <ThemedText variant="h3" style={[styles.sectionTitle, { color: 'white', marginTop: theme.spacing.xl }]}>
            Match Record
          </ThemedText>

          <Card variant="glassStrong" padding="lg" style={styles.recordCard}>
            <View style={styles.recordRow}>
              <View style={styles.recordItem}>
                <View style={[styles.recordIcon, { backgroundColor: theme.colors.success + '20' }]}>
                  <Award size={24} color={theme.colors.success} />
                </View>
                <View>
                  <ThemedText variant="h3">{stats?.wins || 0}</ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    Wins
                  </ThemedText>
                </View>
              </View>

              <View style={styles.recordItem}>
                <View style={[styles.recordIcon, { backgroundColor: theme.colors.error + '20' }]}>
                  <Shield size={24} color={theme.colors.error} />
                </View>
                <View>
                  <ThemedText variant="h3">{stats?.losses || 0}</ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    Losses
                  </ThemedText>
                </View>
              </View>

              <View style={styles.recordItem}>
                <View style={[styles.recordIcon, { backgroundColor: theme.colors.textSecondary + '20' }]}>
                  <Swords size={24} color={theme.colors.textSecondary} />
                </View>
                <View>
                  <ThemedText variant="h3">{stats?.draws || 0}</ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    Draws
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.winRateContainer}>
              <ThemedText variant="body2" color="textSecondary">
                Win Rate
              </ThemedText>
              <View style={styles.winRateBar}>
                <View 
                  style={[
                    styles.winRateFill, 
                    { 
                      width: `${winRate}%`,
                      backgroundColor: theme.colors.success 
                    }
                  ]} 
                />
              </View>
              <ThemedText variant="h3" style={{ color: theme.colors.success }}>
                {winRate.toFixed(1)}%
              </ThemedText>
            </View>
          </Card>

          {/* Account Info */}
          <ThemedText variant="h3" style={[styles.sectionTitle, { color: 'white' }]}>
            Account Information
          </ThemedText>

          <Card variant="glassStrong" padding="lg" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Mail size={20} color={theme.colors.textSecondary} />
              <View style={styles.infoContent}>
                <ThemedText variant="caption" color="textSecondary">
                  Email
                </ThemedText>
                <ThemedText variant="body1">
                  {session.user.email || "Not set"}
                </ThemedText>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <User size={20} color={theme.colors.textSecondary} />
              <View style={styles.infoContent}>
                <ThemedText variant="caption" color="textSecondary">
                  Account Type
                </ThemedText>
                <ThemedText variant="body1">
                  {profile?.is_guest ? "Guest" : "Full Account"}
                </ThemedText>
              </View>
            </View>
          </Card>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <ThemedButton
              title="Sign Out"
              variant="secondary"
              size="lg"
              leftIcon={<LogOut size={20} color={theme.colors.text} />}
              onPress={handleLogout}
              fullWidth
            />
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    container: { 
      flex: 1 
    },
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
      fontSize: 28,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      fontSize: 14,
      opacity: 0.8,
    },
    profileCard: {
      marginBottom: theme.spacing.xl,
      overflow: "hidden",
    },
    profileGradient: {
      padding: theme.spacing.xl,
    },
    profileHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.lg,
    },
    avatarContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    profileInfo: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    usernameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    editUsernameContainer: {
      gap: theme.spacing.sm,
    },
    usernameInput: {
      backgroundColor: "rgba(255,255,255,0.2)",
      color: "white",
    },
    editActions: {
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      marginBottom: theme.spacing.md,
    },
    statsGrid: {
      flexDirection: "row",
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    statCard: {
      alignItems: "center",
      gap: theme.spacing.md,
    },
    statValue: {
      fontSize: 28,
      fontWeight: "bold",
    },
    recordCard: {
      gap: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    recordRow: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    recordItem: {
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    recordIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
    },
    winRateContainer: {
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border + '40',
    },
    winRateBar: {
      height: 8,
      backgroundColor: theme.colors.surfaceVariant + '40',
      borderRadius: 4,
      overflow: "hidden",
    },
    winRateFill: {
      height: "100%",
      borderRadius: 4,
    },
    infoCard: {
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    infoContent: {
      flex: 1,
      gap: theme.spacing.xs / 2,
    },
    infoDivider: {
      height: 1,
      backgroundColor: theme.colors.border + '40',
    },
    actionsContainer: {
      gap: theme.spacing.sm,
    },
  });

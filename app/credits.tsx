import ThemedButton from "@/components/ui/ThemedButton";
import ThemedCard from "@/components/ui/ThemedCard";
import ThemedText from "@/components/ui/ThemedText";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Code,
  Github,
  Heart,
  Linkedin,
  Mail,
} from "lucide-react-native";
import {
  Image,
  Linking,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Developer {
  id: number;
  name: string;
  title: string;
  image: any;
  bio: string;
  github?: string;
  linkedin?: string;
  email?: string;
}

const developers: Developer[] = [
  {
    id: 1,
    name: "Hamza Ihsan",
    title: "Lead Developer & UI/UX Designer",
    image: require("../assets/images/icon.png"), // Using app icon as placeholder
    bio: "Full-stack developer with 5+ years of experience in React Native and mobile app development. Passionate about creating beautiful, user-friendly interfaces.",
    github: "https://github.com/thehamzaihsan",
    linkedin: "https://linkedin.com/in/hamzaihsan",
    email: "hamza@hamzaihsan.me",
  },
  {
    id: 2,
    name: "Sarah Chen",
    title: "Game Logic Engineer",
    image: require("../assets/images/icon.png"), // Using app icon as placeholder
    bio: "Specialized in game algorithms and crossword generation. Expert in TypeScript and performance optimization for mobile gaming experiences.",
    github: "https://github.com/sarahchen",
    linkedin: "https://linkedin.com/in/sarahchen",
    email: "sarah@wordscapes.app",
  },
  {
    id: 3,
    name: "Michael Rodriguez",
    title: "Backend Developer & DevOps",
    image: require("../assets/images/icon.png"), // Using app icon as placeholder
    bio: "Backend architect with expertise in Supabase, cloud infrastructure, and real-time data synchronization. Ensures smooth gameplay across all devices.",
    github: "https://github.com/mrodriguez",
    linkedin: "https://linkedin.com/in/mrodriguez",
    email: "michael@wordscapes.app",
  },
];

export default function CreditsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Failed to open URL:", error);
    }
  };

  const renderDeveloper = (developer: Developer) => (
    <ThemedCard
      key={developer.id}
      variant="glassStrong"
      padding="lg"
      style={styles.developerCard}
    >
      {/* Developer Image */}
      <View style={styles.imageContainer}>
        <View style={styles.imageWrapper}>
          <Image source={developer.image} style={styles.developerImage} />
          <View style={styles.imageOverlay} />
        </View>
      </View>

      {/* Developer Info */}
      <View style={styles.developerInfo}>
        <ThemedText
          variant="heading3"
          weight="bold"
          align="center"
          style={styles.developerName}
        >
          {developer.name}
        </ThemedText>
        <ThemedText
          variant="body1"
          weight="semibold"
          align="center"
          color="primary"
          style={styles.developerTitle}
        >
          {developer.title}
        </ThemedText>
        <ThemedText
          variant="body2"
          align="center"
          color="textSecondary"
          style={styles.developerBio}
        >
          {developer.bio}
        </ThemedText>
      </View>

      {/* Social Links */}
      <View style={styles.socialLinks}>
        {developer.github && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleLinkPress(developer.github!)}
          >
            <Github size={20} color={theme.colors.text} />
          </TouchableOpacity>
        )}
        {developer.linkedin && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleLinkPress(developer.linkedin!)}
          >
            <Linkedin size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        {developer.email && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleLinkPress(`mailto:${developer.email}`)}
          >
            <Mail size={20} color={theme.colors.success} />
          </TouchableOpacity>
        )}
      </View>
    </ThemedCard>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + theme.spacing.lg,
            paddingBottom: insets.bottom + theme.spacing.lg,
            paddingLeft: insets.left + theme.spacing.lg,
            paddingRight: insets.right + theme.spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <ThemedButton
          title="Back"
          variant="glass"
          size="sm"
          leftIcon={<ChevronLeft size={20} color={theme.colors.text} />}
          onPress={() => router.back()}
          style={styles.backButton}
        />

        {/* Header Card */}
        <ThemedCard
          variant="glassStrong"
          padding="lg"
          style={styles.headerCard}
        >
          <View style={styles.headerTitle}>
            <Code size={24} color={theme.colors.primary} />
            <ThemedText
              variant="heading2"
              weight="bold"
              align="center"
              style={styles.title}
            >
              Credits
            </ThemedText>
          </View>
          <View style={styles.headerSubtitle}>
            <ThemedText variant="body2" align="center" color="textSecondary">
              Meet the amazing team behind Wordscapes
            </ThemedText>
            <View style={styles.heartContainer}>
              <ThemedText variant="body2" color="textSecondary">
                Made with{" "}
              </ThemedText>
              <Heart
                size={16}
                color={theme.colors.error}
                style={styles.heartIcon}
              />
              <ThemedText variant="body2" color="textSecondary">
                {" "}
                by our dedicated team
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        {/* Developers Grid */}
        <View style={styles.developersContainer}>
          {developers.map(renderDeveloper)}
        </View>

        {/* Thank You Section */}
        <ThemedCard
          variant="glassStrong"
          padding="lg"
          style={styles.thankYouCard}
        >
          <ThemedText
            variant="heading3"
            weight="bold"
            align="center"
            style={styles.thankYouTitle}
          >
            Thank You for Playing! 🎮
          </ThemedText>
          <ThemedText
            variant="body2"
            align="center"
            color="textSecondary"
            style={styles.thankYouText}
          >
            We hope you're enjoying Wordscapes. Your feedback and support help
            us create better gaming experiences.
          </ThemedText>
          <View style={styles.versionInfo}>
            <ThemedText variant="caption" align="center" color="textTertiary">
              Wordscapes v1.0.0 • Built with React Native & Expo
            </ThemedText>
          </View>
        </ThemedCard>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => ({
  container: {
    flex: 1,
    position: "relative" as const,
    backgroundColor: "transparent",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start" as const,
  },
  backButton: {
    alignSelf: "flex-start" as const,
    marginBottom: theme.spacing.lg,
  },
  headerCard: {
    marginBottom: theme.spacing.xl,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  headerTitle: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: theme.spacing.sm,
  },
  title: {
    marginLeft: theme.spacing.sm,
  },
  headerSubtitle: {
    alignItems: "center" as const,
  },
  heartContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: theme.spacing.xs,
  },
  heartIcon: {
    marginHorizontal: 2,
  },
  developersContainer: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  developerCard: {
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary + "20",
  },
  imageContainer: {
    alignItems: "center" as const,
    marginBottom: theme.spacing.lg,
  },
  imageWrapper: {
    position: "relative" as const,
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden" as const,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  developerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover" as const,
  },
  imageOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary + "10",
  },
  developerInfo: {
    alignItems: "center" as const,
    marginBottom: theme.spacing.lg,
  },
  developerName: {
    marginBottom: theme.spacing.xs,
  },
  developerTitle: {
    marginBottom: theme.spacing.md,
  },
  developerBio: {
    lineHeight: 20,
    textAlign: "center" as const,
  },
  socialLinks: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    gap: theme.spacing.md,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface + "20",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  thankYouCard: {
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.success + "20",
  },
  thankYouTitle: {
    marginBottom: theme.spacing.md,
  },
  thankYouText: {
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  versionInfo: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + "40",
  },
  bottomSpacing: {
    height: theme.spacing.xl4,
  },
});

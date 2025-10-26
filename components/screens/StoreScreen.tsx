import economy from "@/constants/economy.json";
import {
  loadGuestProgress,
  triggerEnergyRegenCheck,
  type GuestProgressPayload,
} from "@/hooks/guest-progress";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { usePayPalPurchase } from "@/lib/paypal";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  Star,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemedButton from "../ui/ThemedButton";
import ThemedCard from "../ui/ThemedCard";
import ThemedText from "../ui/ThemedText";

// SUBSCRIPTION TOGGLE - Set to true to enable subscription functionality
const SUBSCRIPTIONS_ENABLED = false;

const { height } = Dimensions.get("window");
const CARD_SPACING = 12;

// Responsive values based on screen height
const isSmallScreen = height < 700;
const isMediumScreen = height >= 700 && height < 900;

export default function CombinedStoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isLargeScreen = Platform.OS === "web" && width > 800;
  const CARD_WIDTH = isLargeScreen ? 320 : width * 0.75;

  const styles = useThemedStyles(
    createStyles(isLargeScreen, CARD_WIDTH, width)
  );
  const { open, Modal } = usePayPalPurchase();
  const [activeTab, setActiveTab] = useState<"shop" | "subscription">("shop");
  const [shopIndex, setShopIndex] = useState(0);
  const [subscriptionIndex, setSubscriptionIndex] = useState(0);
  const [progress, setProgress] = useState<GuestProgressPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const shopScrollX = useRef(new Animated.Value(0)).current;
  const subscriptionScrollX = useRef(new Animated.Value(0)).current;
  const shopScrollViewRef = useRef<ScrollView>(null);
  const subscriptionScrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const loadProgressData = async () => {
        setLoading(true);
        try {
          const gp =
            (await triggerEnergyRegenCheck()) || (await loadGuestProgress());
          if (isActive) {
            setProgress(gp);
          }
        } catch (error) {
          console.error("Failed to load progress:", error);
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      loadProgressData();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const getShopOffers = () => {
    const purchaseOptions = economy.gems.purchaseOptions;
    const colors = [
      ["#8b5cf6", "#7c3aed"],
      ["#10b981", "#059669"],
      ["#f59e0b", "#d97706"],
      ["#ef4444", "#dc2626"],
      ["#3b82f6", "#2563eb"],
      ["#ec4899", "#db2777"],
    ];
    const bgColors = [
      "#2e1065",
      "#064e3b",
      "#78350f",
      "#7f1d1d",
      "#1e3a8a",
      "#831843",
    ];
    const names = [
      "Sack of Gems",
      "Box of Gems",
      "Chest of Gems",
      "Pile of Gems",
      "Mountain of Gems",
      "Ocean of Gems",
    ];
    const images = [
      require("../../assets/images/gem1.png"),
      require("../../assets/images/gem2.png"),
      require("../../assets/images/gem3.png"),
      require("../../assets/images/gem4.png"),
    ];

    return purchaseOptions.map((option, index) => ({
      id: index + 1,
      name: names[index] || `Gem Package ${index + 1}`,
      gems: option.gems,
      usd: option.usd,
      price: `$${option.usd.toFixed(2)}`,
      popular: index === 1,
      badge: index === 1 ? "BEST VALUE" : undefined,
      colors: colors[index] || colors[index % colors.length],
      bgColor: bgColors[index] || bgColors[index % bgColors.length],
      image: images[index] || images[index % images.length],
    }));
  };

  const shopOffers = getShopOffers();

  const subscriptions = [
    {
      id: 1,
      name: "Weekly Premium",
      period: "WEEKLY",
      price: "$9.99",
      originalPrice: "$14.99",
      save: "33%",
      features: [
        "5000 Weekly Gems",
        "No Ads",
        "Unlimited Energy",
        "Exclusive Levels",
      ],
      popular: false,
      colors: ["#8b5cf6", "#7c3aed"],
      bgColor: "#2e1065",
      icon: "🌟",
    },
    {
      id: 2,
      name: "Monthly Premium",
      period: "MONTHLY",
      price: "$29.99",
      originalPrice: "$59.99",
      save: "50%",
      features: [
        "Unlimited Gems",
        "No Ads",
        "Unlimited Energy",
        "Exclusive Levels",
        "Priority Support",
      ],
      popular: true,
      badge: "BEST VALUE",
      colors: ["#10b981", "#059669"],
      bgColor: "#064e3b",
      icon: "👑",
    },
  ];

  const navigateLeft = () => {
    if (activeTab === "shop") {
      const newIndex = Math.max(0, shopIndex - 1);
      setShopIndex(newIndex);
      shopScrollViewRef.current?.scrollTo({
        x: newIndex * (CARD_WIDTH + CARD_SPACING),
        animated: true,
      });
    } else {
      const newIndex = Math.max(0, subscriptionIndex - 1);
      setSubscriptionIndex(newIndex);
      subscriptionScrollViewRef.current?.scrollTo({
        x: newIndex * (CARD_WIDTH + CARD_SPACING),
        animated: true,
      });
    }
  };

  const navigateRight = () => {
    if (activeTab === "shop") {
      const newIndex = Math.min(shopOffers.length - 1, shopIndex + 1);
      setShopIndex(newIndex);
      shopScrollViewRef.current?.scrollTo({
        x: newIndex * (CARD_WIDTH + CARD_SPACING),
        animated: true,
      });
    } else {
      const newIndex = Math.min(
        subscriptions.length - 1,
        subscriptionIndex + 1
      );
      setSubscriptionIndex(newIndex);
      subscriptionScrollViewRef.current?.scrollTo({
        x: newIndex * (CARD_WIDTH + CARD_SPACING),
        animated: true,
      });
    }
  };

  const currentIndex = activeTab === "shop" ? shopIndex : subscriptionIndex;
  const items =
    activeTab === "shop"
      ? shopOffers
      : SUBSCRIPTIONS_ENABLED
      ? subscriptions
      : shopOffers;
  const scrollX = activeTab === "shop" ? shopScrollX : subscriptionScrollX;

  useEffect(() => {
    if (isLargeScreen) return;
    if (activeTab === "shop") {
      shopScrollViewRef.current?.scrollTo({
        x: shopIndex * (CARD_WIDTH + CARD_SPACING),
        animated: false,
      });
    } else {
      subscriptionScrollViewRef.current?.scrollTo({
        x: subscriptionIndex * (CARD_WIDTH + CARD_SPACING),
        animated: false,
      });
    }
  }, [activeTab, shopIndex, subscriptionIndex, isLargeScreen, CARD_WIDTH]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    if (isLargeScreen) return;
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / (CARD_WIDTH + CARD_SPACING));
    const newIndex = Math.max(0, Math.min(index, items.length - 1));

    if (activeTab === "shop") {
      if (newIndex !== shopIndex) setShopIndex(newIndex);
    } else {
      if (newIndex !== subscriptionIndex) setSubscriptionIndex(newIndex);
    }
  };

  const renderShopCard = (offer: any, index: number) => {
    const scale = isLargeScreen
      ? 1
      : shopScrollX.interpolate({
          inputRange: [
            (index - 1) * (CARD_WIDTH + CARD_SPACING),
            index * (CARD_WIDTH + CARD_SPACING),
            (index + 1) * (CARD_WIDTH + CARD_SPACING),
          ],
          outputRange: [0.92, 1, 0.92],
          extrapolate: "clamp",
        });

    const opacity = isLargeScreen
      ? 1
      : shopScrollX.interpolate({
          inputRange: [
            (index - 1) * (CARD_WIDTH + CARD_SPACING),
            index * (CARD_WIDTH + CARD_SPACING),
            (index + 1) * (CARD_WIDTH + CARD_SPACING),
          ],
          outputRange: [0.7, 1, 0.7],
          extrapolate: "clamp",
        });

    return (
      <Animated.View
        key={offer.id}
        style={[styles.cardWrapper, { transform: [{ scale }], opacity }]}
      >
        <ThemedCard
          variant="glassStrong"
          padding="lg"
          style={[styles.offerCard, { backgroundColor: offer.bgColor }]}
        >
          {offer.popular && (
            <View style={[styles.popularBadge, styles.enhancedBadge]}>
              <Star
                size={12}
                color={theme.colors.surface}
                style={styles.badgeIcon}
              />
              <ThemedText
                variant="caption"
                weight="bold"
                style={styles.popularText}
              >
                Best Value
              </ThemedText>
            </View>
          )}
          <View style={styles.gemsHeader}>
            <View style={styles.gemAmountBadge}>
              <View style={styles.gemIconContainer}>
                <Gift size={20} color={theme.colors.primary} />
              </View>
              <ThemedText
                variant="heading3"
                weight="bold"
                color="primary"
                style={styles.gemAmount}
              >
                {offer.gems.toLocaleString()}
              </ThemedText>
              <ThemedText variant="caption" style={styles.gemLabel}>
                Gems
              </ThemedText>
            </View>
          </View>
          <ThemedText
            variant="body1"
            weight="bold"
            align="center"
            style={styles.offerName}
          >
            {offer.name}
          </ThemedText>
          <View style={styles.imageContainer}>
            <View style={styles.imageGlow as any} />
            <Image
              source={offer.image}
              style={styles.offerImage}
              resizeMode="contain"
            />
          </View>
        </ThemedCard>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => open({ usd: offer.usd, gems: offer.gems })}
        >
          <LinearGradient
            colors={offer.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.priceButton}
          >
            <ThemedText variant="body1" weight="bold" style={styles.priceText}>
              {offer.price}
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSubscriptionCard = (subscription: any, index: number) => {
    const scale = isLargeScreen
      ? 1
      : subscriptionScrollX.interpolate({
          inputRange: [
            (index - 1) * (CARD_WIDTH + CARD_SPACING),
            index * (CARD_WIDTH + CARD_SPACING),
            (index + 1) * (CARD_WIDTH + CARD_SPACING),
          ],
          outputRange: [0.92, 1, 0.92],
          extrapolate: "clamp",
        });

    const opacity = isLargeScreen
      ? 1
      : subscriptionScrollX.interpolate({
          inputRange: [
            (index - 1) * (CARD_WIDTH + CARD_SPACING),
            index * (CARD_WIDTH + CARD_SPACING),
            (index + 1) * (CARD_WIDTH + CARD_SPACING),
          ],
          outputRange: [0.7, 1, 0.7],
          extrapolate: "clamp",
        });

    return (
      <Animated.View
        key={subscription.id}
        style={[styles.cardWrapper, { transform: [{ scale }], opacity }]}
      >
        <ThemedCard
          variant="glassStrong"
          padding="lg"
          style={[
            styles.subscriptionCard,
            { backgroundColor: subscription.bgColor },
          ]}
        >
          {subscription.popular && (
            <View style={[styles.popularBadge, styles.enhancedBadge]}>
              <Star
                size={12}
                color={theme.colors.surface}
                style={styles.badgeIcon}
              />
              <ThemedText
                variant="caption"
                weight="bold"
                style={styles.popularText}
              >
                {subscription.badge}
              </ThemedText>
            </View>
          )}
          {subscription.save && (
            <View style={[styles.saveBadge, styles.enhancedBadge]}>
              <ThemedText
                variant="caption"
                weight="bold"
                style={styles.saveText}
              >
                SAVE {subscription.save}
              </ThemedText>
            </View>
          )}
          <View style={styles.iconContainer}>
            <View style={styles.subscriptionIconContainer}>
              <Star
                size={isSmallScreen ? 32 : isMediumScreen ? 40 : 48}
                color={theme.colors.warning}
              />
            </View>
          </View>
          <ThemedText
            variant="body1"
            weight="bold"
            align="center"
            style={styles.subscriptionName}
          >
            {subscription.name}
          </ThemedText>
          <View style={styles.featuresList}>
            {subscription.features.map((feature: string, idx: number) => (
              <View key={idx} style={styles.featureItem}>
                <ThemedText
                  variant="body2"
                  weight="bold"
                  color="success"
                  style={styles.checkmark}
                >
                  ✓
                </ThemedText>
                <ThemedText variant="body2" style={styles.featureText}>
                  {feature}
                </ThemedText>
              </View>
            ))}
          </View>
          <View style={styles.priceSection}>
            <ThemedText
              variant="body2"
              color="textSecondary"
              style={styles.originalPrice}
            >
              {subscription.originalPrice}
            </ThemedText>
            <ThemedText
              variant="heading3"
              weight="bold"
              color="primary"
              style={styles.currentPrice}
            >
              {subscription.price}
            </ThemedText>
          </View>
        </ThemedCard>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            console.log("Subscription purchase not implemented yet")
          }
        >
          <LinearGradient
            colors={subscription.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.subscribeButton}
          >
            <ThemedText
              variant="body1"
              weight="bold"
              style={styles.subscribeText}
            >
              SUBSCRIBE NOW
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderCarousel = () => (
    <View style={styles.carouselContainer}>
      {Platform.OS === "web" && !isLargeScreen && (
        <>
          <TouchableOpacity
            style={[
              styles.navButton as any,
              styles.navButtonLeft,
              { opacity: currentIndex === 0 ? 0.5 : 1 },
            ]}
            onPress={navigateLeft}
            disabled={currentIndex === 0}
          >
            <ChevronLeft
              size={24}
              color={
                currentIndex === 0
                  ? theme.colors.textTertiary
                  : theme.colors.primary
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.navButton as any,
              styles.navButtonRight,
              { opacity: currentIndex === items.length - 1 ? 0.5 : 1 },
            ]}
            onPress={navigateRight}
            disabled={currentIndex === items.length - 1}
          >
            <ChevronRight
              size={24}
              color={
                currentIndex === items.length - 1
                  ? theme.colors.textTertiary
                  : theme.colors.primary
              }
            />
          </TouchableOpacity>
        </>
      )}
      <ScrollView
        ref={
          activeTab === "shop" ? shopScrollViewRef : subscriptionScrollViewRef
        }
        horizontal
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselScrollContent}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {(activeTab === "shop"
          ? shopOffers
          : SUBSCRIPTIONS_ENABLED
          ? subscriptions
          : []
        ).map(activeTab === "shop" ? renderShopCard : renderSubscriptionCard)}
      </ScrollView>
    </View>
  );

  const renderGrid = () => (
    <View style={styles.gridContainer}>
      {(activeTab === "shop"
        ? shopOffers
        : subscriptionsEnabled
        ? subscriptions
        : []
      ).map(activeTab === "shop" ? renderShopCard : renderSubscriptionCard)}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
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
        <View style={styles.header}>
          <ThemedButton
            title="Back"
            variant="glass"
            size="sm"
            leftIcon={<ChevronLeft size={20} color={theme.colors.text} />}
            onPress={() => router.back()}
            style={styles.backButton}
          />
          <View style={styles.currencyContainer}>
            <ThemedCard
              variant="glassStrong"
              padding="sm"
              style={styles.currencyBadge}
            >
              <Gift size={18} color={theme.colors.primary} />
              <ThemedText variant="body1" weight="bold" color="primary">
                {loading ? "..." : (progress?.meta.gems ?? 0).toLocaleString()}
              </ThemedText>
            </ThemedCard>
            <ThemedCard
              variant="glassStrong"
              padding="sm"
              style={styles.currencyBadge}
            >
              <Zap
                size={18}
                color={
                  loading
                    ? theme.colors.text
                    : (progress?.meta.energy ?? 0) > 50
                    ? theme.colors.success
                    : theme.colors.warning
                }
              />
              <ThemedText
                variant="body1"
                weight="bold"
                style={{
                  color: loading
                    ? theme.colors.text
                    : (progress?.meta.energy ?? 0) > 50
                    ? theme.colors.success
                    : theme.colors.warning,
                }}
              >
                {loading ? "..." : `${progress?.meta.energy ?? 0}/100`}
              </ThemedText>
            </ThemedCard>
          </View>
        </View>

        <ThemedCard
          variant="glassStrong"
          padding="sm"
          style={styles.tabContainer}
        >
          <View style={styles.tabSelector}>
            <ThemedButton
              title="Shop"
              variant={activeTab === "shop" ? "primary" : "ghost"}
              size="md"
              onPress={() => setActiveTab("shop")}
              style={[styles.tab, activeTab === "shop" && styles.activeTab]}
            />
            {SUBSCRIPTIONS_ENABLED && (
              <ThemedButton
                title="Premium"
                variant={activeTab === "subscription" ? "primary" : "ghost"}
                size="md"
                onPress={() => setActiveTab("subscription")}
                style={[
                  styles.tab,
                  activeTab === "subscription" && styles.activeTab,
                ]}
              />
            )}
          </View>
        </ThemedCard>

        {isLargeScreen ? renderGrid() : renderCarousel()}

        {!isLargeScreen && (
          <View style={styles.dotsContainer}>
            {items.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  if (activeTab === "shop") {
                    setShopIndex(index);
                    shopScrollViewRef.current?.scrollTo({
                      x: index * (CARD_WIDTH + CARD_SPACING),
                      animated: true,
                    });
                  } else {
                    setSubscriptionIndex(index);
                    subscriptionScrollViewRef.current?.scrollTo({
                      x: index * (CARD_WIDTH + CARD_SPACING),
                      animated: true,
                    });
                  }
                }}
                style={[styles.dot, currentIndex === index && styles.activeDot]}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
      {Modal}
    </View>
  );
}

const createStyles =
  (isLargeScreen: boolean, CARD_WIDTH: number, width: number) =>
  (theme: any) => ({
    container: {
      flex: 1,
      position: "relative",
      backgroundColor: "transparent",
      ...(isLargeScreen && {
        maxWidth: 1200,
        alignSelf: "center",
      }),
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "flex-start",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: theme.spacing.lg,
    },
    backButton: {
      alignSelf: "flex-start",
    },
    currencyContainer: {
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    currencyBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      minWidth: 80,
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
      borderWidth: 1,
      borderColor: theme.colors.border + "40",
    },
    tabContainer: {
      marginBottom: theme.spacing.lg,
      alignSelf: isLargeScreen ? "center" : "stretch",
      width: isLargeScreen ? 500 : "auto",
    },
    tabSelector: {
      flexDirection: "row",
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xs,
    },
    tab: {
      flex: 1,
      marginHorizontal: theme.spacing.xs,
      justifyContent: "center",
      alignContent: "center",
      gap: theme.spacing.xs,
      fontSize: 16,
    },
    activeTab: {},
    carouselContainer: {
      height: isSmallScreen ? 380 : isMediumScreen ? 420 : 460,
      marginBottom: theme.spacing.md,
      position: "relative",
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      margin: -theme.spacing.md,
    },
    navButton: {
      position: "absolute",
      top: "50%",
      transform: [{ translateY: -24 }],
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.surface + "E6",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
      shadowOpacity: 0.25,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    navButtonLeft: {
      left: theme.spacing.lg,
    },
    navButtonRight: {
      right: theme.spacing.lg,
    },
    carouselScrollContent: {
      paddingLeft: (width - CARD_WIDTH) / 2,
      paddingRight: (width - CARD_WIDTH) / 2 - CARD_SPACING,
      alignItems: "center",
    },
    cardWrapper: {
      width: CARD_WIDTH,
      marginRight: CARD_SPACING,
      ...(isLargeScreen && {
        margin: theme.spacing.md,
      }),
    },
    offerCard: {
      borderRadius: theme.borderRadius.xl,
      marginBottom: theme.spacing.md,
      shadowOpacity: 0.4,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 16,
      borderWidth: 1,
      borderColor: theme.colors.primary + "20",
    },
    subscriptionCard: {
      borderRadius: theme.borderRadius.xl,
      marginBottom: theme.spacing.md,
      shadowOpacity: 0.4,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 16,
      minHeight: isSmallScreen ? 300 : isMediumScreen ? 340 : 380,
      borderWidth: 1,
      borderColor: theme.colors.warning + "20",
    },
    popularBadge: {
      position: "absolute",
      top: theme.spacing.sm,
      right: theme.spacing.sm,
      backgroundColor: theme.colors.warning,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      zIndex: 10,
    },
    enhancedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      shadowOpacity: 0.3,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    badgeIcon: {
      marginRight: 2,
    },
    popularText: {
      color: theme.colors.surface,
      fontSize: 11,
      fontWeight: "bold",
    },
    saveBadge: {
      position: "absolute",
      top: theme.spacing.sm,
      left: theme.spacing.sm,
      backgroundColor: theme.colors.success,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      zIndex: 10,
    },
    saveText: {
      color: theme.colors.surface,
      fontSize: 11,
      fontWeight: "bold",
    },
    gemIconContainer: {
      backgroundColor: theme.colors.primary + "20",
      borderRadius: 16,
      padding: 4,
      marginRight: theme.spacing.xs,
    },
    imageGlow: {
      position: "absolute",
      width: "120%",
      height: "120%",
      borderRadius: 1000,
      backgroundColor: theme.colors.primary + "10",
      zIndex: 1,
    },
    subscriptionIconContainer: {
      backgroundColor: theme.colors.warning + "20",
      borderRadius: 32,
      padding: theme.spacing.sm,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    gemsHeader: {
      alignItems: "center",
      marginBottom: isSmallScreen ? 8 : 12,
    },
    gemAmountBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    gemAmount: {
      fontSize: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
    },
    gemLabel: {
      fontSize: isSmallScreen ? 12 : 14,
      color: "white",
    },
    offerName: {
      textAlign: "center",
      marginBottom: isSmallScreen ? 12 : 16,
      textTransform: "uppercase",
      letterSpacing: 1,
      color: "white",
    },
    subscriptionName: {
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: theme.spacing.md,
      color: "white",
    },
    imageContainer: {
      height: isSmallScreen ? 120 : isMediumScreen ? 150 : 180,
      justifyContent: "center",
      alignItems: "center",
      marginVertical: isSmallScreen ? 8 : 12,
      position: "relative",
    },
    offerImage: {
      width: isSmallScreen ? 150 : isMediumScreen ? 200 : 250,
      height: isSmallScreen ? 150 : isMediumScreen ? 200 : 250,
      resizeMode: "contain",
      zIndex: 2,
    },
    iconContainer: {
      alignItems: "center",
      marginTop: isSmallScreen ? 12 : 20,
      marginBottom: isSmallScreen ? 12 : 16,
    },
    featuresList: {
      marginVertical: isSmallScreen ? 12 : 20,
      paddingHorizontal: isSmallScreen ? 5 : 10,
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    checkmark: {
      fontSize: isSmallScreen ? 16 : 18,
      marginRight: isSmallScreen ? 8 : 12,
    },
    featureText: {
      fontSize: isSmallScreen ? 12 : 14,
      flex: 1,
      color: "white",
    },
    priceSection: {
      alignItems: "center",
      marginTop: "auto",
      paddingTop: 3,
    },
    originalPrice: {
      fontSize: isSmallScreen ? 14 : 16,
      textDecorationLine: "line-through",
      color: "white",
      marginBottom: 4,
    },
    currentPrice: {
      fontSize: isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
    },
    priceButton: {
      borderRadius: theme.borderRadius.xl,
      paddingVertical: isSmallScreen ? 14 : 18,
      alignItems: "center",
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 12,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
    },
    priceText: {
      color: theme.colors.surface,
      fontSize: isSmallScreen ? 22 : isMediumScreen ? 26 : 28,
    },
    subscribeButton: {
      borderRadius: theme.borderRadius.xl,
      paddingVertical: isSmallScreen ? 14 : 18,
      alignItems: "center",
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 12,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
    },
    subscribeText: {
      color: theme.colors.surface,
      fontSize: isSmallScreen ? 16 : 18,
      letterSpacing: 1,
    },
    dotsContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: isSmallScreen ? 10 : 16,
      paddingBottom: isSmallScreen ? 20 : 30,
      gap: theme.spacing.sm,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary + "30",
      transition: "all 0.3s ease",
    },
    activeDot: {
      width: 28,
      backgroundColor: theme.colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    bottomSpacing: {
      height: theme.spacing.xl4,
    },
  });

import economy from "@/constants/economy.json";
import { loadGuestProgress, type GuestProgressPayload } from "@/hooks/guest-progress";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { startPurchase } from "../hooks/PaypalCheckout";
import ThemedButton from "../ui/ThemedButton";
import ThemedCard from "../ui/ThemedCard";
import ThemedText from "../ui/ThemedText";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.75;
const CARD_SPACING = 12;
const SIDE_CARD_SCALE = 0.92;

// Responsive values based on screen height
const isSmallScreen = height < 700;
const isMediumScreen = height >= 700 && height < 900;

interface CombinedStoreScreenProps {
  onNavigate: (screen: string) => void;
}

export default function CombinedStoreScreen({
  onNavigate,
}: CombinedStoreScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [activeTab, setActiveTab] = useState<"shop" | "subscription">("shop");
  const [shopIndex, setShopIndex] = useState(0);
  const [subscriptionIndex, setSubscriptionIndex] = useState(0);
  const [progress, setProgress] = useState<GuestProgressPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const shopScrollX = useRef(new Animated.Value(0)).current;
  const subscriptionScrollX = useRef(new Animated.Value(0)).current;
  const shopScrollViewRef = useRef<ScrollView>(null);
  const subscriptionScrollViewRef = useRef<ScrollView>(null);


  // Load guest progress data on component mount and when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      
      const loadProgressData = async () => {
        setLoading(true);
        try {
          const gp = await loadGuestProgress();
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

  // Generate shop offers from economy data
  // This dynamically creates shop offers based on the purchase options defined in economy.json
  const getShopOffers = () => {
    const purchaseOptions = economy.gems.purchaseOptions;
    const colors = [
      ["#8b5cf6", "#7c3aed"], // Purple
      ["#10b981", "#059669"], // Green
      ["#f59e0b", "#d97706"], // Orange
      ["#ef4444", "#dc2626"], // Red
      ["#3b82f6", "#2563eb"], // Blue
      ["#ec4899", "#db2777"], // Pink
    ];
    const bgColors = ["#2e1065", "#064e3b", "#78350f", "#7f1d1d", "#1e3a8a", "#831843"];
    const names = [
      "Sack of Gems", 
      "Box of Gems", 
      "Chest of Gems", 
      "Pile of Gems",
      "Mountain of Gems",
      "Ocean of Gems"
    ];
    const images = [
      require("../../../assets/images/gem1.png"),
      require("../../../assets/images/gem2.png"),
      require("../../../assets/images/gem3.png"),
      require("../../../assets/images/gem4.png"),
    ];

    return purchaseOptions.map((option, index) => ({
      id: index + 1,
      name: names[index] || `Gem Package ${index + 1}`,
      gems: option.gems,
      price: `$${option.usd.toFixed(2)}`,
      popular: index === 1, // Make the second option popular (best value)
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
        "Exclusive Levels"
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
        "Priority Support"
      ],
      popular: true,
      badge: "BEST VALUE",
      colors: ["#10b981", "#059669"],
      bgColor: "#064e3b",
      icon: "👑",
    },
  ];

  const currentIndex = activeTab === "shop" ? shopIndex : subscriptionIndex;
  const items = activeTab === "shop" ? shopOffers : subscriptions;
  const scrollX = activeTab === "shop" ? shopScrollX : subscriptionScrollX;

  useEffect(() => {
    // This effect snaps the carousel to the correct card when the tab is switched.
    // It no longer depends on the index to avoid conflicts with user scrolling.
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
  }, [activeTab]);

  // FIX: The listener that caused the glitching has been removed.
  // This event handler now only drives the animations.
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
    }
  );

  // FIX: This new function updates the index state only when the scroll animation ends.
  const handleMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / (CARD_WIDTH + CARD_SPACING));
    const newIndex = Math.max(0, Math.min(index, items.length - 1));

    if (activeTab === "shop") {
      if (newIndex !== shopIndex) {
        setShopIndex(newIndex);
      }
    } else {
      if (newIndex !== subscriptionIndex) {
        setSubscriptionIndex(newIndex);
      }
    }
  };

  const renderShopCard = (offer: any, index: number) => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ];

    const scale = shopScrollX.interpolate({
      inputRange,
      outputRange: [SIDE_CARD_SCALE, 1, SIDE_CARD_SCALE],
      extrapolate: "clamp",
    });

    const opacity = shopScrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        key={offer.id}
        style={[
          styles.cardWrapper,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <ThemedCard variant="glass" padding="lg" style={[styles.offerCard, { backgroundColor: offer.bgColor }]}>
          {offer.popular && (
            <View style={styles.popularBadge}>
              <ThemedText variant="caption" weight="bold" style={styles.popularText}>
                POPULAR
              </ThemedText>
            </View>
          )}

          <View style={styles.gemsHeader}>
            <View style={styles.gemAmountBadge}>
              <Text style={styles.gemEmoji}>💎</Text>
              <ThemedText variant="heading3" weight="bold" color="primary" style={styles.gemAmount}>
                {offer.gems.toLocaleString()}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary" style={styles.gemLabel}>
                Gems
              </ThemedText>
            </View>
          </View>

          <ThemedText variant="body1" weight="bold" align="center" style={styles.offerName}>
            {offer.name}
          </ThemedText>

          <View style={styles.imageContainer}>
            <Image
              source={offer.image}
              style={styles.offerImage}
              resizeMode="contain"
            />
          </View>
        </ThemedCard>

        <TouchableOpacity activeOpacity={0.8} disabled={index !== shopIndex} onPress={() => startPurchase(offer.price)}>
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
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING),
    ];

    const scale = subscriptionScrollX.interpolate({
      inputRange,
      outputRange: [SIDE_CARD_SCALE, 1, SIDE_CARD_SCALE],
      extrapolate: "clamp",
    });

    const opacity = subscriptionScrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        key={subscription.id}
        style={[
          styles.cardWrapper,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <ThemedCard variant="glass" padding="lg" style={[styles.subscriptionCard, { backgroundColor: subscription.bgColor }]}>
          {subscription.popular && (
            <View style={styles.popularBadge}>
              <ThemedText variant="caption" weight="bold" style={styles.popularText}>
                {subscription.badge}
              </ThemedText>
            </View>
          )}

          {subscription.save && (
            <View style={styles.saveBadge}>
              <ThemedText variant="caption" weight="bold" style={styles.saveText}>
                SAVE {subscription.save}
              </ThemedText>
            </View>
          )}

          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{subscription.icon}</Text>
          </View>

          <ThemedText variant="body1" weight="bold" align="center" style={styles.subscriptionName}>
            {subscription.name}
          </ThemedText>

          <View style={styles.featuresList}>
            {subscription.features.map((feature: string, idx: number) => (
              <View key={idx} style={styles.featureItem}>
                <ThemedText variant="body2" weight="bold" color="success" style={styles.checkmark}>
                  ✓
                </ThemedText>
                <ThemedText variant="body2" style={styles.featureText}>
                  {feature}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.priceSection}>
            <ThemedText variant="body2" color="textSecondary" style={styles.originalPrice}>
              {subscription.originalPrice}
            </ThemedText>
            <ThemedText variant="heading3" weight="bold" color="primary" style={styles.currentPrice}>
              {subscription.price}
            </ThemedText>
          </View>
        </ThemedCard>

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={index !== subscriptionIndex}
        >
          <LinearGradient
            colors={subscription.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.subscribeButton}
          >
            <ThemedText variant="body1" weight="bold" style={styles.subscribeText}>
              SUBSCRIBE NOW
            </ThemedText>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, {
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.lg,
          paddingLeft: insets.left + theme.spacing.lg,
          paddingRight: insets.right + theme.spacing.lg,
        }]}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Header */}
        <View style={styles.header}>
          <ThemedButton
            title="Back"
            variant="glass"
            size="sm"
            leftIcon={<ChevronLeft size={20} color={theme.colors.text} />}
            onPress={() => onNavigate("levels")}
            style={styles.backButton}
          />

          <View style={styles.currencyContainer}>
            <ThemedCard variant="glass" padding="sm" style={styles.currencyBadge}>
              <View style={styles.currencyIcon}>
                <Text style={styles.currencyEmoji}>💎</Text>
              </View>
              <ThemedText variant="body1" weight="bold" color="primary">
                {loading ? "..." : (progress?.meta.gems ?? 0)}
              </ThemedText>
            </ThemedCard>
            
            <ThemedCard variant="glass" padding="sm" style={styles.currencyBadge}>
              <View style={styles.currencyIcon}>
                <Text style={styles.currencyEmoji}>⚡</Text>
              </View>
              <ThemedText 
                variant="body1" 
                weight="bold" 
                style={{
                  color: loading ? theme.colors.text : 
                         (progress?.meta.energy ?? 0) > 50 ? theme.colors.success : theme.colors.error
                }}
              >
                {loading ? "..." : `${progress?.meta.energy ?? 0}/100`}
              </ThemedText>
            </ThemedCard>
          </View>
        </View>

        {/* Tab Selector */}
        <ThemedCard variant="glass" padding="xs" style={styles.tabContainer}>
          <View style={styles.tabSelector}>
            <ThemedButton
              title="SHOP"
              variant={activeTab === "shop" ? "primary" : "ghost"}
              size="md"
              onPress={() => setActiveTab("shop")}
              style={[styles.tab, activeTab === "shop" && styles.activeTab]}
            />
            <ThemedButton
              title="PREMIUM"
              variant={activeTab === "subscription" ? "primary" : "ghost"}
              size="md"
              onPress={() => setActiveTab("subscription")}
              style={[styles.tab, activeTab === "subscription" && styles.activeTab]}
            />
          </View>
        </ThemedCard>

        {/* Carousel Container */}
        <View style={styles.carouselContainer}>
          {activeTab === "shop" && (
            <Animated.ScrollView
              ref={shopScrollViewRef}
              horizontal
              snapToInterval={CARD_WIDTH + CARD_SPACING}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselScrollContent}
              onScroll={handleScroll}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              scrollEventThrottle={16}
            >
              {shopOffers.map(renderShopCard)}
            </Animated.ScrollView>
          )}

          {activeTab === "subscription" && (
            <Animated.ScrollView
              ref={subscriptionScrollViewRef}
              horizontal
              snapToInterval={CARD_WIDTH + CARD_SPACING}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselScrollContent}
              onScroll={handleScroll}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              scrollEventThrottle={16}
            >
              {subscriptions.map(renderSubscriptionCard)}
            </Animated.ScrollView>
          )}
        </View>

        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {items.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>
        
        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => ({
  container: {
    flex: 1,
    position: 'relative' as const,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start' as const,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start' as const,
  },
  currencyContainer: {
    flexDirection: 'row' as const,
    gap: theme.spacing.sm,
  },
  currencyBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.xs,
    minWidth: 70,
  },
  currencyIcon: {
    width: 24,
    height: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  currencyEmoji: {
    fontSize: 16,
  },
  tabContainer: {
    marginBottom: theme.spacing.lg,
  },
  tabSelector: {
    flexDirection: 'row' as const,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  activeTab: {
    // Additional styling if needed
  },
  carouselContainer: {
    height: isSmallScreen ? 380 : isMediumScreen ? 420 : 460,
    marginBottom: theme.spacing.md,
  },
  carouselScrollContent: {
    paddingHorizontal: (width - CARD_WIDTH) / 2,
    alignItems: 'flex-start' as const,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_SPACING / 2,
  },
  offerCard: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  subscriptionCard: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    minHeight: isSmallScreen ? 300 : isMediumScreen ? 340 : 380,
  },
  popularBadge: {
    position: 'absolute' as const,
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    zIndex: 10,
  },
  popularText: {
    color: theme.colors.surface,
    fontSize: 11,
    fontWeight: 'bold' as const,
  },
  saveBadge: {
    position: 'absolute' as const,
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
    fontWeight: 'bold' as const,
  },
  gemsHeader: {
    alignItems: 'center' as const,
    marginBottom: isSmallScreen ? 8 : 12,
  },
  gemAmountBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: theme.spacing.sm,
  },
  gemEmoji: {
    fontSize: isSmallScreen ? 16 : 20,
  },
  gemAmount: {
    fontSize: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
  },
  gemLabel: {
    fontSize: isSmallScreen ? 12 : 14,
  },
  offerName: {
    textAlign: 'center' as const,
    marginBottom: isSmallScreen ? 12 : 16,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    color: theme.colors.text,
  },
  subscriptionName: {
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  imageContainer: {
    height: isSmallScreen ? 120 : isMediumScreen ? 150 : 180,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginVertical: isSmallScreen ? 8 : 12,
    position: 'relative' as const,
  },
  offerImage: {
    width: isSmallScreen ? 150 : isMediumScreen ? 200 : 250,
    height: isSmallScreen ? 150 : isMediumScreen ? 200 : 250,
    resizeMode: 'contain' as const,
    zIndex: 2,
  },
  iconContainer: {
    alignItems: 'center' as const,
    marginTop: isSmallScreen ? 12 : 20,
    marginBottom: isSmallScreen ? 12 : 16,
  },
  icon: {
    fontSize: isSmallScreen ? 40 : isMediumScreen ? 50 : 60,
  },
  featuresList: {
    marginVertical: isSmallScreen ? 12 : 20,
    paddingHorizontal: isSmallScreen ? 5 : 10,
  },
  featureItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  checkmark: {
    fontSize: isSmallScreen ? 16 : 18,
    marginRight: isSmallScreen ? 8 : 12,
  },
  featureText: {
    fontSize: isSmallScreen ? 12 : 14,
    flex: 1,
    color: theme.colors.text,
  },
  priceSection: {
    alignItems: 'center' as const,
    marginTop: 'auto' as const,
    paddingTop: 3,
  },
  originalPrice: {
    fontSize: isSmallScreen ? 14 : 16,
    textDecorationLine: 'line-through' as const,
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
  },
  priceButton: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: isSmallScreen ? 12 : 16,
    alignItems: 'center' as const,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  priceText: {
    color: theme.colors.surface,
    fontSize: isSmallScreen ? 22 : isMediumScreen ? 26 : 28,
  },
  subscribeButton: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: isSmallScreen ? 12 : 16,
    alignItems: 'center' as const,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  subscribeText: {
    color: theme.colors.surface,
    fontSize: isSmallScreen ? 16 : 18,
    letterSpacing: 1,
  },
  dotsContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: isSmallScreen ? 10 : 16,
    paddingBottom: isSmallScreen ? 20 : 30,
    gap: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary + '30', // 30% opacity
  },
  activeDot: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  bottomSpacing: {
    height: theme.spacing.xl4,
  },
});
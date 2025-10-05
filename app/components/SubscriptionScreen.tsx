import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;
const CARD_SPACING = 12;
const SIDE_CARD_SCALE = 0.92;

// Responsive values based on screen height
const isSmallScreen = height < 700;
const isMediumScreen = height >= 700 && height < 900;
// removed unused large screen constant

interface CombinedStoreScreenProps {
  onNavigate: (screen: string) => void;
}

export default function CombinedStoreScreen({ onNavigate }: CombinedStoreScreenProps) {
  const [activeTab, setActiveTab] = useState<"shop" | "subscription">("shop");
  const [shopIndex, setShopIndex] = useState(0);
  const [subscriptionIndex, setSubscriptionIndex] = useState(0);
  const shopScrollX = useRef(new Animated.Value(0)).current;
  const subscriptionScrollX = useRef(new Animated.Value(0)).current;
  const shopScrollViewRef = useRef<ScrollView>(null);
  const subscriptionScrollViewRef = useRef<ScrollView>(null);

  const shopOffers = [
    {
      id: 1,
      name: "Sack of Gems",
      gems: 2500,
      price: "$19.99",
      popular: false,
      colors: ["#8b5cf6", "#7c3aed"],
      bgColor: "#2e1065",
      image: require("../../assets/images/gem1.png"),
    },
    {
      id: 2,
      name: "Box of Gems",
      gems: 6500,
      price: "$49.99",
      popular: true,
      badge: "BEST VALUE",
      colors: ["#10b981", "#059669"],
      bgColor: "#064e3b",
      image: require("../../assets/images/gem2.png"),
    },
    {
      id: 3,
      name: "Chest of Gems",
      gems: 14000,
      price: "$99.99",
      popular: false,
      colors: ["#f59e0b", "#d97706"],
      bgColor: "#78350f",
      image: require("../../assets/images/gem3.png"),
    },
    {
      id: 4,
      name: "Pile of Gems",
      gems: 28000,
      price: "$199.99",
      popular: false,
      colors: ["#ef4444", "#dc2626"],
      bgColor: "#7f1d1d",
      image: require("../../assets/images/gem4.png"),
    },
  ];

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
        "Exclusive Levels",
        "Double Rewards",
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
        "Exclusive Levels",
        "Triple Rewards",
      ],
      popular: true,
      badge: "BEST VALUE",
      colors: ["#10b981", "#059669"],
      bgColor: "#064e3b",
      icon: "👑",
    },
  ];

  const currentIndex = activeTab === "shop" ? shopIndex : subscriptionIndex;
  const setCurrentIndex =
    activeTab === "shop" ? setShopIndex : setSubscriptionIndex;
  const items = activeTab === "shop" ? shopOffers : subscriptions;
  const scrollX = activeTab === "shop" ? shopScrollX : subscriptionScrollX;
  const scrollViewRef =
    activeTab === "shop" ? shopScrollViewRef : subscriptionScrollViewRef;

  useEffect(() => {
    const targetIndex = activeTab === "shop" ? shopIndex : subscriptionIndex;
    scrollViewRef.current?.scrollTo({
      x: targetIndex * (CARD_WIDTH + CARD_SPACING),
      animated: false,
    });
  }, [activeTab, shopIndex, subscriptionIndex, scrollViewRef]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * (CARD_WIDTH + CARD_SPACING),
        animated: true,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * (CARD_WIDTH + CARD_SPACING),
        animated: true,
      });
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const x = event.nativeEvent.contentOffset.x;
        const index = Math.round(x / (CARD_WIDTH + CARD_SPACING));
        if (index !== currentIndex && index >= 0 && index < items.length) {
          setCurrentIndex(index);
        }
      },
    }
  );

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
        <TouchableOpacity
          style={[styles.offerCard, { backgroundColor: offer.bgColor }]}
          activeOpacity={0.8}
          disabled={index !== shopIndex}
        >
          {offer.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>POPULAR</Text>
            </View>
          )}

          <View style={styles.gemsHeader}>
            <View style={styles.gemAmountBadge}>
              <Text style={styles.gemEmoji}>💎</Text>
              <Text style={styles.gemAmount}>
                {offer.gems.toLocaleString()}
              </Text>
            </View>
          </View>

          <Text style={styles.offerName}>{offer.name}</Text>

          <View style={styles.imageContainer}>
            <Image
              source={offer.image}
              style={styles.offerImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} disabled={index !== shopIndex}>
          <LinearGradient
            colors={offer.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.priceButton}
          >
            <Text style={styles.priceText}>{offer.price}</Text>
            <Text style={styles.buyNowText}>BUY NOW</Text>
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
        <TouchableOpacity
          style={[
            styles.subscriptionCard,
            { backgroundColor: subscription.bgColor },
          ]}
          activeOpacity={0.8}
          disabled={index !== subscriptionIndex}
        >
          {subscription.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>{subscription.badge}</Text>
            </View>
          )}

          {subscription.save && (
            <View style={styles.saveBadge}>
              <Text style={styles.saveText}>SAVE {subscription.save}</Text>
            </View>
          )}

          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{subscription.icon}</Text>
          </View>

          <Text style={styles.subscriptionName}>{subscription.name}</Text>
          <Text style={styles.period}>{subscription.period}</Text>

          <View style={styles.featuresList}>
            {subscription.features.map((feature: string, idx: number) => (
              <View key={idx} style={styles.featureItem}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={styles.priceSection}>
            <Text style={styles.originalPrice}>
              {subscription.originalPrice}
            </Text>
            <Text style={styles.currentPrice}>{subscription.price}</Text>
            <Text style={styles.billingPeriod}>
              per {subscription.period.toLowerCase()}
            </Text>
          </View>
        </TouchableOpacity>

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
            <Text style={styles.subscribeText}>SUBSCRIBE NOW</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#0f0f23']} style={styles.gradient}>
        <ScrollView style={styles.mainScrollView} contentContainerStyle={styles.mainScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => onNavigate('levels')} style={styles.backButton}>
              <ChevronLeft size={16} color={'white'} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <View style={styles.currencyContainer}>
              <View style={styles.currencyBadge}>
                <View style={[styles.currencyIcon]}><Text style={styles.currencyEmoji}>💎</Text></View>
                <Text style={styles.currencyText}>1245</Text>
              </View>
              <View style={styles.currencyBadge}>
                <View style={[styles.currencyIcon]}><Text style={styles.currencyEmoji}>🟡</Text></View>
                <Text style={styles.currencyText}>750</Text>
              </View>
            </View>
          </View>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>STORE</Text>
          <Text style={styles.subtitle}>
            {activeTab === "shop" ? "Get More Gems" : "Unlock Everything"}
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "shop" && styles.activeTab]}
            onPress={() => setActiveTab("shop")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "shop" && styles.activeTabText,
              ]}
            >
              SHOP
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "subscription" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("subscription")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "subscription" && styles.activeTabText,
              ]}
            >
              PREMIUM
            </Text>
          </TouchableOpacity>
        </View>

        {/* Carousel Container */}
        <View style={styles.carouselContainer}>
          {/* Previous Button */}
          <TouchableOpacity
            style={[
              styles.navigationButton,
              styles.prevButton,
              currentIndex === 0 && styles.disabledButton,
            ]}
            onPress={handlePrevious}
            disabled={currentIndex === 0}
          >
            <Text
              style={[
                styles.navigationButtonText,
                currentIndex === 0 && styles.disabledButtonText,
              ]}
            >
              ‹
            </Text>
          </TouchableOpacity>

          {/* Shop Carousel */}
          {activeTab === "shop" && (
            <Animated.ScrollView
              ref={shopScrollViewRef}
              horizontal
              pagingEnabled
              snapToInterval={CARD_WIDTH + CARD_SPACING}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {shopOffers.map(renderShopCard)}
            </Animated.ScrollView>
          )}

          {/* Subscription Carousel */}
          {activeTab === "subscription" && (
            <Animated.ScrollView
              ref={subscriptionScrollViewRef}
              horizontal
              pagingEnabled
              snapToInterval={CARD_WIDTH + CARD_SPACING}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {subscriptions.map(renderSubscriptionCard)}
            </Animated.ScrollView>
          )}

          {/* Next Button */}
          <TouchableOpacity
            style={[
              styles.navigationButton,
              styles.nextButton,
              currentIndex === items.length - 1 && styles.disabledButton,
            ]}
            onPress={handleNext}
            disabled={currentIndex === items.length - 1}
          >
            <Text
              style={[
                styles.navigationButtonText,
                currentIndex === items.length - 1 && styles.disabledButtonText,
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

          <View style={styles.dotsContainer}>
            {items.map((_, index) => (
              <View key={index} style={[styles.dot, currentIndex === index && styles.activeDot]} />
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  gradient: {
    flex: 1,
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    flexGrow: 1,
    minHeight: height,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backText: {
    color: "#8b5cf6",
    fontSize: 16,
    fontWeight: "600",
  },
  currencyContainer: {
    flexDirection: "row",
    gap: 12,
  },
  currencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(31, 41, 55, 0.8)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(75, 85, 99, 0.3)",
  },
  currencyIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  currencyEmoji: {
    fontSize: 18,
  },
  currencyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  titleContainer: { alignItems: 'center', marginTop: isSmallScreen ? 4 : 8, marginBottom: isSmallScreen ? 8 : 16 },
  title: { color: '#fff', fontSize: isSmallScreen ? 28 : isMediumScreen ? 32 : 36, fontWeight: 'bold', letterSpacing: 2 },
  subtitle: { color: '#9ca3af', fontSize: isSmallScreen ? 12 : 14, marginTop: 4 },
  tabContainer: { flexDirection: 'row', marginHorizontal: isSmallScreen ? 30 : 50, marginVertical: isSmallScreen ? 12 : 16, backgroundColor: 'rgba(31, 41, 55, 0.3)', borderRadius: 30, padding: 4, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' },
  tab: { flex: 1, paddingVertical: isSmallScreen ? 10 : 12, alignItems: 'center', borderRadius: 26 },
  activeTab: {
    backgroundColor: "#8b5cf6",
    shadowColor: "#8b5cf6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  tabText: { color: '#9ca3af', fontSize: isSmallScreen ? 12 : 14, fontWeight: '600', letterSpacing: 1 },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  carouselContainer: { height: isSmallScreen ? height * 0.5 : isMediumScreen ? height * 0.55 : height * 0.6, flexDirection: 'row', alignItems: 'center', position: 'relative', marginVertical: isSmallScreen ? 10 : 20 },
  scrollContent: {
    paddingHorizontal: (width - CARD_WIDTH) / 2,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_SPACING / 2,
  },
  offerCard: { width: '100%', borderRadius: 24, padding: isSmallScreen ? 20 : isMediumScreen ? 35 : 50, backgroundColor: 'rgba(31, 41, 55, 0.4)', borderWidth: 2, borderColor: 'rgba(139, 92, 246, 0.3)', position: 'relative', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 },
  subscriptionCard: { width: '100%', borderRadius: 24, padding: isSmallScreen ? 16 : isMediumScreen ? 20 : 24, backgroundColor: 'rgba(31, 41, 55, 0.4)', borderWidth: 2, borderColor: 'rgba(139, 92, 246, 0.3)', position: 'relative', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15, minHeight: isSmallScreen ? 300 : isMediumScreen ? 340 : 380 },
  popularBadge: {
    position: "absolute",
    top: -1,
    right: -1,
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 22,
    zIndex: 10,
  },
  popularText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  saveBadge: {
    position: "absolute",
    top: 20,
    left: 20,
    backgroundColor: "rgba(251, 191, 36, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
  },
  saveText: {
    color: "#fbbf24",
    fontSize: 11,
    fontWeight: "bold",
  },
  gemsHeader: { alignItems: 'center', marginBottom: isSmallScreen ? 8 : 12 },
  gemAmountBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.4)', paddingHorizontal: isSmallScreen ? 12 : 16, paddingVertical: isSmallScreen ? 6 : 8, borderRadius: 20, gap: 8 },
  gemEmoji: {
    fontSize: isSmallScreen ? 16 : 20,
  },
  gemAmount: { color: '#10b981', fontSize: isSmallScreen ? 18 : isMediumScreen ? 20 : 22, fontWeight: 'bold' },
  offerName: { color: '#fff', fontSize: isSmallScreen ? 18 : isMediumScreen ? 22 : 24, fontWeight: 'bold', textAlign: 'center', marginBottom: isSmallScreen ? 12 : 16, textTransform: 'uppercase', letterSpacing: 1 },
  imageContainer: { height: isSmallScreen ? 120 : isMediumScreen ? 150 : 180, justifyContent: 'center', alignItems: 'center', marginVertical: isSmallScreen ? 8 : 12, position: 'relative' },
  offerImage: { width: isSmallScreen ? 150 : isMediumScreen ? 200 : 250, height: isSmallScreen ? 150 : isMediumScreen ? 200 : 250, resizeMode: 'contain', zIndex: 2 },
  iconContainer: { alignItems: 'center', marginTop: isSmallScreen ? 12 : 20, marginBottom: isSmallScreen ? 12 : 16 },
  icon: {
    fontSize: isSmallScreen ? 40 : isMediumScreen ? 50 : 60,
  },
  subscriptionName: { color: '#fff', fontSize: isSmallScreen ? 18 : isMediumScreen ? 22 : 24, fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  period: { color: '#9ca3af', fontSize: isSmallScreen ? 12 : 14, textAlign: 'center', marginTop: 4, marginBottom: isSmallScreen ? 16 : 20 },
  featuresList: {
    marginVertical: isSmallScreen ? 12 : 20,
    paddingHorizontal: isSmallScreen ? 5 : 10,
  },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: isSmallScreen ? 8 : 12 },
  checkmark: { color: '#10b981', fontSize: isSmallScreen ? 16 : 18, fontWeight: 'bold', marginRight: isSmallScreen ? 8 : 12 },
  featureText: { color: '#fff', fontSize: isSmallScreen ? 12 : 14, flex: 1 },
  priceSection: { alignItems: 'center', marginTop: 'auto', paddingTop: isSmallScreen ? 12 : 20 },
  originalPrice: { color: '#6b7280', fontSize: isSmallScreen ? 14 : 16, textDecorationLine: 'line-through', marginBottom: 4 },
  currentPrice: { color: '#10b981', fontSize: isSmallScreen ? 24 : isMediumScreen ? 28 : 32, fontWeight: 'bold' },
  billingPeriod: { color: '#9ca3af', fontSize: isSmallScreen ? 10 : 12, marginTop: 4 },
  priceButton: { borderRadius: 16, paddingVertical: isSmallScreen ? 12 : 16, alignItems: 'center', marginTop: isSmallScreen ? 16 : isMediumScreen ? 24 : 34 },
  priceText: { color: '#fff', fontSize: isSmallScreen ? 22 : isMediumScreen ? 26 : 28, fontWeight: 'bold' },
  buyNowText: { color: 'rgba(255, 255, 255, 0.9)', fontSize: isSmallScreen ? 14 : 16, fontWeight: '600', letterSpacing: 1, marginTop: 4 },
  subscribeButton: { borderRadius: 16, paddingVertical: isSmallScreen ? 12 : 16, alignItems: 'center', marginTop: isSmallScreen ? 12 : 20 },
  subscribeText: { color: '#fff', fontSize: isSmallScreen ? 16 : 18, fontWeight: 'bold', letterSpacing: 1 },
  navigationButton: { position: 'absolute', width: isSmallScreen ? 50 : 70, height: isSmallScreen ? 50 : 70, borderRadius: isSmallScreen ? 25 : 35, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  prevButton: {
    left: 8,
    top: '50%',
    marginTop: isSmallScreen ? -25 : -35,
  },
  nextButton: {
    right: -5,
    top: '50%',
    marginTop: isSmallScreen ? -25 : -35,
  },
  navigationButtonText: { color: '#fff', fontSize: isSmallScreen ? 50 : 70, fontWeight: 'bold' },
  disabledButton: {
    opacity: 0.3,
  },
  disabledButtonText: {
    color: "#4b5563",
  },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: isSmallScreen ? 10 : 16, paddingBottom: isSmallScreen ? 20 : 30, gap: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
  },
  activeDot: {
    width: 24,
    backgroundColor: "#8b5cf6",
  },
  backButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4, flexDirection: 'row', alignItems: 'center', backgroundColor: '#374151', paddingEnd: 16 },
  backButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});

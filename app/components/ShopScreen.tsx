import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;
const CARD_SPACING = 12;
const SIDE_CARD_SCALE = 0.92;

// Responsive values based on screen height
const isSmallScreen = height < 700;
const isMediumScreen = height >= 700 && height < 900;
const isLargeScreen = height >= 900;

interface ShopScreenProps {
  onNavigate: (screen: string) => void;
}

export default function ShopScreen({ onNavigate }: ShopScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const offers = [
    {
      id: 1,
      name: 'Sack of Gems',
      gems: 2500,
      price: '$19.99',
      popular: false,
      colors: ['#8b5cf6', '#7c3aed'],
      bgColor: '#2e1065',
      image: require('../../assets/images/gem1.png')
    },
    {
      id: 2,
      name: 'Box of Gems',
      gems: 6500,
      price: '$49.99',
      popular: true,
      badge: 'BEST VALUE',
      colors: ['#10b981', '#059669'],
      bgColor: '#064e3b',
      image: require('../../assets/images/gem2.png')
    },
    {
      id: 3,
      name: 'Chest of Gems',
      gems: 14000,
      price: '$99.99',
      popular: false,
      colors: ['#f59e0b', '#d97706'],
      bgColor: '#78350f',
      image: require('../../assets/images/gem3.png')
    },
    {
      id: 4,
      name: 'Pile of Gems',
      gems: 28000,
      price: '$199.99',
      popular: false,
      colors: ['#ef4444', '#dc2626'],
      bgColor: '#7f1d1d',
      image: require('../../assets/images/gem4.png')
    }
  ];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * (CARD_WIDTH + CARD_SPACING),
        animated: true
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < offers.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * (CARD_WIDTH + CARD_SPACING),
        animated: true
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
        if (index !== currentIndex && index >= 0 && index < offers.length) {
          setCurrentIndex(index);
        }
      }
    }
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#0f0f23']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.mainScrollView}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => onNavigate('levels')}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            
            <View style={styles.currencyContainer}>
              <View style={styles.currencyBadge}>
                <View style={[styles.currencyIcon]}>
                  <Text style={styles.currencyEmoji}>💎</Text>
                </View>
                <Text style={styles.currencyText}>1245</Text>
              </View>
              <View style={styles.currencyBadge}>
                <View style={[styles.currencyIcon]}>
                  <Text style={styles.currencyEmoji}>🟡</Text>
                </View>
                <Text style={styles.currencyText}>750</Text>
              </View>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>SHOP</Text>
            <Text style={styles.subtitle}>Get More Gems</Text>
          </View>

          {/* Carousel Container */}
          <View style={styles.carouselContainer}>
            {/* Previous Button */}
            <TouchableOpacity 
              style={[
                styles.navigationButton, 
                styles.prevButton,
                currentIndex === 0 && styles.disabledButton
              ]}
              onPress={handlePrevious}
              disabled={currentIndex === 0}
            >
              <Text style={[
                styles.navigationButtonText,
                currentIndex === 0 && styles.disabledButtonText
              ]}>‹</Text>
            </TouchableOpacity>

            {/* Carousel */}
            <Animated.ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              snapToInterval={CARD_WIDTH + CARD_SPACING}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
            {offers.map((offer, index) => {
              const inputRange = [
                (index - 1) * (CARD_WIDTH + CARD_SPACING),
                index * (CARD_WIDTH + CARD_SPACING),
                (index + 1) * (CARD_WIDTH + CARD_SPACING)
              ];

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [SIDE_CARD_SCALE, 1, SIDE_CARD_SCALE],
                extrapolate: 'clamp'
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.5, 1, 0.5],
                extrapolate: 'clamp'
              });

              return (
                <Animated.View
                  key={offer.id}
                  style={[
                    styles.cardWrapper,
                    {
                      transform: [{ scale }],
                      opacity
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.offerCard,
                      { backgroundColor: offer.bgColor }
                    ]}
                    activeOpacity={0.8}
                    disabled={index !== currentIndex}
                  >
                    {/* Popular Badge */}
                    {offer.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>POPULAR</Text>
                      </View>
                    )}

                    {/* Gems Amount at Top */}
                    <View style={styles.gemsHeader}>
                      <View style={styles.gemAmountBadge}>
                        <Text style={styles.gemEmoji}>💎</Text>
                        <Text style={styles.gemAmount}>{offer.gems.toLocaleString()}</Text>
                      </View>
                    </View>

                    {/* Offer Name */}
                    <Text style={styles.offerName}>{offer.name}</Text>

                    {/* Main Image - NO GLOW EFFECT */}
                    <View style={styles.imageContainer}>
                      <Image 
                        source={offer.image}
                        style={styles.offerImage}
                        resizeMode="contain"
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Price Button - Outside Card */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={index !== currentIndex}
                  >
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
            })}
          </Animated.ScrollView>

          {/* Next Button */}
          <TouchableOpacity 
            style={[
              styles.navigationButton, 
              styles.nextButton,
              currentIndex === offers.length - 1 && styles.disabledButton
            ]}
            onPress={handleNext}
            disabled={currentIndex === offers.length - 1}
          >
            <Text style={[
              styles.navigationButtonText,
              currentIndex === offers.length - 1 && styles.disabledButtonText
            ]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {offers.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot
              ]}
            />
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
    backgroundColor: '#000',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '600',
  },
  currencyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.3)',
  },
  currencyIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  currencyEmoji: {
    fontSize: 18,
  },
  currencyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: isSmallScreen ? 4 : 8,
    marginBottom: isSmallScreen ? 8 : 16,
  },
  title: {
    color: '#fff',
    fontSize: isSmallScreen ? 28 : isMediumScreen ? 32 : 36,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: isSmallScreen ? 12 : 14,
    marginTop: 4,
  },
  carouselContainer: {
    height: isSmallScreen ? height * 0.6 : isMediumScreen ? height * 0.65 : height * 0.7,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginVertical: isSmallScreen ? 10 : 20,
  },
  scrollContent: {
    paddingHorizontal: (width - CARD_WIDTH) / 2,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_SPACING / 2,
  },
  offerCard: {
    width: '100%',
    borderRadius: 24,
    padding: isSmallScreen ? 20 : isMediumScreen ? 35 : 50,
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 22,
    zIndex: 10,
  },
  popularText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  gemsHeader: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 8 : 12,
  },
  gemAmountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 6 : 8,
    borderRadius: 20,
    gap: 8,
  },
  gemEmoji: {
    fontSize: isSmallScreen ? 16 : 20,
  },
  gemAmount: {
    color: '#10b981',
    fontSize: isSmallScreen ? 18 : isMediumScreen ? 20 : 22,
    fontWeight: 'bold',
  },
  offerName: {
    color: '#fff',
    fontSize: isSmallScreen ? 18 : isMediumScreen ? 22 : 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: isSmallScreen ? 12 : 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  imageContainer: {
    height: isSmallScreen ? 120 : isMediumScreen ? 150 : 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: isSmallScreen ? 8 : 12,
    position: 'relative',
  },
  offerImage: {
    width: isSmallScreen ? 150 : isMediumScreen ? 200 : 250,
    height: isSmallScreen ? 150 : isMediumScreen ? 200 : 250,
    resizeMode: 'contain',
    zIndex: 2,
  },
  priceButton: {
    borderRadius: 16,
    paddingVertical: isSmallScreen ? 12 : 16,
    alignItems: 'center',
    marginTop: isSmallScreen ? 16 : isMediumScreen ? 24 : 34,
  },
  priceText: {
    color: '#fff',
    fontSize: isSmallScreen ? 22 : isMediumScreen ? 26 : 28,
    fontWeight: 'bold',
  },
  buyNowText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 4,
  },
  navigationButton: {
    position: 'absolute',
    width: isSmallScreen ? 50 : 70,
    height: isSmallScreen ? 50 : 70,
    borderRadius: isSmallScreen ? 25 : 35,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
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
  navigationButtonText: {
    color: '#fff',
    fontSize: isSmallScreen ? 50 : 70,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.3,
  },
  disabledButtonText: {
    color: '#4b5563',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: isSmallScreen ? 10 : 20,
    paddingBottom: isSmallScreen ? 20 : 30,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  activeDot: {
    width: 24,
    backgroundColor: '#8b5cf6',
  },
});
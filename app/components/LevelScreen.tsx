import { Difficulty, getDifficultyConfig } from '@/constants/difficulty';
import levelsData from '@/constants/levels.json';
import { initializeGameManager } from '@/hooks/game-manager';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Particle interface
interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  color: string;
}

interface LevelData {
  level: number;
  baseWord: string;
  letters: string[];
  crosswordWords: string[];
  difficulty: Difficulty;
  isUnlocked?: boolean;
  isCompleted?: boolean;
  stars?: number;
}

interface LevelCardProps {
  level: LevelData;
  categoryName: string;
  onPress: (level: LevelData, categoryName: string) => void;
}


interface LevelScreenProps {
  onNavigate: (screen: string, levelData?: { 
    baseWord: string, 
    difficulty: Difficulty, 
    levelTitle: string,
    levelData: {
      baseWord: string;
      letters: string[];
      crosswordWords: string[];
      difficulty: Difficulty;
    }
  }) => void;
}

const LevelScreen: React.FC<LevelScreenProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Forest');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [playerGems] = useState<number>(1245);
  const [playerEnergy] = useState<number>(75);
  const [levelCategories, setLevelCategories] = useState<{ [key: string]: LevelData[] }>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Create floating particles
  useEffect(() => {
    const particleColors = ['#8B5CF6', '#EF4444', '#F59E0B', '#10B981'];
    
    const createParticle = (id: number): Particle => ({
      id,
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      opacity: new Animated.Value(Math.random() * 0.3 + 0.1),
      scale: new Animated.Value(Math.random() * 0.5 + 0.5),
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
    });

    const particleArray = Array.from({ length: 25 }, (_, i) => createParticle(i));
    setParticles(particleArray);

    // Animate particles
    const animateParticle = (particle: Particle) => {
      const duration = Math.random() * 8000 + 6000;
      
      Animated.parallel([
        Animated.timing(particle.x, {
          toValue: Math.random() * width,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: Math.random() * height,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(particle.opacity, {
          toValue: Math.random() * 0.3 + 0.1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]).start(() => animateParticle(particle));
    };

    particleArray.forEach(animateParticle);
  }, []);

  // Initialize game manager and load levels
  useEffect(() => {
    initializeGameManager();
    
    // Load levels from JSON with unlock logic
    try {
      const loadedCategories: { [key: string]: LevelData[] } = {};
      
      Object.keys(levelsData).forEach(category => {
        loadedCategories[category] = (levelsData as any)[category].map((level: any, index: number) => ({
          ...level,
          isUnlocked: index < 5 || (index < 10 && Math.random() > 0.3) || Math.random() > 0.7,
          isCompleted: index < 3 || Math.random() > 0.8,
          stars: index < 3 ? 3 : Math.floor(Math.random() * 4)
        }));
      });
      
      setLevelCategories(loadedCategories);
      
      // Ensure selected category exists
      if (!loadedCategories[selectedCategory] && Object.keys(loadedCategories).length > 0) {
        setSelectedCategory(Object.keys(loadedCategories)[0]);
      }
      
    } catch (error) {
      console.error('Failed to load levels:', error);
      // Fallback to empty categories
      setLevelCategories({});
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  const getDifficultyColor = (difficulty: Difficulty): string => {
    const config = getDifficultyConfig(difficulty);
    return config.color;
  };

  const handleLevelPress = (level: LevelData, categoryName: string): void => {
    if (level.isUnlocked) {
        if (playerEnergy < 10) {
        Alert.alert('Not enough energy!', 'Wait or buy more energy to continue playing.');
        } else {
        console.log(`🎮 Selected level: ${level.baseWord} (${level.difficulty}) from ${categoryName}`);
        console.log(`📊 Level data:`, level);
        
        // Navigate to game with complete level data from JSON
        onNavigate('game', {
          baseWord: level.baseWord,
          difficulty: level.difficulty,
          levelTitle: `${level.baseWord} - Level ${level.level}`,
          levelData: {
            baseWord: level.baseWord,
            letters: level.letters || [],
            crosswordWords: level.crosswordWords || [],
            difficulty: level.difficulty
          }
        });
        }
    } else {
        Alert.alert('Locked', 'Complete the previous level to unlock this one.');
    }
  };

  const handleBackPress = (): void => {
    onNavigate('login');
  };

  const handleShopPress = (): void => {
    onNavigate('shop');
  };

  const renderFloatingParticles = () => (
    <View style={StyleSheet.absoluteFillObject}>
      {particles.map(particle => (
        <Animated.View
          key={particle.id}
          style={[
            styles.particle,
            {
              backgroundColor: particle.color,
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );

  const LevelCard: React.FC<LevelCardProps> = ({ level, categoryName, onPress }) => {
    const difficultyColor = getDifficultyColor(level.difficulty);
    const difficultyConfig = getDifficultyConfig(level.difficulty);

    return (
      <TouchableOpacity
        onPress={() => onPress(level, categoryName)}
        style={[
          styles.levelCard,
          !level.isUnlocked && styles.levelCardLocked
        ]}
        activeOpacity={0.8}
      >
        {/* Lock Overlay */}
        {!level.isUnlocked && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockText}>Locked</Text>
          </View>
        )}

        {/* Level Content */}
        <View style={styles.levelContent}>
          {/* Header */}
          <View style={styles.levelHeader}>
            <Text style={[styles.levelName, !level.isUnlocked && styles.levelNameLocked]}>
              {level.baseWord}
            </Text>
            <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}> 
              <Text style={styles.difficultyText}>{difficultyConfig.icon} {difficultyConfig.label}</Text>
            </View>
          </View>

          {/* Level Info */}
          <View style={styles.levelInfo}>
            <Text style={styles.levelNumber}>Level {level.level}</Text>
            {level.isCompleted && level.stars && (
              <View style={styles.starsContainer}>
                {Array.from({ length: 3 }, (_, i) => (
                  <Text key={i} style={styles.star}>
                    {i < (level.stars ?? 0) ? '⭐' : '☆'}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Status Badge */}
          <View style={styles.statusSection}>
            {level.isCompleted ? (
              <View style={[styles.statusBadge, styles.completedBadge]}>
                <Text style={styles.statusText}>✓ Completed</Text>
              </View>
            ) : level.isUnlocked ? (
              <View style={[styles.statusBadge, styles.newBadge]}>
                <Text style={styles.statusText}>Ready to Play</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.inProgressBadge]}>
                <Text style={styles.statusText}>Locked</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121213" />
      
      {/* Floating Particles */}
      {renderFloatingParticles()}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={styles.resourcesContainer}>
          <TouchableOpacity 
            style={styles.resourceItem}
            onPress={handleShopPress}
            activeOpacity={0.7}
          >
            <Text style={styles.resourceIcon}>💎</Text>
            <Text style={styles.resourceText}>{playerGems}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.resourceItem}
            onPress={handleShopPress}
            activeOpacity={0.7}
          >
            <Text style={styles.resourceIcon}>🟡</Text>
            <Text style={[
              styles.resourceText,
              { color: playerEnergy > 50 ? '#10B981' : '#EF4444' }
            ]}>
              {playerEnergy}/100
            </Text>
          </TouchableOpacity>
        </View>
        </View>

        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>SHADOW_HUNTER</Text>
          <Text style={styles.playerLevel}>Level 87</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.xpContainer}>
          <Text style={styles.xpLabel}>7450/10000 XP</Text>
          <View style={styles.xpBarContainer}>
            <View style={styles.xpBarBackground}>
              <View style={[styles.xpBar, { width: '74.5%' }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Category Tabs */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {Object.keys(levelCategories).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                selectedCategory === category && styles.categoryTabActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive
              ]}>
                {category === 'Forest' ? '🌲' : category === 'Ocean' ? '🌊' : '🏔️'} {category.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Level Cards */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading levels...</Text>
          </View>
        ) : levelCategories[selectedCategory]?.length > 0 ? (
          levelCategories[selectedCategory].map((level) => (
            <LevelCard
              key={`${selectedCategory}-${level.level}`}
              level={level}
              categoryName={selectedCategory}
              onPress={handleLevelPress}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No levels available in {selectedCategory}</Text>
            <Text style={styles.emptySubtext}>Check back later for new content!</Text>
          </View>
        )}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121213',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  header: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#374151',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  resourcesContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  resourceIcon: {
    fontSize: 16,
  },
  resourceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  playerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  playerLevel: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  xpContainer: {
    gap: 6,
  },
  xpLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
  xpBarContainer: {
    alignItems: 'center',
  },
  xpBarBackground: {
    width: '80%',
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBar: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  categoryContainer: {
    backgroundColor: '#1F2937',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  categoryTabActive: {
    backgroundColor: '#8B5CF6',
  },
  categoryText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  levelCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#374151',
    overflow: 'hidden',
    position: 'relative',
  },
  levelCardLocked: {
    opacity: 0.6,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  lockIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  lockText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  levelContent: {
    padding: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  levelNameLocked: {
    color: '#6B7280',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelNumber: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },
  statusSection: {
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressSection: {
    gap: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  progressPercent: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginVertical: 4,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  starsAndRewardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  star: {
    fontSize: 20,
  },
  rewardContainer: {
    backgroundColor: '#1F2937',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  rewardText: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
  },
  // statusBadge: duplicate removed
  completedBadge: {
    backgroundColor: '#10B981',
  },
  inProgressBadge: {
    backgroundColor: '#3B82F6',
  },
  newBadge: {
    backgroundColor: '#8B5CF6',
  },
  // statusText: duplicate removed
  bottomSpacing: {
    height: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default LevelScreen;
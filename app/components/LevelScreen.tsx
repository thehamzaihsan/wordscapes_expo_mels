import React, { useEffect, useState } from 'react';
import {
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
import { Difficulty, getAllDifficulties, getDifficultyConfig } from '@/constants/difficulty';
import { initializeGameManager } from '@/hooks/game-manager';
import DifficultySelection from './DifficultySelection';

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
  id: number;
  name: string;
  difficulty: Difficulty;
  isUnlocked: boolean;
  isCompleted: boolean;
  stars: number;
  totalLevels: number;
  completedLevels: number;
  reward?: string;
}

interface LevelCardProps {
  level: LevelData;
  onPress: (level: LevelData) => void;
}

interface LevelScreenProps {
  onNavigate: (screen: string) => void;
}

const LevelScreen: React.FC<LevelScreenProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Forest');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [playerGems] = useState<number>(1245);
  const [playerEnergy] = useState<number>(75);

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

  // Initialize game manager on component mount
  useEffect(() => {
    initializeGameManager();
  }, []);

  const levelCategories: { [key: string]: LevelData[] } = {
    Forest: [
      { id: 1, name: 'Emerald Grove', difficulty: 'easy', isUnlocked: true, isCompleted: true, stars: 3, totalLevels: 20, completedLevels: 20, reward: '100 Coins' },
      { id: 2, name: 'Mystic Bloom', difficulty: 'easy', isUnlocked: true, isCompleted: true, stars: 3, totalLevels: 20, completedLevels: 20, reward: '150 Coins' },
      { id: 3, name: 'Whispering Creek', difficulty: 'medium', isUnlocked: true, isCompleted: true, stars: 2, totalLevels: 20, completedLevels: 18, reward: '200 Coins' },
      { id: 4, name: 'Shadow Canopy', difficulty: 'medium', isUnlocked: true, isCompleted: false, stars: 0, totalLevels: 20, completedLevels: 8, reward: '300 Coins' },
      { id: 5, name: 'Ancient Grove', difficulty: 'hard', isUnlocked: true, isCompleted: false, stars: 0, totalLevels: 20, completedLevels: 0, reward: '500 Coins' },
      { id: 6, name: 'Dark Thicket', difficulty: 'hard', isUnlocked: false, isCompleted: false, stars: 0, totalLevels: 20, completedLevels: 0, reward: '750 Coins' },
    ],
    Ocean: [
      { id: 7, name: 'Crystal Shore', difficulty: 'easy', isUnlocked: false, isCompleted: false, stars: 0, totalLevels: 20, completedLevels: 0, reward: '120 Coins' },
      { id: 8, name: 'Tidal Wave', difficulty: 'medium', isUnlocked: false, isCompleted: false, stars: 0, totalLevels: 20, completedLevels: 0, reward: '250 Coins' },
      { id: 9, name: 'Deep Abyss', difficulty: 'expert', isUnlocked: false, isCompleted: false, stars: 0, totalLevels: 20, completedLevels: 0, reward: '1000 Coins' },
    ],
    Mountain: [
      { id: 10, name: 'Frozen Peak', difficulty: 'hard', isUnlocked: false, isCompleted: false, stars: 0, totalLevels: 20, completedLevels: 0, reward: '800 Coins' },
      { id: 11, name: 'Dragon Summit', difficulty: 'expert', isUnlocked: false, isCompleted: false, stars: 0, totalLevels: 20, completedLevels: 0, reward: 'Legendary Item' },
    ]
  };

  const getDifficultyColor = (difficulty: Difficulty): string => {
    const config = getDifficultyConfig(difficulty);
    return config.color;
  };

  const handleLevelPress = (level: LevelData): void => {
    if (level.isUnlocked) {
        if (playerEnergy < 10) {
        Alert.alert('Not enough energy!', 'Wait or buy more energy to continue playing.');
        } else {
        onNavigate('game');
        }
    } else {
        Alert.alert('Locked', 'Complete the previous level to unlock this one.');
    }
  };

  const handleBackPress = (): void => {
    onNavigate('login');
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

  const LevelCard: React.FC<LevelCardProps> = ({ level, onPress }) => {
    const progress = level.totalLevels > 0 ? level.completedLevels / level.totalLevels : 0;
    const difficultyColor = getDifficultyColor(level.difficulty);

    return (
      <TouchableOpacity
        onPress={() => onPress(level)}
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
              {level.name}
            </Text>
            <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
              <Text style={styles.difficultyText}>{level.difficulty}</Text>
            </View>
          </View>

          {/* Progress */}
          {level.isUnlocked && (
            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                  {level.completedLevels}/{level.totalLevels} Completed
                </Text>
                <Text style={styles.progressPercent}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${progress * 100}%`,
                        backgroundColor: difficultyColor 
                      }
                    ]} 
                  />
                </View>
              </View>

              {/* Stars and Reward inline */}
              <View style={styles.starsAndRewardContainer}>
                {/* Stars on the left */}
                {level.isCompleted && (
                  <View style={styles.starsContainer}>
                    {[1, 2, 3].map((star) => (
                      <Text
                        key={star}
                        style={[
                          styles.star,
                          { color: star <= level.stars ? '#F59E0B' : '#374151' }
                        ]}
                      >
                        ⭐
                      </Text>
                    ))}
                  </View>
                )}

                {/* Reward on the right */}
                {level.reward && (
                  <View style={styles.rewardContainer}>
                    <Text style={styles.rewardText}>🟡 {level.reward}</Text>
                  </View>
                )}
              </View>

              {/* Status */}
              <View style={styles.statusContainer}>
                {level.isCompleted ? (
                  <View style={[styles.statusBadge, styles.completedBadge]}>
                    <Text style={styles.statusText}>Completed</Text>
                  </View>
                ) : level.completedLevels > 0 ? (
                  <View style={[styles.statusBadge, styles.inProgressBadge]}>
                    <Text style={styles.statusText}>▶ Continue</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, styles.newBadge]}>
                    <Text style={styles.statusText}>Start</Text>
                  </View>
                )}
              </View>
            </View>
          )}
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
            <View style={styles.resourceItem}>
              <Text style={styles.resourceIcon}>💎</Text>
              <Text style={styles.resourceText}>{playerGems}</Text>
            </View>
            <View style={styles.resourceItem}>
              <Text style={styles.resourceIcon}>🟡</Text>
              <Text style={[
                styles.resourceText,
                { color: playerEnergy > 50 ? '#10B981' : '#EF4444' }
              ]}>
                {playerEnergy}/100
              </Text>
            </View>
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

      {/* Difficulty Selection */}
      <DifficultySelection
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={setSelectedDifficulty}
        title="Choose Difficulty"
      />

      {/* Level Cards */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {levelCategories[selectedCategory]?.map((level) => (
          <LevelCard
            key={level.id}
            level={level}
            onPress={handleLevelPress}
          />
        ))}
        
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
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  completedBadge: {
    backgroundColor: '#10B981',
  },
  inProgressBadge: {
    backgroundColor: '#3B82F6',
  },
  newBadge: {
    backgroundColor: '#8B5CF6',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default LevelScreen;
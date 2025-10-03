import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Difficulty, DifficultyConfig, getAllDifficulties, getDifficultyConfig } from '@/constants/difficulty';

interface DifficultyCardProps {
  difficulty: Difficulty;
  config: DifficultyConfig;
  isSelected: boolean;
  onSelect: (difficulty: Difficulty) => void;
}

const DifficultyCard: React.FC<DifficultyCardProps> = ({ 
  difficulty, 
  config, 
  isSelected, 
  onSelect 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.difficultyCard,
        isSelected && styles.selectedCard,
        { borderLeftColor: config.color }
      ]}
      onPress={() => onSelect(difficulty)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.difficultyIcon}>{config.icon}</Text>
        <Text style={[styles.difficultyTitle, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
      
      <Text style={styles.difficultyDescription}>
        {config.description}
      </Text>
      
      <View style={styles.difficultyStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Words</Text>
          <Text style={styles.statValue}>{config.minWords}+</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Length</Text>
          <Text style={styles.statValue}>{config.min}-{config.max}</Text>
        </View>
      </View>
      
      {isSelected && (
        <View style={[styles.selectedIndicator, { backgroundColor: config.color }]} />
      )}
    </TouchableOpacity>
  );
};

interface DifficultySelectionProps {
  selectedDifficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  title?: string;
}

const DifficultySelection: React.FC<DifficultySelectionProps> = ({
  selectedDifficulty,
  onDifficultyChange,
  title = "Choose Difficulty"
}) => {
  const difficulties = getAllDifficulties();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {difficulties.map((difficulty) => {
          const config = getDifficultyConfig(difficulty);
          return (
            <DifficultyCard
              key={difficulty}
              difficulty={difficulty}
              config={config}
              isSelected={selectedDifficulty === difficulty}
              onSelect={onDifficultyChange}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  scrollContainer: {
    paddingHorizontal: 10,
  },
  difficultyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    position: 'relative',
  },
  selectedCard: {
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  difficultyIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  difficultyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  difficultyDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  difficultyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#999',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});

export default DifficultySelection;
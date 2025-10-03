import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import LevelScreen from './components/LevelScreen';
import { Difficulty } from '@/constants/difficulty';

interface LevelData {
  baseWord: string;
  difficulty: Difficulty;
  levelTitle: string;
  levelData: {
    baseWord: string;
    letters: string[];
    crosswordWords: string[];
    difficulty: Difficulty;
  };
}

export default function LevelsRoute() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState<LevelData | null>(null);

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.back(); // Navigate back to login
        return true; // Prevent default behavior
      };

      if (Platform.OS === 'android') {
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
      }
    }, [router])
  );

  const handleNavigate = (screen: string, levelData?: LevelData) => {
    if (screen === 'login') {
      router.back(); // Use back() for going back to login
    } else if (screen === 'game') {
      if (levelData) {
        // Store level data and navigate
        setSelectedLevel(levelData);
        router.push({
          pathname: '/game',
          params: {
            baseWord: levelData.baseWord,
            difficulty: levelData.difficulty,
            levelTitle: levelData.levelTitle,
            levelDataJSON: JSON.stringify(levelData.levelData)
          }
        });
      } else {
        router.push('/game');
      }
    }
  };

  return <LevelScreen onNavigate={handleNavigate} />;
}

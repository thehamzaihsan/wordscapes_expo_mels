import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import GameScreen from './components/GameScreen';

export default function GameRoute() {
  const router = useRouter();

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.back(); // Navigate back to levels
        return true; // Prevent default behavior
      };

      if (Platform.OS === 'android') {
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
      }
    }, [router])
  );

  const handleNavigate = (screen: string) => {
    if (screen === 'levels') {
      router.back(); // Use back() to return to levels
    }
  };

  return <GameScreen onNavigate={handleNavigate} />;
}

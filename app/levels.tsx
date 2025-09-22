import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import LevelScreen from './components/LevelScreen';

export default function LevelsRoute() {
  const router = useRouter();

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

  const handleNavigate = (screen: string) => {
    if (screen === 'login') {
      router.back(); // Use back() for going back to login
    } else if (screen === 'game') {
      router.push('/game');
    }
  };

  return <LevelScreen onNavigate={handleNavigate} />;
}

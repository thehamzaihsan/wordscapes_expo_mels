import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import SettingsScreen from './components/SettingsScreen';

export default function SettingsRoute() {
  const router = useRouter();

  // Handle Android back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.back(); // Navigate back to previous screen
        return true; // Prevent default behavior
      };

      if (Platform.OS === 'android') {
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
      }
    }, [router])
  );

  const handleNavigate = (screen: string) => {
    if (screen === 'back') {
      router.back(); // Use back() to return to previous screen
    }
  };

  return <SettingsScreen onNavigate={handleNavigate} />;
}
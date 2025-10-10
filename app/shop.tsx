import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import StoreScreen from './components/screens/StoreScreen'

export default function ShopRoute() {
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

  return <StoreScreen onNavigate={handleNavigate} />;
}
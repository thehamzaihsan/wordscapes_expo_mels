import React from "react";
import { useFocusEffect, useRouter } from 'expo-router';
import LoadingScreen from "./components/common/LoadingScreen";
import { useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import StoreScreen from './components/screens/StoreScreen'

export default function ShopRoute() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

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
    setIsLoading(true);
    setTimeout(() => {
      if (screen === 'levels') {
        router.back();
      }
      setTimeout(() => setIsLoading(false), 100);
    }, 600);
  };

  return (
    <>
      {isLoading && <LoadingScreen />}
      <StoreScreen onNavigate={handleNavigate} />
    </>
  );
}
import React from "react";
import { useFocusEffect, useRouter } from 'expo-router';
import LoadingScreen from "./components/common/LoadingScreen";
import { useCallback } from 'react';
import { BackHandler, Platform, View } from 'react-native';
import BackgroundImage from "./components/common/BackgroundImage";
import SettingsScreen from './components/screens/SettingsScreen';

export default function SettingsRoute() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

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
    setIsLoading(true);
    setTimeout(() => {
      if (screen === 'back') {
        router.back();
      } else if (screen === 'credits') {
        router.push('/credits');
      } else if (screen === 'debug') {
        router.push('/debug');
      }
      setTimeout(() => setIsLoading(false), 100);
    }, 600);
  };

  return (
    <View style={{ flex: 1 }}>
      <BackgroundImage />
      {isLoading && <LoadingScreen progress={0.7} />}
      <SettingsScreen onNavigate={handleNavigate} />
    </View>
  );
}
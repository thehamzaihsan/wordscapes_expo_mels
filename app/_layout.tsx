import { initializeGameManager } from '@/hooks/game-manager';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, BackHandler, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    KnightWarrior: require('../assets/fonts/KnightWarrior.otf'),
    // Add more fonts here if needed
  });

  useEffect(() => {
    // Initialize game manager for optimal performance across the app
    initializeGameManager();
    if (Platform.OS === 'android') {
      const backAction = () => {
        // Let Expo Router handle the back navigation
        return false; // Return false to let the default behavior handle it
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121213' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="login" 
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen 
            name="levels" 
            options={{
              headerShown: false,
              gestureEnabled: true,
            }}
          />
          <Stack.Screen 
            name="game" 
            options={{
              headerShown: false,
              gestureEnabled: true,
            }}
          />
          <Stack.Screen 
            name="test" 
            options={{
              headerShown: false,
              gestureEnabled: true,
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
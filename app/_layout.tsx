import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeGameManager } from '@/hooks/game-manager';

export default function RootLayout() {
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

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true, // Enable swipe gestures
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
            gestureEnabled: false, // Disable swipe back on login
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
  );
}

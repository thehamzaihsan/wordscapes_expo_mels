import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export function useSoundSettings() {
  const [sound, setSound] = useState(true);

  // Load sound preference on component mount
  useEffect(() => {
    const loadSoundPreference = async () => {
      try {
        const savedSound = await AsyncStorage.getItem('@game_sound_enabled');
        if (savedSound !== null) {
          setSound(JSON.parse(savedSound));
        }
      } catch (error) {
        console.warn('Failed to load sound preference:', error);
      }
    };
    
    loadSoundPreference();
  }, []);

  // Handle sound toggle
  const handleSoundToggle = useCallback(async () => {
    const newSoundValue = !sound;
    setSound(newSoundValue);
    try {
      await AsyncStorage.setItem('@game_sound_enabled', JSON.stringify(newSoundValue));
    } catch (error) {
      console.warn('Failed to save sound preference:', error);
    }
  }, [sound]);

  return {
    sound,
    handleSoundToggle,
  };
}
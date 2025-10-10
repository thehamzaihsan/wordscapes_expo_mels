import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SoundManager {
  rightWordSound: Audio.Sound | null;
  wrongWordSound: Audio.Sound | null;
  bonusWordSound: Audio.Sound | null;
  levelCompleteSound: Audio.Sound | null;
}

interface UseSoundManagerProps {
  soundEnabled: boolean;
}

export function useSoundManager({ soundEnabled }: UseSoundManagerProps) {
  const [sounds, setSounds] = useState<SoundManager>({
    rightWordSound: null,
    wrongWordSound: null,
    bonusWordSound: null,
    levelCompleteSound: null,
  });
  const isUnmounting = useRef(false);

  // Load sounds
  useEffect(() => {
    isUnmounting.current = false;
    let mounted = true;

    const loadSounds = async () => {
      try {
        const [rightRes, wrongRes, bonusRes, levelRes] = await Promise.all([
          Audio.Sound.createAsync(
            require("../../assets/sounds/correct-word.mp3")
          ),
          Audio.Sound.createAsync(
            require("../../assets/sounds/wrong-word.mp3")
          ),
          Audio.Sound.createAsync(
            require("../../assets/sounds/bonus-word.mp3")
          ),
          Audio.Sound.createAsync(
            require("../../assets/sounds/level-complete.mp3")
          ),
        ]);

        if (mounted && !isUnmounting.current) {
          setSounds({
            rightWordSound: rightRes.sound,
            wrongWordSound: wrongRes.sound,
            bonusWordSound: bonusRes.sound,
            levelCompleteSound: levelRes.sound,
          });
        }
      } catch (error) {
        console.warn("Failed to load sounds:", error);
      }
    };

    loadSounds();

    return () => {
      mounted = false;
    };
  }, []);

  // Cleanup sounds on unmount
  useEffect(() => {
    return () => {
      isUnmounting.current = true;
      Object.values(sounds).forEach(sound => {
        if (sound) {
          sound.unloadAsync().catch(console.warn);
        }
      });
    };
  }, [sounds]);

  const playSound = useCallback(async (soundType: keyof SoundManager) => {
    if (!soundEnabled || isUnmounting.current) return;
    
    const sound = sounds[soundType];
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.warn(`Failed to play ${soundType}:`, error);
    }
  }, [sounds, soundEnabled]);

  return { playSound };
}
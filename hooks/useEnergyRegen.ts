import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { loadGuestProgress, saveGuestProgress, checkAndApplyEnergyRegeneration } from './guest-progress';
import { showToast } from '@/lib/toast';

/**
 * Hook to manage automatic energy regeneration when app comes to foreground
 */
export const useEnergyRegen = () => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // When app comes to foreground from background
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        try {
          const progress = await loadGuestProgress();
          if (progress) {
            const { progress: updatedProgress, energyGained } = checkAndApplyEnergyRegeneration(progress);
            
            if (energyGained > 0) {
              await saveGuestProgress(updatedProgress);
              showToast(`+${energyGained} energy restored!`, 'success');
            }
          }
        } catch (error) {
          console.warn('Failed to check energy regeneration:', error);
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);
};
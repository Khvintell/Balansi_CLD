import { useCallback } from 'react';
import { useBiometricsStore } from '../store/useBiometricsStore';
import { useDiaryStore } from '../store/useDiaryStore';
import { HealthService } from '../services/healthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = 'http://192.168.1.16:8000'; // Match HomeScreen

export const useBioSync = () => {
  const { 
    lastSleepSyncDate, 
    setLastSleepSyncDate, 
    setBiometricStatus,
    setLatestBiometrics 
  } = useBiometricsStore();
  
  const { profile, updateProfile } = useDiaryStore();

  const sync = useCallback(async () => {
    let currentProfile = profile;
    
    // Fallback: If store profile is null, try to load from raw AsyncStorage key
    if (!currentProfile) {
      try {
        const ps = await AsyncStorage.getItem('userProfile');
        if (ps) {
          currentProfile = JSON.parse(ps);
          console.log("[BioSync] Loaded profile from fallback AsyncStorage");
        }
      } catch (e) {
        console.error("[BioSync] Failed to load fallback profile", e);
      }
    }

    if (!currentProfile) {
      console.warn("[BioSync] No profile found. Skipping sync.");
      return;
    }

    try {
      console.log("[BioSync] Starting health data fetch...");
      const healthData = await HealthService.fetchData();
      console.log("[BioSync] Health data received:", healthData);
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      
      // Determine if we need an AI recalculation based on Hybrid Strategy
      let shouldCallAI = false;
      const syncReason: string[] = [];
      
      // 1. Sleep Sync Rule: once a day (Relaxed for testing: removed morning check)
      const isNewDay = lastSleepSyncDate !== today;
      if (isNewDay) {
        shouldCallAI = true;
        syncReason.push("New Day/First Sync");
      }
      
      // 2. Activity Threshold Rule: workout > 400 kcal
      const highBurn = healthData.burned > 400;
      if (highBurn) {
        shouldCallAI = true;
        syncReason.push("High Physical Load (>400kcal)");
      }
      
      // Force AI call if sleep is critical (< 300 mins) to ensure UX visibility
      if (healthData.sleepMinutes < 300 && !lastSleepSyncDate) {
        shouldCallAI = true;
        syncReason.push("Critical Sleep Deprivation detected");
      }

      console.log(`[BioSync] Decision: shouldCallAI=${shouldCallAI}. Reasons: ${syncReason.join(", ") || "None"}`);

      // Update basic local stats regardless
      setLatestBiometrics({
        steps: healthData.steps,
        burned: healthData.burned,
        sleepMinutes: healthData.sleepMinutes
      });

      if (shouldCallAI) {
        console.log("[BioSync] Threshold met. Calling AI for recalculation...");
        
        const response = await fetch(`${SERVER_URL}/api/sync-biometrics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            biometrics: {
              sleep_duration_minutes: healthData.sleepMinutes,
              active_energy_burned: healthData.burned,
              step_count: healthData.steps,
              workouts: healthData.workouts
            },
            profile: {
              base_tdee: (currentProfile as any).targetCalories || 2000,
              base_macros: (currentProfile as any).macros || { protein: 120, carbs: 200, fats: 60 }
            }
          })
        });

        const result = await response.json();
        console.log("[BioSync] AI Response received:", result);
        
        if (result.success) {
          console.log("[BioSync] Recalculation successful! Updating stores...");
          // Update Biometrics Store with AI result
          setBiometricStatus({
            targetCalories: result.target_calories,
            adjustedMacros: result.adjusted_macros,
            message: result.message,
            requiresAlert: result.requires_alert,
            updatedAt: new Date().toISOString()
          });

          // Sync back to Diary Store to update the actual daily targets
          updateProfile({
            targetCalories: result.target_calories,
            macros: result.adjusted_macros
          });

          // Mark as synced for today to prevent loops
          if (isNewDay) {
            setLastSleepSyncDate(today);
            console.log(`[BioSync] Marked today (${today}) as synced.`);
          }
        } else {
          console.warn("[BioSync] AI Recalculation failed on backend:", result.error);
        }
      }
    } catch (error) {
      console.error("[BioSync] Error during synchronization:", error);
    }
  }, [profile, lastSleepSyncDate]);

  return { sync };
};

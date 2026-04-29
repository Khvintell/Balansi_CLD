import { useCallback, useState } from 'react';
import { Platform, Alert } from 'react-native';
import { useBioStore } from '../store/useBioStore';
import { useDiaryStore } from '../store/useDiaryStore';
import { SERVER_URL } from '../config/api';

// Common biometric data interface
interface UnifiedHealthData {
  sleep_duration_minutes: number;
  active_energy_burned: number;
  step_count: number;
  workouts: string[];
  workoutDurationMinutes: number;
}

// ─── Native Health Modules (loaded lazily, only on native platforms) ──────────
let AppleHealthKit: any = null;
let initHealthConnect: any = null;
let requestHealthConnectPermission: any = null;
let readRecords: any = null;

try {
  if (Platform.OS === 'ios') {
    AppleHealthKit = require('react-native-health').default;
  } else if (Platform.OS === 'android') {
    const HealthConnect = require('react-native-health-connect');
    initHealthConnect = HealthConnect.initialize;
    requestHealthConnectPermission = HealthConnect.requestPermission;
    readRecords = HealthConnect.readRecords;
  }
} catch (e) {
  // Health modules not installed — bio sync will use fallback mock data
  console.log('[BioEngine] Health modules not available, using mock data.');
}

// ─── Mock fallback when native health modules are unavailable ────────────────
const getMockHealthData = (): UnifiedHealthData => ({
  step_count: 1200,
  active_energy_burned: 50,
  sleep_duration_minutes: 420,
  workouts: [],
  workoutDurationMinutes: 0,
});

export const useBiometrics = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const requestIOSPermissions = useCallback((): Promise<boolean> => {
    if (!AppleHealthKit) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.Workout,
          ],
          write: [],
        },
      };

      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.log('[iOS] HealthKit Initialization Error:', error);
          resolve(false);
          return;
        }
        resolve(true);
      });
    });
  }, []);

  const requestAndroidPermissions = useCallback(async (): Promise<boolean> => {
    if (!initHealthConnect) return false;
    try {
      await initHealthConnect();
      const grantedPermissions = await requestHealthConnectPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
        { accessType: 'read', recordType: 'SleepSession' },
        { accessType: 'read', recordType: 'ExerciseSession' },
      ]);
      return !!grantedPermissions;
    } catch (error) {
      console.log('[Android] HealthConnect Permission Error:', error);
      return false;
    }
  }, []);

  const fetchIOSData = useCallback(async (startOfDay: Date, endOfDay: Date): Promise<UnifiedHealthData> => {
    if (!AppleHealthKit) return getMockHealthData();
    return new Promise((resolve) => {
      const options = {
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      };

      let step_count = 0;
      let active_energy_burned = 0;
      let sleep_duration_minutes = 0;
      let workouts: string[] = [];
      let workoutDurationMinutes = 0;

      const finishFetching = () => {
        resolve({
          step_count,
          active_energy_burned,
          sleep_duration_minutes,
          workouts,
          workoutDurationMinutes,
        });
      };

      // Steps
      AppleHealthKit.getDailyStepCountSamples(options, (err: any, results: any[]) => {
        if (!err && results?.length) {
          step_count = results.reduce((sum: number, r: any) => sum + r.value, 0);
        }
        
        // Calories
        AppleHealthKit.getActiveEnergyBurned(options, (err2: any, results2: any[]) => {
          if (!err2 && results2?.length) {
            active_energy_burned = results2.reduce((sum: number, r: any) => sum + r.value, 0);
          }

          // Sleep (Since yesterday to capture night sleep)
          const sleepOpts = {
            startDate: new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000).toISOString(),
            endDate: endOfDay.toISOString(),
          };
          AppleHealthKit.getSleepSamples(sleepOpts, (err3: any, results3: any[]) => {
            if (!err3 && results3?.length) {
              const sleepPeriods = results3.filter((s: any) => s.value === 'ASLEEP');
              const totalSleepMs = sleepPeriods.reduce((sum: number, s: any) => sum + (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()), 0);
              sleep_duration_minutes = Math.floor(totalSleepMs / 60000);
            }

            // Workouts
            AppleHealthKit.getSamples({
              ...options,
              type: 'Workout' as any,
            }, (err4: any, results4: any[]) => {
              if (!err4 && results4?.length) {
                workouts = results4.map((w: any) => w.activityName || 'Workout');
                workoutDurationMinutes = results4.reduce((sum: number, r: any) => {
                  const duration = (new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 60000;
                  return sum + duration;
                }, 0);
              }
              finishFetching();
            });
          });
        });
      });
    });
  }, []);

  const fetchAndroidData = useCallback(async (startOfDay: Date, endOfDay: Date): Promise<UnifiedHealthData> => {
    if (!readRecords) return getMockHealthData();
    try {
      const timeRangeFilter = {
        operator: 'between' as const,
        startTime: startOfDay.toISOString(),
        endTime: endOfDay.toISOString(),
      };

      const [stepsRef, caloriesRef, exerciseRef] = await Promise.all([
        readRecords('Steps', { timeRangeFilter }),
        readRecords('ActiveCaloriesBurned', { timeRangeFilter }),
        readRecords('ExerciseSession', { timeRangeFilter }),
      ]);

      const step_count = stepsRef.reduce((acc: number, curr: any) => acc + curr.count, 0);
      const active_energy_burned = caloriesRef.reduce((acc: number, curr: any) => acc + curr.energy.inKilocalories, 0);
      const workouts = exerciseRef.map((r: any) => r.exerciseType.toString());
      const workoutDurationMinutes = exerciseRef.reduce((acc: number, curr: any) => {
        return acc + (new Date(curr.endTime).getTime() - new Date(curr.startTime).getTime()) / 60000;
      }, 0);

      const sleepFilter = {
        operator: 'between' as const,
        startTime: new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        endTime: endOfDay.toISOString(),
      };
      const sleepRef = await readRecords('SleepSession', { timeRangeFilter: sleepFilter });
      const sleep_duration_minutes = sleepRef.reduce((acc: number, curr: any) => {
        return acc + (new Date(curr.endTime).getTime() - new Date(curr.startTime).getTime()) / 60000;
      }, 0);

      return {
        step_count,
        active_energy_burned,
        workouts,
        workoutDurationMinutes,
        sleep_duration_minutes,
      };
    } catch (err) {
      console.log('[Android] Fetch error:', err);
      return getMockHealthData();
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'ios') {
      return await requestIOSPermissions();
    } else if (Platform.OS === 'android') {
      return await requestAndroidPermissions();
    }
    return false;
  }, [requestIOSPermissions, requestAndroidPermissions]);

  const syncBioData = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        Alert.alert(
          "უფლებები შეზღუდულია",
          "ბიომეტრიული სინქრონიზაციისთვის გთხოვთ, მიანიჭოთ წვდომა ჯანმრთელობის მონაცემებზე."
        );
        setIsSyncing(false);
        return;
      }

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

      let healthData: UnifiedHealthData;
      if (Platform.OS === 'ios') {
        healthData = await fetchIOSData(startOfDay, now);
      } else {
        healthData = await fetchAndroidData(startOfDay, now);
      }

      console.log("[BioEngine] Raw Health Data:", healthData);

      // --- HYBRID THRESHOLD SYNC LOGIC ---
      let shouldCallAI = false;
      const reasons: string[] = [];
      const todayStr = now.toISOString().split('T')[0];
      
      const currentBioStore = useBioStore.getState();

      // 1. Sleep Rule: Sync if today is a new day && time > 05:00 AM
      if (currentBioStore.lastSleepSyncTimestamp !== todayStr && now.getHours() >= 5) {
        shouldCallAI = true;
        reasons.push('New day sleep sync after 05:00 AM');
      }

      // 2. Kinetic Rule: New workout > 30 mins
      const workoutDelta = healthData.workoutDurationMinutes - currentBioStore.lastSyncedWorkoutDuration;
      if (workoutDelta >= 30) {
        shouldCallAI = true;
        reasons.push('Intense workout mapped');
      }

      // 3. Kinetic Rule: Sudden delta > 400 kcal
      const energyDelta = healthData.active_energy_burned - currentBioStore.lastSyncedEnergy;
      if (energyDelta >= 400) {
        shouldCallAI = true;
        reasons.push('Massive energy burn detected');
      }

      console.log(`[BioEngine] AI Sync evaluated: ${shouldCallAI}. Reasons: ${reasons.join(', ')}`);

      if (shouldCallAI) {
        const currentProfile = useDiaryStore.getState().profile;
        if (!currentProfile) {
          console.warn("[BioEngine] No user profile set. Aborting sync.");
          setIsSyncing(false);
          return;
        }

        const payload = {
          biometrics: {
            sleep_duration_minutes: healthData.sleep_duration_minutes,
            active_energy_burned: Math.floor(healthData.active_energy_burned),
            step_count: Math.floor(healthData.step_count),
            workouts: healthData.workouts,
          },
          profile: {
            base_tdee: currentProfile.targetCalories || 2000,
            base_macros: currentProfile.macros || { protein: 120, carbs: 200, fats: 60 }
          }
        };

        const response = await fetch(`${SERVER_URL}/api/bio-engine-sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log("[BioEngine] AI Backend Response:", result);

        if (response.ok && result.success) {
          // Update AI Store
          currentBioStore.updateAIStatus({
            requires_alert: result.requires_alert,
            target_calories: result.target_calories,
            adjusted_macros: result.adjusted_macros,
            message: result.message
          });

          // Sync Store Tracking
          if (reasons.includes('New day sleep sync after 05:00 AM')) {
            currentBioStore.recordSleepSync();
          }
          currentBioStore.recordKineticSync(healthData.active_energy_burned, healthData.workoutDurationMinutes);

          // Update Diary Profile Goals
          useDiaryStore.getState().updateProfile({
            targetCalories: result.target_calories,
            macros: result.adjusted_macros
          });
        }
      }

    } catch (error) {
      console.error("[BioEngine] Error syncing data:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, requestPermission]);

  return { syncBioData, isSyncing };
};

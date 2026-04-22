import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AIResponsePayload {
  requires_alert: boolean;
  target_calories: number;
  adjusted_macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  message: string;
}

interface BioState {
  // Hybrid Sync Threshold Tracking
  lastSleepSyncTimestamp: string | null; // YYYY-MM-DD
  lastSyncedEnergy: number; // kcal
  lastSyncedWorkoutDuration: number; // minutes

  // Current State Display
  aiStatus: AIResponsePayload | null;
  lastUpdated: string | null;

  // Actions
  recordSleepSync: () => void;
  recordKineticSync: (energyBurned: number, workoutDuration: number) => void;
  updateAIStatus: (status: AIResponsePayload) => void;
  resetBioState: () => void;
}

export const useBioStore = create<BioState>()(
  persist(
    (set) => ({
      lastSleepSyncTimestamp: null,
      lastSyncedEnergy: 0,
      lastSyncedWorkoutDuration: 0,
      
      aiStatus: null,
      lastUpdated: null,

      recordSleepSync: () => {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        set({ lastSleepSyncTimestamp: dateStr });
      },

      recordKineticSync: (energyBurned: number, workoutDuration: number) => {
        set({
          lastSyncedEnergy: energyBurned,
          lastSyncedWorkoutDuration: workoutDuration,
        });
      },

      updateAIStatus: (status: AIResponsePayload) => {
        set({
          aiStatus: status,
          lastUpdated: new Date().toISOString(),
        });
      },

      resetBioState: () => {
        set({
          lastSleepSyncTimestamp: null,
          lastSyncedEnergy: 0,
          lastSyncedWorkoutDuration: 0,
          aiStatus: null,
          lastUpdated: null,
        });
      },
    }),
    {
      name: 'balansi-bio-engine-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

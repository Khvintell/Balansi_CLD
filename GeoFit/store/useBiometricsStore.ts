import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BiometricStatus {
  targetCalories: number;
  adjustedMacros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  message: string;
  requiresAlert: boolean;
  updatedAt: string;
}

interface BiometricsState {
  lastSleepSyncDate: string | null; // YYYY-MM-DD
  biometricStatus: BiometricStatus | null;
  latestBiometrics: {
    steps: number;
    burned: number;
    sleepMinutes: number;
  } | null;
  
  setLastSleepSyncDate: (date: string) => void;
  setBiometricStatus: (status: BiometricStatus) => void;
  setLatestBiometrics: (data: { steps: number; burned: number; sleepMinutes: number }) => void;
  clearBiometrics: () => void;
}

export const useBiometricsStore = create<BiometricsState>()(
  persist(
    (set) => ({
      lastSleepSyncDate: null,
      biometricStatus: null,
      latestBiometrics: null,
      
      setLastSleepSyncDate: (date) => set({ lastSleepSyncDate: date }),
      setBiometricStatus: (status) => set({ biometricStatus: status }),
      setLatestBiometrics: (data) => set({ latestBiometrics: data }),
      clearBiometrics: () => set({ biometricStatus: null, lastSleepSyncDate: null, latestBiometrics: null }),
    }),
    {
      name: 'balansi-biometrics-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GoalType = 'lose' | 'maintain' | 'gain';

export interface UserProfile {
  name: string;
  age: number | null;
  height: number | null;
  weight: number | null;
  targetWeight: number | null;
  goal: GoalType;
  targetCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  isVerified: boolean;
}

export interface Meal {
  id?: string | number;
  name: string;
  calories: number;
  time?: string;
  source?: string;
  image_url?: string;
  recipe_id?: number | null;
}

export interface DailyIntake {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meals: Meal[];
}

interface DiaryState {
  profile: UserProfile | null;
  intake: Record<string, DailyIntake>; // Keyed by date string YYYY-MM-DD
  isPremium: boolean;
  aiScansUsed: number;
  setProfile: (profile: Partial<UserProfile>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addMeal: (date: string, meal: Meal, macros: {protein?: number, carbs?: number, fats?: number}) => void;
  resetDay: (date: string) => void;
  clearAll: () => void;
  setPremium: (status: boolean) => void;
  incrementAiScan: () => void;
}

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      profile: null,
      intake: {},
      isPremium: false,
      aiScansUsed: 0,
      setPremium: (status) => set({ isPremium: status }),
      incrementAiScan: () => set((state) => ({ aiScansUsed: state.aiScansUsed + 1 })),
      setProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } as UserProfile })),
      updateProfile: (updates) => set((state) => ({ 
        profile: state.profile ? { ...state.profile, ...updates } : (updates as UserProfile) 
      })),
      addMeal: (date, meal, macros) => {
        set((state) => {
          const dayIntake = state.intake[date] || { calories: 0, protein: 0, carbs: 0, fats: 0, meals: [] };
          return {
            intake: {
              ...state.intake,
              [date]: {
                calories: dayIntake.calories + (meal.calories || 0),
                protein: dayIntake.protein + (macros.protein || 0),
                carbs: dayIntake.carbs + (macros.carbs || 0),
                fats: dayIntake.fats + (macros.fats || 0),
                meals: [meal, ...dayIntake.meals]
              }
            }
          };
        });
      },
      resetDay: (date) => {
        set((state) => ({
          intake: {
            ...state.intake,
            [date]: { calories: 0, protein: 0, carbs: 0, fats: 0, meals: [] }
          }
        }));
      },
      clearAll: () => set({ profile: null, intake: {} }),
    }),
    {
      name: 'balansi-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ─── 🧬 BIO-AVATAR STATE MACHINE v2 — RPG INVENTORY ENGINE ──────────────────
// ციფრული ტყუპის სრული მდგომარეობის მენეჯერი
// Body morphing, time-based poses, streak accessories, equipment, smart mood
// ──────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BodyState = 'heavy' | 'normal' | 'athletic';
export type TimeState = 'morning' | 'day' | 'evening' | 'night';
export type StreakLevel = 0 | 1 | 2 | 3;
export type Mood = 'happy' | 'energetic' | 'sleepy' | 'food_coma' | 'thirsty' | 'proud' | 'zen';
export type ItemCategory = 'hair' | 'top' | 'bottom' | 'shoes' | 'accessory';

export interface EquippedItems {
  hair: string;
  top: string;
  bottom: string;
  shoes: string;
  accessory: string;
}

export interface AvatarItem {
  id: string;
  category: ItemCategory;
  name: string;
  emoji: string;
  requiredStreak: number;
  isPremiumOnly: boolean;
}

// ─── ITEMS DATABASE ──────────────────────────────────────────────────────────

export const ITEMS_DB: AvatarItem[] = [
  // ── Hair (expanded — defines the user's look) ──
  { id: 'hair_short',       category: 'hair', name: 'მოკლე',          emoji: '💇', requiredStreak: 0, isPremiumOnly: false },
  { id: 'hair_long',        category: 'hair', name: 'გრძელი',         emoji: '💇‍♀️', requiredStreak: 0, isPremiumOnly: false },
  { id: 'hair_buzz',        category: 'hair', name: 'ბაზი',           emoji: '🪒', requiredStreak: 0, isPremiumOnly: false },
  { id: 'hair_bald',        category: 'hair', name: 'მოპარსული',     emoji: '🧑‍🦲', requiredStreak: 0, isPremiumOnly: false },
  { id: 'hair_bob',         category: 'hair', name: 'ბობი',           emoji: '👩', requiredStreak: 3, isPremiumOnly: true },
  { id: 'hair_curly',       category: 'hair', name: 'ხუხული',        emoji: '🌀', requiredStreak: 3, isPremiumOnly: true },
  { id: 'hair_ponytail',    category: 'hair', name: 'ცხენის კუდი',  emoji: '👱‍♀️', requiredStreak: 3, isPremiumOnly: true },
  { id: 'hair_fade',        category: 'hair', name: 'ფეიდი',          emoji: '💈', requiredStreak: 5, isPremiumOnly: true },
  { id: 'hair_bun',         category: 'hair', name: 'პუჩი',           emoji: '🎀', requiredStreak: 5, isPremiumOnly: true },
  { id: 'hair_wavy',        category: 'hair', name: 'ტალღოვანი',     emoji: '🌊', requiredStreak: 5, isPremiumOnly: true },
  { id: 'hair_messy_curls',  category: 'hair', name: 'არეული ხუხუ',  emoji: '🧔', requiredStreak: 7, isPremiumOnly: true },
  { id: 'hair_mohawk',      category: 'hair', name: 'მოჰოკი',        emoji: '🦁', requiredStreak: 7, isPremiumOnly: true },

  // ── Tops ──
  { id: 'top_tshirt',  category: 'top', name: 'მაისური',     emoji: '👕', requiredStreak: 0, isPremiumOnly: false },
  { id: 'top_tank',    category: 'top', name: 'ტანკტოპი',    emoji: '🎽', requiredStreak: 0, isPremiumOnly: false },
  { id: 'top_hoodie',  category: 'top', name: 'ჰუდი',        emoji: '🧥', requiredStreak: 3, isPremiumOnly: true },
  { id: 'top_jacket',  category: 'top', name: 'ქურთუკი',     emoji: '🧥', requiredStreak: 5, isPremiumOnly: true },
  { id: 'top_jersey',  category: 'top', name: 'ჟერსი',       emoji: '⚽', requiredStreak: 7, isPremiumOnly: true },
  { id: 'top_golden',  category: 'top', name: 'ოქროს ჟილეტი', emoji: '✨', requiredStreak: 14, isPremiumOnly: true },

  // ── Bottoms ──
  { id: 'bottom_shorts',   category: 'bottom', name: 'შორტი',    emoji: '🩳', requiredStreak: 0, isPremiumOnly: false },
  { id: 'bottom_joggers',  category: 'bottom', name: 'ჯოგერი',   emoji: '👖', requiredStreak: 0, isPremiumOnly: false },
  { id: 'bottom_leggings', category: 'bottom', name: 'ლეგინსი',  emoji: '🦿', requiredStreak: 3, isPremiumOnly: true },

  // ── Shoes ──
  { id: 'shoes_sneakers', category: 'shoes', name: 'კედები',    emoji: '👟', requiredStreak: 0, isPremiumOnly: false },
  { id: 'shoes_running',  category: 'shoes', name: 'სარბენი',   emoji: '🏃', requiredStreak: 3, isPremiumOnly: true },
  { id: 'shoes_hightop',  category: 'shoes', name: 'ჰაიტოპი',   emoji: '🥾', requiredStreak: 5, isPremiumOnly: true },
  { id: 'shoes_golden',   category: 'shoes', name: 'ოქროს',     emoji: '👑', requiredStreak: 14, isPremiumOnly: true },

  // ── Accessories ──
  { id: 'acc_none',       category: 'accessory', name: 'არაფერი',      emoji: '❌', requiredStreak: 0, isPremiumOnly: false },
  { id: 'acc_headband',   category: 'accessory', name: 'ჰედბენდი',     emoji: '🏋️', requiredStreak: 3, isPremiumOnly: true },
  { id: 'acc_glasses',    category: 'accessory', name: 'სათვალე',      emoji: '🤓', requiredStreak: 5, isPremiumOnly: true },
  { id: 'acc_sunglasses', category: 'accessory', name: 'მზის სათვალე', emoji: '😎', requiredStreak: 7, isPremiumOnly: true },
  { id: 'acc_cap',        category: 'accessory', name: 'ქუდი',         emoji: '🧢', requiredStreak: 7, isPremiumOnly: true },
  { id: 'acc_crown',      category: 'accessory', name: 'გვირგვინი',    emoji: '👑', requiredStreak: 14, isPremiumOnly: true },
];

// ─── Item Colors ─────────────────────────────────────────────────────────────

export const ITEM_COLORS: Record<string, { primary: string; secondary?: string }> = {
  top_tshirt:  { primary: '#1DB954' },
  top_tank:    { primary: '#3B82F6' },
  top_hoodie:  { primary: '#6B7280', secondary: '#9CA3AF' },
  top_jacket:  { primary: '#1E293B', secondary: '#D4D4D8' },
  top_jersey:  { primary: '#EF4444', secondary: '#FFFFFF' },
  top_golden:  { primary: '#F59E0B', secondary: '#FDE68A' },

  bottom_shorts:   { primary: '#1E40AF' },
  bottom_joggers:  { primary: '#374151' },
  bottom_leggings: { primary: '#1F2937' },

  shoes_sneakers: { primary: '#FFFFFF', secondary: '#1DB954' },
  shoes_running:  { primary: '#3B82F6', secondary: '#F97316' },
  shoes_hightop:  { primary: '#1F2937', secondary: '#EF4444' },
  shoes_golden:   { primary: '#F59E0B', secondary: '#FDE68A' },

  hair_short:       { primary: '#92400E' },
  hair_long:        { primary: '#78350F' },
  hair_buzz:        { primary: '#57534E' },
  hair_bald:        { primary: '#FFDCB5' },
  hair_bob:         { primary: '#78350F' },
  hair_curly:       { primary: '#1F2937' },
  hair_ponytail:    { primary: '#92400E', secondary: '#B45309' },
  hair_fade:        { primary: '#44403C', secondary: '#78716C' },
  hair_bun:         { primary: '#92400E', secondary: '#B45309' },
  hair_wavy:        { primary: '#44403C' },
  hair_messy_curls: { primary: '#57534E' },
  hair_mohawk:      { primary: '#DC2626' },
};

// ─── Mood Configuration ──────────────────────────────────────────────────────

export const MOOD_CONFIGS: Record<Mood, {
  eyeRy: number;
  mouthPath: string;
  extras: ('sparkle' | 'sweat' | 'zzz')[];
}> = {
  happy:     { eyeRy: 11, mouthPath: 'M86,86 Q100,100 114,86',  extras: [] },
  energetic: { eyeRy: 12, mouthPath: 'M84,84 Q100,102 116,84',  extras: ['sparkle'] },
  sleepy:    { eyeRy: 1.5, mouthPath: 'M92,90 Q100,88 108,90',  extras: ['zzz'] },
  food_coma: { eyeRy: 5,  mouthPath: 'M88,85 Q100,98 112,85',   extras: ['sweat'] },
  thirsty:   { eyeRy: 9,  mouthPath: 'M90,92 Q100,86 110,92',   extras: ['sweat'] },
  proud:     { eyeRy: 10, mouthPath: 'M88,87 Q100,97 112,87',   extras: ['sparkle'] },
  zen:       { eyeRy: 7,  mouthPath: 'M90,88 Q100,95 110,88',   extras: [] },
};

// ─── Body Dimensions ─────────────────────────────────────────────────────────

export const BODY_DIMS = {
  heavy: {
    torsoRx: 52, torsoRy: 48,
    armRx: 14, armLeftCx: 42, armRightCx: 158,
    legW: 26, legLeftX: 75, legRightX: 99,
    shoeW: 30, shoeLeftX: 73, shoeRightX: 97,
  },
  normal: {
    torsoRx: 40, torsoRy: 42,
    armRx: 11, armLeftCx: 55, armRightCx: 145,
    legW: 20, legLeftX: 78, legRightX: 102,
    shoeW: 24, shoeLeftX: 76, shoeRightX: 100,
  },
  athletic: {
    torsoRx: 34, torsoRy: 38,
    armRx: 9, armLeftCx: 61, armRightCx: 139,
    legW: 17, legLeftX: 80, legRightX: 103,
    shoeW: 21, shoeLeftX: 78, shoeRightX: 101,
  },
};

// ─── Pure Derivation Functions ───────────────────────────────────────────────

const deriveBodyState = (
  bmi: number | null, weight: number, targetWeight: number, goal: string
): BodyState => {
  if (bmi !== null && bmi !== undefined && !isNaN(bmi)) {
    if (bmi < 18.5) return 'athletic';
    if (bmi < 25) return 'normal';
    return 'heavy';
  }
  const diff = weight - targetWeight;
  if (goal === 'lose') {
    if (diff > 10) return 'heavy';
    if (diff > 0) return 'normal';
    return 'athletic';
  }
  if (goal === 'gain') {
    if (diff < -10) return 'athletic';
    if (diff < 0) return 'normal';
    return 'heavy';
  }
  if (Math.abs(diff) <= 3) return 'normal';
  return diff > 0 ? 'heavy' : 'athletic';
};

const deriveTimeState = (): TimeState => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

const deriveStreakLevel = (streak: number): StreakLevel => {
  if (streak >= 14) return 3;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1;
  return 0;
};

const deriveMood = (
  consumed: number, target: number,
  water: number, waterTarget: number,
  timeState: TimeState, streak: number
): Mood => {
  if (consumed > target + 300) return 'food_coma';
  if (waterTarget > 0 && water < waterTarget * 0.3) return 'thirsty';
  if (streak >= 7 && timeState !== 'night') return 'proud';
  if (timeState === 'night') return 'sleepy';
  if (timeState === 'day') return 'energetic';
  if (timeState === 'evening') return 'zen';
  return 'happy';
};

// ─── Store Interface ─────────────────────────────────────────────────────────

interface AvatarState {
  bodyState: BodyState;
  timeState: TimeState;
  streakLevel: StreakLevel;
  mood: Mood;

  currentWeight: number;
  targetWeight: number;
  currentBMI: number | null;
  goal: 'lose' | 'maintain' | 'gain';
  streak: number;

  equippedItems: EquippedItems;

  syncFromProfile: (profile: {
    weight?: number | string;
    targetWeight?: number | string;
    bmi?: number | string | null;
    goal?: string;
    streak?: number;
  }) => void;
  computeTimeState: () => void;
  computeBodyState: () => void;
  computeStreakLevel: () => void;
  computeMood: (consumed: number, target: number, water: number, waterTarget: number) => void;
  equipItem: (category: string, itemId: string) => void;
  refreshAll: (profile: any) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAvatarStore = create<AvatarState>()(
  persist(
    (set, get) => ({
      bodyState: 'normal',
      timeState: deriveTimeState(),
      streakLevel: 0,
      mood: 'happy',

      currentWeight: 75,
      targetWeight: 70,
      currentBMI: null,
      goal: 'lose',
      streak: 0,

      equippedItems: {
        hair: 'hair_short',
        top: 'top_tshirt',
        bottom: 'bottom_shorts',
        shoes: 'shoes_sneakers',
        accessory: 'acc_none',
      },

      syncFromProfile: (profile) => {
        const weight = parseFloat(String(profile.weight)) || get().currentWeight;
        const target = parseFloat(String(profile.targetWeight)) || get().targetWeight;
        const bmi = profile.bmi ? parseFloat(String(profile.bmi)) : null;
        const goal = (['lose', 'maintain', 'gain'].includes(profile.goal || '')
          ? profile.goal
          : get().goal) as 'lose' | 'maintain' | 'gain';
        const streak = parseInt(String(profile.streak)) || 0;

        set({
          currentWeight: weight,
          targetWeight: target,
          currentBMI: bmi,
          goal,
          streak,
          bodyState: deriveBodyState(bmi, weight, target, goal),
          streakLevel: deriveStreakLevel(streak),
        });
      },

      computeTimeState: () => set({ timeState: deriveTimeState() }),

      computeBodyState: () => {
        const { currentBMI, currentWeight, targetWeight, goal } = get();
        set({ bodyState: deriveBodyState(currentBMI, currentWeight, targetWeight, goal) });
      },

      computeStreakLevel: () => set({ streakLevel: deriveStreakLevel(get().streak) }),

      computeMood: (consumed, target, water, waterTarget) => {
        const { timeState, streak } = get();
        set({ mood: deriveMood(consumed, target, water, waterTarget, timeState, streak) });
      },

      equipItem: (category, itemId) => {
        const item = ITEMS_DB.find((i) => i.id === itemId);
        if (!item) return;
        set((state) => ({
          equippedItems: { ...state.equippedItems, [category]: itemId },
        }));
      },

      refreshAll: (profile) => {
        const state = get();
        state.syncFromProfile(profile);
        state.computeTimeState();
      },
    }),
    {
      name: 'balansi-avatar-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bodyState: state.bodyState,
        streakLevel: state.streakLevel,
        mood: state.mood,
        currentWeight: state.currentWeight,
        targetWeight: state.targetWeight,
        currentBMI: state.currentBMI,
        goal: state.goal,
        streak: state.streak,
        equippedItems: state.equippedItems,
      }),
    }
  )
);

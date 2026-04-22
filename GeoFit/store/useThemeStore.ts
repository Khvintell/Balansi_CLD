import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeId, THEMES } from '../config/theme';

interface ThemeState {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  initializeTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeId: 'standard', // Default
  
  setTheme: async (id: ThemeId) => {
    set({ themeId: id });
    try {
      await AsyncStorage.setItem('balansi_active_theme', id);
    } catch (e) {
      console.error('Failed to save theme setting', e);
    }
  },

  initializeTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem('balansi_active_theme');
      if (stored && (stored === 'standard' || stored === 'executive_gold' || stored === 'obsidian_dark')) {
        set({ themeId: stored as ThemeId });
      }
    } catch (e) {
      console.error('Failed to load theme setting', e);
    }
  }
}));

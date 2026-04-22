import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// ─── 🎨 DYNAMIC THEME SYSTEM ───
export const LightTheme = {
  primary:      '#1DB954', primaryDark:  '#15803D', primaryLight: '#E8FAF0', primaryBorder:'#A7F3C0',
  blue:         '#3B82F6', blueLight: '#EFF6FF', blueBorder: '#BFDBFE',
  orange:       '#F97316', orangeLight: '#FFF7ED', orangeBorder: '#FED7AA',
  purple:       '#8B5CF6', purpleLight: '#F5F3FF', purpleBorder: '#DDD6FE',
  red:          '#EF4444', redLight: '#FEF2F2', redBorder: '#FECACA',
  gold:         '#F59E0B', goldLight: 'rgba(245, 158, 11, 0.15)', goldBorder: '#FDE68A',
  teal:         '#14B8A6', tealLight: '#F0FDFA',
  ink:          '#0D1117', inkMid: '#334155', inkLight: '#64748B', inkFaint: '#94A3B8',
  surface:      '#FFFFFF', surfaceMid: '#F1F5F9',
  bg:           '#F0F4F8', border: '#E2E8F0', borderLight: '#F1F5F9',
  glass:        'rgba(255, 255, 255, 0.15)', glassBorder: 'rgba(255, 255, 255, 0.25)',
  darkGlass:    'rgba(15, 23, 42, 0.85)',
  proBg:        '#124B3E', proBox: '#0E3B30', proBorder: '#059669', proText: '#D1FAE5',
  r_full: 100,
  fontFamily:   Platform.OS === 'ios' ? 'System' : 'sans-serif',
};

export const ProTheme = {
  primary:      '#059669', primaryDark:  '#047857', primaryLight: 'rgba(5, 150, 105, 0.15)', primaryBorder:'rgba(5, 150, 105, 0.3)',
  blue:         '#60A5FA', blueLight: 'rgba(59, 130, 246, 0.15)', blueBorder: 'rgba(59, 130, 246, 0.3)',
  orange:       '#F59E0B', orangeLight: 'rgba(245, 158, 11, 0.15)', orangeBorder: 'rgba(245, 158, 11, 0.3)',
  purple:       '#A78BFA', purpleLight: 'rgba(167, 139, 250, 0.15)', purpleBorder: 'rgba(167, 139, 250, 0.3)',
  red:          '#F87171', redLight: 'rgba(239, 68, 68, 0.15)', redBorder: 'rgba(239, 68, 68, 0.3)',
  gold:         '#FCD34D', goldLight: 'rgba(252, 211, 77, 0.15)', goldBorder: 'rgba(252, 211, 77, 0.3)',
  teal:         '#2DD4BF', tealLight: 'rgba(45, 212, 191, 0.15)',
  ink:          '#FFFFFF', inkMid: '#D1FAE5', inkLight: '#A7F3D0', inkFaint: '#6EE7B7',
  surface:      '#124B3E', surfaceMid:   '#0E3B30', 
  bg:           '#06241D', border:       'rgba(255,255,255,0.1)', borderLight: 'rgba(255,255,255,0.05)', 
  glass:        'rgba(0, 0, 0, 0.25)', glassBorder: 'rgba(255, 255, 255, 0.1)',
  darkGlass:    'rgba(2, 6, 23, 0.9)',
  proBg:        '#124B3E', proBox: '#0E3B30', proBorder: '#059669', proText: '#D1FAE5',
  r_full: 100,
  fontFamily:   Platform.OS === 'ios' ? 'System' : 'sans-serif',
};

// ─── CONTEXT SETUP ───
type ThemeContextType = {
  T: typeof LightTheme;
  isPro: boolean;
  isProThemeEnabled: boolean;
  enablePro: () => Promise<void>;
  toggleProMode: (val: boolean) => Promise<void>;
  toggleThemeOnly: (val: boolean) => Promise<void>;
  refreshThemeState: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isPro, setIsPro] = useState(false);
  const [isProThemeEnabled, setIsProThemeEnabled] = useState(false);

  const refreshThemeState = async () => {
    try {
      const pStr = await AsyncStorage.getItem('userProfile');
      if (pStr) {
        const p = JSON.parse(pStr);
        setIsPro(p.isPro || false);
        setIsProThemeEnabled(p.isProThemeEnabled || false);
      }
    } catch (error) {
      console.error('Theme fetch error:', error);
    }
  };

  useEffect(() => {
    refreshThemeState();
  }, []);

  const enablePro = async () => {
    try {
      const pStr = await AsyncStorage.getItem('userProfile');
      if (pStr) {
        const p = JSON.parse(pStr);
        p.isPro = true;
        p.isProThemeEnabled = true; // გააქტიურებისას თემაც ირთვება
        await AsyncStorage.setItem('userProfile', JSON.stringify(p));
        setIsPro(true);
        setIsProThemeEnabled(true);
      }
    } catch (e) {}
  };

  const toggleProMode = async (value: boolean) => {
    setIsPro(value);
    if (!value) setIsProThemeEnabled(false);
    try {
      const pStr = await AsyncStorage.getItem('userProfile');
      if (pStr) {
        const p = JSON.parse(pStr);
        p.isPro = value;
        if (!value) p.isProThemeEnabled = false;
        await AsyncStorage.setItem('userProfile', JSON.stringify(p));
        if (value && Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {}
  };

  const toggleThemeOnly = async (value: boolean) => {
    setIsProThemeEnabled(value);
    try {
      const pStr = await AsyncStorage.getItem('userProfile');
      if (pStr) {
        const p = JSON.parse(pStr);
        p.isProThemeEnabled = value;
        await AsyncStorage.setItem('userProfile', JSON.stringify(p));
        if (value && Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {}
  };

  // დინამიური ობიექტი
  const T = isProThemeEnabled ? ProTheme : LightTheme;

  return (
    <ThemeContext.Provider value={{ T, isPro, isProThemeEnabled, enablePro, toggleProMode, toggleThemeOnly, refreshThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
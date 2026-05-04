export type ThemeId = 'standard' | 'executive_gold' | 'obsidian_dark';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryBorder: string;
  primaryGlow: string;
  
  blue: string;
  blueLight: string;
  blueBorder: string;
  
  orange: string;
  orangeLight: string;
  orangeBorder: string;
  
  purple: string;
  purpleLight: string;
  purpleBorder: string;
  
  red: string;
  redLight: string;
  redBorder: string;
  
  gold: string;
  goldLight: string;
  goldBorder: string;
  
  teal: string;
  tealLight: string;

  ink: string;
  inkMid: string;
  inkLight: string;
  inkFaint: string;

  surface: string;
  surfaceMid: string;
  surfaceAlt: string;
  card: string; // Alias for surface
  
  bg: string;
  border: string;
  borderLight: string;

  glass: string;
  glassBorder: string;
  darkGlass: string;
  glassWhite: string;

  // Paywall / Elite specific
  proBg: string;
  proBox: string;
  proBorder: string;
  proText: string;
  
  // Semantic extra
  success: string;
  successGlow: string;
  danger: string;
  dangerGlow: string;
  dangerBg: string;
  warning: string;
  warningGlow: string;
  warningBg: string;
  info: string;
  infoGlow: string;
  infoBg: string;

  // Specific color lookups
  emerald: string;
  emeraldGlow: string;
  onyx: string;
  snow: string;
  mist: string;
  slate: string;
  fog: string;
  ghost: string;
  graphite: string;
  fontFamily: string;

  // Granular Spacing/Font/Radius
  f10: number; f11: number; f12: number; f13: number; f14: number; f15: number; f17: number; f20: number; f22: number; f26: number; f32: number;
  s4: number; s6: number; s8: number; s10: number; s12: number; s16: number; s20: number; s24: number; s28: number; s32: number;
  r8: number; r10: number; r12: number; r16: number; r20: number; r24: number; r32: number; rFull: number;
  r_full: number;
}

const COMMON_UNITS = {
  f10:10, f11:11, f12:12, f13:13, f14:14, f15:15, f17:17, f20:20, f22:22, f26:26, f32:32,
  s4:4, s6:6, s8:8, s10:10, s12:12, s16:16, s20:20, s24:24, s28:28, s32:32,
  r8:8, r10:10, r12:12, r16:16, r20:20, r24:24, r32:32, rFull:999,
  r_full: 100,
};

export const THEMES: Record<ThemeId, ThemeColors> = {
  standard: {
    ...COMMON_UNITS,
    primary: '#1DB954', primaryDark: '#15803D', primaryLight: '#E8FAF0', primaryBorder:'#A7F3C0', primaryGlow: 'rgba(29,185,84,0.18)',
    blue: '#3B82F6', blueLight: '#EFF6FF', blueBorder: '#BFDBFE',
    orange: '#F97316', orangeLight: '#FFF7ED', orangeBorder: '#FED7AA',
    purple: '#8B5CF6', purpleLight: '#F5F3FF', purpleBorder: '#DDD6FE',
    red: '#EF4444', redLight: '#FEF2F2', redBorder: '#FECACA',
    gold: '#F59E0B', goldLight: 'rgba(245, 158, 11, 0.15)', goldBorder: '#FDE68A',
    teal: '#14B8A6', tealLight: '#F0FDFA',
    ink: '#0D1117', inkMid: '#334155', inkLight: '#64748B', inkFaint: '#94A3B8',
    surface: '#FFFFFF', surfaceMid: '#F1F5F9', surfaceAlt: '#F8FAFC', card: '#FFFFFF',
    bg: '#F8FAFC', border: '#E2E8F0', borderLight: '#F1F5F9',
    glass: 'rgba(255, 255, 255, 0.7)', glassBorder: 'rgba(255, 255, 255, 0.5)',
    darkGlass: 'rgba(15, 23, 42, 0.85)', glassWhite: 'rgba(255,255,255,0.96)',
    proBg: '#124B3E', proBox: '#0E3B30', proBorder: '#059669', proText: '#D1FAE5',
    
    success: '#27AE60', successGlow: 'rgba(39,174,96,0.12)',
    danger: '#EF4444', dangerGlow: 'rgba(255,71,87,0.12)', dangerBg: '#FEF2F2',
    warning: '#F59E0B', warningGlow: 'rgba(255,165,2,0.12)', warningBg: '#FFFBEB',
    info: '#3B82F6', infoGlow: 'rgba(79,195,247,0.12)', infoBg: '#EFF6FF',

    emerald: '#1DB954', emeraldGlow: 'rgba(29,185,84,0.13)',
    onyx: '#0D1117', snow: '#FFFFFF', mist: '#7A8C82', slate: '#364039',
    fog: '#B0C4B8', ghost: '#E4EDE7', graphite: '#1E2922',
    fontFamily: 'System',
  },
  
  executive_gold: {
    ...COMMON_UNITS,
    primary: '#F59E0B', primaryDark: '#D97706', primaryLight: 'rgba(245, 158, 11, 0.15)', primaryBorder:'rgba(245, 158, 11, 0.3)', primaryGlow: 'rgba(245,158,11,0.18)',
    blue: '#3B82F6', blueLight: 'rgba(59, 130, 246, 0.15)', blueBorder: 'rgba(59, 130, 246, 0.3)',
    orange: '#F97316', orangeLight: 'rgba(249, 115, 22, 0.15)', orangeBorder: 'rgba(249, 115, 22, 0.3)',
    purple: '#8B5CF6', purpleLight: 'rgba(139, 92, 246, 0.15)', purpleBorder: 'rgba(139, 92, 246, 0.3)',
    red: '#EF4444', redLight: 'rgba(239, 68, 68, 0.15)', redBorder: 'rgba(239, 68, 68, 0.3)',
    gold: '#FBBF24', goldLight: 'rgba(251, 191, 36, 0.15)', goldBorder: 'rgba(251, 191, 36, 0.4)',
    teal: '#14B8A6', tealLight: 'rgba(20, 184, 166, 0.15)',
    ink: '#F8FAFC', inkMid: '#CBD5E1', inkLight: '#94A3B8', inkFaint: '#475569',
    surface: '#0F2922', surfaceMid: '#12332A', surfaceAlt: '#081713', card: '#0F2922',
    bg: '#081713', border: '#1C453A', borderLight: '#14332A',
    glass: 'rgba(15, 41, 34, 0.8)', glassBorder: 'rgba(245, 158, 11, 0.3)',
    darkGlass: 'rgba(8, 23, 19, 0.95)', glassWhite: 'rgba(15,41,34,0.96)',
    proBg: '#124B3E', proBox: '#0E3B30', proBorder: '#059669', proText: '#D1FAE5',

    success: '#F59E0B', successGlow: 'rgba(245,158,11,0.12)',
    danger: '#EF4444', dangerGlow: 'rgba(239,68,68,0.12)', dangerBg: 'rgba(239,68,68,0.08)',
    warning: '#FBBF24', warningGlow: 'rgba(251,191,36,0.12)', warningBg: 'rgba(251,191,36,0.08)',
    info: '#3B82F6', infoGlow: 'rgba(59,130,246,0.12)', infoBg: 'rgba(59,130,246,0.08)',

    emerald: '#F59E0B', emeraldGlow: 'rgba(245,158,11,0.13)',
    onyx: '#081713', snow: '#F8FAFC', mist: '#94A3B8', slate: '#CBD5E1',
    fog: '#475569', ghost: '#12332A', graphite: '#F8FAFC',
    fontFamily: 'System',
  },

  obsidian_dark: {
    ...COMMON_UNITS,
    primary: '#1DB954', primaryDark: '#1ED760', primaryLight: 'rgba(29, 185, 84, 0.15)', primaryBorder:'rgba(29, 185, 84, 0.3)', primaryGlow: 'rgba(29,185,84,0.18)',
    blue: '#60A5FA', blueLight: 'rgba(96, 165, 250, 0.15)', blueBorder: 'rgba(96, 165, 250, 0.3)',
    orange: '#FB923C', orangeLight: 'rgba(251, 146, 60, 0.15)', orangeBorder: 'rgba(251, 146, 60, 0.3)',
    purple: '#A78BFA', purpleLight: 'rgba(167, 139, 250, 0.15)', purpleBorder: 'rgba(167, 139, 250, 0.3)',
    red: '#F87171', redLight: 'rgba(248, 113, 113, 0.15)', redBorder: 'rgba(248, 113, 113, 0.3)',
    gold: '#FCD34D', goldLight: 'rgba(252, 211, 77, 0.15)', goldBorder: 'rgba(252, 211, 77, 0.3)',
    teal: '#2DD4BF', tealLight: 'rgba(45, 212, 191, 0.15)',
    ink: '#F9FAFB', inkMid: '#D1D5DB', inkLight: '#9CA3AF', inkFaint: '#4B5563',
    surface: '#121212', surfaceMid: '#1C1C1C', surfaceAlt: '#000000', card: '#121212',
    bg: '#000000', border: '#2C2C2E', borderLight: '#1C1C1C',
    glass: 'rgba(18, 18, 18, 0.85)', glassBorder: 'rgba(255, 255, 255, 0.1)',
    darkGlass: 'rgba(0, 0, 0, 0.9)', glassWhite: 'rgba(18,18,18,0.96)',
    proBg: '#18181B', proBox: '#27272A', proBorder: '#3F3F46', proText: '#A1A1AA',

    success: '#1DB954', successGlow: 'rgba(29,185,84,0.12)',
    danger: '#F87171', dangerGlow: 'rgba(248,113,113,0.12)', dangerBg: 'rgba(248,113,113,0.08)',
    warning: '#FCD34D', warningGlow: 'rgba(252,211,77,0.12)', warningBg: 'rgba(252,211,77,0.08)',
    info: '#60A5FA', infoGlow: 'rgba(96,165,250,0.12)', infoBg: 'rgba(96,165,250,0.08)',

    emerald: '#1DB954', emeraldGlow: 'rgba(29,185,84,0.13)',
    onyx: '#09090B', snow: '#F9FAFB', mist: '#9CA3AF', slate: '#D1D5DB',
    fog: '#4B5563', ghost: '#27272A', graphite: '#F9FAFB',
    fontFamily: 'System',
  }
};

export const getColors = (id: ThemeId): ThemeColors => THEMES[id] || THEMES.standard;

export const THEME_NAMES: Record<ThemeId, { name: string, desc: string, isPremium: boolean, iconColor: string }> = {
  standard: { name: 'ნათელი', desc: 'კლასიკური ნათელი სტილი', isPremium: false, iconColor: '#1DB954' },
  executive_gold: { name: 'პრემიუმ სტილი', desc: 'ექსკლუზიური მუქი მწვანე', isPremium: true, iconColor: '#F59E0B' },
  obsidian_dark: { name: 'მუქი რეჟიმი', desc: 'კლასიკური მუქი ინტერფეისი', isPremium: true, iconColor: '#E4E4E7' }
};

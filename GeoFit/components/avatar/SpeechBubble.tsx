// ─── 💬 EMPATHETIC SPEECH BUBBLE — AUTO-SIZING, CLEAN GLOW ──────────────────
// Horizontal layout with left-pointing tail toward avatar
// FIXED: No more green/black shading — uses clean rgba() colors
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useCallback, useEffect, memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MessageCircle, Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAvatarStore, type Mood } from '../../store/useAvatarStore';

// ─── Mood-triggered override messages (Georgian) ─────────────────────────────
const MOOD_OVERRIDES: Partial<Record<Mood, string[]>> = {
  food_coma: [
    'ცოტა ზედმეტი მოგვივიდა, მაგრამ ხვალ დავაბალანსებთ! 😅',
    'მუცელი სავსეა! ხვალ ვვარჯიშობთ? 💪',
    'არა უშავს, ყველა დღე ახალი დასაწყისია! ✨',
  ],
  thirsty: [
    'წყალი დამილიე! ძალიან მწყურია 💧',
    'ჰიდრატაცია გვჭირდება! ერთი ჭიქა მაინც 🥤',
    'ჩემი კანი ცოტა გახმა... წყალი? 😰',
  ],
  proud: [
    'რა კარგი სთრიქი გვაქვს! ჩემპიონი ხარ! 🏆',
    'ვამაყობ შენით! გავაგრძელოთ ეგრე 🔥',
    'ხომ ხედავ? თანმიმდევრულობა = შედეგი! 💎',
  ],
  sleepy: [
    'ძილი მჭირდება... ტკბილ ძილს გისურვებ! 🌙',
    'ძალიან მძინავს... ხვალ ვნახავთ ერთმანეთს 💤',
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Safely create rgba from hex to avoid green/black shade artifacts
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

interface SpeechBubbleProps {
  tips: string[];
  C: any;
  onBubbleTap?: () => void;
}

function SpeechBubbleInner({ tips, C, onBubbleTap }: SpeechBubbleProps) {
  const { mood } = useAvatarStore();
  const [currentTip, setCurrentTip] = useState(tips[Math.floor(Math.random() * tips.length)]);
  const [isOverride, setIsOverride] = useState(false);

  useEffect(() => {
    const overrides = MOOD_OVERRIDES[mood];
    if (overrides && overrides.length > 0) {
      setCurrentTip(overrides[Math.floor(Math.random() * overrides.length)]);
      setIsOverride(true);
    } else {
      setIsOverride(false);
    }
  }, [mood]);

  const cycleTip = useCallback(() => {
    Haptics.selectionAsync();
    onBubbleTap?.();
    if (isOverride) {
      setIsOverride(false);
      setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
      return;
    }
    let next = currentTip;
    let attempts = 0;
    while (next === currentTip && attempts < 10) {
      next = tips[Math.floor(Math.random() * tips.length)];
      attempts++;
    }
    setCurrentTip(next);
  }, [tips, currentTip, isOverride, onBubbleTap]);

  // ─── Clean colors via rgba (no hex+hex concatenation) ───
  const colors = useMemo(() => {
    if (isOverride && mood === 'food_coma') {
      return { bg: 'rgba(239,68,68,0.05)', border: 'rgba(239,68,68,0.12)', glow: '#EF4444', icon: '#EF4444' };
    }
    if (isOverride && mood === 'thirsty') {
      return { bg: 'rgba(59,130,246,0.05)', border: 'rgba(59,130,246,0.12)', glow: '#3B82F6', icon: '#3B82F6' };
    }
    return {
      bg: hexToRgba(C.primary, 0.04),
      border: hexToRgba(C.primary, 0.1),
      glow: C.primary,
      icon: C.primary,
    };
  }, [isOverride, mood, C.primary]);

  return (
    <TouchableOpacity onPress={cycleTip} activeOpacity={0.85} style={s.container}>
      {/* Left-pointing tail */}
      <View style={s.pointerLeft}>
        <View style={[s.pointerTriangle, { borderRightColor: colors.bg }]} />
      </View>

      {/* Bubble with clean glow */}
      <View style={[s.bubble, {
        backgroundColor: colors.bg,
        borderColor: colors.border,
        shadowColor: colors.glow,
      }]}>
        <View style={s.row}>
          <View style={[s.iconWrap, { backgroundColor: hexToRgba(colors.icon, 0.1) }]}>
            <Heart size={11} color={colors.icon} fill={colors.icon} />
          </View>
          <Text style={[s.text, { color: C.ink, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif' }]}>
            {currentTip}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const SpeechBubble = memo(SpeechBubbleInner);
export default SpeechBubble;

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pointerLeft: {
    justifyContent: 'center',
    marginRight: -1,
    marginTop: 14,
  },
  pointerTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 9,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  bubble: {
    flex: 1,
    flexShrink: 1,
    borderRadius: 18,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderWidth: 1,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  text: {
    flex: 1,
    flexShrink: 1,
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 17,
  },
});

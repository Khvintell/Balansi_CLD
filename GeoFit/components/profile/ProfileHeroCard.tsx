import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, Pressable, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Crown, Share2, Flame, Droplets, Ruler, Scale,
  Target, ChevronRight, Sparkles,
} from 'lucide-react-native';

/**
 * 🎯 PROFILE HERO CARD — PREMIUM REDESIGN
 * -----------------------------------------------------------
 * • Avatar-ის ირგვლივ rotating gradient ring
 * • Corner streak badge (tap → modal)
 * • PRO crown badge (თუ isPro)
 * • 3 glassmorphism pills: ასაკი / სიმაღლე / წონა
 * • Goal chip + Level/XP progress
 */

interface Props {
  profile: any;
  isPro: boolean;
  level: number;
  totalXP: number;
  bmiInfo: { label: string; color: string } | any;
  heroScale: Animated.Value;
  C: any;
  S: any; // legacy — გადმოცემისთვის compat, ამ კომპონენტში აღარ გამოიყენება
  onAvatarPress: () => void;
  onSharePress: () => void;
  onStreakPress?: () => void;
}

export const ProfileHeroCard: React.FC<Props> = ({
  profile, isPro, level, totalXP, bmiInfo,
  heroScale, C, onAvatarPress, onSharePress, onStreakPress,
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const streakPulse = useRef(new Animated.Value(1)).current;

  // Rotating gradient ring (conic-style via rotating linear gradient layers)
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    ).start();
  }, []);

  // Streak badge pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(streakPulse, { toValue: 1.08, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(streakPulse, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== 'web' }),
      ])
    ).start();
  }, []);

  // Entrance
  useEffect(() => {
    Animated.spring(heroScale, { toValue: 1, useNativeDriver: Platform.OS !== 'web', friction: 7 }).start();
  }, []);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const streak = profile?.streak || 0;
  const age = profile?.age || '—';
  const height = profile?.height || '—';
  const weight = profile?.weight || '—';
  const name = profile?.name || 'მომხმარებელი';

  // Goal mapping
  const goalMap: { [k: string]: { label: string; color: string } } = {
    lose: { label: 'დაკლება', color: C.primary || '#10B981' },
    gain: { label: 'მომატება', color: C.red || '#EF4444' },
    maintain: { label: 'შენარჩუნება', color: C.orange || '#F59E0B' },
  };
  const goal = goalMap[profile?.goal] || goalMap.maintain;

  // XP bar
  const xpInLevel = totalXP % 100;
  const xpProgress = Math.min(xpInLevel / 100, 1);

  // Gradient ring colors
  const ringColors = isPro
    ? ['#FFD700', '#FFA500', '#FF6B6B', '#FFD700']
    : [C.primary || '#10B981', C.primaryDark || '#059669', C.teal || '#14B8A6', C.primary || '#10B981'];

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: heroScale }] }]}>
      {/* ─── BACKGROUND GRADIENT ─── */}
      <LinearGradient
        colors={[
          (C.surface || '#FFFFFF'),
          (C.bg || '#FAFAFA'),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bgGradient}
      />

      {/* ─── TOP ROW: SHARE BUTTON ─── */}
      <View style={styles.topRow}>
        {isPro && (
          <View style={[styles.proTag, { backgroundColor: (C.gold || '#FFB800') + '20' }]}>
            <Crown size={11} color={C.gold || '#FFB800'} fill={C.gold || '#FFB800'} />
            <Text style={[styles.proTagTxt, { color: C.gold || '#FFB800' }]}>PRO</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: (C.surfaceMid || '#F1F5F9') }]}
          onPress={onSharePress}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Share2 size={16} color={C.inkMid || '#64748B'} />
        </TouchableOpacity>
      </View>

      {/* ─── AVATAR SECTION ─── */}
      <View style={styles.avatarSection}>
        {/* Rotating gradient ring */}
        <Animated.View
          style={[
            styles.ringOuter,
            { transform: [{ rotate: rotation }] },
          ]}
        >
          <LinearGradient
            colors={ringColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ringGradient}
          />
        </Animated.View>

        {/* Inner white padding */}
        <View style={[styles.ringInner, { backgroundColor: C.bg || '#FAFAFA' }]} />

        {/* Avatar */}
        <TouchableOpacity
          style={[styles.avatarTouch, { backgroundColor: C.surface || '#FFF' }]}
          onPress={onAvatarPress}
          activeOpacity={0.85}
        >
          <Text style={styles.avatarEmoji}>{profile?.avatar || '🧔🏻♂️'}</Text>
        </TouchableOpacity>

        {/* Corner Streak Badge */}
        <Animated.View
          style={[
            styles.streakBadgeWrap,
            { transform: [{ scale: streakPulse }] },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onStreakPress}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <LinearGradient
              colors={['#FF6B35', '#F7931E']}
              style={styles.streakBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Flame size={11} color="#FFF" fill="#FFF" />
              <Text style={styles.streakBadgeTxt}>{streak}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Level Badge (top-left of avatar) */}
        <View style={[styles.levelBadge, { backgroundColor: C.primary || '#10B981' }]}>
          <Sparkles size={9} color="#FFF" fill="#FFF" />
          <Text style={styles.levelBadgeTxt}>Lv.{level}</Text>
        </View>
      </View>

      {/* ─── NAME + GOAL CHIP ─── */}
      <Text style={[styles.name, { color: C.ink || '#0F172A' }]} numberOfLines={1}>
        {name}
      </Text>

      <View style={styles.goalChipRow}>
        <View style={[styles.goalChip, { backgroundColor: goal.color + '15', borderColor: goal.color + '30' }]}>
          <Target size={11} color={goal.color} />
          <Text style={[styles.goalChipTxt, { color: goal.color }]}>მიზანი: {goal.label}</Text>
        </View>
        {bmiInfo?.label && (
          <View style={[styles.goalChip, { backgroundColor: (bmiInfo.color || C.teal) + '15', borderColor: (bmiInfo.color || C.teal) + '30' }]}>
            <Text style={[styles.goalChipTxt, { color: bmiInfo.color || C.teal }]}>BMI: {bmiInfo.label}</Text>
          </View>
        )}
      </View>

      {/* ─── 3 STATS PILLS ─── */}
      <View style={styles.pillsRow}>
        <StatPill
          icon={<Droplets size={14} color={C.teal || '#14B8A6'} />}
          value={age}
          label="წლის"
          color={C.teal || '#14B8A6'}
          C={C}
        />
        <StatPill
          icon={<Ruler size={14} color={C.purple || '#A855F7'} />}
          value={height}
          label="სმ"
          color={C.purple || '#A855F7'}
          C={C}
        />
        <StatPill
          icon={<Scale size={14} color={C.orange || '#F59E0B'} />}
          value={weight}
          label="კგ"
          color={C.orange || '#F59E0B'}
          C={C}
        />
      </View>

      {/* ─── LEVEL / XP BAR ─── */}
      <View style={styles.xpSection}>
        <View style={styles.xpTopRow}>
          <Text style={[styles.xpLabel, { color: C.inkMid || '#64748B' }]}>
            XP პროგრესი
          </Text>
          <Text style={[styles.xpValue, { color: C.ink || '#0F172A' }]}>
            {xpInLevel} / 100
          </Text>
        </View>
        <View style={[styles.xpTrack, { backgroundColor: (C.surfaceMid || '#E2E8F0') }]}>
          <LinearGradient
            colors={[C.primary || '#10B981', C.primaryDark || '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.xpFill, { width: `${xpProgress * 100}%` }]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

// ─── STAT PILL (sub-component) ────────────────────────────────────────────────
const StatPill: React.FC<{
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  C: any;
}> = ({ icon, value, label, color, C }) => (
  <View style={[pillStyles.wrap, { backgroundColor: (C.surface || '#FFF'), borderColor: color + '20' }]}>
    <View style={[pillStyles.iconBg, { backgroundColor: color + '15' }]}>{icon}</View>
    <View style={pillStyles.textWrap}>
      <Text style={[pillStyles.value, { color: C.ink || '#0F172A' }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[pillStyles.label, { color: C.inkLight || '#94A3B8' }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  </View>
);

// ─── STYLES ───────────────────────────────────────────────────────────────────
const AVATAR_SIZE = 96;
const RING_SIZE = AVATAR_SIZE + 12;
const RING_INNER_SIZE = AVATAR_SIZE + 6;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    overflow: 'hidden',
  },
 AuroraGradient: { // keeping it simple
    ...StyleSheet.absoluteFillObject,
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    minHeight: 32,
  },
  proTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  proTagTxt: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  shareBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSection: {
    alignSelf: 'center',
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  ringOuter: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    overflow: 'hidden',
  },
  ringGradient: {
    width: '100%',
    height: '100%',
  },
  ringInner: {
    position: 'absolute',
    width: RING_INNER_SIZE,
    height: RING_INNER_SIZE,
    borderRadius: RING_INNER_SIZE / 2,
  },
  avatarTouch: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  avatarEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  streakBadgeWrap: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    shadowColor: '#FF6B35',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFF',
    minWidth: 42,
    justifyContent: 'center',
  },
  streakBadgeTxt: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.2,
  },
  levelBadge: {
    position: 'absolute',
    top: -2,
    left: -2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  levelBadgeTxt: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  goalChipRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  goalChipTxt: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  xpSection: {
    marginTop: 4,
  },
  xpTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  xpLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xpValue: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  xpTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 3,
  },
});

const pillStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  iconBg: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 18,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 1,
  },
});

export default ProfileHeroCard;

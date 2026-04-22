// ─── 🚀 PRO SHARE CARD — VIRAL INSTAGRAM STORY GENERATOR ────────────────────
// პრო მომხმარებლის ექსკლუზიური გაზიარების ბარათი
// Captures at 9:16 ratio for Instagram Stories via react-native-view-shot
// ──────────────────────────────────────────────────────────────────────────────

import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Crown, Zap, Star } from 'lucide-react-native';
import BioAvatarSVG from './BioAvatarSVG';

import type { BodyState, TimeState, StreakLevel } from '../../store/useAvatarStore';

interface ProShareCardProps {
  bodyState: BodyState;
  timeState: TimeState;
  streakLevel: StreakLevel;
  C: any; // ThemeColors
  userName: string;
  weight: number;
  streak: number;
  level: number;
  totalXP: number;
}

const ProShareCard = forwardRef<View, ProShareCardProps>(
  ({ bodyState, timeState, streakLevel, C, userName, weight, streak, level, totalXP }, ref) => {

    const streakLabel = streakLevel === 3
      ? '👑 ლეგენდარული'
      : streakLevel === 2
        ? '🥇 ოქროს'
        : streakLevel === 1
          ? '🏋️ აქტიური'
          : '🌱 დამწყები';

    return (
      <View ref={ref} collapsable={false} style={ps.container}>
        <LinearGradient
          colors={['#0A3A2E', '#06241D', '#041A14']}
          style={ps.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* ── Decorative Glow Orbs ── */}
          <View style={[ps.glowOrb, { top: 40, left: -30, backgroundColor: C.primary }]} />
          <View style={[ps.glowOrb, { bottom: 80, right: -40, backgroundColor: C.gold || '#F59E0B', opacity: 0.06 }]} />

          {/* ── Top Badge ── */}
          <View style={ps.topBadge}>
            <Star size={12} color={C.gold || '#F59E0B'} fill={C.gold || '#F59E0B'} />
            <Text style={ps.topBadgeText}>BALANSI PRO</Text>
          </View>

          {/* ── Avatar Section ── */}
          <View style={ps.avatarSection}>
            <View style={ps.avatarGlow}>
              <BioAvatarSVG
                bodyState={bodyState}
                timeState={timeState}
                streakLevel={streakLevel}
                C={C}
                size={140}
              />
            </View>
          </View>

          {/* ── Main Copy ── */}
          <Text style={ps.headline}>
            ჩემმა ციფრულმა ტყუპმა{'\n'}ახალი ლეველი გახსნა! 🚀
          </Text>

          {/* ── Stats Row ── */}
          <View style={ps.statsRow}>
            <View style={ps.statItem}>
              <View style={[ps.statIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                <Flame size={16} color="#EF4444" />
              </View>
              <Text style={ps.statValue}>{streak}</Text>
              <Text style={ps.statLabel}>დღე სთრიქი</Text>
            </View>

            <View style={[ps.statDivider, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

            <View style={ps.statItem}>
              <View style={[ps.statIcon, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                <Crown size={16} color={C.gold || '#F59E0B'} />
              </View>
              <Text style={ps.statValue}>Lv.{level}</Text>
              <Text style={ps.statLabel}>{totalXP} XP</Text>
            </View>

            <View style={[ps.statDivider, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

            <View style={ps.statItem}>
              <View style={[ps.statIcon, { backgroundColor: 'rgba(29,185,84,0.15)' }]}>
                <Zap size={16} color={C.primary} />
              </View>
              <Text style={ps.statValue}>{weight}</Text>
              <Text style={ps.statLabel}>კგ</Text>
            </View>
          </View>

          {/* ── Streak Level Badge ── */}
          <View style={ps.streakBadge}>
            <Text style={ps.streakBadgeText}>{streakLabel} სთრიქი</Text>
          </View>

          {/* ── User Name ── */}
          <Text style={ps.userName}>@{userName || 'Balansi User'}</Text>

          {/* ── Bottom Watermark ── */}
          <View style={ps.watermark}>
            <View style={ps.watermarkDot} />
            <Text style={ps.watermarkText}>Balansi AI</Text>
          </View>

          {/* ── CTA ── */}
          <Text style={ps.cta}>გადმოწერე Balansi — შენი ციფრული ტყუპი გელოდება! 🧬</Text>

        </LinearGradient>
      </View>
    );
  }
);

ProShareCard.displayName = 'ProShareCard';

export default ProShareCard;

// ─── Styles ──────────────────────────────────────────────────────────────────
const ps = StyleSheet.create({
  container: {
    width: 360,
    height: 640,
    borderRadius: 0,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.08,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245,158,11,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    marginBottom: 20,
  },
  topBadgeText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarGlow: {
    padding: 10,
    borderRadius: 100,
    backgroundColor: 'rgba(29,185,84,0.06)',
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 16,
    paddingHorizontal: 10,
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 4,
  },
  streakBadge: {
    backgroundColor: 'rgba(29,185,84,0.12)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.2)',
    marginBottom: 12,
  },
  streakBadgeText: {
    color: '#A7F3D0',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  userName: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  watermark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  watermarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1DB954',
  },
  watermarkText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  cta: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
});

// ─── 🧬 BIO-AVATAR SVG — LAYERED ANIMATED CHARACTER ─────────────────────────
// ციფრული ტყუპი: Cute flat-design fitness Tamagotchi
// Layers: Aura → Legs → Body → Arms → Head → Face → Accessories
// 60fps via react-native-reanimated + react-native-svg
// ──────────────────────────────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import Svg, {
  Circle, Ellipse, Rect, Path, G, Defs,
  RadialGradient, Stop, Text as SvgText,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

import type { BodyState, TimeState, StreakLevel } from '../../store/useAvatarStore';

// ─── Animated SVG Components ─────────────────────────────────────────────────
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Body Configuration Lookup ───────────────────────────────────────────────
const BODY_CONFIGS = {
  heavy: {
    torsoRx: 52, torsoRy: 48,
    armRx: 14, armRy: 22,
    armLeftCx: 42, armRightCx: 158,
    legW: 26, legLeftX: 75, legRightX: 99,
    shoeW: 30, shoeLeftX: 73, shoeRightX: 97,
  },
  normal: {
    torsoRx: 40, torsoRy: 42,
    armRx: 11, armRy: 22,
    armLeftCx: 55, armRightCx: 145,
    legW: 20, legLeftX: 78, legRightX: 102,
    shoeW: 24, shoeLeftX: 76, shoeRightX: 100,
  },
  athletic: {
    torsoRx: 34, torsoRy: 38,
    armRx: 9, armRy: 22,
    armLeftCx: 61, armRightCx: 139,
    legW: 17, legLeftX: 80, legRightX: 103,
    shoeW: 21, shoeLeftX: 78, shoeRightX: 101,
  },
};

// ─── Time/Pose Configuration ─────────────────────────────────────────────────
const TIME_CONFIGS = {
  morning: { armCy: 158, eyeRy: 7 },   // half-open (waking up)
  day:     { armCy: 166, eyeRy: 11 },   // wide open (energetic)
  evening: { armCy: 173, eyeRy: 9 },    // slightly relaxed
  night:   { armCy: 182, eyeRy: 1.5 },  // closed (sleeping)
};

// ─── Component Props ─────────────────────────────────────────────────────────
interface BioAvatarSVGProps {
  bodyState: BodyState;
  timeState: TimeState;
  streakLevel: StreakLevel;
  C: any; // ThemeColors from config/theme
  size?: number;
  silhouette?: boolean; // Dark mysterious mode for free users
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function BioAvatarSVG({
  bodyState,
  timeState,
  streakLevel,
  C,
  size = 160,
  silhouette = false,
}: BioAvatarSVGProps) {
  // ═══ SHARED VALUES ═══
  // Body morphing
  const torsoRx = useSharedValue(BODY_CONFIGS[bodyState].torsoRx);
  const torsoRy = useSharedValue(BODY_CONFIGS[bodyState].torsoRy);
  const armRx = useSharedValue(BODY_CONFIGS[bodyState].armRx);
  const armLeftCx = useSharedValue(BODY_CONFIGS[bodyState].armLeftCx);
  const armRightCx = useSharedValue(BODY_CONFIGS[bodyState].armRightCx);

  // Pose
  const armCy = useSharedValue(TIME_CONFIGS[timeState].armCy);
  const eyeRy = useSharedValue(TIME_CONFIGS[timeState].eyeRy);

  // Idle breathing
  const breathe = useSharedValue(0);

  // Aura pulse (Level 3)
  const auraOpacity = useSharedValue(0);

  // Sleep indicator
  const sleepPulse = useSharedValue(0);

  // ═══ ANIMATION EFFECTS ═══

  // Body morphing animation (when bodyState changes)
  useEffect(() => {
    const config = BODY_CONFIGS[bodyState];
    const timing = { duration: 800 };
    torsoRx.value = withTiming(config.torsoRx, timing);
    torsoRy.value = withTiming(config.torsoRy, timing);
    armRx.value = withTiming(config.armRx, timing);
    armLeftCx.value = withTiming(config.armLeftCx, timing);
    armRightCx.value = withTiming(config.armRightCx, timing);
  }, [bodyState]);

  // Pose animation (when timeState changes)
  useEffect(() => {
    const config = TIME_CONFIGS[timeState];
    armCy.value = withTiming(config.armCy, { duration: 600 });
    eyeRy.value = withTiming(config.eyeRy, { duration: 400 });
  }, [timeState]);

  // Continuous breathing animation
  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1, { duration: 2500 }),
      -1,
      true
    );
  }, []);

  // Daytime eye blink
  useEffect(() => {
    if (timeState === 'day' && !silhouette) {
      const blink = setInterval(() => {
        eyeRy.value = withSequence(
          withTiming(1.5, { duration: 80 }),
          withTiming(11, { duration: 120 })
        );
      }, 4000);
      return () => clearInterval(blink);
    }
  }, [timeState, silhouette]);

  // Aura glow for Level 3
  useEffect(() => {
    if (streakLevel >= 3 && !silhouette) {
      auraOpacity.value = withRepeat(
        withTiming(0.22, { duration: 2000 }),
        -1,
        true
      );
    } else {
      auraOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [streakLevel, silhouette]);

  // Sleep pulse for night mode
  useEffect(() => {
    if (timeState === 'night' && !silhouette) {
      sleepPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1
      );
    } else {
      sleepPulse.value = withTiming(0, { duration: 300 });
    }
  }, [timeState, silhouette]);

  // ═══ ANIMATED PROPS ═══

  const torsoProps = useAnimatedProps(() => ({
    rx: torsoRx.value,
    ry: torsoRy.value + breathe.value * 1.5,
  }));

  const leftArmProps = useAnimatedProps(() => ({
    cx: armLeftCx.value,
    cy: armCy.value,
    rx: armRx.value,
  }));

  const rightArmProps = useAnimatedProps(() => ({
    cx: armRightCx.value,
    cy: armCy.value,
    rx: armRx.value,
  }));

  const leftEyeProps = useAnimatedProps(() => ({
    ry: eyeRy.value,
  }));

  const rightEyeProps = useAnimatedProps(() => ({
    ry: eyeRy.value,
  }));

  const auraProps = useAnimatedProps(() => ({
    opacity: auraOpacity.value,
  }));

  const sleepProps = useAnimatedProps(() => ({
    opacity: sleepPulse.value * 0.7,
  }));

  // ═══ COLORS ═══
  const skinColor = silhouette ? 'rgba(60,70,80,0.15)' : '#FFDCB5';
  const skinDark = silhouette ? 'rgba(60,70,80,0.12)' : '#F5C89A';
  const outfitColor = silhouette ? 'rgba(60,70,80,0.12)' : C.primary;
  const outfitDark = silhouette ? 'rgba(60,70,80,0.15)' : C.primaryDark;
  const eyeWhite = silhouette ? 'rgba(80,90,100,0.08)' : '#FFFFFF';
  const pupilColor = silhouette ? 'rgba(60,70,80,0.1)' : C.ink || '#1A1A2E';
  const blushColor = silhouette ? 'transparent' : '#FF9999';
  const mouthColor = silhouette ? 'rgba(60,70,80,0.1)' : (C.ink || '#4A3728');

  // Leg config (static — snaps on bodyState change, acceptable since it's rare)
  const legs = BODY_CONFIGS[bodyState];

  // ═══ RENDER ═══
  const aspectRatio = 280 / 200;
  const svgWidth = size;
  const svgHeight = size * aspectRatio;

  return (
    <Svg viewBox="0 0 200 280" width={svgWidth} height={svgHeight}>
      <Defs>
        {/* Radial glow for the aura effect */}
        <RadialGradient id="auraGlow" cx="100" cy="150" rx="110" ry="140" fx="100" fy="150" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={C.primary} stopOpacity="0.3" />
          <Stop offset="0.5" stopColor={C.primary} stopOpacity="0.1" />
          <Stop offset="1" stopColor={C.primary} stopOpacity="0" />
        </RadialGradient>

        {/* Silhouette glow for FOMO */}
        {silhouette && (
          <RadialGradient id="silhouetteGlow" cx="100" cy="140" rx="100" ry="130" fx="100" fy="140" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={C.primary} stopOpacity="0.12" />
            <Stop offset="0.7" stopColor={C.primary} stopOpacity="0.04" />
            <Stop offset="1" stopColor={C.primary} stopOpacity="0" />
          </RadialGradient>
        )}
      </Defs>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LAYER 0: SILHOUETTE GLOW (free users only) */}
      {silhouette && (
        <Circle cx={100} cy={140} r={120} fill="url(#silhouetteGlow)" />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LAYER 1: AURA GLOW (Streak Level 3+) */}
      {streakLevel >= 3 && !silhouette && (
        <AnimatedCircle
          animatedProps={auraProps}
          cx={100}
          cy={150}
          r={115}
          fill="url(#auraGlow)"
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LAYER 2: LEGS */}
      {/* Left leg */}
      <Rect
        x={legs.legLeftX}
        y={208}
        width={legs.legW}
        height={38}
        rx={legs.legW / 2}
        fill={skinColor}
      />
      {/* Right leg */}
      <Rect
        x={legs.legRightX}
        y={208}
        width={legs.legW}
        height={38}
        rx={legs.legW / 2}
        fill={skinColor}
      />
      {/* Left shoe */}
      <Rect
        x={legs.shoeLeftX}
        y={240}
        width={legs.shoeW}
        height={14}
        rx={7}
        fill={outfitDark}
      />
      {/* Right shoe */}
      <Rect
        x={legs.shoeRightX}
        y={240}
        width={legs.shoeW}
        height={14}
        rx={7}
        fill={outfitDark}
      />

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LAYER 3: BODY / TORSO (animated morphing) */}
      <AnimatedEllipse
        animatedProps={torsoProps}
        cx={100}
        cy={170}
        fill={outfitColor}
      />
      {/* Outfit neckline accent */}
      {!silhouette && (
        <Ellipse cx={100} cy={135} rx={18} ry={8} fill={skinDark} />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LAYER 4: ARMS (animated position) */}
      <AnimatedEllipse
        animatedProps={leftArmProps}
        ry={22}
        fill={skinColor}
      />
      <AnimatedEllipse
        animatedProps={rightArmProps}
        ry={22}
        fill={skinColor}
      />

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LAYER 5: HEAD */}
      <Circle cx={100} cy={72} r={48} fill={skinColor} />
      {/* Ears */}
      {!silhouette && (
        <>
          <Circle cx={54} cy={72} r={8} fill={skinDark} />
          <Circle cx={146} cy={72} r={8} fill={skinDark} />
          <Circle cx={54} cy={72} r={5} fill={skinColor} />
          <Circle cx={146} cy={72} r={5} fill={skinColor} />
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LAYER 6: FACE (only when not silhouette) */}
      {!silhouette && (
        <G>
          {/* Eye whites */}
          <AnimatedEllipse
            animatedProps={leftEyeProps}
            cx={83}
            cy={67}
            rx={10}
            fill={eyeWhite}
          />
          <AnimatedEllipse
            animatedProps={rightEyeProps}
            cx={117}
            cy={67}
            rx={10}
            fill={eyeWhite}
          />

          {/* Pupils (hidden when eyes closed / night) */}
          {timeState !== 'night' && (
            <>
              <Circle cx={83} cy={69} r={5.5} fill={pupilColor} />
              <Circle cx={117} cy={69} r={5.5} fill={pupilColor} />
              {/* Eye sparkle highlights */}
              <Circle cx={86} cy={65} r={2.2} fill="#FFFFFF" opacity={0.9} />
              <Circle cx={120} cy={65} r={2.2} fill="#FFFFFF" opacity={0.9} />
              <Circle cx={81} cy={71} r={1.2} fill="#FFFFFF" opacity={0.5} />
              <Circle cx={115} cy={71} r={1.2} fill="#FFFFFF" opacity={0.5} />
            </>
          )}

          {/* Mouth - varies by timeState */}
          {timeState === 'night' ? (
            // Peaceful sleeping face
            <Path
              d="M92,90 Q100,88 108,90"
              stroke={mouthColor}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
          ) : timeState === 'morning' ? (
            // Slight yawn/waking smile
            <Path
              d="M90,88 Q100,94 110,88"
              stroke={mouthColor}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            // Happy energetic smile (day & evening)
            <Path
              d="M86,86 Q100,100 114,86"
              stroke={mouthColor}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Rosy cheeks */}
          <Ellipse cx={67} cy={82} rx={8} ry={5} fill={blushColor} opacity={0.25} />
          <Ellipse cx={133} cy={82} rx={8} ry={5} fill={blushColor} opacity={0.25} />
        </G>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LAYER 7: SLEEP INDICATOR (night only) */}
      {timeState === 'night' && !silhouette && (
        <G>
          <AnimatedCircle
            animatedProps={sleepProps}
            cx={140}
            cy={40}
            r={0.01}
          />
          <SvgText x={132} y={42} fontSize={14} fill={C.primary} opacity={0.6} fontWeight="bold">
            💤
          </SvgText>
          <SvgText x={145} y={26} fontSize={10} fill={C.primary} opacity={0.4} fontWeight="bold">
            💤
          </SvgText>
        </G>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LAYER 8: ACCESSORIES */}

      {/* Level 1+: Sweatband (3+ days) */}
      {streakLevel >= 1 && !silhouette && (
        <G>
          <Rect x={58} y={42} width={84} height={9} rx={4.5} fill="#EF4444" />
          <Rect x={63} y={44} width={74} height={5} rx={2.5} fill="#FECACA" opacity={0.4} />
          {/* Knot on the side */}
          <Circle cx={142} cy={47} r={5} fill="#EF4444" />
          <Circle cx={148} cy={44} r={3.5} fill="#EF4444" />
        </G>
      )}

      {/* Level 2+: Gold Medal (7+ days) */}
      {streakLevel >= 2 && !silhouette && (
        <G>
          {/* Ribbon */}
          <Path
            d="M92,140 L100,160 L108,140"
            stroke="#EF4444"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Medal disc */}
          <Circle cx={100} cy={163} r={11} fill={C.gold || '#F59E0B'} />
          <Circle cx={100} cy={163} r={8} fill={C.goldLight || '#FDE68A'} opacity={0.6} />
          {/* Star on medal */}
          <Path
            d="M100,155 L101.8,160.5 L107.5,160.5 L102.8,163.8 L104.7,169.3 L100,166 L95.3,169.3 L97.2,163.8 L92.5,160.5 L98.2,160.5 Z"
            fill={C.gold || '#F59E0B'}
          />
        </G>
      )}

      {/* Level 3: Crown (14+ days) */}
      {streakLevel >= 3 && !silhouette && (
        <G>
          {/* Crown base */}
          <Rect x={72} y={26} width={56} height={8} rx={3} fill={C.gold || '#F59E0B'} />
          {/* Crown points */}
          <Path
            d="M72,26 L78,12 L86,22 L94,8 L100,22 L106,8 L114,22 L122,12 L128,26"
            fill={C.gold || '#F59E0B'}
          />
          {/* Jewels on crown */}
          <Circle cx={86} cy={20} r={2.5} fill="#EF4444" />
          <Circle cx={100} cy={14} r={3} fill={C.primary} />
          <Circle cx={114} cy={20} r={2.5} fill="#3B82F6" />
        </G>
      )}
    </Svg>
  );
}

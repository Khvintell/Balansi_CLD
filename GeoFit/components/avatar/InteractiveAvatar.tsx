// ─── 🧬 INTERACTIVE BIO-AVATAR v3 — UNIVERSAL BODY + EXPANDED HAIR ──────────
// Single androgynous base | 12 hairstyles | Clothing fits one body
// Tap → bounce + haptics | Pan → wobble | Mood-driven face
// ──────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useMemo, useCallback, memo } from 'react';
import Svg, {
  Circle, Ellipse, Rect, Path, G, Defs,
  RadialGradient, Stop, Text as SvgText, Line,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import {
  useAvatarStore,
  BODY_DIMS, ITEM_COLORS, MOOD_CONFIGS,
  type BodyState, type Mood,
} from '../../store/useAvatarStore';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

// ─── Universal body offsets (androgynous) ────────────────────────────────────
function getUniversalDims(bodyState: BodyState) {
  const d = BODY_DIMS[bodyState];
  return {
    ...d,
    shoulderRx: d.torsoRx + 2,
    waistRx: d.torsoRx - 2,
    armRx: d.armRx + 1,
    headR: 47,
    neckW: 14,
  };
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface InteractiveAvatarProps {
  C: any;
  size?: number;
  silhouette?: boolean;
  onTap?: () => void;
  disableGestures?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAIR LAYER — 12 styles
// ═══════════════════════════════════════════════════════════════════════════════
function renderHairLayer(hairId: string, silhouette: boolean) {
  if (silhouette) return null;
  const col = ITEM_COLORS[hairId] || { primary: '#92400E' };
  const c = col.primary;
  const c2 = col.secondary || c;
  switch (hairId) {
    case 'hair_short':
      return (
        <G>
          <Path d="M68,50 Q75,20 100,16 Q125,20 132,50" fill={c} />
          <Path d="M72,46 Q80,26 100,22 Q120,26 128,46" fill={c} opacity={0.65} />
        </G>
      );
    case 'hair_long':
      return (
        <G>
          <Path d="M60,50 Q70,16 100,12 Q130,16 140,50" fill={c} />
          <Rect x={56} y={50} width={14} height={60} rx={7} fill={c} opacity={0.8} />
          <Rect x={130} y={50} width={14} height={60} rx={7} fill={c} opacity={0.8} />
        </G>
      );
    case 'hair_buzz':
      return (
        <G>
          <Path d="M62,54 Q68,26 100,22 Q132,26 138,54" fill={c} opacity={0.45} />
          <Path d="M65,52 Q70,28 100,24 Q130,28 135,52" fill={c} opacity={0.3} />
        </G>
      );
    case 'hair_bald':
      // Just a subtle scalp sheen — no hair
      return (
        <G>
          <Ellipse cx={100} cy={40} rx={20} ry={8} fill="#FFFFFF" opacity={0.08} />
        </G>
      );
    case 'hair_bob':
      return (
        <G>
          <Path d="M58,50 Q68,14 100,10 Q132,14 142,50" fill={c} />
          <Path d="M58,50 Q56,80 70,85" fill={c} opacity={0.8} />
          <Path d="M142,50 Q144,80 130,85" fill={c} opacity={0.8} />
        </G>
      );
    case 'hair_curly':
      return (
        <G>
          <Circle cx={80} cy={30} r={13} fill={c} />
          <Circle cx={100} cy={24} r={14} fill={c} />
          <Circle cx={120} cy={30} r={13} fill={c} />
          <Circle cx={68} cy={46} r={9} fill={c} opacity={0.7} />
          <Circle cx={132} cy={46} r={9} fill={c} opacity={0.7} />
        </G>
      );
    case 'hair_ponytail':
      return (
        <G>
          <Path d="M65,50 Q72,20 100,16 Q128,20 135,50" fill={c} />
          {/* Ponytail flowing back-right */}
          <Path d="M130,42 Q148,50 145,80 Q142,100 135,110" stroke={c} strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.85} />
          <Circle cx={135} cy={112} r={6} fill={c2} opacity={0.6} />
        </G>
      );
    case 'hair_fade': {
      return (
        <G>
          {/* Full top */}
          <Path d="M70,50 Q78,22 100,18 Q122,22 130,50" fill={c} />
          {/* Faded sides */}
          <Path d="M58,55 Q62,48 70,50" fill={c2} opacity={0.3} />
          <Path d="M142,55 Q138,48 130,50" fill={c2} opacity={0.3} />
          <Path d="M60,65 Q64,55 68,52" fill={c2} opacity={0.15} />
          <Path d="M140,65 Q136,55 132,52" fill={c2} opacity={0.15} />
        </G>
      );
    }
    case 'hair_bun':
      return (
        <G>
          <Path d="M65,50 Q72,20 100,16 Q128,20 135,50" fill={c} />
          <Circle cx={100} cy={16} r={15} fill={c2} />
          <Circle cx={100} cy={16} r={10} fill={c} opacity={0.5} />
        </G>
      );
    case 'hair_wavy':
      return (
        <G>
          <Path d="M62,50 Q68,14 100,10 Q132,14 138,50" fill={c} />
          <Path d="M58,55 Q62,50 58,70 Q55,85 60,95" stroke={c} strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.75} />
          <Path d="M142,55 Q138,50 142,70 Q145,85 140,95" stroke={c} strokeWidth={10} fill="none" strokeLinecap="round" opacity={0.75} />
        </G>
      );
    case 'hair_messy_curls':
      return (
        <G>
          <Circle cx={75} cy={28} r={12} fill={c} />
          <Circle cx={95} cy={22} r={13} fill={c} />
          <Circle cx={115} cy={24} r={12} fill={c} />
          <Circle cx={130} cy={35} r={10} fill={c} opacity={0.8} />
          <Circle cx={65} cy={40} r={11} fill={c} opacity={0.7} />
          <Circle cx={100} cy={18} r={8} fill={c} opacity={0.5} />
          <Circle cx={85} cy={34} r={7} fill={c} opacity={0.4} />
        </G>
      );
    case 'hair_mohawk':
      return (
        <G>
          <Rect x={89} y={4} width={22} height={42} rx={11} fill={c} />
          <Rect x={92} y={8} width={16} height={32} rx={8} fill={c} opacity={0.55} />
        </G>
      );
    default:
      return <Path d="M68,50 Q75,20 100,16 Q125,20 132,50" fill="#92400E" />;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLOTHING LAYERS — all fit the universal body
// ═══════════════════════════════════════════════════════════════════════════════

function renderTopLayer(topId: string, bodyState: BodyState, silhouette: boolean) {
  if (silhouette) return null;
  const u = getUniversalDims(bodyState);
  const col = ITEM_COLORS[topId] || { primary: '#1DB954' };
  const c = col.primary;
  const c2 = col.secondary;
  const collar = <Ellipse cx={100} cy={130} rx={u.neckW / 2 + 4} ry={6} fill="#FFDCB5" />;

  switch (topId) {
    case 'top_tshirt':
      return (
        <G>
          <Ellipse cx={100} cy={142} rx={u.shoulderRx + 4} ry={12} fill={c} />
          <Rect x={100 - u.shoulderRx} y={142} width={u.shoulderRx * 2} height={56} rx={10} fill={c} />
          <Ellipse cx={100 - u.shoulderRx - 2} cy={152} rx={u.armRx + 4} ry={14} fill={c} />
          <Ellipse cx={100 + u.shoulderRx + 2} cy={152} rx={u.armRx + 4} ry={14} fill={c} />
          {collar}
        </G>
      );
    case 'top_tank':
      return (
        <G>
          <Rect x={100 - u.shoulderRx + 4} y={134} width={(u.shoulderRx - 4) * 2} height={60} rx={8} fill={c} />
          <Rect x={84} y={126} width={5} height={18} rx={2.5} fill={c} />
          <Rect x={111} y={126} width={5} height={18} rx={2.5} fill={c} />
          {collar}
        </G>
      );
    case 'top_hoodie':
      return (
        <G>
          <Ellipse cx={100} cy={142} rx={u.shoulderRx + 5} ry={13} fill={c} />
          <Rect x={100 - u.shoulderRx - 2} y={142} width={(u.shoulderRx + 2) * 2} height={56} rx={12} fill={c} />
          <Ellipse cx={100 - u.shoulderRx - 3} cy={155} rx={u.armRx + 5} ry={16} fill={c} />
          <Ellipse cx={100 + u.shoulderRx + 3} cy={155} rx={u.armRx + 5} ry={16} fill={c} />
          <Path d="M80,124 Q100,136 120,124" fill={c2 || '#9CA3AF'} />
          <Ellipse cx={100} cy={129} rx={11} ry={5} fill="#FFDCB5" />
          <Rect x={88} y={172} width={24} height={12} rx={4} fill={c2 || '#9CA3AF'} opacity={0.3} />
        </G>
      );
    case 'top_jacket':
      return (
        <G>
          <Ellipse cx={100} cy={142} rx={u.shoulderRx + 6} ry={14} fill={c} />
          <Rect x={100 - u.shoulderRx - 3} y={142} width={(u.shoulderRx + 3) * 2} height={58} rx={10} fill={c} />
          <Ellipse cx={100 - u.shoulderRx - 4} cy={155} rx={u.armRx + 6} ry={18} fill={c} />
          <Ellipse cx={100 + u.shoulderRx + 4} cy={155} rx={u.armRx + 6} ry={18} fill={c} />
          <Line x1={100} y1={132} x2={100} y2={198} stroke={c2 || '#D4D4D8'} strokeWidth={1.5} />
          <Path d="M93,132 L100,126 L107,132" fill={c2 || '#D4D4D8'} />
          <Ellipse cx={100} cy={130} rx={10} ry={4} fill="#FFDCB5" />
        </G>
      );
    case 'top_jersey':
      return (
        <G>
          <Ellipse cx={100} cy={142} rx={u.shoulderRx + 4} ry={12} fill={c} />
          <Rect x={100 - u.shoulderRx} y={142} width={u.shoulderRx * 2} height={56} rx={10} fill={c} />
          <Ellipse cx={100 - u.shoulderRx - 2} cy={152} rx={u.armRx + 4} ry={14} fill={c} />
          <Ellipse cx={100 + u.shoulderRx + 2} cy={152} rx={u.armRx + 4} ry={14} fill={c} />
          <Rect x={82} y={160} width={36} height={4} rx={2} fill={c2 || '#FFFFFF'} opacity={0.7} />
          <Rect x={82} y={170} width={36} height={4} rx={2} fill={c2 || '#FFFFFF'} opacity={0.7} />
          {collar}
        </G>
      );
    case 'top_golden':
      return (
        <G>
          <Path d={`M${100 - u.shoulderRx},198 L87,130 L100,140 L113,130 L${100 + u.shoulderRx},198 Z`} fill={c} />
          <Path d={`M${100 - u.shoulderRx + 3},196 L89,134 L100,142 L111,134 L${100 + u.shoulderRx - 3},196 Z`} fill={c2 || '#FDE68A'} opacity={0.35} />
        </G>
      );
    default:
      return (
        <G>
          <Rect x={100 - u.shoulderRx} y={138} width={u.shoulderRx * 2} height={58} rx={10} fill={c} />
          {collar}
        </G>
      );
  }
}

function renderBottomLayer(bottomId: string, bodyState: BodyState, silhouette: boolean) {
  if (silhouette) return null;
  const d = BODY_DIMS[bodyState];
  const col = ITEM_COLORS[bottomId] || { primary: '#1E40AF' };
  const c = col.primary;
  const legH = bottomId === 'bottom_shorts' ? 20 : 32;
  const w = bottomId === 'bottom_leggings' ? d.legW - 1 : d.legW + 3;
  return (
    <G>
      <Rect x={d.legLeftX - 2} y={204} width={d.legRightX - d.legLeftX + d.legW + 4} height={10} rx={5} fill={c} />
      <Rect x={d.legLeftX - 1} y={208} width={w} height={legH} rx={w / 2} fill={c} />
      <Rect x={d.legRightX - 1} y={208} width={w} height={legH} rx={w / 2} fill={c} />
    </G>
  );
}

function renderShoesLayer(shoesId: string, bodyState: BodyState, silhouette: boolean) {
  if (silhouette) return null;
  const d = BODY_DIMS[bodyState];
  const col = ITEM_COLORS[shoesId] || { primary: '#FFFFFF', secondary: '#1DB954' };
  const c = col.primary;
  const c2 = col.secondary || c;
  if (shoesId === 'shoes_hightop') {
    return (
      <G>
        <Rect x={d.shoeLeftX - 1} y={234} width={d.shoeW + 2} height={20} rx={6} fill={c} />
        <Rect x={d.shoeRightX - 1} y={234} width={d.shoeW + 2} height={20} rx={6} fill={c} />
        <Rect x={d.shoeLeftX + 1} y={246} width={d.shoeW - 2} height={3} rx={1.5} fill={c2} opacity={0.5} />
        <Rect x={d.shoeRightX + 1} y={246} width={d.shoeW - 2} height={3} rx={1.5} fill={c2} opacity={0.5} />
      </G>
    );
  }
  return (
    <G>
      <Rect x={d.shoeLeftX} y={240} width={d.shoeW} height={14} rx={7} fill={c} />
      <Rect x={d.shoeRightX} y={240} width={d.shoeW} height={14} rx={7} fill={c} />
      <Rect x={d.shoeLeftX + 2} y={244} width={d.shoeW - 4} height={3} rx={1.5} fill={c2} opacity={0.5} />
      <Rect x={d.shoeRightX + 2} y={244} width={d.shoeW - 4} height={3} rx={1.5} fill={c2} opacity={0.5} />
    </G>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCESSORIES & FACE (unchanged logic)
// ═══════════════════════════════════════════════════════════════════════════════

function renderAccessoryLayer(accId: string, C: any, silhouette: boolean) {
  if (silhouette || accId === 'acc_none') return null;
  switch (accId) {
    case 'acc_headband':
      return (
        <G>
          <Rect x={58} y={42} width={84} height={8} rx={4} fill="#EF4444" />
          <Circle cx={142} cy={46} r={5} fill="#EF4444" />
        </G>
      );
    case 'acc_glasses':
      return (
        <G>
          <Circle cx={83} cy={67} r={11} fill="none" stroke="#374151" strokeWidth={2} />
          <Circle cx={117} cy={67} r={11} fill="none" stroke="#374151" strokeWidth={2} />
          <Line x1={94} y1={67} x2={106} y2={67} stroke="#374151" strokeWidth={2} />
          <Line x1={72} y1={67} x2={56} y2={64} stroke="#374151" strokeWidth={1.5} />
          <Line x1={128} y1={67} x2={144} y2={64} stroke="#374151" strokeWidth={1.5} />
        </G>
      );
    case 'acc_sunglasses':
      return (
        <G>
          <Ellipse cx={83} cy={67} rx={12} ry={9} fill="#1F2937" />
          <Ellipse cx={117} cy={67} rx={12} ry={9} fill="#1F2937" />
          <Line x1={95} y1={67} x2={105} y2={67} stroke="#1F2937" strokeWidth={3} />
          <Line x1={71} y1={67} x2={56} y2={63} stroke="#1F2937" strokeWidth={2} />
          <Line x1={129} y1={67} x2={144} y2={63} stroke="#1F2937" strokeWidth={2} />
          <Ellipse cx={83} cy={64} rx={5} ry={3} fill="#FFFFFF" opacity={0.12} />
          <Ellipse cx={117} cy={64} rx={5} ry={3} fill="#FFFFFF" opacity={0.12} />
        </G>
      );
    case 'acc_cap':
      return (
        <G>
          <Ellipse cx={100} cy={36} rx={44} ry={14} fill="#1F2937" />
          <Rect x={56} y={28} width={88} height={10} rx={5} fill="#1F2937" />
          <Ellipse cx={100} cy={38} rx={52} ry={6} fill="#374151" />
          <Circle cx={100} cy={26} r={3} fill="#6B7280" />
        </G>
      );
    case 'acc_crown':
      return (
        <G>
          <Rect x={74} y={24} width={52} height={7} rx={3} fill={C.gold || '#F59E0B'} />
          <Path d="M74,24 L79,11 L86,20 L93,7 L100,20 L107,7 L114,20 L121,11 L126,24" fill={C.gold || '#F59E0B'} />
          <Circle cx={86} cy={18} r={2.2} fill="#EF4444" />
          <Circle cx={100} cy={12} r={2.5} fill={C.primary} />
          <Circle cx={114} cy={18} r={2.2} fill="#3B82F6" />
        </G>
      );
    default:
      return null;
  }
}

function renderFaceLayer(mood: Mood, C: any, silhouette: boolean, hasSunglasses: boolean) {
  if (silhouette) return null;
  const cfg = MOOD_CONFIGS[mood] || MOOD_CONFIGS.happy;
  const pupilColor = C.ink || '#1A1A2E';
  const mouthColor = C.ink || '#4A3728';
  const showEyes = !hasSunglasses;
  return (
    <G>
      {showEyes && (
        <>
          <Ellipse cx={83} cy={67} rx={9} ry={cfg.eyeRy} fill="#FFFFFF" />
          <Ellipse cx={117} cy={67} rx={9} ry={cfg.eyeRy} fill="#FFFFFF" />
          {cfg.eyeRy > 3 && (
            <>
              <Circle cx={83} cy={69} r={5} fill={pupilColor} />
              <Circle cx={117} cy={69} r={5} fill={pupilColor} />
              <Circle cx={86} cy={65} r={2} fill="#FFFFFF" opacity={0.9} />
              <Circle cx={120} cy={65} r={2} fill="#FFFFFF" opacity={0.9} />
            </>
          )}
        </>
      )}
      <Path d={cfg.mouthPath} stroke={mouthColor} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Ellipse cx={68} cy={80} rx={7} ry={4} fill="#FF9999" opacity={0.2} />
      <Ellipse cx={132} cy={80} rx={7} ry={4} fill="#FF9999" opacity={0.2} />
      {cfg.extras.includes('sparkle') && (
        <>
          <SvgText x={134} y={38} fontSize={10} fill={C.gold || '#F59E0B'}>✨</SvgText>
          <SvgText x={54} y={46} fontSize={8} fill={C.gold || '#F59E0B'}>✨</SvgText>
        </>
      )}
      {cfg.extras.includes('sweat') && (
        <Path d="M137,54 Q139,61 135,61" fill="#60A5FA" opacity={0.65} />
      )}
      {cfg.extras.includes('zzz') && (
        <>
          <SvgText x={131} y={40} fontSize={12} fill={C.primary} opacity={0.5} fontWeight="bold">💤</SvgText>
          <SvgText x={143} y={26} fontSize={9} fill={C.primary} opacity={0.35} fontWeight="bold">💤</SvgText>
        </>
      )}
    </G>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function InteractiveAvatarInner({
  C,
  size = 160,
  silhouette = false,
  onTap,
  disableGestures = false,
}: InteractiveAvatarProps) {
  const { bodyState, mood, equippedItems } = useAvatarStore();

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(withTiming(1, { duration: 2500 }), -1, true);
  }, []);

  const handleTapJS = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTap?.();
  }, [onTap]);

  const tapGesture = useMemo(() =>
    Gesture.Tap().onStart(() => {
      scale.value = withSequence(
        withSpring(0.88, { damping: 4 }),
        withSpring(1.06, { damping: 4 }),
        withSpring(1, { damping: 8 })
      );
      runOnJS(handleTapJS)();
    }), [handleTapJS]);

  const panGesture = useMemo(() =>
    Gesture.Pan()
      .onUpdate((e) => {
        translateX.value = e.translationX * 0.2;
        rotation.value = e.translationX * 0.12;
      })
      .onEnd(() => {
        translateX.value = withSpring(0);
        rotation.value = withSpring(0);
      }), []);

  const composed = useMemo(() =>
    disableGestures ? Gesture.Tap() : Gesture.Simultaneous(tapGesture, panGesture),
    [disableGestures, tapGesture, panGesture]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const torsoProps = useAnimatedProps(() => ({
    ry: BODY_DIMS[bodyState].torsoRy + breathe.value * 1.2,
  }));

  const skinColor = silhouette ? '#1E293B' : '#FFDCB5';
  const skinDark = silhouette ? '#334155' : '#F5C89A';
  const d = BODY_DIMS[bodyState];
  const u = getUniversalDims(bodyState);
  const hasSunglasses = equippedItems.accessory === 'acc_sunglasses';

  const svgWidth = size;
  const svgHeight = size * (280 / 200);

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={animatedStyle}>
        <Svg viewBox="0 0 200 280" width={svgWidth} height={svgHeight}>
          <Defs>
            {silhouette && (
              <RadialGradient id="silGlow" cx="100" cy="140" rx="100" ry="130" fx="100" fy="140" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={C.primary} stopOpacity="0.25" />
                <Stop offset="0.5" stopColor={C.primary} stopOpacity="0.08" />
                <Stop offset="1" stopColor={C.primary} stopOpacity="0" />
              </RadialGradient>
            )}
          </Defs>
          {silhouette && <Circle cx={100} cy={140} r={120} fill="url(#silGlow)" />}

          {/* Legs */}
          <Rect x={d.legLeftX} y={208} width={d.legW} height={36} rx={d.legW / 2} fill={skinColor} />
          <Rect x={d.legRightX} y={208} width={d.legW} height={36} rx={d.legW / 2} fill={skinColor} />

          {/* Bottoms */}
          {renderBottomLayer(equippedItems.bottom, bodyState, silhouette)}

          {/* Shoes */}
          {renderShoesLayer(equippedItems.shoes, bodyState, silhouette)}

          {/* Universal Body (androgynous) */}
          <G>
            <Ellipse cx={100} cy={140} rx={u.shoulderRx} ry={11} fill={silhouette ? skinColor : skinDark} />
            <AnimatedEllipse animatedProps={torsoProps} cx={100} cy={170} rx={u.waistRx + 2} fill={silhouette ? skinColor : skinDark} />
            <Rect x={100 - u.neckW / 2} y={115} width={u.neckW} height={19} rx={u.neckW / 2} fill={skinColor} />
          </G>

          {/* Top */}
          {renderTopLayer(equippedItems.top, bodyState, silhouette)}

          {/* Arms */}
          <Ellipse cx={100 - u.shoulderRx - u.armRx + 2} cy={164} rx={u.armRx} ry={20} fill={skinColor} />
          <Ellipse cx={100 + u.shoulderRx + u.armRx - 2} cy={164} rx={u.armRx} ry={20} fill={skinColor} />

          {/* Head */}
          <Circle cx={100} cy={70} r={u.headR} fill={skinColor} />
          {!silhouette && (
            <>
              <Circle cx={100 - u.headR + 2} cy={70} r={7} fill={skinDark} />
              <Circle cx={100 + u.headR - 2} cy={70} r={7} fill={skinDark} />
              <Circle cx={100 - u.headR + 2} cy={70} r={4.5} fill={skinColor} />
              <Circle cx={100 + u.headR - 2} cy={70} r={4.5} fill={skinColor} />
            </>
          )}

          {/* Hair */}
          {renderHairLayer(equippedItems.hair, silhouette)}

          {/* Face */}
          {renderFaceLayer(mood, C, silhouette, hasSunglasses)}

          {/* Accessories */}
          {renderAccessoryLayer(equippedItems.accessory, C, silhouette)}
        </Svg>
      </Animated.View>
    </GestureDetector>
  );
}

const InteractiveAvatar = memo(InteractiveAvatarInner);
export default InteractiveAvatar;

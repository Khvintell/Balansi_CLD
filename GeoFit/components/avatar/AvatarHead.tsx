// ─── 🧬 AVATAR HEAD — PROFILE PICTURE SYNC COMPONENT ────────────────────────
// Zoomed SVG view of the avatar's head/face/hair/accessories only
// Reuses the same SVG elements as InteractiveAvatar for perfect consistency
// ──────────────────────────────────────────────────────────────────────────────

import React, { memo } from 'react';
import Svg, { Circle, Ellipse, Path, G, Line } from 'react-native-svg';
import {
  useAvatarStore,
  MOOD_CONFIGS, ITEM_COLORS,
  type Mood,
} from '../../store/useAvatarStore';

interface AvatarHeadProps {
  C: any;
  size?: number;
}

// ─── Inline renderers (head-only versions) ───────────────────────────────────

function renderHeadHair(hairId: string) {
  const col = ITEM_COLORS[hairId] || { primary: '#92400E' };
  const c = col.primary;
  switch (hairId) {
    case 'hair_short':
      return <Path d="M68,52 Q75,22 100,18 Q125,22 132,52" fill={c} />;
    case 'hair_long':
      return (
        <G>
          <Path d="M60,52 Q70,18 100,14 Q130,18 140,52" fill={c} />
          <Path d="M56,52 L60,100" stroke={c} strokeWidth={14} strokeLinecap="round" opacity={0.8} />
          <Path d="M144,52 L140,100" stroke={c} strokeWidth={14} strokeLinecap="round" opacity={0.8} />
        </G>
      );
    case 'hair_curly':
      return (
        <G>
          <Circle cx={80} cy={32} r={14} fill={c} />
          <Circle cx={100} cy={26} r={15} fill={c} />
          <Circle cx={120} cy={32} r={14} fill={c} />
          <Circle cx={68} cy={48} r={10} fill={c} opacity={0.7} />
          <Circle cx={132} cy={48} r={10} fill={c} opacity={0.7} />
        </G>
      );
    case 'hair_bun': {
      const c2 = col.secondary || c;
      return (
        <G>
          <Path d="M65,52 Q72,22 100,18 Q128,22 135,52" fill={c} />
          <Circle cx={100} cy={18} r={16} fill={c2} />
          <Circle cx={100} cy={18} r={11} fill={c} opacity={0.6} />
        </G>
      );
    }
    case 'hair_mohawk':
      return (
        <G>
          <Path d="M88,48 Q92,4 100,2 Q108,4 112,48" fill={c} />
          <Path d="M90,45 Q94,8 100,6 Q106,8 110,45" fill={c} opacity={0.6} />
        </G>
      );
    default:
      return <Path d="M68,52 Q75,22 100,18 Q125,22 132,52" fill="#92400E" />;
  }
}

function renderHeadAccessory(accId: string, C: any) {
  switch (accId) {
    case 'acc_headband':
      return (
        <G>
          <Path d="M58,44 Q100,38 142,44" stroke="#EF4444" strokeWidth={8} fill="none" strokeLinecap="round" />
          <Circle cx={142} cy={44} r={5} fill="#EF4444" />
        </G>
      );
    case 'acc_glasses':
      return (
        <G>
          <Circle cx={83} cy={67} r={12} fill="none" stroke="#374151" strokeWidth={2} />
          <Circle cx={117} cy={67} r={12} fill="none" stroke="#374151" strokeWidth={2} />
          <Line x1={95} y1={67} x2={105} y2={67} stroke="#374151" strokeWidth={2} />
        </G>
      );
    case 'acc_sunglasses':
      return (
        <G>
          <Ellipse cx={83} cy={67} rx={13} ry={10} fill="#1F2937" />
          <Ellipse cx={117} cy={67} rx={13} ry={10} fill="#1F2937" />
          <Line x1={96} y1={67} x2={104} y2={67} stroke="#1F2937" strokeWidth={3} />
          <Ellipse cx={83} cy={64} rx={6} ry={3} fill="#FFFFFF" opacity={0.15} />
          <Ellipse cx={117} cy={64} rx={6} ry={3} fill="#FFFFFF" opacity={0.15} />
        </G>
      );
    case 'acc_crown':
      return (
        <G>
          <Path d="M72,26 L78,12 L86,22 L94,8 L100,22 L106,8 L114,22 L122,12 L128,26 Z" fill={C.gold || '#F59E0B'} />
          <Circle cx={86} cy={20} r={2.5} fill="#EF4444" />
          <Circle cx={100} cy={14} r={3} fill={C.primary} />
          <Circle cx={114} cy={20} r={2.5} fill="#3B82F6" />
        </G>
      );
    default:
      return null;
  }
}

function renderHeadFace(mood: Mood, C: any, hasSunglasses: boolean) {
  const cfg = MOOD_CONFIGS[mood] || MOOD_CONFIGS.happy;
  const pupilColor = C.ink || '#1A1A2E';
  const mouthColor = C.ink || '#4A3728';
  const showEyes = !hasSunglasses;

  return (
    <G>
      {showEyes && (
        <>
          <Ellipse cx={83} cy={67} rx={10} ry={cfg.eyeRy} fill="#FFFFFF" />
          <Ellipse cx={117} cy={67} rx={10} ry={cfg.eyeRy} fill="#FFFFFF" />
          {cfg.eyeRy > 3 && (
            <>
              <Circle cx={83} cy={69} r={5.5} fill={pupilColor} />
              <Circle cx={117} cy={69} r={5.5} fill={pupilColor} />
              <Circle cx={86} cy={65} r={2.2} fill="#FFFFFF" opacity={0.9} />
              <Circle cx={120} cy={65} r={2.2} fill="#FFFFFF" opacity={0.9} />
            </>
          )}
        </>
      )}
      <Path d={cfg.mouthPath} stroke={mouthColor} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Ellipse cx={67} cy={82} rx={8} ry={5} fill="#FF9999" opacity={0.25} />
      <Ellipse cx={133} cy={82} rx={8} ry={5} fill="#FF9999" opacity={0.25} />
    </G>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

function AvatarHeadInner({ C, size = 60 }: AvatarHeadProps) {
  const { mood, equippedItems } = useAvatarStore();
  const hasSunglasses = equippedItems.accessory === 'acc_sunglasses';

  return (
    <Svg viewBox="38 0 124 110" width={size} height={size}>
      {/* Head circle */}
      <Circle cx={100} cy={72} r={48} fill="#FFDCB5" />
      {/* Ears */}
      <Circle cx={54} cy={72} r={8} fill="#F5C89A" />
      <Circle cx={146} cy={72} r={8} fill="#F5C89A" />
      <Circle cx={54} cy={72} r={5} fill="#FFDCB5" />
      <Circle cx={146} cy={72} r={5} fill="#FFDCB5" />

      {/* Hair */}
      {renderHeadHair(equippedItems.hair)}

      {/* Face */}
      {renderHeadFace(mood, C, hasSunglasses)}

      {/* Accessories (head-only ones) */}
      {renderHeadAccessory(equippedItems.accessory, C)}
    </Svg>
  );
}

const AvatarHead = memo(AvatarHeadInner);
export default AvatarHead;

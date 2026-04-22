import React from 'react';
import { View, Text, TouchableWithoutFeedback, Animated } from 'react-native';
import { TrendingDown, TrendingUp, Trophy, Flag } from 'lucide-react-native';

interface WeightCardProps {
  currentW: number;
  totalChange: string;
  isReached: boolean;
  progressPct: number;
  targetWeight: number;
  diffToTgt: string;
  changeColor: string;
  cardScale: Animated.Value;
  C: any;
  S: any;
  onPress: () => void;
}

export const WeightCard = ({
  currentW,
  totalChange,
  isReached,
  progressPct,
  targetWeight,
  diffToTgt,
  changeColor,
  cardScale,
  C,
  S,
  onPress
}: WeightCardProps) => {
  return (
    <TouchableWithoutFeedback
      onPressIn={() => Animated.spring(cardScale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => {
        Animated.spring(cardScale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }).start();
        onPress();
      }}
    >
      <Animated.View style={[S.weightCard, isReached && S.weightCardReached, { transform: [{ scale: cardScale }] }]}>
        {isReached && <View style={S.weightCardGlowBg} />}

        <View style={S.weightTopRow}>
          <View>
            <Text style={S.weightEyebrow}>მიმდინარე წონა</Text>
            <View style={S.weightDisplay}>
              <Text style={S.weightBig}>{Math.floor(currentW)}</Text>
              <View>
                <Text style={S.weightDecimal}>.{String(Math.round((currentW % 1) * 10)).padStart(1, '0')}</Text>
                <Text style={S.weightUnit}>კგ</Text>
              </View>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 10 }}>
            <View style={[S.deltaPill, { borderColor: changeColor + '40', backgroundColor: changeColor + '15' }]}>
              {parseFloat(totalChange) <= 0
                ? <TrendingDown size={13} color={changeColor} />
                : <TrendingUp size={13} color={changeColor} />}
              <Text style={[S.deltaTxt, { color: changeColor }]}>
                {parseFloat(totalChange) > 0 ? '+' : ''}{totalChange} კგ
              </Text>
            </View>
            {isReached && (
              <View style={S.reachedPill}>
                <Trophy size={11} color={C.gold} />
                <Text style={S.reachedTxt}>მიღწეულია!</Text>
              </View>
            )}
          </View>
        </View>

        {!isReached && (
          <View style={S.progressRow}>
            <View style={S.progressTrack}>
              <Animated.View style={[S.progressBar, { width: `${progressPct * 100}%` }]}>
                <View style={S.progressGlowTip} />
              </Animated.View>
            </View>
            <Text style={S.progressLabel}>{Math.round(progressPct * 100)}%</Text>
          </View>
        )}

        <View style={S.weightFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Flag size={11} color={C.inkMid} />
            <Text style={S.weightFooterTxt}>სამიზნე: <Text style={{ fontWeight: '700', color: C.ink }}>{targetWeight} კგ</Text></Text>
          </View>
          <Text style={[S.weightFooterRight, isReached && { color: C.primaryDark }]}>
            {isReached ? '✓ მიღწეულია' : `დარჩა ${diffToTgt} კგ`}
          </Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Droplet, RotateCcw, Plus, CheckCircle2 } from 'lucide-react-native';

interface WaterCardProps {
  water: number;
  targetWater: number;
  waterBarHeight: Animated.AnimatedInterpolation<string | number>;
  waveAnim: Animated.Value;
  waveAnim2: Animated.Value;
  C: any;
  S: any;
  onAddWater: () => void;
  onResetWater: () => void;
}

export const WaterCard = ({
  water,
  targetWater,
  waterBarHeight,
  waveAnim,
  waveAnim2,
  C,
  S,
  onAddWater,
  onResetWater
}: WaterCardProps) => {
  return (
    <View style={S.waterCard}>
      {/* FLUID BACKGROUND WITH DUAL WAVES */}
      <Animated.View style={[
        S.waterBgFill, 
        { 
          height: waterBarHeight,
          backgroundColor: water >= targetWater ? C.primary : '#0369A1'
        }
      ]}>
        <Animated.View style={[
          S.waveLayer,
          {
            opacity: 0.25,
            transform: [
              { translateX: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 100] }) },
              { rotate: waveAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
              { scale: 1.15 }
            ]
          }
        ]} />
        <Animated.View style={[
          S.waveLayer,
          {
            opacity: 0.15,
            top: -395,
            transform: [
              { translateX: waveAnim2.interpolate({ inputRange: [0, 1], outputRange: [100, -100] }) },
              { rotate: waveAnim2.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }) },
              { scale: 1.35 }
            ]
          }
        ]} />
      </Animated.View>
      
      <View style={S.waterInner}>
        <View style={S.waterHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[S.waterIconBg, water >= targetWater && { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.4)' }]}>
              <Droplet size={26} color={water >= targetWater ? '#FFF' : '#0369A1'} fill={water >= targetWater ? '#FFF' : '#0369A1'} />
            </View>
            <View>
              <Text style={[S.waterTitle, water >= targetWater && { color: '#FFF' }]}>წყლის ბალანსი</Text>
              <Text style={[S.waterSub, water >= targetWater && { color: '#FFF' }]}>
                {water} <Text style={{ color: water >= targetWater ? 'rgba(255,255,255,0.7)' : C.inkMid, fontSize: 13, fontWeight: '700' }}>/ {targetWater} მლ</Text>
              </Text>
            </View>
          </View>

          <View style={S.waterHeaderRight}>
            {water > 0 && (
              <TouchableOpacity style={[S.waterResetBtn, water >= targetWater && { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }]} onPress={onResetWater} activeOpacity={0.7}>
                <RotateCcw size={16} color={water >= targetWater ? '#FFF' : C.inkLight} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[S.waterBtn, water >= targetWater && { backgroundColor: '#FFF', shadowColor: '#000' }]} 
              onPress={onAddWater} 
              activeOpacity={0.8}
            >
              <Plus size={18} color={water >= targetWater ? C.primary : "#FFF"} />
              <Text style={[S.waterBtnTxt, water >= targetWater && { color: C.primary }]}>250 მლ</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={S.waterFooterRow}>
          {water >= targetWater ? (
            <View style={S.waterSuccessBox}>
              <CheckCircle2 size={18} color={C.primary} />
              <Text style={S.waterSuccessTxt}>ჰიდრატაციის ნორმა შესრულებულია!</Text>
            </View>
          ) : (
            <View style={S.waterProgressBadge}>
              <Text style={S.waterPercentInfo}>{Math.round((water / targetWater) * 100)}% შევსებულია</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

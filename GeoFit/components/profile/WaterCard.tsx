import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Droplet, RotateCcw, Plus } from 'lucide-react-native';

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
  water, targetWater, waterBarHeight, waveAnim, waveAnim2,
  C, onAddWater, onResetWater
}: WaterCardProps) => {
  const isGoalReached = water >= targetWater;

  return (
    <View style={[styles.container, { borderColor: isGoalReached ? C.primary + '30' : 'rgba(0,0,0,0.03)' }]}>
      {/* 🌊 FLUID BACKGROUND */}
      <Animated.View 
        style={[
          styles.fillContainer, 
          { 
            height: waterBarHeight,
            backgroundColor: isGoalReached ? C.primary || '#10B981' : '#0EA5E9'
          }
        ]}
      >
        <Animated.View style={[
          styles.wave,
          {
            opacity: 0.3,
            transform: [
              { translateX: waveAnim.interpolate({ inputRange: [0, 1], outputRange: [-100, 100] }) },
              { rotate: waveAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
              { scale: 1.2 }
            ]
          }
        ]} />
      </Animated.View>

      <View style={styles.body}>
         <View style={[styles.iconWrap, { backgroundColor: isGoalReached ? 'rgba(255,255,255,0.2)' : 'rgba(14, 165, 233, 0.1)' }]}>
            <Droplet size={20} color={isGoalReached ? '#FFF' : '#0EA5E9'} fill={isGoalReached ? '#FFF' : '#0EA5E9'} />
         </View>
         
         <Text style={[styles.title, isGoalReached && { color: '#FFF' }]}>წყალი</Text>
         <View style={styles.valRow}>
            <Text style={[styles.val, isGoalReached && { color: '#FFF' }]}>{water}</Text>
            <Text style={[styles.unit, isGoalReached && { color: 'rgba(255,255,255,0.7)' }]}> / {targetWater} მლ</Text>
         </View>

         {water > 0 && (
           <TouchableOpacity 
             style={styles.resetBtn} 
             onPress={onResetWater}
           >
             <RotateCcw size={12} color={isGoalReached ? '#FFF' : '#64748B'} />
           </TouchableOpacity>
         )}
      </View>

      <TouchableOpacity 
        style={[styles.addBtn, { backgroundColor: isGoalReached ? '#FFF' : '#0EA5E9' }]} 
        onPress={onAddWater}
        activeOpacity={0.8}
      >
        <Plus size={16} color={isGoalReached ? C.primary : '#FFF'} />
        <Text style={[styles.addBtnTxt, { color: isGoalReached ? C.primary : '#FFF' }]}>250 მლ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#FFF',
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 180,
    elevation: 3,
    shadowColor: '#0EA5E9',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  fillContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  wave: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.3)',
    left: -100,
    bottom: '40%',
  },
  body: {
    padding: 16,
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  valRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  val: {
    fontSize: 22,
    fontWeight: '900',
  },
  unit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  resetBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
  },
  addBtnTxt: {
    fontSize: 13,
    fontWeight: '900',
  },
});

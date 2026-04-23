import React from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingDown, TrendingUp, Scale } from 'lucide-react-native';

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
  currentW, totalChange, isReached, progressPct,
  diffToTgt, changeColor, cardScale,
  C, onPress
}: WeightCardProps) => {

  const weightInt = Math.floor(currentW);
  const weightDec = String(Math.round((currentW % 1) * 10)).slice(0, 1);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: cardScale }] }]}>
      <LinearGradient
        colors={[(C.surface || '#FFF'), (C.surfaceAlt || '#F8FAFC')]}
        style={styles.gradient}
      />

      {/* Main Info */}
      <View style={styles.body}>
        <Text style={[styles.eyebrow, { color: C.inkLight || '#64748B' }]}>მიმდინარე</Text>
        <View style={styles.weightRow}>
          <Text style={[styles.weightBig, { color: C.ink || '#0F172A' }]}>{weightInt}</Text>
          <Text style={[styles.weightSmall, { color: C.inkMid || '#475569' }]}>.{weightDec}</Text>
          <Text style={[styles.unit, { color: C.inkLight || '#94A3B8' }]}>კგ</Text>
        </View>

        <View style={[styles.deltaPill, { borderColor: changeColor + '20', backgroundColor: changeColor + '10' }]}>
          {parseFloat(totalChange) <= 0
            ? <TrendingDown size={11} color={changeColor} />
            : <TrendingUp size={11} color={changeColor} />}
          <Text style={[styles.deltaTxt, { color: changeColor }]}>{totalChange}</Text>
        </View>
      </View>

      {/* Progress track (mini) */}
      {!isReached && (
        <View style={styles.trackContainer}>
           <View style={[styles.track, { backgroundColor: (C.surfaceMid || '#E2E8F0') }]}>
              <View style={[styles.fill, { width: `${progressPct * 100}%`, backgroundColor: C.primary || '#10B981' }]} />
           </View>
           <Text style={[styles.trackLabel, { color: C.inkLight }]}>დარჩა {diffToTgt} კგ</Text>
        </View>
      )}

      {/* Integrated Action Button */}
      <TouchableOpacity 
        style={[styles.actionBtn, { backgroundColor: C.primary || '#10B981' }]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Scale size={14} color="#FFF" />
        <Text style={styles.actionBtnTxt}>აწონვა</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    minHeight: 180,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  body: {
    padding: 16,
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  weightBig: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  weightSmall: {
    fontSize: 14,
    fontWeight: '800',
  },
  unit: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 2,
  },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  deltaTxt: {
    fontSize: 11,
    fontWeight: '800',
  },
  trackContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  track: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  trackLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 'auto',
  },
  actionBtnTxt: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});

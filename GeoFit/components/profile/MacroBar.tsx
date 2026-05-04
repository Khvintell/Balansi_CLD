import React, { useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';

interface MacroBarProps {
  label: string;
  value: number;
  target: number;
  color: string;
  bg: string;
  unit: string;
  icon: any;
  S: any;
}

export const MacroBar = ({ 
  label, value, target, color, bg, unit, icon: Icon, S 
}: MacroBarProps) => {
  const rawPct = value / (target || 1);
  const pct = isFinite(rawPct) ? Math.min(Math.max(0, rawPct), 1) : 0;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => { 
    Animated.timing(anim, { 
      toValue: pct, 
      duration: 900, 
      delay: 200, 
      useNativeDriver: false 
    }).start(); 
  }, [pct]);

  const width = anim.interpolate({ 
    inputRange: [0, 1], 
    outputRange: ['0%', '100%'] 
  });

  return (
    <View style={[S.macroBarWrap, { marginBottom: 4 }]}>
      <View style={S.macroBarHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
          <View style={[S.macroBarIcon, { backgroundColor: bg, width: 22, height: 22, borderRadius: 8 }]}>
            <Icon size={12} color={color} />
          </View>
          <Text style={[S.macroBarLabel, { fontSize: 11, fontWeight: '800' }]} numberOfLines={1}>{label}</Text>
        </View>
        <Text style={[S.macroBarVal, { color: '#0F172A', fontWeight: '900', fontSize: 12 }]}>
          {Math.round(value)}
          <Text style={{ fontSize: 9, color: '#64748B', fontWeight: '700' }}> / {target}{unit}</Text>
        </Text>
      </View>
      <View style={[S.macroBarBg, { height: 6, borderRadius: 3, backgroundColor: '#F1F5F9' }]}>
        <Animated.View style={[S.macroBarFill, { 
          width, 
          backgroundColor: color, 
          height: '100%', 
          borderRadius: 3,
          shadowColor: color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 2
        }]} />
      </View>
    </View>
  );
};

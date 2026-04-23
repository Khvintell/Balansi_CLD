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
    <View style={S.macroBarWrap}>
      <View style={S.macroBarHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
          <View style={[S.macroBarIcon, { backgroundColor: bg }]}>
            <Icon size={12} color={color} />
          </View>
          <Text style={S.macroBarLabel} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
        </View>
        <Text style={[S.macroBarVal, { color: '#000', flexShrink: 0 }]}>
          {value}
          <Text style={S.macroBarUnit}>/{target}{unit}</Text>
        </Text>
      </View>
      <View style={S.macroBarBg}>
        <Animated.View style={[S.macroBarFill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
};

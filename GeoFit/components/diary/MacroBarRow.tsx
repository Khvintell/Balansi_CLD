import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

const mb = StyleSheet.create({
  card:    { backgroundColor:'#FFF', borderRadius:16, padding:15, marginBottom:9, borderWidth:1, borderColor:'#F3F4F6' },
  top:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:11 },
  left:    { flexDirection:'row', alignItems:'center', gap:10 },
  iconBox: { width:32, height:32, borderRadius:10, justifyContent:'center', alignItems:'center' },
  label:   { fontSize:15, fontWeight:'700', color:'#374151' },
  right:   { flexDirection:'row', alignItems:'baseline', gap:3 },
  consumed:{ fontSize:17, fontWeight:'900' },
  target:  { fontSize:13, color:'#6B7280', fontWeight:'600' },
  track:   { height:7, backgroundColor:'#F3F4F6', borderRadius:4, overflow:'hidden' },
  fill:    { height:'100%', borderRadius:4 },
  over:    { fontSize:10, color:'#EF4444', fontWeight:'700', marginTop:6 },
});

export const MacroBarRow = ({ Icon, label, consumed, target, color, bg }: any) => {
  const safe = consumed||0; const safeT = target||1;
  const pct  = Math.min((safe/safeT)*100, 100);
  const over = safe > safeT;
  const anim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(anim, { toValue:pct, duration:900, delay:150, useNativeDriver:false }).start();
  }, [pct]);
  
  const barW = anim.interpolate({ inputRange:[0,100], outputRange:['0%','100%'] });

  return (
    <View style={[mb.card, { backgroundColor:bg }]}>
      <View style={mb.top}>
        <View style={mb.left}>
          <View style={[mb.iconBox,{ backgroundColor:color+'20' }]}><Icon size={16} color={color}/></View>
          <Text style={mb.label}>{label}</Text>
        </View>
        <View style={mb.right}>
          <Text style={[mb.consumed,{ color:over?'#EF4444':color }]}>{Math.round(safe)}გ</Text>
          <Text style={mb.target}>/ {Math.round(safeT)}გ</Text>
        </View>
      </View>
      <View style={mb.track}>
        <Animated.View style={[mb.fill,{ width:barW, backgroundColor:over?'#EF4444':color }]}/>
      </View>
      {over && <Text style={mb.over}>+{Math.round(safe-safeT)}გ გადაჭარბება</Text>}
    </View>
  );
};

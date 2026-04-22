import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Camera, Clock, Flame, Utensils, ChevronRight } from 'lucide-react-native';

const meal_s = StyleSheet.create({
  card:        { flexDirection:'row', alignItems:'center', backgroundColor:'#FFF', borderRadius:20, padding:12, borderWidth:1, borderColor:'#F3F4F6', shadowColor:'#000', shadowOpacity:0.025, shadowRadius:5, elevation:1 },
  timeBox:     { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#F1F5F9', paddingHorizontal:9, paddingVertical:6, borderRadius:10, marginRight:13, borderWidth:1, borderColor:'#E5E7EB' },
  time:        { fontSize:10, fontWeight:'800', color:'#6B7280' },
  info:        { flex:1 },
  name:        { fontSize:15, fontWeight:'700', color:'#0D1117', marginBottom:5 },
  calRow:      { flexDirection:'row', alignItems:'center', gap:4 },
  cals:        { fontSize:13, color:'#EF4444', fontWeight:'900' },
  img:         { width:58, height:58, borderRadius:14, marginLeft:10 },
  imgPlaceholder:{ width:58, height:58, borderRadius:14, backgroundColor:'#F1F5F9', justifyContent:'center', alignItems:'center', marginLeft:10 },
  aiBadge:     { backgroundColor: '#1DB954', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 },
  aiBadgeTxt:  { color: '#FFF', fontSize: 9, fontWeight: 'bold' }
});

export const MealCard = ({ meal, onPress, idx }: any) => {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(12)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue:1, duration:340, delay:idx*60, useNativeDriver:true }),
      Animated.timing(ty, { toValue:0, duration:340, delay:idx*60, useNativeDriver:true }),
    ]).start();
  }, [idx, op, ty]);
  
  const isAI = meal.source === 'ai';

  return (
    <Animated.View style={{ opacity:op, transform:[{ translateY:ty }] }}>
      <TouchableOpacity style={meal_s.card} onPress={onPress} activeOpacity={0.82} disabled={isAI}>
        <View style={meal_s.timeBox}>
          {isAI ? <Camera size={11} color="#1DB954"/> : <Clock size={11} color="#6B7280"/>}
          <Text style={[meal_s.time, isAI && {color: '#1DB954'}]}>{meal.time || 'დღეს'}</Text>
        </View>
        <View style={meal_s.info}>
          <Text style={meal_s.name} numberOfLines={2}>{meal.name}</Text>
          <View style={meal_s.calRow}>
            <Flame size={12} color="#EF4444"/>
            <Text style={meal_s.cals}>{meal.calories} კკალ</Text>
            {isAI && (
              <View style={meal_s.aiBadge}>
                <Text style={meal_s.aiBadgeTxt}>Balansi Scanned</Text>
              </View>
            )}
          </View>
        </View>
        {meal.image_url ? (
          <Image source={{ uri:meal.image_url }} style={meal_s.img} contentFit="cover" transition={200}/>
        ) : (
          <View style={[meal_s.imgPlaceholder, isAI && {backgroundColor: 'rgba(29,185,84,0.14)'}]}>
            {isAI ? <Camera size={20} color="#1DB954"/> : <Utensils size={20} color="#9CA3AF"/>}
          </View>
        )}
        {!isAI && meal.recipe_id && <ChevronRight size={18} color="#9CA3AF" style={{ marginLeft:4 }}/>}
      </TouchableOpacity>
    </Animated.View>
  );
};

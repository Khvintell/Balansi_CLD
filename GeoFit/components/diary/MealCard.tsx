import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Camera, Clock, Flame, Utensils, ChevronRight, Sunrise, Sun, Moon, Coffee } from 'lucide-react-native';

const meal_s = StyleSheet.create({
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: '#F1F5F9', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, 
    shadowRadius: 12, 
    elevation: 2,
    marginBottom: 4
  },
  timeBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: '#F8FAFC', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 12, 
    marginRight: 14, 
    borderWidth: 1, 
    borderColor: '#F1F5F9' 
  },
  time: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: -0.2 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4, letterSpacing: -0.4 },
  calRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cals: { fontSize: 14, color: '#EF4444', fontWeight: '900', letterSpacing: -0.3 },
  img: { width: 64, height: 64, borderRadius: 18, marginLeft: 12 },
  imgPlaceholder: { 
    width: 64, 
    height: 64, 
    borderRadius: 18, 
    backgroundColor: '#F8FAFC', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 12 
  },
  aiBadge: { 
    backgroundColor: 'rgba(29, 185, 84, 0.1)', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 8, 
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.2)'
  },
  aiBadgeTxt: { color: '#1DB954', fontSize: 10, fontWeight: '900', letterSpacing: 0.2 }
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
  
  const isAI = meal.source?.toLowerCase().includes('ai');

  let MealIcon = Clock;
  let iconColor = '#6B7280';
  let bgColor = '#F1F5F9';
  
  if (isAI) {
    MealIcon = Camera;
    iconColor = '#1DB954';
    bgColor = 'rgba(29,185,84,0.14)';
  } else if (meal.time === 'საუზმე') {
    MealIcon = Sunrise;
    iconColor = '#F59E0B';
    bgColor = 'rgba(245,158,11,0.14)';
  } else if (meal.time === 'სადილი') {
    MealIcon = Sun;
    iconColor = '#EF4444';
    bgColor = 'rgba(239,68,68,0.14)';
  } else if (meal.time === 'ვახშამი') {
    MealIcon = Moon;
    iconColor = '#6366F1';
    bgColor = 'rgba(99,102,241,0.14)';
  } else if (meal.time === 'წახემსება') {
    MealIcon = Coffee;
    iconColor = '#10B981';
    bgColor = 'rgba(16,185,129,0.14)';
  }

  return (
    <Animated.View style={{ opacity:op, transform:[{ translateY:ty }] }}>
      <TouchableOpacity style={meal_s.card} onPress={onPress} activeOpacity={0.82} disabled={isAI}>
        <View style={[meal_s.timeBox, { borderColor: bgColor }]}>
          <MealIcon size={11} color={iconColor}/>
          <Text style={[meal_s.time, { color: iconColor }]}>{meal.time || 'დღეს'}</Text>
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
          <View style={[meal_s.imgPlaceholder, { backgroundColor: bgColor }]}>
            <MealIcon size={20} color={iconColor}/>
          </View>
        )}
        {!isAI && meal.recipe_id && <ChevronRight size={18} color="#9CA3AF" style={{ marginLeft:4 }}/>}
      </TouchableOpacity>
    </Animated.View>
  );
};

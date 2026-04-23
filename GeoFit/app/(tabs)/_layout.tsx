import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Animated, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Refrigerator, ShoppingCart, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

import { useThemeStore } from '../../store/useThemeStore';
import { getColors } from '../../config/theme';

// ─── Custom Floating Action Button (FAB) for AI Scanner ───
const ScanButton = ({ children, onPress, C, themeId }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ნაზი პულსაციის ანიმაცია გარშემო (Glow ანიმაცია)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1800, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: Platform.OS !== 'web' }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.92, friction: 4, tension: 60, useNativeDriver: Platform.OS !== 'web' }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: Platform.OS !== 'web' }).start();
  };

  // 🚀 დინამიური ფერები FAB-სთვის
  const isPremium = themeId !== 'standard';
  const outerBg = C.surface; 
  const outerShadow = isPremium ? C.primary : C.primary;
  const pulseBg = isPremium ? C.primaryLight : C.primaryLight;
  const innerBg = C.surfaceMid;
  const innerBorder = isPremium ? C.primary : C.primary;

  return (
    <TouchableOpacity
      style={styles.fabContainer}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        onPress?.(e);
      }}
      activeOpacity={1}
    >
      <Animated.View style={[
        styles.fabOuter, 
        { backgroundColor: outerBg, shadowColor: outerShadow }, 
        { transform: [{ scale: scaleAnim }] }
      ]}>
        
        {/* მანათობელი პულსაცია (Glow) */}
        <Animated.View style={[styles.fabPulse, { backgroundColor: pulseBg }, { transform: [{ scale: pulseAnim }] }]} />
        
        {/* შიდა რგოლი */}
        <View style={[styles.fabInner, { 
          backgroundColor: innerBg, 
          borderColor: innerBorder,
          shadowColor: outerShadow 
        }]}>
          
          <Image 
            source={require('../../material/logo.png')} 
            style={styles.fabLogo} 
            contentFit="contain"
          />

        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── შიდა კომპონენტი, სადაც useThemeStore() მუშაობს ───
export default function TabLayout() {
  const { themeId } = useThemeStore();
  const C = getColors(themeId);

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: C.primary,
      tabBarInactiveTintColor: C.inkLight,
      headerShown: false,
      tabBarShowLabel: true, 
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2, 
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      },
      tabBarStyle: { 
        height: Platform.OS === 'ios' ? 88 : 68,
        paddingBottom: Platform.OS === 'ios' ? 28 : 10, 
        paddingTop: 8,
        backgroundColor: C.surface, 
        borderTopWidth: 1,
        borderTopColor: C.border,
        elevation: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: -6 },
      },
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'მთავარი', 
          tabBarIcon: ({ color, focused }) => <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} /> 
        }} 
      />
      <Tabs.Screen 
        name="fridge" 
        options={{ 
          title: 'მაცივარი', 
          tabBarIcon: ({ color, focused }) => <Refrigerator size={22} color={color} strokeWidth={focused ? 2.5 : 2} /> 
        }} 
      />

      <Tabs.Screen 
        name="scanner" 
        options={{ 
          title: 'სკანერი', 
          tabBarLabel: ({ color }) => (
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.primary, marginTop: 2 }}>
              სკანერი
            </Text>
          ),
          tabBarButton: (props) => <ScanButton {...props} C={C} themeId={themeId} />
        }} 
      />

      <Tabs.Screen 
        name="cart" 
        options={{ 
          title: 'კალათა', 
          tabBarIcon: ({ color, focused }) => <ShoppingCart size={22} color={color} strokeWidth={focused ? 2.5 : 2} /> 
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'პროფილი', 
          tabBarIcon: ({ color, focused }) => <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} /> 
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    top: -24, 
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 80,
  },
  fabOuter: {
    width: 68, 
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 18,
  },
  fabInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3, 
    overflow: 'hidden',
    elevation: 10,
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  fabPulse: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  fabLogo: {
    width: 40, 
    height: 40,
  }
});

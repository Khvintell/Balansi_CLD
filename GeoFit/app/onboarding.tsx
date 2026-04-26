import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView,
  TouchableOpacity, Platform,
  ScrollView, StatusBar, Animated, Dimensions,
  Easing, Alert, Image, Pressable
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeStore } from '../store/useThemeStore';
import { getColors } from '../config/theme';
import * as Haptics from 'expo-haptics';
import {
  Activity, User, Ruler, Weight, Flag,
  ChevronRight, Leaf, TrendingDown,
  Minus, ChevronLeft, TrendingUp,
  Check, CheckCircle
} from 'lucide-react-native';

import { useDiaryStore, GoalType } from '../store/useDiaryStore';
import { FloatingInput } from '../components/onboarding/FloatingInput';
import { GoalCard } from '../components/onboarding/GoalCard';
import { SummaryRow } from '../components/onboarding/SummaryRow';
import { BrandAlert } from '../components/ui/BrandAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SW, height: SH } = Dimensions.get('window');

const TOTAL_STEPS = 5;

/* ═══════════════════════════════════════════════════════════════
   🌌 GRADIENT MESH BACKGROUND — cinematic depth layer
   ═══════════════════════════════════════════════════════════════ */
const GradientMesh = ({ C, step }: any) => {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;
  const stepShift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val: Animated.Value, dur: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(val, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    loop(a1, 7000);
    loop(a2, 9000);
    loop(a3, 11000);
  }, []);

  useEffect(() => {
    Animated.timing(stepShift, {
      toValue: step,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step]);

  const parallax = stepShift.interpolate({
    inputRange: [1, 5],
    outputRange: [0, -60],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Big primary orb — top-left */}
      <Animated.View style={{
        position: 'absolute', width: SW * 1.1, height: SW * 1.1, borderRadius: SW,
        backgroundColor: C.primary + '28', top: -SW * 0.5, left: -SW * 0.3,
        transform: [
          { translateY: Animated.add(parallax, a1.interpolate({ inputRange: [0, 1], outputRange: [0, 40] })) },
          { translateX: a1.interpolate({ inputRange: [0, 1], outputRange: [0, 30] }) },
          { scale: a1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
        ],
      }} />
      {/* Secondary orb — bottom-right (info color) */}
      <Animated.View style={{
        position: 'absolute', width: SW * 0.95, height: SW * 0.95, borderRadius: SW,
        backgroundColor: C.info + '20', bottom: -SW * 0.4, right: -SW * 0.25,
        transform: [
          { translateY: Animated.add(parallax, a2.interpolate({ inputRange: [0, 1], outputRange: [0, -30] })) },
          { translateX: a2.interpolate({ inputRange: [0, 1], outputRange: [0, -25] }) },
          { scale: a2.interpolate({ inputRange: [0, 1], outputRange: [1.1, 1] }) },
        ],
      }} />
      {/* Accent orb — center floating */}
      <Animated.View style={{
        position: 'absolute', width: SW * 0.6, height: SW * 0.6, borderRadius: SW,
        backgroundColor: C.warning + '14', top: SH * 0.3, right: -SW * 0.15,
        transform: [
          { translateY: a3.interpolate({ inputRange: [0, 1], outputRange: [0, 35] }) },
          { translateX: a3.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
        ],
      }} />
      {/* Subtle noise overlay via thin tinted layer */}
      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.35)' }} />
    </View>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ✨ CONFETTI BURST — fires once when reaching final step
   ═══════════════════════════════════════════════════════════════ */
const Confetti = ({ active, C }: any) => {
  const PIECES = 24;
  const pieces = useRef(
    Array.from({ length: PIECES }).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      r: new Animated.Value(0),
      o: new Animated.Value(0),
      angle: Math.random() * Math.PI * 2,
      dist: 120 + Math.random() * 180,
      color: [C.primary, C.info, C.warning, C.danger, '#FFD93D'][Math.floor(Math.random() * 5)],
      size: 6 + Math.random() * 8,
      delay: Math.random() * 200,
    }))
  ).current;

  useEffect(() => {
    if (!active) return;
    pieces.forEach((p) => {
      const dx = Math.cos(p.angle) * p.dist;
      const dy = Math.sin(p.angle) * p.dist - 80;
      p.x.setValue(0); p.y.setValue(0); p.r.setValue(0); p.o.setValue(0);
      Animated.parallel([
        Animated.timing(p.o, { toValue: 1, duration: 100, delay: p.delay, useNativeDriver: true }),
        Animated.timing(p.x, { toValue: dx, duration: 1400, delay: p.delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(p.y, { toValue: dy + 200, duration: 1400, delay: p.delay, easing: Easing.bezier(0.2, 0.6, 0.4, 1), useNativeDriver: true }),
        Animated.timing(p.r, { toValue: 1, duration: 1400, delay: p.delay, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(900 + p.delay),
          Animated.timing(p.o, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, [active]);

  if (!active) return null;
  return (
    <View style={{ position: 'absolute', top: SH * 0.35, left: SW / 2, width: 0, height: 0, zIndex: 50 }} pointerEvents="none">
      {pieces.map((p, i) => (
        <Animated.View key={i} style={{
          position: 'absolute',
          width: p.size, height: p.size * 0.4,
          backgroundColor: p.color,
          borderRadius: 2,
          opacity: p.o,
          transform: [
            { translateX: p.x },
            { translateY: p.y },
            { rotate: p.r.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] }) },
          ],
        }} />
      ))}
    </View>
  );
};

/* ═══════════════════════════════════════════════════════════════
   🔢 ANIMATED NUMBER — counts up from 0 to target
   ═══════════════════════════════════════════════════════════════ */
const AnimatedNumber = ({ value, style, duration = 1500 }: any) => {
  const [display, setDisplay] = useState(0);
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animVal.setValue(0);
    const id = animVal.addListener(({ value: v }) => {
      setDisplay(Math.round(v * value));
    });
    Animated.timing(animVal, {
      toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
    return () => animVal.removeListener(id);
  }, [value]);

  return <Text style={style}>{display}</Text>;
};

/* ═══════════════════════════════════════════════════════════════
   📝 WORD-BY-WORD REVEAL — cinematic title intro
   ═══════════════════════════════════════════════════════════════ */
const WordReveal = ({ text, style, delay = 0, stagger = 80 }: any) => {
  const words = text.split(' ');
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
      {words.map((w: string, i: number) => {
        const op = useRef(new Animated.Value(0)).current;
        const ty = useRef(new Animated.Value(20)).current;
        useEffect(() => {
          Animated.parallel([
            Animated.timing(op, { toValue: 1, duration: 500, delay: delay + i * stagger, useNativeDriver: true }),
            Animated.timing(ty, { toValue: 0, duration: 600, delay: delay + i * stagger, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
          ]).start();
        }, []);
        return (
          <Animated.Text key={i} style={[style, { opacity: op, transform: [{ translateY: ty }] }]}>
            {w}{i < words.length - 1 ? ' ' : ''}
          </Animated.Text>
        );
      })}
    </View>
  );
};

/* ═══════════════════════════════════════════════════════════════
   🎭 BEFORE / AFTER VISUAL HOOK — transformation hint
   ═══════════════════════════════════════════════════════════════ */
const BeforeAfterHero = ({ C, S }: any) => {
  const beforeOp = useRef(new Animated.Value(0)).current;
  const afterOp = useRef(new Animated.Value(0)).current;
  const arrow = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const ringPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(beforeOp, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(arrow, { toValue: 1, duration: 500, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.timing(afterOp, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.timing(ringPulse, {
      toValue: 1, duration: 2400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    })).start();
  }, []);

  return (
    <View style={S.heroBeforeAfter}>
      {/* Pulse ring behind "after" */}
      <Animated.View style={[S.heroRingPulse, {
        opacity: ringPulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
        transform: [{ scale: ringPulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.6] }) }],
        borderColor: C.primary,
      }]} />

      {/* BEFORE card */}
      <Animated.View style={[S.transformCard, S.transformBefore, {
        opacity: beforeOp,
        transform: [
          { translateY: Animated.multiply(float, -6) },
          { scale: beforeOp },
        ],
      }]}>
        <View style={[S.transformBadge, { backgroundColor: '#F1F5F9' }]}>
          <Text style={[S.transformBadgeTxt, { color: '#64748B' }]}>დღეს</Text>
        </View>
        <Text style={S.transformEmoji}>😕</Text>
        <Text style={S.transformLabel}>გაურკვევლობა</Text>
        <View style={S.transformBar}>
          <View style={[S.transformBarFill, { width: '35%', backgroundColor: '#94A3B8' }]} />
        </View>
      </Animated.View>

      {/* Arrow */}
      <Animated.View style={[S.heroArrow, {
        opacity: arrow,
        transform: [{ scale: arrow }, { translateX: Animated.multiply(float, 3) }],
      }]}>
        <TrendingUp size={20} color={C.primary} fill={C.primary} />
      </Animated.View>

      {/* AFTER card */}
      <Animated.View style={[S.transformCard, S.transformAfter, {
        opacity: afterOp,
        borderColor: C.primary,
        transform: [
          { translateY: Animated.multiply(float, 6) },
          { scale: afterOp },
        ],
      }]}>
        <View style={[S.transformBadge, { backgroundColor: C.primary }]}>
          <Text style={[S.transformBadgeTxt, { color: '#FFF' }]}>{'30'} დღე</Text>
        </View>
        <Text style={S.transformEmoji}>💪</Text>
        <Text style={[S.transformLabel, { color: C.primaryDark, fontWeight: '900' }]}>კონტროლი</Text>
        <View style={S.transformBar}>
          <View style={[S.transformBarFill, { width: '92%', backgroundColor: C.primary }]} />
        </View>
      </Animated.View>
    </View>
  );
};

/* ═══════════════════════════════════════════════════════════════
   💎 GLASS CARD — reusable glassmorphism container
   ═══════════════════════════════════════════════════════════════ */
const GlassCard = ({ children, style, C }: any) => (
  <View style={[{
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 28,
    shadowColor: C.ink,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  }, style]}>
    {children}
  </View>
);

/* ═══════════════════════════════════════════════════════════════
   🎯 MACRO CHIP — animated reveal with progress ring
   ═══════════════════════════════════════════════════════════════ */
const MacroChip = ({ label, value, color, bg, delay, mr }: any) => {
  const op = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(0.6)).current;
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
      Animated.spring(sc, { toValue: 1, delay, friction: 6, tension: 120, useNativeDriver: true }),
      Animated.timing(fill, { toValue: 1, duration: 1200, delay: delay + 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[mr.chip, { backgroundColor: bg, opacity: op, transform: [{ scale: sc }] }]}>
      <Text style={[mr.val, { color }]}>{value}<Text style={mr.unit}>გ</Text></Text>
      <Text style={mr.label}>{label}</Text>
      <View style={mr.barTrack}>
        <Animated.View style={[mr.barFill, {
          backgroundColor: color,
          width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }]} />
      </View>
    </Animated.View>
  );
};

const getMrStyles = (C: any) => StyleSheet.create({
  chip: {
    flex: 1, alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8,
    borderRadius: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  val: { fontSize: 22, fontWeight: '900', marginBottom: 3 },
  unit: { fontSize: 13, fontWeight: '800' },
  label: { fontSize: 10, color: C.inkMid, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  barTrack: { width: '100%', height: 4, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
});

/* ═══════════════════════════════════════════════════════════════
   🚀 MAIN SCREEN
   ═══════════════════════════════════════════════════════════════ */
export default function OnboardingScreen() {
  const { themeId } = useThemeStore();
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const mr = React.useMemo(() => getMrStyles(C), [C]);
  const S = React.useMemo(() => getSStyles(C, SH), [C]);

  const router = useRouter();
  const { isEdit } = useLocalSearchParams();
  const isEditMode = isEdit === 'true';

  const { profile, setProfile } = useDiaryStore();

  const [name, setName] = useState(profile?.name || '');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [height, setHeight] = useState(profile?.height ? String(profile.height) : '');
  const [weight, setWeight] = useState(profile?.weight ? String(profile.weight) : '');
  const [targetWeight, setTargetWeight] = useState(profile?.targetWeight ? String(profile.targetWeight) : '');
  const [goal, setGoal] = useState<GoalType>(profile?.goal || 'lose');

  const [step, setStep] = useState(isEditMode ? 3 : 1);
  const [alertS, setAlertS] = useState<any>({ visible: false, type: 'info', title: '', message: '' });

  // ── Animation values ─────────────────────────────────
  const btnPulse = useRef(new Animated.Value(1)).current;
  const btnGlow = useRef(new Animated.Value(0)).current;
  const stepOpac = useRef(new Animated.Value(1)).current;
  const stepSlide = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(step)).current;

  // Button breathing pulse
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(btnPulse, { toValue: 1.025, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(btnPulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(btnGlow, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(btnGlow, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ])).start();
  }, []);

  // Animate progress bar fill smoothly when step changes
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: step, friction: 8, tension: 60, useNativeDriver: false,
    }).start();
  }, [step]);

  // ── Logic preserved exactly ──────────────────────────
  const calcResults = () => {
    const a = parseFloat(age) || 25, h = parseFloat(height) || 170, w = parseFloat(weight) || 70, tw = parseFloat(targetWeight) || 65;
    const bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
    const tdee = bmr * 1.375;
    let targetCals = tdee;
    if (goal === 'lose') targetCals -= (w - tw) >= 10 ? 700 : 500;
    else if (goal === 'gain') targetCals += 400;
    const protein = Math.round((goal === 'lose' ? tw : w) * 2.0);
    const fats = Math.round((targetCals * 0.25) / 9);
    const carbs = Math.round((targetCals - (protein * 4) - (fats * 9)) / 4);

    const fullProfile = {
      name,
      age: a,
      height: h,
      weight: w,
      targetWeight: tw,
      goal,
      targetCalories: Math.round(targetCals),
      macros: { protein, carbs, fats },
      isVerified: true,
      avatar: '🧔🏻‍♂️',
      badges: ['beginner'],
      totalXP: 0,
      streak: 1,
      loginDates: [new Date().toISOString().split('T')[0]],
      lastLoginDate: Date.now()
    };

    return { calories: Math.round(targetCals), protein, carbs, fats, bmr, tdee, water: Math.round(w * 33), fullProfile };
  };

  const saveAndFinish = async () => {
    const r = calcResults();
    try {
      setProfile(r.fullProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(r.fullProfile));
      await AsyncStorage.setItem('weightHistory', JSON.stringify([r.fullProfile.weight]));
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      isEditMode ? router.back() : router.replace('/(tabs)');
    } catch (e) {
      console.error("Failed to save profile:", e);
      Alert.alert('შეცდომა', 'მონაცემები ვერ შეინახა.');
    }
  };

  // ── Smooth step transition (slide + fade) ────────────
  const transitionToStep = useCallback((newStep: number, direction: 1 | -1) => {
    Animated.parallel([
      Animated.timing(stepOpac, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(stepSlide, { toValue: -30 * direction, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(() => {
      setStep(newStep);
      stepSlide.setValue(30 * direction);
      Animated.parallel([
        Animated.timing(stepOpac, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(stepSlide, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const goBack = () => {
    if (step === 1 || (isEditMode && step === 3)) {
      if (isEditMode) router.back();
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    transitionToStep(step - 1, -1);
  };

  const goNext = () => {
    if (step === 2 && !name.trim()) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (step === 3 && (!age || !height || !weight || !targetWeight)) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (step === 5) { saveAndFinish(); return; }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    transitionToStep(step + 1, 1);
  };

  const renderStep = () => {
    const hParsed = parseFloat(height);
    const wParsed = parseFloat(weight);
    const bmi = (!isNaN(hParsed) && !isNaN(wParsed) && hParsed > 0) ? (wParsed / Math.pow(hParsed / 100, 2)).toFixed(1) : null;
    const idealW = !isNaN(hParsed) && hParsed > 0 ? Math.round(24.8 * Math.pow(hParsed / 100, 2)) : null;

    switch (step) {
      /* ─────────── STEP 1 — WELCOME (Before/After hook) ─────────── */
      case 1: return (
        <View style={S.stepWrap}>
          <BeforeAfterHero C={C} S={S} />

          <View style={S.welcomeTextWrap}>
            <View style={S.brandBadge}>
              <Leaf size={13} color={C.primaryDark} />
              <Text style={S.brandBadgeTxt}>BALANSI · AI-NUTRITION</Text>
              <View style={S.brandBadgeDot} />
            </View>

            <WordReveal
              text="აღმოაჩინე შენი საუკეთესო ფორმა."
              style={S.welcomeTitle}
              delay={200}
              stagger={120}
            />

            <Text style={S.welcomeSub}>
              მიიღე შენს სხეულზე მორგებული, ზუსტი კვების გეგმა{' '}
              <Text style={{ color: C.primaryDark, fontWeight: '900' }}>30 წამში</Text>.
            </Text>
          </View>
        </View>
      );

      /* ─────────── STEP 2 — NAME ─────────── */
      case 2: return (
        <View style={S.stepWrap}>
          <View style={S.stepHeroSmall}>
            <View style={[S.stepEmojiBg, { backgroundColor: C.primaryLight }]}>
              <Text style={S.stepEmoji}>👋</Text>
              <View style={[S.stepEmojiHalo, { borderColor: C.primary + '40' }]} />
            </View>
          </View>
          <Text style={S.stepLabel}>გავიცნოთ ერთმანეთი</Text>
          <Text style={S.stepTitle}>როგორ მოგმართოთ?</Text>
          <Text style={S.stepSub}>შენი სახელი დაგვეხმარება პერსონალური გამოცდილების შექმნაში</Text>
          <View style={{ marginTop: 8 }}>
            <FloatingInput placeholder="მაგ: გიორგი" value={name} onChangeText={setName} icon={User} color={C.primary} autoFocus />
          </View>
        </View>
      );

      /* ─────────── STEP 3 — BODY METRICS ─────────── */
      case 3: return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.stepWrap} keyboardShouldPersistTaps="handled">
          <View style={S.stepHeroSmall}>
            <View style={[S.stepEmojiBg, { backgroundColor: C.infoBg }]}>
              <Text style={S.stepEmoji}>📏</Text>
              <View style={[S.stepEmojiHalo, { borderColor: C.info + '40' }]} />
            </View>
          </View>
          <Text style={S.stepLabel}>ბიჯი 1 — სხეულის მონაცემები</Text>
          <Text style={S.stepTitle}>გვითხარი შენ შესახებ</Text>
          <Text style={S.stepSub}>ეს მონაცემები ჩვენ შორისაა და უსაფრთხოდ ინახება</Text>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <View style={{ flex: 1 }}><FloatingInput label="ასაკი" placeholder="24" value={age} onChangeText={setAge} keyboardType="numeric" icon={Activity} color={C.info} unit="წ" /></View>
            <View style={{ flex: 1 }}><FloatingInput label="სიმაღლე" placeholder="175" value={height} onChangeText={setHeight} keyboardType="numeric" icon={Ruler} color={C.primary} unit="სმ" /></View>
          </View>
          <FloatingInput label="ამჟამინდელი წონა" placeholder="75" value={weight} onChangeText={setWeight} keyboardType="numeric" icon={Weight} color={C.warning} unit="კგ" />
          <FloatingInput label="სამიზნე წონა" placeholder="68" value={targetWeight} onChangeText={setTargetWeight} keyboardType="numeric" icon={Flag} color={C.primary} unit="კგ" />

          {bmi && (
            <GlassCard C={C} style={S.bmiCard}>
              <View style={S.bmiLeft}>
                <Text style={S.bmiTitle}>BMI ინდექსი</Text>
                <Text style={[S.bmiValue, { color: parseFloat(bmi) < 18.5 || parseFloat(bmi) >= 30 ? C.danger : C.primary }]}>{bmi}</Text>
                <View style={[S.bmiPill, { backgroundColor: parseFloat(bmi) < 18.5 || parseFloat(bmi) >= 30 ? C.dangerBg : C.primaryLight }]}>
                  <Text style={[S.bmiPillTxt, { color: parseFloat(bmi) < 18.5 || parseFloat(bmi) >= 30 ? C.danger : C.primaryDark }]}>
                    {parseFloat(bmi) < 18.5 ? 'დაბალი' : parseFloat(bmi) < 25 ? 'ნორმალური' : parseFloat(bmi) < 30 ? 'მაღალი' : 'რისკი'}
                  </Text>
                </View>
              </View>
              <View style={S.bmiRight}>
                <Text style={S.idealLabel}>იდეალური წონა</Text>
                <Text style={S.idealValue}>{idealW}<Text style={{ fontSize: 14, fontWeight: '800' }}> კგ</Text></Text>
                <View style={S.idealBar}>
                  <View style={[S.idealBarFill, { width: '100%', backgroundColor: C.primary }]} />
                </View>
              </View>
            </GlassCard>
          )}
        </ScrollView>
      );

      /* ─────────── STEP 4 — GOAL ─────────── */
      case 4: return (
        <View style={S.stepWrap}>
          <View style={S.stepHeroSmall}>
            <View style={[S.stepEmojiBg, { backgroundColor: C.warningBg }]}>
              <Text style={S.stepEmoji}>🎯</Text>
              <View style={[S.stepEmojiHalo, { borderColor: C.warning + '40' }]} />
            </View>
          </View>
          <Text style={S.stepLabel}>ბიჯი 2 — შენი მისია</Text>
          <Text style={S.stepTitle}>რა არის მთავარი მიზანი?</Text>
          <Text style={S.stepSub}>აირჩიე ერთი — სხვა დროს ყოველთვის შეცვლი</Text>

          <View style={{ marginTop: 8 }}>
            <GoalCard icon={TrendingDown} label="წონის კლება" desc="ცხიმის წვა და კალორიული დეფიციტი" color={C.info} bg={C.infoBg} border="#BFDBFE" selected={goal === 'lose'} onPress={() => { setGoal('lose'); if (Platform.OS !== 'web') Haptics.selectionAsync(); }} />
            <GoalCard icon={Minus} label="შენარჩუნება" desc="არსებული ფორმის და ენერგიის ბალანსი" color={C.primary} bg={C.primaryLight} border={C.primaryBorder} selected={goal === 'maintain'} onPress={() => { setGoal('maintain'); if (Platform.OS !== 'web') Haptics.selectionAsync(); }} />
            <GoalCard icon={TrendingUp} label="კუნთის მასა" desc="ძალის მატება და ჯანსაღი ზრდა" color={C.danger} bg={C.dangerBg} border="#FECACA" selected={goal === 'gain'} onPress={() => { setGoal('gain'); if (Platform.OS !== 'web') Haptics.selectionAsync(); }} />
          </View>
        </View>
      );

      /* ─────────── STEP 5 — RESULTS (Hero + counter + confetti) ─────────── */
      case 5: {
        const r = calcResults();
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.stepWrap}>
            <View style={S.stepHeroSmall}>
              <View style={[S.stepEmojiBg, { backgroundColor: C.primaryLight }]}>
                <Text style={S.stepEmoji}>✨</Text>
                <View style={[S.stepEmojiHalo, { borderColor: C.primary + '60' }]} />
              </View>
            </View>

            <View style={S.successBadge}>
              <Check size={12} color="#FFF" strokeWidth={3.5} />
              <Text style={S.successBadgeTxt}>ანალიზი დასრულებულია</Text>
            </View>

            <Text style={S.stepTitle}>{name ? `მზადაა, ${name}!` : 'შენი გეგმა მზადაა!'}</Text>
            <Text style={S.stepSub}>AI-მა შენს მონაცემებზე დაყრდნობით შექმნა ოპტიმალური გეგმა</Text>

            {/* Hero calorie card */}
            <View style={S.calHero}>
              <View style={S.calHeroBg1} />
              <View style={S.calHeroBg2} />
              <View style={S.calHeroGrid} />

              <View style={S.calHeroTopRow}>
                <View style={S.calHeroTopBadge}>
                  <View style={S.calHeroLiveDot} />
                  <Text style={S.calHeroTopBadgeTxt}>დღიური ლიმიტი</Text>
                </View>
                <Text style={S.calHeroGoal}>
                  {goal === 'lose' ? '↓ კლება' : goal === 'gain' ? '↑ ზრდა' : '= ბალანსი'}
                </Text>
              </View>

              <View style={S.calHeroNumWrap}>
                <AnimatedNumber value={r.calories} style={S.calHeroNum} duration={1600} />
                <Text style={S.calHeroUnit}>კკალ</Text>
              </View>

              <View style={S.calHeroBottom}>
                <Text style={S.calHeroBottomTxt}>ოპტიმიზებულია AI-ით · განახლებადია</Text>
              </View>
            </View>

            {/* Macros */}
            <View style={S.macroRow}>
              <MacroChip mr={mr} label="ცილა" value={r.protein} color={C.info} bg={C.infoBg} delay={200} />
              <MacroChip mr={mr} label="ნახშირწყ." value={r.carbs} color={C.warning} bg={C.warningBg} delay={350} />
              <MacroChip mr={mr} label="ცხიმი" value={r.fats} color={C.danger} bg={C.dangerBg} delay={500} />
            </View>

            {/* Detailed summary */}
            <GlassCard C={C} style={S.summaryCard}>
              <SummaryRow emoji="💧" label="წყლის ნორმა" value={`${(r.water / 1000).toFixed(1)} ლიტრი`} desc="ჰიდრატაცია მეტაბოლიზმისთვის" />
              <SummaryRow emoji="🔥" label="ბაზალური წვა (BMR)" value={`${Math.round(r.bmr)} კკალ`} desc="ენერგია, რასაც სხეული მოსვენებისას წვავს" />
              <SummaryRow emoji="⚡" label="დღიური ხარჯი (TDEE)" value={`${Math.round(r.tdee)} კკალ`} desc="სრული ხარჯი აქტივობით" />
              <SummaryRow emoji="⚖️" label="BMI სტატუსი" value={bmi} desc="სხეულის მასის ინდექსი" noBorder />
            </GlassCard>
          </ScrollView>
        );
      }
      default: return null;
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [1, TOTAL_STEPS],
    outputRange: ['20%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* 🌌 Cinematic gradient mesh */}
      <GradientMesh C={C} step={step} />

      {/* ✨ Confetti only on final step */}
      <Confetti active={step === 5} C={C} />

      <SafeAreaView style={S.safe}>
        {/* ═══════ TOP BAR ═══════ */}
        <View style={S.topBar}>
          <Pressable onPress={goBack} style={({ pressed }) => [S.backBtn, pressed && { opacity: 0.6, transform: [{ scale: 0.94 }] }]}>
            <ChevronLeft size={22} color={C.ink} />
          </Pressable>

          <View style={S.topBarCenter}>
            <View style={S.topBarLogoWrap}>
              <Image source={require('../material/logo.png')} style={{ width: 14, height: 14, marginRight: 6 }} resizeMode="contain" />
              <Text style={S.topBarLogoTxt}>BALANSI</Text>
            </View>
            {/* Smooth single-bar progress */}
            <View style={S.progressTrack}>
              <Animated.View style={[S.progressFill, { width: progressWidth, backgroundColor: C.primary }]}>
                <View style={S.progressShine} />
              </Animated.View>
            </View>
          </View>

          <View style={S.stepCountBadge}>
            <Text style={S.stepCountTxt}>{step}<Text style={{ color: C.inkLight }}>/{TOTAL_STEPS}</Text></Text>
          </View>
        </View>

        {/* ═══════ CONTENT (animated) ═══════ */}
        <Animated.View style={[S.contentArea, {
          opacity: stepOpac,
          transform: [{ translateX: stepSlide }],
        }]}>
          {renderStep()}
        </Animated.View>

        {/* ═══════ BOTTOM BAR ═══════ */}
        <View style={S.bottomBar}>
          <Animated.View style={{ transform: [{ scale: btnPulse }] }}>
            {/* Glow halo behind button */}
            <Animated.View style={[S.btnGlow, {
              backgroundColor: step === 5 ? C.primary : C.ink,
              opacity: btnGlow.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.35] }),
              transform: [{ scale: btnGlow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
            }]} />
            <Pressable
              style={({ pressed }) => [
                S.nextBtn,
                { backgroundColor: step === 5 ? C.primary : C.ink },
                pressed && { transform: [{ scale: 0.97 }] }
              ]}
              onPress={goNext}
            >
              {step === 5 && <CheckCircle size={18} color="#FFF" />}
              <Text style={S.nextBtnTxt}>
                {step === 1 ? 'დაიწყე ახლავე' : step === 5 ? 'გეგმის გააქტიურება' : 'შემდეგი'}
              </Text>
              {step !== 5 && <ChevronRight size={20} color="#FFF" />}
            </Pressable>
          </Animated.View>

          {step === 1 && (
            <Text style={S.bottomHint}>30 წამი · უფასო · ქართულად</Text>
          )}
        </View>
      </SafeAreaView>

      <BrandAlert state={alertS} onClose={() => setAlertS((p: any) => ({ ...p, visible: false }))} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════
   🎨 STYLES
   ═══════════════════════════════════════════════════════════════ */
const getSStyles = (C: any, SH: number) => StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F7FB' },
  safe: { flex: 1 },

  // ── Top bar ───────────────────────────────────────
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 10,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: C.ink, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  topBarCenter: { flex: 1, marginHorizontal: 14, alignItems: 'center' },
  topBarLogoWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  topBarLogoTxt: { fontWeight: '900', fontSize: 11, color: C.ink, letterSpacing: 1.8 },

  progressTrack: {
    width: '100%', height: 5,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 4,
    overflow: 'hidden',
  },
  progressShine: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    width: 18, backgroundColor: 'rgba(255,255,255,0.55)',
  },

  stepCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6,
  },
  stepCountTxt: { fontSize: 13, fontWeight: '900', color: C.ink },

  // ── Content area ──────────────────────────────────
  contentArea: { flex: 1 },
  stepWrap: { paddingHorizontal: 24, paddingBottom: 30, paddingTop: 8, flexGrow: 1 },

  // ── Step 1: Welcome ───────────────────────────────
  heroBeforeAfter: {
    height: 240,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
    position: 'relative',
  },
  heroRingPulse: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 2,
    right: 4,
  },
  transformCard: {
    width: 130, height: 175,
    borderRadius: 28,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    shadowColor: C.ink, shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  transformBefore: {
    transform: [{ rotate: '-4deg' }],
    marginRight: -10,
    opacity: 0.92,
  },
  transformAfter: {
    transform: [{ rotate: '4deg' }],
    marginLeft: -10,
    borderWidth: 2,
  },
  transformBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 100,
  },
  transformBadgeTxt: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  transformEmoji: { fontSize: 48 },
  transformLabel: { fontSize: 13, fontWeight: '800', color: C.inkMid },
  transformBar: {
    width: '100%', height: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 3, overflow: 'hidden',
  },
  transformBarFill: { height: '100%', borderRadius: 3 },

  heroArrow: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 5,
  },

  welcomeTextWrap: { alignItems: 'center', paddingHorizontal: 8 },
  brandBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
    marginBottom: 22,
    shadowColor: C.primary, shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  brandBadgeTxt: { fontSize: 11, fontWeight: '900', color: C.primaryDark, letterSpacing: 0.8 },
  brandBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },

  welcomeTitle: {
    fontSize: 36, fontWeight: '900', color: '#0A0A0A',
    textAlign: 'center', lineHeight: 44, letterSpacing: -1,
  },
  welcomeSub: {
    fontSize: 15.5, color: C.inkMid, lineHeight: 23,
    fontWeight: '600', marginTop: 14, textAlign: 'center',
    paddingHorizontal: 12,
  },

  // ── Steps 2-5: small hero ─────────────────────────
  stepHeroSmall: { alignItems: 'center', marginBottom: 22, marginTop: 6 },
  stepEmojiBg: {
    width: 80, height: 80, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: C.ink, shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
  },
  stepEmojiHalo: {
    position: 'absolute', width: 100, height: 100, borderRadius: 30,
    borderWidth: 2,
  },
  stepEmoji: { fontSize: 38 },
  stepLabel: {
    fontSize: 11, fontWeight: '900', color: C.primaryDark,
    textAlign: 'center', textTransform: 'uppercase',
    letterSpacing: 1.2, marginBottom: 8,
  },
  stepTitle: {
    fontSize: 28, fontWeight: '900', color: '#0A0A0A',
    textAlign: 'center', marginBottom: 8, letterSpacing: -0.6,
  },
  stepSub: {
    fontSize: 14, color: C.inkMid, fontWeight: '600',
    textAlign: 'center', lineHeight: 20, marginBottom: 22,
    paddingHorizontal: 12,
  },

  // ── BMI card ──────────────────────────────────────
  bmiCard: {
    flexDirection: 'row', padding: 20, marginTop: 16,
  },
  bmiLeft: { flex: 1, borderRightWidth: 1, borderRightColor: 'rgba(0,0,0,0.06)', paddingRight: 16 },
  bmiTitle: { fontSize: 10, fontWeight: '900', color: C.inkLight, textTransform: 'uppercase', letterSpacing: 0.8 },
  bmiValue: { fontSize: 34, fontWeight: '900', marginTop: 6, letterSpacing: -1 },
  bmiPill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 100, marginTop: 6 },
  bmiPillTxt: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  bmiRight: { flex: 1, paddingLeft: 18, justifyContent: 'center' },
  idealLabel: { fontSize: 10, fontWeight: '900', color: C.inkLight, textTransform: 'uppercase', letterSpacing: 0.8 },
  idealValue: { fontSize: 26, fontWeight: '900', color: C.ink, marginTop: 6, letterSpacing: -0.5 },
  idealBar: { height: 4, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  idealBarFill: { height: '100%', borderRadius: 3 },

  // ── Step 5: Calorie hero ──────────────────────────
  successBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center',
    backgroundColor: C.primary,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 100, marginBottom: 14,
    shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  successBadgeTxt: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },

  calHero: {
    borderRadius: 32, padding: 26, paddingVertical: 30,
    marginTop: 14, marginBottom: 18,
    backgroundColor: '#0A0A0A',
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  calHeroBg1: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: C.primary + '40', top: -100, right: -80 },
  calHeroBg2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: C.info + '25', bottom: -60, left: -30 },
  calHeroGrid: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.02)' },

  calHeroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  calHeroTopBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  calHeroLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
  calHeroTopBadgeTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
  calHeroGoal: { color: C.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

  calHeroNumWrap: { alignItems: 'center', marginVertical: 4 },
  calHeroNum: { fontSize: 76, fontWeight: '900', color: '#FFF', letterSpacing: -3, lineHeight: 80 },
  calHeroUnit: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.5 },

  calHeroBottom: {
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  calHeroBottomTxt: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '700', letterSpacing: 0.3 },

  macroRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },

  summaryCard: { padding: 18, marginBottom: 16 },

  // ── Bottom bar / button ──────────────────────────
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 22,
    paddingTop: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  btnGlow: {
    position: 'absolute', top: 6, left: 6, right: 6, bottom: 0,
    borderRadius: 32,
  },
  nextBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    paddingVertical: 19, borderRadius: 32,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  nextBtnTxt: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },
  bottomHint: {
    textAlign: 'center', marginTop: 12,
    fontSize: 11, color: C.inkLight, fontWeight: '700',
    letterSpacing: 0.5,
  },
});

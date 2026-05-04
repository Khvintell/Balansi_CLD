import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform,
  StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import { useThemeStore } from '../store/useThemeStore';
import { getColors } from '../config/theme';
import {
  ArrowLeft, Droplet, Wheat,
  RefreshCcw, Utensils, Flame, Plus,
} from 'lucide-react-native';

import { useDiaryStore } from '../store/useDiaryStore';
import { BrandAlert, BAlertState } from '../components/ui/BrandAlert';
import { MacroBarRow } from '../components/diary/MacroBarRow';
import { MealCard } from '../components/diary/MealCard';
import Reanimated, { 
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate, Easing as REasing
} from 'react-native-reanimated';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   AppearAnimated — Staggered entry animation
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const AppearAnimated = ({ children, index = 0, delay = 0, style }: { children: React.ReactNode, index?: number, delay?: number, style?: any }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.delay(delay + (index * 60)).start(() => {
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
        Animated.spring(slide, { toValue: 0, friction: 9, tension: 35, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    });
  }, []);

  return (
    <Animated.View style={[{ opacity: fade, transform: [{ translateY: slide }] }, style]}>
      {children}
    </Animated.View>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Section header — refined, less heavy
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const SectionHdr = ({ title, sub, sh }: { title: string; sub?: string; sh: any }) => (
  <View style={sh.w}>
    <Text style={sh.title}>{title}</Text>
    {sub && <Text style={sh.sub}>{sub}</Text>}
  </View>
);
const getShStyles = (C: any) => StyleSheet.create({
  w: { marginBottom: 14, marginTop: 4 },
  title: { fontSize: 17, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: C.inkLight, fontWeight: '500', marginTop: 3, letterSpacing: -0.1 },
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ProgressRing — clean SVG ring
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const ProgressRing = ({
  pct, size = 96, stroke = 8, color, trackColor, children,
}: {
  pct: number; size?: number; stroke?: number;
  color: string; trackColor: string; children?: React.ReactNode;
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * (Math.min(pct, 100) / 100);
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </Svg>
      {children}
    </View>
  );
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN SCREEN
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function DiaryScreen() {
  const { themeId } = useThemeStore();
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const sh = React.useMemo(() => getShStyles(C), [C]);
  const D = React.useMemo(() => getDStyles(C), [C]);

  const router = useRouter();
  const { profile, intake, resetDay } = useDiaryStore();
  const [loading, setLoading] = useState(true);
  const [alertS, setAlertS] = useState<BAlertState>({ visible: false, type: 'success', title: '', message: '' });

  const glowAnim = useSharedValue(0.08);

  useEffect(() => {
    glowAnim.value = withRepeat(
      withTiming(0.14, { duration: 3000, easing: REasing.inOut(REasing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
    transform: [{ scale: interpolate(glowAnim.value, [0.08, 0.14], [1, 1.1]) }],
  }));

  useFocusEffect(useCallback(() => {
    setLoading(false);
  }, []));

  const showAlert = (type: any, title: string, message: string, actions?: any[]) =>
    setAlertS({ visible: true, type, title, message, actions });

  const handleResetDay = () => {
    showAlert('warning', 'დღის გასუფთავება', 'დარწმუნებული ხართ, რომ გსურთ დღის მონაცემების წაშლა?', [
      { label: 'გაუქმება', onPress: () => { } },
      {
        label: 'გასუფთავება',
        onPress: () => {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          const today = new Date().toISOString().split('T')[0];
          resetDay(today);
          setTimeout(() => {
            showAlert('success', 'წარმატება', 'დღიური წარმატებით გასუფთავდა.');
          }, 100);
        },
        primary: true,
      },
    ]);
  };

  if (loading) return (
    <SafeAreaView style={[D.center, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 }]} edges={['top']}>
      <ActivityIndicator size="small" color={C.primary} />
      <Text style={D.loadTxt}>იტვირთება...</Text>
    </SafeAreaView>
  );

  const tCals = profile?.targetCalories || 2000;
  const tProt = profile?.macros?.protein || 100;
  const tCarb = profile?.macros?.carbs || 200;
  const tFat = profile?.macros?.fats || 60;

  const todayStr = new Date().toISOString().split('T')[0];
  const dayIntake = intake[todayStr] || { calories: 0, protein: 0, carbs: 0, fats: 0, meals: [] };

  const calPct = Math.min((dayIntake.calories / tCals) * 100, 100);
  const calsLeft = tCals - dayIntake.calories;
  const isOver = calsLeft < 0;
  const todayRaw = new Date().toLocaleDateString('ka-GE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={[D.root, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 }]} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surfaceAlt} />

      <AppearAnimated index={0}>
        <View style={D.hdr}>
          <TouchableOpacity onPress={() => router.back()} style={D.hdrBtn} activeOpacity={0.7}>
            <ArrowLeft size={20} color={C.ink} strokeWidth={2.2} />
          </TouchableOpacity>

          <View style={D.hdrCenter}>
            <Text style={D.hdrTitle}>დღიური</Text>
            <Text style={D.hdrDate}>{todayRaw}</Text>
          </View>

          <TouchableOpacity 
            onPress={handleResetDay} 
            style={D.hdrBtn} 
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <RefreshCcw size={20} color={C.inkLight} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </AppearAnimated>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={D.scroll}
      >
        <AppearAnimated index={1}>
          <View style={D.hero}>
            <Reanimated.View style={[D.heroGlow, animatedGlow]} />

            <View style={D.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={D.heroLabel}>მიღებული კალორიები</Text>
                <View style={D.heroNumRow}>
                  <Text style={D.heroNum}>{Math.round(dayIntake.calories)}</Text>
                  <Text style={D.heroNumOf}>/ {Math.round(tCals)}</Text>
                </View>
                <Text style={[D.heroDelta, { color: isOver ? '#FF8A8A' : 'rgba(255,255,255,0.6)' }]}>
                  {isOver
                    ? `+${Math.abs(calsLeft)} კკალ გადაჭარბება`
                    : `${calsLeft} კკალ დარჩენილი`}
                </Text>
              </View>

              <ProgressRing
                pct={calPct}
                size={92}
                stroke={6}
                color={isOver ? '#FF8A8A' : C.primary}
                trackColor="rgba(255,255,255,0.08)"
              >
                <Text style={D.ringPct}>{Math.round(calPct)}</Text>
                <Text style={D.ringPctSym}>%</Text>
              </ProgressRing>
            </View>

            <View style={D.heroBarBg}>
              <View style={[D.heroBarFill, {
                width: `${calPct}%`,
                backgroundColor: isOver ? '#FF8A8A' : C.primary,
              }]} />
            </View>

            <View style={D.heroFootRow}>
              <View style={D.heroFootChip}>
                <Utensils size={11} color="rgba(255,255,255,0.6)" strokeWidth={2.2} />
                <Text style={D.heroFootTxt}>{dayIntake.meals.length} კვება დღეს</Text>
              </View>
              <Text style={D.heroFootMeta}>{Math.round(calPct)}% დღიური ნორმირების</Text>
            </View>
          </View>
        </AppearAnimated>

        <View style={D.tiles}>
          {[
            { label: 'ცილა', val: Math.round(dayIntake.protein), target: tProt, unit: 'გ', color: C.info, Icon: Droplet },
            { label: 'ნახშ.', val: Math.round(dayIntake.carbs), target: tCarb, unit: 'გ', color: C.warning, Icon: Wheat },
            { label: 'ცხიმი', val: Math.round(dayIntake.fats), target: tFat, unit: 'გ', color: C.danger, Icon: Flame },
          ].map((c, i) => {
            const pct = Math.min((c.val / c.target) * 100, 100);
            return (
              <AppearAnimated index={i + 2} key={i} style={{ flex: 1 }}>
                <View style={D.tile}>
                  <View style={[D.tileIcon, { backgroundColor: c.color + '10' }]}>
                    <c.Icon size={14} color={c.color} strokeWidth={2.5} />
                  </View>
                  <Text style={D.tileVal}>
                    {c.val}<Text style={D.tileUnit}>{c.unit}</Text>
                  </Text>
                  <Text style={D.tileLabel}>{c.label}</Text>
                  <View style={D.tileBarBg}>
                    <View style={[D.tileBarFill, { width: `${pct}%`, backgroundColor: c.color }]} />
                  </View>
                </View>
              </AppearAnimated>
            );
          })}
        </View>

        <AppearAnimated index={5}>
          <View style={D.section}>
            <SectionHdr sh={sh} title="ბალანსი" sub="დღიური კვებითი ღირებულების გადანაწილება" />
            <View style={D.card}>
              <MacroBarRow Icon={Droplet} label="ცილა (Protein)" consumed={dayIntake.protein} target={tProt} color={C.info} bg={C.infoBg} />
              <View style={D.divider} />
              <MacroBarRow Icon={Wheat} label="ნახშირწყლები (Carbs)" consumed={dayIntake.carbs} target={tCarb} color={C.warning} bg={C.warningBg} />
              <View style={D.divider} />
              <MacroBarRow Icon={Flame} label="ცხიმი (Fats)" consumed={dayIntake.fats} target={tFat} color={C.danger} bg={C.dangerBg} />
            </View>
          </View>
        </AppearAnimated>

        <AppearAnimated index={6}>
          <View style={D.section}>
            <SectionHdr
              sh={sh}
              title="მიღებული კერძები"
              sub={dayIntake.meals.length > 0 ? `${dayIntake.meals.length} კერძი დღეს` : 'ჯერ არ გაგიტარებიათ კვება'}
            />

            <View style={{ gap: 12, marginTop: 4 }}>
              {dayIntake.meals.length === 0 ? (
                <View style={D.empty}>
                  <View style={D.emptyIcon}>
                    <Utensils size={26} color={C.inkLight} strokeWidth={1.8} />
                  </View>
                  <Text style={D.emptyTitle}>დღიური ცარიელია</Text>
                  <Text style={D.emptySub}>დაიწყეთ თქვენი დღიური პროგრესის აღრიცხვა და დაამატეთ დღეს მიღებული კვება.</Text>
                </View>
              ) : (
                dayIntake.meals.map((meal: any, idx: number) => (
                  <MealCard key={idx} meal={meal} idx={idx} />
                ))
              )}
            </View>
          </View>
        </AppearAnimated>
      </ScrollView>

      <BrandAlert 
        state={alertS} 
        onClose={() => setAlertS({ ...alertS, visible: false })} 
      />
    </SafeAreaView>
  );
}

const getDStyles = (C: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surfaceAlt },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.surfaceAlt },
  loadTxt: { marginTop: 12, fontSize: 14, color: C.inkLight, fontWeight: '500' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  hdr: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: C.surfaceAlt,
  },
  hdrBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  hdrCenter: { alignItems: 'center' },
  hdrTitle: { fontSize: 18, fontWeight: '800', color: C.ink, letterSpacing: -0.5 },
  hdrDate: { fontSize: 12, color: C.inkLight, fontWeight: '600', marginTop: 2, textTransform: 'capitalize' },

  hero: {
    backgroundColor: '#0F172A',
    borderRadius: 32,
    padding: 24,
    marginTop: 10,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  heroGlow: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: C.primary,
    opacity: 0.15,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  heroLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroNumRow: { flexDirection: 'row', alignItems: 'baseline' },
  heroNum: { color: 'white', fontSize: 40, fontWeight: '900', letterSpacing: -1.5 },
  heroNumOf: { color: 'rgba(255,255,255,0.25)', fontSize: 18, fontWeight: '700', marginLeft: 8 },
  heroDelta: { fontSize: 14, fontWeight: '800', marginTop: 6 },

  ringPct: { color: 'white', fontSize: 26, fontWeight: '900', position: 'absolute', top: 20 },
  ringPctSym: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '800', position: 'absolute', bottom: 22 },

  heroBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, marginBottom: 18 },
  heroBarFill: { height: '100%', borderRadius: 10 },

  heroFootRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroFootChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  heroFootTxt: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '800', marginLeft: 8 },
  heroFootMeta: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700' },

  tiles: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  tile: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  tileIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tileVal: { fontSize: 17, fontWeight: '800', color: C.ink, letterSpacing: -0.5 },
  tileUnit: { fontSize: 11, color: C.inkLight, fontWeight: '600', marginLeft: 1 },
  tileLabel: { fontSize: 11, color: C.inkLight, fontWeight: '700', marginTop: 2, marginBottom: 10 },
  tileBarBg: { height: 4, backgroundColor: C.border, borderRadius: 10, overflow: 'hidden' },
  tileBarFill: { height: '100%', borderRadius: 10 },

  section: { marginBottom: 28 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 16 },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: C.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.ink, marginBottom: 8 },
  emptySub: { fontSize: 14, color: C.inkLight, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20, fontWeight: '500' },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnTxt: { color: 'white', fontWeight: '700', fontSize: 15, marginLeft: 8 },
});
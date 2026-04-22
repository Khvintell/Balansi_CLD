import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Dimensions,
  Platform, StatusBar, Modal, Animated,
  Easing, Share
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useThemeStore } from '../../store/useThemeStore';
import { useDiaryStore } from '../../store/useDiaryStore';
import { useCartStore } from '../../store/useCartStore';
import { getColors } from '../../config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft, Clock, Flame, Droplet, Wheat,
  CheckCircle2, ChefHat, Heart, ShoppingCart,
  X, AlertCircle, Zap, Share2, Bookmark, Award
} from 'lucide-react-native';

// ─── Design System (Balansi Brand) ─────────────────────────────────────────


const { width: SW, height: SH } = Dimensions.get('window');
const IMG_H = Math.round(SH * 0.38);

const SERVER = 'http://192.168.1.16:8000';

// ─── Haptic helper ─────────────────────────────────────────────────────────────
const haptic = (type: 'select' | 'medium' | 'heavy' | 'success' | 'warning') => {
  if (Platform.OS === 'web') return;
  switch (type) {
    case 'select': Haptics.selectionAsync(); break;
    case 'medium': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
    case 'heavy': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
    case 'success': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
    case 'warning': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
  }
};

const springBounce = (anim: Animated.Value, toValue: number, cb?: () => void) =>
  Animated.sequence([
    Animated.spring(anim, { toValue: toValue * 1.35, useNativeDriver: true, speed: 60, bounciness: 20 }),
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 60 }),
  ]).start(cb);

const Tap = ({ children, onPress, style, scale = 0.95 }: any) => {
  const a = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[{ transform: [{ scale: a }] }, style]}>
      <TouchableOpacity
        activeOpacity={1}
        style={{ width: '100%' }}
        onPressIn={() => Animated.spring(a, { toValue: scale, useNativeDriver: true, speed: 50 }).start()}
        onPressOut={() => Animated.spring(a, { toValue: 1, useNativeDriver: true, speed: 50 }).start()}
        onPress={onPress}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Alert Modal ──────────────────────────────────────────────────────────────
type AlertType = 'success' | 'error' | 'warning' | 'info';
interface AlertAction { label: string; onPress: () => void; primary?: boolean; }
interface BAlertState { visible: boolean; type: AlertType; title: string; message: string; actions?: AlertAction[]; }

const BrandAlert = ({ state, onClose, DS, AL }: { state: BAlertState; onClose: () => void; DS: any; AL: any }) => {
  const slideY = useRef(new Animated.Value(60)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state.visible) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      slideY.setValue(60); op.setValue(0);
    }
  }, [state.visible, slideY, op]);

  const map = {
    success: { color: DS.success, glow: DS.successGlow, emoji: '🎉' },
    error: { color: DS.danger, glow: DS.dangerGlow, emoji: '😕' },
    warning: { color: DS.warning, glow: DS.warningGlow, emoji: '⚡' },
    info: { color: DS.info, glow: DS.infoGlow, emoji: 'ℹ️' },
  };
  const m = map[state.type];

  return (
    <Modal visible={state.visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[AL.overlay, { opacity: op }]}>
        <Animated.View style={[AL.sheet, { transform: [{ translateY: slideY }] }]}>
          <View style={[AL.accent, { backgroundColor: m.color }]} />
          <View style={[AL.circle, { backgroundColor: m.glow }]}>
            <Text style={{ fontSize: 32 }}>{m.emoji}</Text>
          </View>
          <Text style={AL.title}>{state.title}</Text>
          <Text style={AL.msg}>{state.message}</Text>
          <View style={AL.row}>
            {state.actions
              ? state.actions.map((a, i) => (
                <View key={`action-${i}`} style={{ flex: 1 }}>
                  <Tap onPress={() => { onClose(); a.onPress(); }} style={{ width: '100%' }}>
                    <View style={[AL.btn, a.primary ? { backgroundColor: m.color } : AL.ghost]}>
                      <Text style={[AL.btnTxt, !a.primary && { color: DS.slate }]}>{a.label}</Text>
                    </View>
                  </Tap>
                </View>
              ))
              : (
                <View style={{ flex: 1 }}>
                  <Tap onPress={onClose} style={{ width: '100%' }}>
                    <View style={[AL.btn, { backgroundColor: m.color }]}>
                      <Text style={AL.btnTxt}>გასაგებია</Text>
                    </View>
                  </Tap>
                </View>
              )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const getALStyles = (DS: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,15,13,0.65)', justifyContent: 'flex-end', padding: DS.s20 },
  sheet: { backgroundColor: DS.card, borderRadius: DS.r32, overflow: 'hidden', alignItems: 'center', padding: DS.s28, paddingTop: DS.s24 },
  accent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  circle: { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', marginBottom: DS.s16, marginTop: DS.s8 },
  title: { fontFamily: DS.fontFamily, fontSize: DS.f22, fontWeight: '900', color: DS.onyx, marginBottom: DS.s8, textAlign: 'center', letterSpacing: -0.5 },
  msg: { fontFamily: DS.fontFamily, fontSize: DS.f14, color: DS.mist, textAlign: 'center', lineHeight: 22, fontWeight: '500', marginBottom: DS.s24 },
  row: { flexDirection: 'row', gap: DS.s10, width: '100%' },
  btn: { width: '100%', paddingVertical: 14, borderRadius: DS.r20, alignItems: 'center' },
  ghost: { backgroundColor: DS.ghost },
  btnTxt: { fontFamily: DS.fontFamily, color: DS.card, fontWeight: '800', fontSize: DS.f14 },
});

// ─── Macro Card ────────────────────────────────────────────────────────────────
const MacroCard = ({ label, value, unit, color, glow, Icon, pct, MC, DS }: any) => {
  const barW = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barW, {
      toValue: Math.min(pct || 0, 100),
      duration: 900,
      delay: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct, barW]);

  const widthInterp = barW.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={[MC.card, { backgroundColor: glow }]}>
      <View style={[MC.iconBox, { backgroundColor: color + '25' }]}>
        <Icon size={13} color={color} strokeWidth={2.5} />
      </View>
      <Text style={[MC.value, { color }]}>
        {value}<Text style={MC.unit}>{unit}</Text>
      </Text>
      <Text style={MC.label}>{label}</Text>
      <View style={MC.track}>
        <Animated.View style={[MC.fill, { width: widthInterp as any, backgroundColor: color }]} />
      </View>
    </View>
  );
};
const getMCStyles = (DS: any) => StyleSheet.create({
  card: { flex: 1, marginHorizontal: DS.s4, borderRadius: DS.r16, padding: DS.s12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  iconBox: { width: 28, height: 28, borderRadius: DS.r8, justifyContent: 'center', alignItems: 'center', marginBottom: DS.s8 },
  value: { fontFamily: DS.fontFamily, fontSize: DS.f17, fontWeight: '900', letterSpacing: -0.4, lineHeight: 22 },
  unit: { fontFamily: DS.fontFamily, fontSize: DS.f11, fontWeight: '700' },
  label: { fontFamily: DS.fontFamily, fontSize: DS.f11, color: DS.mist, fontWeight: '700', marginBottom: DS.s8, marginTop: DS.s2 },
  track: { height: 3, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: DS.rFull, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: DS.rFull },
});

// ─── Step Card ────────────────────────────────────────────────────────────────
const StepCard = ({ step, text, delay, ST, DS }: { step: number; text: string; delay: number; ST: any; DS: any }) => {
  const tx = useRef(new Animated.Value(18)).current;
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(tx, { toValue: 0, duration: 380, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(op, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, op, tx]);
  return (
    <Animated.View style={[ST.card, { opacity: op, transform: [{ translateX: tx }] }]}>
      <View style={ST.numBox}>
        <Text style={ST.num}>{step}</Text>
      </View>
      <Text style={ST.txt}>{text}</Text>
    </Animated.View>
  );
};
const getSTStyles = (DS: any) => StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: DS.card, borderRadius: DS.r16, padding: DS.s14, marginBottom: DS.s8, borderWidth: 1, borderColor: DS.ghost },
  numBox: { width: 28, height: 28, borderRadius: DS.r8, backgroundColor: DS.onyx, justifyContent: 'center', alignItems: 'center', marginRight: DS.s12, flexShrink: 0, marginTop: 1 },
  num: { fontFamily: DS.fontFamily, color: DS.card, fontSize: DS.f11, fontWeight: '900' },
  txt: { fontFamily: DS.fontFamily, flex: 1, fontSize: DS.f14, color: DS.graphite, lineHeight: 22, fontWeight: '500' },
});

// ─── Ingredient Row ───────────────────────────────────────────────────────────
const IngRow = ({ name, amount, idx, isLast, IR, DS }: any) => {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(6)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 260, delay: idx * 40, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 260, delay: idx * 40, useNativeDriver: true }),
    ]).start();
  }, [idx, op, ty]);
  return (
    <Animated.View style={[IR.row, !isLast && IR.border, { opacity: op, transform: [{ translateY: ty }] }]}>
      <View style={IR.dot} />
      <Text style={IR.name}>{name}</Text>
      {!!amount && (
        <View style={IR.amtWrap}>
          <Text style={IR.amt}>{amount}გ</Text>
        </View>
      )}
    </Animated.View>
  );
};
const getIRStyles = (DS: any) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: DS.s16 },
  border: { borderBottomWidth: 1, borderBottomColor: DS.ghost },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: DS.emerald, marginRight: DS.s12, flexShrink: 0 },
  name: { fontFamily: DS.fontFamily, flex: 1, fontSize: DS.f14, fontWeight: '600', color: DS.graphite },
  amtWrap: { backgroundColor: DS.snow, paddingHorizontal: DS.s10, paddingVertical: DS.s4, borderRadius: DS.rFull, borderWidth: 1, borderColor: DS.ghost },
  amt: { fontFamily: DS.fontFamily, fontSize: DS.f12, fontWeight: '800', color: DS.mist },
});

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function RecipeDetailsScreen() {
  const { themeId } = useThemeStore();
  const { addMeal } = useDiaryStore();
  const { addManyItems } = useCartStore();
  const DS = React.useMemo(() => getColors(themeId), [themeId]);
  const AL = React.useMemo(() => getALStyles(DS), [DS]);
  const MC = React.useMemo(() => getMCStyles(DS), [DS]);
  const ST = React.useMemo(() => getSTStyles(DS), [DS]);
  const IR = React.useMemo(() => getIRStyles(DS), [DS]);
  const S = React.useMemo(() => getSStyles(DS, IMG_H, SW), [DS]);

  const { id } = useLocalSearchParams();
  const safeId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addingMeal, setAddingMeal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'ing' | 'steps'>('ing');
  const [targetCals, setTargetCals] = useState(2000);
  const [addedToDiary, setAddedToDiary] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [alertS, setAlertS] = useState<BAlertState>({
    visible: false, type: 'success', title: '', message: '',
  });

  const scrollY = useRef(new Animated.Value(0)).current;
  const heartAnim = useRef(new Animated.Value(1)).current;
  const btnAnim = useRef(new Animated.Value(1)).current;
  const tabSlide = useRef(new Animated.Value(0)).current;
  const barSlide = useRef(new Animated.Value(100)).current;

  const TAB_W = (SW - DS.s20 * 2 - 6) / 2;

  const heroTranslate = scrollY.interpolate({
    inputRange: [-120, 0, IMG_H],
    outputRange: [-24, 0, IMG_H * 0.25],
    extrapolate: 'clamp',
  });
  const heroScale = scrollY.interpolate({
    inputRange: [-120, 0],
    outputRange: [1.15, 1],
    extrapolate: 'clamp',
  });

  const stickyOpacity = scrollY.interpolate({
    inputRange: [IMG_H - 80, IMG_H - 10],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (safeId) {
      fetchRecipe();
      checkFav();
      loadProfile();
    }
    Animated.spring(barSlide, {
      toValue: 0, tension: 60, friction: 11,
      delay: 700, useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeId]);

  const loadProfile = async () => {
    try {
      const s = await AsyncStorage.getItem('userProfile');
      if (s) { const p = JSON.parse(s); if (p.targetCalories > 0) setTargetCals(p.targetCalories); }
    } catch { }
  };

  // 🚀 დაუნდობელი ფუნქცია, რომელიც ყოველთვის სწორ ლინკს აგენერირებს
  const getImageUrl = (url: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';

    // თუ უკვე გარე ლინკია (მაგ: unsplash), პირდაპირ ვაბრუნებთ
    if (url.startsWith('http')) return encodeURI(url);

    // ვასუფთავებთ зайდმეტ სლეშებს წინ
    let cleanPath = url.replace(/^\/+/, '');

    // თუ assets/ არ უწერია წინ, ძალით ვუმატებთ
    if (!cleanPath.startsWith('assets/')) {
      cleanPath = `assets/${cleanPath}`;
    }

    // 🎯 ვაკოდირებთ (ქართული ასოებისთვის) და ვაწებებთ სერვერის IP-ს
    return `${SERVER}/${encodeURI(cleanPath)}`;
  };

  const fetchRecipe = async () => {
    try {
      const res = await fetch(`${SERVER}/recipes/${safeId}`);
      if (res.ok) {
        const d = await res.json();
        let r = d.recipe ?? d;
        if (d.ingredients && !r.ingredients) r.ingredients = d.ingredients;
        setRecipe(r);
      } else {
        const fb = await fetch(`${SERVER}/recipes`);
        if (!fb.ok) throw new Error('err');
        const list = await fb.json();
        const arr = Array.isArray(list) ? list : (list.recipes || []);
        const r = arr.find((x: any) => x.id?.toString() === safeId?.toString());
        r ? setRecipe(r) : setErrorMsg('ეს რეცეპტი ბაზაში ვერ მოიძებნა.');
      }
    } catch {
      setErrorMsg('სერვერთან კავშირი ვერ მოხერხდა.');
    } finally {
      setLoading(false);
    }
  };

  const checkFav = async () => {
    try {
      const s = await AsyncStorage.getItem('favoriteRecipes');
      if (s) setIsFavorite(JSON.parse(s).includes(safeId?.toString()));
    } catch { }
  };

  const toggleFav = async () => {
    haptic('medium');
    springBounce(heartAnim, 1.6);
    try {
      const s = await AsyncStorage.getItem('favoriteRecipes');
      let favs = s ? JSON.parse(s) : [];
      const sid = safeId?.toString() || '';
      favs = isFavorite ? favs.filter((f: string) => f !== sid) : [...favs, sid];
      await AsyncStorage.setItem('favoriteRecipes', JSON.stringify(favs));
      setIsFavorite(!isFavorite);
    } catch { }
  };

  const showAlert = (type: AlertType, title: string, message: string, actions?: AlertAction[]) =>
    setAlertS({ visible: true, type, title, message, actions });

  const closeAlert = () => setAlertS(a => ({ ...a, visible: false }));

  const logMeal = async () => {
    haptic('heavy');
    Animated.sequence([
      Animated.spring(btnAnim, { toValue: 0.93, useNativeDriver: true, speed: 80 }),
      Animated.spring(btnAnim, { toValue: 1, useNativeDriver: true, speed: 80 }),
    ]).start();
    setAddingMeal(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const kcal = recipe.total_calories || 0;
      const prot = recipe.protein || Math.round((kcal * 0.3) / 4);
      const carb = recipe.carbs || Math.round((kcal * 0.4) / 4);
      const fat = recipe.fats || Math.round((kcal * 0.3) / 9);

      // 🚀 სინქრონიზაცია useDiaryStore-თან
      addMeal(
        today,
        {
          id: Date.now().toString(),
          recipe_id: recipe.id,
          name: recipe.name || 'კერძი',
          calories: kcal,
          time: new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }),
          image_url: getImageUrl(recipe.image_url),
        },
        { protein: prot, carbs: carb, fats: fat }
      );

      // 🚀 ასევე ვინახავთ ძველ სტრუქტურაშიც (თავსებადობისთვის)
      const key = `intake_${today}`;
      const es = await AsyncStorage.getItem(key);
      let intake = es ? JSON.parse(es) : { calories: 0, protein: 0, carbs: 0, fats: 0, meals: [] };
      intake.calories += kcal; intake.protein += prot;
      intake.carbs += carb; intake.fats += fat;
      intake.meals.unshift({
        id: Date.now().toString(), recipe_id: recipe.id,
        name: recipe.name || 'კერძი', calories: kcal,
        time: new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }),
        image_url: getImageUrl(recipe.image_url),
      });
      await AsyncStorage.setItem(key, JSON.stringify(intake));

      setAddedToDiary(true);
      haptic('success');
      showAlert('success', 'დაემატა! 🎉', `${recipe.name} შევიდა დღიურ რაციონში.`, [
        { label: 'გაგრძელება', onPress: () => { } },
        { label: 'დღიური →', onPress: () => router.replace('/diary'), primary: true },
      ]);
    } catch {
      showAlert('error', 'შეცდომა', 'რაციონში დამატება ვერ მოხერხდა.');
    } finally {
      setAddingMeal(false);
    }
  };

  const gN = (ing: any) => ing.product_name || ing.name || ing.product?.name || 'ინგრედიენტი';
  const gA = (ing: any) => ing.amount_grams || ing.amount || '';

  const saveToCart = () => {
    if (selected.length === 0) {
      showAlert('warning', 'ყურადღება', 'მონიშნე მინიმუმ ერთი ინგრედიენტი.');
      return;
    }
    const itemsToAdd = recipe.ingredients
      .filter((ing: any) => selected.includes(gN(ing)))
      .map((ing: any) => ({
        name: gN(ing),
        note: gA(ing) ? `${gA(ing)}გ` : '',
        quantity: 1,
        category: 'other' as const,
        checked: false,
      }));
    addManyItems(itemsToAdd);
    setShowCart(false);
    haptic('success');
    showAlert('success', 'წარმატება! 🛒', 'ინგრედიენტები დაემატა საყიდლების სიას.', [
      { label: 'დარჩენა', onPress: () => { } },
      { label: 'სიაში →', onPress: () => router.push('/(tabs)/cart'), primary: true },
    ]);
  };

  const switchTab = (tab: 'ing' | 'steps', i: number) => {
    haptic('select');
    setActiveTab(tab);
    Animated.spring(tabSlide, {
      toValue: i * TAB_W, useNativeDriver: true, speed: 26, bounciness: 4,
    }).start();
  };

  // ── Derived values ──────────────────────────────────────────────────────────
  const cals = recipe?.total_calories || 0;
  const protein = recipe?.protein || Math.round((cals * 0.3) / 4);
  const carbs = recipe?.carbs || Math.round((cals * 0.4) / 4);
  const fats = recipe?.fats || Math.round((cals * 0.3) / 9);
  const totalG = (protein + carbs + fats) || 1;
  const calPct = Math.min(Math.round((cals / targetCals) * 100), 100);
  const calColor = calPct > 80 ? DS.danger : calPct > 50 ? DS.warning : DS.emerald;
  const prepTime = recipe?.prep_time || 0;
  const difficulty = prepTime <= 15 ? 'მარტივი' : prepTime <= 30 ? 'საშუალო' : 'რთული';

  let parsedSteps: string[] = [];
  try {
    if (Array.isArray(recipe?.instructions)) {
      parsedSteps = recipe.instructions;
    } else if (typeof recipe?.instructions === 'string') {
      if (recipe.instructions.trim().startsWith('[')) {
        parsedSteps = JSON.parse(recipe.instructions);
      } else {
        parsedSteps = recipe.instructions.split('\n');
      }
    }
  } catch (e) {
    if (typeof recipe?.instructions === 'string') {
      parsedSteps = recipe.instructions.split('\n');
    }
  }

  const steps = parsedSteps?.length > 0
    ? parsedSteps
      .filter((s: string) => s && typeof s === 'string' && s.trim().length > 0)
      .map((s: string) => s.replace(/^\d+[\.\)]\s*/, '').trim())
    : ['მომზადების წესი არ არის მითითებული.'];

  if (loading) return (
    <SafeAreaView style={S.loadScreen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={S.loadRing}>
        <ActivityIndicator size="large" color={DS.emerald} />
      </View>
      <Text style={S.loadTxt}>ვტვირთავთ...</Text>
    </SafeAreaView>
  );

  if (errorMsg || !recipe) return (
    <SafeAreaView style={S.errScreen}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={S.errIcon}>
        <AlertCircle size={44} color={DS.danger} strokeWidth={2} />
      </View>
      <Text style={S.errTitle}>ოპაა!</Text>
      <Text style={S.errSub}>{errorMsg}</Text>
      <Tap onPress={() => router.replace('/')}>
        <View style={S.errBtn}>
          <Text style={S.errBtnTxt}>← მთავარ გვერდზე</Text>
        </View>
      </Tap>
    </SafeAreaView>
  );

  return (
    <View style={S.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ══ STICKY HEADER ══════════════════════════════ */}
      <Animated.View style={[S.stickyHdr, { opacity: stickyOpacity }]} pointerEvents="box-none">
        <SafeAreaView>
          <View style={S.stickyRow}>
            <Tap onPress={() => router.back()} style={S.stickyBtn}>
              <View style={S.stickyIconBtn}>
                <ArrowLeft size={18} color={DS.onyx} strokeWidth={2.5} />
              </View>
            </Tap>
            <Text style={S.stickyTitle} numberOfLines={1}>{recipe.name}</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* ══ SCROLL CONTENT ══════════════════════════════════════════════════ */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        contentContainerStyle={{ paddingBottom: 130 }}
        bounces
      >
        {/* ── HERO IMAGE ────────────────────────────────────────────────── */}
        <View style={{ height: IMG_H, overflow: 'hidden', backgroundColor: '#F4F8F5' }}>
          <Animated.View style={{
            position: 'absolute', top: -10, left: 0, right: 0, bottom: -10,
            transform: [{ translateY: heroTranslate }, { scale: heroScale }],
          }}>
            {/* 🚀 აი აქ შევცვალეთ Image კომპონენტი! ვიყენებთ getImageUrl(recipe.image_url) */}
            <Image
              source={{ uri: getImageUrl(recipe?.image_url) }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={300}
              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            />
          </Animated.View>

          <View style={S.heroGradient} pointerEvents="none" />

          {/* ── Floating Controls ── */}
          <SafeAreaView style={{ position: 'absolute', top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 10, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Tap onPress={() => router.back()} scale={0.9}>
              <View style={S.floatBtn}>
                <ArrowLeft size={20} color={DS.onyx} strokeWidth={2.5} />
              </View>
            </Tap>

            <Tap onPress={toggleFav} scale={0.9}>
              <Animated.View style={[S.floatBtn, { transform: [{ scale: heartAnim }] }]}>
                <Heart size={20} strokeWidth={2.5} color={isFavorite ? DS.danger : DS.onyx} fill={isFavorite ? DS.danger : 'transparent'} />
              </Animated.View>
            </Tap>
          </SafeAreaView>
        </View>

        {/* ── CONTENT CARD ─────────────────────────────── */}
        <View style={S.contentCard}>
          <View style={S.titleBlock}>
            {recipe.category && (
              <View style={S.categoryTag}>
                <ChefHat size={11} color={DS.emerald} strokeWidth={2.5} />
                <Text style={S.categoryTxt}>{recipe.category}</Text>
              </View>
            )}

            <Text style={S.title}>{recipe.name}</Text>

            <View style={S.featuresRow}>
              <View style={S.featurePill}>
                <Clock size={12} color={DS.mist} />
                <Text style={S.featureTxt}>{recipe.prep_time} წუთი</Text>
              </View>
              <View style={S.featurePill}>
                <Zap size={12} color={DS.warning} fill={DS.warning} />
                <Text style={S.featureTxt}>{difficulty}</Text>
              </View>
              {addedToDiary && (
                <View style={[S.featurePill, { backgroundColor: DS.successGlow, borderColor: 'transparent' }]}>
                  <CheckCircle2 size={12} color={DS.success} />
                  <Text style={[S.featureTxt, { color: DS.success }]}>დამატებულია</Text>
                </View>
              )}
            </View>

            <View style={[S.calRow, { borderColor: calColor + '30', backgroundColor: calColor + '0C', marginTop: 15 }]}>
              <View style={[S.calIconBox, { backgroundColor: calColor + '20' }]}>
                <Flame size={14} color={calColor} fill={calColor} strokeWidth={0} />
              </View>
              <View style={S.calTextCol}>
                <Text style={[S.calNum, { color: calColor }]}>{cals} კკალ</Text>
                <Text style={S.calSub}>დღიური ნორმის {calPct}%</Text>
              </View>
              <View style={S.calBarWrap}>
                <View style={[S.calBarFill, { width: `${calPct}%` as any, backgroundColor: calColor }]} />
              </View>
            </View>
          </View>

          {/* ── MACROS ROW ── */}
          <View style={S.macrosRow}>
            <MacroCard MC={MC} DS={DS} label="ცილა" value={protein} unit="გ" color={DS.info} glow={DS.infoGlow} Icon={Droplet} pct={(protein / totalG) * 100} />
            <MacroCard MC={MC} DS={DS} label="ნახშ." value={carbs} unit="გ" color={DS.warning} glow={DS.warningGlow} Icon={Wheat} pct={(carbs / totalG) * 100} />
            <MacroCard MC={MC} DS={DS} label="ცხიმი" value={fats} unit="გ" color={DS.danger} glow={DS.dangerGlow} Icon={Flame} pct={(fats / totalG) * 100} />
          </View>

          {/* ── TABS ── */}
          <View style={S.tabWrap}>
            <View style={S.tabBar}>
              <Animated.View style={[S.tabIndicator, { width: TAB_W, transform: [{ translateX: tabSlide }] }]} />
              {(['ing', 'steps'] as const).map((tab, i) => (
                <TouchableOpacity
                  key={tab}
                  style={[S.tabBtn, { width: TAB_W }]}
                  onPress={() => switchTab(tab, i)}
                  activeOpacity={0.75}
                >
                  <Text style={[S.tabTxt, activeTab === tab && S.tabTxtActive]}>
                    {tab === 'ing' ? 'ინგრედიენტები' : `მომზადება · ${steps.length}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── TAB CONTENT ── */}
          <View style={S.tabContent}>
            {activeTab === 'ing' ? (
              recipe.ingredients?.length > 0 ? (
                <>
                  <View style={S.sectionHeader}>
                    <Text style={S.sectionTitle}>{recipe.ingredients.length} ინგრედიენტი</Text>
                  </View>

                  <View style={S.ingCard}>
                    {recipe.ingredients.map((ing: any, idx: number) => (
                      <IngRow
                        key={ing.id || idx} idx={idx}
                        name={gN(ing)} amount={gA(ing)}
                        isLast={idx === recipe.ingredients.length - 1}
                        IR={IR} DS={DS}
                      />
                    ))}
                  </View>

                  <Tap onPress={() => { setSelected([]); setShowCart(true); }}>
                    <View style={S.cartCta}>
                      <View style={S.cartCtaLeft}>
                        <View style={S.cartCtaIcon}>
                          <ShoppingCart size={15} color={DS.card} strokeWidth={2.5} />
                        </View>
                        <Text style={S.cartCtaTxt}>საყიდლების სიაში დამატება</Text>
                      </View>
                      <View style={S.cartCtaBadge}>
                        <Text style={S.cartCtaBadgeTxt}>{recipe.ingredients.length}</Text>
                      </View>
                    </View>
                  </Tap>
                </>
              ) : (
                <View style={S.empty}>
                  <Text style={S.emptyTxt}>ინგრედიენტები არ არის მითითებული.</Text>
                </View>
              )
            ) : (
              <>
                <View style={S.stepsHeader}>
                  <Award size={13} color={DS.warning} strokeWidth={2.5} />
                  <Text style={S.stepsHeaderTxt}>{steps.length} ნაბიჯი · ნაბიჯ-ნაბიჯ გზამკვლევი</Text>
                </View>
                {steps.map((txt: string, i: number) => (
                  <StepCard ST={ST} DS={DS} key={`step-${i}`} step={i + 1} text={txt} delay={i * 55} />
                ))}
              </>
            )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* ══ BOTTOM CTA BAR ════════════════════════════════════════════════════ */}
      <Animated.View style={[S.bottomBar, { transform: [{ translateY: barSlide }] }]}>
        <Tap onPress={logMeal} scale={0.97} style={{ width: '100%' }}>
          <Animated.View style={[
            S.ctaBtn,
            addedToDiary && { backgroundColor: DS.success },
            { transform: [{ scale: btnAnim }] },
          ]}>
            {addingMeal ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : addedToDiary ? (
              <>
                <CheckCircle2 size={20} color="#FFF" strokeWidth={2.5} />
                <Text style={S.ctaBtnTxt}>დაემატა!</Text>
              </>
            ) : (
              <>
                <ChefHat size={20} color="#FFF" strokeWidth={2} />
                <Text style={S.ctaBtnTxt}>მივირთვი · დღიურში</Text>
              </>
            )}
            <View style={S.ctaCalChip}>
              <Text style={S.ctaCalNum}>{cals}</Text>
              <Text style={S.ctaCalUnit}>კკ</Text>
            </View>
          </Animated.View>
        </Tap>
      </Animated.View>

      {/* ══ SHOPPING CART BOTTOM SHEET ════════════════════════════════════════ */}
      <Modal visible={showCart} animationType="slide" transparent statusBarTranslucent>
        <View style={S.sheetBg}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCart(false)} activeOpacity={1} />
          <View style={S.sheet}>
            <View style={S.sheetHandle} />
            <View style={S.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={S.sheetTitle}>რა გაკლია სახლში?</Text>
                <Text style={S.sheetSub}>მონიშნე ინგრედიენტები შესაძენად</Text>
              </View>
              <Tap onPress={() => setShowCart(false)}>
                <View style={S.sheetCloseBtn}>
                  <X size={17} color={DS.mist} strokeWidth={2.5} />
                </View>
              </Tap>
            </View>

            <TouchableOpacity
              style={S.selectAllBtn}
              onPress={() => {
                const all = recipe.ingredients?.map(gN) || [];
                setSelected(selected.length === all.length ? [] : all);
              }}
            >
              <Text style={S.selectAllTxt}>
                {selected.length === recipe.ingredients?.length ? 'გაუქმება' : 'ყველა'}
              </Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: SH * 0.36 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: DS.s12 }}>
              {recipe.ingredients?.map((ing: any, idx: number) => {
                const name = gN(ing); const amt = gA(ing); const sel = selected.includes(name);
                return (
                  <TouchableOpacity
                    key={`cart-ing-${idx}`}
                    style={[S.sheetRow, sel && S.sheetRowSel]}
                    onPress={() => {
                      haptic('select');
                      setSelected(sel ? selected.filter(n => n !== name) : [...selected, name]);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[S.checkbox, sel && { backgroundColor: DS.emerald, borderColor: DS.emerald }]}>
                      {sel && <CheckCircle2 size={12} color="#FFF" strokeWidth={3} />}
                    </View>
                    <Text style={[S.sheetIngName, sel && { color: DS.onyx, fontWeight: '700' }]}>{name}</Text>
                    {!!amt && (
                      <View style={[S.sheetAmtWrap, sel && { backgroundColor: DS.emeraldGlow }]}>
                        <Text style={[S.sheetAmtTxt, sel && { color: DS.emerald }]}>{amt}გ</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Tap onPress={saveToCart} style={{ opacity: selected.length === 0 ? 0.38 : 1 }}>
              <View style={S.sheetSaveBtn}>
                <ShoppingCart size={18} color="#FFF" strokeWidth={2.5} />
                <Text style={S.sheetSaveTxt}>
                  {selected.length > 0 ? `სიაში დამატება (${selected.length})` : 'მონიშნეთ ინგრედიენტები'}
                </Text>
              </View>
            </Tap>
          </View>
        </View>
      </Modal>

      <BrandAlert state={alertS} onClose={closeAlert} DS={DS} AL={AL} />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const getSStyles = (DS: any, IMG_H: number, SW: number) => StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.snow },
  loadScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DS.snow },
  loadRing: { width: 64, height: 64, borderRadius: 32, backgroundColor: DS.emeraldGlow, justifyContent: 'center', alignItems: 'center', marginBottom: DS.s16 },
  loadTxt: { fontFamily: DS.fontFamily, fontSize: DS.f14, color: DS.mist, fontWeight: '700' },
  errScreen: { flex: 1, backgroundColor: DS.snow, justifyContent: 'center', alignItems: 'center', padding: DS.s28 },
  errIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: DS.dangerGlow, justifyContent: 'center', alignItems: 'center', marginBottom: DS.s20 },
  errTitle: { fontFamily: DS.fontFamily, fontSize: DS.f26, fontWeight: '900', color: DS.onyx, marginBottom: DS.s8 },
  errSub: { fontFamily: DS.fontFamily, fontSize: DS.f14, color: DS.mist, textAlign: 'center', lineHeight: 22, marginBottom: DS.s24 },
  errBtn: { backgroundColor: DS.onyx, paddingHorizontal: DS.s24, paddingVertical: DS.s12, borderRadius: DS.rFull },
  errBtnTxt: { fontFamily: DS.fontFamily, color: DS.card, fontSize: DS.f14, fontWeight: '800' },

  stickyHdr: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 200, backgroundColor: DS.glassWhite, borderBottomWidth: 1, borderBottomColor: DS.ghost },
  stickyRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: DS.s16, paddingVertical: DS.s10 },
  stickyBtn: { padding: DS.s4 },
  stickyIconBtn: { width: 36, height: 36, borderRadius: DS.r12, justifyContent: 'center', alignItems: 'center' },
  stickyTitle: { fontFamily: DS.fontFamily, flex: 1, fontSize: DS.f15, fontWeight: '800', color: DS.onyx, textAlign: 'center', marginHorizontal: DS.s8, lineHeight: 22 },

  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'transparent' },
  floatBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },

  contentCard: { backgroundColor: DS.snow, marginTop: -DS.s24, borderTopLeftRadius: DS.r24, borderTopRightRadius: DS.r24, paddingBottom: DS.s10 },
  titleBlock: { paddingHorizontal: DS.s20, paddingTop: DS.s24, paddingBottom: DS.s20 },
  categoryTag: { flexDirection: 'row', alignItems: 'center', gap: DS.s6, backgroundColor: DS.emeraldGlow, alignSelf: 'flex-start', paddingHorizontal: DS.s10, paddingVertical: DS.s4, borderRadius: DS.rFull, marginBottom: DS.s12 },
  categoryTxt: { fontFamily: DS.fontFamily, fontSize: DS.f11, fontWeight: '800', color: DS.emerald, letterSpacing: 0.4 },

  title: {
    fontFamily: DS.fontFamily,
    fontSize: DS.f22,
    fontWeight: '900',
    color: DS.onyx,
    letterSpacing: -0.3,
    lineHeight: 32,
    marginBottom: 16
  },

  featuresRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  featurePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: DS.r12, backgroundColor: DS.surface, borderWidth: 1, borderColor: DS.border },
  featureTxt: { fontFamily: DS.fontFamily, fontSize: DS.f12, fontWeight: '700', color: DS.slate },

  calRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: DS.r20, padding: DS.s12, gap: DS.s12, overflow: 'hidden' },
  calIconBox: { width: 38, height: 38, borderRadius: DS.r12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  calTextCol: { flex: 1 },
  calNum: { fontFamily: DS.fontFamily, fontSize: DS.f17, fontWeight: '900', letterSpacing: -0.4, lineHeight: 24 },
  calSub: { fontFamily: DS.fontFamily, fontSize: DS.f11, color: DS.mist, fontWeight: '700', marginTop: 2 },
  calBarWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(0,0,0,0.06)' },
  calBarFill: { height: '100%', borderRadius: DS.rFull },

  macrosRow: { flexDirection: 'row', paddingHorizontal: DS.s16, marginBottom: DS.s20 },
  tabWrap: { paddingHorizontal: DS.s20, marginBottom: DS.s16 },
  tabBar: { flexDirection: 'row', backgroundColor: DS.ghost, borderRadius: DS.r16, padding: 3, position: 'relative', overflow: 'hidden' },
  tabIndicator: { position: 'absolute', top: 3, bottom: 3, left: 3, backgroundColor: DS.card, borderRadius: DS.r12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  tabBtn: { paddingVertical: DS.s10, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  tabTxt: { fontFamily: DS.fontFamily, fontSize: DS.f13, fontWeight: '700', color: DS.mist },
  tabTxtActive: { fontFamily: DS.fontFamily, color: DS.onyx, fontWeight: '900' },
  tabContent: { paddingHorizontal: DS.s20 },
  sectionHeader: { marginBottom: DS.s10 },
  sectionTitle: { fontFamily: DS.fontFamily, fontSize: DS.f13, fontWeight: '800', color: DS.mist, letterSpacing: 0.4 },

  ingCard: { backgroundColor: DS.card, borderRadius: DS.r20, marginBottom: DS.s12, overflow: 'hidden', borderWidth: 1, borderColor: DS.ghost },
  cartCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: DS.card, borderRadius: DS.r20, padding: DS.s16, borderWidth: 1, borderColor: DS.ghost, marginBottom: DS.s8 },
  cartCtaLeft: { flexDirection: 'row', alignItems: 'center', gap: DS.s10 },
  cartCtaIcon: { width: 34, height: 34, borderRadius: DS.r10, backgroundColor: DS.emerald, justifyContent: 'center', alignItems: 'center' },
  cartCtaTxt: { fontFamily: DS.fontFamily, fontSize: DS.f14, fontWeight: '700', color: DS.graphite },
  cartCtaBadge: { width: 26, height: 26, borderRadius: DS.rFull, backgroundColor: DS.emeraldGlow, justifyContent: 'center', alignItems: 'center' },
  cartCtaBadgeTxt: { fontFamily: DS.fontFamily, fontSize: DS.f12, fontWeight: '900', color: DS.emerald },

  empty: { paddingVertical: DS.s32, alignItems: 'center' },
  emptyTxt: { fontFamily: DS.fontFamily, color: DS.fog, fontWeight: '600', fontSize: DS.f14 },

  stepsHeader: { flexDirection: 'row', alignItems: 'center', gap: DS.s8, backgroundColor: DS.warningGlow, borderRadius: DS.r12, paddingHorizontal: DS.s12, paddingVertical: DS.s10, marginBottom: DS.s12, borderWidth: 1, borderColor: DS.warning + '25' },
  stepsHeaderTxt: { fontFamily: DS.fontFamily, fontSize: DS.f12, fontWeight: '800', color: DS.warning },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: DS.glassWhite, paddingHorizontal: DS.s20, paddingTop: DS.s12, paddingBottom: Platform.OS === 'ios' ? 36 : DS.s20, borderTopWidth: 1, borderTopColor: DS.ghost },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: DS.emerald, borderRadius: DS.r20, paddingHorizontal: DS.s20, paddingVertical: DS.s16, shadowColor: DS.emerald, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  ctaBtnTxt: { fontFamily: DS.fontFamily, flex: 1, fontSize: DS.f17, fontWeight: '900', color: DS.card, marginLeft: DS.s10, letterSpacing: -0.3 },
  ctaCalChip: { backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: DS.r10, paddingHorizontal: DS.s10, paddingVertical: DS.s6, alignItems: 'center' },
  ctaCalNum: { fontFamily: DS.fontFamily, fontSize: DS.f14, fontWeight: '900', color: DS.card, lineHeight: 18 },
  ctaCalUnit: { fontFamily: DS.fontFamily, fontSize: DS.f10, fontWeight: '700', color: 'rgba(255,255,255,0.72)' },

  sheetBg: { flex: 1, backgroundColor: 'rgba(10,15,13,0.52)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: DS.card, borderTopLeftRadius: DS.r32, borderTopRightRadius: DS.r32, paddingHorizontal: DS.s20, paddingTop: DS.s10, paddingBottom: Platform.OS === 'ios' ? 44 : DS.s24 },
  sheetHandle: { width: 36, height: 4, backgroundColor: DS.ghost, borderRadius: DS.rFull, alignSelf: 'center', marginBottom: DS.s20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: DS.s4 },
  sheetTitle: { fontFamily: DS.fontFamily, fontSize: DS.f22, fontWeight: '900', color: DS.onyx },
  sheetSub: { fontFamily: DS.fontFamily, fontSize: DS.f13, color: DS.mist, fontWeight: '600', marginTop: DS.s4, lineHeight: 18 },
  sheetCloseBtn: { width: 32, height: 32, borderRadius: DS.r10, backgroundColor: DS.ghost, justifyContent: 'center', alignItems: 'center' },

  selectAllBtn: { alignSelf: 'flex-end', marginBottom: DS.s10, paddingHorizontal: DS.s12, paddingVertical: DS.s4, borderRadius: DS.rFull, backgroundColor: DS.emeraldGlow },
  selectAllTxt: { fontFamily: DS.fontFamily, fontSize: DS.f12, fontWeight: '800', color: DS.emerald },

  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: DS.s12, borderBottomWidth: 1, borderBottomColor: DS.ghost, gap: DS.s12 },
  sheetRowSel: { backgroundColor: DS.emeraldGlow + '50' },
  checkbox: { width: 22, height: 22, borderRadius: DS.r8, borderWidth: 2, borderColor: DS.ghost, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  sheetIngName: { fontFamily: DS.fontFamily, flex: 1, fontSize: DS.f14, color: DS.mist, fontWeight: '600' },
  sheetAmtWrap: { backgroundColor: DS.snow, paddingHorizontal: DS.s8, paddingVertical: DS.s4, borderRadius: DS.rFull },
  sheetAmtTxt: { fontFamily: DS.fontFamily, fontSize: DS.f11, fontWeight: '800', color: DS.mist },

  sheetSaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: DS.s8, backgroundColor: DS.emerald, paddingVertical: 15, borderRadius: DS.r20, marginTop: DS.s12, shadowColor: DS.emerald, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  sheetSaveTxt: { fontFamily: DS.fontFamily, fontSize: DS.f15, fontWeight: '800', color: DS.card },
});


import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Text, View, SafeAreaView, ScrollView,
  TouchableOpacity, Dimensions, Modal, TextInput,
  KeyboardAvoidingView, Platform, StatusBar, Animated, Alert,
  Share as RNShare, Linking
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useThemeStore } from '../../store/useThemeStore';
import { THEME_NAMES, ThemeId, THEMES } from '../../config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { useCameraPermissions } from 'expo-camera';
import {
  Plus, RotateCcw, CheckCircle2, XCircle, AlertCircle,
  Star, Gift, Crown, Flame, Timer, Scale, BarChart2,
  TrendingDown, TrendingUp, Trophy, Flag, User, Activity,
  Target, ChevronUp, ChevronDown, MessageSquare, ChevronRight
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

// ─── 📦 STORE & CONFIG ───
import { useDiaryStore } from '../../store/useDiaryStore';
import { useAvatarStore } from '../../store/useAvatarStore';
import { SERVER_URL } from '../../config/api';

// ─── 📦 UTILS & HOOKS ───
import {
  calculateWaterTarget,
  checkWeightGoalReached,
  getBMICategory
} from '../../utils/fitnessCalc';
import { useWeightManager } from '../../hooks/useWeightManager';

// ─── 📦 MODULAR COMPONENTS ───
import { ProfileHeroCard } from '../../components/profile/ProfileHeroCard';
import { WeightCard } from '../../components/profile/WeightCard';
import { WaterCard } from '../../components/profile/WaterCard';
import { NutritionCard } from '../../components/profile/NutritionCard';
import { SettingsSection } from '../../components/profile/SettingsSection';
import { WeightVerificationModal } from '../../components/profile/WeightVerificationModal';
import { getProfileStyles } from '../../components/profile/ProfileStyles';
import { SectionHeader, AchievementCard, GlowDot } from '../../components/profile/Common';
import ProShareCard from '../../components/avatar/ProShareCard';

const AVATARS = ['🧔🏻‍♂️', '👨‍🍳', '🏋🏻‍♂️', '🏃🏻‍♂️', '🧘🏻‍♂️', '👩‍🍳', '🏋🏻‍♀️', '🧘🏻‍♀️', '🦸', '🧗', '🌿', '🌱', '🌊', '🔥', '⚡', '🌙', '☀️', '🍃', '🌺', '🦋', '🥗', '💪', '🥑', '🍎', '🥦', '🫀', '⚽', '🎯', '🏆', '🧬'];
const WEEKDAYS = { mon: 'ორშ', tue: 'სამ', wed: 'ოთხ', thu: 'ხუთ', fri: 'პარ', sat: 'შაბ', sun: 'კვ' };
const VALID_PROMOS = ['BALANSI-VIP'];

// ✅ BUG #3 FIX: const-ad გადატანა, state არ იცვლებოდა
const CHART_LABELS = ['კვ', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ'];

const FAQS = [
  { q: "როგორ ითვლის Balansi კალორიებს?", a: "ჩვენი სისტემა იყენებს კლინიკურად დადასტურებულ მიფლინ-სენტ ჯეორის ფორმულას." },
  { q: "როგორ განისაზღვრება წყლის დღიური ნორმა?", a: "წყლის ტრეკერი იყენებს პროფესიონალურ ფორმულას." },
  { q: "რა შედის Balansi PRO ვერსიაში?", a: "PRO გაძლევთ ულიმიტო AI სკანირებას და პრემიუმ რეცეპტებს." },
  { q: "რამდენად ზუსტია AI სკანერი?", a: "ის აანალიზებს ულუფის მოცულობას და ინგრედიენტებს." },
  { q: "რატომ მთხოვს აპლიკაცია სასწორის ფოტოს?", a: "ეს არის Trust-Verify სისტემა, რაც გაძლევთ მეტ XP-ს." }
];

export default function ProfileScreen() {
  const { themeId, setTheme } = useThemeStore();
  const C = THEMES[themeId as ThemeId] || THEMES.standard;
  const insets = useSafeAreaInsets();
  const TOP = insets.top;
  const BOTTOM = Math.max(insets.bottom, 16);
  const S = getProfileStyles(C, TOP, BOTTOM);
  const router = useRouter();
  const proShareViewRef = useRef<View>(null);
  const avatarStore = useAvatarStore();

  const [loading, setLoading] = useState(true);
  const { intake } = useDiaryStore();
  const [profile, setProfile] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<number[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [water, setWater] = useState(0);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [showAvatars, setShowAvatars] = useState(false);
  const [chartType, setChartType] = useState<'weight' | 'calories'>('weight');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null); // ✨ NEW
  const [promoCode, setPromoCode] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [brandAlert, setBrandAlert] = useState({ visible: false, title: '', message: '', type: 'error' });

  const waterFillAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.96)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const popAnim = useRef(new Animated.Value(0)).current; // ✨ For Center Pops

  const { isVerifying, setIsVerifying, handleWeightSave } = useWeightManager(profile, setProfile);

  useEffect(() => {
    Animated.loop(Animated.timing(waveAnim, { toValue: 1, duration: 4000, useNativeDriver: Platform.OS !== 'web' })).start();
    Animated.loop(Animated.timing(waveAnim2, { toValue: 1, duration: 7000, useNativeDriver: Platform.OS !== 'web' })).start();
  }, []);

  const triggerPop = (visible: boolean) => {
    if (visible) {
      popAnim.setValue(0);
      Animated.spring(popAnim, { toValue: 1, friction: 8, useNativeDriver: Platform.OS !== 'web' }).start();
    }
  };

  useEffect(() => {
    triggerPop(showStreakModal || !!selectedBadge || showHelpModal || showPromoModal || brandAlert.visible);
  }, [showStreakModal, selectedBadge, showHelpModal, showPromoModal, brandAlert.visible]);

  const loadProfileData = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('userProfile');
      if (!saved) { router.replace('/onboarding'); return; }
      const p = JSON.parse(saved);
      setIsPro(p.isPro || false);
      setProfile(p);

      const hs = await AsyncStorage.getItem('weightHistory');
      const history = hs ? JSON.parse(hs).filter((v: any) => typeof v === 'number' && isFinite(v)) : [Number(p.weight) || 70];
      setWeightHistory(history);

      const waterVal = parseInt(await AsyncStorage.getItem(`water_${new Date().toISOString().split('T')[0]}`) || '0');
      setWater(waterVal);

      const tgtW = calculateWaterTarget(p);
      Animated.timing(waterFillAnim, {
        toValue: Math.min((waterVal / (tgtW || 1)) * 100, 100),
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } catch (e) {
      router.replace('/onboarding');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(useCallback(() => { loadProfileData(); }, [loadProfileData]));

  const getCalorieHistory = () => {
    const keys = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    return keys.map(dateStr => {
      const val = intake[dateStr]?.calories;
      return (typeof val === 'number' && isFinite(val)) ? Math.round(val) : 0;
    });
  };

  const updateAvatar = async (emo: string) => {
    const p = { ...profile, avatar: emo };
    setProfile(p);
    await AsyncStorage.setItem('userProfile', JSON.stringify(p));
    setShowAvatars(false);
  };

  const handleAddWater = async () => {
    const newWater = water + 250;
    setWater(newWater);
    await AsyncStorage.setItem(`water_${new Date().toISOString().split('T')[0]}`, newWater.toString());
    const tgtW = calculateWaterTarget(profile);
    Animated.timing(waterFillAnim, {
      toValue: Math.min((newWater / (tgtW || 1)) * 100, 100),
      duration: 350,
      useNativeDriver: false,
    }).start();
  };

  const handleResetWater = async () => {
    setWater(0);
    await AsyncStorage.setItem(`water_${new Date().toISOString().split('T')[0]}`, '0');
    Animated.timing(waterFillAnim, { toValue: 0, duration: 600, useNativeDriver: false }).start();
  };

  // ✅ BUG #4 FIX: share-ის შეცდომისას შეტყობინება
  const handleShare = async () => {
    try {
      if (!isPro) {
        setBrandAlert({
          visible: true,
          title: 'PRO ფუნქცია',
          message: 'შერინგი ხელმისაწვდომია მხოლოდ PRO ვერსიაში.',
          type: 'error',
        });
        return;
      }
      if (proShareViewRef.current) {
        const localUri = await captureRef(proShareViewRef, { format: 'png', quality: 1 });
        await Sharing.shareAsync(localUri);
      }
    } catch (e: any) {
      setBrandAlert({
        visible: true,
        title: 'შერინგი ვერ მოხერხდა',
        message: 'სცადეთ მოგვიანებით.',
        type: 'error',
      });
    }
  };

  const triggerVerification = () => {
    if (!newWeight || isNaN(parseFloat(newWeight))) {
      setBrandAlert({ visible: true, title: 'შეცდომა', message: 'გთხოვთ, შეიყვანოთ სწორი წონა.', type: 'error' });
      return;
    }
    setShowWeightModal(false);
    setTimeout(() => setShowVerifyModal(true), 400);
  };

  const handleWeightSaveResult = (res: any) => {
    if (!res.success) {
      setBrandAlert({ visible: true, title: 'შეცდომა', message: res.message, type: 'error' });
      return;
    }
    const title = res.isTruth ? 'წარმატება! ✅' : 'ნდობის გაფრთხილება ⚠️';
    setBrandAlert({ visible: true, title, message: res.message, type: res.isTruth ? 'success' : 'error' });
    setNewWeight('');
    loadProfileData();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.5 });
    if (!result.canceled && result.assets[0]?.uri) {
      setShowVerifyModal(false);
      const res = await handleWeightSave(parseFloat(newWeight), true, result.assets[0].uri);
      handleWeightSaveResult(res);
    }
  };

  const openCamera = async () => {
    const perm = await requestPermission();
    if (!perm.granted) {
      Alert.alert('წვდომა უარყოფილია', 'კამერაზე წვდომა აუცილებელია ვერიფიკაციისთვის.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.5 });
    if (!result.canceled && result.assets[0]?.uri) {
      setShowVerifyModal(false);
      const res = await handleWeightSave(parseFloat(newWeight), true, result.assets[0].uri);
      handleWeightSaveResult(res);
    }
  };

  const handleManualSave = async () => {
    setShowVerifyModal(false);
    const res = await handleWeightSave(parseFloat(newWeight), false);
    handleWeightSaveResult(res);
  };

  const submitPromoCode = async () => {
    if (VALID_PROMOS.includes(promoCode.trim().toUpperCase())) {
      const p = { ...profile, isPro: true };
      setProfile(p); setIsPro(true);
      await AsyncStorage.setItem('userProfile', JSON.stringify(p));
      setShowPromoModal(false); setPromoCode('');
      setBrandAlert({ visible: true, title: 'გილოცავთ! 🎉', message: 'PRO ვერსია გააქტიურდა!', type: 'success' });
    } else {
      Alert.alert('შეცდომა', 'პრომო კოდი არასწორია.');
    }
  };

  // ✅ BUG #1 FIX: Reset ფუნქცია
  const handleResetData = () => {
    Alert.alert(
      'მონაცემების განულება',
      'დარწმუნებული ხართ? ყველა თქვენი მონაცემი წაიშლება.',
      [
        { text: 'გაუქმება', style: 'cancel' },
        {
          text: 'განულება',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'userProfile', 'weightHistory', 'favoriteRecipes',
                'cachedRecipes', 'trendingData',
              ]);
              router.replace('/onboarding');
            } catch {
              setBrandAlert({
                visible: true,
                title: 'შეცდომა',
                message: 'მონაცემების წაშლა ვერ მოხერხდა.',
                type: 'error',
              });
            }
          },
        },
      ]
    );
  };

  if (loading || !profile) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  // ✅ BUG #7 FIX: safe guards NaN-ის წინააღმდეგ
  const currentW = Number(weightHistory[weightHistory.length - 1]) || Number(profile.weight) || 0;
  const startW = Number(weightHistory[0]) || Number(profile.weight) || currentW;
  const targetW = parseFloat(profile.targetWeight) || currentW;

  const totalChangeNum = currentW - startW;
  const totalChange = isFinite(totalChangeNum) ? totalChangeNum.toFixed(1) : '0.0';
  const diffToTgtNum = Math.abs(currentW - targetW);
  const diffToTgt = isFinite(diffToTgtNum) ? diffToTgtNum.toFixed(1) : '0.0';

  const isReached = checkWeightGoalReached(currentW, targetW, profile.goal);
  const changeColor = profile.goal === 'lose'
    ? (parseFloat(totalChange) <= 0 ? C.primary : C.red)
    : (parseFloat(totalChange) >= 0 ? C.primary : C.red);

  const progressDenom = Math.abs(targetW - startW) || 1;
  const progressPct = Math.min(Math.abs(currentW - startW) / progressDenom, 1);

  const totalXP = profile.totalXP || 0;
  const level = Math.floor(1 + (totalXP / 100));
  const bmiVal = parseFloat(profile.bmi || '0');
  const bmiInfo = getBMICategory(isFinite(bmiVal) ? bmiVal : 0);

  const calorieHistory = getCalorieHistory();
  const consumedToday = intake[new Date().toISOString().split('T')[0]] || { calories: 0, protein: 0, carbs: 0, fats: 0 };
  const calorieProgress = Math.min(consumedToday.calories / (profile.targetCalories || 2000), 1);

  // ✅ BUG #6 FIX: chart empty state
  const wData = weightHistory.filter(v => typeof v === 'number' && isFinite(v)).slice(-7);
  const hasEnoughWeightData = wData.length >= 2;
  const chartWeightData = hasEnoughWeightData ? wData : (wData.length === 1 ? [wData[0], wData[0]] : [currentW, currentW]);
  const chartWeightLabels = chartWeightData.map((_, i) => `${i + 1}`);

  const avgWeight = wData.length > 0 ? (wData.reduce((a, b) => a + b, 0) / wData.length).toFixed(1) : String(currentW);
  const avgCals = Math.round(calorieHistory.reduce((a, b) => a + b, 0) / 7);
  const targetWater = calculateWaterTarget(profile);
  const waterBarHeight = waterFillAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  // ✅ BUG #5 FIX: badges safe array
  const badges: string[] = Array.isArray(profile.badges) ? profile.badges : [];

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
      >

        <ProfileHeroCard
          profile={profile}
          isPro={isPro}
          level={level}
          totalXP={totalXP}
          bmiInfo={bmiInfo}
          heroScale={heroScale}
          C={C}
          S={S}
          onAvatarPress={() => setShowAvatars(!showAvatars)}
          onSharePress={handleShare}
          onStreakPress={() => setShowStreakModal(true)}
        />
        
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>

        {!isPro && (
          <TouchableOpacity style={S.proBanner} onPress={() => router.push('/paywall')} activeOpacity={0.85}>
            <View style={S.proBannerBgGlow} />
            <View style={S.proBannerContent}>
              <View style={S.proBannerIconWrap}><Crown size={26} color={C.gold} /></View>
              <View style={{ flex: 1 }}>
                <Text style={S.proBannerTitle}>შენი პოტენციალი უსაზღვროა 🚀</Text>
                <Text style={S.proBannerSub}>გაიგე რატომ ირჩევენ Balansi PRO-ს.</Text>
              </View>
              <ChevronRight size={20} color={C.gold} />
            </View>
          </TouchableOpacity>
        )}

        <View style={S.statsRow}>
          <WeightCard
            currentW={currentW} totalChange={totalChange} isReached={isReached}
            progressPct={progressPct} targetWeight={targetW} diffToTgt={diffToTgt}
            changeColor={changeColor} cardScale={cardScale} C={C} S={S}
            onPress={() => setShowWeightModal(true)}
          />

          <WaterCard
            water={water} targetWater={targetWater} waterBarHeight={waterBarHeight}
            waveAnim={waveAnim} waveAnim2={waveAnim2} C={C} S={S}
            onAddWater={handleAddWater} onResetWater={handleResetWater}
          />
        </View>

        <NutritionCard
          consumedToday={consumedToday} profile={profile} calorieProgress={calorieProgress}
          chartType={chartType} setChartType={setChartType}
          chartLabels={CHART_LABELS} chartWeightLabels={chartWeightLabels}
          chartWeightData={chartWeightData} calorieHistory={calorieHistory}
          totalChange={totalChange} C={C} S={S}
        />

        <SectionHeader title="🏆 შენი მიღწევები" action="ყველა" onAction={() => { }} S={S} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20, gap: 10 }} style={{ marginBottom: 24 }}>
          {badges.map((key: string) => {
            const isPin = key === 'pinocchio';
            const b = { 
              key, 
              label: isPin ? 'მატყუარა' : 'ჩემპიონი', 
              desc: isPin ? 'ნაკლები ნდობა' : 'მიზანი მიღწეულია',
              icon: isPin ? XCircle : Star,
              color: isPin ? C.red : C.gold,
              bg: isPin ? C.redLight : C.goldLight
            };
            return (
              <TouchableOpacity key={key} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedBadge(b); }}>
                <AchievementCard 
                  icon={b.icon} label={b.label} desc={b.desc}
                  color={b.color} bg={b.bg} locked={false} S={S} C={C} 
                />
              </TouchableOpacity>
            );
          })}
          <AchievementCard icon={Gift} label="გახსნა" desc="მალე" color={C.inkLight} bg={C.surfaceMid} locked={true} S={S} C={C} />
        </ScrollView>

        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={[S.cardIconWrap, { backgroundColor: C.tealLight }]}><BarChart2 size={17} color={C.teal} /></View>
            <Text style={S.cardTitle}>შენი კვირა ციფრებში 📊</Text>
          </View>
          <View style={S.summaryRow}>
            {[
              { label: 'საშ. წონა', val: `${avgWeight} კგ`, color: C.primaryDark },
              { label: 'საშ. კკალ', val: `${avgCals} კკ`, color: C.orange },
              {
                label: 'ნდობა',
                val: `${profile.trustScore || 100}%`,
                color: (profile.trustScore || 100) < 40 ? C.red : (profile.trustScore || 100) < 80 ? C.orange : C.purple,
                showBar: true
              },
            ].map((item, i) => (
              <View key={i} style={[S.summaryTile, { borderColor: item.color + '25' }]}>
                <GlowDot color={item.color} size={6} />
                <Text style={[S.summaryVal, { color: item.color }]}>{item.val}</Text>
                <Text style={S.summaryLabel}>{item.label}</Text>
                {item.showBar && (
                  <View style={{ width: '80%', height: 3, backgroundColor: C.surfaceMid, borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                    <View style={{ width: `${profile.trustScore || 100}%`, height: '100%', backgroundColor: item.color }} />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <SettingsSection
          themeId={themeId} setTheme={setTheme} isPro={isPro}
          notifEnabled={notifEnabled} toggleNotifications={() => setNotifEnabled(!notifEnabled)}
          onPromoPress={() => setShowPromoModal(true)}
          onSharePress={handleShare} onHelpPress={() => setShowHelpModal(true)}
          onResetPress={handleResetData}
          THEME_NAMES={THEME_NAMES} C={C} S={S} router={router}
        />

        <Text style={S.versionTxt}>Balansi v2.0.0</Text>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* 🧬 MODALS 🧬 */}
      <WeightVerificationModal
        showWeightModal={showWeightModal} setShowWeightModal={setShowWeightModal}
        showVerifyModal={showVerifyModal} setShowVerifyModal={setShowVerifyModal}
        newWeight={newWeight} setNewWeight={setNewWeight} isVerifying={isVerifying}
        onContinue={triggerVerification} onCameraPress={openCamera}
        onGalleryPress={pickImage} onManualSave={handleManualSave}
        C={C} S={S}
      />

      {/* ✨ STREAK MODAL */}
      <Modal visible={showStreakModal} transparent animationType="fade">
        <View style={[S.modalOverlay, { justifyContent: 'center', paddingHorizontal: 24 }]}>
          <Animated.View style={[S.alertCard, { alignItems: 'center', transform: [{ scale: popAnim }] }]}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: '#FF6B3520',
              justifyContent: 'center', alignItems: 'center',
              marginBottom: 14,
            }}>
              <Flame size={38} color="#FF6B35" fill="#FF6B35" />
            </View>
            <Text style={[S.alertTitle, { fontSize: 22 }]}>
              {profile?.streak || 0} დღის სერია! 🔥
            </Text>
            <Text style={[S.alertMsg, { marginBottom: 20 }]}>
              {(profile?.streak || 0) > 0
                ? 'განაგრძე ყოველდღიური აქტივობა, რომ შენი სერია არ დაირღვეს. ყოველი დღე = +10 XP!'
                : 'დაიწყე დღეს — ყოველდღიური აქტივობით ააშენე შენი სერია და მიიღე ბონუს XP.'}
            </Text>
            <TouchableOpacity style={S.modalSolidBtn} onPress={() => setShowStreakModal(false)}>
              <Text style={S.modalSolidBtnTxt}>გასაგებია</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* 🏆 BADGE DETAIL MODAL */}
      <Modal visible={!!selectedBadge} transparent animationType="fade">
        <View style={[S.modalOverlay, { justifyContent: 'center', paddingHorizontal: 24 }]}>
          {selectedBadge && (
            <Animated.View style={[S.alertCard, { alignItems: 'center', transform: [{ scale: popAnim }] }]}>
              <View style={{
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: selectedBadge.bg,
                justifyContent: 'center', alignItems: 'center',
                marginBottom: 16,
                borderWidth: 2, borderColor: selectedBadge.color + '40'
              }}>
                <selectedBadge.icon size={40} color={selectedBadge.color} fill={selectedBadge.color + '20'} />
              </View>
              <Text style={[S.alertTitle, { fontSize: 24 }]}>{selectedBadge.label}</Text>
              <Text style={[S.alertMsg, { marginBottom: 24, textAlign: 'center' }]}>
                {selectedBadge.desc}. ყოჩაღ! Balansi-ს ერთგული წევრობისთვის შენ ეს ჯილდო დაიმსახურე. ✨
              </Text>
              <TouchableOpacity style={[S.modalSolidBtn, { backgroundColor: selectedBadge.color }]} onPress={() => setSelectedBadge(null)}>
                <Text style={S.modalSolidBtnTxt}>რა მაგარია! 🤩</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </Modal>

      {/* Help Modal */}
      <Modal visible={showHelpModal} transparent animationType="slide">
        <View style={S.modalOverlay}>
          <View style={S.modalSheet}>
            <View style={S.modalSheetHandle} />
            <Text style={S.modalSheetTitle}>🌿 დახმარება</Text>
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              {FAQS.map((faq, i) => {
                const isOpen = expandedFaq === i;
                return (
                  <TouchableOpacity key={i}
                    style={[S.faqItem, isOpen && S.faqItemOpen]}
                    onPress={() => setExpandedFaq(isOpen ? null : i)}
                    activeOpacity={0.75}
                  >
                    <View style={S.faqRow}>
                      <Text style={[S.faqQ, isOpen && { color: C.primary }]}>{faq.q}</Text>
                      {isOpen ? <ChevronUp size={16} color={C.primary} /> : <ChevronDown size={16} color={C.inkLight} />}
                    </View>
                    {isOpen && <Text style={S.faqA}>{faq.a}</Text>}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={S.supportBtn} onPress={() => Linking.openURL('mailto:balansiapp@gmail.com')}>
                <MessageSquare size={16} color="#FFF" />
                <Text style={S.supportBtnTxt}>მხარდაჭერის გუნდთან დაკავშირება</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={S.modalSheetClose} onPress={() => setShowHelpModal(false)}>
              <XCircle size={26} color={C.inkLight} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={brandAlert.visible} transparent animationType="fade">
        <View style={[S.modalOverlay, { justifyContent: 'center', paddingHorizontal: 24 }]}>
          <Animated.View style={[S.alertCard, { transform: [{ scale: popAnim }] }]}>
            <Text style={S.alertTitle}>{brandAlert.title}</Text>
            <Text style={S.alertMsg}>{brandAlert.message}</Text>
            <TouchableOpacity style={S.modalSolidBtn} onPress={() => setBrandAlert({ ...brandAlert, visible: false })}>
              <Text style={S.modalSolidBtnTxt}>გასაგებია</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {isPro && (
        <View style={{ position: 'absolute', left: -9999, top: -9999 }}>
          <ProShareCard
            ref={proShareViewRef}
            bodyState={avatarStore.bodyState}
            timeState={avatarStore.timeState}
            streakLevel={avatarStore.streakLevel}
            C={C}
            userName={profile?.name || ''}
            weight={currentW}
            streak={profile?.streak || 0}
            level={level}
            totalXP={totalXP}
          />
        </View>
      )}

    </View>
  );
}

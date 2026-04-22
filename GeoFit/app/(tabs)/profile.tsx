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
  const BOTTOM = Math.max(insets.bottom, 16);
  const S = getProfileStyles(C, BOTTOM);
  const router = useRouter();
  const proShareViewRef = useRef<View>(null);
  const avatarStore = useAvatarStore();
  
  const [loading, setLoading] = useState(true);
  const { intake } = useDiaryStore();
  const [profile, setProfile] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<number[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [chartLabels, setChartLabels] = useState<string[]>(['კვ', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ']);
  const [water, setWater] = useState(0);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [showAvatars, setShowAvatars] = useState(false);
  const [chartType, setChartType] = useState<'weight' | 'calories'>('weight');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [brandAlert, setBrandAlert] = useState({ visible: false, title: '', message: '', type: 'error' });
  
  const waterFillAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.96)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  // New Weight Manager Hook
  const { isVerifying, setIsVerifying, handleWeightSave } = useWeightManager(profile, setProfile);

  useEffect(() => {
    Animated.loop(Animated.timing(waveAnim, { toValue: 1, duration: 4000, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(waveAnim2, { toValue: 1, duration: 7000, useNativeDriver: true })).start();
  }, []);

  const loadProfileData = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('userProfile');
      if (saved) {
        let p = JSON.parse(saved);
        setIsPro(p.isPro || false);
        setProfile(p);
      } else { router.replace('/onboarding'); return; }
      const hs = await AsyncStorage.getItem('weightHistory');
      const history = hs ? JSON.parse(hs) : [JSON.parse(saved).weight];
      setWeightHistory(history);
      const waterVal = parseInt(await AsyncStorage.getItem(`water_${new Date().toISOString().split('T')[0]}`) || '0');
      setWater(waterVal);
      const tgtW = calculateWaterTarget(JSON.parse(saved));
      Animated.timing(waterFillAnim, { toValue: Math.min((waterVal / tgtW) * 100, 100), duration: 1000, useNativeDriver: false }).start();
    } catch (e) { router.replace('/onboarding'); } finally { setLoading(false); }
  }, [router]);

  useFocusEffect(useCallback(() => { loadProfileData(); }, [loadProfileData]));

  const getCalorieHistory = () => {
    const keys = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
    return keys.map(dateStr => Math.round(intake[dateStr]?.calories || 0));
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
    Animated.timing(waterFillAnim, { toValue: Math.min((newWater / tgtW) * 100, 100), duration: 350, useNativeDriver: false }).start();
  };

  const handleResetWater = async () => {
    setWater(0);
    await AsyncStorage.setItem(`water_${new Date().toISOString().split('T')[0]}`, '0');
    Animated.timing(waterFillAnim, { toValue: 0, duration: 600, useNativeDriver: false }).start();
  };

  const handleShare = async () => {
    try {
      if (proShareViewRef.current) {
        const localUri = await captureRef(proShareViewRef, { format: 'png', quality: 1 });
        await Sharing.shareAsync(localUri);
      }
    } catch (e) {}
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

  if (loading || !profile) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  const currentW = weightHistory[weightHistory.length - 1] || profile.weight;
  const startW = weightHistory[0] || profile.weight;
  const totalChange = (currentW - startW).toFixed(1);
  const diffToTgt = Math.abs(currentW - parseFloat(profile.targetWeight || currentW)).toFixed(1);
  const isReached = checkWeightGoalReached(currentW, parseFloat(profile.targetWeight), profile.goal);
  const changeColor = profile.goal === 'lose' ? (parseFloat(totalChange) <= 0 ? C.primary : C.red) : (parseFloat(totalChange) >= 0 ? C.primary : C.red);
  const progressPct = Math.min(Math.abs(currentW - startW) / (Math.abs(parseFloat(profile.targetWeight) - startW) || 1), 1);
  const totalXP = profile.totalXP || 0;
  const level = Math.floor(1 + (totalXP / 100));
  const bmiInfo = getBMICategory(parseFloat(profile.bmi || '0'));
  
  const calorieHistory = getCalorieHistory();
  const consumedToday = intake[new Date().toISOString().split('T')[0]] || { calories: 0, protein: 0, carbs: 0, fats: 0 };
  const calorieProgress = Math.min(consumedToday.calories / (profile.targetCalories || 2000), 1);
  const wData = weightHistory.slice(-7);
  const chartWeightData = wData.length > 1 ? wData : [currentW, currentW];
  const chartWeightLabels = chartWeightData.map((_, i) => `${i + 1}`);
  const avgWeight = wData.length > 0 ? (wData.reduce((a, b) => a + b, 0) / wData.length).toFixed(1) : currentW;
  const avgCals = Math.round(calorieHistory.reduce((a, b) => a + b, 0) / 7);
  const targetWater = calculateWaterTarget(profile);
  const waterBarHeight = waterFillAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <SafeAreaView style={S.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
        
        <ProfileHeroCard 
          profile={profile} isPro={isPro} level={level} totalXP={totalXP} 
          bmiInfo={bmiInfo} heroScale={heroScale} C={C} S={S}
          onAvatarPress={() => setShowAvatars(!showAvatars)} 
          onSharePress={handleShare} 
        />

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

        <WeightCard 
          currentW={currentW} totalChange={totalChange} isReached={isReached}
          progressPct={progressPct} targetWeight={profile.targetWeight} diffToTgt={diffToTgt}
          changeColor={changeColor} cardScale={cardScale} C={C} S={S}
          onPress={() => setShowWeightModal(true)}
        />

        <WaterCard 
          water={water} targetWater={targetWater} waterBarHeight={waterBarHeight}
          waveAnim={waveAnim} waveAnim2={waveAnim2} C={C} S={S}
          onAddWater={handleAddWater} onResetWater={handleResetWater}
        />

        <TouchableOpacity style={S.logBtn} onPress={() => setShowWeightModal(true)} activeOpacity={0.85}>
          <View style={S.logBtnGlow} />
          <Scale size={18} color="#FFF" />
          <Text style={S.logBtnTxt}>აწონვა</Text>
        </TouchableOpacity>

        <NutritionCard 
          consumedToday={consumedToday} profile={profile} calorieProgress={calorieProgress}
          chartType={chartType} setChartType={setChartType}
          chartLabels={chartLabels} chartWeightLabels={chartWeightLabels}
          chartWeightData={chartWeightData} calorieHistory={calorieHistory}
          totalChange={totalChange} C={C} S={S}
        />

        <SectionHeader title="🏅 ჯილდოები" action="ყველა" onAction={() => { }} S={S} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20, gap: 10 }} style={{ marginBottom: 24 }}>
          {profile.badges?.map((key: string) => (
             <AchievementCard key={key}
                icon={Star} label={key === 'pinocchio' ? 'მატყუარა' : 'ჩემპიონი'} 
                desc={key === 'pinocchio' ? 'ნაკლები ნდობა' : 'მიზანი მიღწეულია'}
                color={key === 'pinocchio' ? C.red : C.gold} 
                bg={key === 'pinocchio' ? C.redLight : C.goldLight} 
                locked={false} S={S} C={C} />
          ))}
          <AchievementCard icon={Gift} label="გახსნა" desc="მალე" color={C.inkLight} bg={C.surfaceMid} locked={true} S={S} C={C} />
        </ScrollView>

        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={[S.cardIconWrap, { backgroundColor: C.tealLight }]}><BarChart2 size={17} color={C.teal} /></View>
            <Text style={S.cardTitle}>კვირის შეჯამება</Text>
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
          onResetPress={() => {}}
          THEME_NAMES={THEME_NAMES} C={C} S={S} router={router}
        />

        <Text style={S.versionTxt}>Balansi v2.0.0</Text>
        <View style={{ height: 60 }} />
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

      {/* Legacy Help/Promo/Alert Modals retained for full functionality */}
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
          <View style={S.alertCard}>
            <Text style={S.alertTitle}>{brandAlert.title}</Text>
            <Text style={S.alertMsg}>{brandAlert.message}</Text>
            <TouchableOpacity style={S.modalSolidBtn} onPress={() => setBrandAlert({ ...brandAlert, visible: false })}>
              <Text style={S.modalSolidBtnTxt}>გასაგებია</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🧬 Hidden Pro Share Card */}
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

    </SafeAreaView>
  );
}

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
  Plus, RotateCcw, CheckCircle, XCircle, AlertCircle,
  Star, Gift, Crown, Flame, Timer, Scale, BarChart2,
  TrendingDown, TrendingUp, Trophy, Flag, User, Activity,
  Target, ChevronUp, ChevronDown, MessageSquare, ChevronRight,
  ShieldCheck, CalendarCheck, Sunrise, Dumbbell, Gem, 
  Droplets, RefreshCw, Utensils, Heart, Leaf, Lock
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
import { AvatarPickerModal } from '../../components/profile/AvatarPickerModal';

import { BrandAlert, BAlertState } from '../../components/ui/BrandAlert';

const WEEKDAYS = { mon: 'ორშ', tue: 'სამ', wed: 'ოთხ', thu: 'ხუთ', fri: 'პარ', sat: 'შაბ', sun: 'კვ' };
const VALID_PROMOS = ['BEKA-PRO-2026', 'BALANSI-VIP'];

const BADGE_REGISTRY = {
  // 🔰 0. საწყისი
  starter: { label: 'დამწყები', desc: 'პირველი ნაბიჯი Balansi-ში', icon: Flag, color: '#3B82F6', category: 'starter' },

  // 🏆 1. ხასიათი და დისციპლინა
  unstoppable: { label: 'შეუპოვარი', desc: '21 დღე იდეალური რეჟიმი', icon: ShieldCheck, color: '#3B82F6', category: 'consistency' },
  weekend_master: { label: 'უქმეების ოსტატი', desc: 'შაბათ-კვირის რეჟიმის დაცვა', icon: CalendarCheck, color: '#8B5CF6', category: 'consistency' },
  proactive: { label: 'პროაქტიული', desc: 'საუზმე და ლოგი 09:00-მდე', icon: Sunrise, color: '#F59E0B', category: 'consistency' },
  
  // 🧬 2. ნუტრიციის არქიტექტორები
  balance_master: { label: 'ბალანსის ოსტატი', desc: 'კალორიების სიზუსტე (±50)', icon: Target, color: '#10B981', category: 'nutrition' },
  athlete: { label: 'ათლეტი', desc: 'პროტეინის 100% ნორმა (7 დღე)', icon: Dumbbell, color: '#EF4444', category: 'nutrition' },
  unwavering: { label: 'ურყევი', desc: '5 დღე შაქრის გარეშე', icon: Gem, color: '#EC4899', category: 'nutrition' },
  pure_energy: { label: 'სუფთა ენერგია', desc: 'წყლის 100% ნორმა (10 დღე)', icon: Droplets, color: '#0EA5E9', category: 'nutrition' },
  
  // 🕵️ 3. ფარული ბეჯები
  phoenix: { label: 'ფენიქსი', desc: 'აღდგენა გადაჭარბების შემდეგ', icon: RefreshCw, color: '#F97316', category: 'hidden', isHidden: true },
  gourmet: { label: 'გურმანი', desc: '15 ახალი რეცეპტის მოსინჯვა', icon: Utensils, color: '#84CC16', category: 'hidden', isHidden: true },
  caring: { label: 'მზრუნველი', desc: 'ავატარზე ხშირი ზრუნვა', icon: Heart, color: '#F43F5E', category: 'hidden', isHidden: true },

  pinocchio: { label: 'მატყუარა', desc: 'ეს ბეიჯი ნამდვილად არ გინდა! 🤥 არაა მოსაპოვებელი...', icon: XCircle, color: '#4B5563', isWarning: true, category: 'hidden' },
};

// ✅ BUG #3 FIX: const-ad გადატანა, state არ იცვლებოდა
const CHART_LABELS = ['კვ', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ'];
const { width: SW, height: SH } = Dimensions.get('window');

const FAQS = [
  // ... (keeping FAQS content)
  {
    q: "რატომ უნდა ვენდო Balansi-ს გამოთვლებს?",
    a: "ჩვენი ალგორითმი ეყრდნობა მსოფლიო ჯანდაცვის ორგანიზაციის (WHO) მიერ აღიარებულ Mifflin-St Jeor ფორმულას. გარდა ამისა, AI სკანერი გადის მუდმივ ვალიდაციას რეალურ ნუტრიციოლოგებთან, რათა უზრუნველყოს მაქსიმალური სიზუსტე."
  },
  {
    q: "როგორ მუშაობს AI სკანერი და რამდენად ზუსტია?",
    a: "Balansi-ს ხელოვნური ინტელექტი აანალიზებს ფოტოს სიღრმეს, ულუფის მოცულობას და ინგრედიენტების სიმკვრივეს. ის არა მხოლოდ ცნობს პროდუქტს, არამედ ითვლის სავარაუდო წონასაც, რაც მას 90%+ სიზუსტეს ანიჭებს."
  },
  {
    q: "რა არის Trust-Verify სისტემა და რატომ მთხოვს ფოტოს?",
    a: "ეს არის ჩვენი უნიკალური მეთოდი მომხმარებლის დისციპლინისთვის. როდესაც სასწორის ფოტოს ტვირთავთ, სისტემა ადასტურებს პროგრესს, რაც ზრდის თქვენს რეიტინგს (XP) და გვეხმარება გეგმის უფრო ზუსტ კორექტირებაში."
  },
  {
    q: "არის თუ არა ჩემი მონაცემები დაცული?",
    a: "თქვენი პერსონალური მონაცემები და ფოტოები ინახება დაშიფრულ სერვერებზე. ჩვენ არასდროს ვაზიარებთ ინფორმაციას მესამე მხარეებთან. თქვენი კონფიდენციალურობა ჩვენი პრიორიტეტია."
  },
  {
    q: "რა უპირატესობა აქვს Balansi PRO-ს?",
    a: "PRO ვერსია ხსნის სრულ პოტენციალს: ულიმიტო AI სკანირება, პრემიუმ რეცეპტების ბიბლიოთეკა, დეტალური ანალიტიკა და პერსონალური ნუტრიციოლოგის რეჟიმი, რომელიც გირჩევთ საუკეთესო დროს კვებისთვის."
  }
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
  const { intake, setPremium } = useDiaryStore();
  const [profile, setProfile] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<number[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [water, setWater] = useState(0);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [chartType, setChartType] = useState<'weight' | 'calories'>('weight');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [promoCode, setPromoCode] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [brandAlert, setBrandAlert] = useState<BAlertState>({ visible: false, title: '', message: '', type: 'error' });
  const [winningBadge, setWinningBadge] = useState<any>(null); // For the new award animation
  const [showThemeModal, setShowThemeModal] = useState(false);

  const waterFillAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.96)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const popAnim = useRef(new Animated.Value(0)).current;

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
    const isVisible = showStreakModal || !!selectedBadge || !!winningBadge || showHelpModal || showPromoModal || brandAlert.visible || showThemeModal;
    triggerPop(isVisible);
  }, [showStreakModal, selectedBadge, winningBadge, showHelpModal, showPromoModal, brandAlert.visible, showThemeModal]);
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

      // 🏆 Check for New Badges
      const currentBadges = Array.isArray(p.badges) ? p.badges : [];
      let newBadges = [...currentBadges];
      let justWon: any = null;

      const today = new Date();
      const isWeekend = today.getDay() === 0 || today.getDay() === 6;
      const todayStr = today.toISOString().split('T')[0];
      const todayIntake = intake[todayStr] || { calories: 0, protein: 0, carbs: 0, fats: 0 };
      const calTarget = p.targetCalories || 2000;
      const protTarget = p.targetProtein || 120;
      const waterTarget = calculateWaterTarget(p);

      // 0. Starter (Initial)
      if (!newBadges.includes('starter')) {
        newBadges.push('starter');
        justWon = BADGE_REGISTRY['starter'];
      }

      // 1. Unstoppable (21 days)
      if (p.streak >= 21 && !newBadges.includes('unstoppable')) {
        newBadges.push('unstoppable');
        justWon = BADGE_REGISTRY['unstoppable'];
      }

      // 2. Weekend Master (Logging on weekend)
      if (isWeekend && todayIntake.calories > 0 && !newBadges.includes('weekend_master')) {
        newBadges.push('weekend_master');
        justWon = BADGE_REGISTRY['weekend_master'];
      }

      // 3. Proactive (Logging breakfast/early)
      const hour = today.getHours();
      if (hour < 10 && todayIntake.calories > 0 && !newBadges.includes('proactive')) {
        newBadges.push('proactive');
        justWon = BADGE_REGISTRY['proactive'];
      }

      // 4. Balance Master (Precision within 50kcal)
      const calDiff = Math.abs(todayIntake.calories - calTarget);
      if (todayIntake.calories > 0 && calDiff <= 50 && !newBadges.includes('balance_master')) {
        newBadges.push('balance_master');
        justWon = BADGE_REGISTRY['balance_master'];
      }

      // 5. Athlete (Protein target met)
      if (todayIntake.protein >= protTarget && !newBadges.includes('athlete')) {
        newBadges.push('athlete');
        justWon = BADGE_REGISTRY['athlete'];
      }

      // 6. Pure Energy (Water target met)
      if (waterVal >= waterTarget && waterVal > 0 && !newBadges.includes('pure_energy')) {
        newBadges.push('pure_energy');
        justWon = BADGE_REGISTRY['pure_energy'];
      }

      if (justWon) {
        const updatedP = { ...p, badges: newBadges };
        setProfile(updatedP);
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedP));
        
        // Show Animation with slight delay
        setTimeout(() => {
          setWinningBadge(justWon);
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 800);
      }

      // Sync Water Animation
      const tgtW = calculateWaterTarget(p);
      Animated.timing(waterFillAnim, {
        toValue: Math.min((waterVal / (tgtW || 1)) * 100, 100),
        duration: 1000,
        useNativeDriver: false,
      }).start();

    } catch (e) {
      console.error('Profile Load Error:', e);
    } finally {
      setLoading(false);
    }
  }, [router, intake]);

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

  // ✨ UPDATED: now receives emoji from picker modal's confirm
  const updateAvatar = async (emo: string) => {
    if (!profile) return;
    const p = { ...profile, avatar: emo };
    setProfile(p);
    await AsyncStorage.setItem('userProfile', JSON.stringify(p));
    setShowAvatarPicker(false); // ✅ Close modal after save
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

  // triggerVerification removed

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
    if (!newWeight || isNaN(parseFloat(newWeight))) { setBrandAlert({ visible: true, title: 'შეცდომა', message: 'გთხოვთ, შეიყვანოთ სწორი წონა.', type: 'error' }); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.5 });
    if (!result.canceled && result.assets[0]?.uri) {
      setShowWeightModal(false);
      const res = await handleWeightSave(parseFloat(newWeight), true, result.assets[0].uri);
      handleWeightSaveResult(res);
    }
  };

  const openCamera = async () => {
    if (!newWeight || isNaN(parseFloat(newWeight))) { setBrandAlert({ visible: true, title: 'შეცდომა', message: 'გთხოვთ, შეიყვანოთ სწორი წონა.', type: 'error' }); return; }
    const perm = await requestPermission();
    if (!perm.granted) {
      setBrandAlert({
        visible: true,
        title: 'წვდომა უარყოფილია',
        message: 'კამერაზე წვდომა აუცილებელია ვერიფიკაციისთვის.',
        type: 'warning'
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.5 });
    if (!result.canceled && result.assets[0]?.uri) {
      setShowWeightModal(false);
      const res = await handleWeightSave(parseFloat(newWeight), true, result.assets[0].uri);
      handleWeightSaveResult(res);
    }
  };

  const handleManualSave = async () => {
    if (!newWeight || isNaN(parseFloat(newWeight))) { setBrandAlert({ visible: true, title: 'შეცდომა', message: 'გთხოვთ, შეიყვანოთ სწორი წონა.', type: 'error' }); return; }
    setShowWeightModal(false);
    const res = await handleWeightSave(parseFloat(newWeight), false);
    handleWeightSaveResult(res);
  };

  const submitPromoCode = async () => {
    if (VALID_PROMOS.includes(promoCode.trim().toUpperCase())) {
      const p = { ...profile, isPro: true };
      setProfile(p); setIsPro(true);
      setPremium(true);
      await AsyncStorage.setItem('userProfile', JSON.stringify(p));
      setShowPromoModal(false); setPromoCode('');
      setBrandAlert({ visible: true, title: 'გილოცავთ! 🎉', message: 'PRO ვერსია გააქტიურდა!', type: 'success' });
    } else {
      setBrandAlert({ visible: true, title: 'შეცდომა', message: 'პრომო კოდი არასწორია.', type: 'error' });
    }
  };

  const handleResetData = () => {
    setBrandAlert({
      visible: true,
      type: 'warning',
      title: 'მონაცემების განულება',
      message: 'დარწმუნებული ხართ? ყველა თქვენი მონაცემი წაიშლება.',
      actions: [
        { label: 'გაუქმება', onPress: () => { } },
        {
          label: 'განულება',
          primary: true,
          danger: true,
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
          }
        }
      ]
    });
  };

  // ✨ Avatar press handler — opens new picker
  const handleAvatarPress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAvatarPicker(true);
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
          onAvatarPress={handleAvatarPress}
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

          <SectionHeader title="🏆 შენი მიღწევები" S={S} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 4, paddingRight: 20, gap: 12 }} style={{ marginBottom: 28 }}>
            {Object.entries(BADGE_REGISTRY).map(([key, b]: [string, any]) => {
              const isEarned = badges.includes(key);
              const BadgeIcon = b.icon;
              
              // Don't show hidden badges unless earned
              if (b.isHidden && !isEarned) return null;

              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedBadge({ ...b, key, isLocked: !isEarned });
                  }}
                  style={{ opacity: isEarned ? 1 : 0.65 }}
                >
                  <AchievementCard
                    icon={BadgeIcon}
                    label={b.label}
                    desc={isEarned ? b.desc : 'ჩაკეტილია'}
                    color={isEarned ? b.color : C.inkLight}
                    bg={isEarned ? b.color + '15' : C.surfaceMid}
                    locked={!isEarned}
                    S={S} C={C}
                  />
                </TouchableOpacity>
              );
            })}
            
            {/* Show a placeholder for hidden badges if none are earned */}
            {badges.filter(k => BADGE_REGISTRY[k]?.isHidden).length === 0 && (
              <View style={{ opacity: 0.4 }}>
                <AchievementCard
                  icon={Gift}
                  label="???"
                  desc="ფარული ჯილდო"
                  color={C.inkLight}
                  bg={C.surfaceMid}
                  locked={true}
                  S={S} C={C}
                />
              </View>
            )}
          </ScrollView>



          <SettingsSection
            themeId={themeId} setTheme={setTheme} isPro={isPro}
            notifEnabled={notifEnabled} toggleNotifications={() => setNotifEnabled(!notifEnabled)}
            onPromoPress={() => setShowPromoModal(true)}
            onSharePress={handleShare} onHelpPress={() => setShowHelpModal(true)}
            onThemePress={() => setShowThemeModal(true)}
            onResetPress={handleResetData}
            THEME_NAMES={THEME_NAMES} C={C} S={S} router={router}
          />

          <Text style={S.versionTxt}>Balansi v2.0.0</Text>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* 🧬 MODALS 🧬 */}

      {/* ✨ NEW: Avatar Picker */}
      <AvatarPickerModal
        visible={showAvatarPicker}
        currentAvatar={profile?.avatar || '🧔🏻‍♂️'}
        onClose={() => setShowAvatarPicker(false)}
        onSave={updateAvatar}
        C={C}
      />

      <WeightVerificationModal
        visible={showWeightModal}
        onClose={() => { setShowWeightModal(false); setNewWeight(''); }}
        newWeight={newWeight} setNewWeight={setNewWeight} isVerifying={isVerifying}
        onCameraPress={openCamera}
        onGalleryPress={pickImage}
        onManualSave={handleManualSave}
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

      {/* 🏆 BADGE DETAIL MODAL — ✅ FIX: assign icon to capitalized const for proper JSX rendering */}
      <Modal visible={!!selectedBadge} transparent animationType="fade">
        <View style={[S.modalOverlay, { justifyContent: 'center', paddingHorizontal: 24 }]}>
          {selectedBadge && (() => {
            const BadgeIcon = selectedBadge.icon;
            const isLocked = selectedBadge.isLocked;
            return (
              <Animated.View style={[S.alertCard, { alignItems: 'center', transform: [{ scale: popAnim }] }]}>
                <View style={{
                  width: 80, height: 80, borderRadius: 40,
                  backgroundColor: isLocked ? C.surfaceMid : selectedBadge.bg,
                  justifyContent: 'center', alignItems: 'center',
                  marginBottom: 16,
                  borderWidth: 2, borderColor: isLocked ? C.border : selectedBadge.color + '40'
                }}>
                  <BadgeIcon size={40} color={isLocked ? C.inkLight : selectedBadge.color} fill={isLocked ? 'transparent' : selectedBadge.color + '20'} />
                </View>
                <Text style={[S.alertTitle, { fontSize: 24 }]}>{selectedBadge.label}</Text>
                <Text style={[S.alertMsg, { marginBottom: 24, textAlign: 'center' }]}>
                  {(() => {
                    if (selectedBadge.isWarning) return selectedBadge.desc;
                    if (isLocked) return `ამ ბეიჯის მოსაპოვებლად საჭიროა: ${selectedBadge.desc}. განაგრძე აქტივობა! 💪`;
                    return `${selectedBadge.desc}. ყოჩაღ! Balansi-ს ერთგული წევრობისთვის შენ ეს ჯილდო დაიმსახურე. ✨`;
                  })()}
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: isLocked ? C.ink : selectedBadge.color,
                    paddingVertical: 16,
                    paddingHorizontal: 32,
                    borderRadius: 18,
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 10
                  }}
                  onPress={() => setSelectedBadge(null)}
                >
                  <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>
                    გასაგებია
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })()}
        </View>
      </Modal>

      {/* 🏆 WINNING BADGE ANIMATION OVERLAY */}
      <Modal visible={!!winningBadge} transparent animationType="fade">
        <View style={[S.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' }]}>
          {winningBadge && (() => {
            const Icon = winningBadge.icon;
            return (
              <View style={{ alignItems: 'center', width: '85%' }}>
                <Animated.View style={{
                  transform: [{ scale: popAnim }],
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  padding: 30,
                  borderRadius: 35,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)'
                }}>
                  <View style={{
                    width: 120, height: 120, borderRadius: 60,
                    backgroundColor: winningBadge.color + '20',
                    justifyContent: 'center', alignItems: 'center',
                    borderWidth: 3, borderColor: winningBadge.color,
                    shadowColor: winningBadge.color, shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.6, shadowRadius: 15, elevation: 12
                  }}>
                    <Icon size={60} color={winningBadge.color} fill={winningBadge.color + '20'} />
                  </View>
                  
                  <Text style={{ 
                    fontSize: 28, fontWeight: '900', color: '#FFF', 
                    marginTop: 25, textAlign: 'center' 
                  }}>ახალი მიღწევა! 🏆</Text>
                  
                  <Text style={{ 
                    fontSize: 20, fontWeight: '800', color: winningBadge.color, 
                    marginTop: 8, textAlign: 'center' 
                  }}>{winningBadge.label}</Text>
                  
                  <Text style={{ 
                    fontSize: 14, color: 'rgba(255,255,255,0.6)', 
                    marginTop: 15, textAlign: 'center', lineHeight: 22 
                  }}>
                    გილოცავ! შენ წარმატებით მოიპოვე ეს ჯილდო. განაგრძე წინსვლა Balansi-სთან ერთად! ✨
                  </Text>

                  <TouchableOpacity 
                    style={{ 
                      backgroundColor: winningBadge.color, 
                      marginTop: 35, 
                      paddingVertical: 16,
                      paddingHorizontal: 40,
                      borderRadius: 20,
                      shadowColor: winningBadge.color,
                      shadowOpacity: 0.4,
                      shadowRadius: 10,
                      elevation: 5
                    }} 
                    onPress={() => setWinningBadge(null)}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>გასაგებია</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            );
          })()}
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

      <BrandAlert
        state={brandAlert}
        onClose={() => setBrandAlert({ ...brandAlert, visible: false })}
      />

      {/* 🎁 PROMO CODE MODAL */}
      <Modal visible={showPromoModal} transparent animationType="fade">
        <View style={[S.modalOverlay, { justifyContent: 'center', paddingHorizontal: 24 }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Animated.View style={[S.alertCard, { width: SW * 0.85, transform: [{ scale: popAnim }] }]}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <Gift size={30} color={C.primaryDark} />
                </View>
                <Text style={S.alertTitle}>პრომო კოდი 🎁</Text>
                <Text style={S.alertMsg}>შეიყვანე საიდუმლო კოდი PRO ვერსიის გასააქტიურებლად</Text>
              </View>

              <TextInput
                style={{
                  width: '100%',
                  height: 54,
                  backgroundColor: C.surfaceMid,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  fontSize: 16,
                  fontWeight: '700',
                  color: C.ink,
                  textAlign: 'center',
                  borderWidth: 2,
                  borderColor: C.primaryBorder,
                  marginBottom: 20
                }}
                placeholder="ჩაწერე კოდი..."
                placeholderTextColor={C.inkLight}
                value={promoCode}
                onChangeText={setPromoCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={{ flex: 1, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: C.surfaceMid }}
                  onPress={() => { setShowPromoModal(false); setPromoCode(''); }}
                >
                  <Text style={{ fontWeight: '800', color: C.inkMid }}>გაუქმება</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 2, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: C.primary }}
                  onPress={submitPromoCode}
                >
                  <Text style={{ fontWeight: '900', color: '#FFF' }}>გააქტიურება</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* 🎨 THEME SELECTION MODAL — CREATIVE MINIMALIST UI */}
      <Modal visible={showThemeModal} transparent animationType="slide">
        <View style={[S.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }]}>
          <Animated.View style={{ 
            backgroundColor: '#FFF',
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            padding: 28,
            paddingBottom: 45,
            width: '100%'
          }}>
            <View style={{ width: 40, height: 5, backgroundColor: '#F1F5F9', borderRadius: 10, alignSelf: 'center', marginBottom: 25 }} />
            
            <View style={{ marginBottom: 30 }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#0F172A' }}>დიზაინი & სტილი</Text>
              <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600', marginTop: 4 }}>აირჩიე შენი სასურველი ატმოსფერო</Text>
            </View>

            <View style={{ gap: 12 }}>
              {Object.keys(THEME_NAMES).map((tId: any) => {
                const tOpts = THEME_NAMES[tId];
                const isActive = themeId === tId;
                const isLocked = tOpts.isPremium && !isPro;
                const themeColors = THEMES[tId as ThemeId];

                return (
                  <TouchableOpacity
                    key={tId}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isActive ? themeColors.primaryLight : '#F8FAFC',
                      padding: 20,
                      borderRadius: 24,
                      borderLeftWidth: 6,
                      borderLeftColor: themeColors.primary,
                      shadowColor: isActive ? themeColors.primary : '#000',
                      shadowOffset: { width: 0, height: isActive ? 6 : 0 },
                      shadowOpacity: isActive ? 0.2 : 0,
                      shadowRadius: 15,
                      elevation: isActive ? 8 : 0
                    }}
                    onPress={() => {
                      Haptics.selectionAsync();
                      if (isLocked) {
                        setShowThemeModal(false);
                        router.push('/paywall');
                        return;
                      }
                      setTheme(tId);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ 
                          fontSize: 18, 
                          fontWeight: '900', 
                          color: isActive ? themeColors.primaryDark : '#1E293B' 
                        }}>
                          {tOpts.name}
                        </Text>
                        {isLocked && <Lock size={14} color="#94A3B8" style={{ marginLeft: 10 }} />}
                      </View>
                      <Text style={{ 
                        fontSize: 12, 
                        color: isActive ? themeColors.primaryDark + '80' : '#64748B', 
                        fontWeight: '600', 
                        marginTop: 2 
                      }}>
                        {tOpts.desc}
                      </Text>
                    </View>

                    {isActive && (
                      <View style={{ 
                        width: 28, height: 28, borderRadius: 14, 
                        backgroundColor: themeColors.primary, 
                        justifyContent: 'center', alignItems: 'center' 
                      }}>
                        <CheckCircle size={18} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity 
              style={{ 
                marginTop: 35, 
                backgroundColor: '#0F172A', 
                height: 60, 
                borderRadius: 22, 
                justifyContent: 'center', 
                alignItems: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 4
              }}
              onPress={() => setShowThemeModal(false)}
            >
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 16 }}>გასაგებია</Text>
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

      {/* 🎭 PREMIUM AVATAR PICKER */}
      <AvatarPickerModal
        visible={showAvatarPicker}
        currentAvatar={profile?.avatar || '🧔🏻‍♂️'}
        onClose={() => setShowAvatarPicker(false)}
        onSave={updateAvatar}
        C={C}
      />

    </View>
  );
}

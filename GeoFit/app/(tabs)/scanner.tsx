import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, TouchableOpacity,
  Animated, Dimensions, Platform, StatusBar, Alert, ScrollView, Modal
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Svg, Defs, Rect, Mask as SvgMask, Circle, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  Scan, Zap, Leaf, Image as ImageIcon, Activity, Search, X, Camera, RotateCcw, 
  CheckCircle, Lightbulb, Crown, Scale, PieChart, Info, HelpCircle, ChevronRight
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { BrandAlert, BAlertState } from '../../components/ui/BrandAlert';
import { useThemeStore } from '../../store/useThemeStore';
import { getColors } from '../../config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../../config/api';
import { useDiaryStore } from '../../store/useDiaryStore';

const { width: W, height: H } = Dimensions.get('window');
const FRAME_SIZE = W * 0.85;
const OVERLAY_COLOR = 'rgba(10, 15, 13, 0.85)';

// ─── Balansi Design System ─────────────────────────────


const LOADING_MESSAGES = [
  "ვაღვიძებთ AI შეფ-მზარეულს... 👨‍🍳",
  "ვსწავლობთ ინგრედიენტებს... 🔍",
  "ვითვლით მაკროებს... 🧮",
  "ვაანალიზებთ პორციის ზომას... ⚖️",
  "ვეძებთ კვებით ღირებულებას... 📚",
  "ვადარებთ მონაცემებს... 🔄",
  "ვამზადებთ ანგარიშს... 📋",
  "თითქმის მზადაა! ✨"
];

// 🧪 მეცნიერული კალორიების წვის კალკულატორი (MET 8.0)
const calculateBurnTime = (calories: number, weight: number) => {
  if (!calories) return 0;
  const userW = weight > 0 ? weight : 70;
  const kcalPerMin = (8.0 * userW * 3.5) / 200;
  return Math.round(calories / kcalPerMin);
};

export default function ScannerScreen() {
  const { themeId } = useThemeStore();
  const DS = React.useMemo(() => getColors(themeId), [themeId]);
  const styles = React.useMemo(() => getStyles(DS), [DS]);
  const pw = React.useMemo(() => getPwStyles(DS), [DS]);

  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [flash, setFlash] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [added, setAdded] = useState(false);

  const [userWeight, setUserWeight] = useState<number>(70);

  // 🚀 FREEMIUM STATES 🚀
  const { addMeal, isPremium: isPro } = useDiaryStore();
  const [scansUsed, setScansUsed] = useState(0);
  const [proScansMonth, setProScansMonth] = useState(0); // Monthly limit for PRO
  const [daysUsed, setDaysUsed] = useState(0); // 0, 1 = allowed. 2+ = blocked
  const [brandAlert, setBrandAlert] = useState<BAlertState>({ visible: false, title: '', message: '', type: 'error' });
  const [showWeightInfo, setShowWeightInfo] = useState(false);

  const laserAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const laserOpacity = useRef(new Animated.Value(1)).current;
  const resultSheetAnim = useRef(new Animated.Value(H)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;

  const isCancelledRef = useRef(false);
  const dataLoaded = useRef(false);

  // 🚀 REANIMATED VIEWFINDER GLOW 🚀
  const frameGlow = useSharedValue(0.5);
  useEffect(() => {
    frameGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.5, { duration: 1200 })
      ),
      -1,
      true
    );
  }, []);

  const animatedFrameStyle = useAnimatedStyle(() => ({
    opacity: frameGlow.value,
    transform: [{ scale: 0.98 + (frameGlow.value * 0.04) }],
  }));

  const livePulse = useSharedValue(0.5);
  useEffect(() => {
    livePulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1000 }), withTiming(0.4, { duration: 1000 })),
      -1,
      true
    );
  }, []);

  const liveDotStyle = useAnimatedStyle(() => ({
    opacity: livePulse.value,
    transform: [{ scale: livePulse.value }],
  }));

  const viewfinderY = Math.max(125, (H - FRAME_SIZE) / 4.5);

  useEffect(() => {
    startLaser();
    startPulse();
  }, []);

  useFocusEffect(useCallback(() => {
    if (!dataLoaded.current) {
      loadUserDataAndLimits();
      dataLoaded.current = true;
    }
  }, []));

  useEffect(() => {
    let interval: any;
    if (isScanning) {
      interval = setInterval(() => setLoadingMsgIdx(p => (p + 1) % LOADING_MESSAGES.length), 1500);
    } else setLoadingMsgIdx(0);
    return () => clearInterval(interval);
  }, [isScanning]);

  const loadUserDataAndLimits = async () => {
    try {
      const profileStr = await AsyncStorage.getItem('userProfile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        if (profile.weight) setUserWeight(parseFloat(profile.weight));
      }

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const lastScanDate = await AsyncStorage.getItem('balansi_last_scan_date');

      // Load scans used today
      if (lastScanDate !== todayStr) {
        setScansUsed(0);
        await AsyncStorage.setItem('balansi_last_scan_date', todayStr);
        await AsyncStorage.setItem('balansi_scans_used', '0');
      } else {
        const used = await AsyncStorage.getItem('balansi_scans_used');
        setScansUsed(used ? parseInt(used) : 0);
      }

      // Track Trial Days
      const firstDateStr = await AsyncStorage.getItem('balansi_first_use_date');
      if (firstDateStr) {
        const firstDate = new Date(firstDateStr);
        const d1 = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate());
        const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        setDaysUsed(diffDays);
      }

      // 🤫 PRO Silent Monthly Limit Logic
      const currentMonth = today.getMonth() + 1; // 1-12
      const lastProMonth = await AsyncStorage.getItem('balansi_pro_month');
      if (lastProMonth !== currentMonth.toString()) {
        await AsyncStorage.setItem('balansi_pro_month', currentMonth.toString());
        await AsyncStorage.setItem('balansi_pro_scans', '0');
        setProScansMonth(0);
      } else {
        const proUsed = await AsyncStorage.getItem('balansi_pro_scans');
        setProScansMonth(proUsed ? parseInt(proUsed) : 0);
      }
    } catch (e) {
      console.log("Error loading limits", e);
    }
  };

  const incrementScanCount = async () => {
    if (isPro) {
      const newProCount = proScansMonth + 1;
      setProScansMonth(newProCount);
      await AsyncStorage.setItem('balansi_pro_scans', newProCount.toString());
      return;
    }

    // Set first use date if not exists
    const firstDateStr = await AsyncStorage.getItem('balansi_first_use_date');
    if (!firstDateStr) {
      const todayStr = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem('balansi_first_use_date', todayStr);
      setDaysUsed(0);
    }

    const newCount = scansUsed + 1;
    setScansUsed(newCount);
    await AsyncStorage.setItem('balansi_scans_used', newCount.toString());
  };

  const startLaser = () => {
    Animated.loop(Animated.sequence([
      Animated.timing(laserAnim, { toValue: FRAME_SIZE - 4, duration: 2000, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(laserAnim, { toValue: 0, duration: 2000, useNativeDriver: Platform.OS !== 'web' }),
    ])).start();
  };

  const startPulse = () => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: Platform.OS !== 'web' }),
    ])).start();
  };

  // 📸 კამერის ღილაკზე დაჭერა (The Gatekeeper)
  const handleCapture = async () => {
    if (!cameraRef.current || isScanning) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // 🛑 Gatekeeper: Free Limit (2 per day / 3 days trial)
    if (!isPro) {
      if (daysUsed >= 3 || scansUsed >= 2) {
        setBrandAlert({
          visible: true,
          type: 'warning',
          title: 'ლიმიტი ამოიწურა 🛑',
          message: 'უფასო სკანირების ლიმიტი დღეისთვის ამოწურულია. გადადი PRO-ზე ულიმიტო ანალიზისთვის.',
          actions: [
            { label: 'მოგვიანებით', onPress: () => {} },
            { label: 'გააქტიურება 🚀', primary: true, onPress: () => router.push('/paywall') }
          ]
        });
        return;
      }
    } else {
      // 🤫 Silent PRO limit (200 scans per month)
      if (proScansMonth >= 200) {
        setBrandAlert({
          visible: true,
          type: 'info',
          title: 'ტექნიკური პაუზა 🛠️',
          message: 'AI სერვერების მაღალი დატვირთვის გამო, სკანირება დროებით შეზღუდულია. გთხოვთ სცადოთ ხვალ.',
          actions: [{ label: 'გასაგებია', onPress: () => {} }]
        });
        return;
      }
    }

    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 50, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: Platform.OS !== 'web' })
    ]).start();
    Animated.timing(laserOpacity, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start();

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.3, skipProcessing: true });
      if (photo?.uri) processImage(photo.uri);
    } catch (error) {
      setBrandAlert({
        visible: true,
        type: 'error',
        title: 'შეცდომა',
        message: 'ფოტოს გადაღება ვერ მოხერხდა.',
      });
      Animated.timing(laserOpacity, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== 'web' }).start();
    }
  };

  const pickImage = async () => {
    Haptics.selectionAsync();

    // 🛑 დაცვა გალერეიდან არჩევაზეც!
    if (!isPro) {
      if (daysUsed >= 3 || scansUsed >= 3) {
        setBrandAlert({
          visible: true,
          type: 'warning',
          title: 'ლიმიტი ამოიწურა 🛑',
          message: 'უფასო სკანირების ლიმიტი დღეისთვის ამოწურულია. გადადი PRO-ზე ულიმიტო ანალიზისთვის.',
          actions: [
            { label: 'მოგვიანებით', onPress: () => {} },
            { label: 'გააქტიურება 🚀', primary: true, onPress: () => router.push('/paywall') }
          ]
        });
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5,
    });
    if (!result.canceled && result.assets[0].uri) {
      Animated.timing(laserOpacity, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start();
      processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri: string) => {
    isCancelledRef.current = false;
    setIsScanning(true);
    setCapturedPhoto(uri);
    setAdded(false);
    contentFadeAnim.setValue(0);

    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri, [{ resize: { width: 800 } }], { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );

      const formData = new FormData();
      formData.append('file', { uri: manipResult.uri, name: 'scan.jpg', type: 'image/jpeg' } as any);

      // Final check before network call
      if (!isPro && scansUsed >= 2) return;
      if (isPro && proScansMonth >= 200) return;

      const response = await fetch(`${SERVER_URL}/api/scan-food`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
      });

      const data = await response.json();

      if (isCancelledRef.current) return;

      if (response.ok && data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Normalize data: ensure per_100g and estimated_weight always exist
        const raw = data.data;
        const weight = raw.estimated_weight && raw.estimated_weight > 0 ? raw.estimated_weight : 350;
        const cal = raw.calories || 0;
        const prot = raw.protein || 0;
        const carb = raw.carbs || 0;
        const fat = raw.fat || 0;
        
        if (!raw.estimated_weight || raw.estimated_weight <= 0) {
          raw.estimated_weight = weight;
        }
        
        // If per_100g is missing or empty, compute from totals
        if (!raw.per_100g || !raw.per_100g.calories) {
          raw.per_100g = {
            calories: weight > 0 ? Math.round((cal / weight) * 100) : 0,
            protein: weight > 0 ? Math.round((prot / weight) * 100) : 0,
            carbs: weight > 0 ? Math.round((carb / weight) * 100) : 0,
            fat: weight > 0 ? Math.round((fat / weight) * 100) : 0,
          };
        }
        
        setResultData(raw);

        await incrementScanCount();

        Animated.sequence([
          Animated.spring(resultSheetAnim, { toValue: 0, useNativeDriver: Platform.OS !== 'web', tension: 40, friction: 8 }),
          Animated.timing(contentFadeAnim, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== 'web' })
        ]).start();

      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setBrandAlert({
          visible: true,
          type: 'error',
          title: 'ვერ ვიცანი 🧐',
          message: data.message || 'საჭმელი ვერ ამოვიცანით.',
          actions: [{ label: 'თავიდან ცდა', onPress: retakePhoto }]
        });
      }
    } catch (error) {
      if (isCancelledRef.current) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setBrandAlert({
        visible: true,
        type: 'info',
        title: 'საჭიროა ინტერნეტი 📡',
        message: 'სამწუხაროდ, AI სკანერი ინტერნეტის გარეშე ვერ მუშაობს. გთხოვთ, შეამოწმოთ კავშირი.',
        actions: [{ label: 'კარგი', onPress: retakePhoto }]
      });
    } finally {
      if (!isCancelledRef.current) setIsScanning(false);
    }
  };

  const retakePhoto = () => {
    Haptics.selectionAsync();
    isCancelledRef.current = true;
    setIsScanning(false);
    
    // Clear state immediately to ensure it works even if animation doesn't trigger
    if (!resultData) {
      setCapturedPhoto(null);
      Animated.timing(laserOpacity, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== 'web' }).start();
      return;
    }

    Animated.timing(resultSheetAnim, { toValue: H, duration: 300, useNativeDriver: Platform.OS !== 'web' }).start(() => {
      setResultData(null);
      setCapturedPhoto(null);
      Animated.timing(laserOpacity, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== 'web' }).start();
    });
  };

  const WeightTrustModal = () => {
    if (!resultData) return null;
    return (
      <Modal visible={showWeightInfo} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowWeightInfo(false)}
        >
          <BlurView intensity={80} tint="dark" style={styles.modalBlur}>
            <View style={styles.trustCard}>
              <View style={styles.trustHeader}>
                <Scale size={24} color={DS.emerald} />
                <Text style={styles.trustTitle}>როგორ ვითვლით წონას?</Text>
                <TouchableOpacity onPress={() => setShowWeightInfo(false)}>
                  <X size={20} color={DS.inkLight} />
                </TouchableOpacity>
              </View>

              <Text style={styles.trustDesc}>
                Balansi AI აანალიზებს კერძის მოცულობას და ადარებს მას სტანდარტულ საგნებს (მაგ: თეფშის ზომა ~26სმ, ჩანგალი, ხელის მტევანი).
              </Text>

              <View style={styles.formulaBox}>
                <View style={styles.formulaItem}>
                  <View style={styles.formulaIcon}><Search size={18} color={DS.emerald}/></View>
                  <Text style={styles.formulaLabel}>მოცულობა</Text>
                  <Text style={styles.formulaSub}>ვიზუალური ანალიზი</Text>
                </View>
                <Text style={styles.formulaOp}>×</Text>
                <View style={styles.formulaItem}>
                  <View style={styles.formulaIcon}><Activity size={18} color={DS.warning}/></View>
                  <Text style={styles.formulaLabel}>სიმკვრივე</Text>
                  <Text style={styles.formulaSub}>პროდუქტის ტიპი</Text>
                </View>
                <Text style={styles.formulaOp}>=</Text>
                <View style={styles.formulaItem}>
                  <View style={styles.formulaIcon}><Scale size={18} color={DS.danger}/></View>
                  <Text style={styles.formulaLabel}>წონა</Text>
                  <Text style={styles.formulaSub}>~{resultData.estimated_weight}გ</Text>
                </View>
              </View>

              {resultData.weight_reasoning && (
                <View style={styles.reasoningBox}>
                  <Lightbulb size={16} color={DS.warning} style={{ marginRight: 8 }} />
                  <Text style={styles.reasoningText}>
                    <Text style={{ fontWeight: 'bold' }}>AI-ს ლოგიკა: </Text>
                    {resultData.weight_reasoning}
                  </Text>
                </View>
              )}

              <Text style={styles.trustFooter}>
                * ეს არის სავარაუდო წონა. მაქსიმალური სიზუსტისთვის გამოიყენეთ სამზარეულოს სასწორი.
              </Text>

              <TouchableOpacity 
                style={styles.trustCloseBtn} 
                onPress={() => setShowWeightInfo(false)}
              >
                <Text style={styles.trustCloseBtnText}>გავიგე</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </TouchableOpacity>
      </Modal>
    );
  };

  const MacroChart = ({ protein, carbs, fat, calories }: any) => {
    const total = (protein || 0) + (carbs || 0) + (fat || 0) || 1;
    const pPct = (protein || 0) / total;
    const cPct = (carbs || 0) / total;
    const fPct = (fat || 0) / total;

    const size = 110;
    const strokeWidth = 10;
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const pOffset = 0;
    const cOffset = circumference * pPct;
    const fOffset = circumference * (pPct + cPct);

    return (
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            <Circle cx={center} cy={center} r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="transparent" />
            <Circle cx={center} cy={center} r={radius} stroke={DS.emerald} strokeWidth={strokeWidth} strokeDasharray={`${circumference * pPct} ${circumference}`} strokeDashoffset={0} fill="transparent" />
            <Circle cx={center} cy={center} r={radius} stroke={DS.warning} strokeWidth={strokeWidth} strokeDasharray={`${circumference * cPct} ${circumference}`} strokeDashoffset={-cOffset} fill="transparent" />
            <Circle cx={center} cy={center} r={radius} stroke={DS.danger} strokeWidth={strokeWidth} strokeDasharray={`${circumference * fPct} ${circumference}`} strokeDashoffset={-fOffset} fill="transparent" />
          </G>
        </Svg>
        <View style={styles.chartInner}>
          <Text style={styles.chartCalNum}>{calories}</Text>
          <Text style={styles.chartCalUnit}>კკალ</Text>
        </View>
      </View>
    );
  };

  const MacroRow = ({ label, val100, valTotal, unit, color, estimatedWeight }: any) => {
    // Use server-provided per_100g (always populated), fallback to frontend calc
    const total = valTotal || 0;
    const weight = estimatedWeight || 0;
    let per100 = val100;
    if (per100 == null || per100 === undefined) {
      per100 = weight > 0 ? Math.round((total / weight) * 100) : 0;
    }
    return (
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { flex: 2, color: DS.inkMid, textAlign: 'left' }]}>{label}</Text>
        <Text style={[styles.tableCell, { color: DS.inkLight }]}>{per100}{unit}</Text>
        <Text style={[styles.tableCell, styles.cellBold, { color }]}>{total}{unit}</Text>
      </View>
    );
  };

  const handleAddToDiary = async () => {
    if (added) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAdded(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // ✅ Use global store instead of manual AsyncStorage
      addMeal(today, {
        id: Date.now().toString(),
        name: resultData.name,
        calories: resultData.calories,
        time: new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }),
        source: 'AI Scanner',
        image_url: capturedPhoto // 🚀 Store image URI!
      }, {
        protein: resultData.protein,
        carbs: resultData.carbs,
        fats: resultData.fat
      });

      setTimeout(() => {
        setBrandAlert({
          visible: true,
          type: 'success',
          title: '✅ დამატებულია!',
          message: `${resultData.calories} კკალ შევიდა დღიურში.`,
          actions: [
            { label: 'კამერა', onPress: retakePhoto },
            { label: 'დღიური', primary: true, onPress: () => { retakePhoto(); router.push('/diary'); } }
          ]
        });
      }, 300);
    } catch (error) {
      setAdded(false);
      setBrandAlert({
        visible: true,
        type: 'error',
        title: 'შეცდომა',
        message: 'მონაცემების შენახვა ვერ მოხერხდა.',
      });
    }
  };

  const macroWidths = () => {
    if (!resultData) return { p: '0%', c: '0%', f: '0%' };
    const total = (resultData.protein || 0) + (resultData.carbs || 0) + (resultData.fat || 0);
    if (total === 0) return { p: '0%', c: '0%', f: '0%' };
    return {
      p: `${Math.round((resultData.protein / total) * 100)}%`,
      c: `${Math.round((resultData.carbs / total) * 100)}%`,
      f: `${Math.round((resultData.fat / total) * 100)}%`,
    };
  };
  const mw = macroWidths();

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Camera size={60} color={DS.emerald} style={{ marginBottom: 20 }} />
        <Text style={styles.permissionTitle}>კამერაზე წვდომა</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>ნებართვის მიცემა</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" enableTorch={flash} />

      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FFF', opacity: flashAnim, zIndex: 100 }]} pointerEvents="none" />

      {/* ── 🎭 PREMIUM CAMERA SVG MASK ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg height={H} width={W}>
          <Defs>
            <SvgMask id="mask" x="0" y="0" height={H} width={W}>
              <Rect height={H} width={W} fill="#fff" />
              <Rect
                x={(W - FRAME_SIZE) / 2}
                y={viewfinderY}
                width={FRAME_SIZE}
                height={FRAME_SIZE}
                rx="80"
                fill="#000"
              />
            </SvgMask>
          </Defs>
          <Rect height={H} width={W} fill={OVERLAY_COLOR} mask="url(#mask)" />
        </Svg>
      </View>

      <SafeAreaView style={styles.headerSafe} pointerEvents="box-none">
        <View style={styles.headerPill}>
          <Leaf size={16} color={DS.emerald} />
          <Text style={styles.headerPillText}>Balansi AI</Text>
        </View>
      </SafeAreaView>

      {(capturedPhoto || isScanning || resultData) && (
        <SafeAreaView style={styles.cancelBtnSafe}>
          <TouchableOpacity style={styles.cancelBtn} onPress={retakePhoto} activeOpacity={0.7}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* ── 🚀 VIEWPORT UI (CORNERS & DOT) ── */}
      {!resultData && (
        <View style={[styles.viewportUi, { top: viewfinderY, height: FRAME_SIZE }]} pointerEvents="none">
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {capturedPhoto && (
            <View style={StyleSheet.absoluteFill}>
              <Image source={{ uri: capturedPhoto }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
              {isScanning && (
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              )}
            </View>
          )}

          {!capturedPhoto && (
            <AnimatedReanimated.View style={[styles.liveIndicator, liveDotStyle]} />
          )}

          <Animated.View style={[styles.laser, { transform: [{ translateY: laserAnim }], opacity: (isScanning || !capturedPhoto) ? 1 : 0 }]} />

          {isScanning && (
            <View style={styles.scanningGlassOverlay}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center' }}>
                <View style={styles.scanningIconWrap}>
                  <Zap size={32} color="#FFF" />
                </View>
                <Text style={styles.scanningText}>{LOADING_MESSAGES[loadingMsgIdx]}</Text>
              </Animated.View>
            </View>
          )}
        </View>
      )}

      {/* ── 🔘 BOTTOM ACTION AREA (TEXT & CONTROLS) ── */}
      {!resultData && !isScanning && (
        <SafeAreaView style={styles.controlsBottomArea}>
          {!capturedPhoto && (
            <Animated.View style={{ opacity: laserOpacity, alignItems: 'center', paddingHorizontal: 35, marginBottom: 35 }}>
              <Text style={styles.instructionTitle}>დროა ვისადილოთ! 🍽️</Text>
              <Text style={styles.instructionSub}>დაიჭირე კამერა თეფშის გასწვრივ. მე შევაფასებ ულუფას და დაგითვლი მაკროებს.</Text>
            </Animated.View>
          )}

          {!isPro && (
            <View style={{ marginBottom: 25, alignSelf: 'center' }}>
              <BlurView intensity={80} tint="dark" style={styles.limitPill}>
                <Zap size={14} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 6 }} />
                <Text style={styles.limitPillTxt}>დარჩა {Math.max(0, 2 - scansUsed)} უფასო სკანირება</Text>
              </BlurView>
            </View>
          )}

          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.sideBtn} onPress={() => { Haptics.selectionAsync(); setFlash(!flash); }}>
              <Zap size={22} color="#FFF" fill={flash ? "#FFF" : "transparent"} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureBtnOuter} onPress={handleCapture} activeOpacity={0.8}>
              <View style={styles.captureBtnInner}>
                <Scan size={36} color="#FFF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sideBtn} onPress={pickImage}>
              <ImageIcon size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* ── 🚀 პრემიუმ შედეგების ბარათი ── */}
      <Animated.View style={[styles.resultSheet, { transform: [{ translateY: resultSheetAnim }] }]}>
        {resultData && capturedPhoto && (
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.sheetHandle} />
            <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }} style={{ flex: 1, opacity: contentFadeAnim }}>
              <View style={styles.resultImageWrap}>
                <Image source={{ uri: capturedPhoto }} style={styles.resultImage} contentFit="cover" transition={300} />
              </View>

              <View style={styles.headerRowWrap}>
                <Text style={styles.wowText}>{resultData.wow_msg || "კლინიკური ანალიზი"}</Text>
                <Text style={styles.foodName}>{resultData.name}</Text>
              </View>

              <View style={styles.summarySection}>
                <View style={styles.chartWrapper}>
                  <MacroChart protein={resultData.protein} carbs={resultData.carbs} fat={resultData.fat} calories={resultData.calories} />
                  <View style={styles.chartLegend}>
                    <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: DS.emerald }]} /><Text style={styles.legendText}>ცილა</Text></View>
                    <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: DS.warning }]} /><Text style={styles.legendText}>ნახშ.</Text></View>
                    <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: DS.danger }]} /><Text style={styles.legendText}>ცხიმი</Text></View>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.portionCard} 
                  activeOpacity={0.7}
                  onPress={() => setShowWeightInfo(true)}
                >
                  <View style={styles.portionIconWrap}>
                    <Scale size={20} color={DS.emerald} />
                  </View>
                  <View style={styles.portionInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.portionLabel}>სავარაუდო წონა</Text>
                      <Info size={12} color={DS.inkLight} style={{ marginLeft: 4 }} />
                    </View>
                    <Text style={styles.portionValue}>~{resultData.estimated_weight || 0} გრამი</Text>
                  </View>
                  <ChevronRight size={18} color={DS.inkLight} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                </TouchableOpacity>
              </View>

              {/* 🚀 დეტალური მაკროების ბარათი */}
              <View style={styles.detailedMacroCard}>
                <View style={styles.macroHeaderRow}>
                  <Text style={styles.macroCardTitle}>კვებითი ღირებულება</Text>
                </View>

                <View style={styles.macroTable}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableCell, { flex: 2, textAlign: 'left' }]}>ელემენტი</Text>
                    <Text style={styles.tableCell}>100გ-ში</Text>
                    <Text style={[styles.tableCell, styles.cellBold]}>პორციაში</Text>
                  </View>

                  <MacroRow label="კალორია" val100={resultData.per_100g?.calories} valTotal={resultData.calories} unit="კკალ" color={DS.onyx} estimatedWeight={resultData.estimated_weight} />
                  <MacroRow label="ცილა" val100={resultData.per_100g?.protein} valTotal={resultData.protein} unit="გ" color={DS.emerald} estimatedWeight={resultData.estimated_weight} />
                  <MacroRow label="ნახშირწყალი" val100={resultData.per_100g?.carbs} valTotal={resultData.carbs} unit="გ" color={DS.warning} estimatedWeight={resultData.estimated_weight} />
                  <MacroRow label="ცხიმი" val100={resultData.per_100g?.fat} valTotal={resultData.fat} unit="გ" color={DS.danger} estimatedWeight={resultData.estimated_weight} />
                </View>
              </View>


              <View style={styles.analysisBox}>
                <Text style={styles.analysisTitle}>ნუტრიციოლოგიური შეფასება</Text>
                <Text style={styles.analysisText}>{resultData.description}</Text>
              </View>

              {resultData.fun_fact && (
                <View style={styles.funFactBox}>
                  <Text style={[styles.analysisTitle, { color: DS.warning }]}>საინტერესო ფაქტი</Text>
                  <Text style={styles.funFactText}>{resultData.fun_fact}</Text>
                </View>
              )}

            </Animated.ScrollView>

            <Animated.View style={[styles.footerWrap, { opacity: contentFadeAnim }]}>
              <View style={styles.footerRow}>
                <TouchableOpacity style={styles.backBtn} onPress={retakePhoto}>
                  <RotateCcw size={22} color={DS.inkMid} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.logBtn, added && { backgroundColor: DS.emerald }]} onPress={handleAddToDiary} activeOpacity={0.85}>
                  {added ? (
                    <><CheckCircle size={22} color="#FFF" style={{ marginRight: 8 }} /><Text style={styles.logBtnText}>დამატებულია</Text></>
                  ) : (
                    <Text style={styles.logBtnText}>დღიურში დამატება</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </SafeAreaView>
        )}
      </Animated.View>

      <WeightTrustModal />

      <BrandAlert 
        state={brandAlert} 
        onClose={() => setBrandAlert({ ...brandAlert, visible: false })} 
      />
    </View>
  );
}

// ─── The Master Paywall Styles ───
const getPwStyles = (DS: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end'
  },
  sheet: {
    backgroundColor: DS.proBg,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 50 : 40, // Buffer for safe area
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    alignItems: 'center'
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: DS.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)'
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 30
  },
  mainText: {
    color: '#D1FAE5',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 5,
    marginBottom: 24
  },
  ecosystemBox: {
    width: '100%',
    backgroundColor: DS.proBox, // მუქი ჩაშენებული ყუთი 
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 30
  },
  ecosystemTitle: {
    color: DS.emerald,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  ecosystemText: {
    color: '#A7F3D0',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.gold,
    width: '100%',
    paddingVertical: 18,
    borderRadius: 100,
    marginBottom: 10
  },
  buyBtnTxt: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    marginRight: 4
  },
  cancelWrapper: {
    minHeight: 50, // 🚀 Prevents clipping on bottom
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelTxt: {
    color: '#A7F3D0',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false // 🚀 Android Text Fix 🚀
  }
});

// ─── Camera Styles (ვერტიკალური, მაცივრისთვის) ───
const getStyles = (DS: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', marginBottom: 10 },
  permissionBtn: { backgroundColor: DS.emerald, paddingHorizontal: 30, paddingVertical: 16, borderRadius: 20 },
  permissionBtnText: { color: '#FFF', fontWeight: '900', fontSize: 16 },

  headerSafe: { position: 'absolute', top: 0, width: '100%', zIndex: 10, alignItems: 'center', paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : 20 },
  headerPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', gap: 6 },
  headerPillText: { color: '#FFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' },

  instructionTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 15, marginBottom: 8, letterSpacing: -0.5 },
  instructionSub: { color: '#D1D5DB', fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 10 },

  limitBadge: { marginTop: 15, backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: DS.warning },
  limitText: { color: DS.warning, fontSize: 12, fontWeight: '800' },

  cancelBtnSafe: { position: 'absolute', top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 15 : 20, left: 20, zIndex: 20 },
  cancelBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },

  viewportUi: { position: 'absolute', width: FRAME_SIZE, alignSelf: 'center', zIndex: 10, overflow: 'hidden', borderRadius: 80 },
  liveIndicator: { position: 'absolute', top: 30, left: 30, width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', shadowColor: '#10B981', shadowOpacity: 1, shadowRadius: 10, elevation: 12 },
  instructionContainer: { position: 'absolute', width: '100%', alignItems: 'center', zIndex: 10 },

  overlayWrapper: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayMiddleRow: { flexDirection: 'row', height: FRAME_SIZE },
  overlaySide: { flex: 1, backgroundColor: OVERLAY_COLOR },
  overlayBottom: { flex: 1.2, backgroundColor: OVERLAY_COLOR, justifyContent: 'center' },

  scanFrame: { width: FRAME_SIZE, height: FRAME_SIZE, borderRadius: 80, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'transparent', overflow: 'hidden' },
  corner: { position: 'absolute', width: 45, height: 45, borderColor: '#FFF', shadowColor: '#FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10 },
  topLeft: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 30 },
  topRight: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 30 },
  bottomLeft: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 30 },
  bottomRight: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 30 },

  laser: { position: 'absolute', width: '100%', height: 4, backgroundColor: DS.emerald, shadowColor: DS.emerald, shadowOpacity: 1, shadowRadius: 20, elevation: 15 },
  scanningGlassOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,15,13,0.4)', justifyContent: 'center', alignItems: 'center' },
  scanningIconWrap: { backgroundColor: DS.emerald, padding: 18, borderRadius: 35, marginBottom: 15, shadowColor: DS.emerald, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  scanningText: { color: '#FFF', fontWeight: '800', fontSize: 16, textAlign: 'center', paddingHorizontal: 20, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 10 },

  controlsBottomArea: { position: 'absolute', bottom: 0, width: '100%', paddingBottom: Platform.OS === 'ios' ? 60 : 40, zIndex: 20 },
  limitPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)' },
  limitPillTxt: { color: '#FCD34D', fontSize: 13, fontWeight: '800' },

  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', width: '100%', paddingHorizontal: 30 },
  sideBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  captureBtnOuter: { width: 92, height: 92, borderRadius: 46, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  captureBtnInner: { width: 76, height: 76, borderRadius: 38, backgroundColor: DS.emerald, justifyContent: 'center', alignItems: 'center', shadowColor: DS.emerald, shadowOpacity: 0.6, shadowRadius: 20, elevation: 12 },

  resultSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.82, backgroundColor: DS.snow, borderTopLeftRadius: 40, borderTopRightRadius: 40, zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 25 },
  sheetHandle: { width: 44, height: 6, backgroundColor: '#D1D5DB', borderRadius: 6, alignSelf: 'center', marginBottom: 25, marginTop: 15 },
  resultImageWrap: { alignSelf: 'center', marginBottom: 25, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, elevation: 12, backgroundColor: '#FFF', padding: 6, borderRadius: 44 },
  resultImage: { width: 160, height: 160, borderRadius: 38, backgroundColor: '#E5E7EB' },
  headerRowWrap: { alignItems: 'center', marginBottom: 20 },
  wowText: { fontFamily: DS.fontFamily, color: DS.emerald, fontSize: 12, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center' },
  foodName: { fontFamily: DS.fontFamily, color: DS.onyx, fontSize: 24, fontWeight: '900', textAlign: 'center', lineHeight: 30, letterSpacing: -0.5 },

  summarySection: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 25 },
  chartWrapper: { alignItems: 'center', gap: 10 },
  chartContainer: { width: 110, height: 110, justifyContent: 'center', alignItems: 'center' },
  chartInner: { position: 'absolute', alignItems: 'center' },
  chartCalNum: { fontFamily: DS.fontFamily, color: DS.onyx, fontSize: 24, fontWeight: '900' },
  chartCalUnit: { fontFamily: DS.fontFamily, color: DS.mist, fontSize: 10, fontWeight: '700' },
  chartLegend: { flexDirection: 'row', gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 9, fontWeight: '700', color: DS.mist },

  portionCard: { flex: 1, backgroundColor: '#FFF', padding: 18, borderRadius: 24, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  portionIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: DS.emeraldGlow, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  portionInfo: { alignItems: 'center' },
  portionLabel: { fontFamily: DS.fontFamily, color: DS.mist, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
  portionValue: { fontFamily: DS.fontFamily, color: DS.onyx, fontSize: 17, fontWeight: '900' },

  detailedMacroCard: { backgroundColor: '#FFF', borderRadius: 32, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6' },
  macroHeaderRow: { marginBottom: 20 },
  macroCardTitle: { fontFamily: DS.fontFamily, color: DS.onyx, fontSize: 16, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  macroTable: { width: '100%' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 10, marginBottom: 15 },
  tableRow: { flexDirection: 'row', paddingVertical: 10 },
  tableCell: { flex: 1, fontFamily: DS.fontFamily, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  cellBold: { fontWeight: '900' },

  analysisBox: { backgroundColor: DS.primaryLight, padding: 24, borderRadius: 32, marginBottom: 15, alignItems: 'center' },
  analysisTitle: { fontFamily: DS.fontFamily, color: DS.primaryDark, fontSize: 15, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  analysisText: { fontFamily: DS.fontFamily, color: DS.inkMid, fontSize: 15, lineHeight: 24, fontWeight: '600', textAlign: 'center' },

  funFactBox: { backgroundColor: DS.warningGlow, padding: 24, borderRadius: 32, marginBottom: 15, borderWidth: 1, borderColor: DS.warning + '20', alignItems: 'center' },
  funFactText: { fontFamily: DS.fontFamily, color: DS.inkMid, fontSize: 15, lineHeight: 24, fontWeight: '600', textAlign: 'center' },

  footerWrap: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 24, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', backgroundColor: '#FFF' },
  footerRow: { flexDirection: 'row', gap: 12 },
  logBtn: { flex: 1, flexDirection: 'row', backgroundColor: DS.emerald, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: DS.emerald, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  backBtn: { width: 60, height: 60, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  logBtnText: { fontFamily: DS.fontFamily, color: '#FFF', fontSize: 18, fontWeight: '800' },

  // Trust Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBlur: { borderRadius: 32, overflow: 'hidden', width: '100%' },
  trustCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 32 },
  trustHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  trustTitle: { fontFamily: DS.fontFamily, color: DS.onyx, fontSize: 18, fontWeight: '900', flex: 1 },
  trustDesc: { fontFamily: DS.fontFamily, color: DS.inkMid, fontSize: 14, lineHeight: 20, marginBottom: 25 },
  formulaBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 24, marginBottom: 25 },
  formulaItem: { alignItems: 'center', gap: 4 },
  formulaIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  formulaLabel: { fontFamily: DS.fontFamily, fontSize: 11, fontWeight: '800', color: DS.onyx },
  formulaSub: { fontFamily: DS.fontFamily, fontSize: 9, fontWeight: '600', color: DS.mist },
  formulaOp: { fontSize: 18, fontWeight: '900', color: DS.mist },
  reasoningBox: { flexDirection: 'row', backgroundColor: DS.warningGlow, padding: 16, borderRadius: 16, marginBottom: 20 },
  reasoningText: { fontFamily: DS.fontFamily, color: DS.inkMid, fontSize: 13, lineHeight: 18, flex: 1 },
  trustFooter: { fontFamily: DS.fontFamily, color: DS.mist, fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginBottom: 25 },
  trustCloseBtn: { backgroundColor: DS.emerald, paddingVertical: 16, borderRadius: 18, alignItems: 'center' },
  trustCloseBtnText: { fontFamily: DS.fontFamily, color: '#FFF', fontSize: 16, fontWeight: '800' },
});

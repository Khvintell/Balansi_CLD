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
import { Svg, Defs, Rect, Mask as SvgMask } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { 
  Scan, Zap, Leaf, Image as ImageIcon, Activity, X, Sparkles, 
  Camera, CheckCircle2, Crown, Lock, ChevronRight, Scale
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useThemeStore } from '../../store/useThemeStore';
import { getColors } from '../../config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../../config/api';

const { width: W, height: H } = Dimensions.get('window');
const FRAME_SIZE = W * 0.85; 
const OVERLAY_COLOR = 'rgba(10, 15, 13, 0.85)'; 

// ─── Balansi Design System ─────────────────────────────


const LOADING_MESSAGES = [
  "ვაღვიძებთ AI შეფ-მზარეულს... 👨‍🍳",
  "ვსწავლობთ ინგრედიენტებს... 🔍",
  "ვითვლით მაკროებს... 🧮",
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
  const [isPro, setIsPro] = useState(false);
  const [scansUsed, setScansUsed] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  
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
    } else {
      // ამოწმებს PRO სტატუსს, თუ პროფილში შეიცვალა
      checkProStatus();
    }
  }, []));

  useEffect(() => {
    let interval: any;
    if (isScanning) {
      interval = setInterval(() => setLoadingMsgIdx(p => (p + 1) % LOADING_MESSAGES.length), 2000);
    } else setLoadingMsgIdx(0);
    return () => clearInterval(interval);
  }, [isScanning]);

  const checkProStatus = async () => {
    try {
      const profileStr = await AsyncStorage.getItem('userProfile');
      if (profileStr) setIsPro(JSON.parse(profileStr).isPro || false);
    } catch {}
  };

  const loadUserDataAndLimits = async () => {
    try {
      const profileStr = await AsyncStorage.getItem('userProfile');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        if (profile.weight) setUserWeight(parseFloat(profile.weight));
        setIsPro(profile.isPro || false);
      }

      const today = new Date().toISOString().split('T')[0];
      const lastScanDate = await AsyncStorage.getItem('balansi_last_scan_date');
      
      if (lastScanDate !== today) {
        setScansUsed(0);
        await AsyncStorage.setItem('balansi_last_scan_date', today);
        await AsyncStorage.setItem('balansi_scans_used', '0');
      } else {
        const used = await AsyncStorage.getItem('balansi_scans_used');
        setScansUsed(used ? parseInt(used) : 0);
      }
    } catch (e) {
      console.log("Error loading limits", e);
    }
  };

  const incrementScanCount = async () => {
    if (isPro) return; 
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
    
    // 🛑 დაცვა: თუ არ არის PRO და უკვე 2-ჯერ დაასკანერა -> PAYWALL!
    if (!isPro && scansUsed >= 2) {
      router.push('/paywall');
      return;
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
      Alert.alert('შეცდომა', 'ფოტოს გადაღება ვერ მოხერხდა.');
      Animated.timing(laserOpacity, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== 'web' }).start();
    }
  };

  const pickImage = async () => {
    Haptics.selectionAsync();
    
    // 🛑 დაცვა გალერეიდან არჩევაზეც!
    if (!isPro && scansUsed >= 2) {
      router.push('/paywall');
      return;
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

      const response = await fetch(`${SERVER_URL}/api/scan-food`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
      });

      const data = await response.json();

      if (isCancelledRef.current) return;

      if (response.ok && data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setResultData(data.data);
        
        await incrementScanCount();

        Animated.sequence([
          Animated.spring(resultSheetAnim, { toValue: 0, useNativeDriver: Platform.OS !== 'web', tension: 40, friction: 8 }),
          Animated.timing(contentFadeAnim, { toValue: 1, duration: 400, useNativeDriver: Platform.OS !== 'web' })
        ]).start();

      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('შეცდომა', data.message || 'საჭმელი ვერ ამოვიცანით.', [{ text: 'თავიდან ცდა', onPress: retakePhoto }]);
      }
    } catch (error) {
      if (isCancelledRef.current) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('შეცდომა', 'სერვერთან კავშირი ვერ მოხერხდა.', [{ text: 'კარგი', onPress: retakePhoto }]);
    } finally {
      if (!isCancelledRef.current) setIsScanning(false);
    }
  };

  const retakePhoto = () => {
    Haptics.selectionAsync();
    isCancelledRef.current = true;
    setIsScanning(false); 
    Animated.timing(resultSheetAnim, { toValue: H, duration: 300, useNativeDriver: Platform.OS !== 'web' }).start(() => {
      setResultData(null);
      setCapturedPhoto(null);
      Animated.timing(laserOpacity, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== 'web' }).start();
    });
  };

  const handleAddToDiary = async () => {
    if (added) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAdded(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const storageKey = `@diary_${today}`;
      const existingData = await AsyncStorage.getItem(storageKey);
      let dayRecords = existingData ? JSON.parse(existingData) : [];
      
      dayRecords.push({
        id: Date.now().toString(),
        name: resultData.name,
        calories: resultData.calories,
        protein: resultData.protein,
        carbs: resultData.carbs,
        fat: resultData.fat,
        timestamp: new Date().toISOString()
      });
      await AsyncStorage.setItem(storageKey, JSON.stringify(dayRecords));
      
      setTimeout(() => {
        Alert.alert("✅ დამატებულია!", `${resultData.calories} კკალ შევიდა დღიურში.`, [
          { text: "კამერაში დაბრუნება", onPress: retakePhoto, style: "cancel" },
          { text: "დღიურის ნახვა", onPress: () => { retakePhoto(); router.push('/diary'); } }
        ]);
      }, 300);
    } catch (error) {
      setAdded(false);
      Alert.alert("შეცდომა", "მონაცემების შენახვა ვერ მოხერხდა.");
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
      
      {capturedPhoto && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000' }]}>
          <Image source={{ uri: capturedPhoto }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        </View>
      )}
      
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
           
           {!capturedPhoto && (
             <AnimatedReanimated.View style={[styles.liveIndicator, liveDotStyle]} />
           )}
           
           {!capturedPhoto && (
             <Animated.View style={[styles.laser, { transform: [{ translateY: laserAnim }], opacity: laserOpacity }]} />
           )}

           {isScanning && (
             <View style={styles.scanningGlassOverlay}>
               <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center' }}>
                 <View style={styles.scanningIconWrap}>
                   <Sparkles size={32} color="#FFF" />
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
          <Animated.View style={{ opacity: laserOpacity, alignItems: 'center', paddingHorizontal: 35, marginBottom: 35 }}>
            <Text style={styles.instructionTitle}>დროა ვისადილოთ! 🍽️</Text>
            <Text style={styles.instructionSub}>დაიჭირე კამერა თეფშის გასწვრივ. მე შევაფასებ ულუფას და დაგითვლი მაკროებს.</Text>
          </Animated.View>

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
            <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} style={{ opacity: contentFadeAnim }}>
              <View style={styles.resultImageWrap}>
                <Image source={{ uri: capturedPhoto }} style={styles.resultImage} contentFit="cover" transition={300} />
              </View>

              <Text style={styles.foodName}>{resultData.name}</Text>

              {/* 🚀 PRO მომხმარებლებს უჩანთ MET კალკულატორი, სხვებს უბრალოდ კალორიები */}
              {isPro ? (
                <View style={styles.topInfoBox}>
                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>კალორია</Text>
                    <Text style={styles.calValue}>{resultData.calories} <Text style={styles.calUnit}>კკალ</Text></Text>
                  </View>
                  <View style={styles.vDivider} />
                  <View style={[styles.infoCol, { flex: 1.2 }]}>
                    <View style={styles.burnHeader}>
                      <Activity size={14} color={DS.danger} style={{marginRight: 6}}/>
                      <Text style={styles.infoLabel}>დასაწვავად</Text>
                    </View>
                    <Text style={styles.burnValue}>~{calculateBurnTime(resultData.calories, userWeight)} <Text style={styles.burnUnit}>წთ</Text></Text>
                    <Text style={styles.burnSubtext}>აღმართზე სიარული</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.basicCalBox}>
                  <Text style={styles.basicCalLabel}>ჯამური კალორია</Text>
                  <Text style={styles.basicCalValue}>{resultData.calories} <Text style={styles.basicCalUnit}>კკალ</Text></Text>
                </View>
              )}

              <View style={styles.macroHorizontalContainer}>
                <View style={styles.macroCol}>
                  <Text style={styles.macroHeader}>ნახშირწყალი</Text>
                  <View style={styles.macroTrack}><View style={[styles.macroFill, { backgroundColor: DS.warning, width: mw.c as any }]} /></View>
                  <Text style={styles.macroGrams}>{resultData.carbs}გ</Text>
                </View>
                <View style={styles.macroCol}>
                  <Text style={styles.macroHeader}>ცხიმი</Text>
                  <View style={styles.macroTrack}><View style={[styles.macroFill, { backgroundColor: DS.danger, width: mw.f as any }]} /></View>
                  <Text style={styles.macroGrams}>{resultData.fat}გ</Text>
                </View>
                <View style={styles.macroCol}>
                  <Text style={styles.macroHeader}>ცილა</Text>
                  <View style={styles.macroTrack}><View style={[styles.macroFill, { backgroundColor: DS.emerald, width: mw.p as any }]} /></View>
                  <Text style={styles.macroGrams}>{resultData.protein}გ</Text>
                </View>
              </View>

              {/* 🍃 მწვანე პრემიუმ აღწერის ბარათი (მხოლოდ PRO-სთვის) */}
              {isPro && (
                <View style={styles.insightBoxPremium}>
                  <View style={styles.insightHeaderPremium}>
                    <Leaf size={18} color={DS.emerald} style={{ marginRight: 8 }} />
                    <Text style={styles.insightTitlePremium}>AI შეფის აღწერა</Text>
                  </View>
                  <Text style={styles.insightTextPremium}>{resultData.description}</Text>
                </View>
              )}

            </Animated.ScrollView>

            <Animated.View style={[styles.footerWrap, { opacity: contentFadeAnim }]}>
              <TouchableOpacity style={[styles.logBtn, added && { backgroundColor: DS.emerald }]} onPress={handleAddToDiary} activeOpacity={0.85}>
                {added ? (
                  <><CheckCircle2 size={20} color="#FFF" style={{ marginRight: 8 }} /><Text style={styles.logBtnText}>დამატებულია</Text></>
                ) : (
                  <Text style={styles.logBtnText}>დღიურში დამატება</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </SafeAreaView>
        )}
      </Animated.View>

      {/* ── 🚀 THE MASTER PAYWALL (Scanner Edition) 🚀 ── */}
      <Modal visible={showPaywall} animationType="slide" transparent>
        <View style={pw.overlay}>
          <View style={pw.sheet}>
            
            <View style={pw.iconWrap}>
              <Crown size={32} color={DS.gold} />
            </View>
            
            <Text style={pw.title}>სრული კონტროლი კვებაზე 🔍</Text>
            
            <Text style={pw.mainText}>
            გახდი Balansi PRO კლუბის წევრი და დაივიწყე ლიმიტები. გახსენი ულიმიტო ფოტო-ანალიზი, შეფის პროფესიონალური ინსაიტები და MET-კალკულატორი ულუფის დასაწვავად. შენი სხეული იმსახურებს საუკეთესო ტექნოლოგიას – ნუ გაჩერდები მიზნამდე.            </Text>

            <View style={pw.ecosystemBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                {/* 🚀 Leaf Icon Added Here 🚀 */}
                <Leaf size={16} color={DS.emerald} style={{ marginRight: 6 }} />
                <Text style={pw.ecosystemTitle}>PRO პრივილეგიები</Text>
              </View>
              <Text style={pw.ecosystemText}>
                ✦ პლუს, მიიღე სრული წვდომა პირად შეფ-მზარეულსა და ექსკლუზიურ ფიტნეს  რეცეპტებზე.
              </Text>
            </View>

            <TouchableOpacity style={pw.buyBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setShowPaywall(false); router.push('/profile'); }}>
              <Text style={pw.buyBtnTxt}>აიყვანე შედეგი ახალ ლეველზე 🚀</Text>
            </TouchableOpacity>
            
            {/* 🚀 Text Clipping Fix & Full Container Buffer 🚀 */}
            <View style={pw.cancelWrapper}>
              <TouchableOpacity style={pw.cancelBtn} onPress={() => setShowPaywall(false)}>
                <Text style={pw.cancelTxt}>არა, მოგვიანებით</Text>
              </TouchableOpacity>
            </View>
            
          </View>
        </View>
      </Modal>

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

  headerSafe: { position: 'absolute', top: 0, width: '100%', zIndex: 10, alignItems: 'center', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 20 },
  headerPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', gap: 6 },
  headerPillText: { color: '#FFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' },
  
  instructionTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 15, marginBottom: 8, letterSpacing: -0.5 },
  instructionSub: { color: '#D1D5DB', fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 22, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 10 },

  limitBadge: { marginTop: 15, backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: DS.warning },
  limitText: { color: DS.warning, fontSize: 12, fontWeight: '800' },

  cancelBtnSafe: { position: 'absolute', top: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 20, left: 20, zIndex: 20 },
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
  scanningGlassOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,15,13,0.8)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  scanningIconWrap: { backgroundColor: DS.emerald, padding: 18, borderRadius: 35, marginBottom: 15 },
  scanningText: { color: '#FFF', fontWeight: '800', fontSize: 16, textAlign: 'center', paddingHorizontal: 20 },

  controlsBottomArea: { position: 'absolute', bottom: 0, width: '100%', paddingBottom: Platform.OS === 'ios' ? 60 : 40, zIndex: 20 },
  limitPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)' },
  limitPillTxt: { color: '#FCD34D', fontSize: 13, fontWeight: '800' },

  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', width: '100%', paddingHorizontal: 30 },
  sideBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  captureBtnOuter: { width: 92, height: 92, borderRadius: 46, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  captureBtnInner: { width: 76, height: 76, borderRadius: 38, backgroundColor: DS.emerald, justifyContent: 'center', alignItems: 'center', shadowColor: DS.emerald, shadowOpacity: 0.6, shadowRadius: 20, elevation: 12 },

  resultSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.85, backgroundColor: DS.snow, borderTopLeftRadius: 44, borderTopRightRadius: 44, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 35, elevation: 30, zIndex: 100 },
  sheetHandle: { width: 44, height: 6, backgroundColor: '#D1D5DB', borderRadius: 6, alignSelf: 'center', marginBottom: 25, marginTop: 15 },
  resultImageWrap: { alignSelf: 'center', marginBottom: 25, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, elevation: 12, backgroundColor: '#FFF', padding: 6, borderRadius: 44 },
  resultImage: { width: 160, height: 160, borderRadius: 38, backgroundColor: '#E5E7EB' }, 
  foodName: { fontFamily: DS.fontFamily, color: DS.onyx, fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 30, paddingHorizontal: 10, lineHeight: 34, letterSpacing: -0.8 },
  
  topInfoBox: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 30, padding: 24, marginBottom: 28, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 15, elevation: 3 },
  infoCol: { flex: 1, justifyContent: 'center' },
  vDivider: { width: 1, backgroundColor: '#F3F4F6', marginHorizontal: 20 },
  infoLabel: { fontFamily: DS.fontFamily, color: DS.mist, fontSize: 14, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  calValue: { fontFamily: DS.fontFamily, color: DS.onyx, fontSize: 38, fontWeight: '900', letterSpacing: -1.5 },
  calUnit: { fontSize: 16, color: DS.mist, fontWeight: '700', letterSpacing: 0 },
  burnHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  burnValue: { fontFamily: DS.fontFamily, color: DS.danger, fontSize: 34, fontWeight: '900', letterSpacing: -1.5 },
  burnUnit: { fontSize: 16, color: DS.mist, fontWeight: '700', letterSpacing: 0 },
  burnSubtext: { fontFamily: DS.fontFamily, color: DS.mist, fontSize: 11, fontWeight: '600', marginTop: 4 },

  basicCalBox: { backgroundColor: '#FFF', padding: 24, borderRadius: 30, marginBottom: 28, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 15, elevation: 3, alignItems: 'center' },
  basicCalLabel: { color: DS.mist, fontSize: 15, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 },
  basicCalValue: { color: DS.onyx, fontSize: 48, fontWeight: '900', letterSpacing: -2.5 },
  basicCalUnit: { fontSize: 18, color: DS.mist, fontWeight: '700', letterSpacing: 0 },

  macroHorizontalContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 35 },
  macroCol: { flex: 1, paddingHorizontal: 6 },
  macroHeader: { fontFamily: DS.fontFamily, color: DS.mist, fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  macroTrack: { height: 6, backgroundColor: '#EAEAEA', borderRadius: 3, marginBottom: 10, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 3 },
  macroGrams: { fontFamily: DS.fontFamily, color: DS.onyx, fontSize: 16, fontWeight: '900' },

  insightBoxPremium: { backgroundColor: DS.emeraldGlow, padding: 24, borderRadius: 28, borderWidth: 1, borderColor: DS.emerald, marginBottom: 15 },
  insightHeaderPremium: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  insightTitlePremium: { fontFamily: DS.fontFamily, color: DS.emeraldDark, fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  insightTextPremium: { fontFamily: DS.fontFamily, color: DS.graphite, fontSize: 16, lineHeight: 26, fontWeight: '600' },

  footerWrap: { paddingHorizontal: 24, paddingTop: 15, paddingBottom: Platform.OS === 'ios' ? 30 : 40, backgroundColor: DS.snow },
  logBtn: { backgroundColor: DS.onyx, paddingVertical: 22, borderRadius: 35, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: DS.onyx, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  logBtnText: { fontFamily: DS.fontFamily, color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
});

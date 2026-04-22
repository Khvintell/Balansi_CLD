import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform,
  StatusBar, TextInput, Animated, Easing, Dimensions,
  FlatList, Alert, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useThemeStore } from '../../store/useThemeStore';
import { getColors } from '../../config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Svg, Defs, Rect, Mask as SvgMask } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  ChefHat, RotateCcw, ChevronRight, Search, X, Camera, Leaf,
  Clock, Flame, ShoppingCart, Star, CheckCircle, Plus,
  Image as ImageIcon, Zap, ScanFace, Crown
} from 'lucide-react-native';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Design System ───


const SERVER_URL = 'http://192.168.1.16:8000';

const SCAN_MESSAGES = [
  "ვაღვიძებთ AI შეფ-მზარეულს... 👨‍🍳",
  "ვასკანერებთ მაცივრის თაროებს... 🧊",
  "ვეძებთ დამალულ ინგრედიენტებს... 🔍",
  "ვადგენთ რა შეიძლება მომზადდეს... 🍲",
  "თითქმის მზადაა! ✨"
];

const INGREDIENTS_DATA = (C: any) => [
  { title: 'ხორცეული და თევზი', emoji: '🥩', color: C.red, bg: C.redLight, border: C.redBorder, data: ['ქათმის ფილე', 'საქონლის მჭლე სტეიკი', 'ორაგული', 'კალმახი', 'თინუსი წვენში', 'ინდაური'] },
  { title: 'რძის ნაწარმი და კვერცხი', emoji: '🥚', color: C.orange, bg: C.orangeLight, border: C.orangeBorder, data: ['კვერცხი', 'ხაჭო 0%', 'ხაჭo 0%', 'მაწონი', 'ბერძნული იოგურტი', 'ყველი სულგუნი', 'ყველი', 'რძე 1.5%'] },
  { title: 'მარცვლეული და პური', emoji: '🌾', color: C.purple, bg: C.purpleLight, border: C.purpleBorder, data: ['შვრია (ჰერკულესი)', 'შვრიის ფლოკი', 'წიწიბურა', 'ბრინჯი', 'კინოა', 'მაკარონი', 'ბატატი', 'მთელმარცვლოვანი პური', 'მარცვლეული ტოსტი', 'სრულმარცვლოვანი ლავაში', 'სიმინდის ფქვილი'] },
  { title: 'ბოსტნეული', emoji: '🥦', color: C.primary, bg: C.primaryLight, border: C.primaryBorder, data: ['ბროკოლი', 'სატაცური', 'სოკო', 'პომიდორი', 'ისპანახი', 'სპანახი', 'კიტრი', 'სალათის ფოთოლი', 'ბულგარული წიწაკა', 'ხახვი', 'ყაბაყი (Zucchini)', 'ბადრიჯანი', 'ჭარხალი', 'მწვანე ლობიო', 'ნიორი', 'წითელი ლობიო', 'ტკბილი სიმინდი', 'ქინძი/ოხრახუში'] },
  { title: 'ხილი, თესლეული და სხვა', emoji: '🍎', color: C.blue, bg: C.blueLight, border: C.blueBorder, data: ['ბანანი', 'კენკრის მიქსი', 'ავოკადო', 'ვაშლი', 'ჩიას თესლი', 'ნუში', 'ნიგოზი', 'არაქისის კარაქი', 'გოგრის თესლი', 'სეზამის მარცვალი', 'ზეითუნის ზეთი', 'თაფლი', 'სტევია (შაქრის შემცვლელი)', 'შავი შოკოლადი 80%', 'კაკაო', 'სოიოს სოუსი', 'ლიმონის წვენი', 'ვაშლის ძმარი', 'დარიჩინი', 'მდოგვი (უშაქრო)', 'ტომატ პასტა (უშაქრო)', 'აჯიკა', 'სვანური მარილი'] },
];

const MatchBar = ({ percent, C }: { percent: number, C: any }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: percent, duration: 700, useNativeDriver: false, easing: Easing.out(Easing.cubic) }).start();
  }, [percent]);
  const color = percent === 1 ? C.primary : percent >= 0.66 ? C.blue : C.orange;
  return (
    <View style={{ height: 5, backgroundColor: C.borderLight, borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
      <Animated.View style={{ height: 5, borderRadius: 3, backgroundColor: color, width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
};

const StatPill = ({ icon: Icon, value, color, bg }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}>
    <Icon size={12} color={color} strokeWidth={2.5} />
    <Text style={{ fontSize: 12, fontWeight: '700', color }}>{value}</Text>
  </View>
);

const SelectedPill = ({ name, onRemove, sp, C }: any) => (
  <TouchableOpacity style={[sp.pill, { flexShrink: 0 }]} onPress={onRemove} activeOpacity={0.75}>
    <Text style={sp.txt}>{name}</Text>
    <View style={sp.x}><X size={12} color={C.primaryDark} strokeWidth={3} /></View>
  </TouchableOpacity>
);

const getSpStyles = (C: any) => StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primaryBorder, paddingLeft: 16, paddingRight: 10, paddingVertical: 8, borderRadius: 24 },
  txt: { fontSize: 14, fontWeight: '800', color: C.primaryDark },
  x: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.primaryBorder, justifyContent: 'center', alignItems: 'center' },
});

export default function FridgeScreen() {
  const { themeId } = useThemeStore();
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const S = React.useMemo(() => getSStyles(C), [C]);
  const sp = React.useMemo(() => getSpStyles(C), [C]);
  const pw = React.useMemo(() => getPwStyles(C), [C]);
  const cam = React.useMemo(() => getCamStyles(C), [C]);
  const rc = React.useMemo(() => getRcStyles(C), [C]);

  const router = useRouter();

  const [selectedIngs, setSelectedIngs] = useState<string[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [allRecipes, setAllRecipes] = useState<any[]>([]);
  const [matchedRecipes, setMatchedRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'results'>('ingredients');
  const [sortBy, setSortBy] = useState(0);

  const [isPro, setIsPro] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [flash, setFlash] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<string[] | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const cameraRef = useRef<any>(null);
  const laserAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const laserOpacity = useRef(new Animated.Value(1)).current;
  const resultSheetAnim = useRef(new Animated.Value(SH)).current;
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

  const FRAME_W = SW * 0.85;
  const FRAME_H = SW * 1.15;
  const viewfinderY = Math.max(130, (SH - FRAME_H) / 4.5);

  useFocusEffect(
    useCallback(() => {
      if (!dataLoaded.current) {
        fetchRecipes();
        loadProfileAndSaved();
        dataLoaded.current = true;
      } else {
        loadProfileAndSaved();
      }
    }, [])
  );

  useEffect(() => {
    startLaser();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.1, duration: 1200, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isScanning) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % SCAN_MESSAGES.length);
      }, 2500);
    } else setLoadingMsgIdx(0);
    return () => clearInterval(interval);
  }, [isScanning]);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/recipes/`);
      if (res.ok) {
        const d = await res.json();
        setAllRecipes(Array.isArray(d) ? d : d.recipes || []);
      }
    } catch (e) {
      console.log("Fetch error:", e);
    } finally { setLoading(false); }
  };

  const loadProfileAndSaved = async () => {
    try {
      const pStr = await AsyncStorage.getItem('userProfile');
      if (pStr) {
        const p = JSON.parse(pStr);
        setIsPro(p.isPro || false);
      }
      const s = await AsyncStorage.getItem('fridge_ingredients');
      if (s) setSelectedIngs(JSON.parse(s));
    } catch { }
  };

  const toggleIngredient = useCallback(async (name: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIngs(prev => {
      const updated = prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name];
      AsyncStorage.setItem('fridge_ingredients', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addMany = async (names: string[]) => {
    setSelectedIngs(prev => {
      const updated = [...new Set([...prev, ...names])];
      AsyncStorage.setItem('fridge_ingredients', JSON.stringify(updated));
      return updated;
    });
  };

  const clearAll = async () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setSelectedIngs([]); setIngredientSearch('');
    await AsyncStorage.removeItem('fridge_ingredients');
  };

  useEffect(() => {
    if (selectedIngs.length === 0) { setMatchedRecipes([]); return; }
    let matched = allRecipes.map(recipe => {
      if (!recipe.ingredients?.length) return { ...recipe, matchCount: 0, matchPercent: 0, totalIngs: 0 };
      let mc = 0;
      recipe.ingredients.forEach((ing: any) => {
        const n = ing.product_name || ing.name || '';
        if (selectedIngs.includes(n)) mc++;
      });
      return { ...recipe, matchCount: mc, totalIngs: recipe.ingredients.length, matchPercent: mc / recipe.ingredients.length };
    }).filter(r => r.matchCount > 0);

    if (sortBy === 1) matched.sort((a, b) => (a.total_calories || 0) - (b.total_calories || 0));
    else if (sortBy === 2) matched.sort((a, b) => (b.protein || 0) - (a.protein || 0));
    else if (sortBy === 3) matched.sort((a, b) => (a.prep_time || 0) - (b.prep_time || 0));
    else matched.sort((a, b) => b.matchPercent - a.matchPercent);

    setMatchedRecipes(matched);
  }, [selectedIngs, allRecipes, sortBy]);

  const openCamera = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isPro) { router.push('/paywall'); return; }
    if (!permission?.granted) {
      const req = await requestPermission();
      if (!req.granted) return;
    }
    setCapturedPhoto(null); setDetectedItems(null);
    setIsScanning(false); setIsCameraActive(true); startLaser();
  };

  const startLaser = () => {
    Animated.loop(Animated.sequence([
      Animated.timing(laserAnim, { toValue: FRAME_H - 4, duration: 2500, useNativeDriver: true }),
      Animated.timing(laserAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
    ])).start();
  };

  const closeCamera = () => {
    isCancelledRef.current = true; setIsScanning(false);
    setCapturedPhoto(null); setDetectedItems(null);
    setFlash(false); setIsCameraActive(false);
    resultSheetAnim.setValue(SH); laserOpacity.setValue(1); laserAnim.setValue(0);
  };

  const retakePhoto = () => {
    Haptics.selectionAsync(); isCancelledRef.current = true; setIsScanning(false);
    Animated.timing(resultSheetAnim, { toValue: SH, duration: 300, useNativeDriver: true }).start(() => {
      setDetectedItems(null); setCapturedPhoto(null);
      Animated.timing(laserOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const processImage = async (uri: string) => {
    isCancelledRef.current = false; setIsScanning(true); setCapturedPhoto(uri);
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri, [{ resize: { width: 800 } }], { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );
      const fd = new FormData();
      fd.append('file', { uri: manipResult.uri, name: 'fridge.jpg', type: 'image/jpeg' } as any);
      const res = await fetch(`${SERVER_URL}/scan-fridge`, { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd });
      const data = await res.json();
      if (isCancelledRef.current) return;
      if (data.success && data.ingredients.length > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDetectedItems(data.ingredients);
        Animated.spring(resultSheetAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }).start();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('ვერ ვიცანი 🧐', data.message || 'საჭმელი ვერ ვიპოვე.', [{ text: 'თავიდან ცდა', onPress: retakePhoto }]);
      }
    } catch (error) {
      if (isCancelledRef.current) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('შეცდომა', 'სერვერთან კავშირი ვერ მოხერხდა.', [{ text: 'კარგი', onPress: retakePhoto }]);
    } finally { if (!isCancelledRef.current) setIsScanning(false); }
  };

  const takePic = async () => {
    if (!cameraRef.current || isScanning) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start();
    Animated.timing(laserOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.3, skipProcessing: true });
      if (photo?.uri) processImage(photo.uri);
    } catch {
      Animated.timing(laserOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  };

  const pickGallery = async () => {
    if (!isPro) { router.push('/paywall'); return; }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0].uri) {
      Animated.timing(laserOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      processImage(result.assets[0].uri);
    }
  };

  const renderRecipeItem = useCallback(({ item: recipe }: { item: any }) => {
    let finalUrl = "";

    if (recipe.image_url) {
      if (recipe.image_url.startsWith('http')) {
        finalUrl = recipe.image_url;
      } else {
        const cleanPath = recipe.image_url.replace('assets/', '').replace(/^\/+/, '');
        finalUrl = `${SERVER_URL}/assets/${cleanPath}`;
      }
    } else {
      finalUrl = 'https://via.placeholder.com/200';
    }

    return (
      <TouchableOpacity
        style={rc.card}
        activeOpacity={0.8}
        onPress={() => { router.push(`/details/${recipe.id}`); }}
      >
        <View style={rc.imgContainer}>
          <Image
            source={{ uri: finalUrl }}
            style={rc.img}
            contentFit="cover"
            transition={300}
            cachePolicy="disk"
          />
        </View>
        <View style={rc.body}>
          <Text style={rc.name} numberOfLines={2}>{recipe.name}</Text>
          <View style={rc.pills}>
            <StatPill icon={Clock} value={`${recipe.prep_time || '?'}წთ`} color={C.blue} bg={C.blueLight} />
            <StatPill icon={Flame} value={`${recipe.total_calories || '?'}კკ`} color={C.orange} bg={C.orangeLight} />
          </View>
          <MatchBar percent={recipe.matchPercent} C={C} />
          <Text style={{ fontSize: 11, color: C.inkLight, marginTop: 6, fontWeight: '700' }}>
            {recipe.matchPercent === 1 ? '✓ ყველაფერი გაქვს' : `${recipe.matchCount} / ${recipe.totalIngs} ინგრედიენტი`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [rc, C, router, SERVER_URL]);

  if (isCameraActive) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <CameraView style={StyleSheet.absoluteFillObject} facing="back" enableTorch={flash} ref={cameraRef} />
        {capturedPhoto && <Image source={{ uri: capturedPhoto }} style={StyleSheet.absoluteFillObject} contentFit="cover" />}
        <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#FFF', opacity: flashAnim, zIndex: 100 }]} pointerEvents="none" />

        {/* ── 🎭 PREMIUM CAMERA SVG MASK ── */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg height={SH} width={SW}>
            <Defs>
              <SvgMask id="mask" x="0" y="0" height={SH} width={SW}>
                <Rect height={SH} width={SW} fill="#fff" />
                <Rect
                  x={(SW - FRAME_W) / 2}
                  y={viewfinderY}
                  width={FRAME_W}
                  height={FRAME_H}
                  rx="80"
                  fill="#000"
                />
              </SvgMask>
            </Defs>
            <Rect height={SH} width={SW} fill={C.darkGlass} mask="url(#mask)" />
          </Svg>
        </View>

        <SafeAreaView style={cam.headerSafe} pointerEvents="box-none">
          <View style={cam.headerPill}><Leaf size={16} color={C.primary} /><Text style={cam.headerPillText}>Balansi AI</Text></View>
        </SafeAreaView>

        <SafeAreaView style={cam.cancelBtnSafe}>
          <TouchableOpacity style={cam.cancelBtn} onPress={detectedItems ? retakePhoto : closeCamera} activeOpacity={0.7}><X size={24} color="#FFF" /></TouchableOpacity>
        </SafeAreaView>

        {/* ── 🚀 VIEWPORT UI (CORNERS & DOT) ── */}
        {!detectedItems && (
          <View style={[cam.viewportUi, { top: viewfinderY, height: FRAME_H, width: FRAME_W }]} pointerEvents="none">
            <View style={[cam.corner, cam.topLeft]} />
            <View style={[cam.corner, cam.topRight]} />
            <View style={[cam.corner, cam.bottomLeft]} />
            <View style={[cam.corner, cam.bottomRight]} />

            {!isScanning && (
              <AnimatedReanimated.View style={[cam.liveIndicator, liveDotStyle]} />
            )}

            {!isScanning && (
              <Animated.View style={[cam.laser, { transform: [{ translateY: laserAnim }], opacity: laserOpacity }]} />
            )}

            {isScanning && (
              <View style={cam.scanningGlassOverlay}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center' }}>
                  <View style={cam.scanningIconWrap}>
                    <Leaf size={32} color="#FFF" />
                  </View>
                  <Text style={cam.scanningText}>{SCAN_MESSAGES[loadingMsgIdx]}</Text>
                </Animated.View>
              </View>
            )}
          </View>
        )}

        {/* ── 🔘 BOTTOM ACTION AREA (TEXT & CONTROLS) ── */}
        {!detectedItems && !isScanning && (
          <SafeAreaView style={cam.controlsBottomArea}>
            <Animated.View style={{ opacity: laserOpacity, alignItems: 'center', paddingHorizontal: 40, marginBottom: 35 }}>
              <Text style={cam.instructionTitle}>რა გვაქვს მაცივარში? 🥦</Text>
              <Text style={cam.instructionSub}>გადაუღე თაროებს ფოტო და აღმოაჩინე ჯანსაღი რეცეპტები შენი ინგრედიენტებით.</Text>
            </Animated.View>

            <View style={cam.controlsRow}>
              <View style={cam.sideBtnPocket}>
                <TouchableOpacity style={[cam.sideBtn, flash && { backgroundColor: 'rgba(255,255,255,0.3)' }]} onPress={() => { Haptics.selectionAsync(); setFlash(!flash); }}>
                  <Zap size={22} color="#FFF" fill={flash ? "#FFF" : "transparent"} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={cam.captureBtnOuter} onPress={takePic} activeOpacity={0.8}>
                <View style={cam.captureBtnInner}>
                  <Camera size={36} color="#FFF" />
                </View>
              </TouchableOpacity>

              <View style={cam.sideBtnPocket}>
                <TouchableOpacity style={cam.sideBtn} onPress={pickGallery}>
                  <ImageIcon size={22} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        )}

        <Animated.View style={[cam.resultSheet, { transform: [{ translateY: resultSheetAnim }] }]}>
          {detectedItems && (
            <SafeAreaView style={{ flex: 1, paddingHorizontal: 25, paddingTop: 10 }}>
              <View style={cam.sheetHandle} /><Text style={cam.resultTitle}>ვიპოვე {detectedItems.length} პროდუქტი 🧊</Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={cam.chipsContainer}>{detectedItems.map((ing, i) => (<View key={i} style={cam.resultChip}><CheckCircle size={14} color={C.primary} /><Text style={cam.resultChipText}>{ing}</Text></View>))}</View>
                <View style={cam.actionRow}>
                  <TouchableOpacity style={cam.retakeBtn} onPress={retakePhoto}><RotateCcw size={20} color="#FFF" /></TouchableOpacity>
                  <TouchableOpacity style={cam.addBtn} onPress={() => { addMany(detectedItems!); closeCamera(); }}><Plus size={20} color="#FFF" style={{ marginRight: 8 }} /><Text style={cam.addBtnText}>დამატება</Text></TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          )}
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }} edges={['top']}>

        <View style={S.header}>
          <View><View style={S.brandPill}><Leaf size={14} color={C.primary} /><Text style={S.brandTag}>Balansi Ecosystem</Text></View><Text style={S.headerTitle}>ჩემი მაცივარი</Text><Text style={S.subHeaderTitle}>რას ვამზადებთ დღეს?</Text></View>
          <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center' }}>
            <TouchableOpacity style={[S.camBtnBig, !isPro && { backgroundColor: C.ink }]} onPress={openCamera} activeOpacity={0.85}>
              {isPro ? <ScanFace size={24} color="#FFF" /> : <Crown size={24} color={C.gold} />}
            </TouchableOpacity>
            {!isPro && <Text style={{ fontSize: 10, color: C.inkLight, fontWeight: '700', marginTop: 4 }}>პირადი შეფი (PRO)</Text>}
          </Animated.View>
        </View>

        <View style={S.statStrip}>
          {selectedIngs.length > 0 ? (
            <><StatPill icon={ShoppingCart} value={`${selectedIngs.length} პროდუქტი`} color={C.blue} bg={C.blueLight} /><StatPill icon={ChefHat} value={`${matchedRecipes.length} რეცეპტი`} color={C.primary} bg={C.primaryLight} /><View style={{ flex: 1 }} /><TouchableOpacity onPress={clearAll} style={{ padding: 5 }}><Text style={{ color: C.red, fontWeight: '700', fontSize: 13 }}>გასუფთავება</Text></TouchableOpacity></>
          ) : (
            <Text style={{ color: C.inkLight, fontSize: 14, fontWeight: '500' }}>დაამატე პროდუქტები ხელით ან AI სკანერით</Text>
          )}
        </View>

        {selectedIngs.length > 0 && (
          <View style={{ flexShrink: 0, minHeight: 44, marginBottom: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }} style={{ flexGrow: 0 }}>
              {selectedIngs.map((ing, i) => (<SelectedPill key={i} name={ing} sp={sp} C={C} onRemove={() => toggleIngredient(ing)} />))}
            </ScrollView>
          </View>
        )}

        <View style={S.tabBar}>
          {[{ label: 'ინგრედიენტები', tab: 'ingredients' }, { label: 'რეცეპტები', tab: 'results' }].map((item, i) => {
            const active = activeTab === item.tab;
            return (
              <TouchableOpacity key={i} style={[S.tab, active && S.tabActive]} onPress={() => { if (Platform.OS !== 'web') Haptics.selectionAsync(); setActiveTab(item.tab as any); }} activeOpacity={0.78}>
                <Text style={[S.tabTxt, active && S.tabTxtOn]}>{item.label}</Text>
                {item.tab === 'results' && matchedRecipes.length > 0 && <View style={[S.tabBadge, active && S.tabBadgeActive]}><Text style={S.tabBadgeTxt}>{matchedRecipes.length}</Text></View>}
              </TouchableOpacity>
            );
          })}
        </View>

        {activeTab === 'ingredients' ? (
          <View style={{ flex: 1 }}>
            <View style={S.searchWrap}><View style={S.searchBox}><Search size={18} color={C.inkFaint} /><TextInput style={S.searchInput} placeholder="ძებნა..." placeholderTextColor={C.inkFaint} value={ingredientSearch} onChangeText={setIngredientSearch} />{ingredientSearch.length > 0 && (<TouchableOpacity onPress={() => setIngredientSearch('')}><X size={18} color={C.inkLight} /></TouchableOpacity>)}</View></View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
              {INGREDIENTS_DATA(C).map((section, idx) => {
                const filteredData = section.data.filter(ing =>
                  ing.toLowerCase().includes(ingredientSearch.toLowerCase())
                );
                if (filteredData.length === 0) return null;

                return (
                  <View key={idx} style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: C.ink, marginBottom: 10, marginLeft: 5 }}>{section.emoji} {section.title}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                      {filteredData.map((ing, j) => {
                        const isSel = selectedIngs.includes(ing);
                        return (
                          <TouchableOpacity
                            key={ing}
                            onPress={() => toggleIngredient(ing)}
                            activeOpacity={0.8}
                            style={[
                              {
                                width: '48%',
                                marginBottom: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 12,
                                paddingVertical: 14,
                                borderRadius: 18,
                                borderWidth: 1,
                                backgroundColor: C.surface,
                                borderColor: C.border,
                                shadowColor: '#000',
                                shadowOpacity: 0.02,
                                shadowRadius: 8,
                                elevation: 1
                              },
                              isSel && { backgroundColor: section.bg, borderColor: section.border, shadowOpacity: 0.05 }
                            ]}
                          >
                            <View style={{ flex: 1, paddingRight: 6 }}>
                              <Text
                                numberOfLines={2}
                                style={{
                                  fontSize: 13,
                                  fontWeight: isSel ? '800' : '600',
                                  color: isSel ? section.color : C.ink,
                                  lineHeight: 18,
                                  letterSpacing: -0.2
                                }}
                              >
                                {ing}
                              </Text>
                            </View>
                            <View style={{
                              width: 22, height: 22, borderRadius: 11,
                              backgroundColor: isSel ? section.color : C.border,
                              justifyContent: 'center', alignItems: 'center'
                            }}>
                              {isSel ? (
                                <CheckCircle size={12} color="#FFF" strokeWidth={3.5} />
                              ) : (
                                <Plus size={12} color={C.inkLight} strokeWidth={3} />
                              )}
                            </View>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          <FlatList
            data={matchedRecipes}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<View style={S.emptyResults}><ChefHat size={50} color={C.border} /><Text style={S.emptyResultsTitle}>რეცეპტები არ მოიძებნა</Text><Text style={S.emptyResultsSub}>დაამატე მეტი ინგრედიენტი სიიდან ან გამოიყენე AI მაცივრის სკანერი.</Text></View>}
            renderItem={renderRecipeItem}
          />
        )}
      </SafeAreaView>


    </View>
  );
}

// ─── STYLES ───
const getPwStyles = (C: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.proBg, padding: 24, paddingBottom: Platform.OS === 'ios' ? 50 : 40, borderTopLeftRadius: 35, borderTopRightRadius: 35, alignItems: 'center' },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(245, 158, 11, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1.5, borderColor: 'rgba(245, 158, 11, 0.4)' },
  title: { color: '#FFF', fontSize: 22, fontWeight: '900', marginBottom: 16, textAlign: 'center' },
  mainText: { color: '#D1FAE5', fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  ecosystemBox: { width: '100%', backgroundColor: C.proBox, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', marginBottom: 30 },
  ecosystemTitle: { color: C.primary, fontSize: 14, fontWeight: '800' },
  ecosystemText: { color: '#A7F3D0', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  buyBtn: { backgroundColor: C.gold, width: '100%', paddingVertical: 18, borderRadius: 100, alignItems: 'center' },
  buyBtnTxt: { color: '#000', fontSize: 16, fontWeight: '900' },
  cancelWrapper: { minHeight: 50, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { padding: 12 },
  cancelTxt: { color: '#A7F3D0', fontSize: 14, fontWeight: '700' }
});

const getCamStyles = (C: any) => StyleSheet.create({
  headerSafe: { position: 'absolute', top: 0, width: '100%', zIndex: 10, alignItems: 'center', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 20 },
  headerPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', gap: 6 },
  headerPillText: { color: '#FFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },

  instructionTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 15, marginBottom: 8, letterSpacing: -0.5 },
  instructionSub: { color: '#D1D5DB', fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 22, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 10 },

  viewportUi: { position: 'absolute', alignSelf: 'center', zIndex: 10, overflow: 'hidden', borderRadius: 80 },
  liveIndicator: { position: 'absolute', top: 30, left: 30, width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', shadowColor: '#10B981', shadowOpacity: 1, shadowRadius: 10, elevation: 12 },
  instructionContainer: { position: 'absolute', width: '100%', alignItems: 'center', zIndex: 10 },

  cancelBtnSafe: { position: 'absolute', top: Platform.OS === 'android' ? StatusBar.currentHeight! + 10 : 20, left: 20, zIndex: 20 },
  cancelBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },

  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#FFF', shadowColor: '#FFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 10 },
  topLeft: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 30 }, topRight: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 30 }, bottomLeft: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 30 }, bottomRight: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 30 },

  laser: { position: 'absolute', width: '100%', height: 4, backgroundColor: C.primary, shadowColor: C.primary, shadowOpacity: 1, shadowRadius: 20, elevation: 15 },
  scanningGlassOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  scanningIconWrap: { backgroundColor: C.primary, padding: 18, borderRadius: 30, marginBottom: 15 },
  scanningText: { color: '#FFF', fontWeight: '800', fontSize: 16, textAlign: 'center', paddingHorizontal: 20 },

  controlsBottomArea: { position: 'absolute', bottom: 0, width: '100%', paddingBottom: Platform.OS === 'ios' ? 60 : 40, zIndex: 20 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', width: '100%', paddingHorizontal: 30 },
  sideBtnPocket: { width: 60, alignItems: 'center' },
  sideBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  captureBtnOuter: { width: 92, height: 92, borderRadius: 46, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  captureBtnInner: { width: 76, height: 76, borderRadius: 38, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', shadowColor: C.primary, shadowOpacity: 0.6, shadowRadius: 20, elevation: 12 },

  resultSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 380, backgroundColor: 'rgba(15, 23, 42, 0.98)', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 20 },
  sheetHandle: { width: 40, height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 5, alignSelf: 'center', marginBottom: 15 },
  resultTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 15 },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 },
  resultChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, maxWidth: SW - 80 }, resultChipText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 10 }, retakeBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 20 }, addBtn: { flex: 1, backgroundColor: C.primary, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }, addBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});

const getSStyles = (C: any) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  brandPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 8 },
  brandTag: { fontSize: 11, fontWeight: '900', color: C.primaryDark, textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: C.ink, letterSpacing: -1 },
  subHeaderTitle: { fontSize: 16, fontWeight: '600', color: C.inkLight, marginTop: 4 },
  camBtnBig: { width: 60, height: 60, borderRadius: 24, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', shadowColor: C.primary, shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
  statStrip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 8, marginVertical: 15 },
  searchWrap: { paddingHorizontal: 20, marginBottom: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderRadius: 20, height: 54, paddingHorizontal: 18, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  searchInput: { flex: 1, color: C.ink, fontSize: 16, fontWeight: '600' },
  tabBar: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: C.surface, borderRadius: 20, padding: 6, borderWidth: 1, borderColor: C.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 14, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabActive: { backgroundColor: C.primary },
  tabTxt: { color: C.inkLight, fontSize: 15, fontWeight: '800' },
  tabTxtOn: { color: '#FFF', fontWeight: '900' },
  tabBadge: { backgroundColor: C.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeTxt: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  emptyResults: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50, paddingHorizontal: 30 },
  emptyResultsTitle: { fontSize: 20, fontWeight: '900', color: C.ink, marginTop: 15, letterSpacing: -0.5 },
  emptyResultsSub: { color: C.inkLight, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 22 }
});

const getRcStyles = (C: any) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 26,
    marginBottom: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  imgContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: C.surfaceMid,
  },
  img: {
    width: '100%',
    height: '100%',
  },
  body: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 17,
    fontWeight: '900',
    color: C.ink,
    marginBottom: 8,
    lineHeight: 22,
    letterSpacing: -0.5
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
});

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView,
  TouchableOpacity, Platform,
  ScrollView, StatusBar, Animated, Dimensions,
  Easing, Alert, Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeStore } from '../store/useThemeStore';
import { getColors } from '../config/theme';
import * as Haptics from 'expo-haptics';
import {
  Activity, User, Ruler, Weight, Flag,
  ChevronRight, Leaf, TrendingDown,
  Minus, ChevronLeft, TrendingUp
} from 'lucide-react-native';

import { useDiaryStore, GoalType } from '../store/useDiaryStore';
import { FloatingInput } from '../components/onboarding/FloatingInput';
import { GoalCard } from '../components/onboarding/GoalCard';
import { SummaryRow } from '../components/onboarding/SummaryRow';
import { BrandAlert } from '../components/ui/BrandAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SW, height: SH } = Dimensions.get('window');



const TOTAL_STEPS = 5;

const pb = StyleSheet.create({
  row: { flexDirection:'row', gap:6, width: '100%', marginTop: 4 },
  track: { flex:1, height:4, borderRadius:3 },
});

const FloatingOrb = ({ size, color, top, left, right, bottom, delay }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue:1, duration:4000+delay, easing:Easing.inOut(Easing.sin), useNativeDriver:true }),
      Animated.timing(anim, { toValue:0, duration:4000+delay, easing:Easing.inOut(Easing.sin), useNativeDriver:true }),
    ])).start();
  }, [delay, anim]);
  return (
    <Animated.View style={{
      position:'absolute', width:size, height:size, borderRadius:size/2,
      backgroundColor:color, top, left, right, bottom,
      opacity: anim.interpolate({ inputRange:[0,1], outputRange:[0.3, 0.5] }),
      transform:[{ translateY:anim.interpolate({ inputRange:[0,1], outputRange:[0, -25] }) }],
    }} pointerEvents="none"/>
  );
};

const MacroChip = ({ label, value, color, bg, delay, mr }: any) => {
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(op, { toValue:1, duration:500, delay, useNativeDriver:true }).start(); }, [op, delay]);
  return (
    <Animated.View style={[mr.chip, { backgroundColor:bg, opacity:op }]}>
      <Text style={[mr.val, { color }]}>{value}გ</Text>
      <Text style={mr.label}>{label}</Text>
    </Animated.View>
  );
};

const getMrStyles = (C: any) => StyleSheet.create({
  chip: { flex:1, alignItems:'center', padding:16, borderRadius:20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  val: { fontSize:19, fontWeight:'900', marginBottom:3 },
  label: { fontSize:10, color:C.inkMid, fontWeight:'800', textTransform:'uppercase' },
});

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
  const [alertS, setAlertS] = useState<any>({ visible:false, type:'info', title:'', message:'' });

  const btnPulse = useRef(new Animated.Value(1)).current;
  const stepOpac = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(btnPulse, { toValue:1.04, duration:1500, useNativeDriver:true }),
      Animated.timing(btnPulse, { toValue:1, duration:1500, useNativeDriver:true }),
    ])).start();
  }, [btnPulse]);

  const calcResults = () => {
    const a = parseFloat(age)||25, h = parseFloat(height)||170, w = parseFloat(weight)||70, tw = parseFloat(targetWeight)||65;
    const bmr  = (10*w) + (6.25*h) - (5*a) + 5;
    const tdee = bmr * 1.375;
    let targetCals = tdee;
    if (goal==='lose') targetCals -= (w-tw)>=10 ? 700 : 500;
    else if (goal==='gain') targetCals += 400;
    const protein = Math.round((goal==='lose'?tw:w)*2.0);
    const fats = Math.round((targetCals*0.25)/9);
    const carbs = Math.round((targetCals-(protein*4)-(fats*9))/4);
    
    // Construct full profile object for consistency
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

    return { calories:Math.round(targetCals), protein, carbs, fats, bmr, tdee, water: Math.round(w * 33), fullProfile };
  };

  const saveAndFinish = async () => {
    const r = calcResults();
    try {
      // Step 1: Update Zustand store
      setProfile(r.fullProfile);

      // Step 2: Explicitly save to AsyncStorage for other screens (Profile/Index)
      await AsyncStorage.setItem('userProfile', JSON.stringify(r.fullProfile));
      
      // Step 3: Initialize weight history
      await AsyncStorage.setItem('weightHistory', JSON.stringify([r.fullProfile.weight]));

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      isEditMode ? router.back() : router.replace('/(tabs)');
    } catch (e) {
      console.error("Failed to save profile:", e);
      Alert.alert('შეცდომა', 'მონაცემები ვერ შეინახა.');
    }
  };

  const goBack = () => {
    if (step === 1 || (isEditMode && step === 3)) {
      if (isEditMode) router.back();
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(s => s - 1);
  };

  const goNext = () => {
    if (step === 2 && !name.trim()) return;
    if (step === 3 && (!age || !height || !weight || !targetWeight)) return;
    if (step === 5) { saveAndFinish(); return; }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(s => s + 1);
  };

  const renderStep = () => {
    const hParsed = parseFloat(height);
    const wParsed = parseFloat(weight);
    const bmi = (!isNaN(hParsed) && !isNaN(wParsed) && hParsed>0) ? (wParsed / Math.pow(hParsed/100, 2)).toFixed(1) : null;
    const idealW = !isNaN(hParsed) && hParsed>0 ? Math.round(24.8 * Math.pow(hParsed/100, 2)) : null;

    switch (step) {
      case 1: return (
        <View style={S.stepWrap}>
          <View style={S.welcomeHero}>
            <View style={S.heroLogoOuter}><View style={S.heroLogoInner}><Image source={require('../material/logo.png')} style={{width: 90, height: 90}} resizeMode="contain" /></View></View>
            <View style={S.heroPulseRing}/>
          </View>
          <View style={S.welcomeTextWrap}>
             <View style={S.brandBadge}><Leaf size={14} color={C.primaryDark}/><Text style={S.brandBadgeTxt}>Balansi · პერსონალური AI ასისტენტი</Text></View>
             <Text style={S.welcomeTitle}>აღმოაჩინე{'\n'}შენი საუკეთესო{'\n'}ფორმა.</Text>
             <Text style={S.welcomeSub}>მიიღე შენს სხეულზე მორგებული, ზუსტი კვების გეგმა წამებში.</Text>
          </View>
        </View>
      );
      case 2: return (
        <View style={S.stepWrap}>
          <View style={S.stepHeroSmall}><View style={[S.stepEmojiBg, { backgroundColor:C.primaryLight }]}><Text style={S.stepEmoji}>👋</Text></View></View>
          <Text style={S.stepTitle}>შენი სახელი?</Text>
          <FloatingInput placeholder="მაგ: გიორგი" value={name} onChangeText={setName} icon={User} color={C.primary} autoFocus />
        </View>
      );
      case 3: return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.stepWrap}>
          <View style={S.stepHeroSmall}><View style={[S.stepEmojiBg, { backgroundColor:C.infoBg }]}><Text style={S.stepEmoji}>📏</Text></View></View>
          <Text style={S.stepTitle}>სხეულის მონაცემები</Text>
          <View style={{ flexDirection:'row', gap:12 }}>
            <View style={{ flex:1 }}><FloatingInput label="ასაკი" placeholder="მაგ: 24" value={age} onChangeText={setAge} keyboardType="numeric" icon={Activity} color={C.info} unit="წ"/></View>
            <View style={{ flex:1 }}><FloatingInput label="სიმაღლე" placeholder="მაგ: 175" value={height} onChangeText={setHeight} keyboardType="numeric" icon={Ruler} color={C.primary} unit="სმ"/></View>
          </View>
          <FloatingInput label="ამჟამინდელი წონა" placeholder="მაგ: 75" value={weight} onChangeText={setWeight} keyboardType="numeric" icon={Weight} color={C.warning} unit="კგ"/>
          <FloatingInput label="სამიზნე წონა" placeholder="მაგ: 68" value={targetWeight} onChangeText={setTargetWeight} keyboardType="numeric" icon={Flag} color={C.primary} unit="კგ"/>
          {bmi && (
            <View style={S.bmiCard}>
              <View style={S.bmiLeft}><Text style={S.bmiTitle}>BMI ინდექსი</Text><Text style={[S.bmiValue, { color: parseFloat(bmi)<18.5||parseFloat(bmi)>=30 ? C.danger : C.primary }]}>{bmi}</Text></View>
              <View style={S.bmiRight}><Text style={S.idealLabel}>იდეალური წონა</Text><Text style={S.idealValue}>{idealW} კგ</Text></View>
            </View>
          )}
        </ScrollView>
      );
      case 4: return (
        <View style={S.stepWrap}>
          <View style={S.stepHeroSmall}><View style={[S.stepEmojiBg, { backgroundColor:C.warningBg }]}><Text style={S.stepEmoji}>🎯</Text></View></View>
          <Text style={S.stepTitle}>მთავარი მიზანი</Text>
          <GoalCard icon={TrendingDown} label="წონის კლება" desc="ცხიმის წვა და კალორიული დეფიციტი" color={C.info} bg={C.infoBg} border="#BFDBFE" selected={goal==='lose'} onPress={()=>setGoal('lose')} />
          <GoalCard icon={Minus} label="შენარჩუნება" desc="არსებული ფორმის და ენერგიის ბალანსი" color={C.primary} bg={C.primaryLight} border={C.primaryBorder} selected={goal==='maintain'} onPress={()=>setGoal('maintain')} />
          <GoalCard icon={TrendingUp} label="კუნთის მასა" desc="ძალის მატება და ჯანსაღი ზრდა" color={C.danger} bg={C.dangerBg} border="#FECACA" selected={goal==='gain'} onPress={()=>setGoal('gain')} />
        </View>
      );
      case 5: {
        const r = calcResults();
        return (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.stepWrap}>
            <View style={S.stepHeroSmall}><View style={[S.stepEmojiBg, { backgroundColor:C.primaryLight }]}><Text style={S.stepEmoji}>🚀</Text></View></View>
            <Text style={S.stepTitle}>ანალიზი მზადაა!</Text>
            <View style={S.calHero}>
              <View style={S.calHeroBg1}/><View style={S.calHeroBg2}/>
              <Text style={S.calHeroLabel}>შენი დღიური ლიმიტი</Text>
              <Text style={S.calHeroNum}>{r.calories}</Text>
              <Text style={S.calHeroUnit}>კკალ / დღეში</Text>
            </View>
            <View style={S.macroRow}>
               <MacroChip mr={mr} label="ცილა" value={r.protein} color={C.info} bg={C.infoBg} delay={100}/>
               <MacroChip mr={mr} label="ნახშირწყ." value={r.carbs} color={C.warning} bg={C.warningBg} delay={250}/>
               <MacroChip mr={mr} label="ცხიმი" value={r.fats} color={C.danger} bg={C.dangerBg} delay={400}/>
            </View>
            <View style={S.summaryCard}>
              <SummaryRow emoji="💧" label="წყლის ნორმა" value={`${(r.water/1000).toFixed(1)} ლიტრი`} desc="ჰიდრატაცია მეტაბოლიზმისთვის" />
              <SummaryRow emoji="🔥" label="ბაზალური წვა (BMR)" value={`${Math.round(r.bmr)} კკალ`} desc="ენერგია, რასაც სხეული მოსვენებისას წვავს" />
              <SummaryRow emoji="⚡" label="დღიური ხარჯი (TDEE)" value={`${Math.round(r.tdee)} კკალ`} desc="სრული ხარჯი აქტივობით" />
              <SummaryRow emoji="⚖️" label="BMI სტატუსი" value={bmi} desc="სხეულის მასის ინდექსი" noBorder />
            </View>
          </ScrollView>
        );
      }
      default: return null;
    }
  };

  return (
    <View style={S.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surfaceAlt}/>
      
      {/* 🚀 Dynamic Background Orbs 🚀 */}
      <FloatingOrb size={200} color={C.primaryLight} top={-50} left={-60} delay={0} />
      <FloatingOrb size={150} color={C.infoBg} bottom={100} right={-40} delay={1500} />

      <SafeAreaView style={S.safe}>
        <View style={S.topBar}>
          <TouchableOpacity onPress={goBack} style={S.backBtn}><ChevronLeft size={22} color={C.ink} /></TouchableOpacity>
          <View style={S.topBarCenter}>
             <View style={S.topBarLogoWrap}><Image source={require('../material/logo.png')} style={{width: 14, height: 14, marginRight: 5}} resizeMode="contain" /><Text style={S.topBarLogoTxt}>BALANSI</Text></View>
             <View style={pb.row}>{Array.from({ length:TOTAL_STEPS }).map((_,i)=>(<View key={i} style={[pb.track, { backgroundColor: i < step ? C.primary : C.border }]} />))}</View>
          </View>
          <View style={S.stepCountBadge}><Text style={S.stepCountTxt}>{step}/{TOTAL_STEPS}</Text></View>
        </View>

        <Animated.View style={[S.contentArea, { opacity: stepOpac }]}>
          {renderStep()}
        </Animated.View>

        <View style={S.bottomBar}>
          <Animated.View style={{ transform:[{ scale:btnPulse }] }}>
            <TouchableOpacity style={[S.nextBtn, { backgroundColor: step===5 ? C.primary : C.ink }]} onPress={goNext}>
              <Text style={S.nextBtnTxt}>{step===1 ? 'დაწყება' : step===5 ? 'გეგმის გააქტიურება' : 'შემდეგი'}</Text>
              {step!==5 && <ChevronRight size={20} color="#FFF"/>}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
      <BrandAlert state={alertS} onClose={()=>setAlertS((p: any)=>({...p, visible:false}))} />
    </View>
  );
}


const getSStyles = (C: any, SH: number) => StyleSheet.create({
  root: { flex:1, backgroundColor: '#FBFCFE' },
  safe: { flex:1 },
  topBar: { flexDirection:'row', alignItems:'center', paddingHorizontal:20, paddingTop:Platform.OS==='android'?48:10, paddingBottom:15 },
  backBtn: { width:42, height:42, borderRadius:13, backgroundColor:C.surface, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:C.border },
  topBarCenter: { flex:1, marginHorizontal:15, alignItems: 'center' },
  topBarLogoWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  topBarLogoTxt: { fontWeight: '900', fontSize: 11, color: C.ink, letterSpacing: 1.5 },
  stepCountBadge: { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:100, paddingHorizontal:10, paddingVertical:5 },
  stepCountTxt: { fontSize:12, fontWeight:'800', color:C.inkLight },
  contentArea: { flex:1 },
  stepWrap: { paddingHorizontal:24, paddingBottom:30, paddingTop: 10 },
  welcomeHero: { height:220, justifyContent:'center', alignItems:'center', position:'relative', marginBottom:20 },
  heroLogoOuter: { width:160, height:160, borderRadius:80, backgroundColor:C.primaryGlow, justifyContent:'center', alignItems:'center' },
  heroLogoInner: { width:130, height:130, borderRadius:65, backgroundColor: '#FFF', justifyContent:'center', alignItems:'center', elevation:12, shadowOpacity: 0.15, shadowRadius: 15 },
  heroPulseRing: { position:'absolute', width:190, height:190, borderRadius:95, borderWidth:2, borderColor:C.primary+'30' },
  welcomeTextWrap: { alignItems: 'center' },
  brandBadge: { flexDirection:'row', alignItems:'center', gap:6, backgroundColor:C.primaryLight, paddingHorizontal:12, paddingVertical:6, borderRadius:12, borderWidth:1, borderColor:C.primaryBorder, marginBottom:15 },
  brandBadgeTxt: { fontSize:12, fontWeight:'800', color:C.primaryDark },
  welcomeTitle: { fontSize: 34, fontWeight: '900', color: '#000', textAlign: 'center', lineHeight: 45 },
  welcomeSub: { fontSize: 15, color: C.inkMid, lineHeight: 22, fontWeight: '600', marginTop: 10, textAlign: 'center' },
  stepHeroSmall: { alignItems:'center', marginBottom:25 },
  stepEmojiBg: { width:76, height:76, borderRadius:24, justifyContent:'center', alignItems:'center' },
  stepEmoji: { fontSize:36 },
  stepTitle: { fontSize: 26, fontWeight: '900', color: '#000', textAlign: 'center', marginBottom: 20 },
  bmiCard: { flexDirection:'row', backgroundColor:C.surface, borderRadius:24, padding:20, borderWidth:1, borderColor:C.border, marginTop:15, elevation: 2 },
  bmiLeft: { flex:1, borderRightWidth:1, borderRightColor:C.borderLight },
  bmiTitle: { fontSize:10, fontWeight:'800', color:C.inkLight, textTransform:'uppercase' },
  bmiValue: { fontSize:32, fontWeight:'900', marginTop: 4 },
  bmiRight: { flex:1, paddingLeft:20, justifyContent: 'center' },
  idealLabel: { fontSize:10, fontWeight:'800', color:C.inkLight, textTransform:'uppercase' },
  idealValue: { fontSize:22, fontWeight:'900', color:C.ink, marginTop: 4 },
  calHero: { borderRadius:32, padding:32, marginBottom:20, alignItems:'center', backgroundColor:C.ink, overflow:'hidden', elevation: 10 },
  calHeroBg1: { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:C.primaryGlow, top:-60, right:-60 },
  calHeroBg2: { position:'absolute', width:120, height:120, borderRadius:60, backgroundColor:'rgba(29,185,84,0.07)', bottom:-40, left:10 },
  calHeroLabel: { fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:'700', textTransform:'uppercase', marginBottom:8 },
  calHeroNum: { fontSize:68, fontWeight:'900', color:'#FFF', letterSpacing: -1 },
  calHeroUnit: { fontSize:14, color:'rgba(255,255,255,0.6)', fontWeight:'700', marginTop: 5 },
  macroRow: { flexDirection:'row', gap:12, marginBottom:20 },
  summaryCard: { backgroundColor:C.surface, borderRadius:28, padding:18, borderWidth:1, borderColor:C.border, marginBottom:15 },
  bottomBar: { paddingHorizontal:24, paddingBottom:Platform.OS==='ios'?34:20, paddingTop:15, borderTopWidth:1, borderTopColor:C.borderLight, backgroundColor:C.surfaceAlt },
  nextBtn: { flexDirection:'row', justifyContent:'center', alignItems:'center', gap:10, paddingVertical:19, borderRadius:32, elevation: 4 },
  nextBtnTxt: { color:'#FFF', fontSize:18, fontWeight:'900' },
});

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Platform,
  StatusBar, Animated, Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import { useThemeStore } from '../store/useThemeStore';
import { getColors } from '../config/theme';
import {
  ArrowLeft, Droplet, Wheat,
  RefreshCcw, Utensils, Flame
} from 'lucide-react-native';

import { useDiaryStore } from '../store/useDiaryStore';
import { BrandAlert, BAlertState } from '../components/ui/BrandAlert';
import { MacroBarRow } from '../components/diary/MacroBarRow';
import { MealCard } from '../components/diary/MealCard';



const SectionHdr = ({ title, sub, sh }: { title:string; sub?:string; sh: any }) => (
  <View style={sh.w}>
    <View style={sh.bar}/>
    <View>
      <Text style={sh.title}>{title}</Text>
      {sub && <Text style={sh.sub}>{sub}</Text>}
    </View>
  </View>
);
const getShStyles = (C: any) => StyleSheet.create({
  w:     { flexDirection:'row', alignItems:'center', marginBottom:14, marginTop:2 },
  bar:   { width:4, height:26, backgroundColor:C.primary, borderRadius:3, marginRight:12 },
  title: { fontSize:20, fontWeight:'900', color:C.ink, letterSpacing:-0.4 },
  sub:   { fontSize:12, color:C.inkLight, fontWeight:'600', marginTop:2 },
});

export default function DiaryScreen() {
  const { themeId } = useThemeStore();
  const C = React.useMemo(() => getColors(themeId), [themeId]);
  const sh = React.useMemo(() => getShStyles(C), [C]);
  const D = React.useMemo(() => getDStyles(C), [C]);

  const router = useRouter();
  const { profile, intake, resetDay } = useDiaryStore();
  const [loading, setLoading] = useState(true);
  const [alertS,  setAlertS]  = useState<BAlertState>({ visible:false, type:'success', title:'', message:'' });

  const headerAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    setLoading(false);
    Animated.spring(headerAnim, { toValue:1, useNativeDriver:true, speed:12, bounciness:6, delay:100 }).start();
  }, [headerAnim]));

  const showAlert = (type: any, title:string, message:string, actions?: any[]) =>
    setAlertS({ visible:true, type, title, message, actions });

  const handleResetDay = () => {
    showAlert('warning','დღის განულება','დარწმუნებული ხარ? ეს წაშლის ყველა კალორიასა და კერძს.',[
      { label:'გაუქმება', onPress:()=>{} },
      { label:'განულება', onPress: () => {
        if (Platform.OS!=='web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        const today = new Date().toISOString().split('T')[0];
        resetDay(today);
        showAlert('success','განულდა','დღის მონაცემები წარმატებით გასუფთავდა.');
      }, primary:true },
    ]);
  };

  if (loading) return (
    <SafeAreaView style={D.center}>
      <View style={D.loadRing}><ActivityIndicator size="large" color={C.primary}/></View>
      <Text style={D.loadTxt}>ვტვირთავთ...</Text>
    </SafeAreaView>
  );

  const tCals = profile?.targetCalories || 2000;
  const tProt = profile?.macros?.protein || 100;
  const tCarb = profile?.macros?.carbs || 200;
  const tFat  = profile?.macros?.fats || 60;

  const todayStr = new Date().toISOString().split('T')[0];
  const dayIntake = intake[todayStr] || { calories: 0, protein: 0, carbs: 0, fats: 0, meals: [] };

  const calPct   = Math.min((dayIntake.calories/tCals)*100,100);
  const calsLeft = tCals - dayIntake.calories;
  const isOver   = calsLeft < 0;
  const todayRaw = new Date().toLocaleDateString('ka-GE',{ weekday:'long', day:'numeric', month:'long' });

  return (
    <SafeAreaView style={D.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surfaceAlt}/>

      {/* Header */}
      <View style={D.hdr}>
        <TouchableOpacity onPress={()=>router.back()} style={D.hdrBtn} activeOpacity={0.8}>
          <ArrowLeft size={22} color={C.ink}/>
        </TouchableOpacity>
        <View style={D.hdrCenter}>
          <Text style={D.hdrTitle}>დღიური რაციონი</Text>
          <Text style={D.hdrDate}>{todayRaw}</Text>
        </View>
        <TouchableOpacity onPress={handleResetDay} style={[D.hdrBtn,{ borderColor:C.dangerBg }]} activeOpacity={0.8}>
          <RefreshCcw size={18} color={C.danger}/>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={D.scroll}>

        {/* Hero calorie card */}
        <Animated.View style={[D.heroCard, {
          transform:[{ scale:headerAnim.interpolate({ inputRange:[0,1], outputRange:[0.95,1] }) }],
          opacity: headerAnim,
        }]}>
          <View style={D.heroDeco1}/><View style={D.heroDeco2}/>
          <View style={D.heroInner}>
            <View style={D.heroLeft}>
              <Text style={D.heroLabel}>მიღებული კალორია</Text>
              <Text style={[D.heroNum,{ color:isOver?C.danger:'#FFF' }]}>{Math.round(dayIntake.calories)}</Text>
              <View style={[D.heroPill,{ backgroundColor: isOver?C.danger+'30':'rgba(255,255,255,0.18)' }]}>
                <Text style={[D.heroPillTxt,{ color:isOver?C.danger:'rgba(255,255,255,0.9)' }]}>
                  {isOver ? `+${Math.abs(calsLeft)} კკალ გადაჭარბება` : `${calsLeft} კკალ დარჩა`}
                </Text>
              </View>
              <View style={D.heroBarBg}>
                <View style={[D.heroBarFill,{ width:`${calPct}%`, backgroundColor:isOver?C.danger:'#FFF' }]}/>
              </View>
              <Text style={D.heroTarget}>სამიზნე: {Math.round(tCals)} კკალ</Text>
            </View>

            <View style={{ alignItems:'center' }}>
              <View style={D.ringOuter}>
                <View style={[D.ringInner,{ borderColor: isOver ? C.danger : C.primary }]}>
                  <Text style={[D.ringPct,{ color:isOver?C.danger:'#FFF' }]}>{Math.round(calPct)}%</Text>
                </View>
              </View>
              <View style={D.mealCountBadge}>
                <Utensils size={11} color="rgba(255,255,255,0.7)"/>
                <Text style={D.mealCountTxt}>{dayIntake.meals.length} კერძი</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick stat chips */}
        <View style={D.chips}>
          {[
            { label:'ცილა',  val:Math.round(dayIntake.protein), unit:'გ', color:C.info,    bg:C.infoBg,    Icon:Droplet },
            { label:'ნახშ.', val:Math.round(dayIntake.carbs),   unit:'გ', color:C.warning, bg:C.warningBg, Icon:Wheat   },
            { label:'ცხიმი', val:Math.round(dayIntake.fats),    unit:'გ', color:C.danger,  bg:C.dangerBg,  Icon:Flame   },
          ].map((c,i)=>(
            <View key={i} style={[D.chip,{ backgroundColor:c.bg }]}>
              <View style={[D.chipIcon,{ backgroundColor:c.color+'20' }]}><c.Icon size={14} color={c.color}/></View>
              <Text style={[D.chipVal,{ color:c.color }]}>{c.val}<Text style={D.chipUnit}>{c.unit}</Text></Text>
              <Text style={D.chipLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* Macro breakdown */}
        <View style={D.section}>
          <SectionHdr sh={sh} title="მაკრო-ნუტრიენტები" sub="დღიური ნორმასთან შედარება"/>
          <MacroBarRow Icon={Droplet} label="ცილა (Protein)"       consumed={dayIntake.protein} target={tProt} color={C.info}    bg={C.infoBg}/>
          <MacroBarRow Icon={Wheat}   label="ნახშირწყალი (Carbs)"  consumed={dayIntake.carbs}   target={tCarb} color={C.warning} bg={C.warningBg}/>
          <MacroBarRow Icon={Flame}   label="ცხიმი (Fats)"         consumed={dayIntake.fats}    target={tFat}  color={C.danger}  bg={C.dangerBg}/>
        </View>

        {/* Meals list */}
        <View style={D.section}>
          <SectionHdr
            sh={sh}
            title="დღევანდელი მენიუ"
            sub={dayIntake.meals.length>0 ? `${dayIntake.meals.length} კერძი დღეს` : undefined}
          />
          {dayIntake.meals.length===0 ? (
            <View style={D.empty}>
              <View style={D.emptyIcon}><Utensils size={34} color={C.inkLight}/></View>
              <Text style={D.emptyTitle}>ჯერ არაფერი გიჭამია</Text>
              <Text style={D.emptySub}>გადადი რეცეპტებში და დააჭირე "მივირთვი"-ს</Text>
              <TouchableOpacity style={D.emptyBtn} onPress={()=>router.replace('/')} activeOpacity={0.88}>
                <Text style={D.emptyBtnTxt}>რეცეპტების დათვალიერება →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap:8 }}>
              {dayIntake.meals.map((meal:any, idx:number)=>(
                <MealCard
                  key={meal.id||idx} meal={meal} idx={idx}
                  onPress={()=>{ if(meal.recipe_id) router.push(`/details/${meal.recipe_id}`); }}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height:20 }}/>
      </ScrollView>

      <BrandAlert state={alertS} onClose={()=>setAlertS(a=>({ ...a, visible:false }))}/>
    </SafeAreaView>
  );
}

const getDStyles = (C: any) => StyleSheet.create({
  root:    { flex:1, backgroundColor:C.surfaceAlt },
  center:  { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:C.surfaceAlt },
  loadRing:{ width:64, height:64, borderRadius:32, backgroundColor:C.primaryGlow, justifyContent:'center', alignItems:'center', marginBottom:12 },
  loadTxt: { fontSize:15, color:C.inkLight, fontWeight:'700' },
  hdr:       { flexDirection:'row', alignItems:'center', paddingHorizontal:24, paddingTop:Platform.OS==='android'?(StatusBar.currentHeight||0)+10:14, paddingBottom:14 },
  hdrBtn:    { width:40, height:40, borderRadius:14, backgroundColor:'#FFF', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#E5E7EB', shadowColor:'#000', shadowOpacity:0.04, shadowRadius:5, elevation:2 },
  hdrCenter: { flex:1, alignItems:'center' },
  hdrTitle:  { fontSize:17, fontWeight:'900', color:C.ink, letterSpacing:-0.3 },
  hdrDate:   { fontSize:12, color:C.inkLight, fontWeight:'600', marginTop:1 },
  scroll: { paddingHorizontal:24, paddingBottom:32 },
  heroCard:  { backgroundColor:C.ink, borderRadius:26, padding:22, marginBottom:14, overflow:'hidden', shadowColor:C.ink, shadowOpacity:0.22, shadowRadius:20, elevation:10 },
  heroDeco1: { position:'absolute', width:200, height:200, borderRadius:100, backgroundColor:'rgba(29,185,84,0.09)', top:-60, right:-60 },
  heroDeco2: { position:'absolute', width:120, height:120, borderRadius:60, backgroundColor:'rgba(29,185,84,0.06)', bottom:-40, left:20 },
  heroInner: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  heroLeft:  { flex:1, paddingRight:16 },
  heroLabel: { fontSize:10, color:'rgba(255,255,255,0.6)', fontWeight:'700', marginBottom:4, letterSpacing:0.5, textTransform:'uppercase' },
  heroNum:   { fontSize:48, fontWeight:'900', color:'#FFF', letterSpacing:-2, lineHeight:52 },
  heroPill:  { alignSelf:'flex-start', paddingHorizontal:10, paddingVertical:5, borderRadius:100, marginTop:8, marginBottom:12 },
  heroPillTxt:{ fontSize:10, fontWeight:'800', letterSpacing:0.1 },
  heroBarBg: { height:5, backgroundColor:'rgba(255,255,255,0.15)', borderRadius:3, overflow:'hidden', marginBottom:7 },
  heroBarFill:{ height:'100%', borderRadius:3 },
  heroTarget:{ fontSize:10, color:'rgba(255,255,255,0.45)', fontWeight:'700' },
  ringOuter: { width:82, height:82, borderRadius:41, borderWidth:7, borderColor:'rgba(255,255,255,0.1)', justifyContent:'center', alignItems:'center' },
  ringInner: { width:82, height:82, borderRadius:41, borderWidth:7, justifyContent:'center', alignItems:'center', position:'absolute' },
  ringPct:   { fontSize:20, fontWeight:'900', letterSpacing:-0.5, lineHeight:22 },
  mealCountBadge:{ flexDirection:'row', alignItems:'center', gap:4, marginTop:9, backgroundColor:'rgba(255,255,255,0.1)', paddingHorizontal:9, paddingVertical:4, borderRadius:100 },
  mealCountTxt:{ fontSize:10, color:'rgba(255,255,255,0.7)', fontWeight:'700' },
  chips: { flexDirection:'row', gap:8, marginBottom:20 },
  chip:  { flex:1, borderRadius:20, padding:12, alignItems:'flex-start', borderWidth:1, borderColor:C.borderLight },
  chipIcon:{ width:28, height:28, borderRadius:9, justifyContent:'center', alignItems:'center', marginBottom:6 },
  chipVal: { fontSize:17, fontWeight:'900', letterSpacing:-0.3 },
  chipUnit:{ fontSize:12, fontWeight:'700' },
  chipLabel:{ fontSize:10, color:C.inkLight, fontWeight:'700', marginTop:2 },
  section: { marginBottom:22 },
  empty:       { backgroundColor:'#FFF', borderRadius:26, padding:32, alignItems:'center', borderWidth:1.5, borderColor:'#E5E7EB', borderStyle:'dashed' },
  emptyIcon:   { width:70, height:70, borderRadius:35, backgroundColor:C.surfaceAlt, justifyContent:'center', alignItems:'center', marginBottom:14 },
  emptyTitle:  { fontSize:17, fontWeight:'900', color:C.ink, marginBottom:6, textAlign:'center' },
  emptySub:    { fontSize:13, color:C.inkLight, textAlign:'center', lineHeight:20, marginBottom:20 },
  emptyBtn:    { backgroundColor:C.primary, paddingHorizontal:20, paddingVertical:12, borderRadius:100, shadowColor:C.primary, shadowOpacity:0.25, shadowRadius:10, elevation:4 },
  emptyBtnTxt: { color:'#FFF', fontWeight:'800', fontSize:13 },
});

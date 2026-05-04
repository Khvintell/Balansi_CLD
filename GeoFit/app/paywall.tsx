import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing
} from 'react-native-reanimated';
import {
  Crown, X, CheckCircle, Zap,
  Camera, BarChart3, Palette,
  Share2, ChevronRight, Star, ShieldCheck,
  Timer, Users, Award
} from 'lucide-react-native';
import { useDiaryStore } from '../store/useDiaryStore';
import { useThemeStore } from '../store/useThemeStore';
import { getColors } from '../config/theme';
import { BrandAlert, BAlertState } from '../components/ui/BrandAlert';

const { width: SW } = Dimensions.get('window');

const PRO_FEATURES = [
  { id: 'recipes', title: 'ექსკლუზიური რეცეპტები', desc: 'წვდომა პროტეინ ბომბებზე, სოუსებსა და წახემსებებზე.', icon: Crown, color: '#F59E0B' },
  { id: 'scanner', title: 'ულიმიტო AI სკანერი', desc: 'დაასკანერე ნებისმიერი კერძი ლიმიტების გარეშე.', icon: Camera, color: '#1DB954' },
  { id: 'bio', title: 'Health Data Sync', desc: 'ავტომატური სინქრონიზაცია Apple Health და Google Fit-თან.', icon: BarChart3, color: '#3B82F6' },
  { id: 'fridge', title: 'Smart Fridge Pro', desc: 'ულიმიტო რეცეპტების გენერაცია შენი მაცივრიდან.', icon: Zap, color: '#8B5CF6' },
  { id: 'themes', title: 'პრემიუმ თემები', desc: 'ექსკლუზიური Executive Gold და Obsidian დიზაინი.', icon: Palette, color: '#14B8A6' },
  { id: 'share', title: 'PRO შერინგი', desc: 'გააზიარე შენი პროგრესი პრემიუმ ვიზუალით.', icon: Share2, color: '#FF6B6B' }
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function PaywallScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { themeId } = useThemeStore();
  const C = getColors(themeId);
  const { setPremium } = useDiaryStore();
  const [selectedPlan, setSelectedPlan] = useState<string>('semi');
  const [brandAlert, setBrandAlert] = useState<BAlertState>({ visible: false, title: '', message: '', type: 'error' });

  // Animations
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(20);
  const cardsOpacity = useSharedValue(0);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.back(1.5)) });
    cardsOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));

    btnScale.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const onPurchase = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setBrandAlert({
      visible: true,
      type: 'info',
      title: 'მალე დაემატება 🚀',
      message: 'PRO ვერსიის ფუნქციები და ექსკლუზიური რეცეპტები სულ მალე იქნება ხელმისაწვდომი. დარჩით ჩვენთან!',
      actions: [{ label: 'გასაგებია', onPress: () => router.back() }]
    });
  };

  const scrollToPlans = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scrollRef.current?.scrollTo({ y: 880, animated: true });
  };

  const closePaywall = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }]
  }));

  const cardsStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
    transform: [{ translateY: (1 - cardsOpacity.value) * 30 }]
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }]
  }));

  return (
    <View style={pw.container}>
      <LinearGradient
        colors={['#0A2A22', '#041511', '#000000']}
        style={StyleSheet.absoluteFill}
      />

      <TouchableOpacity style={pw.closeBtn} onPress={closePaywall}>
        <X size={24} color="rgba(255,255,255,0.4)" />
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={pw.scroll}
        showsVerticalScrollIndicator={false}
      >

        <Animated.View style={[pw.header, headerStyle]}>
          <View style={pw.socialProofBadge}>
            <Users size={12} color="#1DB954" />
            <Text style={pw.socialProofTxt}>5,000+ მომხმარებელი • 4.9 ★</Text>
          </View>

          <Text style={pw.heroTitle}>გახდი შენი სხეულის{'\n'}არქიტექტორი 🏛️</Text>
          <Text style={pw.heroSub}>გახსენი Balansi-ს სრული პოტენციალი და მიაღწიე მიზანს 2-ჯერ უფრო სწრაფად.</Text>

          <View style={pw.urgencyBox}>
            <Timer size={14} color="#FBBF24" />
            <Text style={pw.urgencyTxt}>შეზღუდული შეთავაზება: -42% ფასდაკლება</Text>
          </View>

          <TouchableOpacity style={pw.headerCta} onPress={scrollToPlans}>
            <Text style={pw.headerCtaTxt}>გეგმის არჩევა</Text>
            <ChevronRight size={16} color="#F59E0B" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[pw.featureGrid, cardsStyle]}>
          {PRO_FEATURES.map((f) => (
            <View key={f.id} style={pw.featureCard}>
              <View style={[pw.featureIconWrap, { backgroundColor: f.color + '15' }]}>
                <f.icon size={22} color={f.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={pw.featureTitle}>{f.title}</Text>
                <Text style={pw.featureDesc}>{f.desc}</Text>
              </View>
              <CheckCircle size={16} color="rgba(255,255,255,0.1)" />
            </View>
          ))}
        </Animated.View>

        <View style={pw.trustRow}>
          <View style={pw.trustItem}>
            <ShieldCheck size={20} color="#1DB954" />
            <Text style={pw.trustText}>30-დღიანი გარანტია</Text>
          </View>
          <View style={pw.trustItem}>
            <Award size={20} color="#F59E0B" />
            <Text style={pw.trustText}>Editor's Choice</Text>
          </View>
        </View>

        <View style={pw.plansSection}>
          <Text style={pw.plansHeading}>შეარჩიე შენი გზა</Text>

          {/* Monthly */}
          <TouchableOpacity
            style={[pw.tierCard, selectedPlan === 'monthly' && pw.tierActive]}
            onPress={() => { Haptics.selectionAsync(); setSelectedPlan('monthly'); }}
          >
            <View style={pw.tierLeft}>
              <Text style={pw.tierTitle}>1 თვე</Text>
              <Text style={pw.tierSubtitle}>მოქნილი გეგმა</Text>
            </View>
            <View style={pw.tierRight}>
              <Text style={pw.priceAnchor}>₾ 14.99</Text>
              <Text style={pw.tierPrice}>₾ 9.99</Text>
              <Text style={pw.tierPeriod}>თვეში</Text>
            </View>
          </TouchableOpacity>

          {/* 6 Months - Popular */}
          <TouchableOpacity
            style={[pw.tierCard, selectedPlan === 'semi' && pw.tierActive]}
            onPress={() => { Haptics.selectionAsync(); setSelectedPlan('semi'); }}
          >
            <View style={pw.popularBadge}>
              <Text style={pw.popularBadgeTxt}>ყველაზე პოპულარული</Text>
            </View>
            <View style={pw.tierLeft}>
              <Text style={pw.tierTitle}>6 თვე</Text>
              <Text style={[pw.tierSubtitle, { color: '#FCD34D' }]}>დაზოგე 25% (₾ 7.50 / თვე)</Text>
            </View>
            <View style={pw.tierRight}>
              <Text style={pw.priceAnchor}>₾ 59.94</Text>
              <Text style={pw.tierPrice}>₾ 44.99</Text>
              <Text style={pw.tierPeriod}>სრული პერიოდი</Text>
            </View>
          </TouchableOpacity>

          {/* Yearly - Best Value */}
          <TouchableOpacity
            style={[pw.tierCard, selectedPlan === 'yearly' && pw.tierActive, { borderColor: '#F59E0B' }]}
            onPress={() => { Haptics.selectionAsync(); setSelectedPlan('yearly'); }}
          >
            <View style={[pw.popularBadge, { backgroundColor: '#1DB954' }]}>
              <Text style={pw.popularBadgeTxt}>საუკეთესო ფასი</Text>
            </View>
            <View style={pw.tierLeft}>
              <Text style={pw.tierTitle}>1 წელი</Text>
              <Text style={[pw.tierSubtitle, { color: '#10B981' }]}>დაზოგე 42% (₾ 5.83 / თვე)</Text>
            </View>
            <View style={pw.tierRight}>
              <Text style={pw.priceAnchor}>₾ 119.88</Text>
              <Text style={pw.tierPrice}>₾ 69.99</Text>
              <Text style={pw.tierPeriod}>წლიური აბონიმენტი</Text>
            </View>
          </TouchableOpacity>

          <Text style={pw.lossAversion}>არ დაკარგო 42%-იანი ფასდაკლება, რომელიც მხოლოდ დღეს არის ხელმისაწვდომი!</Text>
        </View>

        <View style={pw.ctaBox}>
          <AnimatedTouchableOpacity style={[pw.mainBtn, btnStyle]} onPress={onPurchase} activeOpacity={0.9}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={pw.mainBtnGradient}
            >
              <Text style={pw.mainBtnTxt}>გახდი PRO დღესვე 🚀</Text>
            </LinearGradient>
          </AnimatedTouchableOpacity>

          <View style={pw.securityRow}>
            <ShieldCheck size={14} color="rgba(255,255,255,0.4)" />
            <Text style={pw.securityTxt}>უსაფრთხო გადახდა • გაუქმება ნებისმიერ დროს</Text>
          </View>
        </View>

        <View style={pw.footerInfo}>
          <Text style={pw.footerTxt}>გამოწერის შემთხვევაში თქვენ ეთანხმებით მომსახურების პირობებს. 30-დღიანი money-back გარანტია მოქმედებს ყველა გეგმაზე.</Text>
        </View>

        <BrandAlert 
          state={brandAlert} 
          onClose={() => setBrandAlert({ ...brandAlert, visible: false })} 
        />

      </ScrollView>
    </View>
  );
}

const pw = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  closeBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 60 : 50, right: 24, zIndex: 100, padding: 8 },
  scroll: { paddingBottom: 60 },
  header: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 30, marginBottom: 32 },
  socialProofBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(29,185,84,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(29,185,84,0.2)' },
  socialProofTxt: { color: '#1DB954', fontSize: 11, fontWeight: '800' },
  heroTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 40, letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: '600', textAlign: 'center', marginTop: 14, lineHeight: 22 },
  urgencyBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  urgencyTxt: { color: '#FBBF24', fontSize: 12, fontWeight: '700' },
  headerCta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24, backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  headerCtaTxt: { color: '#F59E0B', fontSize: 14, fontWeight: '900' },
  featureGrid: { paddingHorizontal: 20, gap: 10, marginBottom: 32 },
  featureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', padding: 18, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 14 },
  featureIconWrap: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  featureTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  featureDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '500', lineHeight: 18 },
  trustRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 40 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trustText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' },
  plansSection: { paddingHorizontal: 20, gap: 14, marginBottom: 40 },
  plansHeading: { color: '#FFF', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', marginBottom: 10, opacity: 0.5 },
  tierCard: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', padding: 24, borderRadius: 28, borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)', position: 'relative' },
  tierActive: { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: '#F59E0B' },
  tierLeft: { flex: 1 },
  tierTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 2 },
  tierSubtitle: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  priceAnchor: { color: 'rgba(255,255,255,0.25)', fontSize: 13, fontWeight: '700', textDecorationLine: 'line-through', marginBottom: 2 },
  tierRight: { alignItems: 'flex-end' },
  tierPrice: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  tierPeriod: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', marginTop: 2 },
  popularBadge: { position: 'absolute', top: -14, right: 24, backgroundColor: '#F59E0B', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  popularBadgeTxt: { color: '#000', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  lossAversion: { color: 'rgba(239, 68, 68, 0.7)', fontSize: 11, textAlign: 'center', fontWeight: '700', marginTop: 4 },
  ctaBox: { paddingHorizontal: 24, alignItems: 'center' },
  mainBtn: { width: '100%', height: 68, borderRadius: 34, overflow: 'hidden', shadowColor: '#F59E0B', shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
  mainBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainBtnTxt: { color: '#000', fontSize: 19, fontWeight: '900' },
  securityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18 },
  securityTxt: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' },
  footerInfo: { marginTop: 30, paddingHorizontal: 40, alignItems: 'center' },
  footerTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 10, textAlign: 'center', lineHeight: 16, fontWeight: '500' },
});




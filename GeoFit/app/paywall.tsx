import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Crown, Leaf, X, CheckCircle2 } from 'lucide-react-native';
import { useDiaryStore } from '../store/useDiaryStore';

const DS = {
  emerald:     '#00C97F',
  proBg:       '#124B3E', 
  proBox:      '#0E3B30', 
  gold:        '#F59E0B',
  goldLight:   'rgba(245, 158, 11, 0.15)',
};

export default function PaywallScreen() {
  const router = useRouter();
  const { setPremium } = useDiaryStore();
  const [plan, setPlan] = useState<'monthly'|'yearly'>('yearly');

  const onPurchase = () => {
    // 🏦 RevenueCat Purchase Logic will go here!
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPremium(true);
    router.back();
  };

  const closePaywall = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={pw.container}>
      <TouchableOpacity style={pw.closeBtn} onPress={closePaywall}>
        <X size={26} color="#A7F3D0" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={pw.scroll} showsVerticalScrollIndicator={false}>
        <View style={pw.iconWrap}>
          <Crown size={38} color={DS.gold} />
        </View>
        
        <Text style={pw.title}>სრული კონტროლი კვებაზე 🔍</Text>
        
        <Text style={pw.mainText}>
          გახდი Balansi PRO კლუბის წევრი და დაივიწყე ლიმიტები. გახსენი ულიმიტო ფოტო-ანალიზი, შეფის პროფესიონალური ინსაიტები და MET-კალკულატორი.
        </Text>

        <View style={pw.ecosystemBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Leaf size={16} color={DS.emerald} style={{ marginRight: 6 }} />
            <Text style={pw.ecosystemTitle}>PRO პრივილეგიები</Text>
          </View>
          <Text style={pw.ecosystemText}>✦ ულიმიტო AI სკანირება ნებისმიერ დროს</Text>
          <Text style={pw.ecosystemText}>✦ ინდივიდუალური MET კალორიების კალკულატორი</Text>
          <Text style={pw.ecosystemText}>✦ შეფ-მზარეულის ექსკლუზიური რჩევები</Text>
        </View>

        <View style={pw.plansWrap}>
          <TouchableOpacity 
            style={[pw.planCard, plan === 'monthly' && pw.planCardActive]} 
            onPress={() => { Haptics.selectionAsync(); setPlan('monthly'); }}
            activeOpacity={0.8}
          >
            {plan === 'monthly' && <View style={pw.check}><CheckCircle2 size={18} color="#FFF" /></View>}
            <Text style={[pw.planTitle, plan==='monthly'&&{color:'#FFF'}]}>თვიური</Text>
            <Text style={[pw.planPrice, plan==='monthly'&&{color:'#FFF'}]}>₾ 14.99 <Text style={pw.planPeriod}>/თვე</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[pw.planCard, pw.planCardPopular, plan === 'yearly' && pw.planCardActive]} 
            onPress={() => { Haptics.selectionAsync(); setPlan('yearly'); }}
            activeOpacity={0.8}
          >
            <View style={pw.badge}><Text style={pw.badgeTxt}>50% დაზოგე</Text></View>
            {plan === 'yearly' && <View style={pw.check}><CheckCircle2 size={18} color="#FFF" /></View>}
            <Text style={[pw.planTitle, plan==='yearly'&&{color:'#FFF'}]}>წლიური</Text>
            <Text style={[pw.planPrice, plan==='yearly'&&{color:'#FFF'}]}>₾ 89.99 <Text style={pw.planPeriod}>/წელი</Text></Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={pw.buyBtn} onPress={onPurchase} activeOpacity={0.85}>
          <Text style={pw.buyBtnTxt}>გამოწერის გააქტიურება 🚀</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => {/* RevenueCat restore() */}} style={pw.restoreWrap}>
          <Text style={pw.restoreTxt}>შენაძენის აღდგენა</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const pw = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.proBg },
  closeBtn: { position: 'absolute', top: Platform.OS==='android'? 55: 65, left: 24, zIndex: 10, width:40, height:40, borderRadius:20, backgroundColor:'rgba(255,255,255,0.1)', justifyContent:'center', alignItems:'center' },
  scroll: { paddingHorizontal: 24, paddingTop: 110, paddingBottom: 50, alignItems:'center' },
  iconWrap: { width: 78, height: 78, borderRadius: 39, backgroundColor: DS.goldLight, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 2, borderColor: 'rgba(245, 158, 11, 0.4)' },
  title: { color: '#FFF', fontSize: 26, fontWeight: '900', marginBottom: 16, textAlign: 'center' },
  mainText: { color: '#D1FAE5', fontSize: 15, fontWeight: '500', textAlign: 'center', lineHeight: 24, marginBottom: 28, paddingHorizontal:10 },
  ecosystemBox: { width: '100%', backgroundColor: DS.proBox, padding: 22, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', marginBottom: 30 },
  ecosystemTitle: { color: DS.emerald, fontSize: 15, fontWeight: '800', textTransform: 'uppercase' },
  ecosystemText: { color: '#A7F3D0', fontSize: 13, fontWeight: '600', lineHeight: 24, marginBottom: 4 },
  plansWrap: { width: '100%', gap: 14, marginBottom: 36 },
  planCard: { width: '100%', padding: 22, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', position: 'relative' },
  planCardActive: { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: DS.gold },
  planCardPopular: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  badge: { position: 'absolute', top: -14, right: 20, backgroundColor: DS.gold, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeTxt: { color: '#000', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  check: { position: 'absolute', top: 22, right: 20 },
  planTitle: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  planPrice: { fontSize: 26, fontWeight: '900', color: 'rgba(255,255,255,0.7)' },
  planPeriod: { fontSize: 15, fontWeight: '600' },
  buyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: DS.gold, width: '100%', paddingVertical: 20, borderRadius: 100, marginBottom: 24, shadowColor: DS.gold, shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
  buyBtnTxt: { color: '#000', fontSize: 17, fontWeight: '900' },
  restoreWrap: { padding: 10 },
  restoreTxt: { color: '#A7F3D0', fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' }
});

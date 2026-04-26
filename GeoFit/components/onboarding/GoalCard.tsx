import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';

const gc = StyleSheet.create({
  card: { flexDirection:'row', alignItems:'center', padding:18, borderRadius:24, borderWidth:2, marginBottom:12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 15 },
  iconBox: { width:52, height:52, borderRadius:16, alignItems:'center', justifyContent:'center', marginRight:14 },
  label: { fontSize:17, fontWeight:'900', marginBottom:3 },
  desc: { fontSize:12, color:'#6B7280', fontWeight:'600' },
});

export const GoalCard = ({ icon:Icon, label, desc, color, bg, selected, onPress }: any) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[
    gc.card, { borderColor: selected ? color : '#E5E7EB', backgroundColor: selected ? bg : '#FFFFFF', borderWidth: selected ? 2.5 : 1.5 }
  ]}>
    <View style={[gc.iconBox, { backgroundColor: selected ? color : '#F1F5F9' }]}>
      <Icon size={24} color={selected ? '#FFF' : '#6B7280'} />
    </View>
    <View style={{flex:1}}>
      <Text style={[gc.label, { color: selected ? color : '#0D1117' }]}>{label}</Text>
      <Text style={gc.desc}>{desc}</Text>
    </View>
    {selected && <CheckCircle size={22} color={color} fill="#FFF" />}
  </TouchableOpacity>
);

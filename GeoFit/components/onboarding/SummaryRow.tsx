import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const sr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  emoji: { fontSize: 18 },
  textWrap: { flex: 1 },
  label: { fontSize: 14, color: '#0D1117', fontWeight: '800' },
  desc: { fontSize: 10, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  value: { fontSize: 15, fontWeight: '900', color: '#0D1117' },
});

export const SummaryRow = ({ label, value, emoji, desc, noBorder }: any) => (
  <View style={[sr.row, noBorder && { borderBottomWidth: 0 }]}>
    <View style={sr.iconBox}><Text style={sr.emoji}>{emoji}</Text></View>
    <View style={sr.textWrap}><Text style={sr.label}>{label}</Text>{Boolean(desc) && <Text style={sr.desc}>{desc}</Text>}</View>
    <Text style={sr.value}>{value}</Text>
  </View>
);

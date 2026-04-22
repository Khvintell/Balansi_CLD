import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const fi = StyleSheet.create({
  label: { fontSize:10, fontWeight:'800', color:'#374151', letterSpacing:0.5, textTransform:'uppercase', marginBottom:8, marginLeft:4 },
  wrap: { flexDirection:'row', alignItems:'center', borderRadius:28, borderWidth:2, paddingHorizontal:14, height:62, overflow:'hidden', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10 },
  input: { flex:1, fontSize:17, color:'#0D1117', fontWeight:'800' },
  unitWrap: { marginLeft:4, paddingHorizontal:10, paddingVertical:5, backgroundColor:'#F1F5F9', borderRadius:10 },
  unit: { fontSize:12, fontWeight:'800', color:'#374151' },
});

export const FloatingInput = ({ label, placeholder, value, onChangeText, keyboardType, unit, icon: Icon, color, autoFocus }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View style={{ marginBottom: 18 }}>
      {Boolean(label) && <Text style={fi.label}>{label}</Text>}
      <View style={[fi.wrap, { borderColor: isFocused ? color : '#E5E7EB', backgroundColor: isFocused ? '#FFFFFF' : '#F8FAFC' }]}>
        {Boolean(Icon) && <Icon size={18} color={isFocused ? color : '#9CA3AF'} style={{marginRight: 10}} />}
        <TextInput
          style={fi.input} placeholder={placeholder} placeholderTextColor="#9CA3AF"
          value={value} onChangeText={onChangeText} keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
          autoFocus={autoFocus}
        />
        {Boolean(unit) && <View style={fi.unitWrap}><Text style={[fi.unit, isFocused && { color }]}>{unit}</Text></View>}
      </View>
    </View>
  );
};

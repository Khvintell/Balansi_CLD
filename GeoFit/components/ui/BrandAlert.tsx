import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet } , Platform } from 'react-native';

const C = {
  success:     '#10B981',
  successBg:   '#ECFDF5',
  danger:      '#EF4444',
  dangerBg:    '#FEF2F2',
  warning:     '#F59E0B',
  warningBg:   '#FFFBEB',
  info:        '#3B82F6',
  infoBg:      '#EFF6FF',
  surface:     '#FFFFFF',
  surfaceMid:  '#F1F5F9',
  ink:         '#0D1117',
  inkMid:      '#374151',
  inkLight:    '#6B7280',
};

export type AlertType = 'success' | 'error' | 'warning' | 'info';
export interface AlertAction { label: string; onPress: () => void; primary?: boolean; }
export interface BAlertState { visible: boolean; type: AlertType; title: string; message: string; actions?: AlertAction[]; }

interface BrandAlertProps {
  state: BAlertState;
  onClose: () => void;
}

export const BrandAlert: React.FC<BrandAlertProps> = ({ state, onClose }) => {
  const sc = useRef(new Animated.Value(0.82)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state.visible) {
      Animated.parallel([
        Animated.spring(sc, { toValue: 1, useNativeDriver: Platform.OS !== 'web', speed: 26, bounciness: 11 }),
        Animated.timing(op, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    } else {
      sc.setValue(0.82);
      op.setValue(0);
    }
  }, [state.visible, sc, op]);

  const map: Record<AlertType,{color:string;bg:string;emoji:string}> = {
    success:{ color:C.success, bg:C.successBg, emoji:'🎉' },
    error:  { color:C.danger,  bg:C.dangerBg,  emoji:'😕' },
    warning:{ color:C.warning, bg:C.warningBg, emoji:'⚠️' },
    info:   { color:C.info,    bg:C.infoBg,    emoji:'ℹ️' },
  };
  const { color, bg, emoji } = map[state.type] || map.info;

  return (
    <Modal visible={state.visible} transparent animationType="none" statusBarTranslucent>
      <View style={ba.overlay}>
        <Animated.View style={[ba.sheet,{ transform:[{ scale:sc }], opacity:op }]}>
          <View style={[ba.circle,{ backgroundColor:bg }]}><Text style={{ fontSize:32 }}>{emoji}</Text></View>
          <Text style={ba.title}>{state.title}</Text>
          <Text style={ba.msg}>{state.message}</Text>
          <View style={ba.row}>
            {state.actions ? state.actions.map((a,i)=>(
              <TouchableOpacity key={i} style={[ba.btn, a.primary?{ backgroundColor:color }:ba.ghost]} onPress={()=>{ onClose(); a.onPress(); }} activeOpacity={0.85}>
                <Text style={[ba.btnT, !a.primary&&{ color:C.inkMid }]}>{a.label}</Text>
              </TouchableOpacity>
            )) : (
              <TouchableOpacity style={[ba.btn,{ backgroundColor:color }]} onPress={onClose} activeOpacity={0.85}>
                <Text style={ba.btnT}>გასაგებია</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const ba = StyleSheet.create({
  overlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.52)', justifyContent:'center', alignItems:'center', paddingHorizontal:24 },
  sheet:  { width:'100%', backgroundColor:C.surface, borderRadius:28, padding:24, alignItems:'center', shadowColor:'#000', shadowOpacity:0.2, shadowRadius:30, elevation:22 },
  circle: { width:74, height:74, borderRadius:37, justifyContent:'center', alignItems:'center', marginBottom:14 },
  title:  { fontSize:20, fontWeight:'900', color:C.ink, marginBottom:6, textAlign:'center', letterSpacing:-0.4 },
  msg:    { fontSize:15, color:C.inkLight, textAlign:'center', lineHeight:21, fontWeight:'500', marginBottom:20 },
  row:    { flexDirection:'row', gap:9, width:'100%' },
  btn:    { flex:1, paddingVertical:13, borderRadius:16, alignItems:'center' },
  ghost:  { flex:1, paddingVertical:13, borderRadius:16, alignItems:'center', backgroundColor:C.surfaceMid },
  btnT:   { color:'#FFF', fontWeight:'800', fontSize:15 },
});

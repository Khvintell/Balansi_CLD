import React, { useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Modal, 
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, StyleSheet, Pressable
} from 'react-native';
import { 
  Scale as ScaleIcon, Camera as CameraIcon, 
  Image as ImageIconLucide, Zap
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface WeightVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  newWeight: string;
  setNewWeight: (v: string) => void;
  isVerifying: boolean;
  onCameraPress: () => void;
  onGalleryPress: () => void;
  onManualSave: () => void;
  C: any;
  S: any;
}

export const WeightVerificationModal = ({
  visible, onClose,
  newWeight, setNewWeight, isVerifying,
  onCameraPress, onGalleryPress, onManualSave,
  C, S
}: WeightVerificationModalProps) => {

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: Platform.OS !== 'web' })
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    if (!isVerifying) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={localStyles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <Animated.View style={[
          localStyles.centeredSheet, 
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim, backgroundColor: C.surface }
        ]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            
            {isVerifying ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={[localStyles.title, { marginTop: 24, color: C.ink }]}>AI ამოწმებს... 🕵️</Text>
                <Text style={localStyles.sub}>ფოტოს ვამუშავებთ და ვაანალიზებთ</Text>
              </View>
            ) : (
              <>
                <View style={[localStyles.iconCircle, { backgroundColor: C.surfaceMid }]}>
                  <ScaleIcon size={32} color={C.primaryDark} />
                </View>
                <Text style={[localStyles.title, { color: C.ink }]}>მოდი, ავიწონოთ! 💪</Text>
                <Text style={localStyles.sub}>რამდენს უჩვენებს დღეს სასწორი?</Text>
                
                <View style={localStyles.inputRow}>
                  <TextInput
                    style={[localStyles.input, { color: C.ink }]}
                    keyboardType="decimal-pad"
                    value={newWeight}
                    onChangeText={setNewWeight}
                    autoFocus
                    placeholder="00.0"
                    placeholderTextColor={C.inkFaint}
                    maxLength={5}
                  />
                  <Text style={[localStyles.unit, { color: C.inkLight }]}>კგ</Text>
                </View>

                <View style={localStyles.btnStack}>
                  <TouchableOpacity 
                    style={[localStyles.solidBtn, { backgroundColor: C.primary, shadowColor: C.primary }]} 
                    onPress={onCameraPress}
                    activeOpacity={0.8}
                  >
                    <View style={localStyles.btnIconRow}>
                      <CameraIcon size={20} color="#FFF" />
                      <Text style={localStyles.solidBtnTxt}>AI კამერა</Text>
                    </View>
                    <View style={localStyles.xpBadge}>
                      <Zap size={12} color={C.primaryDark} fill={C.primaryDark} />
                      <Text style={[localStyles.xpBadgeTxt, { color: C.primaryDark }]}>+50 XP</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[localStyles.outlinedBtn, { borderColor: C.primaryLight, backgroundColor: C.surfaceMid }]} 
                    onPress={onGalleryPress}
                    activeOpacity={0.7}
                  >
                    <View style={localStyles.btnIconRow}>
                      <ImageIconLucide size={18} color={C.primary} />
                      <Text style={[localStyles.outlinedBtnTxt, { color: C.primaryDark }]}>გალერეიდან ატვირთვა</Text>
                    </View>
                    <Text style={[localStyles.xpBadgeTxtSmall, { color: C.primary }]}>+50 XP</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={localStyles.ghostBtn} onPress={onManualSave} activeOpacity={0.6}>
                    <Text style={[localStyles.ghostBtnTxt, { color: C.inkLight }]}>უბრალოდ შენახვა (+10 XP)</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centeredSheet: {
    width: '100%',
    borderRadius: 36,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 15,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 15,
    textAlign: 'center',
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  input: {
    fontSize: 64,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -2,
    height: 80,
    minWidth: 140,
  },
  unit: {
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 4,
    marginTop: 15,
  },
  btnStack: {
    gap: 12,
  },
  btnIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  solidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  solidBtnTxt: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  xpBadgeTxt: {
    fontSize: 13,
    fontWeight: '900',
  },
  outlinedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
  },
  outlinedBtnTxt: {
    fontSize: 15,
    fontWeight: '800',
  },
  xpBadgeTxtSmall: {
    fontSize: 13,
    fontWeight: '800',
  },
  ghostBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 4,
  },
  ghostBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
  },
});

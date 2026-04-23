import React, { useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Modal, 
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, StyleSheet, Pressable
} from 'react-native';
import { 
  LucideIcon, Scale as ScaleIcon, Scan as ScanIcon, 
  ScanFace as ScanFaceIcon, Camera as CameraIcon, 
  Image as ImageIconLucide 
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface WeightVerificationModalProps {
  showWeightModal: boolean;
  setShowWeightModal: (v: boolean) => void;
  showVerifyModal: boolean;
  setShowVerifyModal: (v: boolean) => void;
  newWeight: string;
  setNewWeight: (v: string) => void;
  isVerifying: boolean;
  onContinue: () => void;
  onCameraPress: () => void;
  onGalleryPress: () => void;
  onManualSave: () => void;
  C: any;
  S: any;
}

export const WeightVerificationModal = ({
  showWeightModal, setShowWeightModal,
  showVerifyModal, setShowVerifyModal,
  newWeight, setNewWeight, isVerifying,
  onContinue, onCameraPress, onGalleryPress, onManualSave,
  C, S
}: WeightVerificationModalProps) => {

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showWeightModal || showVerifyModal) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: Platform.OS !== 'web' })
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [showWeightModal, showVerifyModal]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowWeightModal(false);
    setShowVerifyModal(false);
    setNewWeight('');
  };

  return (
    <>
      {/* ⚖️ WEIGHT INPUT MODAL */}
      <Modal visible={showWeightModal} transparent animationType="fade">
        <View style={localStyles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          <Animated.View style={[
            localStyles.centeredSheet, 
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim, backgroundColor: C.surface }
          ]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={localStyles.iconCircle}>
                <ScaleIcon size={32} color={C.primaryDark} />
              </View>
              <Text style={localStyles.title}>მოდი, ავიწონოთ! 💪</Text>
              <Text style={localStyles.sub}>რამდენს უჩვენებს დღეს სასწორი?</Text>
              
              <TextInput
                style={[localStyles.input, { color: C.ink, borderColor: C.border }]}
                keyboardType="decimal-pad"
                value={newWeight}
                onChangeText={setNewWeight}
                autoFocus
                placeholder="00.0"
                placeholderTextColor={C.inkFaint}
              />

              <View style={localStyles.btnRow}>
                <TouchableOpacity style={localStyles.ghostBtn} onPress={handleClose}>
                  <Text style={[localStyles.ghostBtnTxt, { color: C.inkMid }]}>მოგვიანებით</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[localStyles.solidBtn, { backgroundColor: C.primary }]} onPress={onContinue}>
                  <Text style={localStyles.solidBtnTxt}>განვაგრძოთ! 🚀</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>

      {/* 🕵️ VERIFICATION MODAL */}
      <Modal visible={showVerifyModal} transparent animationType="fade">
        <View style={localStyles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowVerifyModal(false)} />
          <Animated.View style={[
            localStyles.centeredSheet, 
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim, backgroundColor: C.surface }
          ]}>
             {isVerifying ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={[localStyles.title, { marginTop: 24 }]}>AI ამოწმებს... 🕵️</Text>
                <Text style={localStyles.sub}>სასწორის ფოტოს ვამუშავებთ</Text>
              </View>
            ) : (
              <View>
                <View style={[localStyles.iconCircle, { backgroundColor: C.primaryLight }]}>
                  <ScanFaceIcon size={38} color={C.primaryDark} />
                </View>
                <Text style={localStyles.title}>ვერიფიკაცია 🧐</Text>
                <Text style={localStyles.sub}>გვიჩვენე, რომ {newWeight} კგ ხარ — გადაიღე სასწორის ფოტო</Text>
                
                <View style={localStyles.btnRow}>
                  <TouchableOpacity style={[localStyles.solidBtn, { backgroundColor: C.primary, flex: 1 }]} onPress={onCameraPress}>
                    <CameraIcon size={18} color="#FFF" />
                    <Text style={localStyles.solidBtnTxt}>კამერა</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[localStyles.ghostBtn, { flex: 1 }]} onPress={onGalleryPress}>
                    <ImageIconLucide size={18} color={C.inkMid} />
                    <Text style={[localStyles.ghostBtnTxt, { color: C.inkMid }]}>გალერეა</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={localStyles.manualAction} 
                  onPress={onManualSave}
                >
                  <Text style={{ color: C.orange, fontWeight: '800', fontSize: 13, textAlign: 'center' }}>
                    ხელით შენახვა (ვერიფიკაციის გარეშე)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centeredSheet: {
    width: '100%',
    borderRadius: 32,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 14,
    textAlign: 'center',
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  input: {
    width: '100%',
    height: 80,
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: -1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  solidBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 18,
  },
  solidBtnTxt: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
  },
  ghostBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  ghostBtnTxt: {
    fontSize: 15,
    fontWeight: '800',
  },
  manualAction: {
    marginTop: 20,
    paddingVertical: 10,
  }
});

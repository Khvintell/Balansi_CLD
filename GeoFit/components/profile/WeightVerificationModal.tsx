import React from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Modal, 
  KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { 
  Scale, Scan, ScanFace, Camera, 
  Image as ImageIcon, XCircle 
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
  showWeightModal,
  setShowWeightModal,
  showVerifyModal,
  setShowVerifyModal,
  newWeight,
  setNewWeight,
  isVerifying,
  onContinue,
  onCameraPress,
  onGalleryPress,
  onManualSave,
  C,
  S
}: WeightVerificationModalProps) => {
  return (
    <>
      <Modal visible={showWeightModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={S.modalOverlay}>
          <View style={S.modalSheet}>
            <View style={S.modalSheetHandle} />
            <View style={S.modalSheetIconWrap}><Scale size={30} color={C.primaryDark} /></View>
            <Text style={S.modalSheetTitle}>ახალი ჩაწერა</Text>
            <Text style={S.modalSheetSub}>შეიყვანე შენი ამჟამინდელი წონა კილოგრამებში</Text>
            <TextInput
              style={S.modalWeightInput}
              keyboardType="decimal-pad"
              value={newWeight}
              onChangeText={setNewWeight}
              autoFocus
              placeholder="00.0"
              placeholderTextColor={C.inkFaint}
            />
            <View style={S.modalBtnRow}>
              <TouchableOpacity style={S.modalGhostBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowWeightModal(false); setNewWeight(''); }}>
                <Text style={S.modalGhostBtnTxt}>გაუქმება</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.modalSolidBtn} onPress={onContinue}>
                <Text style={S.modalSolidBtnTxt}>განაგრძე →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showVerifyModal} transparent animationType="slide">
        <View style={S.modalOverlay}>
          <View style={[S.modalSheet, { paddingVertical: isVerifying ? 48 : 32 }]}>
            <View style={S.modalSheetHandle} />
            {isVerifying ? (
              <View style={{ alignItems: 'center' }}>
                <View style={[S.modalSheetIconWrap, { backgroundColor: C.primaryLight }]}>
                  <Scan size={44} color={C.primaryDark} />
                </View>
                <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 20 }} />
                <Text style={[S.modalSheetTitle, { marginTop: 20 }]}>AI ამოწმებს... 🕵️</Text>
                <Text style={S.modalSheetSub}>სასწორის ფოტოს ვამოწმებთ</Text>
              </View>
            ) : (
              <>
                <View style={[S.modalSheetIconWrap, { backgroundColor: C.primaryLight }]}>
                  <ScanFace size={44} color={C.primaryDark} />
                </View>
                <Text style={S.modalSheetTitle}>დაამტკიცე! 🧐</Text>
                <Text style={S.modalSheetSub}>გვიჩვენე, რომ {newWeight} კგ ხარ — გადაიღე სასწორის ფოტო</Text>
                <View style={S.modalBtnRow}>
                  <TouchableOpacity style={S.modalSolidBtn} onPress={onCameraPress}>
                    <Camera size={16} color="#FFF" />
                    <Text style={S.modalSolidBtnTxt}>კამერა</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={S.modalGhostBtn} onPress={onGalleryPress}>
                    <ImageIcon size={16} color={C.inkMid} />
                    <Text style={S.modalGhostBtnTxt}>გალერეა</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={{ marginTop: 20 }} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowVerifyModal(false); }}>
                  <Text style={{ color: C.inkLight, fontWeight: '700', fontSize: 15 }}>გაუქმება</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 14 }} onPress={onManualSave}>
                  <Text style={{ color: C.orange, fontWeight: '700', fontSize: 13 }}>ხელით შენახვა (ვერიფიკაციის გარეშე)</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

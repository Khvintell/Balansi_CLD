import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withDelay,
  Easing
} from 'react-native-reanimated';
import { Zap, Activity, Info, X } from 'lucide-react-native';
import { useBioStore } from '../store/useBioStore';

const { height, width } = Dimensions.get('window');

interface Props {
  isVisible: boolean;
  onClose: () => void;
}

export const BioSyncModal: React.FC<Props> = ({ isVisible, onClose }) => {
  const { aiStatus } = useBioStore();
  
  // Animations
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible && aiStatus?.requires_alert) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 90 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(height, { duration: 300, easing: Easing.in(Easing.ease) });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [isVisible, aiStatus]);

  const animatedSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const animatedBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  if (!aiStatus) return null; // Avoid rendering if no status

  return (
    <Modal
      transparent
      visible={isVisible && aiStatus.requires_alert}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />
        
        <Animated.View style={[styles.sheet, animatedSheetStyle]}>
          <View style={styles.sheetHandle} />
          
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Activity color="#34d399" size={28} />
            </View>
            <Text style={styles.title}>დილის ბიო-შეჯამება</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#6b7280" size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.aiMessageContainer}>
            <Zap color="#fbbf24" size={20} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={styles.aiMessageText}>
              {aiStatus.message}
            </Text>
          </View>

          <View style={styles.macroCard}>
            <Text style={styles.macroCardTitle}>დღევანდელი ახალი ნორმა</Text>
            <Text style={styles.macroCalories}>{Math.round(aiStatus.target_calories)} <Text style={styles.unit}>კკალ</Text></Text>
            
            <View style={styles.macrosRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>ცილა</Text>
                <Text style={styles.macroValue}>{Math.round(aiStatus.adjusted_macros.protein)}გ</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>ნახშირწყალი</Text>
                <Text style={styles.macroValue}>{Math.round(aiStatus.adjusted_macros.carbs)}გ</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>ცხიმი</Text>
                <Text style={styles.macroValue}>{Math.round(aiStatus.adjusted_macros.fats)}გ</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
            <Text style={styles.confirmButtonText}>მიღება და დიეტის ადაპტაცია</Text>
          </TouchableOpacity>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Also exporting a small inline chip to be used in dashboards when requires_alert == false
export const BioStatusChip: React.FC = () => {
  const { aiStatus } = useBioStore();

  if (!aiStatus || aiStatus.requires_alert) return null;

  return (
    <View style={styles.chipContainer}>
      <Zap color="#10b981" size={16} />
      <Text style={styles.chipText}>⚡ ბიო-სტატუსი იდეალურია. მივყვებით გეგმას.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#111827', // deep dark premium aesthetic
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    minHeight: height * 0.45,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#374151',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontFamily: 'NotoSansGeorgian-SemiBold', // Fallback to normal if font is missing
    fontWeight: '600',
    fontSize: 22,
    color: '#ffffff',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#1f2937',
    borderRadius: 20,
  },
  aiMessageContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  aiMessageText: {
    flex: 1,
    color: '#fef3c7',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  macroCard: {
    backgroundColor: '#1f2937',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  macroCardTitle: {
    color: '#9ca3af',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  macroCalories: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
  },
  unit: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '400',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    backgroundColor: '#374151',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  macroLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  macroValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#34d399',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#064e3b',
    fontSize: 16,
    fontWeight: '700',
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  chipText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  }
});

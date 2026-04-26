import React, { useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, Modal, TouchableOpacity,
  Animated, Dimensions, Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Activity, Zap, Info } from 'lucide-react-native';
import { useBiometricsStore } from '../store/useBiometricsStore';

const { height: SH } = Dimensions.get('window');

interface MorningBriefModalProps {
  visible: boolean;
  onClose: () => void;
}

export const MorningBriefModal = ({ visible, onClose }: MorningBriefModalProps) => {
  const { biometricStatus } = useBiometricsStore();
  const slideAnim = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SH,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }
  }, [visible]);

  if (!biometricStatus) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
          
          <View style={styles.content}>
            <View style={styles.handle} />
            
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={styles.iconBg}>
                  <Zap size={24} color="#FFD700" />
                </View>
                <Text style={styles.title}>დილის რეპორტი ☀️</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{biometricStatus.message}</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>განახლებული ლიმიტი</Text>
                <Text style={styles.statValue}>{biometricStatus.targetCalories} კკალ</Text>
              </View>
              
              <View style={styles.macrosRow}>
                <View style={styles.macroStat}>
                  <Text style={styles.macroLabel}>ცილა</Text>
                  <Text style={styles.macroVal}>{biometricStatus.adjustedMacros.protein}გ</Text>
                </View>
                <View style={styles.macroStat}>
                  <Text style={styles.macroLabel}>ნახშირწყალი</Text>
                  <Text style={styles.macroVal}>{biometricStatus.adjustedMacros.carbs}გ</Text>
                </View>
                <View style={styles.macroStat}>
                  <Text style={styles.macroLabel}>ცხიმი</Text>
                  <Text style={styles.macroVal}>{biometricStatus.adjustedMacros.fats}გ</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.confirmBtn} 
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text style={styles.confirmText}>გასაგებია, მადლობა!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  content: {
    padding: 24,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  messageBox: {
    backgroundColor: '#F8FAFC',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  messageText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statItem: {
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#10B981',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  macroStat: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    marginBottom: 4,
  },
  macroVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  confirmBtn: {
    backgroundColor: '#10B981',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  confirmText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },
});

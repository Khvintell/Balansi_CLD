import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet, Platform, BlurView } from 'react-native';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react-native';

const C = {
  success: '#10B981',
  successGlow: 'rgba(16, 185, 129, 0.1)',
  danger: '#EF4444',
  dangerGlow: 'rgba(239, 68, 68, 0.1)',
  warning: '#F59E0B',
  warningGlow: 'rgba(245, 158, 11, 0.1)',
  info: '#3B82F6',
  infoGlow: 'rgba(59, 130, 246, 0.1)',
  surface: '#FFFFFF',
  surfaceMid: '#F8FAFC',
  ink: '#0F172A',
  inkMid: '#475569',
  inkLight: '#94A3B8',
};

export type AlertType = 'success' | 'error' | 'warning' | 'info';
export interface AlertAction { label: string; onPress: () => void; primary?: boolean; danger?: boolean; }
export interface BAlertState { visible: boolean; type: AlertType; title: string; message: string; actions?: AlertAction[]; }

interface BrandAlertProps {
  state: BAlertState;
  onClose: () => void;
}

export const BrandAlert: React.FC<BrandAlertProps> = ({ state, onClose }) => {
  const sc = useRef(new Animated.Value(0.9)).current;
  const op = useRef(new Animated.Value(0)).current;

  // Guard against undefined state
  const safeState = state || { visible: false, type: 'info' as AlertType, title: '', message: '' };

  useEffect(() => {
    if (safeState.visible) {
      Animated.parallel([
        Animated.spring(sc, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
        Animated.timing(op, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      sc.setValue(0.9);
      op.setValue(0);
    }
  }, [safeState.visible]);

  const config = {
    success: { color: C.success, glow: C.successGlow, Icon: CheckCircle2 },
    error: { color: C.danger, glow: C.dangerGlow, Icon: AlertCircle },
    warning: { color: C.warning, glow: C.warningGlow, Icon: AlertTriangle },
    info: { color: C.info, glow: C.infoGlow, Icon: Info },
  };

  const { color, glow, Icon } = config[safeState.type] || config.info;

  if (!safeState.visible) return null;

  return (
    <Modal visible={safeState.visible} transparent animationType="none" statusBarTranslucent>
      <View style={ba.overlay}>
        <Animated.View style={[ba.sheet, { transform: [{ scale: sc }], opacity: op }]}>
          {/* Header Icon */}
          <View style={[ba.iconOuter, { backgroundColor: glow }]}>
            <View style={[ba.iconInner, { backgroundColor: color }]}>
              <Icon size={32} color="#FFF" strokeWidth={2.5} />
            </View>
          </View>

          {/* Text Content */}
          <View style={ba.content}>
            <Text style={ba.title}>{safeState.title}</Text>
            <Text style={ba.msg}>{safeState.message}</Text>
          </View>

          {/* Actions */}
          <View style={ba.footer}>
            {safeState.actions && safeState.actions.length > 0 ? (
              <View style={ba.actionRow}>
                {safeState.actions.map((a, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      ba.btn,
                      a.primary ? { backgroundColor: a.danger ? C.danger : color } : ba.btnGhost
                    ]}
                    onPress={() => { onClose(); a.onPress(); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[ba.btnT, !a.primary && { color: C.inkMid }]}>
                      {a.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TouchableOpacity
                style={[ba.btn, { backgroundColor: color, width: '100%' }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={ba.btnT}>გასაგებია</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Subtle Close X */}
          {!safeState.actions && (
            <TouchableOpacity style={ba.closeX} onPress={onClose}>
              <X size={20} color={C.inkLight} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const ba = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  iconOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  content: {
    alignItems: 'center',
    marginBottom: 26,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: C.ink,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  msg: {
    fontSize: 15,
    color: C.inkMid,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 10,
  },
  footer: {
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  btnGhost: {
    backgroundColor: C.surfaceMid,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  btnT: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  closeX: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 4,
  },
});

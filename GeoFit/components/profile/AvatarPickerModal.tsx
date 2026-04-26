import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, Modal, TouchableOpacity, ScrollView,
  Animated, Dimensions, Platform, Easing, Pressable, StyleSheet
} from 'react-native';
import { X, Check, Shuffle, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width: SW, height: SH } = Dimensions.get('window');

/* ═══════════════════════════════════════════════════════════════
   📚 AVATAR LIBRARY — categorized for discoverability
   ═══════════════════════════════════════════════════════════════ */
export const AVATAR_CATEGORIES = [
  {
    id: 'people',
    label: 'პერსონები',
    emoji: '🧔',
    items: ['🧔🏻‍♂️', '👨‍🍳', '👩‍🍳', '🦸', '🧗', '🧙', '🧑‍⚕️', '🧑‍🎓', '🧑‍🚀', '🤴', '👸', '🧑‍🎤'],
  },
  {
    id: 'sport',
    label: 'აქტივობა',
    emoji: '💪',
    items: ['🏋🏻‍♂️', '🏋🏻‍♀️', '🏃🏻‍♂️', '🏃🏻‍♀️', '🧘🏻‍♂️', '🧘🏻‍♀️', '🚴', '🏊', '⛹️', '🤸', '🤾', '💪'],
  },
  {
    id: 'nature',
    label: 'ბუნება',
    emoji: '🌿',
    items: ['🌿', '🌱', '🍃', '🌺', '🌸', '🌻', '🦋', '🌊', '🌙', '☀️', '⭐', '🔥'],
  },
  {
    id: 'food',
    label: 'საკვები',
    emoji: '🥗',
    items: ['🥗', '🥑', '🍎', '🥦', '🥕', '🍇', '🍓', '🥥', '🍋', '🍊', '🥝', '🍉'],
  },
  {
    id: 'symbols',
    label: 'სიმბოლოები',
    emoji: '⚡',
    items: ['⚡', '🎯', '🏆', '🧬', '🫀', '⚽', '🏅', '💎', '🎖️', '🌈', '✨', '💫'],
  },
];

const ALL_AVATARS = AVATAR_CATEGORIES.flatMap(c => c.items);

/* ═══════════════════════════════════════════════════════════════
   ✨ FLOATING PARTICLE — subtle decoration in preview
   ═══════════════════════════════════════════════════════════════ */
const FloatingParticle = ({ size, color, delay, startX, startY, range }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 3000 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(anim, { toValue: 0, duration: 3000 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
    ])).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, top: startY, left: startX,
      opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.7] }),
      transform: [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -range] }) },
        { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) },
      ],
    }} pointerEvents="none" />
  );
};

/* ═══════════════════════════════════════════════════════════════
   🎯 AVATAR TILE — animated grid item with selection state
   ═══════════════════════════════════════════════════════════════ */
const AvatarTile = ({ emoji, selected, onPress, index, C }: any) => {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(20)).current;
  const sc = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 350, delay: index * 25, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(ty, { toValue: 0, duration: 450, delay: index * 25, easing: Easing.out(Easing.back(1.3)), useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.spring(ringAnim, {
      toValue: selected ? 1 : 0,
      friction: 6, tension: 140, useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [selected]);

  const handlePressIn = () => Animated.spring(sc, { toValue: 0.9, useNativeDriver: Platform.OS !== 'web' }).start();
  const handlePressOut = () => Animated.spring(sc, { toValue: 1, friction: 4, useNativeDriver: Platform.OS !== 'web' }).start();

  return (
    <Animated.View style={{
      opacity: op,
      transform: [{ translateY: ty }, { scale: sc }],
    }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          tileStyles.tile,
          {
            backgroundColor: selected ? (C.primaryLight || '#E0F2FE') : '#FFF',
            borderColor: selected ? (C.primary || '#0EA5E9') : 'rgba(0,0,0,0.05)',
            borderWidth: selected ? 2 : 1,
          }
        ]}
      >
        <Animated.View style={{
          transform: [{
            scale: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }),
          }],
        }}>
          <Text style={tileStyles.emoji}>{emoji}</Text>
        </Animated.View>

        {/* Selection checkmark */}
        <Animated.View style={[
          tileStyles.checkBadge,
          {
            backgroundColor: (C.primary || '#0EA5E9'),
            opacity: ringAnim,
            transform: [{ scale: ringAnim }],
          }
        ]}>
          <Check size={11} color="#FFF" strokeWidth={3.5} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const tileStyles = StyleSheet.create({
  tile: {
    width: (SW - 48 - 30) / 5, // 5 columns, 24px padding each side, 7.5px gap
    aspectRatio: 1,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  emoji: { fontSize: 28 },
  checkBadge: {
    position: 'absolute',
    top: -4, right: -4,
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
});

/* ═══════════════════════════════════════════════════════════════
   🎪 MAIN MODAL
   ═══════════════════════════════════════════════════════════════ */
type Props = {
  visible: boolean;
  currentAvatar: string;
  onClose: () => void;
  onSave: (emoji: string) => void;
  C: any;
};

export const AvatarPickerModal: React.FC<Props> = ({ visible, currentAvatar, onClose, onSave, C }) => {
  const [activeCategory, setActiveCategory] = useState<string>(AVATAR_CATEGORIES[0].id);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(currentAvatar);
  const initialAvatarRef = useRef<string>(currentAvatar);

  const sheetY = useRef(new Animated.Value(SH)).current;
  const backdropOp = useRef(new Animated.Value(0)).current;
  const previewBounce = useRef(new Animated.Value(0)).current;
  const previewRotate = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0)).current;
  const saveBtnAnim = useRef(new Animated.Value(0)).current;

  // Reset when opening
  useEffect(() => {
    if (visible) {
      setSelectedAvatar(currentAvatar);
      initialAvatarRef.current = currentAvatar;
      // Pick the category that contains the current avatar
      const owningCat = AVATAR_CATEGORIES.find(c => c.items.includes(currentAvatar));
      setActiveCategory(owningCat?.id || AVATAR_CATEGORIES[0].id);

      Animated.parallel([
        Animated.timing(backdropOp, { toValue: 1, duration: 280, useNativeDriver: Platform.OS !== 'web' }),
        Animated.spring(sheetY, { toValue: 0, friction: 11, tension: 70, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(haloScale, { toValue: 1, duration: 600, delay: 100, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOp, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(sheetY, { toValue: SH, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(haloScale, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }),
      ]).start();
    }
  }, [visible, currentAvatar]);

  // Show / hide save button based on whether selection changed
  const isDirty = selectedAvatar !== initialAvatarRef.current;
  useEffect(() => {
    Animated.spring(saveBtnAnim, {
      toValue: isDirty ? 1 : 0,
      friction: 8, tension: 100, useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isDirty]);

  // Continuous preview float
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(floatAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
    ])).start();
  }, []);

  // Preview "pop" when selection changes
  const handleSelect = (emoji: string) => {
    if (emoji === selectedAvatar) return;
    setSelectedAvatar(emoji);
    if (Platform.OS !== 'web') Haptics.selectionAsync();

    previewBounce.setValue(0);
    Animated.spring(previewBounce, { toValue: 1, friction: 4, tension: 120, useNativeDriver: Platform.OS !== 'web' }).start();

    previewRotate.setValue(0);
    Animated.timing(previewRotate, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start();
  };

  const handleCategoryChange = (id: string) => {
    if (id === activeCategory) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(id);
  };

  const handleRandom = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let pick = selectedAvatar;
    let tries = 0;
    while (pick === selectedAvatar && tries < 10) {
      pick = ALL_AVATARS[Math.floor(Math.random() * ALL_AVATARS.length)];
      tries++;
    }
    handleSelect(pick);
    // Switch to its category
    const cat = AVATAR_CATEGORIES.find(c => c.items.includes(pick));
    if (cat) setActiveCategory(cat.id);
  };

  const handleReset = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSelect(initialAvatarRef.current);
    const cat = AVATAR_CATEGORIES.find(c => c.items.includes(initialAvatarRef.current));
    if (cat) setActiveCategory(cat.id);
  };

  const handleConfirmSave = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(selectedAvatar);
    onClose();
  };

  const activeItems = useMemo(
    () => AVATAR_CATEGORIES.find(c => c.id === activeCategory)?.items || [],
    [activeCategory]
  );

  const previewScale = previewBounce.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.18, 1],
  });
  const previewRotateDeg = previewRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-8deg', '0deg'],
  });
  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View
        style={[modalStyles.backdrop, { opacity: backdropOp }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[
        modalStyles.sheet,
        { transform: [{ translateY: sheetY }] }
      ]}>
        {/* Drag handle */}
        <View style={modalStyles.handle} />

        {/* Header */}
        <View style={modalStyles.header}>
          <View>
            <Text style={[modalStyles.eyebrow, { color: C.primaryDark || '#0369A1' }]}>აირჩიე შენი იდენტობა</Text>
            <Text style={modalStyles.title}>ავატარის არჩევა</Text>
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              modalStyles.closeBtn,
              { backgroundColor: 'rgba(0,0,0,0.04)' },
              pressed && { opacity: 0.6, transform: [{ scale: 0.9 }] }
            ]}
          >
            <X size={20} color={C.ink || '#0F172A'} strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* ═══ Preview area ═══ */}
        <View style={modalStyles.previewWrap}>
          {/* Decorative gradient backdrop */}
          <View style={[modalStyles.previewBg, { backgroundColor: (C.primaryLight || '#E0F2FE') }]} />

          {/* Animated halo */}
          <Animated.View style={[
            modalStyles.previewHalo,
            {
              borderColor: (C.primary || '#0EA5E9'),
              opacity: haloScale.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] }),
              transform: [{ scale: haloScale }],
            }
          ]} />
          <Animated.View style={[
            modalStyles.previewHalo,
            {
              width: 180, height: 180, borderRadius: 90,
              borderColor: (C.primary || '#0EA5E9'),
              opacity: haloScale.interpolate({ inputRange: [0, 1], outputRange: [0, 0.2] }),
              transform: [{ scale: haloScale }],
            }
          ]} />

          {/* Floating particles */}
          <FloatingParticle size={6} color={C.primary || '#0EA5E9'} delay={0} startX={SW * 0.2} startY={40} range={20} />
          <FloatingParticle size={4} color={C.info || '#3B82F6'} delay={500} startX={SW * 0.75} startY={55} range={25} />
          <FloatingParticle size={5} color={C.warning || '#F59E0B'} delay={1000} startX={SW * 0.18} startY={120} range={18} />
          <FloatingParticle size={4} color={C.primary || '#0EA5E9'} delay={1500} startX={SW * 0.78} startY={130} range={22} />

          {/* The avatar itself */}
          <Animated.View style={{
            transform: [
              { translateY: floatY },
              { scale: previewScale },
              { rotate: previewRotateDeg },
            ],
          }}>
            <View style={[modalStyles.previewCircle, {
              backgroundColor: '#FFF',
              borderColor: (C.primary || '#0EA5E9'),
            }]}>
              <Text style={modalStyles.previewEmoji}>{selectedAvatar}</Text>
            </View>
          </Animated.View>

          {/* Action chips: Random / Reset */}
          <View style={modalStyles.previewActions}>
            <Pressable
              onPress={handleRandom}
              style={({ pressed }) => [
                modalStyles.previewChip,
                { backgroundColor: '#FFF' },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Shuffle size={13} color={C.ink || '#0F172A'} />
              <Text style={[modalStyles.previewChipTxt, { color: C.ink || '#0F172A' }]}>შემთხვევითი</Text>
            </Pressable>
            {isDirty && (
              <Pressable
                onPress={handleReset}
                style={({ pressed }) => [
                  modalStyles.previewChip,
                  { backgroundColor: '#FFF' },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <RotateCcw size={13} color={C.inkMid || '#64748B'} />
                <Text style={[modalStyles.previewChipTxt, { color: C.inkMid || '#64748B' }]}>დაბრუნება</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ═══ Category tabs ═══ */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={modalStyles.tabsRow}
        >
          {AVATAR_CATEGORIES.map((cat) => {
            const active = cat.id === activeCategory;
            return (
              <Pressable
                key={cat.id}
                onPress={() => handleCategoryChange(cat.id)}
                style={({ pressed }) => [
                  modalStyles.tab,
                  {
                    backgroundColor: active ? (C.ink || '#0F172A') : 'rgba(0,0,0,0.04)',
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  }
                ]}
              >
                <Text style={modalStyles.tabEmoji}>{cat.emoji}</Text>
                <Text style={[
                  modalStyles.tabTxt,
                  { color: active ? '#FFF' : (C.inkMid || '#64748B') },
                ]}>{cat.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ═══ Avatar grid ═══ */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={modalStyles.gridScroll}
        >
          <View style={modalStyles.grid} key={activeCategory /* re-mount for entrance anim */}>
            {activeItems.map((emoji, i) => (
              <AvatarTile
                key={`${activeCategory}-${emoji}`}
                emoji={emoji}
                selected={emoji === selectedAvatar}
                onPress={() => handleSelect(emoji)}
                index={i}
                C={C}
              />
            ))}
          </View>
        </ScrollView>

        {/* ═══ Save button (slides up when dirty) ═══ */}
        <Animated.View style={[
          modalStyles.saveWrap,
          {
            opacity: saveBtnAnim,
            transform: [{
              translateY: saveBtnAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }),
            }],
          }
        ]}
        pointerEvents={isDirty ? 'auto' : 'none'}
        >
          <Pressable
            onPress={handleConfirmSave}
            style={({ pressed }) => [
              modalStyles.saveBtn,
              { backgroundColor: (C.primary || '#0EA5E9') },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
            ]}
          >
            <Text style={modalStyles.saveBtnTxt}>შენახვა</Text>
            <View style={modalStyles.savePreviewBadge}>
              <Text style={{ fontSize: 18 }}>{selectedAvatar}</Text>
            </View>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════════════
   🎨 STYLES
   ═══════════════════════════════════════════════════════════════ */
const modalStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 15, 25, 0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#FBFCFE',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: SH * 0.92,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 24,
  },
  handle: {
    width: 44, height: 5,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10, marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 6,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },

  // Preview
  previewWrap: {
    height: 200,
    marginTop: 4,
    marginHorizontal: 20,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  previewHalo: {
    position: 'absolute',
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 2,
  },
  previewCircle: {
    width: 110, height: 110, borderRadius: 55,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  previewEmoji: { fontSize: 56 },
  previewActions: {
    position: 'absolute',
    bottom: 14,
    flexDirection: 'row',
    gap: 8,
  },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  previewChipTxt: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Tabs
  tabsRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
  },
  tabEmoji: { fontSize: 14 },
  tabTxt: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // Grid
  gridScroll: {
    paddingHorizontal: 20,
    paddingBottom: 100, // space for save button
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7.5,
    rowGap: 12,
  },

  // Save button
  saveWrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 30 : 20,
    left: 20, right: 20,
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 17,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  saveBtnTxt: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  savePreviewBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 4,
  },
});

export default AvatarPickerModal;

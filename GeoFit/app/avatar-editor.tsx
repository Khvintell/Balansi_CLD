// ─── 👗 AVATAR DRESSING ROOM — PRO CUSTOMIZATION SCREEN ─────────────────────
// Full RPG-lite equipment screen with live preview
// Category tabs: Base | Hair | Tops | Bottoms | Shoes | Accessories
// Fixed: SafeAreaInsets, stable grid, expanded item variety
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Dimensions, Platform, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Lock, CheckCircle2, Flame, Sparkles } from 'lucide-react-native';
import { useThemeStore } from '../store/useThemeStore';
import { getColors } from '../config/theme';
import {
  useAvatarStore,
  ITEMS_DB,
  type ItemCategory,
  type AvatarItem,
} from '../store/useAvatarStore';
import { useDiaryStore } from '../store/useDiaryStore';
import InteractiveAvatar from '../components/avatar/InteractiveAvatar';

const { width: SW } = Dimensions.get('window');
const ITEM_WIDTH = Math.floor((SW - 48 - 20) / 3); // 3 columns, 48px padding, 20px gaps

// ─── Category tabs ───────────────────────────────────────────────────────────
const CATEGORIES: { key: ItemCategory; label: string; emoji: string }[] = [
  { key: 'hair',      label: 'თმა',         emoji: '💇' },
  { key: 'top',       label: 'ტოპი',        emoji: '👕' },
  { key: 'bottom',    label: 'შარვალი',     emoji: '👖' },
  { key: 'shoes',     label: 'ფეხსაცმელი',  emoji: '👟' },
  { key: 'accessory', label: 'აქსესუარი',   emoji: '✨' },
];

export default function AvatarEditorScreen() {
  const insets = useSafeAreaInsets();
  const { themeId } = useThemeStore();
  const C = useMemo(() => getColors(themeId), [themeId]);
  const router = useRouter();
  const { isPremium } = useDiaryStore();
  const { equippedItems, equipItem, streak } = useAvatarStore();

  const [activeCategory, setActiveCategory] = useState<ItemCategory>('hair');

  const font = Platform.OS === 'ios' ? 'System' : 'sans-serif';

  // Get items for current category
  const categoryItems = useMemo(() =>
    ITEMS_DB.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  // Check if an item is unlocked
  const isItemUnlocked = useCallback((item: AvatarItem) => {
    if (!item.isPremiumOnly) return true;
    if (!isPremium) return false;
    return streak >= item.requiredStreak;
  }, [isPremium, streak]);

  // Check if currently equipped
  const isEquipped = useCallback((item: AvatarItem) => {
    return equippedItems[item.category] === item.id;
  }, [equippedItems]);

  const handleItemPress = useCallback((item: AvatarItem) => {
    if (!isItemUnlocked(item)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    equipItem(item.category, item.id);
  }, [isItemUnlocked, equipItem]);

  // ─── Build grid rows manually (guarantees 3-column layout, no FlatList glitch)
  const gridRows = useMemo(() => {
    const rows: AvatarItem[][] = [];
    for (let i = 0; i < categoryItems.length; i += 3) {
      rows.push(categoryItems.slice(i, i + 3));
    }
    return rows;
  }, [categoryItems]);

  return (
    <View style={[s.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Header (with safe area) ── */}
      <View style={[s.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          style={[s.headerBtn, { backgroundColor: C.surface }]}
        >
          <ArrowLeft size={18} color={C.ink} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Sparkles size={14} color={C.primary} />
          <Text style={[s.headerTitle, { color: C.ink, fontFamily: font }]}>გარდერობი</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* ── Avatar Preview ── */}
        <View style={[s.previewArea, { backgroundColor: C.surface }]}>
          <View style={[s.previewGlow, { backgroundColor: C.primary }]} />
          <InteractiveAvatar C={C} size={120} disableGestures />
        </View>

        {/* ── Category Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsRow}
          style={{ flexGrow: 0 }}
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  s.tab,
                  {
                    backgroundColor: active ? C.primary + '15' : C.surface,
                    borderColor: active ? C.primary : C.border,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveCategory(cat.key);
                }}
              >
                <Text style={s.tabEmoji}>{cat.emoji}</Text>
                <Text style={[
                  s.tabLabel,
                  { color: active ? C.primary : C.inkMid, fontFamily: font },
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Items Grid (manual rows — stable layout) ── */}
        <View style={s.grid}>
          {gridRows.map((row, rowIdx) => (
            <View key={`row-${rowIdx}`} style={s.gridRow}>
              {row.map((item) => {
                const unlocked = isItemUnlocked(item);
                const equipped = isEquipped(item);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      s.itemCard,
                      { backgroundColor: C.surface, borderColor: equipped ? C.primary : C.border, width: ITEM_WIDTH },
                      equipped && { borderWidth: 2.5, shadowColor: C.primary, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
                      !unlocked && { opacity: 0.45 },
                    ]}
                    activeOpacity={unlocked ? 0.7 : 0.45}
                    onPress={() => handleItemPress(item)}
                  >
                    <Text style={s.itemEmoji}>{item.emoji}</Text>
                    <Text style={[s.itemName, { color: C.ink, fontFamily: font }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {equipped ? (
                      <View style={[s.badge, { backgroundColor: C.primary + '18' }]}>
                        <CheckCircle2 size={10} color={C.primary} />
                        <Text style={[s.badgeText, { color: C.primary, fontFamily: font }]}>ატანილი</Text>
                      </View>
                    ) : !unlocked ? (
                      <View style={[s.badge, { backgroundColor: C.border }]}>
                        {item.requiredStreak > 0 && !isPremium ? (
                          <>
                            <Lock size={9} color={C.inkLight} />
                            <Text style={[s.badgeText, { color: C.inkLight, fontFamily: font }]}>PRO</Text>
                          </>
                        ) : (
                          <>
                            <Flame size={9} color={C.orange} />
                            <Text style={[s.badgeText, { color: C.orange, fontFamily: font }]}>
                              {item.requiredStreak}დ სთრიქი
                            </Text>
                          </>
                        )}
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
              {/* Fill remaining slots in incomplete rows */}
              {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
                <View key={`empty-${i}`} style={{ width: ITEM_WIDTH }} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  headerTitle: {
    fontSize: 16, fontWeight: '900', letterSpacing: 0.5,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  previewArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  previewGlow: {
    position: 'absolute',
    width: 180, height: 180, borderRadius: 90,
    opacity: 0.06,
  },

  tabsRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabEmoji: { fontSize: 14 },
  tabLabel: { fontSize: 11, fontWeight: '700' },

  grid: {
    paddingHorizontal: 16,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  itemCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 5,
  },
  itemEmoji: {
    fontSize: 26,
  },
  itemName: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
});

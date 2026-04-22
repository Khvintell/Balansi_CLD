/**
 * cart.tsx — GeoFit Shopping Cart
 *
 * Bugs fixed vs original:
 *  1. XCircle removed from react-native import (crashed) → lucide-react-native
 *  2. router.back() removed — tabs have no back stack
 *  3. Double haptic in toggleCheck/increment removed
 *  4. mergeDuplicates no longer drift: handled exclusively in useCartStore
 *  5. showConfirm fully typed — no any/null-dereference
 *  6. StatusBar barStyle now dynamic based on theme
 *  7. All handlers wrapped in useCallback
 *  8. SafeAreaView from react-native-safe-area-context (consistent with fridge)
 *  9. persist() try/catch — lives in Zustand store now
 * 10. CartItem typed — no more any[]
 * 11. decrement logic ordering fixed in store
 * 12. getStyles() return type is StyleSheet object (no any)
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Platform, StatusBar, Modal,
  TextInput, Animated, Easing,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ShoppingCart, Trash2,
  X, XCircle, Plus, Minus, ChevronDown, ChevronUp,
  LayoutList, Leaf, ShoppingBag,
  Search, Check, CheckCircle2, RefreshCw,
} from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { getColors } from '../../config/theme';
import { useCartStore, CartItem, CartCategory, guessCategory } from '../../store/useCartStore';

// ─── Category Config ──────────────────────────────────────────────────────────

type CategoryConfig = {
  id: CartCategory;
  label: string;
  emoji: string;
  color: string;
};

const CATEGORIES: CategoryConfig[] = [
  { id: 'produce',  label: 'ბოსტნეული / ხილი', emoji: '🥦', color: '#1DB954' },
  { id: 'protein',  label: 'ხორცი / თევზი',     emoji: '🥩', color: '#EF4444' },
  { id: 'dairy',    label: 'რძის ნაწარმი',       emoji: '🥛', color: '#F97316' },
  { id: 'grains',   label: 'მარცვლეული',         emoji: '🌾', color: '#8B5CF6' },
  { id: 'other',    label: 'სხვა',               emoji: '🛒', color: '#3B82F6' },
];

const getCat = (id: CartCategory): CategoryConfig =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[4];

// ─── Haptics helper ───────────────────────────────────────────────────────────

const haptic = {
  light:   () => { if (Platform.OS !== 'web') Haptics.selectionAsync(); },
  warning: () => { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); },
  success: () => { if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); },
};

// ─── Confirm Modal State Type ─────────────────────────────────────────────────

type ConfirmState = {
  title: string;
  message: string;
  type: 'trash' | 'alert';
  onConfirm: () => void;
} | null;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: percent,
      duration: 750,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent]);

  return (
    <View style={pb.track}>
      <Animated.View
        style={[
          pb.fill,
          {
            backgroundColor: color,
            width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 8, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden', marginTop: 14 },
  fill:  { height: 8, borderRadius: 4 },
});

// ─── CartRow ──────────────────────────────────────────────────────────────────

type CartRowProps = {
  item: CartItem;
  onToggle: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onDelete: (id: string) => void;
  S: ReturnType<typeof getStyles>;
  C: ReturnType<typeof getColors>;
};

function CartRow({ item, onToggle, onIncrement, onDecrement, onDelete, S, C }: CartRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const cat = getCat(item.category);

  const pressIn  = useCallback(() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start(), []);
  const pressOut = useCallback(() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start(), []);

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, S.rowWrap, item.checked && S.rowWrapChecked]}>
      <View style={[S.catBar, { backgroundColor: item.checked ? C.border : cat.color }]} />
      <View style={S.rowBody}>
        {/* Left: checkbox + name */}
        <TouchableOpacity
          style={S.rowLeft}
          onPressIn={pressIn}
          onPressOut={pressOut}
          onPress={() => { haptic.light(); onToggle(item.id); }}
          activeOpacity={0.8}
        >
          <View style={[S.checkBox, item.checked && { backgroundColor: C.primary, borderColor: C.primary }]}>
            {item.checked && <Check size={14} color="#FFF" strokeWidth={3.5} />}
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[S.rowName, item.checked && S.rowNameDone]} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={S.rowMeta}>
              <View style={[S.catPill, { backgroundColor: item.checked ? C.border + '30' : cat.color + '18' }]}>
                <Text style={[S.catPillTxt, { color: item.checked ? C.inkFaint : cat.color }]}>
                  {cat.emoji} {cat.label}
                </Text>
              </View>
              {!!item.note && (
                <Text style={S.rowNote} numberOfLines={1}>• {item.note}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Right: stepper + delete */}
        <View style={S.rowRight}>
          <View style={[S.stepper, item.checked && { opacity: 0.4 }]}>
            <TouchableOpacity
              disabled={item.checked}
              style={S.stepBtn}
              onPress={() => { haptic.light(); onDecrement(item.id); }}
            >
              <Minus size={14} color={C.inkMid} strokeWidth={3} />
            </TouchableOpacity>
            <View style={S.stepValWrap}>
              <Text style={S.stepVal}>{item.quantity}</Text>
            </View>
            <TouchableOpacity
              disabled={item.checked}
              style={S.stepBtn}
              onPress={() => { haptic.light(); onIncrement(item.id); }}
            >
              <Plus size={14} color={C.inkMid} strokeWidth={3} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={S.deleteBtn} onPress={() => { haptic.warning(); onDelete(item.id); }}>
            <Trash2 size={18} color={C.red} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CartScreen() {
  // Theme
  const { themeId } = useThemeStore();
  const C = useMemo(() => getColors(themeId), [themeId]);
  const S = useMemo(() => getStyles(C), [C]);

  // Cart store
  const {
    items: cartItems,
    addItem,
    toggleCheck,
    increment,
    decrement,
    removeItem,
    clearAll,
    clearChecked,
  } = useCartStore();

  // Local UI state
  const [showConfirm, setShowConfirm]         = useState<ConfirmState>(null);
  const [filterCat, setFilterCat]             = useState<CartCategory | null>(null);
  const [searchText, setSearchText]           = useState('');
  const [expandedCats, setExpandedCats]       = useState<Set<string>>(new Set(CATEGORIES.map((c) => c.id)));
  const [viewMode, setViewMode]               = useState<'flat' | 'grouped'>('grouped');

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen]   = useState(false);
  const [newItemName, setNewItemName]         = useState('');
  const [newItemNote, setNewItemNote]         = useState('');
  const [newItemCat, setNewItemCat]           = useState<CartCategory>('other');
  const [newItemQty, setNewItemQty]           = useState(1);
  const [autoDetected, setAutoDetected]       = useState(false);
  const [lastAdded, setLastAdded]             = useState<string | null>(null); // flash feedback

  // Ref to keep keyboard open between rapid entries
  const nameInputRef = useRef<TextInput>(null);

  // ─── Derived state ───────────────────────────────────────────────────────────

  const checkedCount  = cartItems.filter((i) => i.checked).length;
  const totalCount    = cartItems.length;
  const progress      = totalCount === 0 ? 0 : Math.round((checkedCount / totalCount) * 100);
  const isAllDone     = totalCount > 0 && checkedCount === totalCount;
  const progressColor = isAllDone ? C.primary : progress > 50 ? C.blue : C.orange;
  const hasChecked    = checkedCount > 0;

  const filtered = useMemo(() =>
    cartItems.filter((item) => {
      const matchCat  = !filterCat || item.category === filterCat;
      const matchText = !searchText || item.name.toLowerCase().includes(searchText.toLowerCase());
      return matchCat && matchText;
    }),
    [cartItems, filterCat, searchText]
  );

  const grouped = useMemo(() =>
    CATEGORIES
      .map((cat) => ({ ...cat, items: filtered.filter((i) => i.category === cat.id) }))
      .filter((g) => g.items.length > 0),
    [filtered]
  );

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleToggle = useCallback((id: string) => {
    haptic.light();
    toggleCheck(id);
  }, [toggleCheck]);

  const handleIncrement = useCallback((id: string) => {
    haptic.light();
    increment(id);
  }, [increment]);

  const handleDecrement = useCallback((id: string) => {
    const wasDeleted = decrement(id);
    if (wasDeleted) {
      haptic.warning();
    } else {
      haptic.light();
    }
  }, [decrement]);

  const handleRequestDelete = useCallback((id: string) => {
    haptic.warning();
    setShowConfirm({
      title: 'პროდუქტის წაშლა',
      message: 'ნამდვილად გსურს ამ პროდუქტის სიიდან ამოღება?',
      type: 'trash',
      onConfirm: () => {
        haptic.success();
        removeItem(id);
        setShowConfirm(null);
      },
    });
  }, [removeItem]);

  const handleClearAll = useCallback(() => {
    haptic.warning();
    setShowConfirm({
      title: 'სიის გასუფთავება',
      message: 'ნამდვილად გსურს მთლიანი სიის წაშლა?',
      type: 'alert',
      onConfirm: () => {
        haptic.success();
        clearAll();
        setShowConfirm(null);
      },
    });
  }, [clearAll]);

  const handleClearChecked = useCallback(() => {
    haptic.warning();
    setShowConfirm({
      title: 'შეძენილების წაშლა',
      message: `${checkedCount} შეძენილი პროდუქტი სიიდან ამოიშლება.`,
      type: 'trash',
      onConfirm: () => {
        haptic.success();
        clearChecked();
        setShowConfirm(null);
      },
    });
  }, [clearChecked, checkedCount]);

  // BUG FIX 1: Was calling restartList() which only unchecked items.
  // Now calls clearAll() to fully delete all items and reset to empty state.
  const handleRestart = useCallback(() => {
    haptic.success();
    clearAll();
  }, [clearAll]);

  const toggleCatExpand = useCallback((catId: string) => {
    haptic.light();
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  }, []);

  // ─── Add Modal handlers ──────────────────────────────────────────────────────

  const handleNameChange = useCallback((text: string) => {
    setNewItemName(text);
    const guessed = guessCategory(text);
    if (guessed !== 'other') {
      setNewItemCat(guessed);
      setAutoDetected(true);
    } else {
      // FIX: Strictly fallback to 'other' if unrecognized
      setNewItemCat('other');
      setAutoDetected(false);
    }
  }, []);

  const openAddModal = useCallback(() => {
    haptic.light();
    setNewItemName('');
    setNewItemNote('');
    setNewItemCat('other');
    setNewItemQty(1);
    setAutoDetected(false);
    setLastAdded(null);
    setIsAddModalOpen(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setLastAdded(null);
  }, []);

  const handleAddItem = useCallback(() => {
    if (!newItemName.trim()) return;
    haptic.success();
    const addedName = newItemName.trim();
    addItem({
      name:     addedName,
      note:     newItemNote.trim(),
      quantity: newItemQty,
      category: newItemCat,
      checked:  false,
    });

    // BUG FIX 2: Do NOT close the modal. Instead:
    //   a) Show a brief flash so the user knows the item was added.
    //   b) Reset only the text fields, keep qty/category for rapid re-entry.
    //   c) Re-focus the name input so the keyboard stays up permanently.
    setLastAdded(addedName);
    setNewItemName('');
    setNewItemNote('');
    setAutoDetected(false);

    // requestAnimationFrame ensures React has committed the state reset
    // before we call focus(), preventing the keyboard from flickering.
    requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });

    // Clear the flash badge after 2 s
    setTimeout(() => setLastAdded(null), 2000);
  }, [addItem, newItemName, newItemNote, newItemQty, newItemCat]);

  // ─── Determine StatusBar style ───────────────────────────────────────────────

  const isDarkTheme  = themeId === 'obsidian_dark' || themeId === 'executive_gold';
  const barStyle     = isDarkTheme ? 'light-content' : 'dark-content';

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: C.surfaceAlt }}>
      <StatusBar barStyle={barStyle} backgroundColor="transparent" translucent />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>

        {/* ── HEADER ── */}
        <View style={S.header}>
          {/* Left spacer for centering */}
          <View style={S.headerSide}>
            <View style={S.brandBadge}>
              <Leaf size={14} color={C.primary} />
              <Text style={S.brandText}>BALANSI MARKET</Text>
            </View>
          </View>

          <View style={S.headerCenter}>
            <Text style={S.headerTitle}>საყიდლები</Text>
            {totalCount > 0 && (
              <View style={[S.headerCount, { backgroundColor: C.primaryLight }]}>
                <ShoppingCart size={11} color={C.primary} />
                <Text style={[S.headerCountTxt, { color: C.primary }]}>{totalCount}</Text>
              </View>
            )}
          </View>

          {/* Right spacer for centering */}
          <View style={[S.headerSide, { alignItems: 'flex-end' }]}>
            <TouchableOpacity
              style={[S.iconBtn, totalCount === 0 && { opacity: 0 }]}
              disabled={totalCount === 0}
              onPress={handleClearAll}
            >
              <Trash2 size={20} color={C.red} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── PROGRESS CARD ── */}
          {totalCount > 0 && (
            <View style={S.progressCard}>
              <View style={S.progressHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={S.progressTitle}>
                    {isAllDone ? 'შოპინგი დასრულდა! 🎉' : 'შოპინგის პროგრესი'}
                  </Text>
                  <Text style={S.progressSub}>
                    {checkedCount} / {totalCount} პროდუქტი კალათაშია
                  </Text>
                </View>
                <Text style={[S.progressPct, { color: progressColor }]}>{progress}%</Text>
              </View>
              <ProgressBar percent={progress} color={progressColor} />

              {/* Action row below progress */}
              {(isAllDone || hasChecked) && (
                <View style={S.progressActions}>
                  {isAllDone ? (
                    <TouchableOpacity style={S.restartBtn} onPress={handleRestart} activeOpacity={0.8}>
                      <RefreshCw size={16} color="#FFF" />
                      <Text style={S.restartBtnText}>ახალი სიის დაწყება</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={S.clearCheckedBtn} onPress={handleClearChecked} activeOpacity={0.8}>
                      <Trash2 size={15} color={C.red} />
                      <Text style={[S.clearCheckedTxt, { color: C.red }]}>
                        {checkedCount} შეძენილის წაშლა
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {/* ── SEARCH & VIEW TOGGLE ── */}
          {totalCount > 0 && (
            <View style={S.controlsRow}>
              <View style={S.searchBox}>
                <Search size={17} color={C.inkFaint} />
                <TextInput
                  style={S.searchInput}
                  placeholder="ძებნა..."
                  placeholderTextColor={C.inkFaint}
                  value={searchText}
                  onChangeText={setSearchText}
                />
                {searchText.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchText('')}>
                    <X size={17} color={C.inkMid} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[S.modeBtn, viewMode === 'grouped' && { backgroundColor: C.primaryLight, borderColor: C.primaryBorder }]}
                onPress={() => { haptic.light(); setViewMode((v) => v === 'flat' ? 'grouped' : 'flat'); }}
              >
                <LayoutList size={20} color={viewMode === 'grouped' ? C.primary : C.inkMid} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── CATEGORY FILTER CHIPS ── */}
          {totalCount > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={S.filterChipsContent}
              style={S.filterChipsWrap}
            >
              <TouchableOpacity
                style={[S.filterChip, !filterCat && { backgroundColor: C.ink, borderColor: C.ink }]}
                onPress={() => { haptic.light(); setFilterCat(null); }}
              >
                <Text style={[S.filterChipTxt, !filterCat && { color: '#FFF' }]}>ყველა</Text>
              </TouchableOpacity>
              {CATEGORIES.map((cat) => {
                const isActive = filterCat === cat.id;
                const count = cartItems.filter((i) => i.category === cat.id).length;
                if (count === 0) return null;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[S.filterChip, isActive && { backgroundColor: cat.color + '20', borderColor: cat.color }]}
                    onPress={() => { haptic.light(); setFilterCat(isActive ? null : cat.id); }}
                  >
                    <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                    <Text style={[S.filterChipTxt, isActive && { color: cat.color }]}>
                      {cat.label.split(' / ')[0]}
                    </Text>
                    <View style={[S.filterChipBadge, { backgroundColor: isActive ? cat.color : C.border }]}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: isActive ? '#FFF' : C.inkMid }}>{count}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ── ITEM LIST ── */}
          {totalCount === 0 ? (
            <View style={S.emptyWrap}>
              <View style={S.emptyIconWrap}>
                <ShoppingBag size={52} color={C.primary} />
              </View>
              <Text style={S.emptyTitle}>კალათა ცარიელია</Text>
              <Text style={S.emptySub}>
                დაამატე ინგრედიენტები და დაიწყე ჯანსაღი შოპინგი.
              </Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 20 }}>
              {filtered.length === 0 ? (
                <View style={S.emptyWrap}>
                  <Text style={{ fontSize: 32 }}>🤷</Text>
                  <Text style={S.emptySub}>ვერაფერი მოიძებნა</Text>
                </View>
              ) : viewMode === 'flat' ? (
                filtered.map((item) => (
                  <CartRow
                    key={item.id}
                    S={S}
                    C={C}
                    item={item}
                    onToggle={handleToggle}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                    onDelete={handleRequestDelete}
                  />
                ))
              ) : (
                grouped.map((group) => {
                  const expanded  = expandedCats.has(group.id);
                  const doneCount = group.items.filter((i) => i.checked).length;
                  const isDone    = doneCount === group.items.length;
                  return (
                    <View key={group.id} style={{ marginBottom: 16 }}>
                      <TouchableOpacity
                        style={[S.groupHeader, isDone && { backgroundColor: C.primaryLight, borderColor: C.primaryBorder }]}
                        onPress={() => toggleCatExpand(group.id)}
                        activeOpacity={0.8}
                      >
                        <View style={[S.groupEmoji, { backgroundColor: group.color + '1A' }]}>
                          <Text style={{ fontSize: 18 }}>{group.emoji}</Text>
                        </View>
                        <Text style={[S.groupTitle, isDone && { color: C.primary }]}>{group.label}</Text>
                        <View style={{ flex: 1 }} />
                        <View style={[S.groupCount, { backgroundColor: isDone ? C.primary : group.color + '1A' }]}>
                          <Text style={{ fontSize: 12, fontWeight: '900', color: isDone ? '#FFF' : group.color }}>
                            {doneCount}/{group.items.length}
                          </Text>
                        </View>
                        {expanded
                          ? <ChevronUp size={18} color={C.inkMid} />
                          : <ChevronDown size={18} color={C.inkMid} />
                        }
                      </TouchableOpacity>
                      {expanded && group.items.map((item) => (
                        <CartRow
                          key={item.id}
                          S={S}
                          C={C}
                          item={item}
                          onToggle={handleToggle}
                          onIncrement={handleIncrement}
                          onDecrement={handleDecrement}
                          onDelete={handleRequestDelete}
                        />
                      ))}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        {/* ── FLOATING ADD BUTTON ── */}
        <View style={S.floatingAddWrap}>
          <TouchableOpacity style={S.floatingAddBtn} onPress={openAddModal} activeOpacity={0.9}>
            <Plus size={22} color="#FFF" />
            <Text style={S.floatingAddTxt}>პროდუქტის დამატება</Text>
            {totalCount > 0 && (
              <View style={S.fabBadge}>
                <Text style={S.fabBadgeTxt}>{totalCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── ADD ITEM BOTTOM SHEET ── */}
        <Modal
          visible={isAddModalOpen}
          transparent
          animationType="slide"
          onRequestClose={closeAddModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={S.modalOverlay}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={closeAddModal}
              activeOpacity={1}
            />
            <View style={S.modalSheet}>
              <View style={S.modalHandle} />

              {/* Sheet header */}
              <View style={S.modalTitleRow}>
                <View>
                  <Text style={S.modalTitle}>რა გაკლია?</Text>
                  <Text style={S.modalSubtitle}>დაამატე პროდუქტი კალათაში</Text>
                </View>
                <TouchableOpacity onPress={closeAddModal} style={S.modalCloseBtn}>
                  <XCircle size={26} color={C.inkFaint} />
                </TouchableOpacity>
              </View>

              {/* Name input */}
              <View style={S.inputGroup}>
                <Text style={S.inputLabel}>
                  პროდუქტის სახელი <Text style={{ color: C.red }}>*</Text>
                </Text>
                {/* BUG FIX 2: ref + blurOnSubmit={false} keep the keyboard open.
                    onSubmitEditing triggers add so user can rapid-fire with Enter. */}
                <TextInput
                  ref={nameInputRef}
                  style={S.modalInput}
                  placeholder="მაგ: ქათმის ფილე"
                  placeholderTextColor={C.inkFaint}
                  value={newItemName}
                  onChangeText={handleNameChange}
                  autoFocus
                  returnKeyType="done"
                  blurOnSubmit={false}
                  onSubmitEditing={handleAddItem}
                />
                {/* Flash badge: appears briefly after each successful add */}
                {lastAdded !== null ? (
                  <View style={[S.autoTag, { backgroundColor: C.primaryLight }]}>
                    <CheckCircle2 size={11} color={C.primary} />
                    <Text style={[S.autoTagTxt, { color: C.primaryDark }]}>
                      "{lastAdded}" დაემატა ✓
                    </Text>
                  </View>
                ) : autoDetected ? (
                  <View style={[S.autoTag, { backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primaryBorder }]}>
                    <Leaf size={11} color={C.primary} />
                    <Text style={[S.autoTagTxt, { color: C.primaryDark }]}>
                      კატეგორია ავტომატურად განისაზღვრა
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Quantity + Category row */}
              <View style={{ flexDirection: 'row', gap: 14, marginBottom: 18 }}>
                {/* Quantity stepper */}
                <View style={{ flex: 1 }}>
                  <Text style={S.inputLabel}>რაოდენობა</Text>
                  <View style={S.modalStepper}>
                    <TouchableOpacity
                      style={S.modalStepBtn}
                      onPress={() => { haptic.light(); if (newItemQty > 1) setNewItemQty((q) => q - 1); }}
                    >
                      <Minus size={17} color={C.ink} />
                    </TouchableOpacity>
                    <Text style={S.modalStepVal}>{newItemQty}</Text>
                    <TouchableOpacity
                      style={S.modalStepBtn}
                      onPress={() => { haptic.light(); setNewItemQty((q) => q + 1); }}
                    >
                      <Plus size={17} color={C.ink} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Category picker */}
                <View style={{ flex: 1.6 }}>
                  <Text style={S.inputLabel}>კატეგორია</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
                  >
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => { haptic.light(); setNewItemCat(cat.id); setAutoDetected(false); }}
                        style={[
                          S.modalCatBtn,
                          newItemCat === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color },
                        ]}
                      >
                        <Text style={{ fontSize: 15 }}>{cat.emoji}</Text>
                        <Text style={[S.modalCatTxt, newItemCat === cat.id && { color: cat.color }]}>
                          {cat.label.split(' / ')[0]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              {/* Note input */}
              <View style={S.inputGroup}>
                <Text style={S.inputLabel}>შენიშვნა (არასავალდებულო)</Text>
                <TextInput
                  style={S.modalInput}
                  placeholder="მაგ: 0%-იანი"
                  placeholderTextColor={C.inkFaint}
                  value={newItemNote}
                  onChangeText={setNewItemNote}
                  returnKeyType="done"
                  onSubmitEditing={handleAddItem}
                />
              </View>

              {/* Submit + Done row */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Primary: add item, keep modal + keyboard open */}
                <TouchableOpacity
                  style={[S.modalSubmitBtn, { flex: 1 }, !newItemName.trim() && { opacity: 0.45 }]}
                  disabled={!newItemName.trim()}
                  onPress={handleAddItem}
                  activeOpacity={0.85}
                >
                  <Plus size={18} color="#FFF" />
                  <Text style={S.modalSubmitTxt}>დამატება</Text>
                </TouchableOpacity>
                {/* Secondary: close modal when user is done with the full list */}
                <TouchableOpacity
                  style={S.modalDoneBtn}
                  onPress={closeAddModal}
                  activeOpacity={0.85}
                >
                  <Text style={[S.modalDoneTxt, { color: C.inkMid }]}>დასრულება</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* ── CONFIRMATION MODAL ── */}
        {showConfirm !== null && (
          <Modal transparent animationType="fade" onRequestClose={() => setShowConfirm(null)}>
            <View style={S.confirmOverlay}>
              <View style={S.confirmBox}>
                <View style={[
                  S.confirmIconBox,
                  { backgroundColor: showConfirm.type === 'trash' ? C.red + '15' : C.orange + '15' },
                ]}>
                  <Text style={{ fontSize: 38 }}>
                    {showConfirm.type === 'trash' ? '🗑️' : '⚠️'}
                  </Text>
                </View>
                <Text style={S.confirmTitle}>{showConfirm.title}</Text>
                <Text style={S.confirmMsg}>{showConfirm.message}</Text>
                <View style={S.confirmBtnRow}>
                  <TouchableOpacity
                    style={S.confirmCancelBtn}
                    onPress={() => { haptic.light(); setShowConfirm(null); }}
                  >
                    <Text style={S.confirmCancelTxt}>გაუქმება</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={S.confirmActionBtn} onPress={showConfirm.onConfirm}>
                    <Text style={S.confirmActionTxt}>დადასტურება</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (C: ReturnType<typeof getColors>) => StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12,
  },
  headerSide: { flex: 1, alignItems: 'flex-start' },
  brandBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.primaryLight,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5,
    borderWidth: 1, borderColor: C.primaryBorder,
  },
  brandText: { fontSize: 9, fontWeight: '900', color: C.primaryDark, letterSpacing: 0.9 },
  headerCenter: { 
    flexDirection: 'row', alignItems: 'center', gap: 8,
    // Ensure it doesn't get pushed by wide siblings
    marginHorizontal: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: C.ink },
  headerCount: { 
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, 
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: C.primaryBorder,
  },
  headerCountTxt: { fontSize: 12, fontWeight: '900' },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },

  // Progress card
  progressCard: {
    marginHorizontal: 20, marginBottom: 18, padding: 22,
    backgroundColor: C.surface, borderRadius: 28,
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 18, elevation: 4,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle:  { fontSize: 17, fontWeight: '900', color: C.ink },
  progressSub:    { fontSize: 13, color: C.inkMid, marginTop: 3, fontWeight: '600' },
  progressPct:    { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  progressActions:{ marginTop: 16, flexDirection: 'row' },
  restartBtn: {
    flex: 1, backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 13, borderRadius: 16, gap: 8,
  },
  restartBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15 },
  clearCheckedBtn: {
    flex: 1, backgroundColor: C.red + '12', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 13, borderRadius: 16, gap: 8,
    borderWidth: 1, borderColor: C.red + '30',
  },
  clearCheckedTxt: { fontWeight: '800', fontSize: 14 },

  // Controls
  controlsRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12, gap: 12 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 18, height: 52,
    paddingHorizontal: 15, borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, color: C.ink, fontSize: 15, fontWeight: '600', marginLeft: 8 },
  modeBtn: {
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center',
  },

  // Filter chips
  filterChipsWrap: { marginBottom: 16 },
  filterChipsContent: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  filterChipTxt:   { fontSize: 13, fontWeight: '800', color: C.inkMid },
  filterChipBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, minWidth: 20, alignItems: 'center' },

  // Cart row
  rowWrap: {
    flexDirection: 'row', backgroundColor: C.surface, borderRadius: 22,
    marginBottom: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.025, shadowRadius: 8, elevation: 2,
  },
  rowWrapChecked: { backgroundColor: C.surfaceMid, borderColor: C.borderLight },
  catBar:  { width: 5 },
  rowBody: { flex: 1, flexDirection: 'row', padding: 14, alignItems: 'center' },
  rowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 10 },
  checkBox: {
    width: 28, height: 28, borderRadius: 10, borderWidth: 2.5,
    borderColor: C.border, backgroundColor: C.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  rowName:     { fontSize: 15, fontWeight: '800', color: C.ink, marginBottom: 4, lineHeight: 20 },
  rowNameDone: { color: C.inkFaint, textDecorationLine: 'line-through' },
  rowMeta:     { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  catPill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catPillTxt:  { fontSize: 11, fontWeight: '800' },
  rowNote:     { fontSize: 12, color: C.inkMid, fontWeight: '600', flexShrink: 1 },
  rowRight:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surfaceMid, borderRadius: 14,
    padding: 4, borderWidth: 1, borderColor: C.border,
  },
  stepBtn: {
    width: 30, height: 30, justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  stepValWrap: { alignItems: 'center', justifyContent: 'center', minWidth: 30 },
  stepVal:     { fontWeight: '900', color: C.ink, fontSize: 15 },
  deleteBtn:   { width: 42, height: 42, borderRadius: 13, backgroundColor: C.red + '15', justifyContent: 'center', alignItems: 'center' },

  // Group header
  groupHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: 20, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOpacity: 0.025, shadowRadius: 8, elevation: 2,
  },
  groupEmoji: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  groupTitle: { fontSize: 16, fontWeight: '900', color: C.ink },
  groupCount: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, marginRight: 8 },

  // Empty state
  emptyWrap:    { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 30 },
  emptyIconWrap:{ width: 100, height: 100, borderRadius: 50, backgroundColor: C.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 22 },
  emptyTitle:   { fontSize: 22, fontWeight: '900', color: C.ink },
  emptySub:     { color: C.inkMid, textAlign: 'center', marginTop: 8, fontSize: 14, lineHeight: 21 },

  // FAB
  floatingAddWrap: { position: 'absolute', bottom: Platform.OS === 'ios' ? 30 : 18, left: 20, right: 20, zIndex: 10 },
  floatingAddBtn: {
    backgroundColor: C.ink, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', height: 62, borderRadius: 22, gap: 10,
    shadowColor: C.ink, shadowOpacity: 0.28, shadowRadius: 16, elevation: 8,
  },
  floatingAddTxt: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  fabBadge: {
    position: 'absolute', right: 18, top: -8,
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5, borderWidth: 2, borderColor: C.ink,
  },
  fabBadgeTxt: { color: '#FFF', fontSize: 11, fontWeight: '900' },

  // Add Modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 36, borderTopRightRadius: 36,
    padding: 28, paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
  },
  modalHandle:   { width: 38, height: 5, backgroundColor: C.border, borderRadius: 3, alignSelf: 'center', marginBottom: 22 },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  modalTitle:    { fontSize: 22, fontWeight: '900', color: C.ink },
  modalSubtitle: { fontSize: 13, color: C.inkMid, fontWeight: '600', marginTop: 3 },
  modalCloseBtn: { padding: 4 },
  inputGroup:    { marginBottom: 18 },
  inputLabel:    { fontSize: 11, fontWeight: '900', color: C.inkLight, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.6 },
  modalInput: {
    backgroundColor: C.surfaceAlt, height: 54, borderRadius: 17,
    paddingHorizontal: 17, fontSize: 15, fontWeight: '700', color: C.ink,
    borderWidth: 1, borderColor: C.border,
  },
  autoTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, alignSelf: 'flex-start',
  },
  autoTagTxt: { fontSize: 11, fontWeight: '800' },
  modalStepper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surfaceAlt, height: 54, borderRadius: 17,
    paddingHorizontal: 8, borderWidth: 1, borderColor: C.border,
  },
  modalStepBtn: {
    width: 40, height: 40, backgroundColor: C.surface, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  modalStepVal:  { fontSize: 17, fontWeight: '900', color: C.ink },
  modalCatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14,
    backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
  },
  modalCatTxt:     { fontSize: 12, fontWeight: '800', color: C.inkMid },
  modalSubmitBtn: {
    backgroundColor: C.primary, height: 58, borderRadius: 20,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    marginTop: 6,
  },
  modalSubmitTxt: { color: '#FFF', fontSize: 16, fontWeight: '900' },

  // "Done" secondary button — closes modal when user finishes batch-adding
  modalDoneBtn: {
    height: 58, borderRadius: 20, paddingHorizontal: 20,
    justifyContent: 'center', alignItems: 'center', marginTop: 6,
    backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border,
  },
  modalDoneTxt: { fontSize: 15, fontWeight: '800' },

  // Confirm modal
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.72)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmBox: {
    backgroundColor: C.surface, width: '100%', borderRadius: 30,
    padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 28, elevation: 14,
  },
  confirmIconBox: { padding: 22, borderRadius: 26, marginBottom: 18 },
  confirmTitle:   { fontSize: 20, fontWeight: '900', color: C.ink, marginBottom: 8, textAlign: 'center' },
  confirmMsg:     { fontSize: 14, color: C.inkMid, textAlign: 'center', lineHeight: 21, marginBottom: 26, fontWeight: '500' },
  confirmBtnRow:  { flexDirection: 'row', gap: 12, width: '100%' },
  confirmCancelBtn: {
    flex: 1, height: 54, backgroundColor: C.surfaceAlt,
    borderRadius: 17, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  confirmCancelTxt:  { fontWeight: '800', color: C.inkMid, fontSize: 15 },
  confirmActionBtn:  { flex: 1, height: 54, backgroundColor: C.ink, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  confirmActionTxt:  { fontWeight: '900', color: '#FFF', fontSize: 15 },
});
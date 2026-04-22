/**
 * useCartStore — Centralized cart state using Zustand + AsyncStorage persist.
 * All screens (fridge, scanner, diary) can call addItem() without touching AsyncStorage directly.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CartCategory = 'produce' | 'protein' | 'dairy' | 'grains' | 'other';

export interface CartItem {
  id: string;
  name: string;
  note: string;
  quantity: number;
  category: CartCategory;
  checked: boolean;
  addedAt: number; // timestamp for stable sort
}

interface CartState {
  items: CartItem[];
  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'addedAt'>) => void;
  addManyItems: (items: Omit<CartItem, 'id' | 'addedAt'>[]) => void;
  toggleCheck: (id: string) => void;
  increment: (id: string) => void;
  decrement: (id: string) => boolean; // returns true if deleted
  removeItem: (id: string) => void;
  clearAll: () => void;
  clearChecked: () => void;
  restartList: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** Merge duplicate names by summing their quantities. Keeps first occurrence's metadata. */
const mergeDuplicates = (items: CartItem[]): CartItem[] => {
  const map = new Map<string, CartItem>();
  for (const item of items) {
    const key = item.name.trim().toLowerCase();
    if (map.has(key)) {
      const existing = map.get(key)!;
      map.set(key, { ...existing, quantity: existing.quantity + item.quantity });
    } else {
      map.set(key, { ...item, quantity: item.quantity });
    }
  }
  return Array.from(map.values());
};

// ─── Smart Category Guesser ───────────────────────────────────────────────────

const SMART_MAP: Record<string, CartCategory> = {
  // Dairy
  'რძე': 'dairy', 'ყველი': 'dairy', 'იოგურტი': 'dairy', 'ხაჭო': 'dairy',
  'კარაქი': 'dairy', 'არაჟანი': 'dairy', 'კვერცხი': 'dairy', 'მაწონი': 'dairy',
  // Protein
  'ქათამი': 'protein', 'ხორცი': 'protein', 'თევზი': 'protein', 'საქონელი': 'protein',
  'ღორი': 'protein', 'სოსისი': 'protein', 'ინდაური': 'protein', 'ორაგული': 'protein',
  // Produce
  'ვაშლი': 'produce', 'კიტრი': 'produce', 'პომიდორი': 'produce', 'ხილი': 'produce',
  'ბოსტნეული': 'produce', 'ბანანი': 'produce', 'სტაფილო': 'produce', 'ბროკოლი': 'produce',
  'ისპანახი': 'produce', 'ავოკადო': 'produce', 'ხახვი': 'produce', 'ნიორი': 'produce',
  // Grains
  'პური': 'grains', 'ბრინჯი': 'grains', 'წიწიბურა': 'grains', 'მაკარონი': 'grains',
  'შვრია': 'grains', 'ფქვილი': 'grains', 'კინოა': 'grains', 'ლავაში': 'grains',
};

export const guessCategory = (name: string): CartCategory => {
  const n = name.toLowerCase();
  for (const [key, cat] of Object.entries(SMART_MAP)) {
    if (n.includes(key)) return cat;
  }
  return 'other';
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const item: CartItem = {
          ...newItem,
          id: uid(),
          addedAt: Date.now(),
          quantity: newItem.quantity || 1,
        };
        set((state) => ({
          items: mergeDuplicates([...state.items, item]),
        }));
      },

      addManyItems: (newItems) => {
        const stamped: CartItem[] = newItems.map((i) => ({
          ...i,
          id: uid(),
          addedAt: Date.now(),
          quantity: i.quantity || 1,
        }));
        set((state) => ({
          items: mergeDuplicates([...state.items, ...stamped]),
        }));
      },

      toggleCheck: (id) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, checked: !i.checked } : i
          ),
        })),

      increment: (id) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        })),

      decrement: (id) => {
        const item = get().items.find((i) => i.id === id);
        if (!item) return false;
        if (item.quantity <= 1) {
          set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
          return true; // deleted
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: i.quantity - 1 } : i
          ),
        }));
        return false;
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      clearChecked: () =>
        set((state) => ({ items: state.items.filter((i) => !i.checked) })),

      clearAll: () => set({ items: [] }),

      restartList: () =>
        set((state) => ({
          items: state.items.map((i) => ({ ...i, checked: false })),
        })),
    }),
    {
      name: 'geofit-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

import { useSyncExternalStore } from "react";

export interface KioskCartItem {
  id: string;
  menuItemId: string;
  name: string;
  nameZh?: string;
  price: number;
  quantity: number;
  modifiers: { name: string; price: number }[];
  comboItems?: { name: string; groupName: string }[];
  notes?: string;
}

export interface KioskState {
  cart: KioskCartItem[];
  collectionCounter: number;
  lastResetDate: string;
}

type Listener = () => void;

const today = () => new Date().toISOString().slice(0, 10);

let state: KioskState = {
  cart: [],
  collectionCounter: 0,
  lastResetDate: today(),
};

const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: Listener) => { listeners.add(l); return () => listeners.delete(l); };

export const useKioskStore = () => useSyncExternalStore(subscribe, () => state, () => state);

const ensureDailyReset = () => {
  if (state.lastResetDate !== today()) {
    state = { ...state, collectionCounter: 0, lastResetDate: today() };
  }
};

export const addToKioskCart = (item: Omit<KioskCartItem, "id">) => {
  const id = `ki-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  state = { ...state, cart: [...state.cart, { ...item, id }] };
  emit();
};

export const updateKioskCartQty = (id: string, delta: number) => {
  state = {
    ...state,
    cart: state.cart.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i).filter(i => i.quantity > 0),
  };
  emit();
};

export const removeFromKioskCart = (id: string) => {
  state = { ...state, cart: state.cart.filter(i => i.id !== id) };
  emit();
};

export const clearKioskCart = () => {
  state = { ...state, cart: [] };
  emit();
};

export const getNextCollectionNumber = (): string => {
  ensureDailyReset();
  state = { ...state, collectionCounter: state.collectionCounter + 1 };
  emit();
  return `A${String(state.collectionCounter).padStart(3, "0")}`;
};

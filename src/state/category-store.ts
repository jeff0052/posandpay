import { useSyncExternalStore } from "react";

export interface Category {
  id: string;
  name: string;
  nameZh?: string;
  sortOrder: number;
}

type Listener = () => void;

let categories: Category[] = [
  { id: "cat-popular", name: "Popular", nameZh: "热门", sortOrder: 0 },
  { id: "cat-combos", name: "Combos", nameZh: "套餐", sortOrder: 1 },
  { id: "cat-starters", name: "Starters", nameZh: "前菜", sortOrder: 2 },
  { id: "cat-mains", name: "Mains", nameZh: "主菜", sortOrder: 3 },
  { id: "cat-noodles", name: "Noodles", nameZh: "面食", sortOrder: 4 },
  { id: "cat-rice", name: "Rice", nameZh: "饭类", sortOrder: 5 },
  { id: "cat-sides", name: "Sides", nameZh: "小食", sortOrder: 6 },
  { id: "cat-desserts", name: "Desserts", nameZh: "甜品", sortOrder: 7 },
  { id: "cat-beverages", name: "Beverages", nameZh: "饮料", sortOrder: 8 },
  { id: "cat-alcohol", name: "Alcohol", nameZh: "酒类", sortOrder: 9 },
];

const SYSTEM_CATEGORIES = ["cat-popular", "cat-combos"];

const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: Listener) => { listeners.add(l); return () => listeners.delete(l); };

export const useCategories = () => useSyncExternalStore(subscribe, () => categories, () => categories);
export const getCategoriesSnapshot = () => categories;

export const addCategory = (cat: Omit<Category, "id" | "sortOrder">) => {
  const id = `cat-${Date.now()}`;
  const sortOrder = categories.length;
  categories = [...categories, { ...cat, id, sortOrder }];
  emit();
};

export const updateCategory = (id: string, updates: Partial<Omit<Category, "id">>) => {
  categories = categories.map(c => c.id === id ? { ...c, ...updates } : c);
  emit();
};

export const deleteCategory = (id: string) => {
  if (SYSTEM_CATEGORIES.includes(id)) return; // can't delete system categories
  categories = categories.filter(c => c.id !== id);
  emit();
};

export const isSystemCategory = (id: string) => SYSTEM_CATEGORIES.includes(id);

export const moveCategoryUp = (id: string) => {
  const idx = categories.findIndex(c => c.id === id);
  if (idx <= 0) return;
  const arr = [...categories];
  [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
  categories = arr.map((c, i) => ({ ...c, sortOrder: i }));
  emit();
};

export const moveCategoryDown = (id: string) => {
  const idx = categories.findIndex(c => c.id === id);
  if (idx < 0 || idx >= categories.length - 1) return;
  const arr = [...categories];
  [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
  categories = arr.map((c, i) => ({ ...c, sortOrder: i }));
  emit();
};

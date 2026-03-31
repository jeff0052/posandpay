import { useSyncExternalStore } from "react";

export interface RecipeIngredient {
  inventoryItemId: string;
  quantity: number;
  unit: string;
}

type Listener = () => void;

// Map from menuItemId to ingredients list
let recipes: Record<string, RecipeIngredient[]> = {
  // Satay (10pc)
  "m4": [
    { inventoryItemId: "inv-1", quantity: 100, unit: "g" },  // Pork
    { inventoryItemId: "inv-5", quantity: 20, unit: "g" },   // Cucumber
    { inventoryItemId: "inv-6", quantity: 30, unit: "g" },   // Onion
    { inventoryItemId: "inv-7", quantity: 5, unit: "g" },    // Turmeric
    { inventoryItemId: "inv-8", quantity: 10, unit: "ml" },  // Peanut Sauce
  ],
  // Chicken Rice
  "m1": [
    { inventoryItemId: "inv-2", quantity: 200, unit: "g" },  // Chicken
    { inventoryItemId: "inv-3", quantity: 150, unit: "g" },  // Rice
    { inventoryItemId: "inv-9", quantity: 10, unit: "g" },   // Ginger
    { inventoryItemId: "inv-10", quantity: 5, unit: "g" },   // Garlic
    { inventoryItemId: "inv-11", quantity: 5, unit: "ml" },  // Sesame Oil
  ],
  // Laksa
  "m2": [
    { inventoryItemId: "inv-12", quantity: 100, unit: "g" },  // Noodles
    { inventoryItemId: "inv-4", quantity: 50, unit: "g" },    // Shrimp
    { inventoryItemId: "inv-13", quantity: 200, unit: "ml" }, // Coconut Milk
    { inventoryItemId: "inv-14", quantity: 20, unit: "g" },   // Laksa Paste
    { inventoryItemId: "inv-15", quantity: 10, unit: "g" },   // Beansprouts
  ],
  // Bak Kut Teh
  "m13": [
    { inventoryItemId: "inv-1", quantity: 300, unit: "g" },   // Pork
    { inventoryItemId: "inv-10", quantity: 10, unit: "g" },   // Garlic
    { inventoryItemId: "inv-16", quantity: 5, unit: "g" },    // Pepper
    { inventoryItemId: "inv-17", quantity: 3, unit: "g" },    // Star Anise
  ],
};

const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: Listener) => { listeners.add(l); return () => listeners.delete(l); };

export const useRecipe = (menuItemId: string) =>
  useSyncExternalStore(subscribe, () => recipes[menuItemId] || [], () => recipes[menuItemId] || []);

export const useAllRecipes = () =>
  useSyncExternalStore(subscribe, () => recipes, () => recipes);

export const getAllRecipesSnapshot = () => recipes;

export const setRecipe = (menuItemId: string, ingredients: RecipeIngredient[]) => {
  recipes = { ...recipes, [menuItemId]: ingredients };
  emit();
};

export const deleteRecipe = (menuItemId: string) => {
  const { [menuItemId]: _, ...rest } = recipes;
  recipes = rest;
  emit();
};

export const getLinkedMenuItems = (inventoryItemId: string): string[] => {
  return Object.entries(recipes)
    .filter(([_, ingredients]) => ingredients.some(i => i.inventoryItemId === inventoryItemId))
    .map(([menuItemId]) => menuItemId);
};

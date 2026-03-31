import { useSyncExternalStore } from "react";

export interface InventoryItem {
  id: string;
  name: string;
  nameZh?: string;
  sku?: string;
  category: "raw_ingredients" | "packaging" | "beverages" | "supplies";
  unit: "kg" | "L" | "pcs" | "box" | "pack" | "bottle";
  currentStock: number;
  reorderPoint: number;
  costPerUnit: number;
  supplier?: string;
  lastRestocked?: string;
  expiryDate?: string;
}

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  type: "receive" | "waste" | "transfer" | "sale" | "adjustment";
  quantity: number;
  reason?: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  status: "draft" | "ordered" | "received" | "cancelled";
  expectedDelivery?: string;
  notes?: string;
  totalCost: number;
  items: { inventoryItemId: string; quantity: number; unitCost: number }[];
  createdAt: string;
}

type Listener = () => void;

// Mock data — inv-1 through inv-17 are recipe ingredients (matched by recipe-store)
const initialItems: InventoryItem[] = [
  // === Raw Ingredients (recipe system) ===
  { id: "inv-1", name: "Pork Belly", nameZh: "五花肉", sku: "PORK-001", category: "raw_ingredients", unit: "kg", currentStock: 25, reorderPoint: 10, costPerUnit: 12.50, supplier: "Ang Mo Kio Meat Supply", lastRestocked: "2026-03-28", expiryDate: "2026-04-10" },
  { id: "inv-2", name: "Chicken (Whole)", nameZh: "全鸡", sku: "CHKN-001", category: "raw_ingredients", unit: "kg", currentStock: 30, reorderPoint: 15, costPerUnit: 8.00, supplier: "Fresh Poultry SG", lastRestocked: "2026-03-29", expiryDate: "2026-04-05" },
  { id: "inv-3", name: "Jasmine Rice", nameZh: "茉莉香米", sku: "RICE-001", category: "raw_ingredients", unit: "kg", currentStock: 50, reorderPoint: 20, costPerUnit: 3.20, supplier: "Golden Grain Trading", lastRestocked: "2026-03-25" },
  { id: "inv-4", name: "Fresh Prawns", nameZh: "鲜虾", sku: "PRWN-001", category: "raw_ingredients", unit: "kg", currentStock: 8, reorderPoint: 5, costPerUnit: 18.00, supplier: "Jurong Fishery Port", lastRestocked: "2026-03-30", expiryDate: "2026-04-02" },
  { id: "inv-5", name: "Cucumber", nameZh: "黄瓜", sku: "CUCM-001", category: "raw_ingredients", unit: "kg", currentStock: 5, reorderPoint: 3, costPerUnit: 2.80, supplier: "Farm Fresh Vegetables", lastRestocked: "2026-03-30", expiryDate: "2026-04-06" },
  { id: "inv-6", name: "Onion", nameZh: "洋葱", sku: "OION-001", category: "raw_ingredients", unit: "kg", currentStock: 10, reorderPoint: 5, costPerUnit: 2.50, supplier: "Farm Fresh Vegetables", lastRestocked: "2026-03-27", expiryDate: "2026-04-20" },
  { id: "inv-7", name: "Turmeric Powder", nameZh: "姜黄粉", sku: "TURM-001", category: "raw_ingredients", unit: "kg", currentStock: 2, reorderPoint: 1, costPerUnit: 15.00, supplier: "Spice World Trading", lastRestocked: "2026-03-20", expiryDate: "2026-09-20" },
  { id: "inv-8", name: "Peanut Sauce", nameZh: "花生酱", sku: "PNUT-001", category: "raw_ingredients", unit: "L", currentStock: 5, reorderPoint: 3, costPerUnit: 8.50, supplier: "Ang Mo Kio Meat Supply", lastRestocked: "2026-03-26", expiryDate: "2026-06-26" },
  { id: "inv-9", name: "Ginger", nameZh: "生姜", sku: "GNGR-001", category: "raw_ingredients", unit: "kg", currentStock: 3, reorderPoint: 2, costPerUnit: 6.00, supplier: "Farm Fresh Vegetables", lastRestocked: "2026-03-28", expiryDate: "2026-04-15" },
  { id: "inv-10", name: "Garlic", nameZh: "大蒜", sku: "GRLC-001", category: "raw_ingredients", unit: "kg", currentStock: 4, reorderPoint: 2, costPerUnit: 5.50, supplier: "Farm Fresh Vegetables", lastRestocked: "2026-03-27", expiryDate: "2026-04-20" },
  { id: "inv-11", name: "Sesame Oil", nameZh: "麻油", sku: "SSMO-001", category: "raw_ingredients", unit: "L", currentStock: 3, reorderPoint: 2, costPerUnit: 12.00, supplier: "Golden Grain Trading", lastRestocked: "2026-03-22", expiryDate: "2026-12-22" },
  { id: "inv-12", name: "Rice Noodles", nameZh: "米粉", sku: "NDLS-001", category: "raw_ingredients", unit: "kg", currentStock: 15, reorderPoint: 8, costPerUnit: 4.00, supplier: "Golden Grain Trading", lastRestocked: "2026-03-24", expiryDate: "2026-09-24" },
  { id: "inv-13", name: "Coconut Milk", nameZh: "椰奶", sku: "COCO-001", category: "raw_ingredients", unit: "L", currentStock: 12, reorderPoint: 6, costPerUnit: 4.80, supplier: "Golden Grain Trading", lastRestocked: "2026-03-25", expiryDate: "2026-07-25" },
  { id: "inv-14", name: "Laksa Paste", nameZh: "叻沙酱", sku: "LKSA-001", category: "raw_ingredients", unit: "kg", currentStock: 3, reorderPoint: 2, costPerUnit: 20.00, supplier: "Spice World Trading", lastRestocked: "2026-03-20", expiryDate: "2026-06-20" },
  { id: "inv-15", name: "Bean Sprouts", nameZh: "豆芽", sku: "BEAN-001", category: "raw_ingredients", unit: "kg", currentStock: 4, reorderPoint: 3, costPerUnit: 2.50, supplier: "Farm Fresh Vegetables", lastRestocked: "2026-03-30", expiryDate: "2026-04-03" },
  { id: "inv-16", name: "White Pepper", nameZh: "白胡椒", sku: "WPPR-001", category: "raw_ingredients", unit: "kg", currentStock: 1.5, reorderPoint: 1, costPerUnit: 25.00, supplier: "Spice World Trading", lastRestocked: "2026-03-15", expiryDate: "2027-03-15" },
  { id: "inv-17", name: "Star Anise", nameZh: "八角", sku: "STAR-001", category: "raw_ingredients", unit: "kg", currentStock: 0.5, reorderPoint: 0.3, costPerUnit: 30.00, supplier: "Spice World Trading", lastRestocked: "2026-03-15", expiryDate: "2027-03-15" },

  // === Packaging ===
  { id: "inv-20", name: "Takeaway Box (M)", nameZh: "外卖盒 (中)", sku: "PKG-001", category: "packaging", unit: "pcs", currentStock: 200, reorderPoint: 100, costPerUnit: 0.15, supplier: "Pack & Go", lastRestocked: "2026-03-18" },
  { id: "inv-21", name: "Plastic Bags", nameZh: "塑料袋", sku: "PKG-002", category: "packaging", unit: "pcs", currentStock: 500, reorderPoint: 200, costPerUnit: 0.05, supplier: "Pack & Go", lastRestocked: "2026-03-18" },

  // === Beverages ===
  { id: "inv-30", name: "Tiger Beer 330ml", nameZh: "虎牌啤酒 330ml", sku: "BEV-001", category: "beverages", unit: "bottle", currentStock: 48, reorderPoint: 24, costPerUnit: 3.50, supplier: "APB Distributors", lastRestocked: "2026-03-24" },

  // === Supplies ===
  { id: "inv-40", name: "Napkins", nameZh: "纸巾", sku: "SUP-001", category: "supplies", unit: "pack", currentStock: 30, reorderPoint: 15, costPerUnit: 1.20, supplier: "Clean Co", lastRestocked: "2026-03-22" },
  { id: "inv-41", name: "Soy Sauce", nameZh: "酱油", sku: "SOYO-001", category: "raw_ingredients", unit: "L", currentStock: 12, reorderPoint: 5, costPerUnit: 3.80, supplier: "Kikkoman SG", lastRestocked: "2026-03-20", expiryDate: "2027-03-20" },
];

const initialMovements: StockMovement[] = [
  { id: "mv-1", inventoryItemId: "inv-1", type: "receive", quantity: 15, reason: "Weekly pork delivery", createdAt: "2026-03-28T06:30:00Z" },
  { id: "mv-2", inventoryItemId: "inv-2", type: "receive", quantity: 20, reason: "Weekly chicken delivery", createdAt: "2026-03-29T07:00:00Z" },
  { id: "mv-3", inventoryItemId: "inv-4", type: "receive", quantity: 5, reason: "Fresh prawn delivery", createdAt: "2026-03-30T05:45:00Z" },
  { id: "mv-4", inventoryItemId: "inv-15", type: "waste", quantity: -1.5, reason: "Wilted", notes: "Bean sprouts past prime", createdAt: "2026-03-29T08:00:00Z" },
  { id: "mv-5", inventoryItemId: "inv-13", type: "sale", quantity: -3, reason: "Daily laksa prep", createdAt: "2026-03-30T09:00:00Z" },
  { id: "mv-6", inventoryItemId: "inv-3", type: "sale", quantity: -8, reason: "Lunch service rice usage", createdAt: "2026-03-30T14:00:00Z" },
  { id: "mv-7", inventoryItemId: "inv-12", type: "sale", quantity: -4, reason: "Laksa noodle prep", createdAt: "2026-03-30T10:00:00Z" },
  { id: "mv-8", inventoryItemId: "inv-14", type: "sale", quantity: -0.5, reason: "Laksa paste used for lunch batch", createdAt: "2026-03-30T09:30:00Z" },
  { id: "mv-9", inventoryItemId: "inv-6", type: "sale", quantity: -2, reason: "Satay onion prep", createdAt: "2026-03-29T10:00:00Z" },
  { id: "mv-10", inventoryItemId: "inv-20", type: "sale", quantity: -35, reason: "Takeaway orders", createdAt: "2026-03-30T21:00:00Z" },
  { id: "mv-11", inventoryItemId: "inv-7", type: "adjustment", quantity: -0.1, reason: "Inventory count correction", notes: "Physical count lower than system", createdAt: "2026-03-28T17:00:00Z" },
  { id: "mv-12", inventoryItemId: "inv-1", type: "sale", quantity: -6, reason: "Bak kut teh + satay pork usage", createdAt: "2026-03-30T20:00:00Z" },
];

const initialPOs: PurchaseOrder[] = [
  { id: "po-1", supplier: "Ang Mo Kio Meat Supply", status: "ordered", expectedDelivery: "2026-04-01", totalCost: 312.50, items: [{ inventoryItemId: "inv-1", quantity: 20, unitCost: 12.50 }, { inventoryItemId: "inv-8", quantity: 5, unitCost: 8.50 }], createdAt: "2026-03-28T09:00:00Z" },
  { id: "po-2", supplier: "Spice World Trading", status: "draft", totalCost: 115.00, items: [{ inventoryItemId: "inv-14", quantity: 3, unitCost: 20.00 }, { inventoryItemId: "inv-7", quantity: 1, unitCost: 15.00 }, { inventoryItemId: "inv-16", quantity: 1, unitCost: 25.00 }], createdAt: "2026-03-29T11:00:00Z" },
  { id: "po-3", supplier: "Farm Fresh Vegetables", status: "received", totalCost: 46.80, items: [{ inventoryItemId: "inv-5", quantity: 4, unitCost: 2.80 }, { inventoryItemId: "inv-6", quantity: 6, unitCost: 2.50 }, { inventoryItemId: "inv-15", quantity: 5, unitCost: 2.50 }], createdAt: "2026-03-27T08:00:00Z", notes: "Received in full" },
  { id: "po-4", supplier: "Jurong Fishery Port", status: "ordered", expectedDelivery: "2026-04-02", totalCost: 180.00, items: [{ inventoryItemId: "inv-4", quantity: 10, unitCost: 18.00 }], createdAt: "2026-03-30T06:00:00Z" },
  { id: "po-5", supplier: "Golden Grain Trading", status: "ordered", expectedDelivery: "2026-04-03", totalCost: 144.00, items: [{ inventoryItemId: "inv-3", quantity: 25, unitCost: 3.20 }, { inventoryItemId: "inv-12", quantity: 10, unitCost: 4.00 }, { inventoryItemId: "inv-13", quantity: 6, unitCost: 4.80 }], createdAt: "2026-03-30T10:00:00Z" },
];

let itemsState = [...initialItems];
let movementsState = [...initialMovements];
let posState = [...initialPOs];
const listeners = new Set<Listener>();

const emit = () => listeners.forEach(l => l());
const subscribe = (l: Listener) => { listeners.add(l); return () => listeners.delete(l); };

export const useInventoryItems = () => useSyncExternalStore(subscribe, () => itemsState, () => itemsState);
export const useStockMovements = () => useSyncExternalStore(subscribe, () => movementsState, () => movementsState);
export const usePurchaseOrders = () => useSyncExternalStore(subscribe, () => posState, () => posState);

export const adjustStock = (itemId: string, quantity: number, type: StockMovement["type"], reason?: string, notes?: string) => {
  itemsState = itemsState.map(i => i.id === itemId ? { ...i, currentStock: Math.max(0, i.currentStock + quantity) } : i);
  movementsState = [{ id: `mv-${Date.now()}`, inventoryItemId: itemId, type, quantity, reason, notes, createdAt: new Date().toISOString() }, ...movementsState];
  emit();
};

export const addPurchaseOrder = (po: PurchaseOrder) => {
  posState = [po, ...posState];
  emit();
};

export const updatePOStatus = (poId: string, status: PurchaseOrder["status"]) => {
  posState = posState.map(p => p.id === poId ? { ...p, status } : p);
  if (status === "received") {
    const po = posState.find(p => p.id === poId);
    po?.items.forEach(item => {
      adjustStock(item.inventoryItemId, item.quantity, "receive", "Purchase order received");
    });
  }
  emit();
};

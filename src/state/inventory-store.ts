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

// Mock data
const initialItems: InventoryItem[] = [
  { id: "inv-1", name: "Chicken Thigh", nameZh: "鸡腿", sku: "RAW-001", category: "raw_ingredients", unit: "kg", currentStock: 25, reorderPoint: 10, costPerUnit: 8.50, supplier: "Fresh Farms SG", lastRestocked: "2026-03-25" },
  { id: "inv-2", name: "Jasmine Rice", nameZh: "茉莉香米", sku: "RAW-002", category: "raw_ingredients", unit: "kg", currentStock: 50, reorderPoint: 20, costPerUnit: 2.80, supplier: "Golden Grain Ltd", lastRestocked: "2026-03-20" },
  { id: "inv-3", name: "Coconut Milk", nameZh: "椰奶", sku: "RAW-003", category: "raw_ingredients", unit: "L", currentStock: 8, reorderPoint: 15, costPerUnit: 4.20, supplier: "Tropical Supplies", lastRestocked: "2026-03-22" },
  { id: "inv-4", name: "Takeaway Box (M)", nameZh: "外卖盒 (中)", sku: "PKG-001", category: "packaging", unit: "pcs", currentStock: 200, reorderPoint: 100, costPerUnit: 0.15, supplier: "Pack & Go", lastRestocked: "2026-03-18" },
  { id: "inv-5", name: "Tiger Beer 330ml", nameZh: "虎牌啤酒 330ml", sku: "BEV-001", category: "beverages", unit: "bottle", currentStock: 48, reorderPoint: 24, costPerUnit: 3.50, supplier: "APB Distributors", lastRestocked: "2026-03-24" },
  { id: "inv-6", name: "Laksa Paste", nameZh: "叻沙酱", sku: "RAW-004", category: "raw_ingredients", unit: "kg", currentStock: 3, reorderPoint: 5, costPerUnit: 12.00, supplier: "Spice World", lastRestocked: "2026-03-15", expiryDate: "2026-06-15" },
  { id: "inv-7", name: "Fresh Prawns", nameZh: "鲜虾", sku: "RAW-005", category: "raw_ingredients", unit: "kg", currentStock: 5, reorderPoint: 8, costPerUnit: 22.00, supplier: "Ocean Fresh", lastRestocked: "2026-03-28", expiryDate: "2026-04-01" },
  { id: "inv-8", name: "Napkins", nameZh: "纸巾", sku: "SUP-001", category: "supplies", unit: "pack", currentStock: 30, reorderPoint: 15, costPerUnit: 1.20, supplier: "Clean Co" },
  { id: "inv-9", name: "Soy Sauce", nameZh: "酱油", sku: "RAW-006", category: "raw_ingredients", unit: "L", currentStock: 12, reorderPoint: 5, costPerUnit: 3.80, supplier: "Kikkoman SG" },
  { id: "inv-10", name: "Plastic Bags", nameZh: "塑料袋", sku: "PKG-002", category: "packaging", unit: "pcs", currentStock: 500, reorderPoint: 200, costPerUnit: 0.05, supplier: "Pack & Go" },
];

const initialMovements: StockMovement[] = [
  { id: "mv-1", inventoryItemId: "inv-1", type: "receive", quantity: 15, reason: "Regular order", createdAt: "2026-03-25T10:00:00Z" },
  { id: "mv-2", inventoryItemId: "inv-6", type: "waste", quantity: -2, reason: "Expired", notes: "Past expiry date", createdAt: "2026-03-26T08:00:00Z" },
  { id: "mv-3", inventoryItemId: "inv-7", type: "receive", quantity: 10, reason: "Fresh delivery", createdAt: "2026-03-28T06:00:00Z" },
  { id: "mv-4", inventoryItemId: "inv-3", type: "sale", quantity: -5, reason: "Daily usage", createdAt: "2026-03-28T20:00:00Z" },
];

const initialPOs: PurchaseOrder[] = [
  { id: "po-1", supplier: "Fresh Farms SG", status: "ordered", expectedDelivery: "2026-04-01", totalCost: 170.00, items: [{ inventoryItemId: "inv-1", quantity: 20, unitCost: 8.50 }], createdAt: "2026-03-28T09:00:00Z" },
  { id: "po-2", supplier: "Spice World", status: "draft", totalCost: 60.00, items: [{ inventoryItemId: "inv-6", quantity: 5, unitCost: 12.00 }], createdAt: "2026-03-29T11:00:00Z" },
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

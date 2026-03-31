/**
 * Shared KDS mock data — used by both KitchenDisplay (/kds) and AdminKDS (/admin/kds).
 *
 * Data model: KDSTicket represents one order item.
 * UI groups tickets by orderId to show order-based cards (multiple items per card).
 *
 * Scenarios covered:
 * - ORD-2404: Multi-item dine-in with "serve together" note, mixed modifiers/notes
 * - ORD-2409: Private room party, combo meal + individual items, special dietary
 * - ORD-2405: Delivery order, multiple items, no table
 * - ORD-2402: Simple dine-in, ready for pickup
 * - ORD-2406: Single item, just arrived
 * - ORD-2411: Takeaway order with heavy customization
 * - ORD-2412: Kiosk order, combo with selections
 */

export interface KDSTicket {
  id: string;
  name: string;
  quantity: number;
  status: "new" | "preparing" | "ready" | "served";
  notes?: string | null;
  fired_at?: string;
  modifiers?: { name: string; price: number }[];
  combo_items?: { name: string; groupName: string }[] | null;
  orderId: string;
  tableNumber?: string | null;
  serviceMode?: string;
  seat?: number;
}

export interface KDSOrder {
  orderId: string;
  tableNumber?: string | null;
  serviceMode: string;
  guestCount?: number;
  orderNote?: string;  // "serve together", "rush", etc.
  firedAt: string;
  items: KDSTicket[];
}

const now = Date.now();
const min = (m: number) => new Date(now - m * 60000).toISOString();

export const MOCK_KDS_TICKETS: KDSTicket[] = [
  // ═══════════════════════════════════════════════════
  // ORD-2404 — Table 12, Dine-in, 4 guests
  // Scenario: Family dinner, requested "all dishes served together"
  // Mixed statuses show real kitchen workflow
  // ═══════════════════════════════════════════════════
  {
    id: "k1", orderId: "ORD-2404", tableNumber: "12", serviceMode: "dine-in",
    name: "Chicken Rice", quantity: 2, status: "new",
    fired_at: min(3),
    modifiers: [{ name: "Steamed Chicken", price: 0 }],
    notes: "⚠️ Serve all dishes together",
    seat: 1,
  },
  {
    id: "k2", orderId: "ORD-2404", tableNumber: "12", serviceMode: "dine-in",
    name: "Laksa", quantity: 1, status: "new",
    fired_at: min(3),
    modifiers: [{ name: "Extra Spicy", price: 0 }, { name: "Add Cockles", price: 2.00 }],
    notes: "No beansprouts — allergy",
    seat: 2,
  },
  {
    id: "k3", orderId: "ORD-2404", tableNumber: "12", serviceMode: "dine-in",
    name: "Bak Kut Teh", quantity: 1, status: "preparing",
    fired_at: min(3),
    modifiers: [{ name: "Peppery Broth", price: 0 }],
    notes: "Less pepper, extra garlic",
    seat: 3,
  },
  {
    id: "k4", orderId: "ORD-2404", tableNumber: "12", serviceMode: "dine-in",
    name: "Teh Tarik", quantity: 3, status: "new",
    fired_at: min(3),
    modifiers: [{ name: "Less Sweet", price: 0 }],
    seat: 0, // shared
  },
  {
    id: "k5", orderId: "ORD-2404", tableNumber: "12", serviceMode: "dine-in",
    name: "Prawn Crackers", quantity: 1, status: "ready",
    fired_at: min(3),
  },

  // ═══════════════════════════════════════════════════
  // ORD-2409 — Table 10, Dine-in, 8 guests (Private Room)
  // Scenario: Birthday party, combo meals + à la carte, dietary restrictions
  // ═══════════════════════════════════════════════════
  {
    id: "k6", orderId: "ORD-2409", tableNumber: "10", serviceMode: "dine-in",
    name: "Satay (10pc)", quantity: 2, status: "new",
    fired_at: min(7),
    modifiers: [{ name: "Extra Peanut Sauce", price: 0 }, { name: "No Cucumber", price: 0 }],
  },
  {
    id: "k7", orderId: "ORD-2409", tableNumber: "10", serviceMode: "dine-in",
    name: "Nasi Lemak Set", quantity: 3, status: "preparing",
    fired_at: min(7),
    combo_items: [
      { name: "Nasi Lemak", groupName: "Main" },
      { name: "Fried Chicken Wing", groupName: "Protein" },
      { name: "Iced Milo", groupName: "Drink" },
    ],
    notes: "1x vegetarian — replace chicken with egg",
  },
  {
    id: "k8", orderId: "ORD-2409", tableNumber: "10", serviceMode: "dine-in",
    name: "Chilli Crab", quantity: 1, status: "preparing",
    fired_at: min(7),
    modifiers: [{ name: "Medium Spicy", price: 0 }, { name: "Extra Mantou x4", price: 4.00 }],
    notes: "Birthday dish — present with candle please 🎂",
  },
  {
    id: "k9", orderId: "ORD-2409", tableNumber: "10", serviceMode: "dine-in",
    name: "Spring Rolls (4pc)", quantity: 2, status: "ready",
    fired_at: min(7),
  },

  // ═══════════════════════════════════════════════════
  // ORD-2405 — Delivery order, no table
  // Scenario: GrabFood delivery with special packaging notes
  // ═══════════════════════════════════════════════════
  {
    id: "k10", orderId: "ORD-2405", tableNumber: null, serviceMode: "delivery",
    name: "Char Kway Teow", quantity: 1, status: "preparing",
    fired_at: min(9),
    modifiers: [{ name: "No Chilli", price: 0 }, { name: "Add Egg", price: 1.00 }],
  },
  {
    id: "k11", orderId: "ORD-2405", tableNumber: null, serviceMode: "delivery",
    name: "Hokkien Mee", quantity: 1, status: "preparing",
    fired_at: min(9),
    modifiers: [{ name: "Extra Sambal", price: 0.50 }],
    notes: "Pack soup separately",
  },
  {
    id: "k12", orderId: "ORD-2405", tableNumber: null, serviceMode: "delivery",
    name: "Teh Tarik", quantity: 2, status: "ready",
    fired_at: min(9),
    notes: "Hot — double cup please",
  },

  // ═══════════════════════════════════════════════════
  // ORD-2402 — Table 7, Dine-in, 2 guests
  // Scenario: Simple couple lunch, all ready for pickup
  // ═══════════════════════════════════════════════════
  {
    id: "k13", orderId: "ORD-2402", tableNumber: "7", serviceMode: "dine-in",
    name: "Chicken Rice", quantity: 1, status: "ready",
    fired_at: min(16),
    modifiers: [{ name: "Roasted Chicken", price: 0 }],
  },
  {
    id: "k14", orderId: "ORD-2402", tableNumber: "7", serviceMode: "dine-in",
    name: "Wonton Noodle", quantity: 1, status: "ready",
    fired_at: min(16),
    modifiers: [{ name: "Dry Style", price: 0 }],
    notes: "Extra chilli on the side",
  },

  // ═══════════════════════════════════════════════════
  // ORD-2406 — Table 1, Dine-in, 1 guest
  // Scenario: Solo diner, just placed order (newest)
  // ═══════════════════════════════════════════════════
  {
    id: "k15", orderId: "ORD-2406", tableNumber: "1", serviceMode: "dine-in",
    name: "Fish Head Curry", quantity: 1, status: "new",
    fired_at: min(1),
    modifiers: [{ name: "Medium Spicy", price: 0 }],
  },

  // ═══════════════════════════════════════════════════
  // ORD-2411 — Takeaway, no table
  // Scenario: Customized takeaway with multiple options per item
  // ═══════════════════════════════════════════════════
  {
    id: "k16", orderId: "ORD-2411", tableNumber: null, serviceMode: "takeaway",
    name: "Nasi Lemak Set", quantity: 2, status: "new",
    fired_at: min(4),
    combo_items: [
      { name: "Nasi Lemak", groupName: "Main" },
      { name: "Otah", groupName: "Side" },
      { name: "Teh-O", groupName: "Drink" },
    ],
    notes: "1 set no sambal, 1 set extra sambal",
  },
  {
    id: "k17", orderId: "ORD-2411", tableNumber: null, serviceMode: "takeaway",
    name: "Popiah (2pc)", quantity: 3, status: "new",
    fired_at: min(4),
    modifiers: [{ name: "No Turnip", price: 0 }, { name: "Extra Sauce", price: 0 }],
  },

  // ═══════════════════════════════════════════════════
  // ORD-2412 — Kiosk order, no table
  // Scenario: Self-service kiosk with flex combo selections
  // ═══════════════════════════════════════════════════
  {
    id: "k18", orderId: "ORD-2412", tableNumber: null, serviceMode: "kiosk",
    name: "Value Meal A", quantity: 1, status: "new",
    fired_at: min(11), // urgent — over 10 minutes
    combo_items: [
      { name: "Chicken Rice", groupName: "Main" },
      { name: "Prawn Crackers", groupName: "Side" },
      { name: "Iced Lemon Tea", groupName: "Drink" },
    ],
    modifiers: [{ name: "Upsize Drink", price: 1.00 }],
  },
];

/**
 * Group flat tickets into order-based cards for KDS display.
 */
export function groupTicketsByOrder(tickets: KDSTicket[]): KDSOrder[] {
  const orderMap = new Map<string, KDSOrder>();

  for (const ticket of tickets) {
    let order = orderMap.get(ticket.orderId);
    if (!order) {
      order = {
        orderId: ticket.orderId,
        tableNumber: ticket.tableNumber,
        serviceMode: ticket.serviceMode || "dine-in",
        firedAt: ticket.fired_at || new Date().toISOString(),
        items: [],
      };
      // Detect order-level notes (like "serve together")
      if (ticket.notes?.includes("Serve all") || ticket.notes?.includes("serve together")) {
        order.orderNote = ticket.notes;
      }
      orderMap.set(ticket.orderId, order);
    }
    order.items.push(ticket);
    // Use earliest fired_at
    if (ticket.fired_at && ticket.fired_at < order.firedAt) {
      order.firedAt = ticket.fired_at;
    }
  }

  return Array.from(orderMap.values());
}

/**
 * Get the "worst" status for an order (determines which column it appears in).
 * Priority: new > preparing > ready (if any item is still new, order shows in new column)
 */
export function getOrderStatus(order: KDSOrder): "new" | "preparing" | "ready" {
  const statuses = order.items.map(i => i.status);
  if (statuses.includes("new")) return "new";
  if (statuses.includes("preparing")) return "preparing";
  return "ready";
}

/** Service mode badge labels */
export const SERVICE_MODE_LABELS: Record<string, { en: string; zh: string; color: string }> = {
  "dine-in": { en: "DINE-IN", zh: "堂食", color: "bg-primary/10 text-primary" },
  "delivery": { en: "DELIVERY", zh: "外卖", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  "takeaway": { en: "TAKEAWAY", zh: "外带", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  "kiosk": { en: "KIOSK", zh: "自助", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300" },
  "qr": { en: "QR", zh: "扫码", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
};

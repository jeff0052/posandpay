# Service Flow Mode Design Spec

**Date:** 2026-03-31
**Status:** Draft
**Scope:** Global service flow toggle (Restaurant vs Fast Food) in Admin Settings, affecting Tablet POS and Mobile POS order workflows

## 1. Problem

The POS currently has no configurable distinction between fast-food and restaurant service models. Restaurant mode requires "Send to Kitchen" before dining, with payment after the meal. Fast-food mode requires payment first, then kitchen fires the order. This is a fundamental business logic difference that must be configurable.

## 2. Goals

1. **Admin Setting**: Global toggle in Admin Settings to choose between Restaurant and Fast Food mode
2. **Restaurant Flow**: Order → Send to Kitchen → Dine → Pay
3. **Fast Food Flow**: Order → Pay → Auto-fire to Kitchen → Pickup
4. **Tablet & Mobile POS**: Both respect the global setting and adjust their UI/flow accordingly

## 3. Non-Goals

- Per-table or per-order mode override
- KDS UI changes (already functional as read-only monitor)
- QR/Kiosk flow changes (already have their own payment mode settings)
- Supabase schema migration (mock data mode)
- Mobile POS changes (deferred to follow-up iteration; tablet-first)

## 4. Data Model

### 4.1 Settings Store Extension

Add to `MerchantSettings` in `src/state/settings-store.ts`:

```typescript
export type ServiceFlow = "restaurant" | "fast-food";

interface MerchantSettings {
  // existing fields unchanged
  qrEnabled: boolean;
  qrPaymentMode: "pre-pay" | "post-pay" | "choice";
  kioskEnabled: boolean;
  kioskPaymentMethods: { card: boolean; qr: boolean };
  // new field
  serviceFlow: ServiceFlow;  // default: "restaurant"
}
```

Export the `ServiceFlow` type for use in POS components.

### 4.2 Order State Machine Update

The existing state machine in `src/lib/order-state-machine.ts` must be updated to support fast-food mode's direct `open → paid` transition:

```typescript
const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  open: ["sent", "paid", "void"],  // added "paid" for fast-food flow
  sent: ["preparing", "void"],
  preparing: ["ready", "void"],
  ready: ["served", "void"],
  served: ["paid", "void"],
  paid: [],
  void: [],
};
```

### 4.3 Field Naming Clarification

The in-memory model uses **camelCase** (`OrderItem.firedAt` in `mock-data.ts`). The DB layer uses **snake_case** (`fired_at` in `db-orders.ts`). All handler code must set `firedAt` on OrderItem objects. The DB persistence layer handles the casing conversion.

## 5. Behavior by Mode

### 5.1 Restaurant Mode (default)

| Step | Action | State Changes |
|------|--------|---------------|
| 1. Select table, add items | Items in order | order.status = "open", table.status = "ordering" |
| 2. Click "Send to Kitchen" | Fire to KDS | order.status = "sent", items.firedAt = now, items.status = "new"; if order.tableId: table.status = "ordered" |
| 3. Kitchen prepares | KDS workflow | items.status progression via KDS |
| 4. Click "Pay" | Payment flow | order.status = "paid"; if order.tableId: table.status = "dirty" |

**Note:** Table status changes only apply when `order.tableId` is set (not for walk-in/takeaway/delivery orders without a table).

**CheckPanel behavior:**
- When `order.status === "open"` and order has items: show **"Send to Kitchen"** button (primary blue)
- When `order.status !== "open"` (sent/preparing/ready/served): show **"Pay $XX.XX"** button
- When order has no items: show disabled "Pay $0.00" (current behavior)

### 5.2 Fast Food Mode

| Step | Action | State Changes |
|------|--------|---------------|
| 1. Select table/walk-in, add items | Items in order | order.status = "open", table.status = "ordering" |
| 2. Click "Pay" | Payment flow | order.status = "paid" (direct open→paid) |
| 3. After payment completes | Auto-fire to kitchen | items.firedAt = now, items.status = "new"; if order.tableId: table.status = "dirty" |

**Auto-fire sequence:** After `order.status = "paid"` is set, then set `firedAt` on all items and update item status to `"new"`. Item-level updates are in-memory only (no DB call needed in mock mode). The `updateOrderStatus()` call persists the order status to DB.

**CheckPanel behavior:**
- Always show **"Pay $XX.XX"** button (current behavior, no change)
- After payment: auto-fire happens in the payment complete handler

## 6. UI Changes

### 6.1 Admin Settings Page

**New card** in `AdminSettings.tsx`, placed before the "Ordering Channels" section:

```
┌─────────────────────────────────────────────┐
│ Service Flow                                 │
│ How orders are processed at POS terminals    │
│                                              │
│ ┌─────────────┐  ┌─────────────┐            │
│ │ Restaurant  │  │ Fast Food   │            │
│ │ Order →     │  │ Order →     │            │
│ │ Kitchen →   │  │ Pay →       │            │
│ │ Dine → Pay  │  │ Kitchen →   │            │
│ │             │  │ Pickup      │            │
│ │  Active     │  │             │            │
│ └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────┘
```

- Two selectable cards, active card has primary border + checkmark
- Follows the existing pattern of QR payment mode cards

### 6.2 CheckPanel (Tablet POS)

**Changes to the Totals & Pay section at the bottom of CheckPanel.tsx:**

Current: Always shows "Pay $XX.XX" button.

New conditional:
- `serviceFlow === "restaurant" && order.status === "open" && order.items.length > 0`:
  → Show **"Send to Kitchen"** button (primary, with ChefHat icon)
- `serviceFlow === "restaurant" && order.status !== "open"`:
  → Show **"Pay $XX.XX"** button (current behavior)
- `serviceFlow === "fast-food"`:
  → Show **"Pay $XX.XX"** button always (current behavior, unchanged)

**New prop** for CheckPanel: `serviceFlow: ServiceFlow`
**New callback** for CheckPanel: `onSendToKitchen?: () => void`

### 6.3 TabletPOS Page

**New handler: `handleSendToKitchen`**
- Transitions order status: open → sent (via `canTransition` check)
- Sets `firedAt = new Date().toISOString()` on all items in the current order (in-memory)
- Sets item status to `"new"` on all items
- If `order.tableId`: updates table status ordering → ordered
- Persists order status via `updateOrderStatus()` DB call

**Updated handler: `handlePaymentComplete`**
- In fast-food mode (`serviceFlow === "fast-food"`): after setting order status to "paid", also set `firedAt = new Date().toISOString()` and `status = "new"` on all items (in-memory auto-fire)

### 6.4 Mobile POS

**Deferred to follow-up iteration.** Tablet POS is the priority. Mobile POS will be updated in a subsequent task to mirror the same logic.

## 7. Component Architecture

### Modified Files

| File | Changes |
|------|---------|
| `src/state/settings-store.ts` | Add `serviceFlow: ServiceFlow` field and type export |
| `src/lib/order-state-machine.ts` | Add `"paid"` to valid transitions from `"open"` |
| `src/pages/admin/AdminSettings.tsx` | Add Service Flow card UI section |
| `src/components/tablet/CheckPanel.tsx` | Add `serviceFlow` prop, conditional Send to Kitchen / Pay button |
| `src/pages/TabletPOS.tsx` | Add `handleSendToKitchen`, pass `serviceFlow` to CheckPanel, auto-fire in fast-food payment |
| `src/hooks/useLanguage.tsx` | Add new translation keys |

### No New Files

All changes are modifications to existing components. No new component files needed.

## 8. Localization

Reuse existing `send_to_kitchen` key (already has EN: "Send to Kitchen", ZH: "下单"). Add other new keys:

| Key | EN | ZH |
|-----|----|----|
| serviceFlow | Service Flow | 服务流程 |
| serviceFlowDesc | How orders are processed at POS terminals | POS 终端的订单处理方式 |
| restaurant | Restaurant | 餐厅模式 |
| fastFood | Fast Food | 快餐模式 |
| restaurantDesc | Order → Kitchen → Dine → Pay | 点单 → 出餐 → 用餐 → 付款 |
| fastFoodDesc | Order → Pay → Kitchen → Pickup | 点单 → 付款 → 出餐 → 取餐 |
| orderSent | Order Sent | 已下单 |
| awaitingPayment | Awaiting Payment | 等待付款 |

## 9. Edge Cases

1. **Mode switch with active orders**: Changing mode only affects new orders. Existing open orders continue with their current flow.
2. **Empty order Send to Kitchen**: Button disabled when order has no items (same as current Pay button behavior).
3. **Walk-in orders in restaurant mode**: Send to Kitchen still works — fires items. No table status change since no table is associated (`order.tableId` is undefined).
4. **Takeaway/Delivery in restaurant mode**: These still follow restaurant flow — send to kitchen first, pay when picking up. No table status changes.

## 10. Testing Considerations

- Toggle between modes in Admin Settings, verify CheckPanel button changes
- Restaurant: add items → Send to Kitchen → verify order status "sent" + table "ordered" → Pay
- Fast Food: add items → Pay → verify items auto-fired (firedAt set)
- Mode switch doesn't affect existing open orders
- Walk-in (no table) orders work in both modes
- Verify state machine allows open → paid in fast-food mode

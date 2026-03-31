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

## 4. Data Model

### 4.1 Settings Store Extension

Add to `MerchantSettings` in `src/state/settings-store.ts`:

```typescript
type ServiceFlow = "restaurant" | "fast-food";

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

### 4.2 No Order Model Changes

The existing `Order` and `OrderItem` models already support the needed fields:
- `Order.status`: open → sent → preparing → ready → served → paid
- `OrderItem.status`: new → preparing → ready → served
- `OrderItem.fired_at`: timestamp set when fired to kitchen

## 5. Behavior by Mode

### 5.1 Restaurant Mode (default)

| Step | Action | State Changes |
|------|--------|---------------|
| 1. Select table, add items | Items in order | order.status = "open", table.status = "ordering" |
| 2. Click "Send to Kitchen" | Fire to KDS | order.status = "sent", items.fired_at = now, items.status = "new", table.status = "ordered" |
| 3. Kitchen prepares | KDS workflow | items.status progression via KDS |
| 4. Click "Pay" | Payment flow | order.status = "paid", table.status = "dirty" |

**CheckPanel behavior:**
- When `order.status === "open"` and order has items: show **"Send to Kitchen"** button (primary blue)
- When `order.status !== "open"` (sent/preparing/ready/served): show **"Pay $XX.XX"** button
- When order has no items: show disabled "Pay $0.00" (current behavior)

### 5.2 Fast Food Mode

| Step | Action | State Changes |
|------|--------|---------------|
| 1. Select table/walk-in, add items | Items in order | order.status = "open", table.status = "ordering" |
| 2. Click "Pay" | Payment flow | order.status = "paid" |
| 3. After payment completes | Auto-fire to kitchen | items.fired_at = now, items.status = "new", table.status = "dirty" |

**CheckPanel behavior:**
- Always show **"Pay $XX.XX"** button (current behavior, no change)
- After payment: auto-fire happens in the payment complete handler

## 6. UI Changes

### 6.1 Admin Settings Page

**New card** in `AdminSettings.tsx`, placed before the "Ordering Channels" section:

```
┌─────────────────────────────────────────────┐
│ 🍽 Service Flow                              │
│ How orders are processed at POS terminals    │
│                                              │
│ ┌─────────────┐  ┌─────────────┐            │
│ │ 🍴          │  │ ⚡          │            │
│ │ Restaurant  │  │ Fast Food   │            │
│ │ Order →     │  │ Order →     │            │
│ │ Kitchen →   │  │ Pay →       │            │
│ │ Dine → Pay  │  │ Kitchen →   │            │
│ │             │  │ Pickup      │            │
│ │  ✓ Active   │  │             │            │
│ └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────┘
```

- Two selectable cards, active card has primary border + checkmark
- Follows the existing pattern of QR payment mode cards

### 6.2 CheckPanel (Tablet POS)

**Restaurant mode changes to bottom section (around line 311-354 of CheckPanel.tsx):**

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
- Transitions order status: open → sent
- Sets `fired_at` on all items to current timestamp
- Updates table status: ordering → ordered
- Persists via `updateOrderStatus()` DB call

**Updated handler: `handlePaymentComplete`**
- In fast-food mode: after payment, also set `fired_at` on items and update item status to "new" (auto-fire)

### 6.4 Mobile POS

**Restaurant mode:**
- After adding items in `menu` step, the `review` step shows "Send to Kitchen" button
- After sending, transitions to `payment` step with "Pay" button

**Fast Food mode:**
- Current behavior unchanged — `review` step shows "Pay" directly

## 7. Component Architecture

### Modified Files

| File | Changes |
|------|---------|
| `src/state/settings-store.ts` | Add `serviceFlow: ServiceFlow` field and type export |
| `src/pages/admin/AdminSettings.tsx` | Add Service Flow card UI section |
| `src/components/tablet/CheckPanel.tsx` | Add `serviceFlow` prop, conditional Send to Kitchen / Pay button |
| `src/pages/TabletPOS.tsx` | Add `handleSendToKitchen`, pass `serviceFlow` to CheckPanel, auto-fire in fast-food payment |
| `src/pages/MobilePOS.tsx` | Read serviceFlow, conditionally show Send/Pay in review step |
| `src/hooks/useLanguage.tsx` | Add new translation keys |

### No New Files

All changes are modifications to existing components. No new component files needed.

## 8. Localization

New keys for `useLanguage.tsx`:

| Key | EN | ZH |
|-----|----|----|
| serviceFlow | Service Flow | 服务流程 |
| serviceFlowDesc | How orders are processed at POS terminals | POS 终端的订单处理方式 |
| restaurant | Restaurant | 餐厅模式 |
| fastFood | Fast Food | 快餐模式 |
| restaurantDesc | Order → Kitchen → Dine → Pay | 点单 → 出餐 → 用餐 → 付款 |
| fastFoodDesc | Order → Pay → Kitchen → Pickup | 点单 → 付款 → 出餐 → 取餐 |
| sendToKitchen | Send to Kitchen | 下单到厨房 |
| orderSent | Order Sent | 已下单 |
| awaitingPayment | Awaiting Payment | 等待付款 |

Note: `send_to_kitchen` key already exists in the dictionary but is unused. Replace with `sendToKitchen` for consistency, or reuse existing key.

## 9. Edge Cases

1. **Mode switch with active orders**: Changing mode only affects new orders. Existing open orders continue with their current flow.
2. **Empty order Send to Kitchen**: Button disabled when order has no items (same as current Pay button behavior).
3. **Walk-in orders in restaurant mode**: Send to Kitchen still works — fires items, but no table status change (no table associated).
4. **Takeaway/Delivery in restaurant mode**: These still follow restaurant flow — send to kitchen first, pay when picking up.

## 10. Testing Considerations

- Toggle between modes in Admin Settings, verify CheckPanel button changes
- Restaurant: add items → Send to Kitchen → verify order status "sent" + table "ordered" → Pay
- Fast Food: add items → Pay → verify items auto-fired (fired_at set)
- Mode switch doesn't affect existing open orders
- Walk-in (no table) orders work in both modes
- Mobile POS: same flow differences verified

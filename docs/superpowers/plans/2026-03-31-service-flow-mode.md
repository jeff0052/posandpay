# Service Flow Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add global Restaurant/Fast Food service flow toggle in Admin Settings, changing CheckPanel to show "Send to Kitchen" or "Pay" based on mode.

**Architecture:** Extend settings-store with `serviceFlow` field, update order state machine to allow open→paid for fast-food, add conditional button rendering in CheckPanel, add handleSendToKitchen in TabletPOS.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-03-31-service-flow-mode-design.md`

---

## File Structure

### Modified Files
| File | Responsibility |
|------|---------------|
| `src/state/settings-store.ts` | Add `serviceFlow` field + type export |
| `src/lib/order-state-machine.ts` | Add `"paid"` to open transitions |
| `src/hooks/useLanguage.tsx` | Add i18n keys |
| `src/pages/admin/AdminSettings.tsx` | Add Service Flow config card |
| `src/components/tablet/CheckPanel.tsx` | Conditional Send/Pay button |
| `src/pages/TabletPOS.tsx` | handleSendToKitchen + auto-fire logic |

---

### Task 1: Settings Store — Add serviceFlow Field

**Files:**
- Modify: `src/state/settings-store.ts`

- [ ] **Step 1: Add ServiceFlow type and field**

Add `ServiceFlow` type export and `serviceFlow` to the interface and initial state:

After line 3 (`export type QRPaymentMode = ...`), add:
```typescript
export type ServiceFlow = "restaurant" | "fast-food";
```

In `MerchantSettings` interface, add after `kioskPaymentMethods`:
```typescript
  serviceFlow: ServiceFlow;
```

In the initial state object, add after `kioskPaymentMethods`:
```typescript
  serviceFlow: "restaurant" as ServiceFlow,
```

- [ ] **Step 2: Commit**
```bash
git add src/state/settings-store.ts
git commit -m "feat: add serviceFlow field to settings store"
```

---

### Task 2: Order State Machine — Allow open→paid

**Files:**
- Modify: `src/lib/order-state-machine.ts`

- [ ] **Step 1: Add "paid" to open transitions**

Change line 4 from:
```typescript
  open: ["sent", "void"],
```
to:
```typescript
  open: ["sent", "paid", "void"],
```

- [ ] **Step 2: Commit**
```bash
git add src/lib/order-state-machine.ts
git commit -m "feat: allow open→paid transition for fast-food mode"
```

---

### Task 3: Localization — Add i18n Keys

**Files:**
- Modify: `src/hooks/useLanguage.tsx`

- [ ] **Step 1: Add EN keys**

Add to the English dictionary section:
```typescript
serviceFlow: "Service Flow",
serviceFlowDesc: "How orders are processed at POS terminals",
restaurant: "Restaurant",
fastFood: "Fast Food",
restaurantDesc: "Order → Kitchen → Dine → Pay",
fastFoodDesc: "Order → Pay → Kitchen → Pickup",
orderSent: "Order Sent",
awaitingPayment: "Awaiting Payment",
```

- [ ] **Step 2: Add ZH keys**

Add to the Chinese dictionary section:
```typescript
serviceFlow: "服务流程",
serviceFlowDesc: "POS 终端的订单处理方式",
restaurant: "餐厅模式",
fastFood: "快餐模式",
restaurantDesc: "点单 → 出餐 → 用餐 → 付款",
fastFoodDesc: "点单 → 付款 → 出餐 → 取餐",
orderSent: "已下单",
awaitingPayment: "等待付款",
```

- [ ] **Step 3: Commit**
```bash
git add src/hooks/useLanguage.tsx
git commit -m "feat: add service flow i18n keys (EN + ZH)"
```

---

### Task 4: Admin Settings — Service Flow Config Card

**Files:**
- Modify: `src/pages/admin/AdminSettings.tsx`

- [ ] **Step 1: Add imports**

Update imports to include new icons and ServiceFlow type:
```typescript
import { Building2, CreditCard, Globe, Bell, QrCode, Monitor, UtensilsCrossed, Zap, Check } from "lucide-react";
import { useSettings, updateSettings, type QRPaymentMode, type ServiceFlow } from "@/state/settings-store";
import { useLanguage } from "@/hooks/useLanguage";
```

- [ ] **Step 2: Add Service Flow card before Ordering Channels**

Insert between the settings cards grid (`</div>` at line 50) and the Ordering Channels section (line 52):

```tsx
      {/* Service Flow */}
      <div className="uniweb-card surface-glow p-6 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">{t("serviceFlow")}</h2>
        <p className="text-[11px] text-muted-foreground mb-4">{t("serviceFlowDesc")}</p>

        <div className="grid grid-cols-2 gap-3">
          {([
            { key: "restaurant" as ServiceFlow, icon: UtensilsCrossed, titleKey: "restaurant", descKey: "restaurantDesc" },
            { key: "fast-food" as ServiceFlow, icon: Zap, titleKey: "fastFood", descKey: "fastFoodDesc" },
          ]).map(mode => {
            const isActive = settings.serviceFlow === mode.key;
            return (
              <button
                key={mode.key}
                onClick={() => updateSettings({ serviceFlow: mode.key })}
                className={cn(
                  "relative p-4 rounded-xl border-2 text-left transition-all",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30 bg-card"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <mode.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("font-semibold text-[13px]", isActive ? "text-primary" : "text-foreground")}>{t(mode.titleKey)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{t(mode.descKey)}</p>
                {isActive && (
                  <div className="absolute top-3 right-3">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
```

- [ ] **Step 3: Add `const { t } = useLanguage();`**

At the top of the component function (after `const settings = useSettings();`):
```typescript
  const { t } = useLanguage();
```

- [ ] **Step 4: Commit**
```bash
git add src/pages/admin/AdminSettings.tsx
git commit -m "feat: add Service Flow config card in Admin Settings"
```

---

### Task 5: CheckPanel — Conditional Send to Kitchen / Pay Button

**Files:**
- Modify: `src/components/tablet/CheckPanel.tsx`

- [ ] **Step 1: Update imports and props**

Add to imports:
```typescript
import { type ServiceFlow } from "@/state/settings-store";
import { ChefHat } from "lucide-react"; // add to existing lucide import
```

Update `CheckPanelProps`:
```typescript
interface CheckPanelProps {
  order: Order | null;
  table?: Table;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onPay: () => void;
  serviceFlow?: ServiceFlow;
  onSendToKitchen?: () => void;
}
```

Update the component destructuring to include new props:
```typescript
export const CheckPanel: React.FC<CheckPanelProps> = ({ order, table, onUpdateQuantity, onRemoveItem, onPay, serviceFlow = "restaurant", onSendToKitchen }) => {
```

- [ ] **Step 2: Replace Pay button with conditional rendering**

Replace the Pay button block (the `<Button variant="pay" ...>` at the bottom) with:

```tsx
        {serviceFlow === "restaurant" && order.status === "open" && order.items.length > 0 ? (
          <Button
            variant="default"
            size="xl"
            className="w-full mt-2 rounded-lg"
            onClick={onSendToKitchen}
          >
            <ChefHat className="h-4 w-4 mr-2" />
            {t("send_to_kitchen")}
          </Button>
        ) : (
          <Button
            variant="pay"
            size="xl"
            className="w-full mt-2 rounded-lg"
            disabled={order.items.length === 0}
            onClick={onPay}
          >
            {t("pay")} ${finalTotal.toFixed(2)}
          </Button>
        )}
```

- [ ] **Step 3: Commit**
```bash
git add src/components/tablet/CheckPanel.tsx
git commit -m "feat: conditional Send to Kitchen / Pay button in CheckPanel"
```

---

### Task 6: TabletPOS — handleSendToKitchen + Auto-fire Logic

**Files:**
- Modify: `src/pages/TabletPOS.tsx`

- [ ] **Step 1: Import settings hook**

Add to imports:
```typescript
import { useSettings } from "@/state/settings-store";
```

- [ ] **Step 2: Read serviceFlow in component**

After `const { t } = useLanguage();` (around line 70), add:
```typescript
  const settings = useSettings();
```

- [ ] **Step 3: Add handleSendToKitchen handler**

Add after `handleCancelReservation` (or any convenient location near the other handlers):

```typescript
  // Send order to kitchen (restaurant mode)
  const handleSendToKitchen = useCallback(() => {
    if (!currentOrder || currentOrder.status !== "open" || currentOrder.items.length === 0) return;

    // Fire all items to kitchen
    const firedOrder: Order = {
      ...currentOrder,
      status: "sent" as const,
      items: currentOrder.items.map(item => ({
        ...item,
        firedAt: new Date().toISOString(),
        status: "new" as const,
      })),
    };
    setCurrentOrder(firedOrder);
    setOrders(prev => prev.map(o => o.id === firedOrder.id ? firedOrder : o));

    // Update table status if table-based order
    if (firedOrder.tableId) {
      setTables(prev => prev.map(t =>
        t.id === firedOrder.tableId ? { ...t, status: "ordered" as const } : t
      ));
    }

    // Persist order status
    updateOrderStatus(firedOrder.id, "sent");
  }, [currentOrder]);
```

- [ ] **Step 4: Update handlePaymentComplete for fast-food auto-fire**

In the existing `handlePaymentComplete` handler, after the order status is set to "paid" and before table cleanup, add the auto-fire logic for fast-food mode:

Find the section where `currentOrder` is updated to "paid" status. After that update, add:

```typescript
      // Fast-food mode: auto-fire items to kitchen after payment
      if (settings.serviceFlow === "fast-food") {
        const firedItems = currentOrder.items.map(item => ({
          ...item,
          firedAt: item.firedAt || new Date().toISOString(),
          status: "new" as const,
        }));
        // Update the order in state with fired items
        setOrders(prev => prev.map(o =>
          o.id === currentOrder.id ? { ...o, items: firedItems, status: "paid" as const } : o
        ));
      }
```

- [ ] **Step 5: Pass new props to CheckPanel**

Find the CheckPanel JSX and add the new props:

```tsx
<CheckPanel
  order={currentOrder}
  table={selectedTable}
  onUpdateQuantity={handleUpdateQuantity}
  onRemoveItem={handleRemoveItem}
  onPay={() => setShowPayment(true)}
  serviceFlow={settings.serviceFlow}
  onSendToKitchen={handleSendToKitchen}
/>
```

- [ ] **Step 6: Commit**
```bash
git add src/pages/TabletPOS.tsx
git commit -m "feat: add handleSendToKitchen and fast-food auto-fire in TabletPOS"
```

---

### Task 7: Smoke Test & Fix

- [ ] **Step 1: Type-check**
Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 2: Verify Admin Settings UI**
Navigate to /admin/settings — verify Service Flow card renders with Restaurant/Fast Food toggle

- [ ] **Step 3: Test Restaurant mode**
1. Ensure Restaurant mode is active in settings
2. Go to /tablet, select a table, add items
3. Verify CheckPanel shows "Send to Kitchen" button (not Pay)
4. Click Send to Kitchen — verify order status changes, table becomes "ordered"
5. Verify CheckPanel now shows "Pay" button

- [ ] **Step 4: Test Fast Food mode**
1. Switch to Fast Food in admin settings
2. Go to /tablet, select a table, add items
3. Verify CheckPanel shows "Pay" button directly
4. Complete payment — verify items auto-fired (firedAt set)

- [ ] **Step 5: Fix any issues and commit**
```bash
git add -A
git commit -m "fix: address smoke test issues in service flow mode"
```

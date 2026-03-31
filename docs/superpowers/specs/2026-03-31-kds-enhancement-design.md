# KDS Enhancement Design Spec

**Date:** 2026-03-31
**Status:** Draft
**Scope:** Standalone KDS page with Kitchen/Pickup views, time-based color coding, order cancellation flow

## 1. Goals

1. Homepage KDS entry point at `/kds` as standalone full-screen page
2. Kitchen View: 3-column kanban (NEW/PREPARING/READY) with time-based color coding (green/yellow/red)
3. Pickup View: 2-column display (PREPARING/READY FOR PICKUP) for customer-facing screen
4. Order void flow: cancel notification banner on KDS, chef acknowledgment
5. Configurable timing thresholds in Admin Settings

## 2. Settings

Add to MerchantSettings in settings-store.ts:
- kdsWarningMinutes: number (default 5) — green→yellow threshold
- kdsUrgentMinutes: number (default 10) — yellow→red+breathing threshold

## 3. Color Coding

Based on elapsed time since fired_at:
- GREEN: < warningMinutes — fresh order, just arrived
- YELLOW: >= warningMinutes && < urgentMinutes — needs attention
- RED + breathing animation: >= urgentMinutes — urgent, overdue

## 4. Kitchen View

3-column kanban: NEW | PREPARING | READY
Each ticket shows: order#, table#, service mode, items with qty/modifiers/notes, elapsed time
Action buttons per column: Start (NEW→PREPARING), Ready (PREPARING→READY), Served (READY→remove)
Void banner at top: red notification for cancelled orders, "Acknowledged" button to dismiss

## 5. Pickup View

2-column: PREPARING | READY FOR PICKUP
Large font, high contrast for distance viewing
Each card: order number, table number
"Picked Up" button on ready items → removes from screen (status→served)

## 6. Void Flow

TabletPOS CheckPanel: add "Void Order" button (confirmation required)
On void: order.status→"void", KDS shows red cancellation banner
Kitchen chef clicks "Acknowledged" to dismiss
In-progress items marked cancelled with grey overlay

## 7. Files

New: src/pages/KitchenDisplay.tsx (standalone full-screen KDS page)
Modify: src/pages/Index.tsx (add KDS card), src/App.tsx (add /kds route),
src/state/settings-store.ts (add timing fields), src/pages/admin/AdminSettings.tsx (KDS timing card),
src/components/tablet/CheckPanel.tsx (void button), src/pages/TabletPOS.tsx (void handler)

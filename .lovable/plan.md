

# POS System Integration Audit + Sales BI + Settings UI Fix

## Issues Identified

### 1. Settings Toggle UI Drift
The custom toggle buttons in `AdminSettings.tsx` use `absolute` positioning with `top-0.5` and manual `translate-x` values, but the parent `button` has no explicit height constraint. The thumb `span` needs the parent to have `relative` with proper flex centering. Fix: replace the hand-rolled toggles with the existing `Switch` component from `src/components/ui/switch.tsx` (Radix-based, properly aligned).

### 2. Sales Report — Empty Daily Chart + No BI
`AdminSales.tsx` uses hardcoded static data. The chart renders bars but they may appear blank if CSS conflicts exist. More importantly, the page lacks real analytics depth. 

**Fix**: Rewrite `AdminSales.tsx` into a comprehensive BI dashboard:
- Query orders from the database (`orders` + `order_items` tables) for real data
- Add date range selector (Today / This Week / This Month / Custom)
- **Section 1: KPI Cards** — Revenue, Orders, Avg Order Value, Revenue per Table (all computed from DB)
- **Section 2: Daily Sales Chart** — Bar chart using `recharts` (already available via `chart.tsx` wrapper), showing daily revenue for selected period
- **Section 3: Hourly Heatmap** — Grid showing order volume by hour-of-day × day-of-week
- **Section 4: Top Items** — Ranked list from `order_items` grouped by `menu_item_id`
- **Section 5: Revenue by Channel** — Pie/donut chart breaking down `service_mode` (dine-in, takeaway, kiosk, qr)
- **Section 6: Payment Method Mix** — From paid orders
- **Section 7: Table Turnover** — Average time occupied per table

### 3. Front-to-Back Integration Audit

Current state: Most modules use in-memory mock data (`mock-data.ts`, zustand-like stores). The database tables exist but aren't wired to most UIs. Key gaps:

**A. Kiosk & QR orders don't persist to DB**
- `KioskOrdering.tsx` and `QROrdering.tsx` complete orders in local state only
- Fix: On payment complete, insert into `orders` + `order_items` + `order_item_modifiers` tables
- This makes them visible in KDS, Dashboard, and Sales Report

**B. KDS reads from `sampleOrders` (mock), not DB**
- `AdminKDS.tsx` imports `sampleOrders` from mock-data
- Fix: Query `order_items` joined with `orders` where status is not `served`/`paid`, with realtime subscription

**C. Dashboard uses static mock data**
- Fix: Query today's orders from DB for live KPIs and recent orders table

**D. Tablet POS partially integrated**
- Already has local order management but doesn't persist to DB
- Fix: On order creation/update, sync to `orders` table; on payment, update status

**E. Mobile POS same as Tablet**
- Uses local state only; needs DB persistence

---

## Implementation Plan

### File Changes

**1. `src/pages/admin/AdminSettings.tsx`** — Fix toggle UI
- Import `Switch` from `@/components/ui/switch`
- Replace both hand-rolled toggle buttons with `<Switch checked={...} onCheckedChange={...} />`
- Remove the manual `w-11 h-6 rounded-full` button + absolute span pattern

**2. `src/pages/admin/AdminSales.tsx`** — Full BI rewrite
- Import `supabase` client, `recharts` components via `chart.tsx` wrappers
- Add `useEffect` to fetch orders data with date range filter
- Compute KPIs from queried data (with fallback to mock if no DB data)
- Sections: KPI cards, daily bar chart (Recharts `BarChart`), hourly heatmap (CSS grid), top items table, channel breakdown (Recharts `PieChart`), payment mix
- Date range tabs: Today / 7 Days / 30 Days / Custom
- All monetary values with 2-decimal formatting

**3. `src/lib/db-orders.ts`** (new) — Shared order persistence helpers
- `insertOrder(order)` — insert into `orders` table
- `insertOrderItems(orderId, items)` — insert into `order_items` + `order_item_modifiers`
- `updateOrderStatus(orderId, status)` — update `orders.status`
- `fetchActiveOrders()` — for KDS/Dashboard
- `fetchOrdersInRange(from, to)` — for Sales BI
- Uses `supabase` client

**4. `src/pages/KioskOrdering.tsx`** — Wire payment to DB
- On `handlePaymentComplete`, call `insertOrder` + `insertOrderItems` with `service_mode: 'kiosk'`

**5. `src/pages/QROrdering.tsx`** — Wire payment to DB
- On payment/submit, call `insertOrder` + `insertOrderItems` with `service_mode: 'qr'`, `table_id` set

**6. `src/pages/admin/AdminKDS.tsx`** — Read from DB
- Replace `sampleOrders` import with `useEffect` + `supabase` query for active order items
- Add realtime subscription on `order_items` table for live updates
- Keep same UI, just change data source

**7. `src/pages/admin/AdminDashboard.tsx`** — Read from DB
- Replace static `stats` and `recentOrders` with DB queries (today's orders)
- Compute live KPIs: revenue, order count, unique customers, avg wait

**8. `src/pages/TabletPOS.tsx`** — Persist orders to DB
- On `handleAddItem` (first item or order creation), insert order to DB
- On `handlePaymentComplete`, update order status to `paid` in DB
- On order state changes, sync to DB

**9. `src/pages/MobilePOS.tsx`** — Same DB persistence as Tablet

### Database
No schema changes needed — all tables already exist with proper columns and RLS.

### Priority Order
1. Fix Settings toggle (quick)
2. Create `db-orders.ts` shared helpers
3. Wire Kiosk + QR to DB (customer-facing, highest impact)
4. Wire KDS + Dashboard to DB (admin visibility)
5. Rewrite Sales BI page
6. Wire Tablet + Mobile POS to DB


# Reservation System Design Spec

**Date:** 2026-03-31
**Status:** Draft
**Scope:** Complete table reservation workflow for POS tablet and mobile interfaces

## 1. Problem

The current POS system has a basic reserve button on available tables, but the reservation workflow is incomplete:
- No reservation time scheduling (only instant hold)
- No cancel flow with reason tracking
- No seat-from-reservation flow with member association
- No reservation list view to see today's bookings

## 2. Goals

1. **Reserve**: Select any available table, set guest name, count, optional phone/time/notes
2. **Cancel**: Click reserved table to cancel with reason (no-show / customer-cancel / other)
3. **Seat**: When reserved guest arrives, confirm info, adjust guest count, associate member, then enter ordering
4. **List**: View all today's reservations with status filtering and quick table navigation

## 3. Non-Goals

- Online/web-based reservation system (customer-facing booking)
- Supabase schema migration (stay in mock-data mode)
- Multi-day reservation management
- Waitlist integration (separate existing feature)
- QR/Kiosk flow changes

## 4. Data Model

### 4.1 Table Interface Extension

Add fields to existing `Table` interface in `src/data/mock-data.ts`:

```typescript
interface Table {
  // existing fields unchanged
  id: string;
  number: string;
  zone: string;
  seats: number;
  status: TableStatus;
  guestCount?: number;
  server?: string;
  openAmount?: number;
  elapsedMinutes?: number;
  orderId?: string;
  mergedWith?: string[];
  reservationName?: string;       // existing

  // new fields
  reservationTime?: string;       // ISO datetime for scheduled reservations
  reservationPhone?: string;      // contact phone
  reservationNotes?: string;      // free-text notes
}
```

### 4.2 Reservation Type (New)

```typescript
type ReservationStatus = "pending" | "seated" | "cancelled" | "no-show";
type CancelReason = "no-show" | "customer-cancel" | "other";

interface Reservation {
  id: string;
  tableId: string;
  tableNumber: string;
  zone: string;
  guestName: string;
  guestCount: number;
  phone?: string;
  reservationTime?: string;   // ISO datetime; undefined = instant hold
  createdAt: string;          // ISO datetime
  status: ReservationStatus;
  cancelReason?: CancelReason;
  cancelNote?: string;
  notes?: string;
  customerId?: string;        // linked member ID after seating
}
```

### 4.3 Mock Data

Add 3-4 sample reservations in `mock-data.ts`:
- 1 instant reservation (pending, no time)
- 1 scheduled reservation (pending, time = today 19:00)
- 1 already seated reservation
- 1 cancelled reservation (no-show)

Store as exported `reservations: Reservation[]` array alongside existing `tables` and `orders`.

## 5. Interaction Flows

### 5.1 Reserve Table

**Trigger:** Click available table on FloorPanel -> "Reserve" button

**ReservationDialog** (replaces current simple reserve dialog):
- Guest Name (required, text input)
- Guest Count (required, number selector 1-20, current component reused)
- Phone (optional, tel input)
- Reservation Type toggle:
  - "Now" (instant hold) - default
  - "Scheduled" - reveals date picker + time picker
- Notes (optional, textarea)
- Cancel / Confirm buttons

**On Confirm:**
1. Create `Reservation` record with status `"pending"`
2. Update table: `status = "reserved"`, populate `reservationName`, `reservationTime`, `reservationPhone`, `reservationNotes`, `guestCount`
3. Close dialog, FloorPanel refreshes to show blue reserved card with name + time

### 5.2 Cancel Reservation

**Trigger:** Click reserved table on FloorPanel -> "Cancel Reservation" button (new)

**CancelReservationDialog:**
- Shows reservation summary (name, count, time, table number)
- Cancel Reason (required, radio group):
  - Customer Cancelled
  - No-Show
  - Other
- Note (optional, shown when "Other" selected, textarea)
- Back / Confirm Cancel buttons

**On Confirm:**
1. Update Reservation: `status = "cancelled"` or `"no-show"`, set `cancelReason` and `cancelNote`
2. Update table: `status = "available"`, clear all reservation fields (`reservationName`, `reservationTime`, `reservationPhone`, `reservationNotes`, `guestCount`)
3. Close dialog, table card returns to green available state

### 5.3 Seat Guests (from Reservation)

**Trigger:** Click reserved table on FloorPanel -> "Seat Guests" button (existing, enhanced)

**SeatReservationDialog** (new, replaces direct seat action):
- Shows reservation info: name, reserved count, time, phone
- Actual Guest Count (editable number, pre-filled from reservation)
- Member Association section:
  - Phone/member ID search input
  - Search button -> shows match result (name, member tier, discount %)
  - "Link Member" / "Skip" buttons
- Cancel / Seat & Order buttons

**On Confirm:**
1. Update Reservation: `status = "seated"`, set `customerId` if member linked
2. Update table: `status = "ordering"`, update `guestCount` to actual count
3. Create new Order:
   - `tableId`, `tableNumber` from table
   - `serviceMode = "dine-in"`
   - `status = "open"`
   - `guestCount` = actual count
   - `customerId` = linked member ID (if any)
4. Navigate to MenuComposer with the new order active

### 5.4 Reservation List Panel

**Location:** FloorPanel top area, new tab/toggle alongside existing zone filters

**Layout:**
- Toggle between "Floor Plan" view (existing) and "Reservations" list view
- Filter chips: All | Pending | Seated | Cancelled
- Sort: by reservation time ascending (scheduled first, then instant)

**List Item:**
- Time badge (e.g., "19:00" or "Now")
- Table number + zone
- Guest name + count
- Status badge (color-coded: blue=pending, green=seated, red=cancelled)
- Click -> switches to Floor Plan view and highlights/selects that table

**Empty State:** "No reservations today" message

## 6. Component Architecture

### 6.1 New Components

All placed in `src/components/tablet/`:

| Component | Props | Purpose |
|-----------|-------|---------|
| `ReservationDialog.tsx` | `table: Table`, `onConfirm(reservation)`, `onCancel()` | Full reservation form |
| `CancelReservationDialog.tsx` | `table: Table`, `reservation: Reservation`, `onConfirm(reason, note)`, `onCancel()` | Cancel with reason |
| `SeatReservationDialog.tsx` | `table: Table`, `reservation: Reservation`, `customers: Customer[]`, `onConfirm(guestCount, customerId?)`, `onCancel()` | Confirm seating + member link |
| `ReservationListPanel.tsx` | `reservations: Reservation[]`, `onSelectReservation(id)` | Today's reservation list |

### 6.2 Modified Components

| Component | Changes |
|-----------|---------|
| `FloorPanel.tsx` | Replace inline reserve dialog with ReservationDialog; add Cancel button for reserved tables; enhance Seat button to open SeatReservationDialog; add Reservations tab toggle; integrate ReservationListPanel |
| `MobileTablesScreen.tsx` | Mirror reserve/cancel/seat dialogs for mobile layout |
| `TabletPOS.tsx` | Handle `onSeatReserved` callback to create order with customerId; manage reservations state array |

### 6.3 State Management

Reservations state managed in `TabletPOS.tsx` (same pattern as current tables/orders state):
- `reservations` state array
- Helper functions: `addReservation()`, `cancelReservation()`, `seatReservation()`
- Passed down to FloorPanel and ReservationListPanel as props

No new store file needed - follows existing pattern of lifting state to page component.

## 7. Localization

New keys for `useLanguage.tsx` dictionary (both EN and ZH):

```
reservation, reservations, reserveTable, cancelReservation,
seatGuests, guestName, guestCount, phone, reservationType,
instantHold, scheduled, selectDate, selectTime, notes,
cancelReason, customerCancelled, noShow, other, cancelNote,
confirmCancel, actualGuestCount, searchMember, linkMember,
skipMember, seatAndOrder, reservationList, allReservations,
pendingReservations, seatedReservations, cancelledReservations,
noReservationsToday, reservedAt, reservedFor
```

## 8. Status Flow Diagram

```
available ──[Reserve]──> reserved (Reservation: pending)
                            │
                ┌───────────┼───────────┐
                │                       │
        [Cancel Reservation]    [Seat Guests]
                │                       │
                v                       v
           available              ordering (Reservation: seated)
     (Reservation: cancelled        + Order created
      or no-show)                   + Member linked (optional)
                                        │
                                   [normal order flow]
                                        │
                                        v
                                   ordered → dirty → cleaning → available
```

## 9. Edge Cases

1. **Table already reserved:** Reserve button hidden for non-available tables
2. **Scheduled reservation past time:** Show visual indicator (e.g., amber border) on overdue reservations in the list; no auto-cancel
3. **Cancel after partial use:** Not applicable - cancel only available before seating
4. **Member not found:** Show "No member found" message, allow proceeding without member
5. **Multiple reservations same table:** Not allowed - one active reservation per table at a time (table must be available to reserve)

## 10. Testing Considerations

- Reserve flow: available -> reserved with all field combinations
- Cancel flow: reserved -> available with each cancel reason
- Seat flow: reserved -> ordering with/without member
- Reservation list: filter by status, click-to-navigate
- Edge: attempt reserve on non-available table (should be blocked)
- Mobile: same flows work on MobileTablesScreen

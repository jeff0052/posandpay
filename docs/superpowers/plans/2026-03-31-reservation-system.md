# Reservation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete table reservation workflow — reserve with time/phone, cancel with reason, seat with member association, and reservation list panel.

**Architecture:** Extend existing Table interface with reservation fields, add Reservation type for list tracking, create 4 new dialog/panel components in `src/components/tablet/`, manage reservation state in TabletPOS.tsx following the existing lifted-state pattern.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui, Vite

**Spec:** `docs/superpowers/specs/2026-03-31-reservation-system-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/components/tablet/ReservationDialog.tsx` | Full reserve form (name, count, phone, time, notes) |
| `src/components/tablet/CancelReservationDialog.tsx` | Cancel with reason selection |
| `src/components/tablet/SeatReservationDialog.tsx` | Confirm seating + member association |
| `src/components/tablet/ReservationListPanel.tsx` | Today's reservations list with filters |

### Modified Files
| File | Changes |
|------|---------|
| `src/data/mock-data.ts` | Add Table fields, Reservation type, mock reservations |
| `src/components/tablet/FloorPanel.tsx` | Wire new dialogs, add reservations tab, fix showActions guard |
| `src/pages/TabletPOS.tsx` | Manage reservations state, update callbacks |
| `src/hooks/useLanguage.tsx` | Add ~30 new EN/ZH translation keys |

---

### Task 1: Data Model — Extend Table & Add Reservation Type

**Files:**
- Modify: `src/data/mock-data.ts:8-21` (Table interface)
- Modify: `src/data/mock-data.ts:108-127` (mock tables data)

- [ ] **Step 1: Add new fields to Table interface**

In `src/data/mock-data.ts`, add after `reservationName?: string;` (line 20):

```typescript
  reservationTime?: string;       // ISO datetime for scheduled reservations
  reservationPhone?: string;      // contact phone
  reservationNotes?: string;      // free-text notes
```

- [ ] **Step 2: Add Reservation types after Customer interface (after line 104)**

```typescript
export type ReservationStatus = "pending" | "seated" | "cancelled" | "no-show";
export type CancelReason = "no-show" | "customer-cancel" | "other";

export interface Reservation {
  id: string;
  tableId: string;
  tableNumber: string;
  zone: string;
  guestName: string;
  guestCount: number;
  phone?: string;
  reservationTime?: string;
  createdAt: string;
  status: ReservationStatus;
  cancelReason?: CancelReason;
  cancelNote?: string;
  notes?: string;
  customerId?: string;
}
```

- [ ] **Step 3: Update mock reserved tables with reservation data**

Update t4, t10, t18 to include reservation fields:

```typescript
{ id: "t4", number: "4", zone: "Main Hall", seats: 6, status: "reserved", guestCount: 5, reservationName: "Mr. Chen", reservationPhone: "91234567", reservationTime: new Date(new Date().setHours(19, 0, 0, 0)).toISOString() },
{ id: "t10", number: "10", zone: "Private", seats: 8, status: "reserved", guestCount: 8, reservationName: "Mrs. Tan", reservationPhone: "98765432" },
{ id: "t18", number: "18", zone: "Private", seats: 12, status: "reserved", guestCount: 10, reservationName: "Lee Family", reservationPhone: "92223333", reservationTime: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(), reservationNotes: "Birthday dinner" },
```

- [ ] **Step 4: Add mock reservations array (after tables array)**

```typescript
export const reservations: Reservation[] = [
  { id: "r1", tableId: "t4", tableNumber: "4", zone: "Main Hall", guestName: "Mr. Chen", guestCount: 5, phone: "91234567", reservationTime: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(), createdAt: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(), status: "pending" },
  { id: "r2", tableId: "t10", tableNumber: "10", zone: "Private", guestName: "Mrs. Tan", guestCount: 8, phone: "98765432", createdAt: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(), status: "pending" },
  { id: "r3", tableId: "t18", tableNumber: "18", zone: "Private", guestName: "Lee Family", guestCount: 10, phone: "92223333", reservationTime: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(), createdAt: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(), status: "pending", notes: "Birthday dinner" },
  { id: "r4", tableId: "t5", tableNumber: "5", zone: "Main Hall", guestName: "David Wong", guestCount: 2, phone: "93334444", createdAt: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(), status: "seated", customerId: "c1" },
  { id: "r5", tableId: "t7", tableNumber: "7", zone: "Patio", guestName: "Sarah Lim", guestCount: 2, createdAt: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(), status: "cancelled", cancelReason: "customer-cancel" },
];
```

- [ ] **Step 5: Commit**

```bash
git add src/data/mock-data.ts
git commit -m "feat: extend Table interface and add Reservation type with mock data"
```

---

### Task 2: Localization — Add Translation Keys

**Files:**
- Modify: `src/hooks/useLanguage.tsx`

- [ ] **Step 1: Add reservation translation keys to the EN dictionary**

Find the English dictionary section and add these keys (insert near existing reservation keys around lines 280-340):

```typescript
// Reservation keys
reserveTable: "Reserve Table",
cancelReservation: "Cancel Reservation",
seatGuests: "Seat Guests",
guestName: "Guest Name",
guestCount: "Guest Count",
phone: "Phone",
reservationType: "Reservation Type",
instantHold: "Now",
scheduled: "Scheduled",
selectDate: "Select Date",
selectTime: "Select Time",
notes: "Notes",
cancelReason: "Cancel Reason",
customerCancelled: "Customer Cancelled",
noShow: "No-Show",
otherReason: "Other",
cancelNote: "Note",
confirmCancel: "Confirm Cancel",
actualGuestCount: "Actual Guest Count",
searchMember: "Search member by phone",
linkMember: "Link Member",
skipMember: "Skip",
seatAndOrder: "Seat & Order",
reservationList: "Reservations",
allReservations: "All",
pendingReservations: "Pending",
seatedReservations: "Seated",
cancelledReservations: "Cancelled",
noReservationsToday: "No reservations today",
reservedAt: "Reserved at",
reservedFor: "Reserved for",
guestNameRequired: "Guest name is required",
reservationInfo: "Reservation Info",
memberTier: "Member Tier",
noMemberFound: "No member found",
```

- [ ] **Step 2: Add corresponding ZH dictionary keys**

```typescript
reserveTable: "预订桌位",
cancelReservation: "取消预订",
seatGuests: "入座点单",
guestName: "客人姓名",
guestCount: "人数",
phone: "电话",
reservationType: "预订类型",
instantHold: "即时预留",
scheduled: "预约时间",
selectDate: "选择日期",
selectTime: "选择时间",
notes: "备注",
cancelReason: "取消原因",
customerCancelled: "客人取消",
noShow: "未到店",
otherReason: "其他",
cancelNote: "备注",
confirmCancel: "确认取消",
actualGuestCount: "实际人数",
searchMember: "输入手机号搜索会员",
linkMember: "关联会员",
skipMember: "跳过",
seatAndOrder: "入座点单",
reservationList: "预订列表",
allReservations: "全部",
pendingReservations: "待到",
seatedReservations: "已入座",
cancelledReservations: "已取消",
noReservationsToday: "今日无预订",
reservedAt: "预订时间",
reservedFor: "预订人",
guestNameRequired: "请输入客人姓名",
reservationInfo: "预订信息",
memberTier: "会员等级",
noMemberFound: "未找到会员",
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useLanguage.tsx
git commit -m "feat: add reservation i18n keys (EN + ZH)"
```

---

### Task 3: ReservationDialog Component

**Files:**
- Create: `src/components/tablet/ReservationDialog.tsx`

- [ ] **Step 1: Create the ReservationDialog component**

```tsx
import React, { useState } from "react";
import { CalendarCheck, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Table } from "@/data/mock-data";
import { useLanguage } from "@/hooks/useLanguage";

interface ReservationDialogProps {
  table: Table;
  onConfirm: (data: {
    guestName: string;
    guestCount: number;
    phone?: string;
    reservationTime?: string;
    notes?: string;
  }) => void;
  onCancel: () => void;
}

export const ReservationDialog: React.FC<ReservationDialogProps> = ({ table, onConfirm, onCancel }) => {
  const { t } = useLanguage();
  const [guestName, setGuestName] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [phone, setPhone] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("19:00");
  const [notes, setNotes] = useState("");
  const [nameError, setNameError] = useState(false);

  const handleConfirm = () => {
    if (!guestName.trim()) {
      setNameError(true);
      return;
    }
    let reservationTime: string | undefined;
    if (isScheduled) {
      reservationTime = new Date(`${date}T${time}`).toISOString();
    }
    onConfirm({
      guestName: guestName.trim(),
      guestCount,
      phone: phone.trim() || undefined,
      reservationTime,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="px-3 py-3 border-t border-border bg-accent/30 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
          <CalendarCheck className="h-3.5 w-3.5 text-primary" />
          {t("reserveTable")} #{table.number}
        </div>
        <button onClick={onCancel} className="p-1 rounded hover:bg-accent">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Guest Name */}
      <div>
        <input
          type="text"
          placeholder={t("guestName") + " *"}
          value={guestName}
          onChange={e => { setGuestName(e.target.value); setNameError(false); }}
          className={cn(
            "w-full h-8 px-2.5 rounded-md bg-background border-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all",
            nameError ? "border-status-red" : "border-border"
          )}
        />
        {nameError && <p className="text-[10px] text-status-red mt-0.5">{t("guestNameRequired")}</p>}
      </div>

      {/* Phone */}
      <input
        type="tel"
        placeholder={t("phone")}
        value={phone}
        onChange={e => setPhone(e.target.value)}
        className="w-full h-8 px-2.5 rounded-md bg-background border-1.5 border-border text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
      />

      {/* Guest Count */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">{t("guestCount")}:</span>
        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
          <button
            key={n}
            onClick={() => setGuestCount(n)}
            className={cn(
              "w-7 h-7 rounded-md text-[11px] font-bold transition-colors",
              guestCount === n ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
            )}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Reservation Type Toggle */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setIsScheduled(false)}
          className={cn(
            "flex-1 h-8 rounded-md text-[11px] font-medium transition-colors",
            !isScheduled ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
          )}
        >
          {t("instantHold")}
        </button>
        <button
          onClick={() => setIsScheduled(true)}
          className={cn(
            "flex-1 h-8 rounded-md text-[11px] font-medium transition-colors flex items-center justify-center gap-1",
            isScheduled ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
          )}
        >
          <Clock className="h-3 w-3" />
          {t("scheduled")}
        </button>
      </div>

      {/* Date/Time pickers (shown when scheduled) */}
      {isScheduled && (
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="flex-1 h-8 px-2 rounded-md bg-background border-1.5 border-border text-[12px] text-foreground focus:outline-none focus:border-primary transition-all"
          />
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-24 h-8 px-2 rounded-md bg-background border-1.5 border-border text-[12px] text-foreground focus:outline-none focus:border-primary transition-all"
          />
        </div>
      )}

      {/* Notes */}
      <textarea
        placeholder={t("notes")}
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={2}
        className="w-full px-2.5 py-1.5 rounded-md bg-background border-1.5 border-border text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
      />

      {/* Actions */}
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" className="flex-1 text-[11px] h-8" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button size="sm" className="flex-1 text-[11px] h-8" onClick={handleConfirm}>
          {t("confirm")}
        </Button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tablet/ReservationDialog.tsx
git commit -m "feat: add ReservationDialog component with time/phone/notes support"
```

---

### Task 4: CancelReservationDialog Component

**Files:**
- Create: `src/components/tablet/CancelReservationDialog.tsx`

- [ ] **Step 1: Create the CancelReservationDialog component**

```tsx
import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Table, type Reservation, type CancelReason } from "@/data/mock-data";
import { useLanguage } from "@/hooks/useLanguage";

interface CancelReservationDialogProps {
  table: Table;
  reservation: Reservation;
  onConfirm: (reason: CancelReason, note?: string) => void;
  onCancel: () => void;
}

export const CancelReservationDialog: React.FC<CancelReservationDialogProps> = ({
  table, reservation, onConfirm, onCancel,
}) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [note, setNote] = useState("");

  const reasons: { value: CancelReason; label: string }[] = [
    { value: "customer-cancel", label: t("customerCancelled") },
    { value: "no-show", label: t("noShow") },
    { value: "other", label: t("otherReason") },
  ];

  return (
    <div className="px-3 py-3 border-t border-border bg-accent/30 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-status-red" />
          {t("cancelReservation")}
        </div>
        <button onClick={onCancel} className="p-1 rounded hover:bg-accent">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Reservation Summary */}
      <div className="bg-background rounded-md p-2 text-[11px] space-y-0.5">
        <div className="font-medium text-foreground">#{table.number} — {reservation.guestName}</div>
        <div className="text-muted-foreground">
          {reservation.guestCount} {t("guestCount")}
          {reservation.reservationTime && ` · ${new Date(reservation.reservationTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        </div>
      </div>

      {/* Reason Selection */}
      <div className="space-y-1">
        <span className="text-[11px] text-muted-foreground font-medium">{t("cancelReason")} *</span>
        <div className="space-y-1">
          {reasons.map(r => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              className={cn(
                "w-full h-8 px-2.5 rounded-md text-[11px] text-left font-medium transition-colors",
                reason === r.value
                  ? "bg-status-red/10 text-status-red border border-status-red/30"
                  : "bg-card border border-border text-foreground hover:bg-accent"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Note (shown for "other") */}
      {reason === "other" && (
        <textarea
          placeholder={t("cancelNote")}
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          className="w-full px-2.5 py-1.5 rounded-md bg-background border-1.5 border-border text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
        />
      )}

      {/* Actions */}
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" className="flex-1 text-[11px] h-8" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="flex-1 text-[11px] h-8"
          disabled={!reason}
          onClick={() => reason && onConfirm(reason, note.trim() || undefined)}
        >
          {t("confirmCancel")}
        </Button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tablet/CancelReservationDialog.tsx
git commit -m "feat: add CancelReservationDialog with reason selection"
```

---

### Task 5: SeatReservationDialog Component

**Files:**
- Create: `src/components/tablet/SeatReservationDialog.tsx`

- [ ] **Step 1: Create the SeatReservationDialog component**

```tsx
import React, { useState } from "react";
import { UserCheck, Search, X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Table, type Reservation } from "@/data/mock-data";
import { useLanguage } from "@/hooks/useLanguage";
import { useCustomers, type CustomerFull } from "@/state/customer-store";

interface SeatReservationDialogProps {
  table: Table;
  reservation: Reservation;
  onConfirm: (guestCount: number, customerId?: string) => void;
  onCancel: () => void;
}

export const SeatReservationDialog: React.FC<SeatReservationDialogProps> = ({
  table, reservation, onConfirm, onCancel,
}) => {
  const { t } = useLanguage();
  const { findByPhone } = useCustomers();
  const [guestCount, setGuestCount] = useState(reservation.guestCount);
  const [searchPhone, setSearchPhone] = useState(reservation.phone || "");
  const [foundMember, setFoundMember] = useState<CustomerFull | null>(null);
  const [linkedMemberId, setLinkedMemberId] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!searchPhone.trim()) return;
    const result = findByPhone(searchPhone.trim());
    setFoundMember(result || null);
    setSearched(true);
    if (result) setLinkedMemberId(result.id);
  };

  const tierColors: Record<string, string> = {
    bronze: "text-amber-700 bg-amber-100",
    silver: "text-gray-600 bg-gray-100",
    gold: "text-yellow-600 bg-yellow-100",
    platinum: "text-purple-600 bg-purple-100",
  };

  return (
    <div className="px-3 py-3 border-t border-border bg-accent/30 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
          <UserCheck className="h-3.5 w-3.5 text-primary" />
          {t("seatGuests")} — #{table.number}
        </div>
        <button onClick={onCancel} className="p-1 rounded hover:bg-accent">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Reservation Info */}
      <div className="bg-background rounded-md p-2 text-[11px] space-y-0.5">
        <div className="font-medium text-foreground">{reservation.guestName}</div>
        <div className="text-muted-foreground">
          {reservation.guestCount} {t("guestCount")}
          {reservation.phone && ` · ${reservation.phone}`}
          {reservation.reservationTime && ` · ${new Date(reservation.reservationTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        </div>
      </div>

      {/* Actual Guest Count */}
      <div>
        <span className="text-[11px] text-muted-foreground font-medium">{t("actualGuestCount")}:</span>
        <div className="flex items-center gap-1.5 mt-1">
          {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
            <button
              key={n}
              onClick={() => setGuestCount(n)}
              className={cn(
                "w-7 h-7 rounded-md text-[11px] font-bold transition-colors",
                guestCount === n ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Member Search */}
      <div className="space-y-1.5">
        <span className="text-[11px] text-muted-foreground font-medium">{t("searchMember")}</span>
        <div className="flex gap-1.5">
          <input
            type="tel"
            placeholder={t("phone")}
            value={searchPhone}
            onChange={e => { setSearchPhone(e.target.value); setSearched(false); setFoundMember(null); setLinkedMemberId(null); }}
            className="flex-1 h-8 px-2.5 rounded-md bg-background border-1.5 border-border text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
          />
          <Button size="sm" variant="outline" className="h-8 px-2" onClick={handleSearch}>
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Search Result */}
        {searched && (
          foundMember ? (
            <div className={cn(
              "flex items-center justify-between p-2 rounded-md text-[11px]",
              linkedMemberId ? "bg-primary/10 border border-primary/30" : "bg-background border border-border"
            )}>
              <div className="flex items-center gap-2">
                <Crown className="h-3.5 w-3.5 text-primary" />
                <div>
                  <div className="font-medium text-foreground">{foundMember.name}</div>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", tierColors[foundMember.tier])}>
                    {foundMember.tier}
                  </span>
                </div>
              </div>
              {linkedMemberId ? (
                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setLinkedMemberId(null)}>
                  {t("cancel")}
                </Button>
              ) : (
                <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => setLinkedMemberId(foundMember.id)}>
                  {t("linkMember")}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground py-1">{t("noMemberFound")}</div>
          )
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" className="flex-1 text-[11px] h-8" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button size="sm" className="flex-1 text-[11px] h-8" onClick={() => onConfirm(guestCount, linkedMemberId || undefined)}>
          {t("seatAndOrder")}
        </Button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tablet/SeatReservationDialog.tsx
git commit -m "feat: add SeatReservationDialog with member association"
```

---

### Task 6: ReservationListPanel Component

**Files:**
- Create: `src/components/tablet/ReservationListPanel.tsx`

- [ ] **Step 1: Create the ReservationListPanel component**

```tsx
import React, { useState } from "react";
import { Calendar, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Reservation, type ReservationStatus } from "@/data/mock-data";
import { useLanguage } from "@/hooks/useLanguage";

interface ReservationListPanelProps {
  reservations: Reservation[];
  onSelectReservation: (reservationId: string, tableId: string) => void;
}

const statusBadge: Record<ReservationStatus, { bg: string; text: string; labelKey: string }> = {
  pending:   { bg: "bg-status-blue-light", text: "text-primary",    labelKey: "pendingReservations" },
  seated:    { bg: "bg-status-green-light", text: "text-status-green", labelKey: "seatedReservations" },
  cancelled: { bg: "bg-status-red-light",   text: "text-status-red",   labelKey: "cancelledReservations" },
  "no-show": { bg: "bg-status-red-light",   text: "text-status-red",   labelKey: "noShow" },
};

type FilterKey = "all" | "pending" | "seated" | "cancelled";

export const ReservationListPanel: React.FC<ReservationListPanelProps> = ({
  reservations, onSelectReservation,
}) => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterKey>("all");

  const filters: { key: FilterKey; labelKey: string }[] = [
    { key: "all", labelKey: "allReservations" },
    { key: "pending", labelKey: "pendingReservations" },
    { key: "seated", labelKey: "seatedReservations" },
    { key: "cancelled", labelKey: "cancelledReservations" },
  ];

  const filtered = reservations.filter(r => {
    if (filter === "all") return true;
    if (filter === "cancelled") return r.status === "cancelled" || r.status === "no-show";
    return r.status === filter;
  }).sort((a, b) => {
    // Scheduled first (by time), then instant (by creation time)
    const aTime = a.reservationTime || a.createdAt;
    const bTime = b.reservationTime || b.createdAt;
    return new Date(aTime).getTime() - new Date(bTime).getTime();
  });

  const formatTime = (r: Reservation) => {
    if (r.reservationTime) {
      return new Date(r.reservationTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return t("instantHold");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filter chips */}
      <div className="flex gap-1 px-3 py-2 border-b border-border">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-2.5 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors min-h-[32px]",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pos-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Calendar className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-[12px]">{t("noReservationsToday")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(r => {
              const badge = statusBadge[r.status];
              const isClickable = r.status === "pending" || r.status === "seated";
              return (
                <button
                  key={r.id}
                  onClick={() => isClickable && onSelectReservation(r.id, r.tableId)}
                  disabled={!isClickable}
                  className={cn(
                    "w-full px-3 py-2.5 text-left transition-colors",
                    isClickable ? "hover:bg-accent cursor-pointer" : "opacity-60 cursor-default"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatTime(r)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">#{r.tableNumber} · {r.zone}</span>
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md", badge.bg, badge.text)}>
                      {t(badge.labelKey)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-medium text-foreground">{r.guestName}</span>
                    <span className="text-muted-foreground flex items-center gap-0.5">
                      <Users className="h-3 w-3" /> {r.guestCount}
                    </span>
                    {r.phone && <span className="text-muted-foreground">{r.phone}</span>}
                  </div>
                  {r.notes && <div className="text-[10px] text-muted-foreground mt-0.5">{r.notes}</div>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tablet/ReservationListPanel.tsx
git commit -m "feat: add ReservationListPanel with status filtering"
```

---

### Task 7: Wire FloorPanel — Integrate All Dialogs + Reservation Tab

**Files:**
- Modify: `src/components/tablet/FloorPanel.tsx`

- [ ] **Step 1: Update imports and props interface**

Add imports for new components and types at top of file. Update `FloorPanelProps` to accept reservation data and callbacks:

```typescript
// New imports (add to existing imports)
import { type Reservation, type CancelReason } from "@/data/mock-data";
import { ReservationDialog } from "./ReservationDialog";
import { CancelReservationDialog } from "./CancelReservationDialog";
import { SeatReservationDialog } from "./SeatReservationDialog";
import { ReservationListPanel } from "./ReservationListPanel";
import { List } from "lucide-react"; // add to lucide imports
```

Update FloorPanelProps — add new props:
```typescript
interface FloorPanelProps {
  // ... existing props unchanged
  onSeatReserved?: (tableId: string, guestCount: number, customerId?: string) => void; // updated signature
  onReserveTable?: (tableId: string, data: { guestName: string; guestCount: number; phone?: string; reservationTime?: string; notes?: string }) => void; // updated signature
  onCancelReservation?: (tableId: string, reason: CancelReason, note?: string) => void; // new
  reservations?: Reservation[]; // new
  onSelectReservation?: (reservationId: string, tableId: string) => void; // new
}
```

- [ ] **Step 2: Add new state and fix showActions guard**

Add state for cancel and seat dialogs, and a view toggle:
```typescript
const [showCancelDialog, setShowCancelDialog] = useState(false);
const [showSeatDialog, setShowSeatDialog] = useState(false);
const [viewMode, setViewMode] = useState<"floor" | "reservations">("floor");
```

Fix the showActions guard (line 97) to include reserved status:
```typescript
const showActions = selectedTable && !tableAction && (selectedTable.status === "ordering" || selectedTable.status === "ordered" || selectedTable.status === "available" || selectedTable.status === "reserved");
```

- [ ] **Step 3: Add Reservations tab toggle button**

After the Zone Tabs section (around line 150), add a Floor/Reservations view toggle:

```tsx
{/* View Toggle: Floor Plan vs Reservations */}
<div className="flex gap-1 px-3 py-1.5 border-b border-border">
  <button
    onClick={() => setViewMode("floor")}
    className={cn(
      "flex-1 h-8 rounded-md text-[11px] font-medium transition-colors",
      viewMode === "floor" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
    )}
  >
    {t("floor")}
  </button>
  <button
    onClick={() => setViewMode("reservations")}
    className={cn(
      "flex-1 h-8 rounded-md text-[11px] font-medium transition-colors flex items-center justify-center gap-1",
      viewMode === "reservations" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
    )}
  >
    <List className="h-3 w-3" />
    {t("reservationList")}
    {reservations && reservations.filter(r => r.status === "pending").length > 0 && (
      <span className="w-4 h-4 rounded-full bg-status-red text-white text-[9px] font-bold flex items-center justify-center">
        {reservations.filter(r => r.status === "pending").length}
      </span>
    )}
  </button>
</div>
```

- [ ] **Step 4: Conditionally render floor grid or reservation list**

Replace the table grid section with a conditional:

```tsx
{viewMode === "floor" ? (
  {/* existing Table Grid + Status Legend */}
) : (
  <ReservationListPanel
    reservations={reservations || []}
    onSelectReservation={(rId, tId) => {
      setViewMode("floor");
      onSelectTable(tId);
      onSelectReservation?.(rId, tId);
    }}
  />
)}
```

- [ ] **Step 5: Replace old reserve dialog with new components**

Remove the old reserve dialog (lines 322-361). Replace with the three new dialogs:

For the available table action button, change onClick to show ReservationDialog.
For reserved table, add Cancel button and change Seat button to show SeatReservationDialog.

Replace old reserve dialog block with:
```tsx
{/* ReservationDialog */}
{showReserveDialog && selectedTableId && selectedTable && (
  <ReservationDialog
    table={selectedTable}
    onConfirm={(data) => {
      onReserveTable?.(selectedTableId, data);
      setShowReserveDialog(false);
    }}
    onCancel={() => setShowReserveDialog(false)}
  />
)}

{/* CancelReservationDialog */}
{showCancelDialog && selectedTableId && selectedTable && reservations && (
  <CancelReservationDialog
    table={selectedTable}
    reservation={reservations.find(r => r.tableId === selectedTableId && r.status === "pending")!}
    onConfirm={(reason, note) => {
      onCancelReservation?.(selectedTableId, reason, note);
      setShowCancelDialog(false);
    }}
    onCancel={() => setShowCancelDialog(false)}
  />
)}

{/* SeatReservationDialog */}
{showSeatDialog && selectedTableId && selectedTable && reservations && (
  <SeatReservationDialog
    table={selectedTable}
    reservation={reservations.find(r => r.tableId === selectedTableId && r.status === "pending")!}
    onConfirm={(guestCount, customerId) => {
      onSeatReserved?.(selectedTableId, guestCount, customerId);
      setShowSeatDialog(false);
    }}
    onCancel={() => setShowSeatDialog(false)}
  />
)}
```

Update the reserved table action buttons section:
```tsx
{selectedTable?.status === "reserved" && (
  <>
    <Button
      size="sm"
      className="w-full justify-start gap-2 text-xs rounded-lg min-h-[40px]"
      onClick={() => setShowSeatDialog(true)}
    >
      <UserCheck className="h-3.5 w-3.5" />
      {t("seatGuests")}
    </Button>
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-start gap-2 text-xs rounded-lg min-h-[40px] text-status-red hover:text-status-red"
      onClick={() => setShowCancelDialog(true)}
    >
      <X className="h-3.5 w-3.5" />
      {t("cancelReservation")}
    </Button>
  </>
)}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/tablet/FloorPanel.tsx
git commit -m "feat: wire FloorPanel with reservation dialogs, list panel, and view toggle"
```

---

### Task 8: Wire TabletPOS — State Management & Callbacks

**Files:**
- Modify: `src/pages/TabletPOS.tsx`

- [ ] **Step 1: Import Reservation type and mock data**

Add to imports:
```typescript
import { type Reservation, type CancelReason, reservations as mockReservations } from "@/data/mock-data";
```

- [ ] **Step 2: Add reservations state**

After existing state declarations (around line 84):
```typescript
const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
```

- [ ] **Step 3: Update handleReserveTable to create Reservation record**

Replace existing `handleReserveTable` (lines 179-184):

```typescript
const handleReserveTable = useCallback((tableId: string, data: { guestName: string; guestCount: number; phone?: string; reservationTime?: string; notes?: string }) => {
  const table = tables.find(t => t.id === tableId);
  if (!table) return;

  // Create Reservation record
  const newReservation: Reservation = {
    id: `r-${Date.now()}`,
    tableId,
    tableNumber: table.number,
    zone: table.zone,
    guestName: data.guestName,
    guestCount: data.guestCount,
    phone: data.phone,
    reservationTime: data.reservationTime,
    createdAt: new Date().toISOString(),
    status: "pending",
    notes: data.notes,
  };
  setReservations(prev => [...prev, newReservation]);

  // Update table
  setTables(prev => prev.map(t =>
    t.id === tableId ? {
      ...t,
      status: "reserved" as const,
      guestCount: data.guestCount,
      reservationName: data.guestName,
      reservationTime: data.reservationTime,
      reservationPhone: data.phone,
      reservationNotes: data.notes,
    } : t
  ));
  setCurrentOrder(null);
}, [tables]);
```

- [ ] **Step 4: Add handleCancelReservation**

```typescript
const handleCancelReservation = useCallback((tableId: string, reason: CancelReason, note?: string) => {
  // Update reservation
  setReservations(prev => prev.map(r =>
    r.tableId === tableId && r.status === "pending"
      ? { ...r, status: (reason === "no-show" ? "no-show" : "cancelled") as const, cancelReason: reason, cancelNote: note }
      : r
  ));
  // Reset table
  setTables(prev => prev.map(t =>
    t.id === tableId ? {
      ...t,
      status: "available" as const,
      guestCount: undefined,
      reservationName: undefined,
      reservationTime: undefined,
      reservationPhone: undefined,
      reservationNotes: undefined,
    } : t
  ));
  setCurrentOrder(null);
}, []);
```

- [ ] **Step 5: Update handleSeatReserved to accept guestCount and customerId**

Replace existing `handleSeatReserved` (lines 157-176):

```typescript
const handleSeatReserved = useCallback((tableId: string, guestCount: number, customerId?: string) => {
  const table = tables.find(t => t.id === tableId);
  if (!table || table.status !== "reserved") return;

  const newOrder: Order = {
    id: `o-${Date.now()}`,
    tableId,
    tableNumber: table.number,
    serviceMode: "dine-in",
    items: [],
    status: "open",
    guestCount,
    createdAt: new Date().toISOString(),
    subtotal: 0, serviceCharge: 0, gst: 0, total: 0,
    customerId,
  };
  setCurrentOrder(newOrder);
  setOrders(prev => [...prev, newOrder]);

  // Update table — clear reservation fields
  setTables(prev => prev.map(t =>
    t.id === tableId ? {
      ...t,
      status: "ordering" as const,
      guestCount,
      orderId: newOrder.id,
      elapsedMinutes: 0,
      reservationTime: undefined,
      reservationPhone: undefined,
      reservationNotes: undefined,
    } : t
  ));

  // Update reservation status
  setReservations(prev => prev.map(r =>
    r.tableId === tableId && r.status === "pending"
      ? { ...r, status: "seated" as const, customerId }
      : r
  ));
}, [tables]);
```

- [ ] **Step 6: Pass new props to FloorPanel**

Update the FloorPanel JSX to include new props:

```tsx
<FloorPanel
  tables={tables}
  selectedTableId={selectedTableId}
  onSelectTable={handleSelectTable}
  onCreateWalkIn={handleCreateWalkIn}
  onTransferTable={handleTransferTable}
  onMergeTables={handleMergeTables}
  onSplitTable={handleSplitTable}
  isFullscreen={false}
  onToggleFullscreen={() => setFloorFullscreen(true)}
  onSeatReserved={handleSeatReserved}
  onReserveTable={handleReserveTable}
  onCancelReservation={handleCancelReservation}
  reservations={reservations}
/>
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/TabletPOS.tsx
git commit -m "feat: wire TabletPOS with reservation state management and callbacks"
```

---

### Task 9: Display Reservation Info on Table Cards

**Files:**
- Modify: `src/components/tablet/FloorPanel.tsx` (table card rendering)

- [ ] **Step 1: Show reservation name and time on reserved table cards**

In the table card rendering (around line 240-265), after the status badge, add reservation info for reserved tables:

```tsx
{/* Reservation info on card */}
{table.status === "reserved" && table.reservationName && (
  <div className="mt-1.5 pt-1 border-t border-border/50">
    <div className="text-[10px] font-medium text-primary truncate">{table.reservationName}</div>
    {table.reservationTime && (
      <div className="text-[10px] text-muted-foreground flex items-center gap-0.5">
        <Clock className="h-2.5 w-2.5" />
        {new Date(table.reservationTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    )}
  </div>
)}
```

Add `Clock` to the lucide-react imports at the top of the file.

- [ ] **Step 2: Commit**

```bash
git add src/components/tablet/FloorPanel.tsx
git commit -m "feat: show reservation name and time on table cards"
```

---

### Task 10: Manual Smoke Test & Fix

- [ ] **Step 1: Start dev server and verify**

Run: `cd /Users/ontanetwork/Documents/Claude\ Code/posandpay && npx vite --host`

Open http://localhost:8080/tablet and verify:
1. Available table shows "Reserve Table" button
2. Clicking Reserve opens new ReservationDialog with all fields
3. After reserving, table turns blue with name/time on card
4. Reserved table shows both "Seat Guests" and "Cancel Reservation" buttons
5. Cancel shows CancelReservationDialog with reason selection
6. Seat shows SeatReservationDialog with member search
7. After seating, order is created and menu composer opens
8. Reservations tab shows list with filtering
9. Click reservation in list navigates to table

- [ ] **Step 2: Fix any issues found during smoke test**

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "fix: address smoke test issues in reservation workflow"
```

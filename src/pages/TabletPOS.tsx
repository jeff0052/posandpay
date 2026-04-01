import React, { useState, useCallback, useRef } from "react";
import { Receipt, User } from "lucide-react";
import { FloorPanel } from "@/components/tablet/FloorPanel";
import { MenuComposer } from "@/components/tablet/MenuComposer";
import { CheckPanel } from "@/components/tablet/CheckPanel";
import { PaymentSheet } from "@/components/tablet/PaymentSheet";
import { OrderHistory } from "@/components/tablet/OrderHistory";
import type { PaidOrder } from "@/components/tablet/history/types";
import { tables as mockTables, sampleOrders, reservations as mockReservations, type Table, type Order, type OrderItem, type ServiceMode, type Reservation, type CancelReason } from "@/data/mock-data";
import { MemberIdentifyDialog } from "@/components/tablet/MemberIdentifyDialog";
import { type CustomerFull } from "@/state/customer-store";
import { getTierDiscount } from "@/state/membership-store";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings } from "@/state/settings-store";
import { getMenuItemsSnapshot } from "@/state/menu-store";
import { cn } from "@/lib/utils";
import { insertOrder, insertOrderItems, updateOrderStatus, updateOrderTotals } from "@/lib/db-orders";

// Generate 30 mock historical orders for demo
const generateMockHistory = (): PaidOrder[] => {
  const methods = ["Visa", "Mastercard", "UnionPay", "Alipay", "WeChat Pay", "PayNow", "Cash"];
  const modes: ("dine-in" | "takeaway" | "delivery")[] = ["dine-in", "takeaway", "delivery"];
  const itemNames = ["Chicken Rice", "Laksa", "Char Kway Teow", "Nasi Lemak", "Satay", "Teh Tarik", "Hokkien Mee", "Bak Kut Teh", "Chilli Crab", "Milo Dinosaur"];
  const result: PaidOrder[] = [];
  const now = Date.now();

  for (let i = 0; i < 30; i++) {
    const mode = modes[i % modes.length];
    const method = methods[i % methods.length];
    const itemCount = 1 + Math.floor(Math.random() * 4);
    const items: PaidOrder["items"] = [];
    for (let j = 0; j < itemCount; j++) {
      const price = 3 + Math.random() * 35;
      items.push({
        name: itemNames[(i + j) % itemNames.length],
        quantity: 1 + Math.floor(Math.random() * 2),
        price: Math.round(price * 100) / 100,
        modifiers: j === 0 ? [{ name: "Spicy", price: 0 }] : [],
      });
    }
    const subtotal = items.reduce((s, it) => s + (it.price + it.modifiers.reduce((ms, m) => ms + m.price, 0)) * it.quantity, 0);
    const serviceCharge = subtotal * 0.1;
    const gst = (subtotal + serviceCharge) * 0.09;
    const total = subtotal + serviceCharge + gst;

    const isCash = method === "Cash";
    const cashReceived = isCash ? Math.ceil(total / 10) * 10 : undefined;
    const changeDue = isCash && cashReceived ? cashReceived - total : undefined;

    result.push({
      id: `hist-${i}-${Date.now()}`,
      tableNumber: mode === "dine-in" ? String(1 + (i % 15)) : undefined,
      serviceMode: mode,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: i % 7 === 0 ? Math.round(subtotal * 0.1 * 100) / 100 : 0,
      serviceCharge: Math.round(serviceCharge * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      total: Math.round(total * 100) / 100,
      paidAt: new Date(now - i * 3600000 * (0.5 + Math.random())).toISOString(),
      paymentMethod: method,
      cashReceived: cashReceived ? Math.round(cashReceived * 100) / 100 : undefined,
      changeDue: changeDue ? Math.round(changeDue * 100) / 100 : undefined,
    });
  }
  return result;
};

const MIN_PANEL_FRAC = 1 / 6;
const MAX_PANEL_FRAC = 1 / 3;

const TabletPOS: React.FC = () => {
  const { t } = useLanguage();
  const settings = useSettings();
  const [tables, setTables] = useState(mockTables);
  const [orders, setOrders] = useState(sampleOrders);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [paidOrders, setPaidOrders] = useState<PaidOrder[]>(() => generateMockHistory());
  const [floorFullscreen, setFloorFullscreen] = useState(false);
  const [tableManagement, setTableManagement] = useState(true);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [linkedMember, setLinkedMember] = useState<CustomerFull | null>(null);
  const [balanceCredit, setBalanceCredit] = useState(0);
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);

  // Resizable panel widths (as fractions of screen width)
  const [leftWidth, setLeftWidth] = useState(0.22); // ~288px on 1280 screen
  const [rightWidth, setRightWidth] = useState(0.265); // ~340px on 1280 screen
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTable = tables.find(t => t.id === selectedTableId);

  // --- Drag handle logic ---
  const startDrag = useCallback((side: "left" | "right") => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      if (side === "left") {
        const frac = Math.min(MAX_PANEL_FRAC, Math.max(MIN_PANEL_FRAC, (clientX - rect.left) / rect.width));
        setLeftWidth(frac);
      } else {
        const frac = Math.min(MAX_PANEL_FRAC, Math.max(MIN_PANEL_FRAC, (rect.right - clientX) / rect.width));
        setRightWidth(frac);
      }
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove);
    document.addEventListener("touchend", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleSelectTable = useCallback((tableId: string) => {
    setSelectedTableId(tableId);
    setFloorFullscreen(false);
    const table = tables.find(t => t.id === tableId);
    if (table?.orderId) {
      const order = orders.find(o => o.id === table.orderId);
      setCurrentOrder(order || null);
    } else if (table?.status === "available") {
      // Don't auto-create order — let user choose to reserve or start ordering via menu
      setCurrentOrder(null);
    } else if (table?.status === "reserved") {
      // Reserved table selected — don't create order yet, just select
      setCurrentOrder(null);
    } else {
      setCurrentOrder(null);
    }
  }, [tables, orders]);

  // Seat reserved table guests
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

  // Reserve an available table
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

  // Cancel a reservation
  const handleCancelReservation = useCallback((tableId: string, reason: CancelReason, note?: string) => {
    setReservations(prev => prev.map(r =>
      r.tableId === tableId && r.status === "pending"
        ? { ...r, status: (reason === "no-show" ? "no-show" : "cancelled") as Reservation["status"], cancelReason: reason, cancelNote: note }
        : r
    ));
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

  // Void an order
  const handleVoidOrder = useCallback(() => {
    if (!currentOrder) return;
    const voidedOrder: Order = { ...currentOrder, status: "void" as const };
    setCurrentOrder(null);
    setOrders(prev => prev.map(o => o.id === voidedOrder.id ? voidedOrder : o));
    if (voidedOrder.tableId) {
      setTables(prev => prev.map(t =>
        t.id === voidedOrder.tableId ? { ...t, status: "available" as const, guestCount: undefined, orderId: undefined, openAmount: undefined, elapsedMinutes: undefined } : t
      ));
    }
    updateOrderStatus(voidedOrder.id, "void");
  }, [currentOrder]);

  const handleCreateWalkIn = useCallback((mode: ServiceMode) => {
    const newOrder: Order = {
      id: `o-${Date.now()}`,
      serviceMode: mode,
      items: [],
      status: "open",
      guestCount: 1,
      createdAt: new Date().toISOString(),
      subtotal: 0, serviceCharge: 0, gst: 0, total: 0,
    };
    setCurrentOrder(newOrder);
    setOrders(prev => [...prev, newOrder]);
    setSelectedTableId(null);
  }, []);

  const recalcOrder = (items: OrderItem[]): Pick<Order, "subtotal" | "serviceCharge" | "gst" | "total"> => {
    const subtotal = Math.round(items.reduce((sum, item) => {
      const modTotal = item.modifiers.reduce((ms, m) => ms + m.price, 0);
      return sum + (item.price + modTotal) * item.quantity;
    }, 0) * 100) / 100;
    const serviceCharge = Math.round(subtotal * 0.1 * 100) / 100;
    const gst = Math.round((subtotal + serviceCharge) * 0.09 * 100) / 100;
    const total = Math.round((subtotal + serviceCharge + gst) * 100) / 100;
    return { subtotal, serviceCharge, gst, total };
  };

  const handleAddItem = useCallback((menuItemId: string, modifiers: { name: string; price: number }[], notes?: string, comboItems?: { name: string; groupName: string }[]) => {
    // Auto-create order when adding first item to an available table
    if (!currentOrder && selectedTableId) {
      const table = tables.find(t => t.id === selectedTableId);
      if (table?.status === "available") {
        const newOrder: Order = {
          id: `o-${Date.now()}`,
          tableId: selectedTableId,
          tableNumber: table.number,
          serviceMode: "dine-in",
          items: [],
          status: "open",
          guestCount: 1,
          createdAt: new Date().toISOString(),
          subtotal: 0, serviceCharge: 0, gst: 0, total: 0,
        };
        setCurrentOrder(newOrder);
        setOrders(prev => [...prev, newOrder]);
        setTables(prev => prev.map(t =>
          t.id === selectedTableId ? { ...t, status: "ordering" as const, guestCount: 1, orderId: newOrder.id, elapsedMinutes: 0 } : t
        ));
        insertOrder({
          id: newOrder.id, table_id: selectedTableId, table_number: table.number,
          service_mode: "dine-in", status: "open", guest_count: 1,
          subtotal: 0, service_charge: 0, gst: 0, total: 0,
        });
        // Will add the item on next render via effect — for now return
        // Actually, set the item directly on the new order
        const menuItemData = getMenuItemsSnapshot().find(m => m.id === menuItemId);
        if (menuItemData) {
          const newItem: OrderItem = {
            id: `oi-${Date.now()}`,
            menuItemId,
            name: menuItemData.name,
            price: menuItemData.price,
            quantity: 1,
            modifiers,
            notes,
            status: "new",
            comboItems,
          };
          const totals = recalcOrder([newItem]);
          const orderWithItem = { ...newOrder, items: [newItem], ...totals };
          setCurrentOrder(orderWithItem);
          setOrders(prev => prev.map(o => o.id === newOrder.id ? orderWithItem : o));
        }
        return;
      }
    }
    if (!currentOrder) return;
    const menuItem = getMenuItemsSnapshot().find(m => m.id === menuItemId);
    if (!menuItem) return;

    setCurrentOrder(prev => {
      if (!prev) return prev;
      const existing = !comboItems && prev.items.find(i => i.menuItemId === menuItemId && JSON.stringify(i.modifiers) === JSON.stringify(modifiers) && i.notes === notes);
      let newItems: OrderItem[];
      if (existing) {
        newItems = prev.items.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        const newItem: OrderItem = {
          id: `oi-${Date.now()}`,
          menuItemId,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          modifiers,
          notes,
          status: "new",
          comboItems,
        };
        newItems = [...prev.items, newItem];
      }
      const totals = recalcOrder(newItems);
      return { ...prev, items: newItems, ...totals };
    });

    if (selectedTableId) {
      setTables(prev => prev.map(t =>
        t.id === selectedTableId && t.status === "ordering" ? { ...t, openAmount: undefined } : t
      ));
    }
  }, [currentOrder, selectedTableId, tables]);

  const handleUpdateQuantity = useCallback((itemId: string, delta: number) => {
    setCurrentOrder(prev => {
      if (!prev) return prev;
      const newItems = prev.items.map(i =>
        i.id === itemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
      ).filter(i => i.quantity > 0);
      const totals = recalcOrder(newItems);
      return { ...prev, items: newItems, ...totals };
    });
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setCurrentOrder(prev => {
      if (!prev) return prev;
      const newItems = prev.items.filter(i => i.id !== itemId);
      const totals = recalcOrder(newItems);
      return { ...prev, items: newItems, ...totals };
    });
  }, []);

  const paymentMethods = ["Visa", "Mastercard", "UnionPay", "Alipay", "WeChat Pay", "PayNow", "Cash"];

  const handlePaymentComplete = useCallback(async (method?: string, cashReceived?: number) => {
    if (currentOrder) {
      const isCash = method === "Cash";
      const changeDue = isCash && cashReceived ? cashReceived - currentOrder.total : undefined;

      const paid: PaidOrder = {
        id: currentOrder.id,
        tableNumber: currentOrder.tableNumber,
        serviceMode: currentOrder.serviceMode,
        items: currentOrder.items.map(i => ({
          name: i.name, quantity: i.quantity, price: i.price,
          modifiers: i.modifiers,
        })),
        subtotal: currentOrder.subtotal,
        discount: 0,
        serviceCharge: currentOrder.serviceCharge,
        gst: currentOrder.gst,
        total: currentOrder.total,
        paidAt: new Date().toISOString(),
        paymentMethod: method || paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        cashReceived: isCash ? cashReceived : undefined,
        changeDue,
      };
      setPaidOrders(prev => [paid, ...prev]);

      // Persist payment to DB
      await updateOrderStatus(currentOrder.id, "paid");

      // Fast-food mode: auto-fire items to kitchen after payment
      if (settings.serviceFlow === "fast-food" && currentOrder) {
        setOrders(prev => prev.map(o =>
          o.id === currentOrder.id ? {
            ...o,
            status: "paid" as const,
            items: o.items.map(item => ({
              ...item,
              firedAt: item.firedAt || new Date().toISOString(),
              status: "new" as const,
            })),
          } : o
        ));
      }
    }
    setShowPayment(false);
    if (currentOrder?.tableId) {
      setTables(prev => prev.map(t =>
        t.id === currentOrder.tableId ? { ...t, status: "dirty" as const, guestCount: undefined, openAmount: undefined, orderId: undefined, elapsedMinutes: undefined } : t
      ));
    }
    setCurrentOrder(null);
    setSelectedTableId(null);
  }, [currentOrder]);

  const handleTransferTable = useCallback((fromId: string, toId: string) => {
    setTables(prev => {
      const fromTable = prev.find(t => t.id === fromId);
      const toTable = prev.find(t => t.id === toId);
      if (!fromTable || !toTable) return prev;
      return prev.map(t => {
        if (t.id === fromId) return { ...t, status: "available" as const, guestCount: undefined, server: undefined, openAmount: undefined, elapsedMinutes: undefined, orderId: undefined };
        if (t.id === toId) return { ...t, status: fromTable.status, guestCount: fromTable.guestCount, server: fromTable.server, openAmount: fromTable.openAmount, elapsedMinutes: fromTable.elapsedMinutes, orderId: fromTable.orderId };
        return t;
      });
    });
    // Update orders array to reflect new table association
    if (currentOrder?.tableId === fromId) {
      const toTable = tables.find(t => t.id === toId);
      setOrders(prev => prev.map(o =>
        o.id === currentOrder.id ? { ...o, tableId: toId, tableNumber: toTable?.number } : o
      ));
      setCurrentOrder(prev => prev ? { ...prev, tableId: toId, tableNumber: toTable?.number } : prev);
      setSelectedTableId(toId);
    }
  }, [currentOrder, tables]);

  const handleMergeTables = useCallback((tableIds: string[]) => {
    if (tableIds.length < 2) return;
    const primary = tableIds[0];
    const others = tableIds.slice(1);
    setTables(prev => prev.map(t => {
      if (t.id === primary) {
        const totalSeats = tableIds.reduce((sum, id) => sum + (prev.find(x => x.id === id)?.seats || 0), 0);
        return { ...t, seats: totalSeats, mergedWith: others };
      }
      if (others.includes(t.id)) return { ...t, status: "available" as const, mergedWith: undefined };
      return t;
    }));
  }, []);

  const handleSplitTable = useCallback((tableId: string, count: number) => {
    setTables(prev => {
      const table = prev.find(t => t.id === tableId);
      if (!table) return prev;
      const seatsEach = Math.max(2, Math.floor(table.seats / count));
      const newTables: Table[] = [];
      for (let i = 1; i < count; i++) {
        newTables.push({
          id: `${tableId}-s${i}`,
          number: `${table.number}${String.fromCharCode(65 + i)}`,
          zone: table.zone,
          seats: seatsEach,
          status: "available",
        });
      }
      return [
        ...prev.map(t => t.id === tableId ? { ...t, seats: seatsEach, number: `${table.number}A` } : t),
        ...newTables,
      ];
    });
  }, []);

  const showCheckPanel = !showHistory;

  return (
    <div ref={containerRef} className="flex h-screen bg-background overflow-hidden relative">
      {/* Floor Panel with drag handle */}
      {tableManagement && !floorFullscreen && (
        <>
          <div style={{ width: `${leftWidth * 100}%` }} className="shrink-0 relative">
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
          </div>
          {/* Left drag handle */}
          <div
            className="w-3 shrink-0 drag-handle relative z-10"
            onMouseDown={() => startDrag("left")}
            onTouchStart={() => startDrag("left")}
          />
        </>
      )}

      {tableManagement && floorFullscreen && (
        <FloorPanel
          tables={tables}
          selectedTableId={selectedTableId}
          onSelectTable={handleSelectTable}
          onCreateWalkIn={handleCreateWalkIn}
          onTransferTable={handleTransferTable}
          onMergeTables={handleMergeTables}
          onSplitTable={handleSplitTable}
          isFullscreen={true}
          onToggleFullscreen={() => setFloorFullscreen(false)}
          onSeatReserved={handleSeatReserved}
          onReserveTable={handleReserveTable}
          onCancelReservation={handleCancelReservation}
          reservations={reservations}
        />
      )}

      {!floorFullscreen && (
        <>
          <MenuComposer
            onAddItem={handleAddItem}
            selectedTable={selectedTable}
            currentOrder={currentOrder}
          />

          {/* Right drag handle */}
          <div
            className="w-3 shrink-0 drag-handle relative z-10"
            onMouseDown={() => startDrag("right")}
            onTouchStart={() => startDrag("right")}
          />

          {/* Right panel: check or history */}
          <div style={{ width: `${rightWidth * 100}%` }} className="shrink-0 flex flex-col">
            {/* Top controls bar — History button + ThemeToggle aligned */}
            <div className="h-[52px] flex items-center justify-end gap-1.5 px-2 border-b border-border bg-card shrink-0 overflow-hidden">
              <button
                onClick={() => setShowHistory(h => !h)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-1.5 text-[11px] font-medium transition-colors min-h-[36px] shrink-0 whitespace-nowrap",
                  showHistory
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Receipt className="h-3.5 w-3.5 shrink-0" />
                {t("history")}
                {paidOrders.length > 0 && (
                  <span className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                    showHistory ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"
                  )}>
                    {paidOrders.length}
                  </span>
                )}
              </button>
              <ThemeToggle />
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden">
              {showCheckPanel ? (
                <CheckPanel
                  order={currentOrder}
                  table={selectedTable}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onPay={() => setShowPayment(true)}
                  serviceFlow={settings.serviceFlow}
                  onSendToKitchen={handleSendToKitchen}
                  onVoidOrder={handleVoidOrder}
                  linkedMember={linkedMember ? {
                    name: linkedMember.name,
                    tier: linkedMember.tier,
                    discountPercent: getTierDiscount(`tier-${linkedMember.tier.toLowerCase()}`),
                  } : null}
                  onMemberClick={() => setShowMemberDialog(true)}
                  balanceCredit={balanceCredit}
                />
              ) : (
                <OrderHistory orders={paidOrders} onClose={() => setShowHistory(false)} />
              )}
            </div>
          </div>
        </>
      )}

      {showPayment && currentOrder && (
        <PaymentSheet
          order={currentOrder}
          onClose={() => setShowPayment(false)}
          onComplete={handlePaymentComplete}
        />
      )}

      {/* Member Identify Dialog */}
      <MemberIdentifyDialog
        open={showMemberDialog}
        onClose={() => setShowMemberDialog(false)}
        onMemberFound={(customer) => setLinkedMember(customer)}
        onClearMember={() => { setLinkedMember(null); setBalanceCredit(0); }}
        currentMember={linkedMember}
        onUseBalance={(amount) => setBalanceCredit(prev => prev + amount)}
      />
    </div>
  );
};

export default TabletPOS;

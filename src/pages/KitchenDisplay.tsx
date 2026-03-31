import React, { useState, useEffect, useCallback } from "react";
import { ChefHat, UtensilsCrossed, Clock, AlertTriangle, X, Check, Ban, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettings } from "@/state/settings-store";
import { useLanguage } from "@/hooks/useLanguage";
import { Link } from "react-router-dom";
import { MOCK_KDS_TICKETS, groupTicketsByOrder, getOrderStatus, SERVICE_MODE_LABELS, type KDSTicket, type KDSOrder } from "@/data/mock-kds-data";

interface VoidNotification {
  orderId: string;
  tableNumber?: string;
  timestamp: string;
}

const KitchenDisplay: React.FC = () => {
  const { t } = useLanguage();
  const settings = useSettings();
  const [view, setView] = useState<"kitchen" | "pickup">("kitchen");
  const [tickets, setTickets] = useState<KDSTicket[]>(MOCK_KDS_TICKETS);
  const [voidNotifications, setVoidNotifications] = useState<VoidNotification[]>([
    // One sample void notification
    { orderId: "ORD-2410", tableNumber: "4", timestamp: new Date().toISOString() },
  ]);
  const [, setTick] = useState(0);

  // Refresh elapsed times every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  const getElapsedMin = (firedAt?: string) => {
    if (!firedAt) return 0;
    return Math.floor((Date.now() - new Date(firedAt).getTime()) / 60000);
  };

  // Color based on elapsed time for NEW orders
  const getOrderColor = (order: KDSOrder) => {
    if (getOrderStatus(order) !== "new") return "default";
    const elapsed = getElapsedMin(order.firedAt);
    if (elapsed >= settings.kdsUrgentMinutes) return "red";
    if (elapsed >= settings.kdsWarningMinutes) return "yellow";
    return "green";
  };

  const colorStyles = {
    green: { border: "border-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
    yellow: { border: "border-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
    red: { border: "border-red-500", bg: "bg-red-50 dark:bg-red-950/30", text: "text-red-700 dark:text-red-400", dot: "bg-red-500" },
    default: { border: "border-border", bg: "bg-card", text: "text-foreground", dot: "bg-muted-foreground" },
  };

  // Per-item status dot color
  const itemStatusDot = (status: KDSTicket["status"]) => {
    if (status === "new") return "bg-emerald-500";
    if (status === "preparing") return "bg-amber-500";
    if (status === "ready") return "bg-blue-500";
    return "bg-muted-foreground";
  };

  // Move all items in an order that match fromStatus to toStatus
  const moveOrderItems = useCallback((orderId: string, fromStatus: KDSTicket["status"], toStatus: KDSTicket["status"]) => {
    setTickets(prev => prev.map(t =>
      t.orderId === orderId && t.status === fromStatus ? { ...t, status: toStatus } : t
    ));
  }, []);

  // Remove all items in an order
  const removeOrder = useCallback((orderId: string) => {
    setTickets(prev => prev.filter(t => t.orderId !== orderId));
  }, []);

  const dismissVoid = useCallback((orderId: string) => {
    setVoidNotifications(prev => prev.filter(v => v.orderId !== orderId));
  }, []);

  // Group tickets into orders and assign to columns
  const orders = groupTicketsByOrder(tickets);
  const newOrders = orders.filter(o => getOrderStatus(o) === "new");
  const preparingOrders = orders.filter(o => getOrderStatus(o) === "preparing");
  const readyOrders = orders.filter(o => getOrderStatus(o) === "ready");

  // Service mode badge component
  const ServiceBadge = ({ mode }: { mode: string }) => {
    const label = SERVICE_MODE_LABELS[mode] || SERVICE_MODE_LABELS["dine-in"];
    return (
      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", label.color)}>
        {label.en}
      </span>
    );
  };

  // Render a single item line within an order card
  const ItemLine = ({ item, large }: { item: KDSTicket; large?: boolean }) => (
    <div className={cn("py-1", large ? "py-1.5" : "")}>
      <div className="flex items-start gap-2">
        <span className={cn("mt-1.5 shrink-0 h-2 w-2 rounded-full", itemStatusDot(item.status))} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className={cn("font-bold text-foreground", large ? "text-lg" : "text-[13px]")}>
              {item.name}
            </span>
            <span className={cn("text-muted-foreground", large ? "text-base" : "text-[12px]")}>
              x{item.quantity}
            </span>
            {item.seat != null && item.seat > 0 && (
              <span className="text-[10px] text-muted-foreground font-mono ml-auto shrink-0">S{item.seat}</span>
            )}
          </div>
          {item.modifiers?.map((m, i) => (
            <div key={i} className={cn("text-muted-foreground", large ? "text-sm" : "text-[11px]")}>
              + {m.name}
            </div>
          ))}
          {item.combo_items?.map((c, i) => (
            <div key={i} className={cn("text-muted-foreground", large ? "text-sm" : "text-[11px]")}>
              <span className="opacity-60">{c.groupName}:</span> {c.name}
            </div>
          ))}
          {item.notes && !item.notes.includes("Serve all") && (
            <div className={cn("text-amber-600 dark:text-amber-400 mt-0.5", large ? "text-sm" : "text-[11px]")}>
              {item.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render an order card for kitchen view
  const OrderCard = ({ order, column }: { order: KDSOrder; column: "new" | "preparing" | "ready" }) => {
    const color = column === "new" ? getOrderColor(order) : "default";
    const styles = column === "new" ? colorStyles[color] :
      column === "preparing" ? { border: "border-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600", dot: "bg-amber-500" } :
      { border: "border-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600", dot: "bg-blue-500" };
    const elapsed = getElapsedMin(order.firedAt);

    return (
      <div className={cn(
        "rounded-xl border-2 p-3 transition-all",
        styles.border, styles.bg,
        color === "red" && "animate-pulse"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-mono text-muted-foreground font-bold">{order.orderId}</span>
          <div className="flex items-center gap-1.5">
            {order.tableNumber ? (
              <span className="text-[11px] font-semibold">T{order.tableNumber}</span>
            ) : (
              <ServiceBadge mode={order.serviceMode} />
            )}
            <span className={cn("text-[11px] font-bold", styles.text)}>{elapsed}m</span>
          </div>
        </div>

        {/* Order-level note banner */}
        {order.orderNote && (
          <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[11px] font-semibold px-2 py-1 rounded-md mb-2">
            {order.orderNote}
          </div>
        )}

        {/* Service mode badge for dine-in (non-dine-in already shown in header) */}
        {order.tableNumber && order.serviceMode !== "dine-in" && (
          <div className="mb-1"><ServiceBadge mode={order.serviceMode} /></div>
        )}

        {/* Items list */}
        <div className="divide-y divide-border/50">
          {order.items.map(item => (
            <ItemLine key={item.id} item={item} />
          ))}
        </div>

        {/* Action button */}
        {column === "new" && (
          <Button size="sm" className="w-full mt-2 h-8 text-[12px] bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => moveOrderItems(order.orderId, "new", "preparing")}>
            Start All
          </Button>
        )}
        {column === "preparing" && (
          <Button size="sm" className="w-full mt-2 h-8 text-[12px] bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => moveOrderItems(order.orderId, "preparing", "ready")}>
            All Ready
          </Button>
        )}
        {column === "ready" && (
          <Button size="sm" className="w-full mt-2 h-8 text-[12px]"
            onClick={() => removeOrder(order.orderId)}>
            Served
          </Button>
        )}
      </div>
    );
  };

  // Render an order card for pickup view (larger text)
  const PickupOrderCard = ({ order, column }: { order: KDSOrder; column: "preparing" | "ready" }) => {
    const elapsed = getElapsedMin(order.firedAt);
    const borderColor = column === "preparing" ? "border-amber-400" : "border-emerald-400";
    const bgColor = column === "preparing" ? "bg-amber-50 dark:bg-amber-950/30" : "bg-emerald-50 dark:bg-emerald-950/30";
    const elapsedColor = column === "preparing" ? "text-amber-600" : "text-emerald-600";

    return (
      <div className={cn("rounded-xl border-2 p-4", borderColor, bgColor)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-mono font-bold text-foreground">{order.orderId}</span>
          <div className="flex items-center gap-2">
            {order.tableNumber ? (
              <span className={cn("text-lg font-bold", elapsedColor)}>Table {order.tableNumber}</span>
            ) : (
              <ServiceBadge mode={order.serviceMode} />
            )}
            <span className={cn("text-sm font-bold", elapsedColor)}>{elapsed}m</span>
          </div>
        </div>

        {/* Order-level note banner */}
        {order.orderNote && (
          <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-sm font-semibold px-2 py-1 rounded-md mt-2">
            {order.orderNote}
          </div>
        )}

        {/* Items list */}
        <div className="mt-2 divide-y divide-border/50">
          {order.items.map(item => (
            <ItemLine key={item.id} item={item} large />
          ))}
        </div>

        {column === "ready" && (
          <Button size="lg" className="w-full mt-3 h-12 text-[14px] bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => removeOrder(order.orderId)}>
            {t("pickedUp")}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background pattern-cross">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-3 shrink-0">
        <Link to="/" className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
          <Home className="h-4 w-4" />
        </Link>
        <ChefHat className="h-5 w-5 text-primary" />
        <h1 className="text-[15px] font-bold text-foreground">{t("kitchenDisplay")}</h1>
        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex bg-accent rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setView("kitchen")}
            className={cn("px-4 py-1.5 rounded-md text-[12px] font-semibold transition-colors",
              view === "kitchen" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UtensilsCrossed className="h-3.5 w-3.5 inline mr-1.5" />{t("kitchenView")}
          </button>
          <button
            onClick={() => setView("pickup")}
            className={cn("px-4 py-1.5 rounded-md text-[12px] font-semibold transition-colors",
              view === "pickup" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowRight className="h-3.5 w-3.5 inline mr-1.5" />{t("pickupView")}
          </button>
        </div>

        <div className="text-[11px] text-muted-foreground font-mono">
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </header>

      {/* Void notifications banner */}
      {voidNotifications.length > 0 && (
        <div className="bg-red-600 text-white px-4 py-2 space-y-1">
          {voidNotifications.map(v => (
            <div key={v.orderId} className="flex items-center gap-3">
              <Ban className="h-4 w-4 animate-pulse" />
              <span className="text-[13px] font-bold flex-1">
                {t("orderCancelled")} — {v.orderId} {v.tableNumber && `(Table ${v.tableNumber})`}
              </span>
              <Button size="sm" variant="secondary" className="h-7 text-[11px] gap-1" onClick={() => dismissVoid(v.orderId)}>
                <Check className="h-3 w-3" /> {t("acknowledged")}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden p-4">
        {view === "kitchen" ? (
          /* ===== KITCHEN VIEW ===== */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            {/* NEW column */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Clock className="h-4 w-4 text-emerald-500" />
                <span className="text-[13px] font-bold text-foreground">{t("newOrders")}</span>
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full">{newOrders.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pos-scrollbar">
                {newOrders.map(order => (
                  <OrderCard key={order.orderId} order={order} column="new" />
                ))}
              </div>
            </div>

            {/* PREPARING column */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3 px-1">
                <ChefHat className="h-4 w-4 text-amber-500" />
                <span className="text-[13px] font-bold text-foreground">{t("preparing")}</span>
                <span className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full">{preparingOrders.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pos-scrollbar">
                {preparingOrders.map(order => (
                  <OrderCard key={order.orderId} order={order} column="preparing" />
                ))}
              </div>
            </div>

            {/* READY column */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Check className="h-4 w-4 text-blue-500" />
                <span className="text-[13px] font-bold text-foreground">Ready</span>
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-[11px] font-bold px-2 py-0.5 rounded-full">{readyOrders.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pos-scrollbar">
                {readyOrders.map(order => (
                  <OrderCard key={order.orderId} order={order} column="ready" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ===== PICKUP VIEW ===== */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* PREPARING column */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-4 px-1">
                <ChefHat className="h-6 w-6 text-amber-500" />
                <span className="text-xl font-bold text-foreground">{t("preparing")}</span>
                <span className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-sm font-bold px-3 py-1 rounded-full">{preparingOrders.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pos-scrollbar">
                {preparingOrders.map(order => (
                  <PickupOrderCard key={order.orderId} order={order} column="preparing" />
                ))}
              </div>
            </div>

            {/* READY FOR PICKUP column */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-4 px-1">
                <Check className="h-6 w-6 text-emerald-500" />
                <span className="text-xl font-bold text-foreground">{t("readyForPickup")}</span>
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-sm font-bold px-3 py-1 rounded-full">{readyOrders.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pos-scrollbar">
                {readyOrders.map(order => (
                  <PickupOrderCard key={order.orderId} order={order} column="ready" />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;

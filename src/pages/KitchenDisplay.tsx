import React, { useState, useEffect, useCallback } from "react";
import { ChefHat, UtensilsCrossed, Clock, AlertTriangle, X, Check, Ban, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettings } from "@/state/settings-store";
import { useLanguage } from "@/hooks/useLanguage";
import { Link } from "react-router-dom";

// KDS ticket type (same as AdminKDS)
interface KDSTicket {
  id: string;
  name: string;
  quantity: number;
  status: "new" | "preparing" | "ready" | "served";
  notes?: string;
  fired_at?: string;
  modifiers?: { name: string; price: number }[];
  combo_items?: { name: string; groupName: string }[];
  orderId: string;
  tableNumber?: string;
  serviceMode?: string;
}

interface VoidNotification {
  orderId: string;
  tableNumber?: string;
  timestamp: string;
}

// Mock tickets — same Singapore dishes as AdminKDS
const MOCK_TICKETS: KDSTicket[] = [
  { id: "k1", name: "Chicken Rice", quantity: 2, status: "new", fired_at: new Date(Date.now() - 2 * 60000).toISOString(), orderId: "ORD-2404", tableNumber: "12", serviceMode: "dine-in" },
  { id: "k2", name: "Laksa", quantity: 1, status: "new", fired_at: new Date(Date.now() - 6 * 60000).toISOString(), notes: "Extra spicy", orderId: "ORD-2404", tableNumber: "12", serviceMode: "dine-in" },
  { id: "k3", name: "Satay (10pc)", quantity: 1, status: "new", fired_at: new Date(Date.now() - 12 * 60000).toISOString(), modifiers: [{ name: "Extra Peanut Sauce", price: 0 }], orderId: "ORD-2409", tableNumber: "10", serviceMode: "dine-in" },
  { id: "k4", name: "Char Kway Teow", quantity: 1, status: "preparing", fired_at: new Date(Date.now() - 8 * 60000).toISOString(), orderId: "ORD-2405", serviceMode: "delivery" },
  { id: "k5", name: "Nasi Lemak Set", quantity: 2, status: "preparing", fired_at: new Date(Date.now() - 10 * 60000).toISOString(), orderId: "ORD-2409", tableNumber: "10", serviceMode: "dine-in" },
  { id: "k6", name: "Bak Kut Teh", quantity: 1, status: "preparing", fired_at: new Date(Date.now() - 4 * 60000).toISOString(), notes: "Less pepper", orderId: "ORD-2404", tableNumber: "12", serviceMode: "dine-in" },
  { id: "k7", name: "Prawn Crackers", quantity: 3, status: "ready", fired_at: new Date(Date.now() - 15 * 60000).toISOString(), orderId: "ORD-2402", tableNumber: "7", serviceMode: "dine-in" },
  { id: "k8", name: "Teh Tarik", quantity: 2, status: "ready", fired_at: new Date(Date.now() - 14 * 60000).toISOString(), orderId: "ORD-2405", serviceMode: "delivery" },
  { id: "k9", name: "Hokkien Mee", quantity: 1, status: "new", fired_at: new Date(Date.now() - 1 * 60000).toISOString(), orderId: "ORD-2406", tableNumber: "1", serviceMode: "dine-in" },
];

const KitchenDisplay: React.FC = () => {
  const { t } = useLanguage();
  const settings = useSettings();
  const [view, setView] = useState<"kitchen" | "pickup">("kitchen");
  const [tickets, setTickets] = useState<KDSTicket[]>(MOCK_TICKETS);
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

  // Color based on elapsed time for NEW items
  const getTicketColor = (ticket: KDSTicket) => {
    if (ticket.status !== "new") return "default";
    const elapsed = getElapsedMin(ticket.fired_at);
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

  const moveTicket = useCallback((ticketId: string, newStatus: KDSTicket["status"]) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
  }, []);

  const removeTicket = useCallback((ticketId: string) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
  }, []);

  const dismissVoid = useCallback((orderId: string) => {
    setVoidNotifications(prev => prev.filter(v => v.orderId !== orderId));
  }, []);

  const newTickets = tickets.filter(t => t.status === "new");
  const preparingTickets = tickets.filter(t => t.status === "preparing");
  const readyTickets = tickets.filter(t => t.status === "ready");

  return (
    <div className="h-screen flex flex-col bg-background">
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
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full">{newTickets.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pos-scrollbar">
                {newTickets.map(ticket => {
                  const color = getTicketColor(ticket);
                  const styles = colorStyles[color];
                  const elapsed = getElapsedMin(ticket.fired_at);
                  return (
                    <div key={ticket.id} className={cn(
                      "rounded-xl border-2 p-3 transition-all",
                      styles.border, styles.bg,
                      color === "red" && "animate-pulse"
                    )}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono text-muted-foreground">{ticket.orderId}</span>
                        <div className="flex items-center gap-1.5">
                          {ticket.tableNumber && <span className="text-[11px] font-semibold">T{ticket.tableNumber}</span>}
                          <span className={cn("text-[11px] font-bold", styles.text)}>{elapsed}m</span>
                        </div>
                      </div>
                      <div className="text-[14px] font-bold text-foreground">{ticket.name} <span className="text-muted-foreground">x{ticket.quantity}</span></div>
                      {ticket.modifiers?.map((m, i) => (
                        <div key={i} className="text-[11px] text-muted-foreground mt-0.5">+ {m.name}</div>
                      ))}
                      {ticket.notes && <div className="text-[11px] text-amber-600 mt-1">{ticket.notes}</div>}
                      <Button size="sm" className="w-full mt-2 h-8 text-[12px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => moveTicket(ticket.id, "preparing")}>
                        {t("startPreparing")}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PREPARING column */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3 px-1">
                <ChefHat className="h-4 w-4 text-amber-500" />
                <span className="text-[13px] font-bold text-foreground">{t("preparing")}</span>
                <span className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full">{preparingTickets.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pos-scrollbar">
                {preparingTickets.map(ticket => {
                  const elapsed = getElapsedMin(ticket.fired_at);
                  return (
                    <div key={ticket.id} className="rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono text-muted-foreground">{ticket.orderId}</span>
                        <div className="flex items-center gap-1.5">
                          {ticket.tableNumber && <span className="text-[11px] font-semibold">T{ticket.tableNumber}</span>}
                          <span className="text-[11px] font-bold text-amber-600">{elapsed}m</span>
                        </div>
                      </div>
                      <div className="text-[14px] font-bold text-foreground">{ticket.name} <span className="text-muted-foreground">x{ticket.quantity}</span></div>
                      {ticket.modifiers?.map((m, i) => (
                        <div key={i} className="text-[11px] text-muted-foreground mt-0.5">+ {m.name}</div>
                      ))}
                      {ticket.notes && <div className="text-[11px] text-amber-600 mt-1">{ticket.notes}</div>}
                      <Button size="sm" className="w-full mt-2 h-8 text-[12px] bg-amber-600 hover:bg-amber-700 text-white" onClick={() => moveTicket(ticket.id, "ready")}>
                        {t("markReady")}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* READY column */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Check className="h-4 w-4 text-blue-500" />
                <span className="text-[13px] font-bold text-foreground">Ready</span>
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-[11px] font-bold px-2 py-0.5 rounded-full">{readyTickets.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pos-scrollbar">
                {readyTickets.map(ticket => {
                  const elapsed = getElapsedMin(ticket.fired_at);
                  return (
                    <div key={ticket.id} className="rounded-xl border-2 border-blue-400 bg-blue-50 dark:bg-blue-950/30 p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono text-muted-foreground">{ticket.orderId}</span>
                        <div className="flex items-center gap-1.5">
                          {ticket.tableNumber && <span className="text-[11px] font-semibold">T{ticket.tableNumber}</span>}
                          <span className="text-[11px] font-bold text-blue-600">{elapsed}m</span>
                        </div>
                      </div>
                      <div className="text-[14px] font-bold text-foreground">{ticket.name} <span className="text-muted-foreground">x{ticket.quantity}</span></div>
                      <Button size="sm" className="w-full mt-2 h-8 text-[12px]" onClick={() => removeTicket(ticket.id)}>
                        {t("markServed")}
                      </Button>
                    </div>
                  );
                })}
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
                <span className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-sm font-bold px-3 py-1 rounded-full">{preparingTickets.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pos-scrollbar">
                {preparingTickets.map(ticket => (
                  <div key={ticket.id} className="rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-mono font-bold text-foreground">{ticket.orderId}</span>
                      {ticket.tableNumber && <span className="text-lg font-bold text-amber-600">Table {ticket.tableNumber}</span>}
                    </div>
                    <div className="text-2xl font-bold text-foreground mt-2">{ticket.name} <span className="text-muted-foreground">x{ticket.quantity}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* READY FOR PICKUP column */}
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-4 px-1">
                <Check className="h-6 w-6 text-emerald-500" />
                <span className="text-xl font-bold text-foreground">{t("readyForPickup")}</span>
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-sm font-bold px-3 py-1 rounded-full">{readyTickets.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pos-scrollbar">
                {readyTickets.map(ticket => (
                  <div key={ticket.id} className="rounded-xl border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-mono font-bold text-foreground">{ticket.orderId}</span>
                      {ticket.tableNumber && <span className="text-lg font-bold text-emerald-600">Table {ticket.tableNumber}</span>}
                    </div>
                    <div className="text-2xl font-bold text-foreground mt-2">{ticket.name} <span className="text-muted-foreground">x{ticket.quantity}</span></div>
                    <Button size="lg" className="w-full mt-3 h-12 text-[14px] bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => removeTicket(ticket.id)}>
                      {t("pickedUp")}
                    </Button>
                  </div>
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

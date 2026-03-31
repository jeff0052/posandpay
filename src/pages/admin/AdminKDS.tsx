import React, { useState, useEffect } from "react";
import { Clock, ChefHat, CheckCircle2, AlertCircle, MessageSquare, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface KDSTicket {
  id: string;
  name: string;
  quantity: number;
  status: string;
  notes: string | null;
  fired_at: string | null;
  combo_items: any;
  orderId: string;
  tableNumber: string | null;
  serviceMode: string;
  modifiers: { name: string; price: number }[];
}

const MOCK_TICKETS: KDSTicket[] = [
  { id: "k1", name: "Chicken Rice", quantity: 2, status: "new", notes: null, fired_at: new Date(Date.now() - 3 * 60000).toISOString(), combo_items: null, orderId: "ORD-2404", tableNumber: "12", serviceMode: "dine-in", modifiers: [] },
  { id: "k2", name: "Laksa", quantity: 1, status: "new", notes: "Extra spicy", fired_at: new Date(Date.now() - 5 * 60000).toISOString(), combo_items: null, orderId: "ORD-2404", tableNumber: "12", serviceMode: "dine-in", modifiers: [] },
  { id: "k3", name: "Satay (10pc)", quantity: 1, status: "new", notes: null, fired_at: new Date(Date.now() - 2 * 60000).toISOString(), combo_items: null, orderId: "ORD-2409", tableNumber: "10", serviceMode: "dine-in", modifiers: [{ name: "Extra Peanut Sauce", price: 0 }] },
  { id: "k4", name: "Char Kway Teow", quantity: 1, status: "preparing", notes: null, fired_at: new Date(Date.now() - 8 * 60000).toISOString(), combo_items: null, orderId: "ORD-2405", tableNumber: null, serviceMode: "delivery", modifiers: [] },
  { id: "k5", name: "Nasi Lemak Set", quantity: 2, status: "preparing", notes: null, fired_at: new Date(Date.now() - 12 * 60000).toISOString(), combo_items: null, orderId: "ORD-2409", tableNumber: "10", serviceMode: "dine-in", modifiers: [] },
  { id: "k6", name: "Bak Kut Teh", quantity: 1, status: "preparing", notes: "Less pepper", fired_at: new Date(Date.now() - 10 * 60000).toISOString(), combo_items: null, orderId: "ORD-2404", tableNumber: "12", serviceMode: "dine-in", modifiers: [] },
  { id: "k7", name: "Prawn Crackers", quantity: 3, status: "ready", notes: null, fired_at: new Date(Date.now() - 15 * 60000).toISOString(), combo_items: null, orderId: "ORD-2402", tableNumber: "7", serviceMode: "dine-in", modifiers: [] },
  { id: "k8", name: "Teh Tarik", quantity: 2, status: "ready", notes: null, fired_at: new Date(Date.now() - 14 * 60000).toISOString(), combo_items: null, orderId: "ORD-2405", tableNumber: null, serviceMode: "delivery", modifiers: [] },
  { id: "k9", name: "Hokkien Mee", quantity: 1, status: "new", notes: null, fired_at: new Date(Date.now() - 1 * 60000).toISOString(), combo_items: null, orderId: "ORD-2406", tableNumber: "1", serviceMode: "dine-in", modifiers: [] },
];

const statusConfig: Record<string, { label: string; border: string; bg: string; text: string; icon: React.FC<{ className?: string }> }> = {
  new: { label: "NEW", border: "border-primary", bg: "bg-status-blue-light", text: "text-primary", icon: Clock },
  preparing: { label: "PREPARING", border: "border-status-amber", bg: "bg-status-amber-light", text: "text-status-amber", icon: ChefHat },
  ready: { label: "READY", border: "border-status-green", bg: "bg-status-green-light", text: "text-status-green", icon: CheckCircle2 },
};

function getElapsedMin(firedAt?: string | null) {
  if (!firedAt) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(firedAt).getTime()) / 60000));
}

const AdminKDS: React.FC = () => {
  const [tickets, setTickets] = useState<KDSTicket[]>([]);

  const loadTickets = async () => {
    const { data: orders } = await supabase
      .from("orders")
      .select("id, table_number, service_mode")
      .not("status", "in", '("paid","void")');

    if (!orders || orders.length === 0) { setTickets(MOCK_TICKETS); return; }

    const orderIds = orders.map(o => o.id);
    const orderMap = new Map(orders.map(o => [o.id, o]));

    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds)
      .neq("status", "served");

    if (!items || items.length === 0) { setTickets(MOCK_TICKETS); return; }

    const itemIds = items.map(i => i.id);
    const { data: mods } = await supabase
      .from("order_item_modifiers")
      .select("*")
      .in("order_item_id", itemIds);

    const result: KDSTicket[] = items.map(item => {
      const order = orderMap.get(item.order_id);
      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        status: item.status,
        notes: item.notes,
        fired_at: item.fired_at,
        combo_items: item.combo_items,
        orderId: item.order_id,
        tableNumber: order?.table_number || null,
        serviceMode: order?.service_mode || "dine-in",
        modifiers: (mods || []).filter(m => m.order_item_id === item.id).map(m => ({ name: m.name, price: Number(m.price) })),
      };
    });
    setTickets(result);
  };

  useEffect(() => {
    loadTickets();

    const channel = supabase
      .channel("kds-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => loadTickets())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => loadTickets())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="p-4 sm:p-7">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">KDS Monitor</h1>
        <p className="text-[13px] text-muted-foreground mt-1">{tickets.length} active tickets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(["new", "preparing", "ready"] as const).map(status => {
          const config = statusConfig[status];
          const statusTickets = tickets.filter(t => t.status === status);
          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <config.icon className={`h-4 w-4 ${config.text}`} />
                <span className="section-label">{config.label}</span>
                <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-md ${config.bg} ${config.text}`}>
                  {statusTickets.length}
                </span>
              </div>
              <div className="space-y-3">
                {statusTickets.map(ticket => {
                  const elapsed = getElapsedMin(ticket.fired_at);
                  const isUrgent = (status === "new" && elapsed > 10) || (status === "preparing" && elapsed > 20);
                  const comboItems = Array.isArray(ticket.combo_items) ? ticket.combo_items : [];
                  return (
                    <div key={ticket.id} className={`uniweb-card border-l-4 ${config.border} p-4 ${isUrgent ? "animate-pulse" : ""}`}>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-[14px]">{ticket.tableNumber ? `T${ticket.tableNumber}` : "—"}</span>
                          <span className="text-[10px] text-muted-foreground font-mono uppercase">{ticket.serviceMode}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isUrgent && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                          <span className={`text-[11px] font-bold font-mono ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
                            {elapsed}m
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start justify-between mb-1">
                        <div className="text-[14px] font-semibold text-foreground leading-tight">{ticket.name}</div>
                        <span className="text-[13px] font-bold text-foreground bg-accent px-2 py-0.5 rounded-md ml-2 shrink-0">
                          ×{ticket.quantity}
                        </span>
                      </div>

                      {comboItems.length > 0 && (
                        <div className="mt-2 mb-1 pl-2 border-l-2 border-primary/20 space-y-0.5">
                          <div className="flex items-center gap-1 mb-1">
                            <Package className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Combo</span>
                          </div>
                          {comboItems.map((ci: any, idx: number) => (
                            <div key={idx} className="text-[12px] text-foreground">
                              <span className="text-muted-foreground">{ci.groupName}:</span>{" "}
                              <span className="font-medium">{ci.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {ticket.modifiers.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {ticket.modifiers.map((m, idx) => (
                            <span key={idx} className="text-[11px] bg-accent text-foreground px-2 py-0.5 rounded-md font-medium">
                              {m.name}
                              {m.price > 0 && <span className="text-muted-foreground ml-0.5">(+${m.price.toFixed(2)})</span>}
                            </span>
                          ))}
                        </div>
                      )}

                      {ticket.notes && (
                        <div className="mt-2 flex items-start gap-1.5 bg-status-amber-light/50 rounded-md px-2.5 py-1.5">
                          <MessageSquare className="h-3 w-3 text-status-amber mt-0.5 shrink-0" />
                          <span className="text-[11px] text-foreground font-medium leading-snug">{ticket.notes}</span>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-1">
                        {["new", "preparing", "ready", "served"].map((step, idx) => {
                          const stepIdx = ["new", "preparing", "ready", "served"].indexOf(ticket.status);
                          const isDone = idx < stepIdx;
                          const isCurrent = idx === stepIdx;
                          return (
                            <div key={step} className={`h-1.5 flex-1 rounded-full transition-colors ${
                              isDone ? "bg-status-green" : isCurrent ? config.text.replace("text-", "bg-") : "bg-border"
                            }`} />
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] text-muted-foreground">FIRED</span>
                        <span className="text-[9px] text-muted-foreground">PREP</span>
                        <span className="text-[9px] text-muted-foreground">READY</span>
                        <span className="text-[9px] text-muted-foreground">SERVED</span>
                      </div>
                    </div>
                  );
                })}
                {statusTickets.length === 0 && (
                  <div className="uniweb-card p-6 flex items-center justify-center">
                    <span className="text-[12px] text-muted-foreground">No tickets</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminKDS;

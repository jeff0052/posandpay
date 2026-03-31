import React, { useState } from "react";
import { Minus, Plus, Trash2, Users, UtensilsCrossed, Split, X, ChefHat, Ban, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Order, type Table } from "@/data/mock-data";
import { type ServiceFlow } from "@/state/settings-store";
import { useLanguage } from "@/hooks/useLanguage";

interface CheckPanelProps {
  order: Order | null;
  table?: Table;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onPay: () => void;
  serviceFlow?: ServiceFlow;
  onSendToKitchen?: () => void;
  onVoidOrder?: () => void;
  linkedMember?: { name: string; tier: string; discountPercent: number } | null;
}

export const CheckPanel: React.FC<CheckPanelProps> = ({ order, table, onUpdateQuantity, onRemoveItem, onPay, serviceFlow = "restaurant", onSendToKitchen, onVoidOrder, linkedMember }) => {
  const { t } = useLanguage();
  const [appliedPromo, setAppliedPromo] = useState<{ type: "percentage" | "fixed"; value: number; label: string } | null>(null);
  const [manualDiscount, setManualDiscount] = useState<{ type: "percentage" | "fixed"; value: number } | null>(null);
  const [splitCount, setSplitCount] = useState(1);
  const [showSplit, setShowSplit] = useState(false);

  if (!order) {
    return (
      <div className="bg-card flex flex-col items-center justify-center h-full">
        <UtensilsCrossed className="h-10 w-10 text-muted-foreground/20 mb-3" />
        <p className="text-[13px] text-muted-foreground">{t("select_table_start")}</p>
      </div>
    );
  }

  // Calculate discount
  const calcDiscount = () => {
    let discount = 0;
    if (appliedPromo) {
      if (appliedPromo.type === "percentage") discount = order.subtotal * (appliedPromo.value / 100);
      else discount = appliedPromo.value;
    } else if (manualDiscount) {
      if (manualDiscount.type === "percentage") discount = order.subtotal * (manualDiscount.value / 100);
      else discount = manualDiscount.value;
    }
    if (linkedMember && !appliedPromo) {
      discount += order.subtotal * (linkedMember.discountPercent / 100);
    }
    return Math.min(discount, order.subtotal);
  };

  const discountAmt = Math.round(calcDiscount() * 100) / 100;
  const adjustedSubtotal = Math.round((order.subtotal - discountAmt) * 100) / 100;
  const serviceCharge = Math.round(adjustedSubtotal * 0.1 * 100) / 100;
  const gst = Math.round((adjustedSubtotal + serviceCharge) * 0.09 * 100) / 100;
  const finalTotal = Math.round((adjustedSubtotal + serviceCharge + gst) * 100) / 100;
  const splitAmount = splitCount > 1 ? Math.round(finalTotal / splitCount * 100) / 100 : finalTotal;

  return (
    <div className="bg-card flex flex-col h-full">
      {/* Header */}
      <div className="h-[52px] px-4 border-b border-border flex items-center shrink-0">
        <div className="flex items-center justify-between flex-1">
          <div>
            <h3 className="font-semibold text-foreground text-[13px]">
              {table ? `${t("tables")} ${table.number}` : `${order.serviceMode}`}
            </h3>
            <span className="text-[11px] text-muted-foreground capitalize">{order.serviceMode}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {order.guestCount}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto pos-scrollbar p-3 space-y-1">
        {order.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="text-[13px]">{t("no_items")}</p>
            <p className="text-[11px] mt-1">{t("add_from_menu")}</p>
          </div>
        ) : (
          order.items.map(item => (
            <div key={item.id} className="group flex gap-2 p-2 rounded-md hover:bg-accent transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <span className="text-[13px] font-medium text-foreground leading-tight">{item.name}</span>
                  <span className="text-[13px] text-foreground font-semibold ml-2 shrink-0 font-mono">
                    ${((item.price + item.modifiers.reduce((s, m) => s + m.price, 0)) * item.quantity).toFixed(2)}
                  </span>
                </div>
                {item.modifiers.length > 0 && (
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {item.modifiers.map(m => m.name).join(", ")}
                  </div>
                )}
                {item.notes && (
                  <div className="text-[11px] text-status-amber mt-0.5">📝 {item.notes}</div>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="w-7 h-7 rounded-md bg-accent flex items-center justify-center hover:bg-secondary transition-colors active:scale-95"
                  >
                    <Minus className="h-3 w-3 text-foreground" />
                  </button>
                  <span className="text-xs font-semibold text-foreground w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="w-7 h-7 rounded-md bg-accent flex items-center justify-center hover:bg-secondary transition-colors active:scale-95"
                  >
                    <Plus className="h-3 w-3 text-foreground" />
                  </button>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all ml-auto active:scale-95"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Promo / Discount / Member / Split Section */}
      {order.items.length > 0 && (
        <div className="border-t border-border">
          {/* Action bar */}
          <div className="flex items-center gap-1 px-3 py-2">
            <button
              onClick={() => { setShowSplit(!showSplit); }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors min-h-[36px]",
                showSplit ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
              )}
            >
              <Split className="h-3 w-3" />
              {t("split_bill")}
            </button>
          </div>

          {/* Split bill */}
          {showSplit && (
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{t("split_into_n")}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      onClick={() => setSplitCount(n)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-[12px] font-semibold transition-colors active:scale-95",
                        splitCount === n ? "bg-primary text-primary-foreground" : "bg-accent text-foreground hover:bg-secondary"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {splitCount > 1 && (
                <div className="mt-2 bg-primary/5 rounded-lg px-3 py-2 text-center">
                  <span className="text-[11px] text-muted-foreground">{t("each_pays")}</span>
                  <span className="text-[15px] font-bold text-primary font-mono ml-2">${splitAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Totals & Pay */}
      <div className="border-t border-border p-4 space-y-1.5">
        {linkedMember && (
          <div className="flex items-center gap-1.5 text-[11px] text-status-green mb-1">
            <Crown className="h-3 w-3" />
            <span className="font-medium">{linkedMember.name}</span>
            <span className="text-[10px] opacity-70">{linkedMember.tier} · {linkedMember.discountPercent}% off</span>
          </div>
        )}
        <div className="flex justify-between text-[13px] text-muted-foreground">
          <span>{t("subtotal")}</span>
          <span className="font-mono">${order.subtotal.toFixed(2)}</span>
        </div>
        {discountAmt > 0 && (
          <div className="flex justify-between text-[13px] text-status-green">
            <span>{t("discount")}</span>
            <span className="font-mono">-${discountAmt.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-[13px] text-muted-foreground">
          <span>{t("service_charge")} (10%)</span>
          <span className="font-mono">${serviceCharge.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[13px] text-muted-foreground">
          <span>{t("gst")}</span>
          <span className="font-mono">${gst.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
          <span>{t("total")}</span>
          <span className="font-mono">${finalTotal.toFixed(2)}</span>
        </div>
        {splitCount > 1 && (
          <div className="flex justify-between text-[13px] text-primary font-semibold">
            <span>{t("per_person")} ({splitCount})</span>
            <span className="font-mono">${splitAmount.toFixed(2)}</span>
          </div>
        )}
        {/* Void button — only for orders that have been sent */}
        {order.status !== "open" && order.status !== "paid" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mb-2 text-[11px] h-8 text-status-red hover:text-status-red hover:bg-status-red/10 border-status-red/30"
            onClick={() => {
              if (window.confirm("Cancel this order? This cannot be undone.")) {
                onVoidOrder?.();
              }
            }}
          >
            <Ban className="h-3.5 w-3.5 mr-1.5" />
            Void Order
          </Button>
        )}
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
      </div>
    </div>
  );
};

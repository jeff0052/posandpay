import React, { useState, useEffect } from "react";
import { Minus, Plus, Trash2, Users, User, UtensilsCrossed, Split, X, ChefHat, Ban, Crown, Tag, Timer, UtensilsCrossed as Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Order, type Table } from "@/data/mock-data";
import { type ServiceFlow } from "@/state/settings-store";
import { useLanguage } from "@/hooks/useLanguage";
import { buffetPlans, type BuffetPlan } from "@/state/buffet-store";

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
  onMemberClick?: () => void;
  balanceCredit?: number;
  onStartBuffet?: (planId: string, pax: number) => void;
}

export const CheckPanel: React.FC<CheckPanelProps> = ({ order, table, onUpdateQuantity, onRemoveItem, onPay, serviceFlow = "restaurant", onSendToKitchen, onVoidOrder, linkedMember, onMemberClick, balanceCredit = 0, onStartBuffet }) => {
  const { t } = useLanguage();
  const [appliedPromo, setAppliedPromo] = useState<{ type: "percentage" | "fixed"; value: number; label: string } | null>(null);
  const [manualDiscount, setManualDiscount] = useState<{ type: "percentage" | "fixed"; value: number } | null>(null);
  const [splitCount, setSplitCount] = useState(1);
  const [showSplit, setShowSplit] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [showBuffetSelect, setShowBuffetSelect] = useState(false);
  const [buffetPax, setBuffetPax] = useState(order?.guestCount || 2);

  // Buffet countdown timer
  const [, setTick] = useState(0);
  const isBuffet = !!order?.buffetPlanId;
  const buffetPlan = isBuffet ? buffetPlans.find(p => p.id === order.buffetPlanId) : null;

  useEffect(() => {
    if (!isBuffet || !order?.buffetStartTime) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isBuffet, order?.buffetStartTime]);

  const getBuffetRemaining = () => {
    if (!order?.buffetStartTime || !order?.buffetDuration) return null;
    const elapsed = (Date.now() - new Date(order.buffetStartTime).getTime()) / 60000;
    return Math.ceil(order.buffetDuration - elapsed);
  };

  const buffetRemaining = getBuffetRemaining();

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
  const buffetCost = (isBuffet && buffetPlan && order.buffetPax) ? buffetPlan.price * order.buffetPax : 0;
  const adjustedSubtotal = Math.round((order.subtotal + buffetCost - discountAmt) * 100) / 100;
  const serviceCharge = Math.round(adjustedSubtotal * 0.1 * 100) / 100;
  const gst = Math.round((adjustedSubtotal + serviceCharge) * 0.09 * 100) / 100;
  const totalBeforeCredit = Math.round((adjustedSubtotal + serviceCharge + gst) * 100) / 100;
  const appliedCredit = Math.min(balanceCredit, totalBeforeCredit);
  const finalTotal = Math.round((totalBeforeCredit - appliedCredit) * 100) / 100;
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
            <span className="text-[11px] text-muted-foreground capitalize">
              {isBuffet ? buffetPlan?.name : order.serviceMode}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Buffet countdown */}
            {isBuffet && buffetRemaining !== null && (
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold",
                buffetRemaining > 15 ? "bg-status-green-light text-status-green"
                  : buffetRemaining > 0 ? "bg-status-amber-light text-status-amber"
                  : "bg-status-red-light text-status-red animate-pulse"
              )}>
                <Timer className="h-3 w-3" />
                {buffetRemaining > 0 ? `${buffetRemaining}m` : t("overtime")}
              </div>
            )}
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {order.guestCount}
            </div>
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
              onClick={() => { setShowSplit(!showSplit); setShowPromo(false); }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors min-h-[36px]",
                showSplit ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
              )}
            >
              <Split className="h-3 w-3" />
              {t("split_bill")}
            </button>
            <button
              onClick={() => { setShowPromo(!showPromo); setShowSplit(false); }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors min-h-[36px]",
                (showPromo || appliedPromo) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
              )}
            >
              <Tag className="h-3 w-3" />
              {t("promo")}
            </button>
            <button
              onClick={onMemberClick}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors min-h-[36px]",
                linkedMember ? "bg-status-green/10 text-status-green" : "text-muted-foreground hover:bg-accent"
              )}
            >
              <User className="h-3 w-3" />
              {linkedMember ? linkedMember.name.split(" ")[0] : t("member")}
            </button>
          </div>

          {/* Promo panel */}
          {showPromo && (
            <div className="px-3 pb-2 space-y-2">
              {/* Header with close */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground">{t("promotions")}</span>
                <button
                  onClick={() => setShowPromo(false)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors active:scale-95"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Promo code input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  placeholder={t("enter_promo_code")}
                  className="flex-1 h-8 px-2.5 rounded-lg border border-border bg-background text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={() => {
                    if (promoCode === "NEWUSER") {
                      setAppliedPromo({ type: "fixed", value: 5, label: "New Customer $5 Off" });
                      setShowPromo(false);
                      setPromoCode("");
                    } else if (promoCode === "LUNCH20") {
                      setAppliedPromo({ type: "percentage", value: 20, label: "Lunch Special 20% Off" });
                      setShowPromo(false);
                      setPromoCode("");
                    }
                  }}
                  className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold active:scale-95 transition-transform"
                >
                  {t("apply")}
                </button>
              </div>
              {/* Quick promos */}
              <div className="space-y-1">
                {[
                  { label: "Lunch Special 20% Off", type: "percentage" as const, value: 20 },
                  { label: "New Customer $5 Off", type: "fixed" as const, value: 5 },
                  { label: "Weekend BOGO Drinks", type: "percentage" as const, value: 50 },
                ].map(p => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setAppliedPromo({ type: p.type, value: p.value, label: p.label });
                      setShowPromo(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] transition-colors active:scale-[0.98]",
                      appliedPromo?.label === p.label
                        ? "bg-primary/10 text-primary font-semibold"
                        : "bg-accent text-foreground hover:bg-secondary"
                    )}
                  >
                    <span>{p.label}</span>
                    <span className="font-mono font-semibold">
                      {p.type === "percentage" ? `${p.value}%` : `$${p.value}`}
                    </span>
                  </button>
                ))}
              </div>
              {/* Clear promo */}
              {appliedPromo && (
                <button
                  onClick={() => { setAppliedPromo(null); }}
                  className="w-full text-center text-[11px] text-destructive hover:underline py-1"
                >
                  {t("remove")} {appliedPromo.label}
                </button>
              )}
            </div>
          )}

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
        {isBuffet && buffetPlan && order.buffetPax && (
          <div className="flex justify-between text-[13px] text-foreground font-medium">
            <span>{buffetPlan.name} x{order.buffetPax}</span>
            <span className="font-mono">${(buffetPlan.price * order.buffetPax).toFixed(2)}</span>
          </div>
        )}
        {/* A la carte subtotal (surcharges + regular items) */}
        <div className="flex justify-between text-[13px] text-muted-foreground">
          <span>{isBuffet && order.subtotal > 0 ? t("extras") : t("subtotal")}</span>
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
        {appliedCredit > 0 && (
          <div className="flex justify-between text-[13px] text-primary">
            <span>{t("balance_credit")}</span>
            <span className="font-mono">-${appliedCredit.toFixed(2)}</span>
          </div>
        )}
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

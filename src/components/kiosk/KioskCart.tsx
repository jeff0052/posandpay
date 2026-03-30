import React from "react";
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { type KioskCartItem, updateKioskCartQty, removeFromKioskCart } from "@/state/kiosk-store";

interface Props {
  cart: KioskCartItem[];
  onBack: () => void;
  onPay: () => void;
}

export const KioskCart: React.FC<Props> = ({ cart, onBack, onPay }) => {
  const { lang, t } = useLanguage();

  const subtotal = Math.round(cart.reduce((s, i) => s + (i.price + i.modifiers.reduce((a, m) => a + m.price, 0)) * i.quantity, 0) * 100) / 100;
  const serviceCharge = Math.round(subtotal * 0.1 * 100) / 100;
  const gst = Math.round((subtotal + serviceCharge) * 0.09 * 100) / 100;
  const total = Math.round((subtotal + serviceCharge + gst) * 100) / 100;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="h-16 px-6 border-b border-border bg-card flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="text-xl font-bold text-foreground">{lang === "zh" ? "购物车" : "Your Order"}</h2>
        <span className="text-sm text-muted-foreground ml-auto">{cart.length} {t("items")}</span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto pos-scrollbar p-6 space-y-3">
        {cart.map(item => {
          const itemTotal = (item.price + item.modifiers.reduce((a, m) => a + m.price, 0)) * item.quantity;
          return (
            <div key={item.id} className="uniweb-card p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-base">{lang === "zh" && item.nameZh ? item.nameZh : item.name}</div>
                {item.modifiers.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-0.5">{item.modifiers.map(m => m.name).join(", ")}</div>
                )}
                {item.notes && <div className="text-xs text-muted-foreground italic mt-0.5">{item.notes}</div>}
                <div className="text-sm font-semibold text-primary font-mono mt-1">${itemTotal.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateKioskCartQty(item.id, -1)} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors">
                  <Minus className="h-3.5 w-3.5 text-foreground" />
                </button>
                <span className="text-base font-bold text-foreground w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateKioskCartQty(item.id, 1)} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors">
                  <Plus className="h-3.5 w-3.5 text-foreground" />
                </button>
                <button onClick={() => removeFromKioskCart(item.id)} className="w-9 h-9 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors ml-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="border-t border-border bg-card p-6 space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground"><span>{t("subtotal")}</span><span className="font-mono">${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm text-muted-foreground"><span>{t("service_charge")} (10%)</span><span className="font-mono">${serviceCharge.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm text-muted-foreground"><span>{t("gst")}</span><span className="font-mono">${gst.toFixed(2)}</span></div>
        <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border"><span>{t("total")}</span><span className="font-mono">${total.toFixed(2)}</span></div>
        <button
          onClick={onPay}
          disabled={cart.length === 0}
          className="w-full h-14 mt-3 rounded-xl bg-primary text-primary-foreground text-lg font-semibold transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
        >
          {lang === "zh" ? "去支付" : "Proceed to Pay"} · ${total.toFixed(2)}
        </button>
      </div>
    </div>
  );
};

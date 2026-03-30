import React from "react";
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { type QRCartItem } from "@/components/qr/QRMenuBrowser";

interface Props {
  cart: QRCartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onBack: () => void;
  onPay: () => void;
  onPayLater: () => void;
  showPayLater: boolean;
}

export const QRCart: React.FC<Props> = ({ cart, onUpdateQty, onRemove, onBack, onPay, onPayLater, showPayLater }) => {
  const { lang, t } = useLanguage();

  const subtotal = Math.round(cart.reduce((s, i) => s + (i.price + i.modifiers.reduce((a, m) => a + m.price, 0)) * i.quantity, 0) * 100) / 100;
  const serviceCharge = Math.round(subtotal * 0.1 * 100) / 100;
  const gst = Math.round((subtotal + serviceCharge) * 0.09 * 100) / 100;
  const total = Math.round((subtotal + serviceCharge + gst) * 100) / 100;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="sticky top-0 z-10 h-14 px-4 border-b border-border bg-card flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-accent"><ArrowLeft className="h-5 w-5 text-foreground" /></button>
        <h2 className="text-base font-bold text-foreground flex-1">{lang === "zh" ? "确认订单" : "Review Order"}</h2>
        <span className="text-sm text-muted-foreground">{cart.reduce((s, i) => s + i.quantity, 0)} {t("items")}</span>
      </div>

      <div className="flex-1 p-4 space-y-2">
        {cart.map(item => (
          <div key={item.id} className="uniweb-card p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground">{lang === "zh" && item.nameZh ? item.nameZh : item.name}</div>
              {item.modifiers.length > 0 && <div className="text-[11px] text-muted-foreground">{item.modifiers.map(m => m.name).join(", ")}</div>}
              <div className="text-sm font-semibold text-primary font-mono mt-0.5">
                ${((item.price + item.modifiers.reduce((a, m) => a + m.price, 0)) * item.quantity).toFixed(2)}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => onUpdateQty(item.id, -1)} className="w-8 h-8 rounded-md border border-border flex items-center justify-center"><Minus className="h-3 w-3" /></button>
              <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
              <button onClick={() => onUpdateQty(item.id, 1)} className="w-8 h-8 rounded-md border border-border flex items-center justify-center"><Plus className="h-3 w-3" /></button>
              <button onClick={() => onRemove(item.id)} className="w-8 h-8 rounded-md text-destructive hover:bg-destructive/10 flex items-center justify-center ml-1"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-card p-4 space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground"><span>{t("subtotal")}</span><span className="font-mono">${subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm text-muted-foreground"><span>{t("service_charge")} (10%)</span><span className="font-mono">${serviceCharge.toFixed(2)}</span></div>
        <div className="flex justify-between text-sm text-muted-foreground"><span>{t("gst")}</span><span className="font-mono">${gst.toFixed(2)}</span></div>
        <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border"><span>{t("total")}</span><span className="font-mono">${total.toFixed(2)}</span></div>

        <button onClick={onPay} disabled={cart.length === 0}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold transition-all active:scale-[0.98] disabled:opacity-50 mt-2">
          {lang === "zh" ? "立即支付" : "Pay Now"} · ${total.toFixed(2)}
        </button>
        {showPayLater && (
          <button onClick={onPayLater} disabled={cart.length === 0}
            className="w-full h-11 rounded-xl border-1.5 border-border text-muted-foreground font-medium transition-all hover:bg-accent hover:text-foreground active:scale-[0.98] disabled:opacity-50">
            {lang === "zh" ? "稍后到柜台支付" : "Pay at Counter Later"}
          </button>
        )}
      </div>
    </div>
  );
};

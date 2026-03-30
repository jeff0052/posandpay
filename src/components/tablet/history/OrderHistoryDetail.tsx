import React from "react";
import { ArrowLeft, Banknote, CreditCard, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import type { PaidOrder } from "./types";

interface OrderHistoryDetailProps {
  order: PaidOrder;
  onBack: () => void;
}

const paymentIcon = (method: string, size = "h-4 w-4") => {
  if (["Visa", "Mastercard", "UnionPay"].includes(method)) return <CreditCard className={size} />;
  if (method === "Cash") return <Banknote className={size} />;
  return <QrCode className={size} />;
};

const serviceModeLabel: Record<PaidOrder["serviceMode"], { en: string; zh: string }> = {
  "dine-in": { en: "Dine-in", zh: "堂食" },
  takeaway: { en: "Takeaway", zh: "外带" },
  delivery: { en: "Delivery", zh: "外卖" },
  pickup: { en: "Pickup", zh: "自取" },
  kiosk: { en: "Kiosk", zh: "自助" },
  qr: { en: "QR Order", zh: "扫码" },
};

const serviceModeColors: Record<PaidOrder["serviceMode"], string> = {
  "dine-in": "bg-status-blue-light text-primary",
  takeaway: "bg-status-amber-light text-status-amber",
  delivery: "bg-status-green-light text-status-green",
  pickup: "bg-accent text-muted-foreground",
  kiosk: "bg-status-amber-light text-status-amber",
  qr: "bg-status-blue-light text-primary",
};

export const OrderHistoryDetail: React.FC<OrderHistoryDetailProps> = ({ order, onBack }) => {
  const { lang, t } = useLanguage();
  const paidDate = new Date(order.paidAt);
  const dateLabel = paidDate.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-SG", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = paidDate.toLocaleTimeString(lang === "zh" ? "zh-CN" : "en-SG", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const modeLabel = lang === "zh" ? serviceModeLabel[order.serviceMode].zh : serviceModeLabel[order.serviceMode].en;

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b border-border px-5 py-4">
        <button
          onClick={onBack}
          className="mb-4 flex min-h-[44px] items-center gap-2 rounded-lg px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("back")}
        </button>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[18px] font-bold tracking-tight text-foreground">#{order.id.slice(-6)}</h3>
              <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold", serviceModeColors[order.serviceMode])}>
                {modeLabel}
              </span>
            </div>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {dateLabel} · {timeLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-[12px] font-medium text-foreground">
            {paymentIcon(order.paymentMethod)}
            {order.paymentMethod}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 pos-scrollbar">
        <section className="rounded-2xl border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{t("order_detail")}</span>
            {order.tableNumber ? (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-foreground">Table {order.tableNumber}</span>
            ) : null}
          </div>

          <div className="divide-y divide-border/70 px-4">
            {order.items.map((item, index) => {
              const itemTotal = (item.price + item.modifiers.reduce((sum, modifier) => sum + modifier.price, 0)) * item.quantity;

              return (
                <div key={`${order.id}-${index}`} className="grid grid-cols-[auto_1fr_auto] gap-3 py-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">
                    {item.quantity}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-foreground">{item.name}</div>
                    {item.modifiers.length > 0 ? (
                      <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        {item.modifiers.map((modifier) => modifier.name).join(" · ")}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right text-[13px] font-semibold text-foreground font-mono">
                    ${itemTotal.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background p-4">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Bill Summary</div>
          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between text-muted-foreground">
              <span>{t("subtotal")}</span>
              <span className="font-mono">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 ? (
              <div className="flex justify-between text-status-green">
                <span>{t("discount")}</span>
                <span className="font-mono">-${order.discount.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-muted-foreground">
              <span>{t("service_charge")}</span>
              <span className="font-mono">${order.serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{t("gst")}</span>
              <span className="font-mono">${order.gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-[14px] font-bold text-foreground">
              <span>{t("total")}</span>
              <span className="font-mono">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {order.paymentMethod === "Cash" ? (
          <section className="rounded-2xl border border-status-amber/20 bg-status-amber-light/40 p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-status-amber">{t("cash_payment")}</div>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between text-muted-foreground">
                <span>{t("cash_received")}</span>
                <span className="font-mono text-foreground">${(order.cashReceived ?? order.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t("change")}</span>
                <span className="font-mono text-foreground">${(order.changeDue ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-status-amber/20 pt-3 font-semibold text-foreground">
                <span>{t("net_paid")}</span>
                <span className="font-mono">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};
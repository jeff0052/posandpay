import React, { useMemo, useState } from "react";
import { ArrowLeft, Banknote, CreditCard, QrCode, Receipt, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import type { PaidOrder } from "./types";

interface OrderHistoryListProps {
  orders: PaidOrder[];
  onClose: () => void;
  onSelect: (id: string) => void;
}

const paymentMethods = ["All", "Visa", "Mastercard", "UnionPay", "Alipay", "WeChat Pay", "PayNow", "Cash"];

const serviceModeLabel: Record<PaidOrder["serviceMode"], { en: string; zh: string }> = {
  "dine-in": { en: "Dine-in", zh: "堂食" },
  takeaway: { en: "Takeaway", zh: "外带" },
  delivery: { en: "Delivery", zh: "外卖" },
  pickup: { en: "Pickup", zh: "自取" },
};

const serviceModeColors: Record<PaidOrder["serviceMode"], string> = {
  "dine-in": "bg-status-blue-light text-primary",
  takeaway: "bg-status-amber-light text-status-amber",
  delivery: "bg-status-green-light text-status-green",
  pickup: "bg-accent text-muted-foreground",
};

const paymentIcon = (method: string, size = "h-3.5 w-3.5") => {
  if (["Visa", "Mastercard", "UnionPay"].includes(method)) return <CreditCard className={size} />;
  if (method === "Cash") return <Banknote className={size} />;
  return <QrCode className={size} />;
};

export const OrderHistoryList: React.FC<OrderHistoryListProps> = ({ orders, onClose, onSelect }) => {
  const { lang, t } = useLanguage();
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState<string>("All");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filterMethod !== "All" && order.paymentMethod !== filterMethod) return false;
      if (!search.trim()) return true;

      const query = search.trim().toLowerCase();
      return [
        order.id.toLowerCase(),
        order.tableNumber?.toLowerCase() ?? "",
        order.total.toFixed(2),
        order.paymentMethod.toLowerCase(),
        ...order.items.map((item) => item.name.toLowerCase()),
      ].some((value) => value.includes(query));
    });
  }, [filterMethod, orders, search]);

  const groupedOrders = useMemo(() => {
    const map = new Map<string, { label: string; total: number; orders: PaidOrder[] }>();

    filteredOrders
      .slice()
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
      .forEach((order) => {
        const date = new Date(order.paidAt);
        const key = date.toISOString().slice(0, 10);
        const label = date.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-SG", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        if (!map.has(key)) {
          map.set(key, { label, total: 0, orders: [] });
        }

        const entry = map.get(key)!;
        entry.total += order.total;
        entry.orders.push(order);
      });

    return Array.from(map.values());
  }, [filteredOrders, lang]);

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="text-[20px] font-bold tracking-tight text-foreground">{t("order_history")}</div>
            <div className="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground">
              <span>{filteredOrders.length} orders</span>
              <span>·</span>
              <span className="font-mono font-semibold text-foreground">${totalRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={lang === "zh" ? "搜索金额、桌号、菜品..." : "Search amount, table, item..."}
            className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-10 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="mt-4 overflow-x-auto pos-scrollbar">
          <div className="flex min-w-max gap-2 pb-1">
            {paymentMethods.map((method) => (
              <button
                key={method}
                onClick={() => setFilterMethod(method)}
                className={cn(
                  "flex min-h-[40px] items-center gap-2 rounded-full px-4 text-[12px] font-medium transition-colors active:scale-[0.98]",
                  filterMethod === method
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-muted-foreground hover:text-foreground",
                )}
              >
                {method !== "All" ? paymentIcon(method) : null}
                {method}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pos-scrollbar">
        {groupedOrders.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <Receipt className="h-8 w-8 opacity-20" />
            <div className="text-[13px]">{t("no_history")}</div>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedOrders.map((group) => (
              <section key={group.label} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{group.label}</div>
                  <div className="text-[11px] font-semibold text-muted-foreground font-mono">${group.total.toFixed(2)}</div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border bg-background">
                  {group.orders.map((order) => {
                    const paidDate = new Date(order.paidAt);
                    const timeLabel = paidDate.toLocaleTimeString(lang === "zh" ? "zh-CN" : "en-SG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const modeLabel = lang === "zh" ? serviceModeLabel[order.serviceMode].zh : serviceModeLabel[order.serviceMode].en;

                    return (
                      <button
                        key={order.id}
                        onClick={() => onSelect(order.id)}
                        className="w-full border-b border-border/70 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/40 active:bg-accent"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-mono text-muted-foreground">{timeLabel}</span>
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", serviceModeColors[order.serviceMode])}>
                              {modeLabel}
                            </span>
                            {order.tableNumber ? (
                              <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                T{order.tableNumber}
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">#{order.id.slice(-4)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[12px] text-muted-foreground overflow-hidden">
                            {paymentIcon(order.paymentMethod, "h-3 w-3 flex-shrink-0")}
                            <span className="truncate">{order.paymentMethod}</span>
                            <span>·</span>
                            <span className="whitespace-nowrap">{order.items.length} {t("items")}</span>
                          </div>
                          <span className="text-[14px] font-bold text-foreground font-mono ml-2 flex-shrink-0">${order.total.toFixed(2)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
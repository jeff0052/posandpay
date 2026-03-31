import React, { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { fetchOrdersInRange } from "@/lib/db-orders";
import { cn } from "@/lib/utils";

type Period = "today" | "7d" | "30d";

const CHANNEL_COLORS = [
  "hsl(221, 63%, 33%)",   // primary - dine-in
  "hsl(142, 60%, 45%)",   // green - takeaway
  "hsl(38, 90%, 55%)",    // amber - kiosk
  "hsl(262, 60%, 55%)",   // purple - qr
  "hsl(0, 70%, 55%)",     // red - delivery
  "hsl(190, 70%, 45%)",   // teal - pickup
];

const CHANNEL_LABELS: Record<string, string> = {
  "dine-in": "Dine-in",
  takeaway: "Takeaway",
  kiosk: "Kiosk",
  qr: "QR Order",
  delivery: "Delivery",
  pickup: "Pickup",
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8am-9pm
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function fmt(n: number) { return n.toFixed(2); }

function getRange(period: Period): [string, string] {
  const now = new Date();
  const to = now.toISOString();
  const from = new Date(now);
  if (period === "today") from.setHours(0, 0, 0, 0);
  else if (period === "7d") from.setDate(from.getDate() - 7);
  else from.setDate(from.getDate() - 30);
  return [from.toISOString(), to];
}

const AdminSales: React.FC = () => {
  const [period, setPeriod] = useState<Period>("7d");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const [from, to] = getRange(period);
    fetchOrdersInRange(from, to).then(data => {
      setOrders(data);
      setLoading(false);
    });
  }, [period]);

  const paidOrders = useMemo(() => orders.filter(o => o.status === "paid"), [orders]);
  const allOrders = orders;

  // KPIs
  const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.total), 0);
  const orderCount = allOrders.length;
  const avgOrderValue = orderCount > 0 ? totalRevenue / paidOrders.length || 0 : 0;
  const uniqueTables = new Set(allOrders.filter(o => o.table_number).map(o => o.table_number)).size;
  const revenuePerTable = uniqueTables > 0 ? totalRevenue / uniqueTables : 0;

  // Daily sales chart
  const dailySales = useMemo(() => {
    const map: Record<string, number> = {};
    paidOrders.forEach(o => {
      const day = new Date(o.created_at).toLocaleDateString("en-US", { weekday: "short" });
      map[day] = (map[day] || 0) + Number(o.total);
    });
    // If period is 7d or today, show by day name; if 30d show by date
    if (period === "30d") {
      const dateMap: Record<string, number> = {};
      paidOrders.forEach(o => {
        const d = new Date(o.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        dateMap[d] = (dateMap[d] || 0) + Number(o.total);
      });
      return Object.entries(dateMap).map(([day, sales]) => ({ day, sales: Math.round(sales * 100) / 100 }));
    }
    return DAYS.map(d => ({ day: d, sales: Math.round((map[d] || 0) * 100) / 100 }));
  }, [paidOrders, period]);

  // Hourly heatmap
  const heatmap = useMemo(() => {
    const grid: number[][] = DAYS.map(() => HOURS.map(() => 0));
    allOrders.forEach(o => {
      const d = new Date(o.created_at);
      const dayIdx = (d.getDay() + 6) % 7; // Mon=0
      const hour = d.getHours();
      const hourIdx = hour - 8;
      if (hourIdx >= 0 && hourIdx < HOURS.length && dayIdx >= 0 && dayIdx < 7) {
        grid[dayIdx][hourIdx]++;
      }
    });
    const max = Math.max(1, ...grid.flat());
    return { grid, max };
  }, [allOrders]);

  // Top items
  const topItems = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    allOrders.forEach(o => {
      (o.items || []).forEach((i: any) => {
        if (!map[i.menu_item_id]) map[i.menu_item_id] = { name: i.name, qty: 0, revenue: 0 };
        map[i.menu_item_id].qty += i.quantity;
        map[i.menu_item_id].revenue += Number(i.price) * i.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [allOrders]);

  // Channel breakdown
  const channelData = useMemo(() => {
    const map: Record<string, number> = {};
    paidOrders.forEach(o => {
      const mode = o.service_mode || "dine-in";
      map[mode] = (map[mode] || 0) + Number(o.total);
    });
    return Object.entries(map).map(([name, value]) => ({
      name: CHANNEL_LABELS[name] || name,
      value: Math.round(value * 100) / 100,
    }));
  }, [paidOrders]);

  // Status breakdown
  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    allOrders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1; });
    return map;
  }, [allOrders]);

  const kpis = [
    { label: "Total Revenue", value: `$${fmt(totalRevenue)}`, icon: DollarSign, color: "bg-status-green" },
    { label: "Orders", value: String(orderCount), icon: ShoppingBag, color: "bg-primary" },
    { label: "Avg Order Value", value: `$${fmt(avgOrderValue)}`, icon: BarChart3, color: "bg-status-amber" },
    { label: "Revenue / Table", value: `$${fmt(revenuePerTable)}`, icon: Users, color: "bg-status-red" },
  ];

  return (
    <div className="p-4 sm:p-7">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Sales & Analytics</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Business intelligence dashboard</p>
        </div>
        <div className="flex gap-1.5 bg-accent rounded-lg p-1">
          {([
            { key: "today" as Period, label: "Today" },
            { key: "7d" as Period, label: "7 Days" },
            { key: "30d" as Period, label: "30 Days" },
          ]).map(p => (
            <button key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                period === p.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((s, i) => (
          <div key={s.label} className="uniweb-card card-glow surface-glow relative overflow-hidden p-5"
            style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`kpi-stripe-gradient ${s.color}`} />
            <div className="section-label mt-1.5 mb-2.5">{s.label}</div>
            <div className="text-[26px] font-bold text-foreground tracking-tighter leading-none mb-2 glow-in"
              style={{ animationDelay: `${i * 80 + 100}ms` }}>
              {loading ? "—" : s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Daily Sales Chart */}
        <div className="uniweb-card surface-glow p-5">
          <div className="text-sm font-semibold text-foreground mb-4">Daily Sales</div>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
          ) : dailySales.length === 0 || dailySales.every(d => d.sales === 0) ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No sales data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `$${v}`} />
                <Tooltip
                  formatter={(value: number) => [`$${fmt(value)}`, "Revenue"]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Channel Breakdown */}
        <div className="uniweb-card surface-glow p-5">
          <div className="text-sm font-semibold text-foreground mb-4">Revenue by Channel</div>
          {loading || channelData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              {loading ? "Loading..." : "No data"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                  style={{ fontSize: 11 }}>
                  {channelData.map((_, i) => (
                    <Cell key={i} fill={CHANNEL_COLORS[i % CHANNEL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${fmt(value)}`}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Hourly Heatmap */}
        <div className="uniweb-card surface-glow p-5">
          <div className="text-sm font-semibold text-foreground mb-4">Order Volume Heatmap</div>
          <div className="overflow-x-auto">
            <div className="grid gap-0.5" style={{ gridTemplateColumns: `40px repeat(${HOURS.length}, 1fr)` }}>
              <div />
              {HOURS.map(h => (
                <div key={h} className="text-[9px] text-muted-foreground text-center font-mono">{h}:00</div>
              ))}
              {DAYS.map((day, di) => (
                <React.Fragment key={day}>
                  <div className="text-[10px] text-muted-foreground font-medium flex items-center">{day}</div>
                  {HOURS.map((_, hi) => {
                    const val = heatmap.grid[di][hi];
                    const intensity = val / heatmap.max;
                    return (
                      <div key={hi}
                        className="aspect-square rounded-sm transition-colors"
                        style={{
                          backgroundColor: intensity === 0
                            ? "hsl(var(--accent))"
                            : `hsl(221, 63%, 33%, ${0.15 + intensity * 0.7})`,
                        }}
                        title={`${day} ${HOURS[hi]}:00 — ${val} orders`}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Top Items */}
        <div className="uniweb-card surface-glow p-5">
          <div className="text-sm font-semibold text-foreground mb-4">Top Items</div>
          {topItems.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No item data</div>
          ) : (
            <div className="space-y-2.5">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className={cn("w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold",
                    i === 0 ? "bg-primary text-primary-foreground" : i < 3 ? "bg-foreground text-background" : "bg-accent text-muted-foreground"
                  )}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-[13px] font-medium text-foreground truncate">{item.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{item.qty} sold</span>
                  <span className="text-[13px] font-semibold text-foreground font-mono shrink-0">${fmt(item.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Status Summary */}
      <div className="uniweb-card surface-glow p-5">
        <div className="text-sm font-semibold text-foreground mb-4">Order Status Breakdown</div>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg">
              <span className={cn("status-dot",
                status === "paid" ? "bg-status-green" :
                status === "open" ? "bg-status-amber" :
                status === "void" ? "bg-status-red" : "bg-primary"
              )} />
              <span className="text-xs font-medium text-foreground capitalize">{status}</span>
              <span className="text-xs font-bold text-foreground font-mono">{count}</span>
            </div>
          ))}
          {Object.keys(statusCounts).length === 0 && !loading && (
            <span className="text-sm text-muted-foreground">No orders in this period</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSales;

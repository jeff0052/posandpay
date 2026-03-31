import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      const allOrders = orders || [];
      const paidOrders = allOrders.filter(o => o.status === "paid");
      const revenue = paidOrders.reduce((s, o) => s + Number(o.total), 0);
      const uniqueCustomers = new Set(allOrders.filter(o => o.customer_id).map(o => o.customer_id)).size;

      setStats({
        revenue: Math.round(revenue * 100) / 100,
        orders: allOrders.length,
        customers: uniqueCustomers || allOrders.length,
      });

      setRecentOrders(allOrders.slice(0, 10));
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const kpiCards = [
    { label: "Today's Revenue", value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: "bg-status-green" },
    { label: "Total Orders", value: String(stats.orders), icon: ShoppingBag, color: "bg-primary" },
    { label: "Customers", value: String(stats.customers), icon: Users, color: "bg-status-amber" },
  ];

  return (
    <div className="p-7">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Today's overview</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {kpiCards.map((s, i) => (
          <div key={s.label} className="uniweb-card card-glow surface-glow relative overflow-hidden p-5"
            style={{ animationDelay: `${i * 60}ms` }}>
            <div className={`kpi-stripe-gradient ${s.color}`} />
            <div className="section-label mt-1.5 mb-2.5 relative z-[1]">{s.label}</div>
            <div className="text-[26px] font-bold text-foreground tracking-tighter leading-none mb-2 relative z-[1] glow-in"
              style={{ animationDelay: `${i * 80 + 100}ms` }}>
              {loading ? "—" : s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="uniweb-card surface-glow">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Recent Orders</h2>
          <span className="text-[11px] text-muted-foreground">Today</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th>Order ID</th>
                <th>Table</th>
                <th>Channel</th>
                <th>Total</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 && !loading && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No orders today</td></tr>
              )}
              {recentOrders.map((o, i) => (
                <tr key={o.id} className="table-row border-b border-border last:border-0 hover:bg-accent/50 transition-all duration-200 cursor-pointer glow-in"
                  style={{ animationDelay: `${i * 40 + 200}ms` }}>
                  <td className="font-medium text-foreground font-mono text-xs">{o.id.slice(0, 12)}</td>
                  <td className="text-muted-foreground">{o.table_number || "—"}</td>
                  <td className="text-muted-foreground text-xs capitalize">{o.service_mode}</td>
                  <td className="font-semibold text-foreground font-mono">${Number(o.total).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${
                      o.status === "paid" ? "bg-status-green-light text-status-green" :
                      o.status === "open" ? "bg-status-amber-light text-status-amber" :
                      "bg-status-blue-light text-primary"
                    }`}>
                      <span className={`status-dot ${
                        o.status === "paid" ? "bg-status-green" :
                        o.status === "open" ? "bg-status-amber" : "bg-primary"
                      } status-pulse`} />
                      {o.status}
                    </span>
                  </td>
                  <td className="text-muted-foreground text-xs">{new Date(o.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

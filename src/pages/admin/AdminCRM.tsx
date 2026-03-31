import React, { useState, useMemo } from "react";
import { Search, Phone, Mail, Star, Users, TrendingUp, Calendar, Tag, ChevronDown, ChevronUp, Gift, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useCustomers, updateCustomer, type CustomerFull, type CustomerSegment } from "@/state/customer-store";

const tierStyles: Record<string, string> = {
  bronze: "bg-status-amber-light text-status-amber",
  silver: "bg-accent text-muted-foreground",
  gold: "bg-status-amber-light text-status-amber",
  platinum: "bg-status-blue-light text-primary",
};

const segmentConfig: Record<CustomerSegment, { label: string; color: string }> = {
  new: { label: "New", color: "bg-status-green-light text-status-green" },
  regular: { label: "Regular", color: "bg-status-blue-light text-primary" },
  vip: { label: "VIP", color: "bg-status-amber-light text-status-amber" },
  at_risk: { label: "At Risk", color: "bg-status-red-light text-status-red" },
  churned: { label: "Churned", color: "bg-accent text-muted-foreground" },
};

const AdminCRM: React.FC = () => {
  const customers = useCustomers();
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return customers.filter(c => {
      if (segmentFilter !== "all" && c.segment !== segmentFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email?.toLowerCase().includes(q);
    });
  }, [customers, search, segmentFilter]);

  // KPIs
  const totalCustomers = customers.length;
  const newThisMonth = customers.filter(c => {
    const created = new Date(c.createdAt);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;
  const avgSpend = customers.length > 0 ? customers.reduce((s, c) => s + c.averageTicket, 0) / customers.length : 0;
  const activeCount = customers.filter(c => c.segment !== "churned").length;
  const retentionRate = totalCustomers > 0 ? Math.round(activeCount / totalCustomers * 100) : 0;

  // Upcoming birthdays
  const upcomingBirthdays = useMemo(() => {
    const now = new Date();
    return customers
      .filter(c => c.dateOfBirth)
      .map(c => {
        const dob = new Date(c.dateOfBirth!);
        const next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
        if (next < now) next.setFullYear(next.getFullYear() + 1);
        return { ...c, daysUntil: Math.ceil((next.getTime() - now.getTime()) / 86400000) };
      })
      .filter(c => c.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }, [customers]);

  const tierProgress = (c: CustomerFull) => {
    const thresholds = { bronze: 0, silver: 300, gold: 1000, platinum: 3000 };
    const tiers = ["bronze", "silver", "gold", "platinum"] as const;
    const idx = tiers.indexOf(c.tier);
    if (idx >= tiers.length - 1) return 100;
    const current = thresholds[c.tier];
    const next = thresholds[tiers[idx + 1]];
    return Math.min(100, Math.round(((c.totalSpend - current) / (next - current)) * 100));
  };

  return (
    <div className="p-4 sm:p-7">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Customer Management</h1>
        <p className="text-[13px] text-muted-foreground mt-1">{totalCustomers} customers</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Customers", value: totalCustomers, stripe: "bg-primary" },
          { label: "New This Month", value: newThisMonth, stripe: "bg-status-green" },
          { label: "Avg Ticket", value: `$${avgSpend.toFixed(2)}`, stripe: "bg-status-amber" },
          { label: "Retention Rate", value: `${retentionRate}%`, stripe: "bg-status-blue" },
        ].map(kpi => (
          <div key={kpi.label} className="uniweb-card p-5 relative overflow-hidden">
            <div className={cn("kpi-stripe", kpi.stripe)} />
            <div className="text-2xl font-bold text-foreground mt-1">{kpi.value}</div>
            <div className="text-[11px] text-muted-foreground">{kpi.label}</div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
          <TabsTrigger value="birthdays">Birthdays</TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          {/* Search + Segment Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className="w-full h-10 pl-10 pr-4 rounded-[9px] bg-card border-[1.5px] border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all" />
            </div>
            <div className="flex gap-1.5">
              {(["all", "new", "regular", "vip", "at_risk", "churned"] as const).map(seg => (
                <button key={seg} onClick={() => setSegmentFilter(seg)} className={cn("px-3 py-1.5 rounded-md text-[12px] font-medium capitalize transition-colors", segmentFilter === seg ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground")}>{seg === "all" ? "All" : segmentConfig[seg].label}</button>
              ))}
            </div>
          </div>

          {/* Customer List */}
          <div className="space-y-2">
            {filtered.map(c => {
              const expanded = expandedId === c.id;
              const seg = segmentConfig[c.segment];
              return (
                <div key={c.id} className="uniweb-card overflow-hidden">
                  <button onClick={() => setExpandedId(expanded ? null : c.id)} className="w-full p-4 flex items-center gap-4 text-left hover:bg-accent/30 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-[14px] font-bold text-primary">{c.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-[14px]">{c.name}</span>
                        <span className={cn("status-badge capitalize", tierStyles[c.tier])}>{c.tier}</span>
                        <span className={cn("status-badge", seg.color)}>{seg.label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[12px] text-muted-foreground">
                        <span><Phone className="inline h-3 w-3 mr-1" />{c.phone}</span>
                        <span>{c.visits} visits</span>
                        <span className="font-mono">${c.totalSpend.toFixed(2)} total</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <span className="font-mono">{c.points} pts</span>
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="section-label mb-2">Contact</div>
                          <div className="space-y-1 text-[13px]">
                            <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{c.phone}</div>
                            {c.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{c.email}</div>}
                            {c.dateOfBirth && <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />{c.dateOfBirth}</div>}
                          </div>
                        </div>
                        <div>
                          <div className="section-label mb-2">Spend Analytics</div>
                          <div className="space-y-1 text-[13px]">
                            <div>Total: <span className="font-semibold font-mono">${c.totalSpend.toFixed(2)}</span></div>
                            <div>Avg Ticket: <span className="font-semibold font-mono">${c.averageTicket.toFixed(2)}</span></div>
                            <div>Visits: <span className="font-semibold">{c.visits}</span></div>
                          </div>
                        </div>
                        <div>
                          <div className="section-label mb-2">Preferences</div>
                          <div className="flex flex-wrap gap-1">
                            {c.preferredItems.map(item => (
                              <span key={item} className="status-badge bg-accent text-muted-foreground">{item}</span>
                            ))}
                            {c.tags.map(tag => (
                              <span key={tag} className="status-badge bg-status-blue-light text-primary">{tag}</span>
                            ))}
                          </div>
                          {c.notes && <p className="text-[12px] text-muted-foreground mt-2 italic">📝 {c.notes}</p>}
                        </div>
                      </div>

                      {/* Tier Progression */}
                      <div>
                        <div className="section-label mb-2">Tier Progression</div>
                        <div className="flex items-center gap-3">
                          <span className="text-[12px] font-semibold capitalize text-foreground">{c.tier}</span>
                          <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${tierProgress(c)}%` }} />
                          </div>
                          <span className="text-[12px] text-muted-foreground">{tierProgress(c)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="loyalty">
          <div className="uniweb-card overflow-hidden">
            <table className="w-full">
              <thead className="table-header"><tr><th>Customer</th><th>Tier</th><th>Points</th><th>Total Spend</th><th>Visits</th><th>Progression</th></tr></thead>
              <tbody>
                {customers.sort((a, b) => b.points - a.points).map(c => (
                  <tr key={c.id} className="table-row border-b border-border last:border-0">
                    <td className="font-medium">{c.name}</td>
                    <td><span className={cn("status-badge capitalize", tierStyles[c.tier])}>{c.tier}</span></td>
                    <td className="font-mono font-semibold">{c.points}</td>
                    <td className="font-mono">${c.totalSpend.toFixed(2)}</td>
                    <td>{c.visits}</td>
                    <td>
                      <div className="w-24 h-1.5 bg-accent rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${tierProgress(c)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="birthdays">
          {upcomingBirthdays.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No upcoming birthdays in the next 30 days</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingBirthdays.map(c => (
                <div key={c.id} className="uniweb-card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-status-amber-light flex items-center justify-center">
                    <Gift className="h-5 w-5 text-status-amber" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{c.name}</div>
                    <div className="text-[12px] text-muted-foreground">{c.dateOfBirth} · {c.tier} tier · {c.points} pts</div>
                  </div>
                  <div className={cn("text-[13px] font-semibold", c.daysUntil <= 7 ? "text-status-red" : "text-foreground")}>
                    {c.daysUntil === 0 ? "Today! 🎂" : `in ${c.daysUntil} days`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCRM;

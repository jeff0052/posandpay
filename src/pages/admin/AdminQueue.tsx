import React, { useState } from "react";
import { Users, Clock, AlertCircle, PhoneCall, UserCheck, XCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useQueueEntries, addToQueue, callNext, updateQueueStatus, getQueueStats,
  type QueueEntry,
} from "@/state/queue-store";
import { zones } from "@/data/mock-data";

const statusConfig: Record<QueueEntry["status"], { label: string; color: string; icon: React.ElementType }> = {
  waiting: { label: "Waiting", color: "bg-status-amber-light text-status-amber", icon: Clock },
  called: { label: "Called", color: "bg-status-blue-light text-primary", icon: PhoneCall },
  seated: { label: "Seated", color: "bg-status-green-light text-status-green", icon: UserCheck },
  no_show: { label: "No Show", color: "bg-status-red-light text-status-red", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-accent text-muted-foreground", icon: XCircle },
};

const AdminQueue: React.FC = () => {
  const entries = useQueueEntries();
  const stats = getQueueStats();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSize, setNewSize] = useState(2);
  const [newZone, setNewZone] = useState("");
  const [filter, setFilter] = useState<"all" | "active">("active");

  const displayed = filter === "active"
    ? entries.filter(e => e.status === "waiting" || e.status === "called")
    : entries;

  const handleAdd = () => {
    addToQueue({ partySize: newSize, customerName: newName || undefined, customerPhone: newPhone || undefined, estimatedWait: newSize <= 2 ? 10 : newSize <= 4 ? 15 : 25, preferredZone: newZone || undefined });
    setShowAdd(false);
    setNewName("");
    setNewPhone("");
    setNewSize(2);
    setNewZone("");
  };

  const getWaitTime = (entry: QueueEntry) => {
    const mins = Math.floor((Date.now() - new Date(entry.joinedAt).getTime()) / 60000);
    return `${mins}m`;
  };

  return (
    <div className="p-4 sm:p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Queue Management</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Real-time waitlist management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { const e = callNext(); if (!e) alert("No one waiting"); }}>
            <PhoneCall className="h-4 w-4 mr-2" /> Call Next
          </Button>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Walk-in
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Currently Waiting", value: stats.waitingCount, icon: Users, stripe: "bg-status-amber" },
          { label: "Avg Wait Time", value: `${stats.averageWait}m`, icon: Clock, stripe: "bg-primary" },
          { label: "No-Show Rate", value: `${stats.noShowRate}%`, icon: AlertCircle, stripe: "bg-status-red" },
          { label: "Total Today", value: stats.totalToday, icon: Users, stripe: "bg-status-green" },
        ].map(kpi => (
          <div key={kpi.label} className="uniweb-card p-5 relative overflow-hidden">
            <div className={cn("kpi-stripe", kpi.stripe)} />
            <div className="flex items-center gap-3 mt-1">
              <kpi.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                <div className="text-[11px] text-muted-foreground">{kpi.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter("active")} className={cn("px-4 py-2 rounded-lg text-[13px] font-medium", filter === "active" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground")}>Active</button>
        <button onClick={() => setFilter("all")} className={cn("px-4 py-2 rounded-lg text-[13px] font-medium", filter === "all" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground")}>All</button>
      </div>

      {/* Queue List */}
      <div className="space-y-2">
        {displayed.map((entry, idx) => {
          const cfg = statusConfig[entry.status];
          return (
            <div key={entry.id} className="uniweb-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-[14px] font-bold text-foreground">
                {entry.status === "waiting" ? idx + 1 : "—"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-[14px]">{entry.customerName || "Guest"}</span>
                  <span className={cn("status-badge", cfg.color)}>{cfg.label}</span>
                  {entry.preferredZone && <span className="status-badge bg-accent text-muted-foreground">{entry.preferredZone}</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[12px] text-muted-foreground">
                  <span><Users className="inline h-3 w-3 mr-1" />{entry.partySize} pax</span>
                  <span><Clock className="inline h-3 w-3 mr-1" />{getWaitTime(entry)} waited</span>
                  {entry.customerPhone && <span>{entry.customerPhone}</span>}
                </div>
              </div>
              <div className="flex gap-1.5">
                {entry.status === "waiting" && (
                  <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => updateQueueStatus(entry.id, "called")}>
                    <PhoneCall className="h-3 w-3 mr-1" /> Call
                  </Button>
                )}
                {entry.status === "called" && (
                  <>
                    <Button size="sm" className="h-8 text-[11px]" onClick={() => updateQueueStatus(entry.id, "seated")}>
                      <UserCheck className="h-3 w-3 mr-1" /> Seat
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-[11px] text-status-red" onClick={() => updateQueueStatus(entry.id, "no_show")}>No Show</Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {displayed.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-[14px]">No entries in queue</div>
        )}
      </div>

      {/* Add Dialog */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-[400px] mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Add to Queue</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Customer name" className="w-full h-10 px-3 rounded-lg border-[1.5px] border-border bg-background text-[13px] focus:outline-none focus:border-primary" />
            <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone (optional)" className="w-full h-10 px-3 rounded-lg border-[1.5px] border-border bg-background text-[13px] focus:outline-none focus:border-primary" />
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">Party Size</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                  <button key={n} onClick={() => setNewSize(n)} className={cn("w-9 h-9 rounded-lg text-[12px] font-bold", newSize === n ? "bg-primary text-primary-foreground" : "bg-accent text-foreground")}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground mb-1 block">Preferred Zone</label>
              <div className="flex gap-1.5">
                {["", ...zones].map(z => (
                  <button key={z} onClick={() => setNewZone(z)} className={cn("px-3 py-1.5 rounded-lg text-[12px] font-medium", newZone === z ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground")}>{z || "Any"}</button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleAdd}>Add to Queue</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQueue;

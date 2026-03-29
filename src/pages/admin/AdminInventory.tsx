import React, { useState, useMemo } from "react";
import { Package, AlertTriangle, DollarSign, Clock, Search, Plus, ArrowUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  useInventoryItems, useStockMovements, usePurchaseOrders,
  adjustStock, addPurchaseOrder, updatePOStatus,
  type InventoryItem, type StockMovement, type PurchaseOrder,
} from "@/state/inventory-store";

const categoryLabels: Record<InventoryItem["category"], string> = {
  raw_ingredients: "Raw Ingredients",
  packaging: "Packaging",
  beverages: "Beverages",
  supplies: "Supplies",
};

const unitLabels: Record<InventoryItem["unit"], string> = {
  kg: "kg", L: "L", pcs: "pcs", box: "box", pack: "pack", bottle: "btl",
};

const getStockStatus = (item: InventoryItem) => {
  if (item.currentStock <= 0) return { label: "Out of Stock", color: "bg-destructive text-destructive-foreground" };
  if (item.currentStock <= item.reorderPoint) return { label: "Low Stock", color: "bg-status-amber-light text-status-amber" };
  if (item.expiryDate && new Date(item.expiryDate) <= new Date(Date.now() + 7 * 86400000)) return { label: "Expiring", color: "bg-status-red-light text-status-red" };
  return { label: "In Stock", color: "bg-status-green-light text-status-green" };
};

const AdminInventory: React.FC = () => {
  const items = useInventoryItems();
  const movements = useStockMovements();
  const purchaseOrders = usePurchaseOrders();
  const [search, setSearch] = useState("");
  const [showAdjust, setShowAdjust] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<StockMovement["type"]>("receive");
  const [adjustReason, setAdjustReason] = useState("");

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q) || i.supplier?.toLowerCase().includes(q));
  }, [items, search]);

  const lowStockCount = items.filter(i => i.currentStock <= i.reorderPoint && i.currentStock > 0).length;
  const outOfStockCount = items.filter(i => i.currentStock <= 0).length;
  const totalValue = items.reduce((sum, i) => sum + i.currentStock * i.costPerUnit, 0);
  const expiringCount = items.filter(i => i.expiryDate && new Date(i.expiryDate) <= new Date(Date.now() + 7 * 86400000)).length;

  const handleAdjust = () => {
    if (!showAdjust || !adjustQty) return;
    const qty = adjustType === "waste" ? -Math.abs(Number(adjustQty)) : Math.abs(Number(adjustQty));
    adjustStock(showAdjust, qty, adjustType, adjustReason);
    setShowAdjust(null);
    setAdjustQty("");
    setAdjustReason("");
  };

  return (
    <div className="p-7">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Inventory Management</h1>
        <p className="text-[13px] text-muted-foreground mt-1">{items.length} items tracked</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total SKUs", value: items.length, icon: Package, color: "text-primary" },
          { label: "Low Stock Alerts", value: lowStockCount + outOfStockCount, icon: AlertTriangle, color: "text-status-amber" },
          { label: "Total Value", value: `$${totalValue.toFixed(2)}`, icon: DollarSign, color: "text-status-green" },
          { label: "Expiring Soon", value: expiringCount, icon: Clock, color: "text-status-red" },
        ].map(kpi => (
          <div key={kpi.label} className="uniweb-card p-5 relative overflow-hidden">
            <div className={cn("kpi-stripe", kpi.color === "text-primary" ? "bg-primary" : kpi.color === "text-status-amber" ? "bg-status-amber" : kpi.color === "text-status-green" ? "bg-status-green" : "bg-status-red")} />
            <div className="flex items-center gap-3 mt-1">
              <kpi.icon className={cn("h-5 w-5", kpi.color)} />
              <div>
                <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                <div className="text-[11px] text-muted-foreground">{kpi.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock">Stock List</TabsTrigger>
          <TabsTrigger value="po">Purchase Orders</TabsTrigger>
          <TabsTrigger value="log">Movement Log</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <div className="relative w-72 mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." className="w-full h-10 pl-10 pr-4 rounded-[9px] bg-card border-[1.5px] border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all" />
          </div>

          <div className="uniweb-card overflow-hidden">
            <table className="w-full">
              <thead className="table-header"><tr><th>Item</th><th>SKU</th><th>Category</th><th>Stock</th><th>Status</th><th>Cost</th><th>Supplier</th><th></th></tr></thead>
              <tbody>
                {filtered.map(item => {
                  const status = getStockStatus(item);
                  const pct = Math.min(100, (item.currentStock / Math.max(item.reorderPoint * 2, 1)) * 100);
                  return (
                    <tr key={item.id} className="table-row border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                      <td className="font-medium text-foreground">{item.name}</td>
                      <td className="font-mono text-muted-foreground text-[12px]">{item.sku || "—"}</td>
                      <td><span className="status-badge bg-accent text-muted-foreground">{categoryLabels[item.category]}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-accent rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", pct > 50 ? "bg-status-green" : pct > 25 ? "bg-status-amber" : "bg-status-red")} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[12px] font-mono">{item.currentStock} {unitLabels[item.unit]}</span>
                        </div>
                      </td>
                      <td><span className={cn("status-badge", status.color)}>{status.label}</span></td>
                      <td className="font-mono text-[12px]">${item.costPerUnit.toFixed(2)}/{unitLabels[item.unit]}</td>
                      <td className="text-[12px] text-muted-foreground">{item.supplier || "—"}</td>
                      <td>
                        <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setShowAdjust(item.id)}>
                          <ArrowUpDown className="h-3 w-3 mr-1" /> Adjust
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="po">
          <div className="uniweb-card overflow-hidden">
            <table className="w-full">
              <thead className="table-header"><tr><th>PO</th><th>Supplier</th><th>Status</th><th>Items</th><th>Total</th><th>Expected</th><th></th></tr></thead>
              <tbody>
                {purchaseOrders.map(po => (
                  <tr key={po.id} className="table-row border-b border-border last:border-0">
                    <td className="font-mono text-[12px]">#{po.id.slice(-6)}</td>
                    <td className="font-medium">{po.supplier}</td>
                    <td><span className={cn("status-badge", po.status === "received" ? "bg-status-green-light text-status-green" : po.status === "ordered" ? "bg-status-blue-light text-primary" : po.status === "cancelled" ? "bg-status-red-light text-status-red" : "bg-accent text-muted-foreground")}>{po.status}</span></td>
                    <td>{po.items.length} items</td>
                    <td className="font-mono">${po.totalCost.toFixed(2)}</td>
                    <td className="text-[12px] text-muted-foreground">{po.expectedDelivery || "—"}</td>
                    <td>
                      {po.status === "ordered" && (
                        <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => updatePOStatus(po.id, "received")}>Mark Received</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="log">
          <div className="uniweb-card overflow-hidden">
            <table className="w-full">
              <thead className="table-header"><tr><th>Time</th><th>Item</th><th>Type</th><th>Qty</th><th>Reason</th><th>Notes</th></tr></thead>
              <tbody>
                {movements.map(mv => {
                  const item = items.find(i => i.id === mv.inventoryItemId);
                  return (
                    <tr key={mv.id} className="table-row border-b border-border last:border-0">
                      <td className="font-mono text-[12px] text-muted-foreground">{new Date(mv.createdAt).toLocaleString()}</td>
                      <td className="font-medium">{item?.name || mv.inventoryItemId}</td>
                      <td><span className={cn("status-badge", mv.type === "receive" ? "bg-status-green-light text-status-green" : mv.type === "waste" ? "bg-status-red-light text-status-red" : "bg-accent text-muted-foreground")}>{mv.type}</span></td>
                      <td className={cn("font-mono", mv.quantity > 0 ? "text-status-green" : "text-status-red")}>{mv.quantity > 0 ? "+" : ""}{mv.quantity}</td>
                      <td className="text-[12px]">{mv.reason || "—"}</td>
                      <td className="text-[12px] text-muted-foreground">{mv.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Adjust Stock Dialog */}
      {showAdjust && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={() => setShowAdjust(null)}>
          <div className="bg-card rounded-xl border border-border p-6 w-[400px] space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Adjust Stock</h3>
              <button onClick={() => setShowAdjust(null)} className="p-1 rounded hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-[13px] text-muted-foreground">{items.find(i => i.id === showAdjust)?.name}</p>
            <div className="flex gap-2">
              {(["receive", "waste", "transfer", "adjustment"] as const).map(t => (
                <button key={t} onClick={() => setAdjustType(t)} className={cn("px-3 py-1.5 rounded-md text-[12px] font-medium capitalize", adjustType === t ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground")}>{t}</button>
              ))}
            </div>
            <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="Quantity" className="w-full h-10 px-3 rounded-lg border-[1.5px] border-border bg-background text-[13px] focus:outline-none focus:border-primary" />
            <input value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="Reason (optional)" className="w-full h-10 px-3 rounded-lg border-[1.5px] border-border bg-background text-[13px] focus:outline-none focus:border-primary" />
            <Button className="w-full" onClick={handleAdjust} disabled={!adjustQty}>Confirm Adjustment</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;

import React, { useState, useRef, useCallback } from "react";
import { Plus, Trash2, Eye, Edit3, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { zones, tables as mockTables } from "@/data/mock-data";
import {
  useFloorLayouts, moveTable, addTableLayout, removeTableLayout, updateTableShape,
  type TableShape, type TableLayout, GRID_SIZE,
} from "@/state/floorplan-store";

const shapeConfig: Record<TableShape, { label: string; defaultW: number; defaultH: number; seats: string }> = {
  round: { label: "Round", defaultW: 80, defaultH: 80, seats: "2-4" },
  square: { label: "Square", defaultW: 100, defaultH: 100, seats: "4" },
  rectangular: { label: "Rectangular", defaultW: 140, defaultH: 80, seats: "6-8" },
  booth: { label: "Booth", defaultW: 160, defaultH: 100, seats: "4-6" },
};

const statusColors: Record<string, string> = {
  available: "hsl(var(--status-green))",
  reserved: "hsl(var(--primary))",
  ordering: "hsl(var(--status-amber))",
  ordered: "hsl(var(--status-amber))",
  dirty: "hsl(var(--status-red))",
  cleaning: "hsl(var(--muted-foreground))",
};

const AdminFloorPlan: React.FC = () => {
  const layouts = useFloorLayouts();
  const [activeZone, setActiveZone] = useState(zones[0]);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const zoneLayouts = layouts.filter(l => l.zone === activeZone);

  const handlePointerDown = useCallback((e: React.PointerEvent, tableId: string) => {
    if (mode !== "edit") return;
    const layout = layouts.find(l => l.tableId === tableId);
    if (!layout || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left - layout.x, y: e.clientY - rect.top - layout.y });
    setDragging(tableId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [layouts, mode]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    moveTable(dragging, e.clientX - rect.left - dragOffset.x, e.clientY - rect.top - dragOffset.y);
  }, [dragging, dragOffset]);

  const handlePointerUp = useCallback(() => { setDragging(null); }, []);

  const handleAddTable = (shape: TableShape) => {
    const cfg = shapeConfig[shape];
    const id = `new-${Date.now()}`;
    addTableLayout({
      tableId: id,
      x: 40 + Math.random() * 200,
      y: 40 + Math.random() * 200,
      width: cfg.defaultW,
      height: cfg.defaultH,
      shape,
      zone: activeZone,
    });
  };

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Floor Plan Editor</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Drag tables to arrange your restaurant layout</p>
        </div>
        <div className="flex gap-2">
          <Button variant={mode === "edit" ? "default" : "outline"} size="sm" onClick={() => setMode("edit")} className="gap-1.5">
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant={mode === "preview" ? "default" : "outline"} size="sm" onClick={() => setMode("preview")} className="gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Preview
          </Button>
        </div>
      </div>

      {/* Zone tabs */}
      <div className="flex gap-2 mb-4">
        {zones.map(zone => (
          <button key={zone} onClick={() => setActiveZone(zone)} className={cn("px-4 py-2 rounded-lg text-[13px] font-medium transition-colors", activeZone === zone ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground")}>{zone}</button>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Canvas */}
        <div className="flex-1 uniweb-card overflow-hidden">
          <div
            ref={canvasRef}
            className="relative bg-background"
            style={{ height: 500, backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`, backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px` }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {zoneLayouts.map(layout => {
              const table = mockTables.find(t => t.id === layout.tableId);
              const statusColor = table ? statusColors[table.status] || "hsl(var(--border))" : "hsl(var(--border))";
              return (
                <div
                  key={layout.tableId}
                  onPointerDown={e => handlePointerDown(e, layout.tableId)}
                  className={cn(
                    "absolute flex flex-col items-center justify-center border-2 transition-shadow select-none",
                    layout.shape === "round" ? "rounded-full" : layout.shape === "booth" ? "rounded-2xl" : "rounded-lg",
                    mode === "edit" ? "cursor-grab active:cursor-grabbing hover:shadow-lg" : "cursor-default",
                    dragging === layout.tableId && "shadow-xl ring-2 ring-primary z-10"
                  )}
                  style={{
                    left: layout.x, top: layout.y, width: layout.width, height: layout.height,
                    borderColor: mode === "preview" ? statusColor : "hsl(var(--border))",
                    backgroundColor: mode === "preview" ? `${statusColor}15` : "hsl(var(--card))",
                  }}
                >
                  <span className="text-[14px] font-bold text-foreground">#{table?.number || layout.tableId.slice(-3)}</span>
                  <span className="text-[10px] text-muted-foreground">{table?.seats || "?"} seats</span>
                  {mode === "edit" && (
                    <button onClick={e => { e.stopPropagation(); removeTableLayout(layout.tableId); }} className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                  {mode === "preview" && table && (
                    <span className="text-[9px] font-semibold mt-0.5" style={{ color: statusColor }}>{table.status}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar - add tables */}
        {mode === "edit" && (
          <div className="w-48 space-y-3">
            <h3 className="text-[13px] font-semibold text-foreground">Add Table</h3>
            {(Object.keys(shapeConfig) as TableShape[]).map(shape => {
              const cfg = shapeConfig[shape];
              return (
                <button key={shape} onClick={() => handleAddTable(shape)} className="w-full uniweb-card p-3 text-left hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 border-2 border-border flex items-center justify-center text-[10px] text-muted-foreground", shape === "round" ? "rounded-full" : shape === "booth" ? "rounded-lg" : "rounded-sm")}>
                      <Plus className="h-3 w-3" />
                    </div>
                    <div>
                      <div className="text-[12px] font-medium text-foreground">{cfg.label}</div>
                      <div className="text-[10px] text-muted-foreground">{cfg.seats} pax</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFloorPlan;

import React, { useState } from "react";
import { Search, ShoppingBag, Truck, ArrowRightLeft, Merge, Split, X, Check, Users, Maximize2, Minimize2, CalendarCheck, UserCheck, List, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Table, type TableStatus, type ServiceMode, type Reservation, type CancelReason, zones } from "@/data/mock-data";
import { useLanguage } from "@/hooks/useLanguage";
import uniwebLogo from "@/assets/uniweb-logo.jpg";
import { ReservationDialog } from "./ReservationDialog";
import { CancelReservationDialog } from "./CancelReservationDialog";
import { SeatReservationDialog } from "./SeatReservationDialog";
import { ReservationListPanel } from "./ReservationListPanel";

type TableAction = "transfer" | "merge" | "split" | null;

interface FloorPanelProps {
  tables: Table[];
  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;
  onCreateWalkIn: (mode: ServiceMode) => void;
  onTransferTable?: (fromId: string, toId: string) => void;
  onMergeTables?: (tableIds: string[]) => void;
  onSplitTable?: (tableId: string, count: number) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onSeatReserved?: (tableId: string, guestCount: number, customerId?: string) => void;
  onReserveTable?: (tableId: string, data: { guestName: string; guestCount: number; phone?: string; reservationTime?: string; notes?: string }) => void;
  onCancelReservation?: (tableId: string, reason: CancelReason, note?: string) => void;
  reservations?: Reservation[];
}

const statusConfig: Record<TableStatus, { dot: string; border: string; bg: string; labelKey: string; badgeBg: string; badgeText: string }> = {
  available:  { dot: "bg-status-green",  border: "border-status-green/30",  bg: "bg-card", labelKey: "available", badgeBg: "bg-status-green-light", badgeText: "text-status-green" },
  reserved:   { dot: "bg-primary",       border: "border-primary/30",       bg: "bg-card", labelKey: "reserved",  badgeBg: "bg-status-blue-light",  badgeText: "text-primary" },
  ordering:   { dot: "bg-status-amber",  border: "border-status-amber/30",  bg: "bg-card", labelKey: "ordering",  badgeBg: "bg-status-amber-light", badgeText: "text-status-amber" },
  ordered:    { dot: "bg-status-amber",  border: "border-status-amber/30",  bg: "bg-card", labelKey: "ordered",   badgeBg: "bg-status-amber-light", badgeText: "text-status-amber" },
  dirty:      { dot: "bg-status-red",    border: "border-status-red/30",    bg: "bg-card", labelKey: "dirty",     badgeBg: "bg-status-red-light",   badgeText: "text-status-red" },
  cleaning:   { dot: "bg-muted-foreground", border: "border-border",        bg: "bg-card", labelKey: "cleaning",  badgeBg: "bg-accent",             badgeText: "text-muted-foreground" },
};

const allStatuses: TableStatus[] = ["available", "reserved", "ordering", "ordered", "dirty", "cleaning"];

export const FloorPanel: React.FC<FloorPanelProps> = ({
  tables, selectedTableId, onSelectTable, onCreateWalkIn,
  onTransferTable, onMergeTables, onSplitTable,
  isFullscreen, onToggleFullscreen,
  onSeatReserved, onReserveTable, onCancelReservation, reservations,
}) => {
  const { t } = useLanguage();
  const [activeZone, setActiveZone] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableAction, setTableAction] = useState<TableAction>(null);
  const [mergeTargets, setMergeTargets] = useState<string[]>([]);
  const [splitCount, setSplitCount] = useState(2);
  const [showReserveDialog, setShowReserveDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSeatDialog, setShowSeatDialog] = useState(false);
  const [viewMode, setViewMode] = useState<"floor" | "reservations">("floor");

  const filteredTables = tables.filter(t => {
    if (activeZone !== "All" && t.zone !== activeZone) return false;
    if (searchQuery && !t.number.includes(searchQuery)) return false;
    return true;
  });

  const handleTableClick = (tableId: string) => {
    if (tableAction === "transfer" && selectedTableId) {
      if (tableId !== selectedTableId) {
        onTransferTable?.(selectedTableId, tableId);
        setTableAction(null);
      }
      return;
    }
    if (tableAction === "merge") {
      setMergeTargets(prev =>
        prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
      );
      return;
    }
    // Confirm before selecting dirty/cleaning tables
    const table = tables.find(t => t.id === tableId);
    if (table && (table.status === "dirty" || table.status === "cleaning")) {
      const confirmed = window.confirm(
        `Table ${table.number} is currently "${table.status}". Are you sure you want to select it?`
      );
      if (!confirmed) return;
    }
    // Close any open dialogs when selecting a new table
    setShowReserveDialog(false);
    setShowCancelDialog(false);
    setShowSeatDialog(false);
    onSelectTable(tableId);
  };

  const handleConfirmMerge = () => {
    if (mergeTargets.length >= 2) onMergeTables?.(mergeTargets);
    setMergeTargets([]);
    setTableAction(null);
  };

  const handleConfirmSplit = () => {
    if (selectedTableId && splitCount >= 2) onSplitTable?.(selectedTableId, splitCount);
    setTableAction(null);
  };

  const cancelAction = () => { setTableAction(null); setMergeTargets([]); };

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const showActions = selectedTable && !tableAction && (selectedTable.status === "ordering" || selectedTable.status === "ordered" || selectedTable.status === "available" || selectedTable.status === "reserved");
  const selectedReservation = selectedTableId && reservations ? reservations.find(r => r.tableId === selectedTableId && r.status === "pending") : undefined;

  const pendingCount = reservations ? reservations.filter(r => r.status === "pending").length : 0;

  return (
    <div className={cn(
      "bg-card flex flex-col shrink-0 transition-all duration-300 h-full",
      isFullscreen ? "absolute inset-0 z-40 border-r-0" : ""
    )}>
      {/* Header with logo */}
      <div className="h-[52px] px-3 border-b border-border flex items-center gap-2 bg-card shrink-0">
        <img src={uniwebLogo} alt="Uniweb" className="w-7 h-7 rounded-[7px] flex-shrink-0" />
        <h2 className="font-semibold text-foreground text-[13px] flex-1">{t("floor")}</h2>
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("search_table")}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-[9px] bg-background border-1.5 border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      {/* View Toggle: Floor Plan vs Reservations */}
      <div className="flex gap-1 px-3 py-1.5 border-b border-border">
        <button
          onClick={() => setViewMode("floor")}
          className={cn(
            "flex-1 h-8 rounded-md text-[11px] font-medium transition-colors",
            viewMode === "floor" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          )}
        >
          {t("floor")}
        </button>
        <button
          onClick={() => setViewMode("reservations")}
          className={cn(
            "flex-1 h-8 rounded-md text-[11px] font-medium transition-colors flex items-center justify-center gap-1",
            viewMode === "reservations" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          )}
        >
          <List className="h-3 w-3" />
          {t("reservationList")}
          {pendingCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-status-red text-white text-[9px] font-bold flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {viewMode === "floor" ? (
        <>
          {/* Zone Tabs */}
          <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-border">
            {[t("all"), ...zones].map((zone, idx) => {
              const rawZone = idx === 0 ? "All" : zones[idx - 1];
              return (
                <button
                  key={rawZone}
                  onClick={() => setActiveZone(rawZone)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors min-h-[36px]",
                    activeZone === rawZone
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  {zone}
                </button>
              );
            })}
          </div>

          {/* Status Legend */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 border-b border-border bg-accent/30">
            {allStatuses.map(status => {
              const cfg = statusConfig[status];
              return (
                <div key={status} className="flex items-center gap-1.5">
                  <span className={cn("w-[7px] h-[7px] rounded-full status-pulse", cfg.dot)} />
                  <span className="text-[10px] text-muted-foreground font-medium">{t(cfg.labelKey)}</span>
                </div>
              );
            })}
          </div>

          {/* Action mode banner */}
          {tableAction && (
            <div className="px-3 py-2 bg-primary/10 border-b border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-primary">
                  {tableAction === "transfer" && t("select_target")}
                  {tableAction === "merge" && `${t("select_tables_to_merge")} (${mergeTargets.length})`}
                  {tableAction === "split" && t("split_table")}
                </span>
                <button onClick={cancelAction} className="p-1 rounded hover:bg-accent min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              {tableAction === "split" && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-foreground">{t("split_into")}</span>
                  <div className="flex items-center gap-1">
                    {[2, 3, 4].map(n => (
                      <button
                        key={n}
                        onClick={() => setSplitCount(n)}
                        className={cn(
                          "w-9 h-9 rounded-md text-xs font-bold transition-colors",
                          splitCount === n ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleConfirmSplit} className="ml-auto p-2 rounded-md bg-primary text-primary-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {tableAction === "merge" && mergeTargets.length >= 2 && (
                <Button size="sm" className="w-full mt-2 h-9 text-xs rounded-md" onClick={handleConfirmMerge}>
                  {t("merge_confirm")} ({mergeTargets.length} {t("tables")})
                </Button>
              )}
            </div>
          )}

          {/* Table Grid */}
          <div className="flex-1 overflow-y-auto pos-scrollbar p-3">
            <div className={cn(
              "grid gap-2.5",
              isFullscreen ? "grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8" : "grid-cols-2"
            )}>
              {filteredTables.map(table => {
                const cfg = statusConfig[table.status];
                const isSelected = selectedTableId === table.id;
                const isMergeTarget = mergeTargets.includes(table.id);
                return (
                  <button
                    key={table.id}
                    onClick={() => handleTableClick(table.id)}
                    className={cn(
                      "relative rounded-xl border-[2px] text-left transition-all duration-300 ease-out p-3 active:scale-95 surface-glow",
                      cfg.bg, cfg.border,
                      isSelected && "gradient-ring border-primary/30",
                      isMergeTarget && "gradient-ring bg-primary/10",
                      tableAction === "transfer" && table.status !== "available" && table.id !== selectedTableId && "opacity-40 pointer-events-none"
                    )}
                  >
                    {/* Row 1: Table number + status dot */}
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-bold text-foreground text-[16px] leading-none">#{table.number}</span>
                      <span className={cn("w-[10px] h-[10px] rounded-full flex-shrink-0 mt-0.5 status-pulse", cfg.dot)} />
                    </div>

                    {/* Row 2: Seats */}
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
                      <Users className="h-3 w-3 flex-shrink-0" />
                      <span>{table.seats} {t("seats")}</span>
                    </div>

                    {/* Row 3: Status badge */}
                    <div>
                      <span className={cn("inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md", cfg.badgeBg, cfg.badgeText)}>
                        {t(cfg.labelKey)}
                      </span>
                    </div>

                    {/* Reservation info on card */}
                    {table.status === "reserved" && table.reservationName && (
                      <div className="mt-1.5 pt-1 border-t border-border/50">
                        <div className="text-[10px] font-medium text-primary truncate">{table.reservationName}</div>
                        {table.reservationTime && (
                          <div className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(table.reservationTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Amount + elapsed (only for active tables) */}
                    {(table.openAmount !== undefined && table.openAmount > 0) && (
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/50">
                        <span className="text-[11px] font-semibold text-foreground font-mono">${table.openAmount.toFixed(2)}</span>
                        {table.elapsedMinutes !== undefined && table.elapsedMinutes > 0 && (
                          <span className="text-[10px] text-muted-foreground">{table.elapsedMinutes}m</span>
                        )}
                      </div>
                    )}

                    {/* Merged indicator */}
                    {table.mergedWith && table.mergedWith.length > 0 && (
                      <div className="text-[9px] text-primary font-medium mt-1">
                        +T{table.mergedWith.map(id => tables.find(t => t.id === id)?.number).join(",T")}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* Reservations List View */
        <ReservationListPanel
          reservations={reservations || []}
          onSelectReservation={(_rId, tId) => {
            setViewMode("floor");
            onSelectTable(tId);
          }}
        />
      )}

      {/* Table Actions */}
      {showActions && !isFullscreen && viewMode === "floor" && (
        <div className="px-3 py-2 border-t border-border space-y-1.5">
          {/* Reserve action for available tables */}
          {selectedTable?.status === "available" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-xs rounded-lg min-h-[40px]"
              onClick={() => setShowReserveDialog(true)}
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              {t("reserveTable")}
            </Button>
          )}
          {/* Seat + Cancel actions for reserved tables */}
          {selectedTable?.status === "reserved" && (
            <>
              <Button
                size="sm"
                className="w-full justify-start gap-2 text-xs rounded-lg min-h-[40px]"
                onClick={() => setShowSeatDialog(true)}
              >
                <UserCheck className="h-3.5 w-3.5" />
                {t("seatGuests")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-xs rounded-lg min-h-[40px] text-status-red hover:text-status-red"
                onClick={() => setShowCancelDialog(true)}
              >
                <X className="h-3.5 w-3.5" />
                {t("cancelReservation")}
              </Button>
            </>
          )}
          <div className="flex gap-1">
            <button
              onClick={() => setTableAction("transfer")}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-md text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors min-h-[44px] active:scale-95"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              {t("transfer_table")}
            </button>
            <button
              onClick={() => { setTableAction("merge"); setMergeTargets(selectedTableId ? [selectedTableId] : []); }}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-md text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors min-h-[44px] active:scale-95"
            >
              <Merge className="h-3.5 w-3.5" />
              {t("merge_tables")}
            </button>
            <button
              onClick={() => setTableAction("split")}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-md text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors min-h-[44px] active:scale-95"
            >
              <Split className="h-3.5 w-3.5" />
              {t("split_table")}
            </button>
          </div>
        </div>
      )}

      {/* ReservationDialog */}
      {showReserveDialog && selectedTableId && selectedTable && (
        <ReservationDialog
          table={selectedTable}
          onConfirm={(data) => {
            onReserveTable?.(selectedTableId, data);
            setShowReserveDialog(false);
          }}
          onCancel={() => setShowReserveDialog(false)}
        />
      )}

      {/* CancelReservationDialog */}
      {showCancelDialog && selectedTableId && selectedTable && selectedReservation && (
        <CancelReservationDialog
          table={selectedTable}
          reservation={selectedReservation}
          onConfirm={(reason, note) => {
            onCancelReservation?.(selectedTableId, reason, note);
            setShowCancelDialog(false);
          }}
          onCancel={() => setShowCancelDialog(false)}
        />
      )}

      {/* SeatReservationDialog */}
      {showSeatDialog && selectedTableId && selectedTable && selectedReservation && (
        <SeatReservationDialog
          table={selectedTable}
          reservation={selectedReservation}
          onConfirm={(guestCount, customerId) => {
            onSeatReserved?.(selectedTableId, guestCount, customerId);
            setShowSeatDialog(false);
          }}
          onCancel={() => setShowSeatDialog(false)}
        />
      )}

      {/* Quick Actions */}
      {!isFullscreen && viewMode === "floor" && (
        <div className="p-3 border-t border-border space-y-1.5">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs rounded-lg min-h-[44px]" onClick={() => onCreateWalkIn("takeaway")}>
            <ShoppingBag className="h-3.5 w-3.5" />{t("takeaway_order")}
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs rounded-lg min-h-[44px]" onClick={() => onCreateWalkIn("delivery")}>
            <Truck className="h-3.5 w-3.5" />{t("delivery_order")}
          </Button>
        </div>
      )}
    </div>
  );
};

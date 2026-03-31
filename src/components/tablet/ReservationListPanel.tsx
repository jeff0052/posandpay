import React, { useState } from "react";
import { Calendar, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Reservation, type ReservationStatus } from "@/data/mock-data";
import { useLanguage } from "@/hooks/useLanguage";

interface ReservationListPanelProps {
  reservations: Reservation[];
  onSelectReservation: (reservationId: string, tableId: string) => void;
}

const statusBadge: Record<ReservationStatus, { bg: string; text: string; labelKey: string }> = {
  pending:   { bg: "bg-status-blue-light", text: "text-primary",    labelKey: "pendingReservations" },
  seated:    { bg: "bg-status-green-light", text: "text-status-green", labelKey: "seatedReservations" },
  cancelled: { bg: "bg-status-red-light",   text: "text-status-red",   labelKey: "cancelledReservations" },
  "no-show": { bg: "bg-status-red-light",   text: "text-status-red",   labelKey: "noShow" },
};

type FilterKey = "all" | "pending" | "seated" | "cancelled";

export const ReservationListPanel: React.FC<ReservationListPanelProps> = ({
  reservations, onSelectReservation,
}) => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterKey>("all");

  const filters: { key: FilterKey; labelKey: string }[] = [
    { key: "all", labelKey: "allReservations" },
    { key: "pending", labelKey: "pendingReservations" },
    { key: "seated", labelKey: "seatedReservations" },
    { key: "cancelled", labelKey: "cancelledReservations" },
  ];

  const filtered = reservations.filter(r => {
    if (filter === "all") return true;
    if (filter === "cancelled") return r.status === "cancelled" || r.status === "no-show";
    return r.status === filter;
  }).sort((a, b) => {
    const aTime = a.reservationTime || a.createdAt;
    const bTime = b.reservationTime || b.createdAt;
    return new Date(aTime).getTime() - new Date(bTime).getTime();
  });

  const formatTime = (r: Reservation) => {
    if (r.reservationTime) {
      return new Date(r.reservationTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return t("instantHold");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filter chips */}
      <div className="flex gap-1 px-3 py-2 border-b border-border">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-2.5 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors min-h-[32px]",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pos-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Calendar className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-[12px]">{t("noReservationsToday")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(r => {
              const badge = statusBadge[r.status];
              const isClickable = r.status === "pending" || r.status === "seated";
              return (
                <button
                  key={r.id}
                  onClick={() => isClickable && onSelectReservation(r.id, r.tableId)}
                  disabled={!isClickable}
                  className={cn(
                    "w-full px-3 py-2.5 text-left transition-colors",
                    isClickable ? "hover:bg-accent cursor-pointer" : "opacity-60 cursor-default"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatTime(r)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">#{r.tableNumber} · {r.zone}</span>
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md", badge.bg, badge.text)}>
                      {t(badge.labelKey)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-medium text-foreground">{r.guestName}</span>
                    <span className="text-muted-foreground flex items-center gap-0.5">
                      <Users className="h-3 w-3" /> {r.guestCount}
                    </span>
                    {r.phone && <span className="text-muted-foreground">{r.phone}</span>}
                  </div>
                  {r.notes && <div className="text-[10px] text-muted-foreground mt-0.5">{r.notes}</div>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Table, type Reservation, type CancelReason } from "@/data/mock-data";
import { useLanguage } from "@/hooks/useLanguage";

interface CancelReservationDialogProps {
  table: Table;
  reservation: Reservation;
  onConfirm: (reason: CancelReason, note?: string) => void;
  onCancel: () => void;
}

export const CancelReservationDialog: React.FC<CancelReservationDialogProps> = ({
  table, reservation, onConfirm, onCancel,
}) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState<CancelReason | null>(null);
  const [note, setNote] = useState("");

  const reasons: { value: CancelReason; label: string }[] = [
    { value: "customer-cancel", label: t("customerCancelled") },
    { value: "no-show", label: t("noShow") },
    { value: "other", label: t("otherReason") },
  ];

  return (
    <div className="px-3 py-3 border-t border-border bg-accent/30 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-status-red" />
          {t("cancelReservation")}
        </div>
        <button onClick={onCancel} className="p-1 rounded hover:bg-accent">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Reservation Summary */}
      <div className="bg-background rounded-md p-2 text-[11px] space-y-0.5">
        <div className="font-medium text-foreground">#{table.number} — {reservation.guestName}</div>
        <div className="text-muted-foreground">
          {reservation.guestCount} {t("guestCount")}
          {reservation.reservationTime && ` · ${new Date(reservation.reservationTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        </div>
      </div>

      {/* Reason Selection */}
      <div className="space-y-1">
        <span className="text-[11px] text-muted-foreground font-medium">{t("cancelReason")} *</span>
        <div className="space-y-1">
          {reasons.map(r => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              className={cn(
                "w-full h-8 px-2.5 rounded-md text-[11px] text-left font-medium transition-colors",
                reason === r.value
                  ? "bg-status-red/10 text-status-red border border-status-red/30"
                  : "bg-card border border-border text-foreground hover:bg-accent"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Note (shown for "other") */}
      {reason === "other" && (
        <textarea
          placeholder={t("cancelNote")}
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          className="w-full px-2.5 py-1.5 rounded-md bg-background border-1.5 border-border text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
        />
      )}

      {/* Actions */}
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" className="flex-1 text-[11px] h-8" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="flex-1 text-[11px] h-8"
          disabled={!reason}
          onClick={() => reason && onConfirm(reason, note.trim() || undefined)}
        >
          {t("confirmCancel")}
        </Button>
      </div>
    </div>
  );
};

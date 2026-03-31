import React, { useState } from "react";
import { CalendarCheck, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Table } from "@/data/mock-data";
import { useLanguage } from "@/hooks/useLanguage";

interface ReservationDialogProps {
  table: Table;
  onConfirm: (data: {
    guestName: string;
    guestCount: number;
    phone?: string;
    reservationTime?: string;
    notes?: string;
  }) => void;
  onCancel: () => void;
}

export const ReservationDialog: React.FC<ReservationDialogProps> = ({ table, onConfirm, onCancel }) => {
  const { t } = useLanguage();
  const [guestName, setGuestName] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [phone, setPhone] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("19:00");
  const [notes, setNotes] = useState("");
  const [nameError, setNameError] = useState(false);

  const handleConfirm = () => {
    if (!guestName.trim()) {
      setNameError(true);
      return;
    }
    let reservationTime: string | undefined;
    if (isScheduled) {
      reservationTime = new Date(`${date}T${time}`).toISOString();
    }
    onConfirm({
      guestName: guestName.trim(),
      guestCount,
      phone: phone.trim() || undefined,
      reservationTime,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="px-3 py-3 border-t border-border bg-accent/30 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
          <CalendarCheck className="h-3.5 w-3.5 text-primary" />
          {t("reserveTable")} #{table.number}
        </div>
        <button onClick={onCancel} className="p-1 rounded hover:bg-accent">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Guest Name */}
      <div>
        <input
          type="text"
          placeholder={t("guestName") + " *"}
          value={guestName}
          onChange={e => { setGuestName(e.target.value); setNameError(false); }}
          className={cn(
            "w-full h-8 px-2.5 rounded-md bg-background border-1.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all",
            nameError ? "border-status-red" : "border-border"
          )}
        />
        {nameError && <p className="text-[10px] text-status-red mt-0.5">{t("guestNameRequired")}</p>}
      </div>

      {/* Phone */}
      <input
        type="tel"
        placeholder={t("phone")}
        value={phone}
        onChange={e => setPhone(e.target.value)}
        className="w-full h-8 px-2.5 rounded-md bg-background border-1.5 border-border text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
      />

      {/* Guest Count */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-muted-foreground">{t("guestCount")}:</span>
        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(n => (
          <button
            key={n}
            onClick={() => setGuestCount(n)}
            className={cn(
              "w-7 h-7 rounded-md text-[11px] font-bold transition-colors",
              guestCount === n ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
            )}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Reservation Type Toggle */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setIsScheduled(false)}
          className={cn(
            "flex-1 h-8 rounded-md text-[11px] font-medium transition-colors",
            !isScheduled ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
          )}
        >
          {t("instantHold")}
        </button>
        <button
          onClick={() => setIsScheduled(true)}
          className={cn(
            "flex-1 h-8 rounded-md text-[11px] font-medium transition-colors flex items-center justify-center gap-1",
            isScheduled ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
          )}
        >
          <Clock className="h-3 w-3" />
          {t("scheduled")}
        </button>
      </div>

      {/* Date/Time pickers */}
      {isScheduled && (
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="flex-1 h-8 px-2 rounded-md bg-background border-1.5 border-border text-[12px] text-foreground focus:outline-none focus:border-primary transition-all"
          />
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-24 h-8 px-2 rounded-md bg-background border-1.5 border-border text-[12px] text-foreground focus:outline-none focus:border-primary transition-all"
          />
        </div>
      )}

      {/* Notes */}
      <textarea
        placeholder={t("notes")}
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={2}
        className="w-full px-2.5 py-1.5 rounded-md bg-background border-1.5 border-border text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
      />

      {/* Actions */}
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" className="flex-1 text-[11px] h-8" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button size="sm" className="flex-1 text-[11px] h-8" onClick={handleConfirm}>
          {t("confirm")}
        </Button>
      </div>
    </div>
  );
};

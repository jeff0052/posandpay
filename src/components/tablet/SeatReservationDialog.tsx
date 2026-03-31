import React, { useState } from "react";
import { UserCheck, Search, X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Table, type Reservation } from "@/data/mock-data";
import { useLanguage } from "@/hooks/useLanguage";
import { useCustomers, type CustomerFull } from "@/state/customer-store";

interface SeatReservationDialogProps {
  table: Table;
  reservation: Reservation;
  onConfirm: (guestCount: number, customerId?: string) => void;
  onCancel: () => void;
}

export const SeatReservationDialog: React.FC<SeatReservationDialogProps> = ({
  table, reservation, onConfirm, onCancel,
}) => {
  const { t } = useLanguage();
  const { findByPhone } = useCustomers();
  const [guestCount, setGuestCount] = useState(reservation.guestCount);
  const [searchPhone, setSearchPhone] = useState(reservation.phone || "");
  const [foundMember, setFoundMember] = useState<CustomerFull | null>(null);
  const [linkedMemberId, setLinkedMemberId] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!searchPhone.trim()) return;
    const result = findByPhone(searchPhone.trim());
    setFoundMember(result || null);
    setSearched(true);
    if (result) setLinkedMemberId(result.id);
  };

  const tierColors: Record<string, string> = {
    bronze: "text-amber-700 bg-amber-100",
    silver: "text-gray-600 bg-gray-100",
    gold: "text-yellow-600 bg-yellow-100",
    platinum: "text-purple-600 bg-purple-100",
  };

  return (
    <div className="px-3 py-3 border-t border-border bg-accent/30 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
          <UserCheck className="h-3.5 w-3.5 text-primary" />
          {t("seatGuests")} — #{table.number}
        </div>
        <button onClick={onCancel} className="p-1 rounded hover:bg-accent">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Reservation Info */}
      <div className="bg-background rounded-md p-2 text-[11px] space-y-0.5">
        <div className="font-medium text-foreground">{reservation.guestName}</div>
        <div className="text-muted-foreground">
          {reservation.guestCount} {t("guestCount")}
          {reservation.phone && ` · ${reservation.phone}`}
          {reservation.reservationTime && ` · ${new Date(reservation.reservationTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        </div>
      </div>

      {/* Actual Guest Count */}
      <div>
        <span className="text-[11px] text-muted-foreground font-medium">{t("actualGuestCount")}:</span>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
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
      </div>

      {/* Member Search */}
      <div className="space-y-1.5">
        <span className="text-[11px] text-muted-foreground font-medium">{t("searchMember")}</span>
        <div className="flex gap-1.5">
          <input
            type="tel"
            placeholder={t("phone")}
            value={searchPhone}
            onChange={e => { setSearchPhone(e.target.value); setSearched(false); setFoundMember(null); setLinkedMemberId(null); }}
            className="flex-1 h-8 px-2.5 rounded-md bg-background border-1.5 border-border text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
          />
          <Button size="sm" variant="outline" className="h-8 px-2" onClick={handleSearch}>
            <Search className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Search Result */}
        {searched && (
          foundMember ? (
            <div className={cn(
              "flex items-center justify-between p-2 rounded-md text-[11px]",
              linkedMemberId ? "bg-primary/10 border border-primary/30" : "bg-background border border-border"
            )}>
              <div className="flex items-center gap-2">
                <Crown className="h-3.5 w-3.5 text-primary" />
                <div>
                  <div className="font-medium text-foreground">{foundMember.name}</div>
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", tierColors[foundMember.tier])}>
                    {foundMember.tier}
                  </span>
                </div>
              </div>
              {linkedMemberId ? (
                <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setLinkedMemberId(null)}>
                  {t("cancel")}
                </Button>
              ) : (
                <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => setLinkedMemberId(foundMember.id)}>
                  {t("linkMember")}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground py-1">{t("noMemberFound")}</div>
          )
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" className="flex-1 text-[11px] h-8" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button size="sm" className="flex-1 text-[11px] h-8" onClick={() => onConfirm(guestCount, linkedMemberId || undefined)}>
          {t("seatAndOrder")}
        </Button>
      </div>
    </div>
  );
};

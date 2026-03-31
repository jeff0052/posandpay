import React, { useState } from "react";
import { X, User, Search, Crown, Delete, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { findByPhone as findCustomerByPhone, type CustomerFull } from "@/state/customer-store";
import { TIER_COLORS, getTierById } from "@/state/membership-store";

interface MemberIdentifyDialogProps {
  open: boolean;
  onClose: () => void;
  onMemberFound: (customer: CustomerFull) => void;
  onClearMember: () => void;
  currentMember?: CustomerFull | null;
}

export const MemberIdentifyDialog: React.FC<MemberIdentifyDialogProps> = ({
  open, onClose, onMemberFound, onClearMember, currentMember,
}) => {
  const { t } = useLanguage();
  // Use standalone findByPhone from customer-store
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);
  const [foundMember, setFoundMember] = useState<CustomerFull | null>(null);

  if (!open) return null;

  const handleSearch = () => {
    if (phone.length < 4) return;
    const result = findCustomerByPhone(phone);
    setFoundMember(result || null);
    setSearched(true);
  };

  const handleKey = (key: string) => {
    if (key === "del") {
      setPhone(prev => prev.slice(0, -1));
      setSearched(false);
      setFoundMember(null);
    } else if (key === "clear") {
      setPhone("");
      setSearched(false);
      setFoundMember(null);
    } else if (phone.length < 12) {
      const newPhone = phone + key;
      setPhone(newPhone);
      setSearched(false);
      setFoundMember(null);
    }
  };

  const handleConfirm = () => {
    if (foundMember) {
      onMemberFound(foundMember);
      onClose();
      setPhone("");
      setSearched(false);
      setFoundMember(null);
    }
  };

  const handleRemove = () => {
    onClearMember();
    onClose();
    setPhone("");
    setSearched(false);
    setFoundMember(null);
  };

  const tierColors = foundMember
    ? TIER_COLORS[getTierById(`tier-${foundMember.tier}`)?.color || "stone"] || TIER_COLORS.stone
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-elevated w-[340px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="text-[14px] font-semibold text-foreground">Member</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Current member display */}
        {currentMember && !searched && (
          <div className="px-4 py-3 bg-status-green-light/50 border-b border-border">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-status-green" />
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-foreground">{currentMember.name}</div>
                <div className="text-[11px] text-muted-foreground">{currentMember.phone} · {currentMember.tier} · {currentMember.points} pts</div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2 h-7 text-[11px] text-status-red hover:text-status-red" onClick={handleRemove}>
              Remove Member
            </Button>
          </div>
        )}

        {/* Phone input display */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border-1.5 border-border">
            <span className="text-[13px] text-muted-foreground">+65</span>
            <span className="w-px h-5 bg-border" />
            <span className={cn(
              "flex-1 text-[18px] font-mono tracking-widest",
              phone ? "text-foreground" : "text-muted-foreground/40"
            )}>
              {phone || "Phone number"}
            </span>
            {phone && (
              <button onClick={() => handleKey("clear")} className="p-1 rounded hover:bg-accent">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Search result */}
        {searched && (
          <div className="px-4 pb-2">
            {foundMember ? (
              <div className={cn("flex items-center gap-3 p-3 rounded-lg border", tierColors?.border || "border-border", tierColors?.bg || "bg-accent/30")}>
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-bold">
                  {foundMember.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-foreground">{foundMember.name}</div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", tierColors?.bg, tierColors?.text)}>
                      {foundMember.tier}
                    </span>
                    <span>{foundMember.points} pts</span>
                    <span>{foundMember.visits} visits</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-3 text-[12px] text-muted-foreground">
                No member found for this number
              </div>
            )}
          </div>
        )}

        {/* Numpad */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-1.5">
            {["1","2","3","4","5","6","7","8","9"].map(k => (
              <button key={k} onClick={() => handleKey(k)}
                className="h-12 rounded-lg bg-accent hover:bg-secondary text-[18px] font-semibold text-foreground transition-colors active:scale-95">
                {k}
              </button>
            ))}
            <button onClick={() => handleKey("clear")}
              className="h-12 rounded-lg bg-accent hover:bg-secondary text-[11px] font-medium text-muted-foreground transition-colors active:scale-95">
              Clear
            </button>
            <button onClick={() => handleKey("0")}
              className="h-12 rounded-lg bg-accent hover:bg-secondary text-[18px] font-semibold text-foreground transition-colors active:scale-95">
              0
            </button>
            <button onClick={() => handleKey("del")}
              className="h-12 rounded-lg bg-accent hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors active:scale-95">
              <Delete className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex gap-2">
          {searched && foundMember ? (
            <Button className="flex-1 h-10 text-[13px]" onClick={handleConfirm}>
              <Crown className="h-3.5 w-3.5 mr-1.5" />
              Link Member
            </Button>
          ) : (
            <Button className="flex-1 h-10 text-[13px]" onClick={handleSearch} disabled={phone.length < 4}>
              <Search className="h-3.5 w-3.5 mr-1.5" />
              Search
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

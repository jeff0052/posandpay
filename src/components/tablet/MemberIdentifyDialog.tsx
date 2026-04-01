import React, { useState } from "react";
import { X, User, Search, Crown, Delete, UserPlus, Wallet, ArrowLeft, Check, Lock, Coins, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { findByPhone as findCustomerByPhone, registerCustomer, topUp, deductBalance, convertPointsToBalance, POINTS_TO_DOLLAR, type CustomerFull } from "@/state/customer-store";
import { TIER_COLORS, getTierById } from "@/state/membership-store";

type DialogView = "search" | "register" | "topup" | "pin" | "usebalance" | "usepoints";

interface MemberIdentifyDialogProps {
  open: boolean;
  onClose: () => void;
  onMemberFound: (customer: CustomerFull) => void;
  onClearMember: () => void;
  currentMember?: CustomerFull | null;
  onUseBalance?: (amount: number) => void;
}

export const MemberIdentifyDialog: React.FC<MemberIdentifyDialogProps> = ({
  open, onClose, onMemberFound, onClearMember, currentMember, onUseBalance,
}) => {
  const { t } = useLanguage();
  const [view, setView] = useState<DialogView>("search");
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);
  const [foundMember, setFoundMember] = useState<CustomerFull | null>(null);

  // Register form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");

  // Top up
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpDone, setTopUpDone] = useState(false);

  // PIN
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  // Use balance
  const [useBalanceAmount, setUseBalanceAmount] = useState("");

  // Use points
  const [convertPoints, setConvertPoints] = useState("");
  const [convertDone, setConvertDone] = useState(false);

  if (!open) return null;

  const resetAll = () => {
    setView("search");
    setPhone("");
    setSearched(false);
    setFoundMember(null);
    setRegName("");
    setRegEmail("");
    setRegPhone("");
    setTopUpAmount("");
    setTopUpDone(false);
    setPin("");
    setPinError(false);
    setUseBalanceAmount("");
    setConvertPoints("");
    setConvertDone(false);
  };

  const handleClose = () => {
    onClose();
    resetAll();
  };

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
      setPhone(prev => prev + key);
      setSearched(false);
      setFoundMember(null);
    }
  };

  const handleConfirm = () => {
    if (foundMember) {
      onMemberFound(foundMember);
      // Stay on dialog to show member actions (Top Up, Use Balance, etc.)
      setPhone("");
      setSearched(false);
      setFoundMember(null);
    }
  };

  const handleRemove = () => {
    onClearMember();
    handleClose();
  };

  const handleRegister = () => {
    if (!regPhone || regPhone.length < 4) return;
    const newMember = registerCustomer(regPhone, regEmail || undefined, regName || undefined);
    onMemberFound(newMember);
    handleClose();
  };

  const handleTopUp = (amount: number) => {
    if (!currentMember || amount <= 0) return;
    topUp(currentMember.id, amount);
    setTopUpDone(true);
    setTimeout(() => {
      // Re-find member with updated balance
      const updated = findCustomerByPhone(currentMember.phone);
      if (updated) onMemberFound(updated);
    }, 100);
  };

  const tierColors = foundMember
    ? TIER_COLORS[getTierById(`tier-${foundMember.tier}`)?.color || "stone"] || TIER_COLORS.stone
    : null;

  const currentTierColors = currentMember
    ? TIER_COLORS[getTierById(`tier-${currentMember.tier}`)?.color || "stone"] || TIER_COLORS.stone
    : null;

  const headerTitle = view === "register" ? t("add_new_member")
    : view === "topup" ? t("top_up")
    : view === "pin" ? t("enter_pin")
    : view === "usebalance" ? t("use_balance")
    : view === "usepoints" ? t("use_points")
    : "Member";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-elevated w-[340px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            {view !== "search" && (
              <button onClick={() => { setView(view === "pin" ? "topup" : "search"); setTopUpDone(false); setPin(""); setPinError(false); setConvertDone(false); }} className="p-1 rounded-lg hover:bg-accent">
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <User className="h-4 w-4 text-primary" />
            <span className="text-[14px] font-semibold text-foreground">{headerTitle}</span>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-accent">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* === SEARCH VIEW === */}
        {view === "search" && (
          <>
            {/* Current member display */}
            {currentMember && !searched && (
              <div className="px-4 py-3 bg-status-green-light/50 border-b border-border">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-status-green" />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-foreground">{currentMember.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {currentMember.phone} · {currentMember.tier} · {currentMember.points} pts
                    </div>
                    <div className="text-[11px] font-semibold text-primary mt-0.5">
                      {t("balance")}: ${currentMember.balance.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setView("topup")}>
                    <Wallet className="h-3 w-3 mr-1" />
                    {t("top_up")}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] text-status-red hover:text-status-red" onClick={handleRemove}>
                    {t("remove")}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => { setUseBalanceAmount(""); setView("usebalance"); }}>
                    <Wallet className="h-3 w-3 mr-1" />
                    {t("use_balance")}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => { setConvertPoints(""); setConvertDone(false); setView("usepoints"); }}>
                    <Coins className="h-3 w-3 mr-1" />
                    {t("use_points")}
                  </Button>
                </div>
              </div>
            )}

            {/* Phone search — only show when no member linked */}
            {!currentMember && (
              <>
                {/* Phone input display */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center gap-2 h-11 px-3 rounded-lg bg-background border-1.5 border-border">
                    <span className="text-[13px] text-muted-foreground">+65</span>
                    <span className="w-px h-5 bg-border" />
                    <span className={cn(
                      "flex-1 text-[18px] font-mono tracking-widest",
                      phone ? "text-foreground" : "text-muted-foreground/40"
                    )}>
                      {phone || t("phone_number")}
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
                            <span>${foundMember.balance.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3 text-[12px] text-muted-foreground">
                        {t("no_member_found")}
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
                      {t("link_member")}
                    </Button>
                  ) : (
                    <>
                      <Button className="flex-1 h-10 text-[13px]" onClick={handleSearch} disabled={phone.length < 4}>
                        <Search className="h-3.5 w-3.5 mr-1.5" />
                        {t("search")}
                      </Button>
                      <Button variant="outline" className="h-10 text-[13px]" onClick={() => { setRegPhone(phone); setView("register"); }}>
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                        {t("add_new")}
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* === REGISTER VIEW === */}
        {view === "register" && (
          <div className="px-4 py-4 space-y-3">
            {/* Name */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t("name")}</label>
              <input
                type="text"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                placeholder={t("enter_name")}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {/* Phone */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t("phone")}</label>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-muted-foreground shrink-0">+65</span>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="8xxx xxxx"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
            </div>
            {/* Email */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t("email")}</label>
              <input
                type="email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {/* Register button */}
            <Button className="w-full h-10 text-[13px] mt-2" onClick={handleRegister} disabled={regPhone.length < 4}>
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              {t("register_member")}
            </Button>
          </div>
        )}

        {/* === TOP UP VIEW === */}
        {view === "topup" && currentMember && (
          <div className="px-4 py-4 space-y-3">
            {/* Member info */}
            <div className={cn("flex items-center gap-3 p-3 rounded-lg border", currentTierColors?.border || "border-border", currentTierColors?.bg || "bg-accent/30")}>
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-bold">
                {currentMember.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-foreground">{currentMember.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t("balance")}: <span className="font-semibold text-primary">${currentMember.balance.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {topUpDone ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-status-green/10 flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 text-status-green" />
                </div>
                <div className="text-[14px] font-semibold text-foreground">{t("top_up_success")}</div>
                <div className="text-[12px] text-muted-foreground mt-1">
                  +${topUpAmount} · {t("new_balance")}: ${(currentMember.balance + Number(topUpAmount)).toFixed(2)}
                </div>
                <Button className="w-full h-10 text-[13px] mt-4" onClick={handleClose}>
                  {t("done")}
                </Button>
              </div>
            ) : (
              <>
                {/* Quick amounts */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{t("select_amount")}</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[10, 20, 50, 100, 200, 500].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setTopUpAmount(String(amt))}
                        className={cn(
                          "h-11 rounded-lg text-[14px] font-semibold transition-colors active:scale-95",
                          topUpAmount === String(amt)
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-foreground hover:bg-secondary"
                        )}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Custom amount */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t("custom_amount")}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-semibold text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={topUpAmount}
                      onChange={e => setTopUpAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[16px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                {/* Confirm — goes to PIN */}
                <Button
                  className="w-full h-10 text-[13px]"
                  onClick={() => { setPin(""); setPinError(false); setView("pin"); }}
                  disabled={!topUpAmount || Number(topUpAmount) <= 0}
                >
                  <Wallet className="h-3.5 w-3.5 mr-1.5" />
                  {t("confirm_top_up")} {topUpAmount && Number(topUpAmount) > 0 ? `$${Number(topUpAmount).toFixed(2)}` : ""}
                </Button>
              </>
            )}
          </div>
        )}

        {/* === PIN VIEW === */}
        {view === "pin" && currentMember && (
          <div className="px-4 py-4 space-y-3">
            {/* Amount summary */}
            <div className="text-center">
              <div className="text-[12px] text-muted-foreground">{t("top_up_amount")}</div>
              <div className="text-[24px] font-bold text-foreground font-mono">${Number(topUpAmount).toFixed(2)}</div>
            </div>

            {/* PIN dots */}
            <div className="flex items-center justify-center gap-3 py-2">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className={cn(
                    "w-3.5 h-3.5 rounded-full transition-colors",
                    i < pin.length ? "bg-primary" : "bg-border",
                    pinError && "bg-destructive"
                  )}
                />
              ))}
            </div>
            {pinError && (
              <div className="text-center text-[11px] text-destructive font-medium">{t("wrong_pin")}</div>
            )}

            {/* PIN numpad */}
            <div className="grid grid-cols-3 gap-1.5">
              {["1","2","3","4","5","6","7","8","9"].map(k => (
                <button
                  key={k}
                  onClick={() => {
                    if (pin.length >= 6) return;
                    const newPin = pin + k;
                    setPin(newPin);
                    setPinError(false);
                    if (newPin.length === 6) {
                      // Mock PIN check: accept "000000" or any 6-digit
                      if (newPin === "000000") {
                        setPinError(true);
                        setTimeout(() => setPin(""), 500);
                      } else {
                        handleTopUp(Number(topUpAmount));
                        setView("topup");
                      }
                    }
                  }}
                  className="h-12 rounded-lg bg-accent hover:bg-secondary text-[18px] font-semibold text-foreground transition-colors active:scale-95"
                >
                  {k}
                </button>
              ))}
              <button
                onClick={() => { setPin(""); setPinError(false); }}
                className="h-12 rounded-lg bg-accent hover:bg-secondary text-[11px] font-medium text-muted-foreground transition-colors active:scale-95"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  if (pin.length >= 6) return;
                  const newPin = pin + "0";
                  setPin(newPin);
                  setPinError(false);
                  if (newPin.length === 6) {
                    if (newPin === "000000") {
                      setPinError(true);
                      setTimeout(() => setPin(""), 500);
                    } else {
                      handleTopUp(Number(topUpAmount));
                      setView("topup");
                    }
                  }
                }}
                className="h-12 rounded-lg bg-accent hover:bg-secondary text-[18px] font-semibold text-foreground transition-colors active:scale-95"
              >
                0
              </button>
              <button
                onClick={() => { setPin(prev => prev.slice(0, -1)); setPinError(false); }}
                className="h-12 rounded-lg bg-accent hover:bg-secondary flex items-center justify-center text-muted-foreground transition-colors active:scale-95"
              >
                <Delete className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* === USE BALANCE VIEW === */}
        {view === "usebalance" && currentMember && (
          <div className="px-4 py-4 space-y-3">
            {/* Member balance info */}
            <div className={cn("flex items-center gap-3 p-3 rounded-lg border", currentTierColors?.border || "border-border", currentTierColors?.bg || "bg-accent/30")}>
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-bold">
                {currentMember.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-foreground">{currentMember.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t("available_balance")}: <span className="font-semibold text-primary">${currentMember.balance.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Quick amounts */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{t("select_amount")}</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[5, 10, 20, 50, 100].filter(a => a <= currentMember.balance).map(amt => (
                  <button
                    key={amt}
                    onClick={() => setUseBalanceAmount(String(amt))}
                    className={cn(
                      "h-11 rounded-lg text-[14px] font-semibold transition-colors active:scale-95",
                      useBalanceAmount === String(amt)
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-foreground hover:bg-secondary"
                    )}
                  >
                    ${amt}
                  </button>
                ))}
                {/* Use all */}
                <button
                  onClick={() => setUseBalanceAmount(String(currentMember.balance))}
                  className={cn(
                    "h-11 rounded-lg text-[12px] font-semibold transition-colors active:scale-95",
                    useBalanceAmount === String(currentMember.balance)
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent text-foreground hover:bg-secondary"
                  )}
                >
                  {t("use_all")}
                </button>
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{t("custom_amount")}</label>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-semibold text-muted-foreground">$</span>
                <input
                  type="number"
                  value={useBalanceAmount}
                  onChange={e => {
                    const val = e.target.value;
                    if (Number(val) <= currentMember.balance) setUseBalanceAmount(val);
                  }}
                  placeholder="0.00"
                  min="0"
                  max={currentMember.balance}
                  step="0.01"
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[16px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Apply */}
            <Button
              className="w-full h-10 text-[13px]"
              onClick={() => {
                const amount = Number(useBalanceAmount);
                if (amount > 0 && amount <= currentMember.balance) {
                  deductBalance(currentMember.id, amount);
                  onUseBalance?.(amount);
                  const updated = findCustomerByPhone(currentMember.phone);
                  if (updated) onMemberFound(updated);
                  handleClose();
                }
              }}
              disabled={!useBalanceAmount || Number(useBalanceAmount) <= 0 || Number(useBalanceAmount) > currentMember.balance}
            >
              <Wallet className="h-3.5 w-3.5 mr-1.5" />
              {t("apply_balance")} {useBalanceAmount && Number(useBalanceAmount) > 0 ? `$${Number(useBalanceAmount).toFixed(2)}` : ""}
            </Button>
          </div>
        )}

        {/* === USE POINTS VIEW === */}
        {view === "usepoints" && currentMember && (
          <div className="px-4 py-4 space-y-3">
            {/* Member points info */}
            <div className={cn("flex items-center gap-3 p-3 rounded-lg border", currentTierColors?.border || "border-border", currentTierColors?.bg || "bg-accent/30")}>
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-bold">
                {currentMember.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-foreground">{currentMember.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t("available_points")}: <span className="font-semibold text-amber-600">{currentMember.points} pts</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {POINTS_TO_DOLLAR} pts = $1.00
                </div>
              </div>
            </div>

            {convertDone ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-status-green/10 flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 text-status-green" />
                </div>
                <div className="text-[14px] font-semibold text-foreground">{t("points_converted")}</div>
                <div className="text-[12px] text-muted-foreground mt-1">
                  {convertPoints} pts → ${(Number(convertPoints) / POINTS_TO_DOLLAR).toFixed(2)} {t("added_to_balance")}
                </div>
                <Button className="w-full h-10 text-[13px] mt-4" onClick={() => { setView("usebalance"); setUseBalanceAmount(""); setConvertDone(false); }}>
                  <Wallet className="h-3.5 w-3.5 mr-1.5" />
                  {t("use_balance_now")}
                </Button>
              </div>
            ) : (
              <>
                {/* Quick point amounts */}
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{t("convert_points")}</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[100, 200, 500, 1000].filter(p => p <= currentMember.points).map(pts => (
                      <button
                        key={pts}
                        onClick={() => setConvertPoints(String(pts))}
                        className={cn(
                          "h-11 rounded-lg text-[12px] font-semibold transition-colors active:scale-95 flex flex-col items-center justify-center",
                          convertPoints === String(pts)
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-foreground hover:bg-secondary"
                        )}
                      >
                        <span>{pts} pts</span>
                        <span className="text-[10px] opacity-70">${(pts / POINTS_TO_DOLLAR).toFixed(2)}</span>
                      </button>
                    ))}
                    {/* All points */}
                    <button
                      onClick={() => setConvertPoints(String(currentMember.points))}
                      className={cn(
                        "h-11 rounded-lg text-[12px] font-semibold transition-colors active:scale-95 flex flex-col items-center justify-center",
                        convertPoints === String(currentMember.points)
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-foreground hover:bg-secondary"
                      )}
                    >
                      <span>{t("all")} {currentMember.points}</span>
                      <span className="text-[10px] opacity-70">${(currentMember.points / POINTS_TO_DOLLAR).toFixed(2)}</span>
                    </button>
                  </div>
                </div>

                {convertPoints && Number(convertPoints) > 0 && (
                  <div className="bg-primary/5 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-[12px] text-muted-foreground">{convertPoints} pts</span>
                    <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[14px] font-bold text-primary font-mono">${(Number(convertPoints) / POINTS_TO_DOLLAR).toFixed(2)}</span>
                  </div>
                )}

                {/* Convert button */}
                <Button
                  className="w-full h-10 text-[13px]"
                  onClick={() => {
                    const pts = Number(convertPoints);
                    if (pts > 0 && pts <= currentMember.points) {
                      convertPointsToBalance(currentMember.id, pts);
                      setConvertDone(true);
                      setTimeout(() => {
                        const updated = findCustomerByPhone(currentMember.phone);
                        if (updated) onMemberFound(updated);
                      }, 100);
                    }
                  }}
                  disabled={!convertPoints || Number(convertPoints) <= 0 || Number(convertPoints) > currentMember.points}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                  {t("convert_to_balance")}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

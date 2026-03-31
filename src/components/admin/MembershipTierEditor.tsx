import React, { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X, Crown, Gift, Percent, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useMemberTiers, addTier, updateTier, deleteTier, moveTierUp, moveTierDown,
  TIER_COLORS, type MemberTier
} from "@/state/membership-store";
import { useLanguage } from "@/hooks/useLanguage";

const COLOR_OPTIONS = ["gray", "slate", "amber", "violet", "cyan", "rose", "emerald", "blue", "orange"];

interface TierFormData {
  name: string;
  nameZh: string;
  color: string;
  discountPercent: number;
  pointsMultiplier: number;
  minSpend: string;
  minVisits: string;
  minPoints: string;
  perks: string;
}

const emptyForm: TierFormData = {
  name: "", nameZh: "", color: "gray", discountPercent: 0, pointsMultiplier: 1.0,
  minSpend: "", minVisits: "", minPoints: "", perks: "",
};

const tierToForm = (t: MemberTier): TierFormData => ({
  name: t.name,
  nameZh: t.nameZh || "",
  color: t.color,
  discountPercent: t.discountPercent,
  pointsMultiplier: t.pointsMultiplier,
  minSpend: t.requirements.minSpend?.toString() || "",
  minVisits: t.requirements.minVisits?.toString() || "",
  minPoints: t.requirements.minPoints?.toString() || "",
  perks: t.perks.join("\n"),
});

export const MembershipTierEditor: React.FC = () => {
  const { t } = useLanguage();
  const tiers = useMemberTiers();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<TierFormData>(emptyForm);

  const startEdit = (tier: MemberTier) => {
    setEditingId(tier.id);
    setForm(tierToForm(tier));
    setIsAdding(false);
  };

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setForm(emptyForm);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
  };

  const saveEdit = () => {
    const data = {
      name: form.name.trim(),
      nameZh: form.nameZh.trim() || undefined,
      color: form.color,
      discountPercent: form.discountPercent,
      pointsMultiplier: form.pointsMultiplier,
      requirements: {
        minSpend: form.minSpend ? parseFloat(form.minSpend) : undefined,
        minVisits: form.minVisits ? parseInt(form.minVisits) : undefined,
        minPoints: form.minPoints ? parseInt(form.minPoints) : undefined,
      },
      perks: form.perks.split("\n").map(s => s.trim()).filter(Boolean),
    };
    if (!data.name) return;

    if (isAdding) {
      addTier(data);
      setIsAdding(false);
    } else if (editingId) {
      updateTier(editingId, data);
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (tiers.length <= 1) return;
    if (window.confirm("Delete this tier? Members at this tier will need reassignment.")) {
      deleteTier(id);
      if (editingId === id) setEditingId(null);
    }
  };

  const isEditing = editingId !== null || isAdding;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Membership Tiers</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Configure tier levels, discounts, and perks</p>
        </div>
        {!isEditing && (
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={startAdd}>
            <Plus className="h-3.5 w-3.5" /> Add Tier
          </Button>
        )}
      </div>

      {/* Tier list */}
      <div className="space-y-2">
        {tiers.map((tier, idx) => {
          const colors = TIER_COLORS[tier.color] || TIER_COLORS.gray;
          const isActive = editingId === tier.id;

          return (
            <div key={tier.id} className={cn(
              "rounded-xl border-2 p-4 transition-all",
              isActive ? "border-primary bg-primary/5" : `${colors.border} ${colors.bg}`
            )}>
              {isActive ? (
                /* Edit form inline */
                renderForm()
              ) : (
                /* Display mode */
                <div className="flex items-start gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", colors.bg)}>
                    <Crown className={cn("h-5 w-5", colors.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[14px] font-bold", colors.text)}>{tier.name}</span>
                      {tier.nameZh && <span className="text-[11px] text-muted-foreground">{tier.nameZh}</span>}
                      <span className="text-[10px] text-muted-foreground ml-auto">Level {tier.sortOrder}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Percent className="h-3 w-3" /> {tier.discountPercent}% off</span>
                      <span className="flex items-center gap-0.5"><Zap className="h-3 w-3" /> {tier.pointsMultiplier}x points</span>
                    </div>
                    {(tier.requirements.minSpend || tier.requirements.minVisits || tier.requirements.minPoints) && (
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                        <span>Requires:</span>
                        {tier.requirements.minSpend && <span className="bg-background px-1.5 py-0.5 rounded">${tier.requirements.minSpend} spend</span>}
                        {tier.requirements.minVisits && <span className="bg-background px-1.5 py-0.5 rounded">{tier.requirements.minVisits} visits</span>}
                        {tier.requirements.minPoints && <span className="bg-background px-1.5 py-0.5 rounded">{tier.requirements.minPoints} pts</span>}
                      </div>
                    )}
                    {tier.perks.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tier.perks.map((perk, i) => (
                          <span key={i} className="inline-flex items-center gap-0.5 text-[10px] bg-background px-2 py-0.5 rounded-full text-muted-foreground">
                            <Gift className="h-2.5 w-2.5" /> {perk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveTierUp(tier.id)} disabled={idx === 0}
                      className="p-1 rounded hover:bg-background disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                    <button onClick={() => startEdit(tier)}
                      className="p-1 rounded hover:bg-background"><Pencil className="h-3 w-3" /></button>
                    <button onClick={() => moveTierDown(tier.id)} disabled={idx === tiers.length - 1}
                      className="p-1 rounded hover:bg-background disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                    {tiers.length > 1 && (
                      <button onClick={() => handleDelete(tier.id)}
                        className="p-1 rounded hover:bg-background text-status-red"><Trash2 className="h-3 w-3" /></button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add new tier form */}
        {isAdding && (
          <div className="rounded-xl border-2 border-primary bg-primary/5 p-4">
            {renderForm()}
          </div>
        )}
      </div>
    </div>
  );

  function renderForm() {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground font-medium block mb-1">Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-medium block mb-1">中文名</label>
            <input value={form.nameZh} onChange={e => setForm({ ...form, nameZh: e.target.value })}
              className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary" />
          </div>
        </div>

        {/* Color picker */}
        <div>
          <label className="text-[10px] text-muted-foreground font-medium block mb-1">Color</label>
          <div className="flex gap-1.5">
            {COLOR_OPTIONS.map(c => {
              const tc = TIER_COLORS[c];
              return (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className={cn("w-7 h-7 rounded-md border-2 transition-all", tc?.bg,
                    form.color === c ? "border-primary scale-110" : "border-transparent"
                  )} title={c} />
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground font-medium block mb-1">Discount %</label>
            <input type="number" min={0} max={100} value={form.discountPercent}
              onChange={e => setForm({ ...form, discountPercent: parseFloat(e.target.value) || 0 })}
              className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] font-mono focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-medium block mb-1">Points Multiplier</label>
            <input type="number" min={0.1} max={10} step={0.1} value={form.pointsMultiplier}
              onChange={e => setForm({ ...form, pointsMultiplier: parseFloat(e.target.value) || 1 })}
              className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] font-mono focus:outline-none focus:border-primary" />
          </div>
        </div>

        {/* Requirements */}
        <div>
          <label className="text-[10px] text-muted-foreground font-medium block mb-1">Upgrade Requirements (meet ANY)</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-[9px] text-muted-foreground">Min Spend ($)</span>
              <input type="number" placeholder="—" value={form.minSpend}
                onChange={e => setForm({ ...form, minSpend: e.target.value })}
                className="w-full h-7 px-2 rounded-md bg-background border border-border text-[11px] font-mono focus:outline-none focus:border-primary" />
            </div>
            <div>
              <span className="text-[9px] text-muted-foreground">Min Visits</span>
              <input type="number" placeholder="—" value={form.minVisits}
                onChange={e => setForm({ ...form, minVisits: e.target.value })}
                className="w-full h-7 px-2 rounded-md bg-background border border-border text-[11px] font-mono focus:outline-none focus:border-primary" />
            </div>
            <div>
              <span className="text-[9px] text-muted-foreground">Min Points</span>
              <input type="number" placeholder="—" value={form.minPoints}
                onChange={e => setForm({ ...form, minPoints: e.target.value })}
                className="w-full h-7 px-2 rounded-md bg-background border border-border text-[11px] font-mono focus:outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        {/* Perks */}
        <div>
          <label className="text-[10px] text-muted-foreground font-medium block mb-1">Perks (one per line)</label>
          <textarea value={form.perks} onChange={e => setForm({ ...form, perks: e.target.value })} rows={3}
            placeholder={"Birthday reward\nPriority seating\nFree delivery"}
            className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-[11px] focus:outline-none focus:border-primary resize-none" />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px]" onClick={cancelEdit}>{t("cancel")}</Button>
          <Button size="sm" className="flex-1 h-8 text-[11px]" onClick={saveEdit} disabled={!form.name.trim()}>
            <Check className="h-3 w-3 mr-1" /> Save
          </Button>
        </div>
      </div>
    );
  }
};

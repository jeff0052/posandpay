import React, { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X, Crown, Gift, Percent, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useMemberTiers, addTier, updateTier, deleteTier, moveTierUp, moveTierDown,
  TIER_COLORS, type MemberTier
} from "@/state/membership-store";
import { useLanguage } from "@/hooks/useLanguage";

const COLOR_OPTIONS = Object.keys(TIER_COLORS);

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
  name: "", nameZh: "", color: "stone", discountPercent: 0, pointsMultiplier: 1.0,
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

  const startEdit = (tier: MemberTier) => { setEditingId(tier.id); setForm(tierToForm(tier)); setIsAdding(false); };
  const startAdd = () => { setIsAdding(true); setEditingId(null); setForm(emptyForm); };
  const cancelEdit = () => { setEditingId(null); setIsAdding(false); };

  const saveEdit = () => {
    const data = {
      name: form.name.trim(), nameZh: form.nameZh.trim() || undefined, color: form.color,
      discountPercent: form.discountPercent, pointsMultiplier: form.pointsMultiplier,
      requirements: {
        minSpend: form.minSpend ? parseFloat(form.minSpend) : undefined,
        minVisits: form.minVisits ? parseInt(form.minVisits) : undefined,
        minPoints: form.minPoints ? parseInt(form.minPoints) : undefined,
      },
      perks: form.perks.split("\n").map(s => s.trim()).filter(Boolean),
    };
    if (!data.name) return;
    if (isAdding) { addTier(data); setIsAdding(false); }
    else if (editingId) { updateTier(editingId, data); setEditingId(null); }
  };

  const handleDelete = (id: string) => {
    if (tiers.length <= 1) return;
    if (window.confirm("Delete this tier?")) { deleteTier(id); if (editingId === id) setEditingId(null); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Membership Tiers</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{tiers.length} levels configured</p>
        </div>
        {!isAdding && !editingId && (
          <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1" onClick={startAdd}>
            <Plus className="h-3 w-3" /> Add Tier
          </Button>
        )}
      </div>

      {/* Compact tier table */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_2fr_2fr_auto] gap-0 bg-accent/50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>Tier</span>
          <span className="text-center">Discount</span>
          <span className="text-center">Points</span>
          <span>Requirements</span>
          <span>Perks</span>
          <span className="w-16" />
        </div>

        {/* Rows */}
        {tiers.map((tier, idx) => {
          const colors = TIER_COLORS[tier.color] || TIER_COLORS.stone;
          const isActive = editingId === tier.id;
          const hasReqs = tier.requirements.minSpend || tier.requirements.minVisits || tier.requirements.minPoints;

          if (isActive) {
            return (
              <div key={tier.id} className="border-t border-border bg-primary/[0.03] p-3">
                {renderForm()}
              </div>
            );
          }

          return (
            <div key={tier.id} className={cn(
              "grid grid-cols-[2fr_1fr_1fr_2fr_2fr_auto] gap-0 items-center px-3 py-2.5 border-t border-border transition-colors hover:bg-accent/30 group",
            )}>
              {/* Tier name + color dot */}
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full shrink-0", colors.dot)} />
                <span className="text-[13px] font-semibold text-foreground">{tier.name}</span>
                {tier.nameZh && <span className="text-[10px] text-muted-foreground">{tier.nameZh}</span>}
              </div>

              {/* Discount */}
              <div className="text-center">
                <span className={cn("text-[12px] font-bold font-mono", tier.discountPercent > 0 ? "text-foreground" : "text-muted-foreground/40")}>
                  {tier.discountPercent > 0 ? `${tier.discountPercent}%` : "—"}
                </span>
              </div>

              {/* Points multiplier */}
              <div className="text-center">
                <span className="text-[12px] font-mono text-muted-foreground">{tier.pointsMultiplier}x</span>
              </div>

              {/* Requirements — prominent */}
              <div className="flex items-center gap-1 flex-wrap">
                {hasReqs ? (
                  <>
                    {tier.requirements.minSpend && (
                      <span className="inline-flex items-center text-[10px] font-semibold text-foreground bg-accent px-1.5 py-0.5 rounded">
                        ${tier.requirements.minSpend}
                      </span>
                    )}
                    {tier.requirements.minVisits && (
                      <span className="inline-flex items-center text-[10px] font-semibold text-foreground bg-accent px-1.5 py-0.5 rounded">
                        {tier.requirements.minVisits} visits
                      </span>
                    )}
                    {tier.requirements.minPoints && (
                      <span className="inline-flex items-center text-[10px] font-semibold text-foreground bg-accent px-1.5 py-0.5 rounded">
                        {tier.requirements.minPoints} pts
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-muted-foreground/40">Base tier</span>
                )}
              </div>

              {/* Perks */}
              <div className="flex items-center gap-1 flex-wrap">
                {tier.perks.slice(0, 2).map((perk, i) => (
                  <span key={i} className="text-[10px] text-muted-foreground truncate max-w-[120px]">{perk}</span>
                ))}
                {tier.perks.length > 2 && <span className="text-[10px] text-muted-foreground/50">+{tier.perks.length - 2}</span>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 w-16 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => moveTierUp(tier.id)} disabled={idx === 0}
                  className="p-1 rounded hover:bg-accent disabled:opacity-20"><ChevronUp className="h-3 w-3 text-muted-foreground" /></button>
                <button onClick={() => moveTierDown(tier.id)} disabled={idx === tiers.length - 1}
                  className="p-1 rounded hover:bg-accent disabled:opacity-20"><ChevronDown className="h-3 w-3 text-muted-foreground" /></button>
                <button onClick={() => startEdit(tier)}
                  className="p-1 rounded hover:bg-accent"><Pencil className="h-3 w-3 text-muted-foreground" /></button>
                {tiers.length > 1 && (
                  <button onClick={() => handleDelete(tier.id)}
                    className="p-1 rounded hover:bg-accent"><Trash2 className="h-3 w-3 text-muted-foreground/50 hover:text-status-red" /></button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add form at bottom */}
        {isAdding && (
          <div className="border-t border-border bg-primary/[0.03] p-3">
            {renderForm()}
          </div>
        )}
      </div>
    </div>
  );

  function renderForm() {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full h-7 px-2 rounded-md bg-background border border-border text-[11px] focus:outline-none focus:border-primary" autoFocus />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">中文名</label>
            <input value={form.nameZh} onChange={e => setForm({ ...form, nameZh: e.target.value })}
              className="w-full h-7 px-2 rounded-md bg-background border border-border text-[11px] focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Discount %</label>
            <input type="number" min={0} max={100} value={form.discountPercent}
              onChange={e => setForm({ ...form, discountPercent: parseFloat(e.target.value) || 0 })}
              className="w-full h-7 px-2 rounded-md bg-background border border-border text-[11px] font-mono focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Points x</label>
            <input type="number" min={0.1} max={10} step={0.1} value={form.pointsMultiplier}
              onChange={e => setForm({ ...form, pointsMultiplier: parseFloat(e.target.value) || 1 })}
              className="w-full h-7 px-2 rounded-md bg-background border border-border text-[11px] font-mono focus:outline-none focus:border-primary" />
          </div>
        </div>

        {/* Color + Requirements in one row */}
        <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
          <div>
            <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Color</label>
            <div className="flex gap-1">
              {COLOR_OPTIONS.map(c => {
                const tc = TIER_COLORS[c];
                return (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    className={cn("w-5 h-5 rounded-full transition-all",
                      tc?.dot,
                      form.color === c ? "ring-2 ring-primary ring-offset-1 scale-110" : "opacity-50 hover:opacity-80"
                    )} title={c} />
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Requirements (meet ANY)</label>
            <div className="grid grid-cols-3 gap-1.5">
              <input type="number" placeholder="$ spend" value={form.minSpend}
                onChange={e => setForm({ ...form, minSpend: e.target.value })}
                className="h-7 px-2 rounded-md bg-background border border-border text-[10px] font-mono focus:outline-none focus:border-primary placeholder:text-muted-foreground/40" />
              <input type="number" placeholder="visits" value={form.minVisits}
                onChange={e => setForm({ ...form, minVisits: e.target.value })}
                className="h-7 px-2 rounded-md bg-background border border-border text-[10px] font-mono focus:outline-none focus:border-primary placeholder:text-muted-foreground/40" />
              <input type="number" placeholder="points" value={form.minPoints}
                onChange={e => setForm({ ...form, minPoints: e.target.value })}
                className="h-7 px-2 rounded-md bg-background border border-border text-[10px] font-mono focus:outline-none focus:border-primary placeholder:text-muted-foreground/40" />
            </div>
          </div>
        </div>

        {/* Perks + actions */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Perks (one per line)</label>
            <textarea value={form.perks} onChange={e => setForm({ ...form, perks: e.target.value })} rows={2}
              placeholder={"Birthday reward\nPriority seating"}
              className="w-full px-2 py-1 rounded-md bg-background border border-border text-[10px] focus:outline-none focus:border-primary resize-none" />
          </div>
          <div className="flex gap-1 shrink-0 pb-0.5">
            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={cancelEdit}>{t("cancel")}</Button>
            <Button size="sm" className="h-7 text-[10px] px-3" onClick={saveEdit} disabled={!form.name.trim()}>
              <Check className="h-3 w-3 mr-0.5" /> Save
            </Button>
          </div>
        </div>
      </div>
    );
  }
};

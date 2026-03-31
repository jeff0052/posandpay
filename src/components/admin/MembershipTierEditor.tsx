import React, { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X, Crown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useMemberTiers, addTier, updateTier, deleteTier, moveTierUp, moveTierDown,
  TIER_COLORS, type MemberTier
} from "@/state/membership-store";
import { useLanguage } from "@/hooks/useLanguage";

const COLOR_OPTIONS = Object.keys(TIER_COLORS);

interface TierFormData {
  name: string; nameZh: string; color: string; discountPercent: number; pointsMultiplier: number;
  minSpend: string; minVisits: string; minPoints: string; perks: string;
}
const emptyForm: TierFormData = { name: "", nameZh: "", color: "stone", discountPercent: 0, pointsMultiplier: 1.0, minSpend: "", minVisits: "", minPoints: "", perks: "" };
const tierToForm = (t: MemberTier): TierFormData => ({
  name: t.name, nameZh: t.nameZh || "", color: t.color, discountPercent: t.discountPercent, pointsMultiplier: t.pointsMultiplier,
  minSpend: t.requirements.minSpend?.toString() || "", minVisits: t.requirements.minVisits?.toString() || "", minPoints: t.requirements.minPoints?.toString() || "", perks: t.perks.join("\n"),
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
      requirements: { minSpend: form.minSpend ? parseFloat(form.minSpend) : undefined, minVisits: form.minVisits ? parseInt(form.minVisits) : undefined, minPoints: form.minPoints ? parseInt(form.minPoints) : undefined },
      perks: form.perks.split("\n").map(s => s.trim()).filter(Boolean),
    };
    if (!data.name) return;
    if (isAdding) { addTier(data); setIsAdding(false); } else if (editingId) { updateTier(editingId, data); setEditingId(null); }
  };
  const handleDelete = (id: string) => { if (tiers.length > 1 && window.confirm("Delete this tier?")) { deleteTier(id); if (editingId === id) setEditingId(null); } };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Membership Tiers</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{tiers.length} levels configured</p>
        </div>
        {!isAdding && !editingId && (
          <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1" onClick={startAdd}><Plus className="h-3.5 w-3.5" /> Add Tier</Button>
        )}
      </div>

      <div className="uniweb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="w-10" />
                <th>Tier</th>
                <th className="text-center">Discount</th>
                <th className="text-center">Points</th>
                <th>Requirements</th>
                <th>Perks</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, idx) => {
                const colors = TIER_COLORS[tier.color] || TIER_COLORS.stone;
                const isActive = editingId === tier.id;
                const hasReqs = tier.requirements.minSpend || tier.requirements.minVisits || tier.requirements.minPoints;

                return (
                  <React.Fragment key={tier.id}>
                    <tr className={cn("table-row border-b border-border transition-colors group", isActive ? "bg-primary/[0.03]" : "hover:bg-accent/30")}>
                      <td className="px-4 py-3.5">
                        <span className={cn("w-3 h-3 rounded-full inline-block", colors.dot)} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-[13px] font-semibold text-foreground">{tier.name}</div>
                        {tier.nameZh && <div className="text-[11px] text-muted-foreground mt-0.5">{tier.nameZh}</div>}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={cn("text-[14px] font-bold font-mono", tier.discountPercent > 0 ? "text-foreground" : "text-muted-foreground/30")}>
                          {tier.discountPercent > 0 ? `${tier.discountPercent}%` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-[13px] font-mono text-muted-foreground">{tier.pointsMultiplier}x</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {hasReqs ? (
                          <div className="flex items-center gap-1 flex-wrap">
                            {tier.requirements.minSpend && <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold bg-status-amber-light text-status-amber">${tier.requirements.minSpend}</span>}
                            {tier.requirements.minVisits && <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold bg-status-blue-light text-primary">{tier.requirements.minVisits} visits</span>}
                            {tier.requirements.minPoints && <span className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold bg-status-green-light text-status-green">{tier.requirements.minPoints} pts</span>}
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/40">Base tier</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {tier.perks.slice(0, 2).map((p, i) => (
                            <span key={i} className="inline-flex rounded-full px-2 py-0.5 text-[10px] bg-accent text-muted-foreground max-w-[100px] truncate">{p}</span>
                          ))}
                          {tier.perks.length > 2 && <span className="text-[10px] text-muted-foreground/50">+{tier.perks.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => moveTierUp(tier.id)} disabled={idx === 0} className="p-1 rounded hover:bg-accent disabled:opacity-20"><ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /></button>
                          <button onClick={() => moveTierDown(tier.id)} disabled={idx === tiers.length - 1} className="p-1 rounded hover:bg-accent disabled:opacity-20"><ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></button>
                          <button onClick={() => startEdit(tier)} className="p-1 rounded hover:bg-accent"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                          {tiers.length > 1 && <button onClick={() => handleDelete(tier.id)} className="p-1 rounded hover:bg-accent"><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-status-red" /></button>}
                        </div>
                      </td>
                    </tr>

                    {/* Edit form row */}
                    {isActive && (
                      <tr><td colSpan={7} className="bg-accent/20 px-6 py-4">
                        <div className="space-y-3 max-w-2xl">
                          <div className="grid grid-cols-4 gap-3">
                            <div><label className="text-[10px] text-muted-foreground font-medium block mb-1">Name *</label>
                              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary" /></div>
                            <div><label className="text-[10px] text-muted-foreground font-medium block mb-1">中文名</label>
                              <input value={form.nameZh} onChange={e => setForm({ ...form, nameZh: e.target.value })} className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary" /></div>
                            <div><label className="text-[10px] text-muted-foreground font-medium block mb-1">Discount %</label>
                              <input type="number" min={0} max={100} value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: parseFloat(e.target.value) || 0 })} className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] font-mono focus:outline-none focus:border-primary" /></div>
                            <div><label className="text-[10px] text-muted-foreground font-medium block mb-1">Points x</label>
                              <input type="number" min={0.1} max={10} step={0.1} value={form.pointsMultiplier} onChange={e => setForm({ ...form, pointsMultiplier: parseFloat(e.target.value) || 1 })} className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] font-mono focus:outline-none focus:border-primary" /></div>
                          </div>
                          <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
                            <div><label className="text-[10px] text-muted-foreground font-medium block mb-1">Color</label>
                              <div className="flex gap-1">{COLOR_OPTIONS.map(c => { const tc = TIER_COLORS[c]; return (<button key={c} onClick={() => setForm({ ...form, color: c })} className={cn("w-5 h-5 rounded-full transition-all", tc?.dot, form.color === c ? "ring-2 ring-primary ring-offset-1 scale-110" : "opacity-40 hover:opacity-70")} title={c} />); })}</div></div>
                            <div><label className="text-[10px] text-muted-foreground font-medium block mb-1">Requirements (meet ANY)</label>
                              <div className="grid grid-cols-3 gap-1.5">
                                <input type="number" placeholder="$ spend" value={form.minSpend} onChange={e => setForm({ ...form, minSpend: e.target.value })} className="h-8 px-2 rounded-md bg-background border border-border text-[11px] font-mono focus:outline-none focus:border-primary placeholder:text-muted-foreground/40" />
                                <input type="number" placeholder="visits" value={form.minVisits} onChange={e => setForm({ ...form, minVisits: e.target.value })} className="h-8 px-2 rounded-md bg-background border border-border text-[11px] font-mono focus:outline-none focus:border-primary placeholder:text-muted-foreground/40" />
                                <input type="number" placeholder="points" value={form.minPoints} onChange={e => setForm({ ...form, minPoints: e.target.value })} className="h-8 px-2 rounded-md bg-background border border-border text-[11px] font-mono focus:outline-none focus:border-primary placeholder:text-muted-foreground/40" />
                              </div></div>
                          </div>
                          <div className="flex gap-3 items-end">
                            <div className="flex-1"><label className="text-[10px] text-muted-foreground font-medium block mb-1">Perks (one per line)</label>
                              <textarea value={form.perks} onChange={e => setForm({ ...form, perks: e.target.value })} rows={2} placeholder={"Birthday reward\nPriority seating"} className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-[11px] focus:outline-none focus:border-primary resize-none" /></div>
                            <div className="flex gap-1.5 pb-0.5">
                              <Button variant="outline" size="sm" className="h-8 text-[11px] px-3" onClick={cancelEdit}>{t("cancel")}</Button>
                              <Button size="sm" className="h-8 text-[11px] px-4" onClick={saveEdit} disabled={!form.name.trim()}><Check className="h-3 w-3 mr-1" /> Save</Button>
                            </div>
                          </div>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Add new tier form */}
              {isAdding && (
                <tr><td colSpan={7} className="bg-accent/20 px-6 py-4">
                  <div className="space-y-3 max-w-2xl">
                    <div className="grid grid-cols-4 gap-3">
                      <div><label className="text-[10px] text-muted-foreground font-medium block mb-1">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary" /></div>
                      <div><label className="text-[10px] text-muted-foreground font-medium block mb-1">中文名</label><input value={form.nameZh} onChange={e => setForm({ ...form, nameZh: e.target.value })} className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary" /></div>
                      <div><label className="text-[10px] text-muted-foreground font-medium block mb-1">Discount %</label><input type="number" min={0} max={100} value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: parseFloat(e.target.value) || 0 })} className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] font-mono focus:outline-none focus:border-primary" /></div>
                      <div><label className="text-[10px] text-muted-foreground font-medium block mb-1">Points x</label><input type="number" min={0.1} max={10} step={0.1} value={form.pointsMultiplier} onChange={e => setForm({ ...form, pointsMultiplier: parseFloat(e.target.value) || 1 })} className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] font-mono focus:outline-none focus:border-primary" /></div>
                    </div>
                    <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
                      <div><label className="text-[10px] text-muted-foreground font-medium block mb-1">Color</label><div className="flex gap-1">{COLOR_OPTIONS.map(c => { const tc = TIER_COLORS[c]; return (<button key={c} onClick={() => setForm({ ...form, color: c })} className={cn("w-5 h-5 rounded-full transition-all", tc?.dot, form.color === c ? "ring-2 ring-primary ring-offset-1 scale-110" : "opacity-40 hover:opacity-70")} title={c} />); })}</div></div>
                      <div><label className="text-[10px] text-muted-foreground font-medium block mb-1">Requirements</label><div className="grid grid-cols-3 gap-1.5">
                        <input type="number" placeholder="$ spend" value={form.minSpend} onChange={e => setForm({ ...form, minSpend: e.target.value })} className="h-8 px-2 rounded-md bg-background border border-border text-[11px] font-mono focus:outline-none focus:border-primary placeholder:text-muted-foreground/40" />
                        <input type="number" placeholder="visits" value={form.minVisits} onChange={e => setForm({ ...form, minVisits: e.target.value })} className="h-8 px-2 rounded-md bg-background border border-border text-[11px] font-mono focus:outline-none focus:border-primary placeholder:text-muted-foreground/40" />
                        <input type="number" placeholder="points" value={form.minPoints} onChange={e => setForm({ ...form, minPoints: e.target.value })} className="h-8 px-2 rounded-md bg-background border border-border text-[11px] font-mono focus:outline-none focus:border-primary placeholder:text-muted-foreground/40" />
                      </div></div>
                    </div>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1"><label className="text-[10px] text-muted-foreground font-medium block mb-1">Perks</label><textarea value={form.perks} onChange={e => setForm({ ...form, perks: e.target.value })} rows={2} placeholder={"Birthday reward\nPriority seating"} className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-[11px] focus:outline-none focus:border-primary resize-none" /></div>
                      <div className="flex gap-1.5 pb-0.5">
                        <Button variant="outline" size="sm" className="h-8 text-[11px] px-3" onClick={cancelEdit}>{t("cancel")}</Button>
                        <Button size="sm" className="h-8 text-[11px] px-4" onClick={saveEdit} disabled={!form.name.trim()}><Check className="h-3 w-3 mr-1" /> Save</Button>
                      </div>
                    </div>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

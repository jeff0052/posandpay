import React, { useState } from "react";
import { X, Minus, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { type MenuItem, modifierGroups as allModGroups } from "@/data/mock-data";
import { useMenuItems } from "@/state/menu-store";
import { useLanguage } from "@/hooks/useLanguage";

interface Props {
  item: MenuItem;
  onAdd: (modifiers: { name: string; price: number }[], notes?: string, comboItems?: { name: string; groupName: string }[]) => void;
  onClose: () => void;
}

export const KioskItemDetail: React.FC<Props> = ({ item, onAdd, onClose }) => {
  const { lang } = useLanguage();
  const menuItems = useMenuItems();
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [comboSelections, setComboSelections] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState(1);

  const groups = allModGroups.filter(g => item.modifierGroups?.includes(g.id));
  const getName = (n: string, nZh?: string) => lang === "zh" && nZh ? nZh : n;

  const toggleOption = (gId: string, oId: string, multi: boolean) => {
    setSelected(prev => {
      const cur = prev[gId] || [];
      if (multi) return { ...prev, [gId]: cur.includes(oId) ? cur.filter(x => x !== oId) : [...cur, oId] };
      return { ...prev, [gId]: cur.includes(oId) ? [] : [oId] };
    });
  };

  const toggleComboItem = (groupId: string, itemId: string, maxSelect: number) => {
    setComboSelections(prev => {
      const cur = prev[groupId] || [];
      if (cur.includes(itemId)) return { ...prev, [groupId]: cur.filter(x => x !== itemId) };
      if (cur.length >= maxSelect) return { ...prev, [groupId]: [...cur.slice(1), itemId] };
      return { ...prev, [groupId]: [...cur, itemId] };
    });
  };

  const modifierValid = groups.filter(g => g.required).every(g => (selected[g.id] || []).length > 0);
  const comboValid = !item.comboGroups || item.comboGroups.filter(g => g.required).every(g => (comboSelections[g.id] || []).length === g.maxSelect);
  const canAdd = modifierValid && comboValid;

  const handleAdd = () => {
    const mods = groups.flatMap(g => (selected[g.id] || []).map(oId => {
      const opt = g.options.find(o => o.id === oId);
      return opt ? { name: opt.name, price: opt.price } : null;
    }).filter(Boolean)) as { name: string; price: number }[];
    const combos = item.comboGroups?.flatMap(g => (comboSelections[g.id] || []).map(itemId => {
      const mi = menuItems.find(m => m.id === itemId);
      return mi ? { name: mi.name, groupName: g.name } : null;
    }).filter(Boolean)) as { name: string; groupName: string }[] | undefined;
    for (let i = 0; i < qty; i++) onAdd(mods, notes || undefined, combos);
    onClose();
  };

  const modifierTotal = groups.flatMap(g => (selected[g.id] || []).map(oId => g.options.find(o => o.id === oId)?.price || 0)).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="glass w-full max-w-lg rounded-2xl border border-border shadow-elevated max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">{getName(item.name, item.nameZh)}</h2>
            <p className="text-lg font-semibold text-primary font-mono">${(item.price + modifierTotal).toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto pos-scrollbar p-5 space-y-5">
          {/* Combo groups */}
          {item.comboGroups?.map(g => (
            <div key={g.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-foreground">{getName(g.name, g.nameZh)}</span>
                <span className="text-xs text-muted-foreground">({lang === "zh" ? `选 ${g.maxSelect}` : `Pick ${g.maxSelect}`})</span>
                {g.required && <span className="text-[10px] font-bold text-destructive uppercase">{lang === "zh" ? "必选" : "Required"}</span>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {g.allowedItems.map(aiId => {
                  const mi = menuItems.find(m => m.id === aiId);
                  if (!mi) return null;
                  const isSel = (comboSelections[g.id] || []).includes(aiId);
                  return (
                    <button key={aiId} onClick={() => toggleComboItem(g.id, aiId, g.maxSelect)}
                      className={cn("p-3 rounded-lg border-1.5 text-left text-sm transition-all", isSel ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                      <span className="font-medium text-foreground">{getName(mi.name, mi.nameZh)}</span>
                      {isSel && <Check className="inline h-3.5 w-3.5 text-primary ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Modifier groups */}
          {groups.map(g => (
            <div key={g.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-foreground">{getName(g.name, g.nameZh)}</span>
                {g.required && <span className="text-[10px] font-bold text-destructive uppercase">{lang === "zh" ? "必选" : "Required"}</span>}
              </div>
              <div className="space-y-1.5">
                {g.options.map(o => {
                  const isSel = (selected[g.id] || []).includes(o.id);
                  return (
                    <button key={o.id} onClick={() => toggleOption(g.id, o.id, g.multiSelect)}
                      className={cn("w-full flex items-center justify-between p-3 rounded-lg border-1.5 text-sm transition-all", isSel ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                      <span className="font-medium text-foreground">{getName(o.name, o.nameZh)}</span>
                      <div className="flex items-center gap-2">
                        {o.price > 0 && <span className="text-xs text-muted-foreground font-mono">+${o.price.toFixed(2)}</span>}
                        {isSel && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Notes */}
          <div>
            <span className="text-sm font-semibold text-foreground mb-2 block">{lang === "zh" ? "备注" : "Special Notes"}</span>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full rounded-lg border-1.5 border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
              placeholder={lang === "zh" ? "例：不要辣椒..." : "e.g. No chilli..."} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex items-center gap-4">
          <div className="flex items-center gap-3 bg-accent rounded-lg p-1">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-card transition-colors">
              <Minus className="h-4 w-4 text-foreground" />
            </button>
            <span className="text-lg font-bold text-foreground w-8 text-center">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-card transition-colors">
              <Plus className="h-4 w-4 text-foreground" />
            </button>
          </div>
          <button
            disabled={!canAdd}
            onClick={handleAdd}
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {lang === "zh" ? "加入购物车" : "Add to Cart"} · ${((item.price + modifierTotal) * qty).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};

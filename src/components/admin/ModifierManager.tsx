import React, { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type ModifierGroup, type ModifierOption, modifierGroups } from "@/data/mock-data";
import { useLanguage } from "@/hooks/useLanguage";

// Local state wrapping the mock data (since modifier groups aren't in a store yet)
let _groups = [...modifierGroups];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

function useModifierGroups() {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const l = () => setTick(t => t + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return _groups;
}

function addGroup(name: string, nameZh?: string) {
  _groups = [..._groups, { id: `mg-${Date.now()}`, name, nameZh, required: false, multiSelect: true, options: [] }];
  emit();
}

function updateGroup(id: string, updates: Partial<ModifierGroup>) {
  _groups = _groups.map(g => g.id === id ? { ...g, ...updates } : g);
  emit();
}

function deleteGroup(id: string) {
  _groups = _groups.filter(g => g.id !== id);
  emit();
}

function addOption(groupId: string, name: string, nameZh: string, price: number) {
  _groups = _groups.map(g => g.id === groupId ? {
    ...g,
    options: [...g.options, { id: `mo-${Date.now()}`, name, nameZh: nameZh || undefined, price }]
  } : g);
  emit();
}

function deleteOption(groupId: string, optionId: string) {
  _groups = _groups.map(g => g.id === groupId ? {
    ...g,
    options: g.options.filter(o => o.id !== optionId)
  } : g);
  emit();
}

export const ModifierManager: React.FC = () => {
  const { t } = useLanguage();
  const groups = useModifierGroups();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupNameZh, setNewGroupNameZh] = useState("");
  const [addingOptionTo, setAddingOptionTo] = useState<string | null>(null);
  const [newOptName, setNewOptName] = useState("");
  const [newOptNameZh, setNewOptNameZh] = useState("");
  const [newOptPrice, setNewOptPrice] = useState("0");

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim(), newGroupNameZh.trim() || undefined);
      setNewGroupName("");
      setNewGroupNameZh("");
      setShowAddGroup(false);
    }
  };

  const handleAddOption = (groupId: string) => {
    if (newOptName.trim()) {
      addOption(groupId, newOptName.trim(), newOptNameZh.trim(), parseFloat(newOptPrice) || 0);
      setNewOptName("");
      setNewOptNameZh("");
      setNewOptPrice("0");
      setAddingOptionTo(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{t("modifierGroups")}</span>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setShowAddGroup(true)}>
          <Plus className="h-3.5 w-3.5" /> {t("addModifierGroup")}
        </Button>
      </div>

      {showAddGroup && (
        <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
          <input placeholder="Group Name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
            className="flex-1 h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary" autoFocus />
          <input placeholder="中文名" value={newGroupNameZh} onChange={e => setNewGroupNameZh(e.target.value)}
            className="w-24 h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary" />
          <Button size="sm" className="h-8 px-2" onClick={handleAddGroup}><Check className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowAddGroup(false)}><X className="h-3.5 w-3.5" /></Button>
        </div>
      )}

      <div className="space-y-2">
        {groups.map(group => {
          const isExpanded = expandedId === group.id;
          return (
            <div key={group.id} className="uniweb-card p-0 overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : group.id)}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-accent/50 transition-colors text-left"
              >
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="text-[13px] font-medium text-foreground flex-1">{group.name}</span>
                {group.nameZh && <span className="text-[11px] text-muted-foreground mr-2">{group.nameZh}</span>}
                <span className="text-[10px] text-muted-foreground">{group.options.length} options</span>
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium", group.required ? "bg-status-amber-light text-status-amber" : "bg-accent text-muted-foreground")}>
                  {group.required ? "Required" : "Optional"}
                </span>
              </button>

              {isExpanded && (
                <div className="border-t border-border px-4 py-3 space-y-2">
                  <div className="flex gap-2 mb-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <input type="checkbox" checked={group.required} onChange={e => updateGroup(group.id, { required: e.target.checked })} className="rounded" />
                      Required
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <input type="checkbox" checked={group.multiSelect} onChange={e => updateGroup(group.id, { multiSelect: e.target.checked })} className="rounded" />
                      Multi-select
                    </label>
                    <div className="flex-1" />
                    <button onClick={() => { if (window.confirm("Delete this modifier group?")) deleteGroup(group.id); }}
                      className="text-[11px] text-status-red hover:underline">{t("deleteModifierGroup")}</button>
                  </div>

                  {group.options.map(opt => (
                    <div key={opt.id} className="flex items-center gap-2 text-[12px] px-2 py-1.5 rounded hover:bg-accent/50 group">
                      <span className="flex-1 text-foreground">{opt.name}</span>
                      {opt.nameZh && <span className="text-muted-foreground">{opt.nameZh}</span>}
                      <span className="text-muted-foreground font-mono">{opt.price > 0 ? `+$${opt.price.toFixed(2)}` : "Free"}</span>
                      <button onClick={() => deleteOption(group.id, opt.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent text-status-red"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}

                  {addingOptionTo === group.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input placeholder={t("optionName")} value={newOptName} onChange={e => setNewOptName(e.target.value)}
                        className="flex-1 h-7 px-2 rounded-md bg-background border border-border text-[11px] focus:outline-none focus:border-primary" autoFocus />
                      <input placeholder="中文" value={newOptNameZh} onChange={e => setNewOptNameZh(e.target.value)}
                        className="w-16 h-7 px-2 rounded-md bg-background border border-border text-[11px] focus:outline-none focus:border-primary" />
                      <input placeholder="$0" value={newOptPrice} onChange={e => setNewOptPrice(e.target.value)} type="number" step="0.5"
                        className="w-16 h-7 px-2 rounded-md bg-background border border-border text-[11px] focus:outline-none focus:border-primary" />
                      <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={() => handleAddOption(group.id)}><Check className="h-3 w-3 text-status-green" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={() => setAddingOptionTo(null)}><X className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <button onClick={() => setAddingOptionTo(group.id)}
                      className="flex items-center gap-1 text-[11px] text-primary hover:underline mt-1">
                      <Plus className="h-3 w-3" /> {t("addOption")}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

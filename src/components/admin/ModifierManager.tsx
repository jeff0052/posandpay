import React, { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type ModifierGroup, type ModifierOption, modifierGroups } from "@/data/mock-data";
import { useLanguage } from "@/hooks/useLanguage";

// Local reactive state wrapping mock data
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
  _groups = [..._groups, { id: `mg-${Date.now()}`, name, nameZh, required: false, multiSelect: true, options: [] }]; emit();
}
function deleteGroup(id: string) { _groups = _groups.filter(g => g.id !== id); emit(); }
function updateGroup(id: string, updates: Partial<ModifierGroup>) { _groups = _groups.map(g => g.id === id ? { ...g, ...updates } : g); emit(); }
function addOption(gid: string, name: string, nameZh: string, price: number) {
  _groups = _groups.map(g => g.id === gid ? { ...g, options: [...g.options, { id: `mo-${Date.now()}`, name, nameZh: nameZh || undefined, price }] } : g); emit();
}
function deleteOption(gid: string, oid: string) {
  _groups = _groups.map(g => g.id === gid ? { ...g, options: g.options.filter(o => o.id !== oid) } : g); emit();
}

export const ModifierManager: React.FC = () => {
  const { t } = useLanguage();
  const groups = useModifierGroups();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNameZh, setNewNameZh] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [optName, setOptName] = useState("");
  const [optNameZh, setOptNameZh] = useState("");
  const [optPrice, setOptPrice] = useState("0");

  const handleAddGroup = () => {
    if (newName.trim()) { addGroup(newName.trim(), newNameZh.trim() || undefined); setNewName(""); setNewNameZh(""); setShowAdd(false); }
  };
  const handleAddOption = (gid: string) => {
    if (optName.trim()) { addOption(gid, optName.trim(), optNameZh.trim(), parseFloat(optPrice) || 0); setOptName(""); setOptNameZh(""); setOptPrice("0"); setAddingTo(null); }
  };

  return (
    <div>
      {showAdd && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-card border border-border rounded-xl">
          <Settings2 className="h-4 w-4 text-primary shrink-0" />
          <input placeholder="Group name" value={newName} onChange={e => setNewName(e.target.value)} autoFocus
            className="flex-1 h-9 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:border-primary" />
          <input placeholder="中文名" value={newNameZh} onChange={e => setNewNameZh(e.target.value)}
            className="w-32 h-9 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:border-primary" />
          <Button size="sm" className="h-9 px-4 text-[12px] gap-1" onClick={handleAddGroup} disabled={!newName.trim()}>
            <Check className="h-3.5 w-3.5" /> Add
          </Button>
          <Button size="sm" variant="outline" className="h-9 px-3" onClick={() => setShowAdd(false)}><X className="h-3.5 w-3.5" /></Button>
        </div>
      )}

      <div className="uniweb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="w-8" />
                <th>Group</th>
                <th>Options</th>
                <th>Type</th>
                <th className="w-24">
                  <div className="flex justify-end">
                    {!showAdd && (
                      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => setShowAdd(true)}>
                        <Plus className="h-3 w-3" /> Add
                      </Button>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map(group => {
                const isExpanded = expandedId === group.id;
                return (
                  <React.Fragment key={group.id}>
                    <tr className="table-row border-b border-border hover:bg-accent/30 transition-colors cursor-pointer group"
                      onClick={() => setExpandedId(isExpanded ? null : group.id)}>
                      <td className="px-4 py-3.5">
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-[13px] font-semibold text-foreground">{group.name}</div>
                        {group.nameZh && <div className="text-[11px] text-muted-foreground mt-0.5">{group.nameZh}</div>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[13px] text-muted-foreground">{group.options.length} options</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold",
                            group.required ? "bg-status-amber-light text-status-amber" : "bg-accent text-muted-foreground"
                          )}>{group.required ? "Required" : "Optional"}</span>
                          <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold",
                            group.multiSelect ? "bg-status-blue-light text-primary" : "bg-accent text-muted-foreground"
                          )}>{group.multiSelect ? "Multi" : "Single"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); updateGroup(group.id, { required: !group.required }); }}
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground text-[9px] font-medium">
                            {group.required ? "Optional" : "Required"}
                          </button>
                          <button onClick={e => { e.stopPropagation(); if (window.confirm("Delete group?")) deleteGroup(group.id); }}
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-status-red"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded options */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="bg-accent/20 px-6 py-3">
                          <div className="space-y-1">
                            {group.options.map(opt => (
                              <div key={opt.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background/80 group/opt transition-colors">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                <span className="text-[13px] font-medium text-foreground flex-1">{opt.name}</span>
                                {opt.nameZh && <span className="text-[11px] text-muted-foreground">{opt.nameZh}</span>}
                                <span className="text-[12px] font-mono text-muted-foreground">{opt.price > 0 ? `+$${opt.price.toFixed(2)}` : "Free"}</span>
                                <button onClick={() => deleteOption(group.id, opt.id)}
                                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-status-red opacity-0 group-hover/opt:opacity-100 transition-opacity">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}

                            {addingTo === group.id ? (
                              <div className="flex items-center gap-2 px-3 py-2">
                                <input placeholder="Option name" value={optName} onChange={e => setOptName(e.target.value)} autoFocus
                                  className="flex-1 h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary" />
                                <input placeholder="中文" value={optNameZh} onChange={e => setOptNameZh(e.target.value)}
                                  className="w-20 h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary" />
                                <input placeholder="$0" value={optPrice} onChange={e => setOptPrice(e.target.value)} type="number" step="0.5"
                                  className="w-16 h-8 px-2.5 rounded-md bg-background border border-border text-[12px] font-mono focus:outline-none focus:border-primary" />
                                <button onClick={() => handleAddOption(group.id)} className="p-1.5 rounded-md hover:bg-accent text-status-green"><Check className="h-3.5 w-3.5" /></button>
                                <button onClick={() => setAddingTo(null)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            ) : (
                              <button onClick={() => setAddingTo(group.id)}
                                className="flex items-center gap-1.5 px-3 py-2 text-[12px] text-primary hover:underline">
                                <Plus className="h-3.5 w-3.5" /> Add Option
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

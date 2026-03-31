import React, { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X, Lock, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCategories, addCategory, updateCategory, deleteCategory, isSystemCategory, moveCategoryUp, moveCategoryDown } from "@/state/category-store";
import { useLanguage } from "@/hooks/useLanguage";

export const CategoryManager: React.FC = () => {
  const { t } = useLanguage();
  const categories = useCategories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editNameZh, setEditNameZh] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNameZh, setNewNameZh] = useState("");

  const startEdit = (id: string, name: string, nameZh?: string) => {
    setEditingId(id); setEditName(name); setEditNameZh(nameZh || "");
  };
  const saveEdit = () => {
    if (editingId && editName.trim()) {
      updateCategory(editingId, { name: editName.trim(), nameZh: editNameZh.trim() || undefined });
      setEditingId(null);
    }
  };
  const handleAdd = () => {
    if (newName.trim()) {
      addCategory({ name: newName.trim(), nameZh: newNameZh.trim() || undefined });
      setNewName(""); setNewNameZh(""); setShowAdd(false);
    }
  };
  const handleDelete = (id: string) => {
    if (window.confirm("Delete this category? Items will become uncategorized.")) deleteCategory(id);
  };

  return (
    <div>
      {/* Add row */}
      {showAdd && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-card border border-border rounded-xl">
          <Layers className="h-4 w-4 text-primary shrink-0" />
          <input placeholder="Category name" value={newName} onChange={e => setNewName(e.target.value)} autoFocus
            className="flex-1 h-9 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:border-primary" />
          <input placeholder="中文名" value={newNameZh} onChange={e => setNewNameZh(e.target.value)}
            className="w-32 h-9 px-3 rounded-lg bg-background border border-border text-[13px] focus:outline-none focus:border-primary" />
          <Button size="sm" className="h-9 px-4 text-[12px] gap-1" onClick={handleAdd} disabled={!newName.trim()}>
            <Check className="h-3.5 w-3.5" /> Add
          </Button>
          <Button size="sm" variant="outline" className="h-9 px-3" onClick={() => setShowAdd(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="uniweb-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="w-12 text-center">#</th>
                <th>Category</th>
                <th>Chinese Name</th>
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
              {categories.map((cat, idx) => (
                <tr key={cat.id} className="table-row border-b border-border last:border-0 hover:bg-accent/30 transition-colors group">
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-[12px] font-mono text-muted-foreground">{idx + 1}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    {editingId === cat.id ? (
                      <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                        className="h-8 px-2.5 rounded-md bg-background border border-primary text-[13px] font-semibold focus:outline-none w-40"
                        onKeyDown={e => e.key === "Enter" && saveEdit()} />
                    ) : (
                      <span className="text-[13px] font-semibold text-foreground">{cat.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-1">
                        <input value={editNameZh} onChange={e => setEditNameZh(e.target.value)}
                          className="h-8 px-2.5 rounded-md bg-background border border-border text-[13px] focus:outline-none focus:border-primary w-28"
                          onKeyDown={e => e.key === "Enter" && saveEdit()} />
                        <button onClick={saveEdit} className="p-1.5 rounded-md hover:bg-accent text-status-green"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">{cat.nameZh || "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {isSystemCategory(cat.id) ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold bg-primary/10 text-primary">
                        <Lock className="h-3 w-3" /> System
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold bg-accent text-muted-foreground">
                        Custom
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveCategoryUp(cat.id)} disabled={idx === 0}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-20"><ChevronUp className="h-3.5 w-3.5" /></button>
                      <button onClick={() => moveCategoryDown(cat.id)} disabled={idx === categories.length - 1}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-20"><ChevronDown className="h-3.5 w-3.5" /></button>
                      <button onClick={() => startEdit(cat.id, cat.name, cat.nameZh)}
                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                      {!isSystemCategory(cat.id) && (
                        <button onClick={() => handleDelete(cat.id)}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-status-red"><Trash2 className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

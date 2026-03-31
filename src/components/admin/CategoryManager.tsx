import React, { useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X, Lock } from "lucide-react";
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
    setEditingId(id);
    setEditName(name);
    setEditNameZh(nameZh || "");
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
      setNewName("");
      setNewNameZh("");
      setShowAdd(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this category? Items will become uncategorized.")) {
      deleteCategory(id);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{t("addCategory")}</span>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5" /> {t("addCategory")}
        </Button>
      </div>

      {showAdd && (
        <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
          <input
            placeholder="Name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="flex-1 h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary"
            autoFocus
          />
          <input
            placeholder="中文名"
            value={newNameZh}
            onChange={e => setNewNameZh(e.target.value)}
            className="flex-1 h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary"
          />
          <Button size="sm" className="h-8 px-2" onClick={handleAdd}><Check className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowAdd(false)}><X className="h-3.5 w-3.5" /></Button>
        </div>
      )}

      <div className="space-y-1">
        {categories.map((cat, idx) => (
          <div key={cat.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/50 group">
            {editingId === cat.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="flex-1 h-7 px-2 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary" autoFocus />
                <input value={editNameZh} onChange={e => setEditNameZh(e.target.value)}
                  className="w-24 h-7 px-2 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary" />
                <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={saveEdit}><Check className="h-3 w-3 text-status-green" /></Button>
                <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
              </>
            ) : (
              <>
                <span className="text-[13px] font-medium text-foreground flex-1">{cat.name}</span>
                {cat.nameZh && <span className="text-[11px] text-muted-foreground">{cat.nameZh}</span>}
                {isSystemCategory(cat.id) && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground font-medium flex items-center gap-0.5">
                    <Lock className="h-2.5 w-2.5" /> {t("systemCategory")}
                  </span>
                )}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => moveCategoryUp(cat.id)} disabled={idx === 0}
                    className="p-1 rounded hover:bg-accent disabled:opacity-30"><ChevronUp className="h-3 w-3" /></button>
                  <button onClick={() => moveCategoryDown(cat.id)} disabled={idx === categories.length - 1}
                    className="p-1 rounded hover:bg-accent disabled:opacity-30"><ChevronDown className="h-3 w-3" /></button>
                  <button onClick={() => startEdit(cat.id, cat.name, cat.nameZh)}
                    className="p-1 rounded hover:bg-accent"><Pencil className="h-3 w-3" /></button>
                  {!isSystemCategory(cat.id) && (
                    <button onClick={() => handleDelete(cat.id)}
                      className="p-1 rounded hover:bg-accent text-status-red"><Trash2 className="h-3 w-3" /></button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

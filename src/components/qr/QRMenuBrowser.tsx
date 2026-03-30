import React, { useState } from "react";
import { Search, Star, Plus, Package, Zap, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories, modifierGroups as allModGroups, type MenuItem } from "@/data/mock-data";
import { useMenuItems } from "@/state/menu-store";
import { useLanguage } from "@/hooks/useLanguage";

export interface QRCartItem {
  id: string;
  menuItemId: string;
  name: string;
  nameZh?: string;
  price: number;
  quantity: number;
  modifiers: { name: string; price: number }[];
  notes?: string;
  comboItems?: { name: string; groupName: string }[];
}

interface Props {
  cart: QRCartItem[];
  onAddToCart: (item: QRCartItem) => void;
  onViewCart: () => void;
}

export const QRMenuBrowser: React.FC<Props> = ({ cart, onAddToCart, onViewCart }) => {
  const { lang, t } = useLanguage();
  const menuItems = useMenuItems();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [comboSelections, setComboSelections] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState("");

  const filtered = menuItems.filter(item => {
    if (!item.available) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.nameZh?.includes(q);
    }
    if (activeCategory === "All") return true;
    if (activeCategory === "Popular") return item.popular;
    return item.category === activeCategory;
  });

  const getName = (n: string, nZh?: string) => lang === "zh" && nZh ? nZh : n;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handleItemClick = (item: MenuItem) => {
    if ((item.modifierGroups && item.modifierGroups.length > 0) || item.isCombo) {
      setDetailItem(item);
      setSelected({});
      setComboSelections({});
      setNotes("");
    } else {
      onAddToCart({ id: `qr-${Date.now()}`, menuItemId: item.id, name: item.name, nameZh: item.nameZh, price: item.price, quantity: 1, modifiers: [] });
    }
  };

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

  const handleAddFromDetail = () => {
    if (!detailItem) return;
    const groups = allModGroups.filter(g => detailItem.modifierGroups?.includes(g.id));
    const mods = groups.flatMap(g => (selected[g.id] || []).map(oId => {
      const opt = g.options.find(o => o.id === oId);
      return opt ? { name: opt.name, price: opt.price } : null;
    }).filter(Boolean)) as { name: string; price: number }[];
    const combos = detailItem.comboGroups?.flatMap(g => (comboSelections[g.id] || []).map(itemId => {
      const mi = menuItems.find(m => m.id === itemId);
      return mi ? { name: mi.name, groupName: g.name } : null;
    }).filter(Boolean)) as { name: string; groupName: string }[] | undefined;
    onAddToCart({ id: `qr-${Date.now()}`, menuItemId: detailItem.id, name: detailItem.name, nameZh: detailItem.nameZh, price: detailItem.price, quantity: 1, modifiers: mods, notes: notes || undefined, comboItems: combos });
    setDetailItem(null);
  };

  const groups = detailItem ? allModGroups.filter(g => detailItem.modifierGroups?.includes(g.id)) : [];
  const modifierValid = groups.filter(g => g.required).every(g => (selected[g.id] || []).length > 0);
  const comboValid = !detailItem?.comboGroups || detailItem.comboGroups.filter(g => g.required).every(g => (comboSelections[g.id] || []).length === g.maxSelect);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Search + categories */}
      <div className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t("search_menu")}
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-background border-1.5 border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all" />
          </div>
        </div>
        <div className="flex gap-1.5 px-3 pb-2.5 overflow-x-auto pos-scrollbar">
          {categories.filter(c => c !== "Alcohol").map(cat => (
            <button key={cat} onClick={() => { setActiveCategory(cat); setSearchQuery(""); }}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200",
                activeCategory === cat && !searchQuery ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}>
              {t(cat.toLowerCase().replace(/ /g, "_")) !== cat.toLowerCase().replace(/ /g, "_") ? t(cat.toLowerCase().replace(/ /g, "_")) : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 p-3 space-y-2">
        {filtered.map(item => (
          <button key={item.id} onClick={() => handleItemClick(item)}
            className="w-full flex gap-3 p-3 rounded-xl border-1.5 border-border bg-card text-left transition-all hover:border-primary/30 active:scale-[0.99]">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-accent shrink-0">
              {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><span className="text-xl opacity-30">🍽</span></div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground line-clamp-1">{getName(item.name, item.nameZh)}</div>
              {lang === "en" && item.nameZh && <div className="text-[11px] text-muted-foreground">{item.nameZh}</div>}
              {item.popular && <Star className="inline h-3 w-3 text-status-amber fill-status-amber mr-1" />}
              {item.isCombo && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">COMBO</span>}
              <div className="text-sm font-semibold text-primary font-mono mt-1">${item.price.toFixed(2)}</div>
            </div>
            <div className="flex items-center"><Plus className="h-5 w-5 text-primary" /></div>
          </button>
        ))}
      </div>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div className="sticky bottom-0 p-3 bg-card border-t border-border">
          <button onClick={onViewCart}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 active:scale-[0.98]">
            {lang === "zh" ? "查看订单" : "View Order"}
            <span className="bg-primary-foreground text-primary text-xs font-bold px-2 py-0.5 rounded-full">{cartCount}</span>
          </button>
        </div>
      )}

      {/* Item detail modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end" onClick={() => setDetailItem(null)}>
          <div className="w-full bg-card rounded-t-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground">{getName(detailItem.name, detailItem.nameZh)}</h3>
                <span className="text-sm text-primary font-mono">${detailItem.price.toFixed(2)}</span>
              </div>
              <button onClick={() => setDetailItem(null)} className="p-2 rounded-lg hover:bg-accent"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {detailItem.comboGroups?.map(g => (
                <div key={g.id}>
                  <span className="text-sm font-semibold text-foreground">{getName(g.name, g.nameZh)} <span className="text-xs text-muted-foreground">(Pick {g.maxSelect})</span></span>
                  <div className="mt-2 space-y-1.5">
                    {g.allowedItems.map(aiId => {
                      const mi = menuItems.find(m => m.id === aiId); if (!mi) return null;
                      const isSel = (comboSelections[g.id] || []).includes(aiId);
                      return (<button key={aiId} onClick={() => toggleComboItem(g.id, aiId, g.maxSelect)}
                        className={cn("w-full p-3 rounded-lg border-1.5 text-left text-sm flex items-center justify-between", isSel ? "border-primary bg-primary/5" : "border-border")}>
                        <span>{getName(mi.name, mi.nameZh)}</span>{isSel && <Check className="h-4 w-4 text-primary" />}</button>);
                    })}
                  </div>
                </div>
              ))}
              {groups.map(g => (
                <div key={g.id}>
                  <span className="text-sm font-semibold text-foreground">{getName(g.name, g.nameZh)} {g.required && <span className="text-[10px] text-destructive">Required</span>}</span>
                  <div className="mt-2 space-y-1.5">
                    {g.options.map(o => {
                      const isSel = (selected[g.id] || []).includes(o.id);
                      return (<button key={o.id} onClick={() => toggleOption(g.id, o.id, g.multiSelect)}
                        className={cn("w-full p-3 rounded-lg border-1.5 text-left text-sm flex items-center justify-between", isSel ? "border-primary bg-primary/5" : "border-border")}>
                        <span>{getName(o.name, o.nameZh)}</span>
                        <div className="flex items-center gap-2">
                          {o.price > 0 && <span className="text-xs text-muted-foreground font-mono">+${o.price.toFixed(2)}</span>}
                          {isSel && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      </button>);
                    })}
                  </div>
                </div>
              ))}
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={lang === "zh" ? "备注..." : "Notes..."}
                className="w-full rounded-lg border-1.5 border-border bg-background p-3 text-sm resize-none focus:outline-none focus:border-primary" />
            </div>
            <div className="p-4 border-t border-border">
              <button onClick={handleAddFromDetail} disabled={!modifierValid || !comboValid}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold active:scale-[0.98] disabled:opacity-50">
                {lang === "zh" ? "加入订单" : "Add to Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

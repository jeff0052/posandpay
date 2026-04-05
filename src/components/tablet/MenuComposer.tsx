import React, { useState, useEffect } from "react";
import { Search, Star, Plus, Package, Zap, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories, modifierGroups, type Table, type Order, type MenuItem } from "@/data/mock-data";
import { ModifierDialog } from "@/components/tablet/ModifierDialog";
import { useLanguage } from "@/hooks/useLanguage";
import { useMenuItems } from "@/state/menu-store";
import { buffetMenuItems, buffetPlans } from "@/state/buffet-store";

interface MenuComposerProps {
  onAddItem: (menuItemId: string, modifiers: { name: string; price: number }[], notes?: string, comboItems?: { name: string; groupName: string }[]) => void;
  onAddBuffetItem?: (buffetItemId: string, surcharge: number, name: string) => void;
  onStartBuffet?: (planId: string, pax: number) => void;
  selectedTable?: Table;
  currentOrder: Order | null;
}

export const MenuComposer: React.FC<MenuComposerProps> = ({ onAddItem, onAddBuffetItem, onStartBuffet, selectedTable, currentOrder }) => {
  const { t, lang } = useLanguage();
  const menuItems = useMenuItems();
  const isBuffet = !!currentOrder?.buffetPlanId;
  const [activeCategory, setActiveCategory] = useState("All");
  const [showBuffetSelect, setShowBuffetSelect] = useState(false);
  const [buffetPax, setBuffetPax] = useState(currentOrder?.guestCount || 2);

  // Auto-switch to Buffet tab when buffet mode starts
  useEffect(() => {
    if (isBuffet && activeCategory !== "Buffet") setActiveCategory("Buffet");
  }, [isBuffet]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modifierItem, setModifierItem] = useState<MenuItem | null>(null);

  const filteredItems = menuItems.filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.nameZh?.includes(q);
    }
    if (activeCategory === "All") return true;
    if (activeCategory === "Popular") return item.popular;
    return item.category === activeCategory;
  });

  const handleItemClick = (item: MenuItem) => {
    if (!item.available) return;
    if ((item.modifierGroups && item.modifierGroups.length > 0) || item.isCombo) {
      setModifierItem(item);
    } else {
      onAddItem(item.id, []);
    }
  };

  const handleModifierConfirm = (modifiers: { name: string; price: number }[], notes?: string, comboItems?: { name: string; groupName: string }[]) => {
    if (modifierItem) {
      onAddItem(modifierItem.id, modifiers, notes, comboItems);
      setModifierItem(null);
    }
  };

  const getItemName = (item: MenuItem) => lang === "zh" && item.nameZh ? item.nameZh : item.name;

  // Helper to get combo includes display
  const getComboDisplay = (item: MenuItem) => {
    if (!item.isCombo) return null;
    if (item.comboIncludes && item.comboIncludes.length > 0) {
      return item.comboIncludes.join(" · ");
    }
    if (item.comboGroups) {
      return item.comboGroups.map(g => lang === "zh" && g.nameZh ? g.nameZh : g.name).join(" + ");
    }
    return null;
  };

  const categoryLabel = (cat: string) => {
    const key = cat.toLowerCase().replace(/ /g, "_");
    const translated = t(key);
    return translated !== key ? translated : cat;
  };

  return (
    <div className="flex-1 flex flex-col bg-background min-w-0">
      {/* Header */}
      <div className="h-[52px] px-3 pr-2 border-b border-border bg-card flex items-center gap-3 shrink-0 min-w-0 overflow-hidden">
        <div className="flex-1">
          {selectedTable ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-[13px]">{t("tables")} {selectedTable.number}</span>
              <span className="text-[11px] text-primary bg-status-blue-light px-2 py-0.5 rounded-md font-medium">
                {currentOrder?.serviceMode || "dine-in"}
              </span>
              {selectedTable.guestCount && (
                <span className="text-[11px] text-muted-foreground">{selectedTable.guestCount} {t("guests")}</span>
              )}
            </div>
          ) : currentOrder ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-[13px] capitalize">{currentOrder.serviceMode}</span>
              <span className="text-[11px] text-muted-foreground font-mono">#{currentOrder.id.slice(-4)}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-[13px]">Select a table or create an order</span>
          )}
        </div>
        <div className="relative w-36 max-w-56 shrink min-w-[100px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("search_menu")}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-[9px] bg-background border-1.5 border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      {/* Category Rail */}
      <div className="flex flex-wrap gap-1.5 px-5 py-2.5 border-b border-border bg-card">
        {["All", "Buffet", ...categories.slice(1)].map(cat => (
          <button
            key={cat}
            onClick={() => {
              if (cat === "Buffet" && !isBuffet) {
                setShowBuffetSelect(true);
                return;
              }
              setActiveCategory(cat); setSearchQuery("");
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200",
              activeCategory === cat && !searchQuery
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            {categoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="flex-1 overflow-y-auto pos-scrollbar p-5">
        {/* Buffet items grid */}
        {activeCategory === "Buffet" && (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            {buffetMenuItems.filter(bi => bi.available).map(bi => (
              <button
                key={bi.id}
                onClick={() => onAddBuffetItem?.(bi.id, bi.surcharge, bi.name)}
                className="relative rounded-lg border-1.5 text-left transition-all duration-300 ease-out group overflow-hidden bg-card border-border hover:border-primary/40 hover:shadow-soft cursor-pointer"
              >
                <div className="w-full aspect-[4/3] overflow-hidden bg-accent relative flex-shrink-0">
                  {bi.image ? (
                    <img src={bi.image} alt={bi.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted"><span className="text-2xl opacity-30">🍽</span></div>
                  )}
                  {bi.surcharge > 0 && (
                    <span className="absolute top-2 left-2 bg-status-amber/90 text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      +${bi.surcharge}
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <div className="font-medium text-[13px] text-foreground leading-tight mb-0.5 line-clamp-1">
                    {lang === "zh" && bi.nameZh ? bi.nameZh : bi.name}
                  </div>
                  {lang === "zh" && bi.nameZh && <div className="text-[10px] text-muted-foreground line-clamp-1 mb-0.5">{bi.name}</div>}
                  {lang === "en" && bi.nameZh && <div className="text-[10px] text-muted-foreground line-clamp-1 mb-0.5">{bi.nameZh}</div>}
                  <div className={cn("text-[13px] font-semibold font-mono",
                    isBuffet ? (bi.surcharge > 0 ? "text-status-amber" : "text-status-green") : "text-primary"
                  )}>
                    {isBuffet
                      ? (bi.surcharge > 0 ? `+$${bi.surcharge.toFixed(2)}` : t("included"))
                      : `$${bi.surcharge > 0 ? bi.surcharge.toFixed(2) : "0.00"}`
                    }
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                    <Plus className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Regular menu grid (hidden when showing Buffet tab) */}
        {activeCategory !== "Buffet" && (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {filteredItems.map(item => {
            const comboDisplay = getComboDisplay(item);
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                disabled={!item.available || (!currentOrder && !selectedTable)}
                className={cn(
                  "relative rounded-lg border-1.5 text-left transition-all duration-300 ease-out group overflow-hidden",
                  item.available && (currentOrder || selectedTable)
                    ? "bg-card border-border hover:border-primary/40 hover:shadow-soft cursor-pointer"
                    : "bg-accent border-border/50 opacity-60 cursor-not-allowed"
                )}
              >
                {/* Image */}
                <div className="w-full aspect-[4/3] overflow-hidden bg-accent relative flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <span className="text-2xl opacity-30">🍽</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  {item.popular && (
                    <Star className="absolute top-2 right-2 h-3.5 w-3.5 text-status-amber fill-status-amber drop-shadow-sm" />
                  )}
                  {item.isCombo && (
                    <span className={cn(
                      "absolute top-2 left-2 flex items-center gap-1 text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                      item.isFlexCombo ? "bg-status-amber/90" : "bg-primary/90"
                    )}>
                      {item.isFlexCombo ? <Zap className="h-2.5 w-2.5" /> : <Package className="h-2.5 w-2.5" />}
                      {item.isFlexCombo ? (lang === "zh" ? "自选" : "FLEX") : (lang === "zh" ? "套餐" : "COMBO")}
                    </span>
                  )}
                  <div className="font-medium text-[13px] text-foreground leading-tight mb-0.5 line-clamp-1">
                    {getItemName(item)}
                  </div>
                  {lang === "zh" && item.nameZh && (
                    <div className="text-[10px] text-muted-foreground line-clamp-1 mb-0.5">{item.name}</div>
                  )}
                  {lang === "en" && item.nameZh && (
                    <div className="text-[10px] text-muted-foreground line-clamp-1 mb-0.5">{item.nameZh}</div>
                  )}
                  {/* Combo includes */}
                  {comboDisplay && (
                    <div className="text-[10px] text-muted-foreground line-clamp-2 mb-1 leading-snug">
                      {t("includes")}: {comboDisplay}
                    </div>
                  )}
                  <div className="text-[13px] font-semibold text-primary font-mono">${item.price.toFixed(2)}</div>
                  {!item.available && (
                    <div className="text-[10px] text-destructive mt-1 font-semibold">{t("unavailable")}</div>
                  )}
                </div>
                {item.available && (currentOrder || selectedTable) && (
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                      <Plus className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        )}
      </div>

      {modifierItem && (
        <ModifierDialog
          item={modifierItem}
          groups={modifierGroups.filter(g => modifierItem.modifierGroups?.includes(g.id))}
          onConfirm={handleModifierConfirm}
          onCancel={() => setModifierItem(null)}
        />
      )}

      {/* Buffet Plan Selection Dialog */}
      {showBuffetSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowBuffetSelect(false)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-elevated w-[380px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-[16px] font-semibold text-foreground">{t("select_buffet")}</span>
              <button onClick={() => setShowBuffetSelect(false)} className="p-1.5 rounded-lg hover:bg-accent">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            {/* Pax selector */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">{t("pax")}</span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <button key={n} onClick={() => setBuffetPax(n)} className={cn(
                      "w-9 h-9 rounded-lg text-[13px] font-semibold transition-colors active:scale-95",
                      buffetPax === n ? "bg-primary text-primary-foreground" : "bg-accent text-foreground hover:bg-secondary"
                    )}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Plans */}
            <div className="px-5 pb-5 space-y-2">
              {buffetPlans.filter(p => p.available).map(plan => (
                <button
                  key={plan.id}
                  onClick={() => {
                    onStartBuffet?.(plan.id, buffetPax);
                    setShowBuffetSelect(false);
                    setActiveCategory("Buffet");
                  }}
                  disabled={!currentOrder && !selectedTable}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-1.5 transition-all active:scale-[0.98]",
                    currentOrder || selectedTable
                      ? "bg-card border-border hover:border-primary/40 hover:shadow-soft cursor-pointer"
                      : "bg-accent border-border/50 opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className="text-left">
                    <div className="text-[14px] font-semibold text-foreground">{plan.name}</div>
                    <div className="text-[11px] text-muted-foreground">{plan.duration} min · {buffetPax} pax</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[16px] font-bold text-primary font-mono">${(plan.price * buffetPax).toFixed(2)}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">${plan.price}/pax</div>
                  </div>
                </button>
              ))}
              {!currentOrder && !selectedTable && (
                <p className="text-center text-[11px] text-muted-foreground pt-1">{t("select_table_start")}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

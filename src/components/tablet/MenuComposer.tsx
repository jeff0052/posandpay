import React, { useState } from "react";
import { Search, Star, Plus, Package, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories, modifierGroups, type Table, type Order, type MenuItem } from "@/data/mock-data";
import { ModifierDialog } from "@/components/tablet/ModifierDialog";
import { useLanguage } from "@/hooks/useLanguage";
import { useMenuItems } from "@/state/menu-store";

interface MenuComposerProps {
  onAddItem: (menuItemId: string, modifiers: { name: string; price: number }[], notes?: string, comboItems?: { name: string; groupName: string }[]) => void;
  selectedTable?: Table;
  currentOrder: Order | null;
}

export const MenuComposer: React.FC<MenuComposerProps> = ({ onAddItem, selectedTable, currentOrder }) => {
  const { t, lang } = useLanguage();
  const menuItems = useMenuItems();
  const [activeCategory, setActiveCategory] = useState("All");
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
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setSearchQuery(""); }}
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
      </div>

      {modifierItem && (
        <ModifierDialog
          item={modifierItem}
          groups={modifierGroups.filter(g => modifierItem.modifierGroups?.includes(g.id))}
          onConfirm={handleModifierConfirm}
          onCancel={() => setModifierItem(null)}
        />
      )}
    </div>
  );
};

import React, { useState } from "react";
import { Search, Star, Package, Zap, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories, type MenuItem } from "@/data/mock-data";
import { useMenuItems } from "@/state/menu-store";
import { useLanguage } from "@/hooks/useLanguage";

interface Props {
  onSelectItem: (item: MenuItem) => void;
  onViewCart: () => void;
  cartCount: number;
}

export const KioskMenu: React.FC<Props> = ({ onSelectItem, onViewCart, cartCount }) => {
  const { t, lang } = useLanguage();
  const menuItems = useMenuItems();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

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

  const getName = (item: MenuItem) => lang === "zh" && item.nameZh ? item.nameZh : item.name;

  return (
    <div className="flex h-full bg-background">
      {/* Category sidebar */}
      <div className="w-48 bg-card border-r border-border flex flex-col shrink-0">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("search_menu")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-background border-1.5 border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto pos-scrollbar py-2">
          {categories.filter(c => c !== "Alcohol").map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSearchQuery(""); }}
              className={cn(
                "w-full text-left px-4 py-3 text-sm font-medium transition-all duration-200",
                activeCategory === cat && !searchQuery
                  ? "bg-primary/10 text-primary font-semibold nav-active-glow"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {t(cat.toLowerCase().replace(/ /g, "_")) !== cat.toLowerCase().replace(/ /g, "_") ? t(cat.toLowerCase().replace(/ /g, "_")) : cat}
            </button>
          ))}
        </nav>
      </div>

      {/* Menu grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto pos-scrollbar p-6">
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {filtered.map(item => (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="relative rounded-xl border-[1.5px] border-border bg-card text-left transition-all duration-300 group overflow-hidden hover:border-primary/40 hover:shadow-soft active:scale-[0.98]"
              >
                <div className="w-full aspect-[4/3] overflow-hidden bg-accent relative">
                  {item.image ? (
                    <img src={item.image} alt={item.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted"><span className="text-3xl opacity-30">🍽</span></div>
                  )}
                  {item.popular && <Star className="absolute top-2 right-2 h-4 w-4 text-status-amber fill-status-amber drop-shadow-sm" />}
                  {item.isCombo && (
                    <span className={cn("absolute top-2 left-2 flex items-center gap-1 text-primary-foreground text-xs font-bold px-2 py-1 rounded-md", item.isFlexCombo ? "bg-status-amber/90" : "bg-primary/90")}>
                      {item.isFlexCombo ? <Zap className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                      {item.isFlexCombo ? "FLEX" : "COMBO"}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="font-semibold text-base text-foreground leading-tight mb-1 line-clamp-2">{getName(item)}</div>
                  {lang === "en" && item.nameZh && <div className="text-xs text-muted-foreground mb-1">{item.nameZh}</div>}
                  {lang === "zh" && item.nameZh && <div className="text-xs text-muted-foreground mb-1">{item.name}</div>}
                  <div className="text-lg font-bold text-primary font-mono">${item.price.toFixed(2)}</div>
                </div>
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Plus className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Floating cart button */}
        {cartCount > 0 && (
          <div className="p-4 border-t border-border bg-card">
            <button
              onClick={onViewCart}
              className="w-full h-14 rounded-xl bg-primary text-primary-foreground text-lg font-semibold flex items-center justify-center gap-3 transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              {lang === "zh" ? "查看购物车" : "View Cart"}
              <span className="bg-primary-foreground text-primary text-sm font-bold px-2.5 py-0.5 rounded-full">{cartCount}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

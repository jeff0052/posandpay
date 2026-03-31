import React, { useMemo, useState } from "react";
import { ArrowRight, Check, Image as ImageIcon, Layers, Package, Pencil, Plus, Search, Settings2, Star, Trash2, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { categories, type MenuItem, type ComboGroup } from "@/data/mock-data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { addMenuItemToStore, deleteMenuItemFromStore, updateMenuItemInStore, useMenuItems } from "@/state/menu-store";
import CategoryManager from "@/components/admin/CategoryManager";
import ModifierManager from "@/components/admin/ModifierManager";
import MenuItemDrawer from "@/components/admin/MenuItemDrawer";

const AdminMenu: React.FC = () => {
  const items = useMenuItems();
  const [activeTab, setActiveTab] = useState("items");
  const [search, setSearch] = useState("");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState<MenuItem | null>(null);
  const [drawerIsNew, setDrawerIsNew] = useState(false);

  const allItems = items.filter(i => !i.isCombo);
  const combos = items.filter(i => i.isCombo);
  const displayCategories = categories.filter(c => c !== "All" && c !== "Combos");

  const filteredItems = search
    ? allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.nameZh?.toLowerCase().includes(search.toLowerCase()))
    : allItems;

  const filteredCombos = search
    ? combos.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : combos;

  const openCreate = () => {
    const isComboTab = activeTab === "combos";
    setDrawerItem({
      id: "",
      name: "",
      price: 0,
      category: isComboTab ? "Combos" : "Mains",
      available: true,
      isCombo: isComboTab,
    } as MenuItem);
    setDrawerIsNew(true);
    setDrawerOpen(true);
  };

  const openEditor = (item: MenuItem) => {
    setDrawerItem(item);
    setDrawerIsNew(false);
    setDrawerOpen(true);
  };

  const handleDrawerSave = (data: Partial<MenuItem>) => {
    if (drawerIsNew) {
      addMenuItemToStore({
        id: `m-${Date.now()}`,
        available: true,
        category: data.category ?? "Mains",
        name: data.name ?? "",
        price: data.price ?? 0,
        nameZh: data.nameZh,
        description: data.description,
        popular: data.popular,
        isCombo: data.isCombo,
        isFlexCombo: data.isFlexCombo,
        comboGroups: data.comboGroups,
        modifierGroups: data.modifierGroups,
      });
    } else if (drawerItem?.id) {
      updateMenuItemInStore(drawerItem.id, data);
    }
    setDrawerOpen(false);
  };

  const handleDrawerDelete = () => {
    if (drawerItem?.id) {
      deleteMenuItemFromStore(drawerItem.id);
    }
    setDrawerOpen(false);
  };

  // Show search bar only on items/combos tabs
  const showSearch = activeTab === "items" || activeTab === "combos";

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Menu Management</h1>
          <p className="text-[13px] text-muted-foreground mt-1">{allItems.length} items · {combos.length} combos · {displayCategories.length} categories</p>
        </div>
        {(activeTab === "items" || activeTab === "combos") && (
          <Button className="rounded-lg gap-1.5 text-[13px]" onClick={openCreate}>
            <Plus className="h-4 w-4" />Add {activeTab === "combos" ? "Combo" : "Item"}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-5 flex flex-wrap items-center gap-4">
          <TabsList className="bg-accent rounded-lg">
            <TabsTrigger value="items" className="text-[13px] rounded-md">All Items</TabsTrigger>
            <TabsTrigger value="combos" className="text-[13px] rounded-md">
              <Package className="h-3.5 w-3.5 mr-1.5" />Combos
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-[13px] rounded-md">
              <Layers className="h-3.5 w-3.5 mr-1.5" />Categories
            </TabsTrigger>
            <TabsTrigger value="modifiers" className="text-[13px] rounded-md">
              <Settings2 className="h-3.5 w-3.5 mr-1.5" />Modifiers
            </TabsTrigger>
          </TabsList>
          {showSearch && (
            <div className="relative ml-auto w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search menu items..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-[9px] bg-card border-1.5 border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all"
              />
            </div>
          )}
        </div>

        {/* Items tab - card grid */}
        <TabsContent value="items">
          <ItemCardGrid items={filteredItems} onSelect={openEditor} />
        </TabsContent>

        {/* Combos tab - card grid */}
        <TabsContent value="combos">
          <ComboCardGrid combos={filteredCombos} allItems={items} onSelect={openEditor} />
        </TabsContent>

        {/* Categories tab */}
        <TabsContent value="categories">
          <CategoryManager />
        </TabsContent>

        {/* Modifiers tab */}
        <TabsContent value="modifiers">
          <ModifierManager />
        </TabsContent>
      </Tabs>

      {/* Menu Item Drawer */}
      <MenuItemDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        item={drawerItem}
        isNew={drawerIsNew}
        onSave={handleDrawerSave}
        onDelete={handleDrawerDelete}
        categories={displayCategories}
        allMenuItems={items}
      />
    </div>
  );
};

// ========== Item Card Grid ==========
const ItemCardGrid: React.FC<{
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
}> = ({ items, onSelect }) => {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-[13px] text-muted-foreground">No items found.</div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map(item => (
        <div
          key={item.id}
          onClick={() => onSelect(item)}
          className="group relative rounded-2xl border border-border bg-card overflow-hidden cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm"
        >
          {/* Image */}
          <div className="aspect-square bg-accent flex items-center justify-center overflow-hidden">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
            )}
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {!item.available && (
              <span className="bg-accent/90 backdrop-blur-sm text-muted-foreground text-[9px] font-semibold px-2 py-0.5 rounded-md">
                Hidden
              </span>
            )}
            {item.popular && (
              <span className="bg-status-amber/90 backdrop-blur-sm text-white text-[9px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5" />Popular
              </span>
            )}
          </div>

          {/* Edit button on hover */}
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(item); }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 backdrop-blur-sm border border-border rounded-lg p-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            <Pencil className="h-3 w-3" />
          </button>

          {/* Info */}
          <div className="p-3">
            <div className="text-[13px] font-semibold text-foreground truncate">{item.name}</div>
            {item.nameZh && (
              <div className="text-[11px] text-muted-foreground truncate mt-0.5">{item.nameZh}</div>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-[14px] font-bold text-primary font-mono">${item.price.toFixed(2)}</span>
              <span className="text-[10px] text-muted-foreground">{item.category}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ========== Combo Card Grid ==========
const ComboCardGrid: React.FC<{
  combos: MenuItem[];
  allItems: MenuItem[];
  onSelect: (item: MenuItem) => void;
}> = ({ combos, allItems, onSelect }) => {
  if (combos.length === 0) {
    return (
      <div className="py-12 text-center text-[13px] text-muted-foreground">No combos found.</div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {combos.map(combo => (
        <div
          key={combo.id}
          onClick={() => onSelect(combo)}
          className="group relative rounded-2xl border border-border bg-card overflow-hidden cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm"
        >
          {/* Image */}
          <div className="aspect-square bg-accent flex items-center justify-center overflow-hidden">
            {combo.image ? (
              <img src={combo.image} alt={combo.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <Package className="h-8 w-8 text-muted-foreground/20" />
            )}
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className={cn(
              "flex items-center gap-0.5 text-[9px] font-bold px-2 py-0.5 rounded-md text-white backdrop-blur-sm",
              combo.isFlexCombo ? "bg-status-amber/90" : "bg-primary/90"
            )}>
              {combo.isFlexCombo ? <><Zap className="h-2.5 w-2.5" />FLEX</> : <><Package className="h-2.5 w-2.5" />COMBO</>}
            </span>
            {!combo.available && (
              <span className="bg-accent/90 backdrop-blur-sm text-muted-foreground text-[9px] font-semibold px-2 py-0.5 rounded-md">
                Hidden
              </span>
            )}
            {combo.popular && (
              <span className="bg-status-amber/90 backdrop-blur-sm text-white text-[9px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5" />Popular
              </span>
            )}
          </div>

          {/* Edit button on hover */}
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(combo); }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 backdrop-blur-sm border border-border rounded-lg p-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary"
          >
            <Pencil className="h-3 w-3" />
          </button>

          {/* Info */}
          <div className="p-3">
            <div className="text-[13px] font-semibold text-foreground truncate">{combo.name}</div>
            {combo.nameZh && (
              <div className="text-[11px] text-muted-foreground truncate mt-0.5">{combo.nameZh}</div>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-[14px] font-bold text-primary font-mono">${combo.price.toFixed(2)}</span>
              {combo.comboGroups && (
                <span className="text-[10px] text-muted-foreground">{combo.comboGroups.length} groups</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminMenu;

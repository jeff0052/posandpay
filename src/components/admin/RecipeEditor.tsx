import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useRecipe, setRecipe, type RecipeIngredient } from "@/state/recipe-store";
import { useInventoryItems, type InventoryItem } from "@/state/inventory-store";

interface RecipeEditorProps {
  menuItemId: string;
}

export const RecipeEditor: React.FC<RecipeEditorProps> = ({ menuItemId }) => {
  const { t } = useLanguage();
  const currentRecipe = useRecipe(menuItemId);
  const inventoryItems = useInventoryItems();
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(currentRecipe);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("g");

  const handleAdd = () => {
    if (!selectedItemId || !qty) return;
    const newIngredient: RecipeIngredient = {
      inventoryItemId: selectedItemId,
      quantity: parseFloat(qty),
      unit,
    };
    const updated = [...ingredients, newIngredient];
    setIngredients(updated);
    setRecipe(menuItemId, updated);
    setSelectedItemId("");
    setQty("");
    setShowAdd(false);
  };

  const handleRemove = (idx: number) => {
    const updated = ingredients.filter((_, i) => i !== idx);
    setIngredients(updated);
    setRecipe(menuItemId, updated);
  };

  const handleUpdateQty = (idx: number, newQty: number) => {
    const updated = ingredients.map((ing, i) => i === idx ? { ...ing, quantity: newQty } : ing);
    setIngredients(updated);
    setRecipe(menuItemId, updated);
  };

  const getItem = (id: string): InventoryItem | undefined => inventoryItems.find(i => i.id === id);

  const estimatedCost = ingredients.reduce((sum, ing) => {
    const item = getItem(ing.inventoryItemId);
    if (!item) return sum;
    // Convert: if recipe uses "g" and inventory is "kg", divide by 1000
    let costPerUnit = item.costPerUnit;
    if (ing.unit === "g" && item.unit === "kg") costPerUnit = item.costPerUnit / 1000;
    if (ing.unit === "ml" && item.unit === "L") costPerUnit = item.costPerUnit / 1000;
    return sum + ing.quantity * costPerUnit;
  }, 0);

  const usedItemIds = new Set(ingredients.map(i => i.inventoryItemId));
  const availableItems = inventoryItems.filter(i => !usedItemIds.has(i.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("ingredients")}</span>
        <span className="text-[11px] text-muted-foreground">{t("estimatedCost")}: <span className="font-mono font-semibold text-foreground">${estimatedCost.toFixed(2)}</span></span>
      </div>

      {ingredients.length > 0 && (
        <div className="space-y-1">
          {ingredients.map((ing, idx) => {
            const item = getItem(ing.inventoryItemId);
            return (
              <div key={idx} className="flex items-center gap-2 text-[12px] px-2 py-1.5 rounded-md bg-accent/30 group">
                <span className="flex-1 text-foreground font-medium">{item?.name || "Unknown"}</span>
                <input
                  type="number"
                  value={ing.quantity}
                  onChange={e => handleUpdateQty(idx, parseFloat(e.target.value) || 0)}
                  className="w-16 h-6 px-1.5 rounded bg-background border border-border text-[11px] text-center focus:outline-none focus:border-primary"
                />
                <span className="text-[11px] text-muted-foreground w-6">{ing.unit}</span>
                <button onClick={() => handleRemove(idx)} className="opacity-0 group-hover:opacity-100 p-0.5 text-status-red">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showAdd ? (
        <div className="flex items-center gap-2 p-2 bg-accent/50 rounded-lg">
          <select
            value={selectedItemId}
            onChange={e => {
              setSelectedItemId(e.target.value);
              const item = inventoryItems.find(i => i.id === e.target.value);
              if (item) setUnit(item.unit === "kg" ? "g" : item.unit === "L" ? "ml" : item.unit);
            }}
            className="flex-1 h-7 px-2 rounded-md bg-background border border-border text-[11px] focus:outline-none focus:border-primary"
          >
            <option value="">{t("selectIngredient")}</option>
            {availableItems.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <input type="number" placeholder="Qty" value={qty} onChange={e => setQty(e.target.value)}
            className="w-16 h-7 px-2 rounded-md bg-background border border-border text-[11px] text-center focus:outline-none focus:border-primary" />
          <span className="text-[11px] text-muted-foreground w-6">{unit}</span>
          <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={handleAdd} disabled={!selectedItemId || !qty}>
            <Plus className="h-3 w-3 text-status-green" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={() => setShowAdd(false)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-[11px] text-primary hover:underline">
          <Plus className="h-3 w-3" /> {t("addIngredient")}
        </button>
      )}
    </div>
  );
};

import React, { useState } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useInventoryItems, adjustStock } from "@/state/inventory-store";

interface ReceivingLine {
  inventoryItemId: string;
  quantity: number;
  unitCost: number;
}

interface ReceivingFormProps {
  onClose?: () => void;
  initialLines?: ReceivingLine[];
}

export const ReceivingForm: React.FC<ReceivingFormProps> = ({ onClose, initialLines }) => {
  const { t } = useLanguage();
  const inventoryItems = useInventoryItems();
  const [supplier, setSupplier] = useState("");
  const [lines, setLines] = useState<ReceivingLine[]>(initialLines || [{ inventoryItemId: "", quantity: 0, unitCost: 0 }]);

  const addLine = () => setLines([...lines, { inventoryItemId: "", quantity: 0, unitCost: 0 }]);

  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));

  const updateLine = (idx: number, field: keyof ReceivingLine, value: string | number) => {
    setLines(lines.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const totalCost = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

  const handleSubmit = () => {
    const validLines = lines.filter(l => l.inventoryItemId && l.quantity > 0);
    if (validLines.length === 0) return;

    validLines.forEach(line => {
      adjustStock(line.inventoryItemId, line.quantity, "receive", `Received from ${supplier || "supplier"}`);
    });

    setLines([{ inventoryItemId: "", quantity: 0, unitCost: 0 }]);
    setSupplier("");
    onClose?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Package className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{t("receivingForm")}</h3>
      </div>

      <div>
        <label className="text-[11px] text-muted-foreground block mb-1">{t("supplier")}</label>
        <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="e.g. Ang Mo Kio Meat Supply"
          className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] focus:outline-none focus:border-primary" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[10px] text-muted-foreground uppercase tracking-wider">
              <th className="text-left pb-2 font-medium">{t("selectIngredient")}</th>
              <th className="text-center pb-2 font-medium w-20">Qty</th>
              <th className="text-center pb-2 font-medium w-20">{t("unitCost")}</th>
              <th className="text-right pb-2 font-medium w-20">{t("totalCost")}</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lines.map((line, idx) => (
              <tr key={idx}>
                <td className="py-1.5 pr-2">
                  <select value={line.inventoryItemId} onChange={e => updateLine(idx, "inventoryItemId", e.target.value)}
                    className="w-full h-7 px-2 rounded-md bg-background border border-border text-[11px] focus:outline-none focus:border-primary">
                    <option value="">-- Select --</option>
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                    ))}
                  </select>
                </td>
                <td className="py-1.5 px-1">
                  <input type="number" value={line.quantity || ""} onChange={e => updateLine(idx, "quantity", parseFloat(e.target.value) || 0)}
                    className="w-full h-7 px-2 rounded-md bg-background border border-border text-[11px] text-center focus:outline-none focus:border-primary" />
                </td>
                <td className="py-1.5 px-1">
                  <input type="number" step="0.1" value={line.unitCost || ""} onChange={e => updateLine(idx, "unitCost", parseFloat(e.target.value) || 0)}
                    className="w-full h-7 px-2 rounded-md bg-background border border-border text-[11px] text-center focus:outline-none focus:border-primary" />
                </td>
                <td className="py-1.5 pl-1 text-right font-mono text-muted-foreground">
                  ${(line.quantity * line.unitCost).toFixed(2)}
                </td>
                <td className="py-1.5 pl-1">
                  {lines.length > 1 && (
                    <button onClick={() => removeLine(idx)} className="p-0.5 rounded hover:bg-accent text-status-red">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={addLine} className="flex items-center gap-1 text-[11px] text-primary hover:underline">
          <Plus className="h-3 w-3" /> {t("addRow")}
        </button>
        <div className="text-[13px] font-semibold text-foreground">
          {t("totalCost")}: <span className="font-mono">${totalCost.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {onClose && <Button variant="outline" className="flex-1 h-9 text-[12px]" onClick={onClose}>{t("cancel")}</Button>}
        <Button className="flex-1 h-9 text-[12px]" onClick={handleSubmit}
          disabled={lines.every(l => !l.inventoryItemId || l.quantity <= 0)}>
          {t("submitReceiving")}
        </Button>
      </div>
    </div>
  );
};

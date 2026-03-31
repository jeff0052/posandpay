import React, { useState, useRef } from "react";
import { Camera, Upload, FileSearch, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useInventoryItems } from "@/state/inventory-store";
import { ReceivingForm } from "./ReceivingForm";

interface ParsedInvoiceLine {
  itemName: string;
  matchedItemId?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  confidence: number;
}

const MOCK_INVOICE_RESULTS: ParsedInvoiceLine[] = [
  { itemName: "Pork Belly 五花肉", matchedItemId: "inv-1", quantity: 10, unit: "kg", unitCost: 12.50, confidence: 0.95 },
  { itemName: "Jasmine Rice 茉莉香米", matchedItemId: "inv-3", quantity: 25, unit: "kg", unitCost: 3.20, confidence: 0.92 },
  { itemName: "Coconut Milk 椰浆", matchedItemId: "inv-13", quantity: 20, unit: "L", unitCost: 4.80, confidence: 0.88 },
  { itemName: "Fresh Prawns 鲜虾", matchedItemId: "inv-4", quantity: 5, unit: "kg", unitCost: 18.00, confidence: 0.90 },
  { itemName: "Bean Sprouts 豆芽", quantity: 3, unit: "kg", unitCost: 2.50, confidence: 0.72 },
];

// Mock OCR function — replace with real API later
async function parseInvoiceImage(_file: File): Promise<ParsedInvoiceLine[]> {
  await new Promise(r => setTimeout(r, 1500));
  return MOCK_INVOICE_RESULTS;
}

interface InvoiceScannerProps {
  onClose: () => void;
}

export const InvoiceScanner: React.FC<InvoiceScannerProps> = ({ onClose }) => {
  const { t } = useLanguage();
  const inventoryItems = useInventoryItems();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<ParsedInvoiceLine[] | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!fileRef.current?.files?.[0]) return;
    setAnalyzing(true);
    try {
      const parsed = await parseInvoiceImage(fileRef.current.files[0]);
      setResults(parsed);
    } finally {
      setAnalyzing(false);
    }
  };

  const getConfidenceColor = (c: number) => {
    if (c >= 0.9) return "text-status-green";
    if (c >= 0.8) return "text-status-amber";
    return "text-status-red";
  };

  // Convert parsed results to ReceivingForm lines
  if (results) {
    const initialLines = results
      .filter(r => r.matchedItemId)
      .map(r => ({
        inventoryItemId: r.matchedItemId!,
        quantity: r.quantity,
        unitCost: r.unitCost,
      }));

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <FileSearch className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{t("scanResult")}</h3>
        </div>

        {/* Show confidence table */}
        <div className="text-[12px] space-y-1 mb-4">
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent/30">
              <span className="flex-1 text-foreground">{r.itemName}</span>
              <span className={cn("font-mono text-[11px]", getConfidenceColor(r.confidence))}>
                {Math.round(r.confidence * 100)}%
              </span>
              {r.matchedItemId ? (
                <span className="flex items-center gap-0.5 text-[10px] text-status-green"><Check className="h-3 w-3" /> {t("matchedItem")}</span>
              ) : (
                <span className="flex items-center gap-0.5 text-[10px] text-status-red"><AlertCircle className="h-3 w-3" /> {t("noMatch")}</span>
              )}
            </div>
          ))}
        </div>

        <ReceivingForm initialLines={initialLines} onClose={onClose} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{t("scanInvoice")}</h3>
      </div>

      <input type="file" ref={fileRef} accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

      {imagePreview ? (
        <div className="space-y-3">
          <div className="rounded-lg overflow-hidden border border-border max-h-[300px]">
            <img src={imagePreview} alt="Invoice" className="w-full object-contain" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-9 text-[12px]" onClick={() => { setImagePreview(null); fileRef.current && (fileRef.current.value = ""); }}>
              {t("cancel")}
            </Button>
            <Button className="flex-1 h-9 text-[12px]" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? (
                <><span className="animate-spin mr-1.5">⏳</span> {t("analyzing")}</>
              ) : (
                <><FileSearch className="h-3.5 w-3.5 mr-1.5" /> {t("reviewAndSubmit")}</>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full h-[200px] rounded-lg border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer"
        >
          <Upload className="h-8 w-8 text-muted-foreground/40" />
          <span className="text-[13px] text-muted-foreground">Click to upload invoice photo</span>
          <span className="text-[11px] text-muted-foreground/60">Supports JPG, PNG</span>
        </button>
      )}

      <Button variant="outline" className="w-full h-9 text-[12px]" onClick={onClose}>{t("cancel")}</Button>
    </div>
  );
};

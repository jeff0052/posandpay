import React, { useState } from "react";
import { MapPin } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface Props {
  initialTable?: string;
  onConfirm: (tableNumber: string) => void;
}

export const QRTableSelect: React.FC<Props> = ({ initialTable, onConfirm }) => {
  const { lang } = useLanguage();
  const [tableNum, setTableNum] = useState(initialTable || "");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 glow-in">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <MapPin className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{lang === "zh" ? "确认桌号" : "Confirm Your Table"}</h1>
      <p className="text-muted-foreground mb-8 text-center">{lang === "zh" ? "请输入或确认您的桌号" : "Enter or confirm your table number"}</p>

      <input
        type="text"
        value={tableNum}
        onChange={e => setTableNum(e.target.value)}
        placeholder={lang === "zh" ? "桌号 (例: 5)" : "Table number (e.g. 5)"}
        className="w-full max-w-xs h-14 text-center text-2xl font-bold rounded-xl border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all mb-6"
        autoFocus
      />

      <button
        onClick={() => tableNum && onConfirm(tableNum)}
        disabled={!tableNum}
        className="w-full max-w-xs h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
      >
        {lang === "zh" ? "确认" : "Confirm Table"}
      </button>
    </div>
  );
};

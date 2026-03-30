import React, { useState } from "react";
import { CreditCard, QrCode, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface Props {
  total: number;
  onComplete: (method: string) => void;
  onBack: () => void;
}

export const QRPayment: React.FC<Props> = ({ total, onComplete, onBack }) => {
  const { lang } = useLanguage();
  const [method, setMethod] = useState<"card" | "qr">("qr");
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    onComplete(method);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <h2 className="text-xl font-bold text-foreground mb-2">{lang === "zh" ? "支付" : "Payment"}</h2>
      <p className="text-3xl font-bold text-primary font-mono mb-8">${total.toFixed(2)}</p>

      <div className="flex gap-3 mb-8">
        {[
          { key: "card" as const, label: lang === "zh" ? "银行卡" : "Card", icon: CreditCard },
          { key: "qr" as const, label: lang === "zh" ? "扫码" : "QR Pay", icon: QrCode },
        ].map(m => (
          <button key={m.key} onClick={() => setMethod(m.key)}
            className={cn("uniweb-card w-28 h-28 flex flex-col items-center justify-center gap-2 transition-all", method === m.key ? "gradient-ring border-primary/30" : "")}>
            <m.icon className={cn("h-6 w-6", method === m.key ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-xs font-medium", method === m.key ? "text-primary" : "text-muted-foreground")}>{m.label}</span>
          </button>
        ))}
      </div>

      {method === "qr" && (
        <div className="w-40 h-40 bg-card border border-border rounded-xl flex items-center justify-center mb-6">
          <QrCode className="h-20 w-20 text-muted-foreground/30" />
        </div>
      )}

      <div className="w-full max-w-xs space-y-3">
        <button onClick={handlePay} disabled={processing}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
          {processing ? <><Loader2 className="h-4 w-4 animate-spin" />{lang === "zh" ? "处理中" : "Processing"}</> : lang === "zh" ? "确认支付" : "Confirm Payment"}
        </button>
        <button onClick={onBack} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
          {lang === "zh" ? "返回" : "Back"}
        </button>
      </div>
    </div>
  );
};

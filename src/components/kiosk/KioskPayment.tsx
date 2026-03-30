import React, { useState } from "react";
import { CreditCard, QrCode, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings } from "@/state/settings-store";

interface Props {
  total: number;
  onComplete: (method: string) => void;
  onBack: () => void;
}

export const KioskPayment: React.FC<Props> = ({ total, onComplete, onBack }) => {
  const { lang } = useLanguage();
  const settings = useSettings();
  const [method, setMethod] = useState<"card" | "qr">("card");
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    onComplete(method);
  };

  const methods = [
    ...(settings.kioskPaymentMethods.card ? [{ key: "card" as const, label: lang === "zh" ? "银行卡" : "Card", icon: CreditCard }] : []),
    ...(settings.kioskPaymentMethods.qr ? [{ key: "qr" as const, label: lang === "zh" ? "扫码支付" : "QR Pay", icon: QrCode }] : []),
  ];

  return (
    <div className="flex flex-col h-full bg-background items-center justify-center p-8">
      <div className="w-full max-w-md text-center glow-in">
        <h2 className="text-3xl font-bold text-foreground mb-2">{lang === "zh" ? "支付" : "Payment"}</h2>
        <p className="text-4xl font-bold text-primary font-mono mb-10">${total.toFixed(2)}</p>

        <div className="flex gap-4 justify-center mb-10">
          {methods.map(m => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={cn(
                "uniweb-card w-40 h-40 flex flex-col items-center justify-center gap-3 transition-all duration-300",
                method === m.key ? "gradient-ring border-primary/30" : "hover:border-primary/20"
              )}
            >
              <m.icon className={cn("h-10 w-10", method === m.key ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("text-base font-semibold", method === m.key ? "text-primary" : "text-muted-foreground")}>{m.label}</span>
            </button>
          ))}
        </div>

        {method === "card" && (
          <p className="text-muted-foreground text-lg mb-6">{lang === "zh" ? "请刷卡、插卡或感应" : "Tap, insert, or swipe your card"}</p>
        )}
        {method === "qr" && (
          <div className="w-48 h-48 mx-auto bg-card border border-border rounded-xl flex items-center justify-center mb-6">
            <QrCode className="h-24 w-24 text-muted-foreground/30" />
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={processing}
          className="w-full h-14 rounded-xl bg-primary text-primary-foreground text-lg font-semibold transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {processing ? <><Loader2 className="h-5 w-5 animate-spin" />{lang === "zh" ? "处理中..." : "Processing..."}</> : lang === "zh" ? "确认支付" : "Confirm Payment"}
        </button>
        <button onClick={onBack} className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
          {lang === "zh" ? "返回" : "Back to Cart"}
        </button>
      </div>
    </div>
  );
};

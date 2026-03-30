import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface Props {
  collectionNumber: string;
  onNewOrder: () => void;
}

export const KioskComplete: React.FC<Props> = ({ collectionNumber, onNewOrder }) => {
  const { lang } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background p-8 glow-in">
      <div className="w-24 h-24 rounded-full bg-status-green-light flex items-center justify-center mb-8">
        <CheckCircle2 className="h-12 w-12 text-status-green" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2">{lang === "zh" ? "支付成功！" : "Payment Complete!"}</h1>
      <p className="text-lg text-muted-foreground mb-8">{lang === "zh" ? "您的取餐号" : "Your Collection Number"}</p>

      <div className="uniweb-card card-glow px-16 py-10 mb-8">
        <span className="text-7xl font-bold text-primary font-mono tracking-wider">#{collectionNumber}</span>
      </div>

      <p className="text-muted-foreground text-base mb-2">{lang === "zh" ? "预计等待时间" : "Estimated Wait"}</p>
      <p className="text-2xl font-semibold text-foreground mb-12">{lang === "zh" ? "约 8-12 分钟" : "~8-12 minutes"}</p>

      <button
        onClick={onNewOrder}
        className="h-14 px-12 rounded-xl bg-primary text-primary-foreground text-lg font-semibold transition-all hover:bg-primary/90 active:scale-[0.98]"
      >
        {lang === "zh" ? "新订单" : "New Order"}
      </button>
    </div>
  );
};

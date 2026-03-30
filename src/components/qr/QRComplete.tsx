import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface Props {
  tableNumber: string;
  orderNumber: string;
  isPaid: boolean;
}

export const QRComplete: React.FC<Props> = ({ tableNumber, orderNumber, isPaid }) => {
  const { lang } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 glow-in">
      <div className="w-20 h-20 rounded-full bg-status-green-light flex items-center justify-center mb-6">
        <CheckCircle2 className="h-10 w-10 text-status-green" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        {isPaid ? (lang === "zh" ? "支付成功！" : "Payment Complete!") : (lang === "zh" ? "订单已提交！" : "Order Submitted!")}
      </h1>
      <p className="text-muted-foreground mb-6 text-center">
        {isPaid
          ? (lang === "zh" ? "您的菜品正在准备中" : "Your food is being prepared")
          : (lang === "zh" ? "请稍后到柜台支付" : "Please pay at the counter when ready")}
      </p>

      <div className="uniweb-card card-glow px-10 py-6 mb-4 text-center">
        <div className="text-sm text-muted-foreground mb-1">{lang === "zh" ? "桌号" : "Table"}</div>
        <div className="text-4xl font-bold text-foreground mb-3">#{tableNumber}</div>
        <div className="text-sm text-muted-foreground mb-1">{lang === "zh" ? "订单号" : "Order"}</div>
        <div className="text-xl font-bold text-primary font-mono">#{orderNumber}</div>
      </div>

      {!isPaid && (
        <div className="status-badge bg-status-amber-light text-status-amber mt-2">
          <span className="status-dot bg-status-amber status-pulse" />
          {lang === "zh" ? "待支付" : "Payment Pending"}
        </div>
      )}
    </div>
  );
};

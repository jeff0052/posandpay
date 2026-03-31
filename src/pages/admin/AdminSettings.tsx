import React from "react";
import { Building2, CreditCard, Globe, Bell, QrCode, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings, updateSettings, type QRPaymentMode } from "@/state/settings-store";
import { Switch } from "@/components/ui/switch";

const AdminSettings: React.FC = () => {
  const settings = useSettings();

  const settingsCards = [
    { icon: Building2, title: "Outlet Details", desc: "Business name, address, operating hours", status: "Configured" },
    { icon: CreditCard, title: "Payment Setup", desc: "Uniweb card rail, PayNow, SGQR configuration", status: "Pending KYB" },
    { icon: Globe, title: "Compliance", desc: "ACRA registration, UBO details, KYB status", status: "Under Review" },
    { icon: Bell, title: "Notifications", desc: "Alert preferences, order notifications", status: "Configured" },
  ];

  return (
    <div className="p-7">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-[13px] text-muted-foreground mt-1">Configure your outlet</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {settingsCards.map(item => (
          <button key={item.title} className="uniweb-card surface-glow p-5 text-left hover:border-primary/30 transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-[11px] bg-status-blue-light flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-[13px]">{item.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
            <span className={`status-badge ${
              item.status === "Configured" ? "bg-status-green-light text-status-green" :
              item.status === "Under Review" ? "bg-status-amber-light text-status-amber" :
              "bg-status-blue-light text-primary"
            }`}>
              <span className={`status-dot ${
                item.status === "Configured" ? "bg-status-green" :
                item.status === "Under Review" ? "bg-status-amber" :
                "bg-primary"
              }`} />
              {item.status}
            </span>
          </button>
        ))}
      </div>

      {/* Ordering Channels */}
      <div className="uniweb-card surface-glow p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Ordering Channels</h2>

        <div className="space-y-5">
          {/* QR Ordering */}
          <div className="flex items-start gap-4 pb-5 border-b border-border">
            <div className="w-11 h-11 rounded-[11px] bg-status-blue-light flex items-center justify-center shrink-0">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground text-[13px]">QR Table Ordering</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Customers scan QR code to order from their table</p>
                </div>
                <Switch
                  checked={settings.qrEnabled}
                  onCheckedChange={(checked) => updateSettings({ qrEnabled: checked })}
                />
              </div>

              {settings.qrEnabled && (
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Payment Mode</span>
                  <div className="flex gap-2">
                    {([
                      { key: "pre-pay" as QRPaymentMode, label: "Pay First" },
                      { key: "post-pay" as QRPaymentMode, label: "Pay Later" },
                      { key: "choice" as QRPaymentMode, label: "Customer Choice" },
                    ]).map(m => (
                      <button key={m.key}
                        onClick={() => updateSettings({ qrPaymentMode: m.key })}
                        className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                          settings.qrPaymentMode === m.key ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground")}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kiosk */}
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-[11px] bg-status-amber-light flex items-center justify-center shrink-0">
              <Monitor className="h-5 w-5 text-status-amber" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground text-[13px]">Kiosk Self-Ordering</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Touch screen self-service ordering with collection numbers</p>
                </div>
                <Switch
                  checked={settings.kioskEnabled}
                  onCheckedChange={(checked) => updateSettings({ kioskEnabled: checked })}
                />
              </div>

              {settings.kioskEnabled && (
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Payment Methods</span>
                  <div className="flex gap-2">
                    {[
                      { key: "card", label: "Card" },
                      { key: "qr", label: "QR Pay" },
                    ].map(m => (
                      <button key={m.key}
                        onClick={() => updateSettings({
                          kioskPaymentMethods: {
                            ...settings.kioskPaymentMethods,
                            [m.key]: !settings.kioskPaymentMethods[m.key as "card" | "qr"],
                          }
                        })}
                        className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                          settings.kioskPaymentMethods[m.key as "card" | "qr"] ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground")}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

import React from "react";
import { Link } from "react-router-dom";
import { Monitor, Smartphone, Settings, MonitorSmartphone, QrCode } from "lucide-react";
import uniwebLogo from "@/assets/uniweb-logo.jpg";

const Index: React.FC = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-6">
    <div className="max-w-2xl w-full text-center">
      <img src={uniwebLogo} alt="Uniweb" className="w-16 h-16 rounded-2xl mx-auto mb-5" />
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Uniweb Smart POS</h1>
      <p className="text-[13px] text-muted-foreground mb-10">Select a surface to explore</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { to: "/tablet", icon: Monitor, title: "Tablet POS", desc: "Cashier workstation" },
          { to: "/mobile", icon: Smartphone, title: "Mobile POS", desc: "Handheld ordering" },
          { to: "/kiosk", icon: MonitorSmartphone, title: "Kiosk", desc: "Self-service ordering" },
          { to: "/qr", icon: QrCode, title: "QR Order", desc: "Scan-to-order" },
          { to: "/admin", icon: Settings, title: "Admin", desc: "Merchant portal" },
        ].map((s, i) => (
          <Link
            key={s.to}
            to={s.to}
            className="uniweb-card surface-glow p-6 transition-all duration-300 group glow-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="w-12 h-12 rounded-[11px] flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-105"
              style={{ background: "radial-gradient(circle at center, hsl(var(--primary) / 0.1) 0%, transparent 70%)" }}
            >
              <s.icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
            </div>
            <h2 className="font-semibold text-foreground text-[13px] mb-1">{s.title}</h2>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  </div>
);

export default Index;

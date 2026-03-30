import React, { useState } from "react";
import { User, Phone, Mail, ArrowRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useCustomers, addCustomer, type CustomerFull } from "@/state/customer-store";

interface Props {
  onAuth: (customer: CustomerFull | null) => void;
}

type Step = "choice" | "phone" | "otp" | "register" | "email-otp";

export const QRMemberAuth: React.FC<Props> = ({ onAuth }) => {
  const { lang } = useLanguage();
  const customers = useCustomers();
  const [step, setStep] = useState<Step>("choice");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<CustomerFull | null>(null);

  const handlePhoneSubmit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 800);
  };

  const handleOTPVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const found = customers.find(c => c.phone.replace(/\s/g, "").endsWith(phone.replace(/\s/g, "").slice(-8)));
      if (found) {
        setExistingCustomer(found);
        onAuth(found);
      } else {
        setStep("register");
      }
    }, 600);
  };

  const handleRegister = () => {
    const newCustomer: CustomerFull = {
      id: `c-${Date.now()}`,
      name: nickname || "Guest",
      phone: `+65 ${phone}`,
      email: email || undefined,
      tags: ["qr-signup"],
      visits: 0,
      points: 0,
      tier: "bronze",
      totalSpend: 0,
      averageTicket: 0,
      preferredItems: [],
      lastVisit: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString().slice(0, 10),
      segment: "new",
    };
    addCustomer(newCustomer);
    onAuth(newCustomer);
  };

  if (step === "choice") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 glow-in">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{lang === "zh" ? "会员登录" : "Member Login"}</h1>
        <p className="text-muted-foreground mb-8 text-center text-sm">
          {lang === "zh" ? "登录以累积积分，或以访客身份继续" : "Sign in to earn points, or continue as guest"}
        </p>

        <div className="w-full max-w-xs space-y-3">
          <button onClick={() => setStep("phone")}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 transition-all hover:bg-primary/90 active:scale-[0.98]">
            <Phone className="h-4 w-4" />
            {lang === "zh" ? "手机号登录/注册" : "Login with Phone"}
          </button>
          <button onClick={() => onAuth(null)}
            className="w-full h-12 rounded-xl border-1.5 border-border text-muted-foreground font-medium flex items-center justify-center gap-2 transition-all hover:bg-accent hover:text-foreground active:scale-[0.98]">
            {lang === "zh" ? "以访客身份继续" : "Continue as Guest"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (step === "phone") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <h2 className="text-xl font-bold text-foreground mb-6">{lang === "zh" ? "输入手机号" : "Enter Phone Number"}</h2>
        <div className="w-full max-w-xs space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground w-12">+65</span>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="9123 4567" maxLength={8}
              className="flex-1 h-12 rounded-xl border-1.5 border-border bg-card text-foreground text-center text-lg font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all" autoFocus />
          </div>
          <button onClick={handlePhoneSubmit} disabled={phone.length < 8 || loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : lang === "zh" ? "发送验证码" : "Send OTP"}
          </button>
          <button onClick={() => setStep("choice")} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
            {lang === "zh" ? "返回" : "Back"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">{lang === "zh" ? "输入验证码" : "Enter OTP"}</h2>
        <p className="text-sm text-muted-foreground mb-6">{lang === "zh" ? `已发送到 +65 ${phone}` : `Sent to +65 ${phone}`}</p>
        <div className="w-full max-w-xs space-y-4">
          <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" maxLength={6}
            className="w-full h-14 rounded-xl border-1.5 border-border bg-card text-foreground text-center text-2xl font-mono tracking-[0.3em] placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all" autoFocus />
          <button onClick={handleOTPVerify} disabled={otp.length < 4 || loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : lang === "zh" ? "验证" : "Verify"}
          </button>
        </div>
      </div>
    );
  }

  // Register step
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
      <h2 className="text-xl font-bold text-foreground mb-2">{lang === "zh" ? "完善信息" : "Complete Profile"}</h2>
      <p className="text-sm text-muted-foreground mb-6">{lang === "zh" ? "首次登录，快速注册" : "Quick registration for first-time users"}</p>
      <div className="w-full max-w-xs space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{lang === "zh" ? "昵称" : "Nickname"}</label>
          <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder={lang === "zh" ? "您的昵称" : "Your name"}
            className="w-full h-11 rounded-lg border-1.5 border-border bg-card text-foreground px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{lang === "zh" ? "邮箱（可选）" : "Email (optional)"}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
            className="w-full h-11 rounded-lg border-1.5 border-border bg-card text-foreground px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all" />
        </div>
        <button onClick={handleRegister}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold transition-all hover:bg-primary/90 active:scale-[0.98]">
          {lang === "zh" ? "注册并继续" : "Register & Continue"}
        </button>
      </div>
    </div>
  );
};

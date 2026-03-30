import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import uniwebLogo from "@/assets/uniweb-logo.jpg";

interface Props {
  onStart: (mode: "dine-in" | "takeaway") => void;
}

export const KioskWelcome: React.FC<Props> = ({ onStart }) => {
  const { t, lang, setLang } = useLanguage();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-background p-8 relative">
      {/* Language toggle */}
      <div className="absolute top-8 right-8 flex gap-2">
        <button
          onClick={() => setLang("en")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${lang === "en" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"}`}
        >
          EN
        </button>
        <button
          onClick={() => setLang("zh")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${lang === "zh" ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"}`}
        >
          中文
        </button>
      </div>

      <div className="text-center glow-in">
        <img src={uniwebLogo} alt="Uniweb" className="w-24 h-24 rounded-3xl mx-auto mb-8" />
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">
          {lang === "zh" ? "欢迎光临" : "Welcome"}
        </h1>
        <p className="text-xl text-muted-foreground mb-2">Song Fa Bak Kut Teh</p>
        <p className="text-lg text-muted-foreground mb-12">
          {lang === "zh" ? "请选择用餐方式" : "How would you like to order?"}
        </p>

        <div className="flex gap-6 justify-center">
          <button
            onClick={() => onStart("dine-in")}
            className="uniweb-card surface-glow w-56 h-56 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="w-20 h-20 rounded-2xl bg-status-blue-light flex items-center justify-center">
              <span className="text-4xl">🍽</span>
            </div>
            <span className="text-xl font-semibold text-foreground">{t("dine_in")}</span>
          </button>
          <button
            onClick={() => onStart("takeaway")}
            className="uniweb-card surface-glow w-56 h-56 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="w-20 h-20 rounded-2xl bg-status-amber-light flex items-center justify-center">
              <span className="text-4xl">🛍</span>
            </div>
            <span className="text-xl font-semibold text-foreground">{t("takeaway")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

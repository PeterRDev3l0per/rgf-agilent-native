import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden select-none p-4">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-md w-full glass-card p-8 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
          <AlertTriangle className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            {t("notfound.title")}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("notfound.desc")}
          </p>
        </div>

        <Link to="/" className="w-full">
          <Button className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t("notfound.button")}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

import React from "react";
import { useCopilotStore } from "@/stores/copilotStore";
import { useNavigate } from "react-router-dom";
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Truck,
  Palette,
  Smartphone,
  ChevronRight
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CATEGORY_ICONS: Record<string, any> = {
  catalog: ShoppingBag,
  payment: CreditCard,
  delivery: Truck,
  branding: Palette,
  whatsapp: Smartphone
};

export function StoreAuditModal() {
  const navigate = useNavigate();
  const {
    isAuditModalOpen,
    setAuditModalOpen,
    auditData,
    isAuditLoading,
    runStoreAudit
  } = useCopilotStore();

  if (!isAuditModalOpen) return null;

  const handleActionClick = (actionType: string, actionPayload: string) => {
    setAuditModalOpen(false);
    if (actionType === "navigate") {
      navigate(actionPayload);
    } else if (actionType === "modal" && actionPayload === "scanner") {
      navigate("/products?scanner=open");
    }
  };

  const score = auditData?.score ?? 0;
  const grade = auditData?.grade ?? "B";

  const getScoreColor = () => {
    if (score >= 90) return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    if (score >= 75) return "text-blue-400 border-blue-500/40 bg-blue-500/10";
    if (score >= 50) return "text-amber-400 border-amber-500/40 bg-amber-500/10";
    return "text-rose-400 border-rose-500/40 bg-rose-500/10";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-vendeur-coal border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Dynamic Score */}
        <div className="relative p-6 border-b border-white/10 bg-vendeur-slate/50 flex items-start justify-between gap-4">
          
          <div className="flex items-center gap-4">
            {/* Score Badge */}
            <div className={cn(
              "w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center shadow-lg shrink-0",
              getScoreColor()
            )}>
              <span className="text-2xl font-black leading-none">{score}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-white/50">/ 100</span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-white/10 mt-0.5">Note {grade}</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl text-white tracking-wide flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-400" />
                  Audit IA de Conversion
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Temps Réel
                </span>
              </div>
              <p className="text-xs text-white/70 mt-1 max-w-md">
                {auditData?.summaryTitle || "Diagnostic de rentabilité et d'attractivité de votre boutique."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => runStoreAudit()}
              disabled={isAuditLoading}
              title="Relancer le scan IA"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <RefreshCw size={16} className={isAuditLoading ? "animate-spin text-emerald-400" : ""} />
            </button>
            <button
              onClick={() => setAuditModalOpen(false)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Quick Metrics Bar */}
          {auditData && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase text-rose-400 flex items-center gap-1">
                  <AlertTriangle size={12} /> Bloquants
                </span>
                <span className="text-lg font-black text-white">{auditData.criticalCount}</span>
              </div>

              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                  <AlertCircle size={12} /> À améliorer
                </span>
                <span className="text-lg font-black text-white">{auditData.warningCount}</span>
              </div>

              <div className="p-3 rounded-2xl bg-black/30 border border-white/5 flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                  <TrendingUp size={12} /> Astuces Pro
                </span>
                <span className="text-lg font-black text-white">{auditData.tipCount}</span>
              </div>
            </div>
          )}

          {/* Actionable Checkpoints List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white/50">
              Plan d'Action Correctif en 1-Clic
            </h4>

            {isAuditLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-white/40">
                <RefreshCw size={28} className="animate-spin text-emerald-400" />
                <p className="text-xs">Vendeur IA diagnostique votre catalogue, paiements et vitrine...</p>
              </div>
            ) : !auditData || auditData.issues.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
                <h4 className="font-black text-sm text-emerald-300">Félicitations ! Aucun point critique détecté</h4>
                <p className="text-xs text-white/60">Votre boutique est parfaitement configurée pour convertir à 100%.</p>
              </div>
            ) : (
              auditData.issues.map((issue) => {
                const CatIcon = CATEGORY_ICONS[issue.category] || ShoppingBag;
                const isCritical = issue.severity === "critical";
                const isWarning = issue.severity === "warning";

                return (
                  <div
                    key={issue.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group",
                      isCritical
                        ? "bg-rose-500/[0.04] border-rose-500/30 hover:border-rose-500/50"
                        : isWarning
                        ? "bg-amber-500/[0.04] border-amber-500/30 hover:border-amber-500/50"
                        : "bg-white/[0.02] border-white/10 hover:border-white/20"
                    )}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        isCritical ? "bg-rose-500/20 text-rose-300" :
                        isWarning ? "bg-amber-500/20 text-amber-300" :
                        "bg-white/10 text-white/60"
                      )}>
                        <CatIcon size={18} />
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-white">
                            {issue.title}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase",
                            isCritical ? "bg-rose-500/20 text-rose-400" :
                            isWarning ? "bg-amber-500/20 text-amber-400" :
                            "bg-blue-500/20 text-blue-400"
                          )}>
                            {issue.impact}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">
                          {issue.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleActionClick(issue.actionType, issue.actionPayload)}
                      className={cn(
                        "h-9 px-4 rounded-xl font-black uppercase text-[10px] tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0 self-end sm:self-center",
                        isCritical
                          ? "bg-rose-500 hover:bg-rose-400 text-white"
                          : isWarning
                          ? "bg-amber-500 hover:bg-amber-400 text-black"
                          : "bg-emerald-500 hover:bg-emerald-400 text-black"
                      )}
                    >
                      <span>{issue.actionLabel}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <span className="text-[10px] text-white/40">
            Dernier scan : {auditData ? new Date(auditData.auditedAt).toLocaleTimeString("fr-FR") : "--"}
          </span>
          <button
            onClick={() => setAuditModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
          >
            Fermer l'audit
          </button>
        </div>

      </div>
    </div>
  );
}

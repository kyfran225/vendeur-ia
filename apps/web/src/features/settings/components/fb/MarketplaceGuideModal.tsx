import React from "react";
import { createPortal } from "react-dom";
import { X, Globe, Check, Rocket, ShieldCheck, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MarketplaceGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPackPro: () => void;
}

export function MarketplaceGuideModal({ isOpen, onClose, onOpenPackPro }: MarketplaceGuideModalProps) {
  const currency = useMerchantCurrency();
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-vendeur-bg border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3.5 sm:space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto text-slate-900 dark:text-white">
        <button 
          onClick={onClose} 
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-white/30 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-1.5 pt-1">
          <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
            <Globe size={24} />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
            Activer Vendeur IA sur Marketplace
          </h2>
          <p className="text-slate-500 dark:text-white/50 text-xs max-w-sm mx-auto leading-relaxed">
            Pour automatiser vos ventes sur Marketplace en toute sécurité, Meta requiert une <strong className="text-slate-800 dark:text-white/80">Page Facebook Business</strong>.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/30 text-center">Pourquoi une Page Business ?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "Protection contre le bannissement de votre compte perso",
              "Accès aux APIs officielles de Meta",
              "Réponses automatiques 24h/24 et 7j/7",
              "Gestion professionnelle des stocks & commandes"
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/5">
                <div className="h-5 w-5 rounded-full bg-blue-500/15 dark:bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30 mt-0.5">
                  <Check size={12} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-[11px] font-medium text-slate-700 dark:text-white/70 leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenPackPro();
            }}
            className="w-full h-11 sm:h-12 bg-emerald-600 hover:bg-emerald-500 dark:bg-vendeur-emerald text-white dark:text-vendeur-coal font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-emerald-600/20"
          >
            <Rocket size={16} />
            M'aider avec le Pack Pro (25.000 {currency})
          </button>

          <button
            onClick={() => window.open('https://www.facebook.com/pages/create', '_blank')}
            className="w-full h-9 sm:h-10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            Créer ma Page manuellement <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

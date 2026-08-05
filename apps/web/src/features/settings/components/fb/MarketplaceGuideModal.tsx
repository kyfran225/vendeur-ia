import React from "react";
import { X, Globe, Check, Rocket, ShieldCheck, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MarketplaceGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPackPro: () => void;
}

export function MarketplaceGuideModal({ isOpen, onClose, onOpenPackPro }: MarketplaceGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-vendeur-bg border border-white/10 rounded-[3rem] p-8 md:p-12 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="text-center space-y-4">
          <div className="h-20 w-20 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] flex items-center justify-center mx-auto">
            <Globe className="text-blue-400" size={40} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">Activer l'IA sur Marketplace</h2>
          <p className="text-white/40 text-sm">Pour automatiser vos ventes sur Marketplace en toute sécurité, Meta impose l'utilisation d'une **Page Facebook Business**.</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 text-center">Pourquoi une Page ?</h3>
          <div className="grid gap-3">
            {[
              "Protection contre le bannissement de votre compte perso",
              "Accès aux APIs officielles de Meta",
              "Réponses automatiques 24h/24 et 7j/7",
              "Gestion professionnelle des stocks et commandes"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/40">
                  <Check size={14} className="text-blue-400" />
                </div>
                <span className="text-xs font-medium text-white/60">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 space-y-4">
          <button
            onClick={() => {
              onClose();
              onOpenPackPro();
            }}
            className="w-full h-18 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs rounded-[2rem] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20"
          >
            <Rocket size={20} />
            M'aider avec le Pack Pro (25.000 FCFA)
          </button>

          <button
             onClick={() => window.open('https://www.facebook.com/pages/create', '_blank')}
             className="w-full h-14 bg-white/5 text-white/60 font-black uppercase tracking-widest text-[10px] rounded-[1.5rem] flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
          >
             Créer ma Page manuellement <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

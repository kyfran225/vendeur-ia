import React from "react";
import { createPortal } from "react-dom";
import { X, Sparkles, Check, Rocket, ShieldCheck, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { useBillingCurrency } from "@/hooks/useBillingCurrency";
import { convertCurrencyAmount } from "@vendeur-ia/core";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PackProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PackProModal({ isOpen, onClose }: PackProModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const currency = useBillingCurrency();

  if (!isOpen) return null;

  const handleBuy = async () => {
    onClose();
    navigate("/checkout?offer=pro&setup=EXPERT");
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-vendeur-bg border border-slate-200 dark:border-vendeur-emerald/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3.5 sm:space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto text-slate-900 dark:text-white">
        <button 
          onClick={onClose} 
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:text-white/30 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-1.5 pt-1">
          <div className="h-12 w-12 bg-emerald-50 dark:bg-vendeur-emerald/10 border border-emerald-200 dark:border-vendeur-emerald/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-vendeur-emerald">
            <Rocket size={24} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Pack Pro Clé en Main</h2>
          <p className="text-slate-500 dark:text-white/50 text-xs">On s'occupe de TOUT pour vous.</p>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "Abonnement Vendeur IA Pro Inclus",
              "Configuration API WhatsApp Meta",
              "Importation de votre catalogue",
              "Paramétrage IA sur-mesure",
              "Support VIP prioritaire 24h/7"
            ].map((text, i) => (
              <div key={i} className={cn("flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-white/[0.03] rounded-xl border border-slate-200 dark:border-white/5", i === 4 && "sm:col-span-2")}>
                <div className="h-5 w-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                  <Check size={12} className="font-bold" />
                </div>
                <span className="text-[11px] font-medium text-slate-800 dark:text-white/80">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40">Installation Clé en Main + Pro</p>
            <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-vendeur-emerald">
              45 000 {currency}
            </p>
          </div>

          <button
            onClick={handleBuy}
            className="w-full h-11 sm:h-12 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Rocket size={16} />
            Activer mon Pack Pro
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

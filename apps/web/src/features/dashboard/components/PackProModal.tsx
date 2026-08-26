import React from "react";
import { X, Sparkles, Check, Rocket, ShieldCheck, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { useBillingCurrency } from "@/hooks/useBillingCurrency";
import { convertCurrencyAmount } from "@vendeur-ia/core";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleBuy = async () => {
    onClose();
    navigate("/checkout?offer=pro&setup=EXPERT");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-vendeur-bg border border-vendeur-emerald/20 rounded-[3rem] p-8 md:p-12 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="text-center space-y-4">
          <div className="h-20 w-20 bg-vendeur-emerald/10 border border-vendeur-emerald/20 rounded-[2rem] flex items-center justify-center mx-auto">
            <Rocket className="text-vendeur-emerald" size={40} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Pack Pro Clé en Main</h2>
          <p className="text-white/50 text-lg">On s'occupe de TOUT pour vous.</p>
        </div>

        <div className="grid gap-4">
          {[
            "Abonnement Vendeur IA Pro Inclus",
            "Configuration de l'API WhatsApp Cloud officielle",
            "Importation de votre catalogue produits",
            "Paramétrage IA sur-mesure",
            "Support prioritaire 24h/7 sur WhatsApp"
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="h-6 w-6 rounded-full bg-vendeur-emerald flex items-center justify-center shrink-0">
                <Check size={14} className="text-vendeur-coal" />
              </div>
              <span className="text-sm font-medium text-white/80">{text}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Premier paiement (Installation + Pro)</p>
            <p className="text-3xl font-black text-vendeur-emerald">
              45 000 {currency}
            </p>
          </div>

          <button
            onClick={handleBuy}
            className="w-full h-18 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-sm rounded-[2rem] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20"
          >
            <Rocket size={24} />
            Activer mon Pack Pro
          </button>
        </div>
      </div>
    </div>
  );
}

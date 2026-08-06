import React, { useState } from "react";
import { X, Zap, Rocket, Check, ShieldCheck, Loader2, Server, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OffersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OffersModal({ isOpen, onClose }: OffersModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  const handlePayment = async (type: "ram_contribution" | "pack_pro") => {
    setLoading(type);
    try {
      const endpoint = type === "ram_contribution" ? "/api/commerce/activate-premium" : "/api/commerce/buy-pack-pro";
      const res = await apiClient.post(endpoint, {
        email: user?.email,
        type: type,
        userId: user?.id
      });

      if (res.data.access_code) {
        const paystack = new (window as any).PaystackPop();
        paystack.checkout({
          accessCode: res.data.access_code,
          onSuccess: (transaction: any) => {
            toast.success(type === "ram_contribution" ? "Contribution RAM validée ! 🚀" : "Pack Pro activé ! 🚀");
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            onClose();
          },
          onCancel: () => {
            toast.info("Paiement annulé");
          }
        });
      } else if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
      }
    } catch (err) {
      toast.error("Erreur lors de l'initialisation du paiement.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-[#0c0f0d] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 text-white/20 hover:text-white transition-colors bg-white/5 h-10 w-10 rounded-full flex items-center justify-center">
          <X size={20} />
        </button>

        {/* Option 1: RAM Contribution */}
        <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/5 space-y-8">
          <div className="space-y-4">
            <div className="h-16 w-16 bg-vendeur-emerald/10 rounded-2xl flex items-center justify-center text-vendeur-emerald">
              <Server size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Contribution RAM</h3>
              <p className="text-white/40 text-sm mt-1">Maintenance de votre session serveur.</p>
            </div>
          </div>

          <div className="space-y-4">
            <OfferFeature text="Session WhatsApp 24h/7 active" />
            <OfferFeature text="Utilisation du serveur partagé" />
            <OfferFeature text="Support standard par ticket" />
            <OfferFeature text="Mises à jour IA incluses" />
          </div>

          <div className="pt-4">
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-black text-vendeur-emerald">5 000</span>
              <span className="text-sm font-black text-white/40 uppercase tracking-widest">FCFA / mois</span>
            </div>

            <button
              onClick={() => handlePayment("ram_contribution")}
              disabled={!!loading}
              className="w-full h-16 bg-white text-vendeur-coal rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-vendeur-emerald transition-all active:scale-95 disabled:opacity-50"
            >
              {loading === "ram_contribution" ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
              Choisir cette offre
            </button>
          </div>
        </div>

        {/* Option 2: Pack Pro (Recommended) */}
        <div className="flex-1 p-8 md:p-12 bg-vendeur-emerald/5 space-y-8 relative">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0">
             <span className="bg-vendeur-emerald text-vendeur-coal text-[9px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-lg shadow-vendeur-emerald/20">
               Recommandé
             </span>
          </div>

          <div className="space-y-4 pt-4">
            <div className="h-16 w-16 bg-vendeur-emerald rounded-2xl flex items-center justify-center text-vendeur-coal shadow-xl shadow-vendeur-emerald/20">
              <Rocket size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Pack Pro Expert</h3>
              <p className="text-vendeur-emerald font-black text-xs uppercase tracking-widest">Accompagnement VIP</p>
            </div>
          </div>

          <div className="space-y-4">
            <OfferFeature text="Création Page Facebook Business" highlight />
            <OfferFeature text="Configuration API Meta Cloud" highlight />
            <OfferFeature text="Import Catalogue (20 produits)" highlight />
            <OfferFeature text="Formation IA & Vente (30min)" highlight />
            <OfferFeature text="Support VIP 24h/7 WhatsApp" highlight />
          </div>

          <div className="pt-4">
             <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-black text-white">25 000</span>
              <span className="text-sm font-black text-white/40 uppercase tracking-widest">FCFA (Unique)</span>
            </div>

            <button
              onClick={() => handlePayment("pack_pro")}
              disabled={!!loading}
              className="w-full h-16 bg-vendeur-emerald text-vendeur-coal rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-vendeur-emerald/20 disabled:opacity-50"
            >
              {loading === "pack_pro" ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              Activer mon Pack Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OfferFeature({ text, highlight = false }: { text: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("h-5 w-5 rounded-full flex items-center justify-center shrink-0", highlight ? "bg-vendeur-emerald" : "bg-white/10")}>
        <Check size={12} className={highlight ? "text-vendeur-coal" : "text-white/40"} />
      </div>
      <span className={cn("text-xs font-medium", highlight ? "text-white" : "text-white/60")}>{text}</span>
    </div>
  );
}

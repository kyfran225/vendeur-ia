import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";
import {
  CreditCard,
  Smartphone,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Check,
  Lock,
  Zap,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currency = useMerchantCurrency();
  const [loading, setLoading] = useState(false);

  const offerSlug = searchParams.get("offer") || "essential";
  const setupOption = searchParams.get("setup") || null;

  const { data: offers } = useQuery({
    queryKey: ["offers", currency],
    queryFn: async () => {
      const res = await apiClient.get(`/api/commerce/offers?currency=${currency}`);
      return res.data;
    }
  });

  const offer = offers?.find((o: any) => o.slug === offerSlug);

  const handlePayer = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post("/api/commerce/checkout", {
        offerSlug,
        email: user?.email,
        setupOption
      });

      if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        toast.error("Impossible de générer le lien de paiement.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Erreur de paiement");
    } finally {
      setLoading(false);
    }
  };

  if (!offer) return null;

  const setupFee = setupOption ? (offer.setupOptions.find((o: any) => o.type === setupOption)?.price || 0) : 0;
  const totalToday = offer.monthlyPrice + setupFee;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 animate-in slide-in-from-right-4 duration-500">
      <div className="max-w-4xl mx-auto space-y-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 hover:text-white transition-all"
        >
          <ArrowLeft size={14} /> Retour aux offres
        </button>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Left: Summary */}
          <div className="md:col-span-3 space-y-10">
            <div className="space-y-4">
              <h1 className="text-4xl font-black uppercase tracking-tighter italic">Votre offre</h1>
              <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-6 rounded-3xl">
                <div className="h-12 w-12 bg-vendeur-emerald/10 rounded-2xl flex items-center justify-center text-vendeur-emerald">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">{offer.name}</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{offer.monthlyPrice.toLocaleString()} {currency} / mois</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-white/30 tracking-widest border-b border-white/5 pb-2">Ce qui est inclus</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {offer.features.slice(0, 6).map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check size={14} className="text-vendeur-emerald" />
                    <span className="text-[11px] font-bold text-white/60">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {setupOption === 'EXPERT' && (
              <div className="p-6 bg-vendeur-emerald/5 border border-vendeur-emerald/10 rounded-3xl flex items-center gap-4">
                <Sparkles className="text-vendeur-emerald" size={24} />
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-vendeur-emerald">Installation Pro Expert</h4>
                  <p className="text-[10px] font-bold text-vendeur-emerald/60 uppercase tracking-widest">Paiement unique de 25 000 {currency}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Payment Recap */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-vendeur-coal border border-white/10 p-8 rounded-[2.5rem] shadow-2xl space-y-8">
              <h2 className="text-xl font-black uppercase tracking-tight">Récapitulatif</h2>

              <div className="space-y-4">
                <div className="flex justify-between text-[11px] font-bold uppercase text-white/40">
                  <span>Abonnement</span>
                  <span className="text-white">{offer.monthlyPrice.toLocaleString()} {offer.currency || currency}</span>
                </div>
                {setupFee > 0 && (
                   <div className="flex justify-between text-[11px] font-bold uppercase text-white/40">
                    <span>Installation Expert</span>
                    <span className="text-white">{setupFee.toLocaleString()} {offer.currency || currency}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-white/5 flex flex-col items-start gap-1">
                  <span className="text-[10px] font-black uppercase text-white tracking-widest opacity-40">Total aujourd'hui</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl md:text-6xl font-black italic tracking-tighter text-vendeur-emerald">
                      {totalToday.toLocaleString()}
                    </span>
                    <span className="text-base font-black italic text-vendeur-emerald/60 tracking-tight uppercase">
                      {offer.currency || currency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handlePayer}
                  disabled={loading}
                  className="w-full h-16 bg-white text-vendeur-coal rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-vendeur-emerald transition-all active:scale-95 shadow-xl disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
                  Payer
                </button>
                <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase text-white/20 tracking-widest">
                  <Lock size={10} /> Paiement sécurisé par Paystack
                </div>
              </div>

              <div className="flex justify-center pt-4 border-t border-white/5 opacity-40 hover:opacity-100 transition-opacity">
                 <img
                   src="https://nigerialogos.com/logos/paystack/paystack.svg"
                   alt="Paystack Official Partner"
                   className="h-6 w-auto grayscale invert"
                 />
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 text-white/40 italic text-[10px]">
               <ShieldCheck size={16} className="shrink-0 mt-0.5" />
               <p>Vous pourrez annuler ou modifier votre abonnement à tout moment depuis vos paramètres.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

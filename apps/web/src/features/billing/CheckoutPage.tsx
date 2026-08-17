import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";
import {
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  Check,
  Lock,
  Zap,
  Sparkles,
  Tag,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function CheckoutPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currency = useMerchantCurrency();
  const [loading, setLoading] = useState(false);

  const offerSlug = searchParams.get("offer") || "essential";
  const setupOption = searchParams.get("setup") || null;
  const initialInterval = searchParams.get("interval") === "yearly" ? "yearly" : "monthly";
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(initialInterval);

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
        setupOption,
        billingInterval
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

  const isYearly = billingInterval === "yearly";
  const monthlyPrice = offer.monthlyPrice;
  const yearlyPrice = offer.yearlyPrice || Math.round(monthlyPrice * 10);
  const planPrice = isYearly ? yearlyPrice : monthlyPrice;

  const setupFee = setupOption ? (offer.setupOptions?.find((o: any) => o.type === setupOption)?.price || 0) : 0;
  const totalToday = planPrice + setupFee;
  const savings = isYearly ? (monthlyPrice * 12 - yearlyPrice) : 0;

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-12 animate-in slide-in-from-right-4 duration-500">
      <div className="max-w-4xl mx-auto space-y-8 sm:space-y-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-black uppercase text-white/40 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft size={16} /> Retour aux offres
        </button>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12">
          {/* Left: Summary */}
          <div className="md:col-span-3 space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter italic">Récapitulatif de commande</h1>

              {/* Offer Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-vendeur-coal border border-white/10 p-5 sm:p-6 rounded-3xl">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-vendeur-emerald/10 border border-vendeur-emerald/20 rounded-2xl flex items-center justify-center text-vendeur-emerald shrink-0">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">{offer.name}</h3>
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
                      {isYearly ? `${yearlyPrice.toLocaleString()} ${offer.currency || currency} / an (12 mois)` : `${monthlyPrice.toLocaleString()} ${offer.currency || currency} / mois`}
                    </p>
                  </div>
                </div>

                {/* Inline Interval Switcher */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setBillingInterval("monthly");
                      setSearchParams({ offer: offerSlug, ...(setupOption ? { setup: setupOption } : {}), interval: "monthly" });
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                      billingInterval === "monthly"
                        ? "bg-white text-vendeur-coal shadow"
                        : "text-white/40 hover:text-white"
                    )}
                  >
                    Mensuel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBillingInterval("yearly");
                      setSearchParams({ offer: offerSlug, ...(setupOption ? { setup: setupOption } : {}), interval: "yearly" });
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer",
                      billingInterval === "yearly"
                        ? "bg-vendeur-emerald text-vendeur-coal shadow"
                        : "text-white/40 hover:text-white"
                    )}
                  >
                    <span>Annuel</span>
                    <span className="text-[8px] bg-vendeur-coal text-vendeur-emerald px-1.5 py-0.2 rounded font-black">-17%</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Savings Callout if Yearly */}
            {isYearly && savings > 0 && (
              <div className="p-4 rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 flex items-center gap-3 animate-in fade-in">
                <Tag className="text-vendeur-emerald shrink-0" size={18} />
                <p className="text-xs font-bold text-vendeur-emerald leading-relaxed">
                  Excellent choix ! Vous économisez <strong>{savings.toLocaleString()} {offer.currency || currency}</strong> (soit 2 mois complets offerts).
                </p>
              </div>
            )}

            {/* Features List */}
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-white/40 tracking-widest border-b border-white/5 pb-2">
                Inclus avec votre Vendeur IA
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {offer.features?.map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="h-4 w-4 rounded-full bg-vendeur-emerald/20 flex items-center justify-center text-vendeur-emerald shrink-0">
                      <Check size={11} strokeWidth={3} />
                    </div>
                    <span className="text-xs font-bold text-white/70">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Setup Option Callout */}
            {setupOption === 'EXPERT' && (
              <div className="p-5 bg-vendeur-coal border border-vendeur-emerald/30 rounded-3xl flex items-center gap-4">
                <div className="h-10 w-10 bg-vendeur-emerald/10 rounded-xl flex items-center justify-center text-vendeur-emerald shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight text-white">Installation Pro Dédiée (Clé en main)</h4>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-0.5">
                    Configuration WhatsApp & Import Catalogue inclus ({setupFee.toLocaleString()} {offer.currency || currency})
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Payment Recap */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-vendeur-coal border border-white/10 p-6 sm:p-8 rounded-3xl md:rounded-[2.5rem] shadow-2xl space-y-6">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">Facturation</h2>

              <div className="space-y-3.5 text-xs font-bold">
                <div className="flex justify-between uppercase text-white/50">
                  <span>Abonnement {isYearly ? "(12 mois)" : "(1 mois)"}</span>
                  <span className="text-white font-mono">{planPrice.toLocaleString()} {offer.currency || currency}</span>
                </div>

                {isYearly && savings > 0 && (
                  <div className="flex justify-between uppercase text-vendeur-emerald">
                    <span>Remise Annuelle (2 mois offerts)</span>
                    <span className="font-mono">-{savings.toLocaleString()} {offer.currency || currency}</span>
                  </div>
                )}

                {setupFee > 0 && (
                  <div className="flex justify-between uppercase text-white/50">
                    <span>Installation Expert</span>
                    <span className="text-white font-mono">{setupFee.toLocaleString()} {offer.currency || currency}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10 flex flex-col items-start gap-1">
                  <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Total aujourd'hui</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black italic tracking-tighter text-vendeur-emerald font-mono">
                      {totalToday.toLocaleString()}
                    </span>
                    <span className="text-sm font-black italic text-vendeur-emerald/60 tracking-tight uppercase">
                      {offer.currency || currency}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={handlePayer}
                  disabled={loading}
                  className="w-full h-14 bg-vendeur-emerald text-vendeur-coal rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
                  <span>{loading ? "Génération du lien..." : `Payer ${totalToday.toLocaleString()} ${offer.currency || currency}`}</span>
                </button>

                <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase text-white/30 tracking-wider">
                  <Lock size={11} /> Paiement Mobile Money & Carte sécurisé
                </div>
              </div>

              <div className="flex justify-center pt-3 border-t border-white/5 opacity-50 hover:opacity-100 transition-opacity">
                 <img
                   src="https://nigerialogos.com/logos/paystack/paystack.svg"
                   alt="Paystack Official Partner"
                   className="h-5 w-auto grayscale invert"
                 />
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-white/50 text-[11px] leading-relaxed">
               <ShieldCheck size={18} className="text-vendeur-emerald shrink-0 mt-0.5" />
               <p>Sans engagement. Vous conservez le contrôle total et pouvez ajuster ou annuler votre abonnement à tout moment depuis vos paramètres.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

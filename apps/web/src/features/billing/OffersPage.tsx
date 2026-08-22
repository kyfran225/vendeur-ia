import React, { useState } from "react";
import { Zap, Rocket, Check, Sparkles, Server, ArrowRight, ArrowLeft, ShieldCheck, Tag, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MetaHead } from "@/components/seo/MetaHead";
import { SITE_CONFIG } from "@/lib/seoConfig";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { useAuthStore } from "@/stores/authStore";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function OffersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromOnboarding = searchParams.get("from") === "onboarding";
  const currency = useMerchantCurrency();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("yearly");

  const { data: offers, isLoading, isError } = useQuery({
    queryKey: ["offers", currency],
    queryFn: async () => {
      const res = await apiClient.get(`/api/commerce/offers?currency=${currency}`);
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <VendeurIALoader fullscreen size="xl" label="Chargement des formules..." />
    );
  }

  if (isError) {
    return (
      <div className="min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-black uppercase mb-2">Erreur de chargement</h2>
        <p className="text-white/40 mb-8 max-w-sm">Impossible de récupérer les offres. Veuillez vérifier votre connexion ou réessayer plus tard.</p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white text-black font-black uppercase rounded-xl">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-black text-white p-4 sm:p-6 md:p-12 animate-in fade-in duration-700">
      <MetaHead
        title="Offres & Tarifs | Vendeur IA WhatsApp Commercial"
        description="Découvrez nos formules Vendeur IA pour automatiser vos ventes sur WhatsApp Business. Tarifs transparents, sans engagement avec période d'essai."
        keywords={['tarifs vendeur ia', 'prix vendeur ia whatsapp', 'offre commerciale ia', 'abonnement vendeuria']}
        canonicalUrl={`${SITE_CONFIG.baseUrl}/offers`}
      />
      <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/settings?tab=billing");
            }
          }}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white/50 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-vendeur-emerald text-[10px] font-black uppercase tracking-widest">
            <Sparkles size={13} />
            <span>Tarifs Transparents & Sans Surprise</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight italic text-white">
            Choisissez votre <span className="text-vendeur-emerald">Vendeur IA</span>
          </h1>

          <p className="text-white/60 font-medium text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Activez votre commercial IA autonome 24h/24. Changez ou ajustez votre forfait à tout moment depuis vos paramètres.
          </p>

          {/* Monthly / Yearly Billing Toggle */}
          <div className="pt-3 flex items-center justify-center">
            <div className="inline-flex items-center p-1.5 rounded-2xl bg-vendeur-coal border border-white/10 shadow-2xl">
              <button
                type="button"
                onClick={() => setBillingInterval("monthly")}
                className={cn(
                  "px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                  billingInterval === "monthly"
                    ? "bg-white text-vendeur-coal shadow-lg"
                    : "text-white/40 hover:text-white"
                )}
              >
                Mensuel
              </button>

              <button
                type="button"
                onClick={() => setBillingInterval("yearly")}
                className={cn(
                  "px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer",
                  billingInterval === "yearly"
                    ? "bg-vendeur-emerald text-vendeur-coal shadow-lg shadow-vendeur-emerald/20"
                    : "text-white/40 hover:text-white"
                )}
              >
                <span>Annuel</span>
                <span className={cn(
                  "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tight",
                  billingInterval === "yearly"
                    ? "bg-vendeur-coal text-vendeur-emerald"
                    : "bg-vendeur-emerald/20 text-vendeur-emerald"
                )}>
                  2 mois offerts
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          {offers?.map((offer: any) => (
            <OfferCard
              key={offer._id || offer.slug || offer.id}
              offer={offer}
              currency={currency}
              billingInterval={billingInterval}
              onSelect={() => navigate(`/checkout?offer=${offer.slug}&interval=${billingInterval}`)}
            />
          ))}
        </div>

        {/* Setup Service Option */}
        <div className="bg-vendeur-coal border border-white/10 p-6 sm:p-8 md:p-12 rounded-3xl md:rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8 relative overflow-hidden group hover:border-vendeur-emerald/30 transition-all shadow-2xl">
          <div className="space-y-3 sm:space-y-4 relative z-10 text-left">
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
              Besoin que nous configurions tout pour vous ?
            </h3>
            <p className="text-white/60 font-bold text-xs sm:text-sm">
              Installation Pro Expert avec notre équipe dédiée (clé en main).
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-vendeur-emerald/10 text-vendeur-emerald border border-vendeur-emerald/20">✓ Configuration WhatsApp</span>
              <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-vendeur-emerald/10 text-vendeur-emerald border border-vendeur-emerald/20">✓ Import Catalogue</span>
              <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-vendeur-emerald/10 text-vendeur-emerald border border-vendeur-emerald/20">✓ Personnalisation IA</span>
            </div>
          </div>

          <button
             onClick={() => navigate(`/checkout?offer=pro&setup=EXPERT&interval=${billingInterval}`)}
             className="w-full md:w-auto h-14 px-6 sm:px-8 bg-white hover:bg-vendeur-emerald text-vendeur-coal rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-xl shrink-0 cursor-pointer"
          >
            <span>En savoir plus</span>
            <ArrowRight size={16} />
          </button>

          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-64 w-64 bg-vendeur-emerald/5 blur-[100px] rounded-full group-hover:bg-vendeur-emerald/10 transition-colors pointer-events-none" />
        </div>

        {/* Skip / Discover Dashboard First Link */}
        <div className="pt-4 pb-8 flex flex-col items-center justify-center gap-2 text-center">
          <button
            type="button"
            onClick={async () => {
              try {
                await apiClient.post("/api/commerce/merchant", { onboardingCompleted: true });
                useAuthStore.getState().updateUser({ onboardingCompleted: true });
              } catch (err) {
                console.warn("[Offers] Failed to set onboardingCompleted:", err);
              }
              navigate("/dashboard");
            }}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white/50 hover:text-vendeur-emerald transition-colors py-2 px-4 rounded-xl hover:bg-white/5 cursor-pointer"
          >
            <span>{fromOnboarding ? "Accéder à mon tableau de bord d'abord (Découvrir mon espace)" : "Accéder directement à mon tableau de bord"}</span>
            <ArrowRight size={15} />
          </button>
          <p className="text-[10px] text-white/30 font-medium">
            Vous pourrez activer ou modifier votre formule à tout moment depuis vos paramètres.
          </p>
        </div>
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  currency,
  billingInterval,
  onSelect
}: {
  offer: any;
  currency: string;
  billingInterval: "monthly" | "yearly";
  onSelect: () => void;
}) {
  const isPro = offer.slug === 'pro';
  const curr = offer.currency || currency;

  const monthlyPrice = offer.monthlyPrice;
  const yearlyPrice = offer.yearlyPrice || Math.round(monthlyPrice * 10);
  const isYearly = billingInterval === "yearly";

  // Monthly equivalent when paying yearly
  const monthlyEquivalent = isYearly ? Math.round(yearlyPrice / 12) : monthlyPrice;
  const savingsAmount = isYearly ? (monthlyPrice * 12 - yearlyPrice) : 0;

  return (
    <div className={cn(
      "relative bg-vendeur-coal border rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col justify-between group transition-all duration-300",
      isPro ? "border-vendeur-emerald/50 shadow-[0_15px_40px_rgba(16,185,129,0.1)]" : "border-white/10 hover:border-white/20"
    )}>
      {isPro && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-vendeur-emerald text-vendeur-coal text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-wider shadow-xl">
          ⭐ Recommandé
        </div>
      )}

      <div className="space-y-6 sm:space-y-8">
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-105",
            isPro ? "bg-vendeur-emerald text-vendeur-coal" : "bg-white/5 text-white/40 border border-white/5"
          )}>
            {isPro ? <Rocket size={26} /> : <Zap size={26} />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white truncate">{offer.name}</h3>
            <p className="text-[10px] font-black uppercase text-white/40 tracking-wider truncate mt-0.5">{offer.slug === 'pro' ? 'Expérience complète & illimitée' : 'Lancement rapide'}</p>
          </div>
        </div>

        <div className="space-y-3">
          {offer.features?.map((feature: string, i: number) => (
            <div key={i} className="flex items-start gap-3">
              <div className={cn(
                "h-4 w-4 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                isPro ? "bg-vendeur-emerald/20 text-vendeur-emerald" : "bg-white/5 text-white/30"
              )}>
                <Check size={11} strokeWidth={3} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white/80 leading-tight">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-8 sm:pt-10 mt-6 border-t border-white/5 space-y-4">
        {/* Pricing Area */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-5xl font-black italic tracking-tight text-white font-mono">
              {monthlyEquivalent.toLocaleString()}
            </span>
            <span className="text-xs font-black uppercase text-white/40 tracking-wider">
              {curr} / MOIS
            </span>
          </div>

          {isYearly ? (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-[11px] font-bold text-white/50">
                Facturé annuellement {yearlyPrice.toLocaleString()} {curr}
              </span>
              {savingsAmount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-vendeur-emerald bg-vendeur-emerald/10 px-2 py-0.5 rounded-full border border-vendeur-emerald/20">
                  <Tag size={10} /> -{savingsAmount.toLocaleString()} {curr} d'économie
                </span>
              )}
            </div>
          ) : (
            <p className="text-[11px] font-medium text-white/40">
              Facturation mensuelle sans engagement
            </p>
          )}
        </div>

        <button
          onClick={onSelect}
          className={cn(
            "w-full h-14 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-xl cursor-pointer",
            isPro
              ? "bg-vendeur-emerald text-vendeur-coal hover:scale-[1.02] shadow-vendeur-emerald/25"
              : "bg-white text-vendeur-coal hover:bg-vendeur-emerald hover:text-vendeur-coal"
          )}
        >
          <span>{isYearly ? `Souscrire à l'Annuel (${isPro ? 'Pro' : 'Essentiel'})` : (isPro ? 'Activer Forfait Pro' : 'Commencer avec ce Forfait')}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

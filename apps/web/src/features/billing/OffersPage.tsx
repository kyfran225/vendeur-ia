import React, { useState } from "react";
import { Zap, Rocket, Check, ArrowRight, ArrowLeft, Tag, AlertCircle } from "lucide-react";
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
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-black text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-black uppercase mb-2">Erreur de chargement</h2>
        <p className="text-slate-600 dark:text-white/40 mb-8 max-w-sm">Impossible de récupérer les offres. Veuillez vérifier votre connexion ou réessayer plus tard.</p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-900 text-white dark:bg-white dark:text-black font-black uppercase rounded-xl cursor-pointer">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#07100d] text-slate-900 dark:text-white p-4 sm:p-6 md:p-12 animate-in fade-in duration-700 transition-colors duration-200">
      <MetaHead
        title="Offres & Tarifs | Vendeur IA WhatsApp Commercial"
        description="Découvrez nos formules Vendeur IA pour automatiser vos ventes sur WhatsApp Business. Tarifs transparents, sans engagement avec période d'essai."
        keywords={['tarifs vendeur ia', 'prix vendeur ia whatsapp', 'offre commerciale ia', 'abonnement vendeuria']}
        canonicalUrl={`${SITE_CONFIG.baseUrl}/offers`}
      />
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/settings?tab=billing");
              }
            }}
            className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:text-white/50 dark:hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft size={16} /> Retour
          </button>
          <ThemeToggle />
        </div>

        <div className="text-center space-y-3 sm:space-y-4 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight italic text-slate-900 dark:text-white leading-tight">
            Choisissez votre <span className="text-emerald-600 dark:text-vendeur-emerald">Vendeur IA</span>
          </h1>

          <p className="text-slate-600 dark:text-white/70 font-medium text-sm sm:text-base max-w-xl mx-auto leading-relaxed px-2">
            Activez votre commercial IA autonome 24h/24. Changez ou ajustez votre forfait à tout moment depuis vos paramètres.
          </p>

          {/* Monthly / Yearly Billing Toggle */}
          <div className="pt-2 sm:pt-3 flex items-center justify-center">
            <div className="inline-flex items-center p-1 sm:p-1.5 rounded-2xl bg-slate-200/80 dark:bg-vendeur-coal border border-slate-300/80 dark:border-white/10 shadow-lg">
              <button
                type="button"
                onClick={() => setBillingInterval("monthly")}
                className={cn(
                  "h-11 sm:h-12 min-h-[44px] sm:min-h-[48px] px-5 sm:px-7 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center shrink-0",
                  billingInterval === "monthly"
                    ? "bg-white text-slate-900 dark:text-vendeur-coal shadow-md"
                    : "text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                Mensuel
              </button>

              <button
                type="button"
                onClick={() => setBillingInterval("yearly")}
                className={cn(
                  "h-11 sm:h-12 min-h-[44px] sm:min-h-[48px] px-5 sm:px-7 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0",
                  billingInterval === "yearly"
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black"
                    : "text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <span>Annuel</span>
                <span className={cn(
                  "text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-black uppercase tracking-tight",
                  billingInterval === "yearly"
                    ? "bg-slate-950 text-emerald-400"
                    : "bg-emerald-500/20 text-emerald-700 dark:text-vendeur-emerald"
                )}>
                  2 mois offerts
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 items-stretch">
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
        <div className="bg-slate-900 dark:bg-vendeur-coal border border-slate-800 dark:border-white/10 p-5 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-2xl text-white">
          <div className="space-y-2.5 sm:space-y-4 relative z-10 text-left">
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
              Besoin que nous configurions tout pour vous ?
            </h3>
            <p className="text-white/70 font-medium text-sm sm:text-base">
              Installation Pro Expert avec notre équipe dédiée (clé en main).
            </p>
            <div className="flex flex-wrap gap-2 pt-0.5">
              <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">✓ WhatsApp</span>
              <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">✓ Import Catalogue</span>
              <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">✓ Personnalisation IA</span>
            </div>
          </div>

          <button
             onClick={() => navigate(`/checkout?offer=pro&setup=EXPERT&interval=${billingInterval}`)}
             className="w-full md:w-auto h-12 sm:h-14 px-6 sm:px-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-xl shrink-0 cursor-pointer"
          >
            <span>En savoir plus</span>
            <ArrowRight size={16} />
          </button>

          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-64 w-64 bg-emerald-500/10 blur-[100px] rounded-full group-hover:bg-emerald-500/15 transition-colors pointer-events-none" />
        </div>

        {/* Skip / Discover Dashboard First Link */}
        <div className="pt-2 pb-6 flex flex-col items-center justify-center gap-1.5 text-center">
          <button
            type="button"
            onClick={async () => {
              const currentUser = useAuthStore.getState().user;
              if (currentUser) {
                try {
                  await apiClient.post("/api/commerce/merchant", { onboardingCompleted: true });
                  useAuthStore.getState().updateUser({ onboardingCompleted: true });
                } catch (err) {
                  console.warn("[Offers] Failed to set onboardingCompleted:", err);
                }
                navigate("/dashboard");
              } else {
                navigate("/");
              }
            }}
            className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-slate-600 hover:text-emerald-600 dark:text-white/60 dark:hover:text-vendeur-emerald transition-colors py-2 px-3 sm:px-4 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
          >
            <span>{fromOnboarding ? "Accéder à mon tableau de bord d'abord" : (useAuthStore.getState().user ? "Accéder directement à mon tableau de bord" : "Découvrir la plateforme")}</span>
            <ArrowRight size={16} />
          </button>
          <p className="text-xs text-slate-500 dark:text-white/40 font-medium">
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
      "relative bg-white dark:bg-vendeur-coal border rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-9 flex flex-col justify-between group transition-all duration-300 text-slate-900 dark:text-white shadow-lg",
      isPro ? "border-emerald-500/50 shadow-[0_15px_40px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30" : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
    )}>
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 text-[11px] sm:text-xs font-black uppercase px-4 py-1 rounded-full tracking-wider shadow-xl">
          ⭐ Recommandé
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className={cn(
            "h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-105",
            isPro ? "bg-emerald-500 text-slate-950 font-black" : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/40 border border-slate-200 dark:border-white/5"
          )}>
            {isPro ? <Rocket size={24} className="sm:w-7 sm:h-7" /> : <Zap size={24} className="sm:w-7 sm:h-7" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">{offer.name}</h3>
            <p className="text-xs sm:text-sm font-bold uppercase text-slate-500 dark:text-white/50 tracking-wider truncate mt-0.5">{offer.slug === 'pro' ? 'Expérience complète & illimitée' : 'Lancement rapide'}</p>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-3.5">
          {offer.features?.map((feature: string, i: number) => (
            <div key={i} className="flex items-start gap-3">
              <div className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                isPro ? "bg-emerald-500/15 text-emerald-700 dark:text-vendeur-emerald border border-emerald-500/25" : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/50 border border-slate-200 dark:border-white/10"
              )}>
                <Check size={12} strokeWidth={2.5} />
              </div>
              <span className="text-[15px] sm:text-base font-medium text-slate-800 dark:text-white/90 leading-snug">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-5 sm:pt-8 mt-5 sm:mt-6 border-t border-slate-100 dark:border-white/5 space-y-3.5 sm:space-y-4">
        {/* Pricing Area */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-5xl font-black italic tracking-tight text-slate-900 dark:text-white font-mono">
              {monthlyEquivalent.toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm font-black uppercase text-slate-500 dark:text-white/50 tracking-wider">
              {curr} / MOIS
            </span>
          </div>

          {isYearly ? (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-white/60">
                Facturé annuellement {yearlyPrice.toLocaleString()} {curr}
              </span>
              {savingsAmount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-vendeur-emerald bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Tag size={11} /> -{savingsAmount.toLocaleString()} {curr} d'économie
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-white/50">
              Facturation mensuelle sans engagement
            </p>
          )}
        </div>

        <button
          onClick={onSelect}
          className={cn(
            "w-full h-13 sm:h-14 min-h-[52px] sm:min-h-[56px] rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg cursor-pointer shrink-0",
            isPro
              ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 hover:scale-[1.02] shadow-emerald-500/25"
              : "bg-slate-900 hover:bg-emerald-500 text-white hover:text-slate-950 dark:bg-white dark:hover:bg-emerald-400 dark:text-slate-950"
          )}
        >
          <span>{isYearly ? `Souscrire à l'Annuel (${isPro ? 'Pro' : 'Essentiel'})` : (isPro ? 'Activer Forfait Pro' : 'Commencer avec ce Forfait')}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

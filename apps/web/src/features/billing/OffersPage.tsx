import React from "react";
import { Zap, Rocket, Check, Sparkles, Server, ArrowRight, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNavigate } from "react-router-dom";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { MetaHead } from "@/components/seo/MetaHead";
import { SITE_CONFIG } from "@/lib/seoConfig";

export function OffersPage() {
  const navigate = useNavigate();
  const currency = useMerchantCurrency();

  const { data: offers, isLoading } = useQuery({
    queryKey: ["offers", currency],
    queryFn: async () => {
      const res = await apiClient.get(`/api/commerce/offers?currency=${currency}`);
      return res.data;
    }
  });

  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="h-12 w-12 border-4 border-vendeur-emerald border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-12 animate-in fade-in duration-700">
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

        <div className="text-center space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight italic">
            Choisissez votre <span className="text-vendeur-emerald">Vendeur IA</span>
          </h1>
          <p className="text-white/50 font-bold uppercase tracking-wider text-xs sm:text-sm max-w-xl mx-auto">
            Démarrez simplement. Vous pouvez ajuster ou changer votre offre à tout moment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 items-stretch">
          {offers?.map((offer: any) => (
            <OfferCard
              key={offer._id || offer.slug || offer.id}
              offer={offer}
              currency={currency}
              onSelect={() => navigate(`/checkout?offer=${offer.slug}`)}
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
             onClick={() => navigate('/checkout?offer=pro&setup=EXPERT')}
             className="w-full md:w-auto h-13 sm:h-14 px-6 sm:px-8 bg-white hover:bg-vendeur-emerald text-vendeur-coal rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-xl shrink-0 cursor-pointer"
          >
            <span>En savoir plus</span>
            <ArrowRight size={16} />
          </button>

          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-64 w-64 bg-vendeur-emerald/5 blur-[100px] rounded-full group-hover:bg-vendeur-emerald/10 transition-colors pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

function OfferCard({ offer, currency, onSelect }: { offer: any, currency: string, onSelect: () => void }) {
  const isPro = offer.slug === 'pro';

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
          {offer.features.map((feature: string, i: number) => (
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

      <div className="pt-8 sm:pt-10 mt-6 border-t border-white/5">
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-3xl sm:text-5xl font-black italic tracking-tight text-white font-mono">{offer.monthlyPrice.toLocaleString()}</span>
          <span className="text-xs font-black uppercase text-white/40 tracking-wider">{offer.currency || currency} / MOIS</span>
        </div>

        <button
          onClick={onSelect}
          className={cn(
            "w-full h-13 sm:h-15 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-xl cursor-pointer",
            isPro
              ? "bg-vendeur-emerald text-vendeur-coal hover:scale-[1.02] shadow-vendeur-emerald/25"
              : "bg-white text-vendeur-coal hover:bg-vendeur-emerald hover:text-vendeur-coal"
          )}
        >
          <span>{isPro ? 'Activer Forfait Pro' : 'Commencer avec ce Forfait'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

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

export function OffersPage() {
  const navigate = useNavigate();
  const currency = useMerchantCurrency();

  const { data: offers, isLoading } = useQuery({
    queryKey: ["offers"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/offers");
      return res.data;
    }
  });

  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="h-12 w-12 border-4 border-vendeur-emerald border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto space-y-12">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-[10px] font-black uppercase text-white/30 hover:text-white transition-all"
        >
          <ArrowLeft size={14} /> Retour au Dashboard
        </button>

        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic">
            Choisissez votre <span className="text-vendeur-emerald">Vendeur IA</span>
          </h1>
          <p className="text-white/40 font-black uppercase tracking-widest text-xs md:text-sm">
            Commencez simplement. Vous pourrez changer d'offre plus tard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
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
        <div className="bg-vendeur-coal border border-white/5 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group hover:border-vendeur-emerald/20 transition-all">
          <div className="space-y-4 relative z-10 text-center md:text-left">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-white">
              Besoin que nous installions tout pour vous ?
            </h3>
            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
              Installation Pro Expert, 25 000 {currency}, une seule fois.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <span className="text-[9px] font-black uppercase text-vendeur-emerald/60">✓ Configuration WhatsApp</span>
              <span className="text-[9px] font-black uppercase text-vendeur-emerald/60">✓ Import Catalogue</span>
              <span className="text-[9px] font-black uppercase text-vendeur-emerald/60">✓ Formation IA</span>
            </div>
          </div>

          <button
             onClick={() => navigate('/checkout?offer=pro&setup=EXPERT')}
             className="h-16 px-8 bg-white text-vendeur-coal rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-vendeur-emerald transition-all active:scale-95 shadow-xl whitespace-nowrap"
          >
            En savoir plus
            <ArrowRight size={16} />
          </button>

          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-64 w-64 bg-vendeur-emerald/5 blur-[100px] rounded-full group-hover:bg-vendeur-emerald/10 transition-colors" />
        </div>
      </div>
    </div>
  );
}

function OfferCard({ offer, currency, onSelect }: { offer: any, currency: string, onSelect: () => void }) {
  const isPro = offer.slug === 'pro';

  return (
    <div className={cn(
      "relative bg-vendeur-coal border border-white/5 rounded-[3rem] p-8 md:p-12 flex flex-col justify-between group transition-all duration-500",
      isPro ? "border-vendeur-emerald/20 shadow-[0_20px_60px_rgba(16,185,129,0.05)]" : "hover:border-white/10"
    )}>
      {isPro && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-vendeur-emerald text-vendeur-coal text-[10px] font-black uppercase px-6 py-2 rounded-full tracking-widest shadow-xl">
          Recommandé
        </div>
      )}

      <div className="space-y-10">
        <div className="flex items-center gap-5">
          <div className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:rotate-6",
            isPro ? "bg-vendeur-emerald text-vendeur-coal" : "bg-white/5 text-white/40"
          )}>
            {isPro ? <Rocket size={28} /> : <Zap size={28} />}
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-white">{offer.name}</h3>
            <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mt-1 italic">{offer.slug === 'pro' ? 'Expérience avancée' : 'Lancement rapide'}</p>
          </div>
        </div>

        <div className="space-y-4">
          {offer.features.map((feature: string, i: number) => (
            <div key={i} className="flex items-center gap-4">
              <div className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                isPro ? "bg-vendeur-emerald/20 text-vendeur-emerald" : "bg-white/5 text-white/20"
              )}>
                <Check size={12} />
              </div>
              <span className="text-xs font-bold text-white/60 tracking-tight">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-12">
        <div className="flex items-baseline gap-2 mb-8">
          <span className="text-5xl font-black italic tracking-tighter text-white">{offer.monthlyPrice.toLocaleString()}</span>
          <span className="text-xs font-black uppercase text-white/20 tracking-widest">{currency} / MOIS</span>
        </div>

        <button
          onClick={onSelect}
          className={cn(
            "w-full h-20 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl",
            isPro ? "bg-vendeur-emerald text-vendeur-coal hover:scale-[1.02] shadow-vendeur-emerald/20" : "bg-white text-vendeur-coal hover:bg-vendeur-emerald shadow-white/5"
          )}
        >
          {isPro ? 'Choisir Pro' : 'Commencer'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

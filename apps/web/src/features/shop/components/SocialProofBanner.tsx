import React from "react";
import { ShieldCheck, Clock, Truck, CheckCircle2 } from "lucide-react";

interface SocialProofBannerProps {
  merchant: any;
  productCount: number;
}

export function SocialProofBanner({ merchant, productCount }: SocialProofBannerProps) {
  const city = merchant.city || "Abidjan";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
      
      {/* Pillar 1: Official Verified Merchant */}
      <div className="p-2.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-2.5 sm:gap-3 hover:border-vendeur-emerald/20 transition-all">
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-vendeur-emerald/20 text-vendeur-emerald flex items-center justify-center shrink-0 shadow-md shadow-vendeur-emerald/10">
          <ShieldCheck size={17} className="sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-white leading-tight">
            Vendeur Vérifié
          </p>
          <p className="text-[9px] sm:text-[10px] text-vendeur-emerald font-bold leading-tight mt-0.5">
            Boutique Officielle
          </p>
        </div>
      </div>

      {/* Pillar 2: 24/7 AI Instant Support */}
      <div className="p-2.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-2.5 sm:gap-3 hover:border-sky-500/20 transition-all">
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/10">
          <Clock size={17} className="sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-white leading-tight">
            Réponse Directe
          </p>
          <p className="text-[9px] sm:text-[10px] text-sky-400 font-bold leading-tight mt-0.5">
            Assistance 24h/7
          </p>
        </div>
      </div>

      {/* Pillar 3: Fast Local Delivery */}
      <div className="p-2.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-2.5 sm:gap-3 hover:border-amber-500/20 transition-all">
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/10">
          <Truck size={17} className="sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-white leading-tight">
            Livraison Rapide
          </p>
          <p className="text-[9px] sm:text-[10px] text-amber-400 font-bold leading-tight mt-0.5">
            {city} &amp; Expédition
          </p>
        </div>
      </div>

      {/* Pillar 4: Secure Payments */}
      <div className="p-2.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-2.5 sm:gap-3 hover:border-emerald-500/20 transition-all">
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/10">
          <CheckCircle2 size={17} className="sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-white leading-tight">
            Paiement Garanti
          </p>
          <p className="text-[9px] sm:text-[10px] text-emerald-400 font-bold leading-tight mt-0.5">
            Mobile Money &amp; Cash
          </p>
        </div>
      </div>

    </div>
  );
}

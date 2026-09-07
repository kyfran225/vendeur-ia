import React from "react";
import { ShieldCheck, Clock, Truck, CheckCircle2 } from "lucide-react";

interface SocialProofBannerProps {
  merchant: any;
  productCount: number;
}

export function SocialProofBanner({ merchant }: SocialProofBannerProps) {
  const city = merchant.city || "Abidjan";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
      
      {/* Pillar 1: Official Verified Merchant */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0d1f18] border border-slate-200/80 dark:border-white/5 flex items-center gap-2.5 sm:gap-3 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition-all shadow-sm hover:shadow-md">
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
          <ShieldCheck size={18} className="sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
            Vendeur Vérifié
          </p>
          <p className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-bold leading-tight mt-0.5">
            Boutique Officielle
          </p>
        </div>
      </div>

      {/* Pillar 2: 24/7 AI Instant Support */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0d1f18] border border-slate-200/80 dark:border-white/5 flex items-center gap-2.5 sm:gap-3 hover:border-sky-500/40 dark:hover:border-sky-500/30 transition-all shadow-sm hover:shadow-md">
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-sm">
          <Clock size={18} className="sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
            Réponse Directe
          </p>
          <p className="text-[9px] sm:text-[10px] text-sky-600 dark:text-sky-400 font-bold leading-tight mt-0.5">
            Assistance 24h/7
          </p>
        </div>
      </div>

      {/* Pillar 3: Fast Local Delivery */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0d1f18] border border-slate-200/80 dark:border-white/5 flex items-center gap-2.5 sm:gap-3 hover:border-amber-500/40 dark:hover:border-amber-500/30 transition-all shadow-sm hover:shadow-md">
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
          <Truck size={18} className="sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
            Livraison Rapide
          </p>
          <p className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-400 font-bold leading-tight mt-0.5">
            {city} &amp; Expédition
          </p>
        </div>
      </div>

      {/* Pillar 4: Secure Payments */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#0d1f18] border border-slate-200/80 dark:border-white/5 flex items-center gap-2.5 sm:gap-3 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition-all shadow-sm hover:shadow-md">
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
          <CheckCircle2 size={18} className="sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
            Paiement Garanti
          </p>
          <p className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-bold leading-tight mt-0.5">
            Mobile Money &amp; Cash
          </p>
        </div>
      </div>

    </div>
  );
}

import React from "react";
import { AlertTriangle, ArrowRight, Zap, Sparkles, PauseCircle, PlayCircle, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SubscriptionBannerProps {
  status?: string;
  expiresAt?: string | null;
  autoReply?: boolean;
  onOpenTestIA?: () => void;
}

export function SubscriptionBanner({ status, expiresAt, autoReply = true, onOpenTestIA }: SubscriptionBannerProps) {
  const isPaidActive = status === "active";
  const now = new Date();
  const expirationDate = expiresAt ? new Date(expiresAt) : null;
  const diffTime = expirationDate ? expirationDate.getTime() - now.getTime() : 0;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isExpired = status === "past_due" || (isPaidActive && expirationDate !== null && diffDays <= 0);
  const isExpiringSoon = isPaidActive && expirationDate !== null && diffDays > 0 && diffDays <= 5;
  const isDiscoveryMode = !isPaidActive && !isExpired;
  const isPaused = isPaidActive && !isExpired && autoReply === false;

  // 1. Mode Découverte (Avant paiement)
  if (isDiscoveryMode) {
    return (
      <div className="relative overflow-hidden p-5 md:p-6 rounded-[2rem] border border-amber-500/30 bg-amber-500/10 text-amber-100 animate-in fade-in slide-in-from-top-4 duration-500 mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 md:h-12 md:w-12 rounded-2xl bg-amber-500 text-vendeur-coal flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 font-black">
              <Bot size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="font-black uppercase tracking-tight text-xs md:text-sm text-white">
                  Mode Découverte Actif (Gratuit)
                </h3>
              </div>
              <p className="text-[11px] md:text-xs text-amber-200/80 font-medium mt-0.5 leading-relaxed max-w-xl">
                Votre Vendeur IA ne répond pas encore à vos clients sur WhatsApp. Vous gardez la main sur vos discussions tout en testant le simulateur.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {onOpenTestIA && (
              <button
                type="button"
                onClick={onOpenTestIA}
                className="h-11 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-[11px] tracking-wider transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Sparkles size={14} className="text-amber-300" />
                <span>Tester dans le simulateur</span>
              </button>
            )}

            <Link
              to="/settings?tab=billing"
              className="h-11 px-5 rounded-xl bg-vendeur-emerald text-vendeur-coal font-black uppercase text-[11px] tracking-wider hover:bg-emerald-400 transition-all shadow-lg shadow-vendeur-emerald/20 flex items-center gap-2 active:scale-95 whitespace-nowrap"
            >
              <span>Activer mon Vendeur IA</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Mode Pause (Abonnement payé mais mis en pause)
  if (isPaused) {
    return (
      <div className="relative overflow-hidden p-5 md:p-6 rounded-[2rem] border border-sky-500/30 bg-sky-500/10 text-sky-100 animate-in fade-in slide-in-from-top-4 duration-500 mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 md:h-12 md:w-12 rounded-2xl bg-sky-400 text-vendeur-coal flex items-center justify-center shrink-0 shadow-lg shadow-sky-400/20 font-black">
              <PauseCircle size={24} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-xs md:text-sm text-white">
                Vendeur IA en Pause
              </h3>
              <p className="text-[11px] md:text-xs text-sky-200/80 font-medium mt-0.5 leading-relaxed">
                Votre WhatsApp reste connecté. Vous répondez manuellement à vos clients.
              </p>
            </div>
          </div>

          <Link
            to="/settings?tab=personnalite"
            className="h-11 px-5 rounded-xl bg-sky-400 text-vendeur-coal font-black uppercase text-[11px] tracking-wider hover:bg-sky-300 transition-all shadow-lg shadow-sky-400/20 flex items-center gap-2 active:scale-95 whitespace-nowrap"
          >
            <PlayCircle size={15} />
            <span>Reprendre les Ventes 24h/24</span>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Abonnement Expiré ou bientôt expiré
  if (isExpired || isExpiringSoon) {
    return (
      <div className={cn(
        "relative overflow-hidden p-5 md:p-6 rounded-[2rem] border animate-in fade-in slide-in-from-top-4 duration-500 mb-6 shadow-xl",
        isExpired
          ? "bg-red-500/10 border-red-500/30 text-red-200"
          : "bg-amber-500/10 border-amber-500/30 text-amber-200"
      )}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "h-11 w-11 md:h-12 md:w-12 rounded-2xl flex items-center justify-center shrink-0 font-black",
              isExpired ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-amber-500 text-vendeur-coal shadow-lg shadow-amber-500/20"
            )}>
              {isExpired ? <AlertTriangle size={24} /> : <Zap size={24} />}
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-xs md:text-sm text-white">
                {isExpired ? "Forfait Vendeur IA Expiré" : "Abonnement bientôt à terme"}
              </h3>
              <p className="text-[11px] md:text-xs opacity-80 font-medium mt-0.5">
                {isExpired
                  ? "Votre Vendeur IA est en pause sur WhatsApp. Réactivez votre forfait pour relancer les ventes 24h/24."
                  : `Votre abonnement expire dans ${diffDays} jour${diffDays > 1 ? 's' : ''}. Renouvelez pour éviter toute coupure.`}
              </p>
            </div>
          </div>

          <Link
            to="/settings?tab=billing"
            className={cn(
              "h-11 px-5 rounded-xl font-black uppercase text-[11px] tracking-wider transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap",
              isExpired
                ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                : "bg-amber-500 text-vendeur-coal hover:bg-amber-400 shadow-lg shadow-amber-500/20"
            )}
          >
            <span>{isExpired ? "Recharger mon forfait" : "Renouveler"}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

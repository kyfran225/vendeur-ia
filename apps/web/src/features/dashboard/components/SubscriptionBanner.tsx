import React from "react";
import { AlertTriangle, ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SubscriptionBannerProps {
  status: string;
  expiresAt: string | null;
}

export function SubscriptionBanner({ status, expiresAt }: SubscriptionBannerProps) {
  if (!expiresAt) return null;

  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isExpired = status === "past_due" || diffDays <= 0;
  const isExpiringSoon = diffDays > 0 && diffDays <= 5;

  if (!isExpired && !isExpiringSoon) return null;

  return (
    <div className={cn(
      "relative overflow-hidden p-4 md:p-6 rounded-[2rem] border animate-in fade-in slide-in-from-top-4 duration-500 mb-6",
      isExpired
        ? "bg-red-500/10 border-red-500/20 text-red-200"
        : "bg-amber-500/10 border-amber-500/20 text-amber-200"
    )}>
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center shrink-0",
            isExpired ? "bg-red-500 text-white" : "bg-amber-500 text-vendeur-coal"
          )}>
            {isExpired ? <AlertTriangle size={24} /> : <Zap size={24} />}
          </div>
          <div>
            <h3 className="font-black uppercase tracking-tight text-sm md:text-base">
              {isExpired ? "Service IA Suspendu" : "Abonnement bientôt expiré"}
            </h3>
            <p className="text-xs opacity-80 font-medium">
              {isExpired
                ? "Votre abonnement a expiré. Votre Vendeur IA ne répond plus à vos clients."
                : `Votre abonnement expire dans ${diffDays} jour${diffDays > 1 ? 's' : ''}. Pensez à renouveler.`}
            </p>
          </div>
        </div>

        <Link
          to="/settings/billing"
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase text-xs transition-all active:scale-95 whitespace-nowrap",
            isExpired
              ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
              : "bg-amber-500 text-vendeur-coal hover:bg-amber-600"
          )}
        >
          {isExpired ? "Réactiver maintenant" : "Renouveler"}
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

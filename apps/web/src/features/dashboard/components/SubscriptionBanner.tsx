import React, { useState } from "react";
import { AlertTriangle, ArrowRight, Zap, Sparkles, PauseCircle, PlayCircle, Trophy, CheckCircle2 } from "lucide-react";
import { AssistantIcon } from "@/components/ui/AssistantIcon";
import { ResumeConfirmationModal } from "@/components/modals/ResumeConfirmationModal";
import { Link } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SubscriptionBannerProps {
  status?: string;
  expiresAt?: string | null;
  trialEndsAt?: string | null;
  trialUsage?: {
    messagesCount?: number;
    maxMessages?: number;
    productsCount?: number;
    maxProducts?: number;
  };
  autoReply?: boolean;
  onOpenTestIA?: () => void;
  onOpenOffers?: () => void;
}

export function SubscriptionBanner({
  status,
  expiresAt,
  trialEndsAt,
  trialUsage,
  autoReply = true,
  onOpenTestIA,
  onOpenOffers
}: SubscriptionBannerProps) {
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const isPaidActive = status === "active";
  const now = new Date();

  // Paid Subscription expiration calculations
  const expirationDate = expiresAt ? new Date(expiresAt) : null;
  const paidDiffTime = expirationDate ? expirationDate.getTime() - now.getTime() : 0;
  const paidDaysRemaining = Math.ceil(paidDiffTime / (1000 * 60 * 60 * 24));

  const isPaidExpired = status === "past_due" || (isPaidActive && expirationDate !== null && paidDaysRemaining <= 0);
  const isPaidExpiringSoon = isPaidActive && expirationDate !== null && paidDaysRemaining > 0 && paidDaysRemaining <= 5;
  const isPaused = !isPaidExpired && autoReply === false;

  // Free Trial calculations
  const trialExpirationDate = trialEndsAt ? new Date(trialEndsAt) : null;
  const trialDiffTime = trialExpirationDate ? trialExpirationDate.getTime() - now.getTime() : 0;
  const trialDaysRemaining = trialExpirationDate ? Math.max(0, Math.ceil(trialDiffTime / (1000 * 60 * 60 * 24))) : 7;
  const messagesUsed = trialUsage?.messagesCount ?? 0;
  const maxMessages = trialUsage?.maxMessages ?? 50;
  const usagePercent = Math.min(100, Math.round((messagesUsed / maxMessages) * 100));

  const isTrialStatus = status === "trial" || (!isPaidActive && !isPaidExpired);
  const isTrialTimeExpired = trialExpirationDate !== null && trialDaysRemaining <= 0;
  const isTrialQuotaExceeded = messagesUsed >= maxMessages;
  const isTrialExpired = status === "expired" || (isTrialStatus && (isTrialTimeExpired || isTrialQuotaExceeded));
  const isTrialActive = isTrialStatus && !isTrialExpired && !isPaidActive;

  // 1. ESSAI GRATUIT ACTIF (7 JOURS AVEC GUARDRAILS)
  if (isTrialActive) {
    return (
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl sm:rounded-[2.5rem] border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 text-slate-900 dark:text-white animate-in fade-in slide-in-from-top-4 duration-500 mb-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5 justify-between relative z-10">
          <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 font-black p-2.5">
              <AssistantIcon size={30} color="#040806" />
            </div>
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Essai Gratuit Actif
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/80">
                  • {trialDaysRemaining} jour{trialDaysRemaining > 1 ? "s" : ""} restant{trialDaysRemaining > 1 ? "s" : ""}
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-white/50">
                  ({messagesUsed}/{maxMessages} messages IA)
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-white/80 font-medium leading-relaxed max-w-2xl">
                Votre Vendeur IA répond automatiquement à vos clients sur WhatsApp et enregistre les commandes. Testez en direct avec vos vrais prospects !
              </p>

              {/* Guardrail Usage Gauge */}
              <div className="flex items-center gap-3 pt-1 max-w-md">
                <div className="flex-1 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      usagePercent > 80 ? "bg-amber-500" : "bg-gradient-to-r from-emerald-500 to-teal-400"
                    )}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-white/40 shrink-0">
                  {usagePercent}% utilisé
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto shrink-0">
            {onOpenTestIA && (
              <button
                type="button"
                onClick={onOpenTestIA}
                className="h-11 px-2.5 sm:px-4 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-bold uppercase text-[10px] sm:text-[11px] tracking-wider transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 whitespace-nowrap shadow-sm w-full sm:w-auto"
              >
                <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Tester mon Vendeur<span className="hidden xs:inline"> IA</span></span>
              </button>
            )}

            {onOpenOffers ? (
              <button
                type="button"
                onClick={onOpenOffers}
                className="h-11 px-2.5 sm:px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-[10px] sm:text-[11px] tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1 sm:gap-2 active:scale-95 whitespace-nowrap cursor-pointer w-full sm:w-auto"
              >
                <span className="truncate">Choisir mon Forfait</span>
                <ArrowRight size={14} className="shrink-0" />
              </button>
            ) : (
              <Link
                to="/settings?tab=billing"
                className="h-11 px-2.5 sm:px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-[10px] sm:text-[11px] tracking-wider transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1 sm:gap-2 active:scale-95 whitespace-nowrap w-full sm:w-auto"
              >
                <span className="truncate">Choisir mon Forfait</span>
                <ArrowRight size={14} className="shrink-0" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. ESSAI GRATUIT TERMINÉ (DÉCLENCHEUR DE PAIEMENT PLG)
  if (isTrialExpired) {
    return (
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl sm:rounded-[2.5rem] border border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-emerald-500/10 text-slate-900 dark:text-white animate-in fade-in slide-in-from-top-4 duration-500 mb-6 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5 justify-between relative z-10">
          <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 font-black p-2.5">
              <Trophy size={28} />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  🎉 Essai Gratuit Terminé ({messagesUsed}/{maxMessages} messages atteints)
                </span>
              </div>
              <h3 className="font-black uppercase tracking-tight text-sm sm:text-base text-slate-900 dark:text-white">
                Félicitations pour vos premières ventes avec Vendeur IA !
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-white/80 font-medium leading-relaxed max-w-2xl">
                Votre Vendeur IA a géré vos prospects avec succès. Pour qu'il continue à vendre et encaisser 24h/24 sans coupure, activez votre forfait mensuel via Wave, Orange ou MTN MoMo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0">
            {onOpenOffers ? (
              <button
                type="button"
                onClick={onOpenOffers}
                className="w-full sm:w-auto h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs tracking-wider transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>Activer mon forfait (Wave, Orange, MTN)</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <Link
                to="/settings?tab=billing"
                className="w-full sm:w-auto h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs tracking-wider transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 text-center"
              >
                <span>Activer mon forfait (Wave, Orange, MTN)</span>
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. MODE PAUSE (Abonnement payé mais mis en pause)
  if (isPaused) {
    return (
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl sm:rounded-[2.5rem] border border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100 animate-in fade-in slide-in-from-top-4 duration-500 mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 md:h-12 md:w-12 rounded-2xl bg-sky-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-sky-400/20 font-black">
              <PauseCircle size={24} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-xs md:text-sm text-slate-900 dark:text-white">
                Vendeur IA en Pause
              </h3>
              <p className="text-[11px] md:text-xs text-sky-800/90 dark:text-sky-200/80 font-medium mt-0.5 leading-relaxed">
                Votre WhatsApp reste connecté. Vous répondez manuellement à vos clients.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsResumeModalOpen(true)}
            className="h-11 px-5 rounded-xl bg-sky-400 text-slate-950 font-black uppercase text-[11px] tracking-wider hover:bg-sky-300 transition-all shadow-lg shadow-sky-400/20 flex items-center gap-2 active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <PlayCircle size={15} />
            <span>Reprendre les Ventes 24h/24</span>
          </button>
        </div>

        <ResumeConfirmationModal
          isOpen={isResumeModalOpen}
          onClose={() => setIsResumeModalOpen(false)}
        />
      </div>
    );
  }

  // 4. ABONNEMENT PAYANT EXPIRÉ OU BIENTÔT À TERME
  if (isPaidExpired || isPaidExpiringSoon) {
    return (
      <div className={cn(
        "relative overflow-hidden p-5 md:p-6 rounded-3xl sm:rounded-[2.5rem] border animate-in fade-in slide-in-from-top-4 duration-500 mb-6 shadow-xl",
        isPaidExpired
          ? "bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200"
          : "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
      )}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div className="flex items-center gap-3.5">
            <div className={cn(
              "h-11 w-11 md:h-12 md:w-12 rounded-2xl flex items-center justify-center shrink-0 font-black",
              isPaidExpired ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
            )}>
              {isPaidExpired ? <AlertTriangle size={24} /> : <Zap size={24} />}
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-xs md:text-sm text-slate-900 dark:text-white">
                {isPaidExpired ? "Forfait Vendeur IA Expiré" : "Abonnement bientôt à terme"}
              </h3>
              <p className={cn(
                "text-[11px] md:text-xs font-medium mt-0.5",
                isPaidExpired ? "text-red-800/90 dark:text-red-200/90" : "text-amber-800/90 dark:text-amber-200/90"
              )}>
                {isPaidExpired
                  ? "Votre Vendeur IA est en pause sur WhatsApp. Réactivez votre forfait pour relancer les ventes 24h/24."
                  : `Votre abonnement expire dans ${paidDaysRemaining} jour${paidDaysRemaining > 1 ? "s" : ""}. Renouvelez pour éviter toute coupure.`}
              </p>
            </div>
          </div>

          <Link
            to="/settings?tab=billing"
            className={cn(
              "h-11 px-5 rounded-xl font-black uppercase text-[11px] tracking-wider transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap",
              isPaidExpired
                ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                : "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20"
            )}
          >
            <span>{isPaidExpired ? "Recharger mon forfait" : "Renouveler"}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

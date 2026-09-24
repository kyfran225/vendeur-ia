import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  Sparkles,
  Play,
  Zap,
  ArrowRight,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  Rocket,
  ShieldCheck,
  RefreshCw,
  Clock,
  Share2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PackProModal } from "./PackProModal";
import { ResumeConfirmationModal } from "@/components/modals/ResumeConfirmationModal";
import { AssistantIcon } from "@/components/ui/AssistantIcon";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SmartAssistantCardProps {
  dashboard: any;
  onOpenTestIA: () => void;
  onOpenShare?: () => void;
  onConnectWhatsApp?: () => void;
  onOpenOffers?: () => void;
  onOpenDailyStatus?: () => void;
  onOpenPauseModal?: () => void;
  onOpenStoreSetupModal?: () => void;
}

export function SmartAssistantCard({
  dashboard,
  onOpenTestIA,
  onOpenShare,
  onConnectWhatsApp,
  onOpenOffers,
  onOpenDailyStatus,
  onOpenPauseModal,
  onOpenStoreSetupModal
}: SmartAssistantCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPackProModalOpen, setIsPackProModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  const merchant = dashboard?.merchant;
  const setupStatus = dashboard?.setupStatus || { score: 0, steps: [], isFullyOperational: false };
  const subscription = merchant?.subscription;
  const aiSettings = merchant?.aiSettings;
  const businessName = merchant?.businessName || "Votre boutique";
  const tips = dashboard?.aiGrowthAdvice?.tips || [];

  // Subscription calculations
  const isPaidActive = subscription?.status === "active";
  const latestPaymentIntent = dashboard?.latestPaymentIntent;
  const isUnderVerification = !isPaidActive && Boolean(
    latestPaymentIntent &&
    (latestPaymentIntent.status === "under_verification" ||
     latestPaymentIntent.status === "pending" ||
     latestPaymentIntent.status === "payment_detected" ||
     latestPaymentIntent.status === "awaiting_payment")
  );

  const now = new Date();
  const expirationDate = subscription?.expiresAt ? new Date(subscription.expiresAt) : null;
  const diffTime = expirationDate ? expirationDate.getTime() - now.getTime() : 0;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const trialExpirationDate = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
  const trialDiffTime = trialExpirationDate ? trialExpirationDate.getTime() - now.getTime() : 0;
  const trialDaysRemaining = trialExpirationDate ? Math.max(0, Math.ceil(trialDiffTime / (1000 * 60 * 60 * 24))) : 7;
  const messagesUsed = subscription?.trialUsage?.messagesCount ?? 0;
  const maxMessages = subscription?.trialUsage?.maxMessages ?? 50;
  const usagePercent = Math.min(100, Math.round((messagesUsed / maxMessages) * 100));

  const isExpired = subscription?.status === "past_due" || (isPaidActive && expirationDate !== null && diffDays <= 0);
  const isExpiringSoon = isPaidActive && expirationDate !== null && diffDays > 0 && diffDays <= 5;
  const isDiscoveryMode = !isPaidActive && !isExpired && !isUnderVerification;
  const isAutoReplyOn = aiSettings?.autoReply !== false && merchant?.aiSettings?.autoReply !== false;
  const isPaused = !isExpired && !isAutoReplyOn;
  const isFully247Active = !isExpired && isAutoReplyOn;

  const { score, steps, isFullyOperational } = setupStatus;
  const nextStep = steps.find((s: any) => !s.completed);
  const firstProduct = dashboard?.products?.[0];
  const productsCount = dashboard?.products?.length || 0;
  const hasProducts = productsCount > 0 || Boolean(steps.find((s: any) => s.id === "products")?.completed);
  const hasPackPro = subscription?.type === "pack_pro" || dashboard?.whatsappConnection?.connectionType === "meta";

  // 1-Click Resume Mutation for Pause Mode
  const resumeSalesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch("/api/commerce/ai-settings", {
        autoReply: true
      });
      return res.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["dashboard"] });
      const previousDashboard = queryClient.getQueryData(["dashboard"]);
      queryClient.setQueryData(["dashboard"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          merchant: {
            ...old.merchant,
            aiSettings: {
              ...old.merchant?.aiSettings,
              autoReply: true
            }
          }
        };
      });
      return { previousDashboard };
    },
    onSuccess: (data) => {
      toast.success("Vendeur IA réactivé ! Les ventes automatiques 24h/24 reprennent immédiatement. 🚀");
      queryClient.setQueryData(["dashboard"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          merchant: {
            ...old.merchant,
            ...(data || {}),
            aiSettings: {
              ...old.merchant?.aiSettings,
              ...(data?.aiSettings || {}),
              autoReply: true
            }
          }
        };
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (_err, _variables, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(["dashboard"], context.previousDashboard);
      }
      toast.error("Impossible de réactiver le Vendeur IA. Veuillez réessayer.");
    }
  });

  const getActionLink = (id: string) => {
    switch (id) {
      case "identity": return "/settings?tab=boutique#identity";
      case "whatsapp": return "/settings?tab=connexions#whatsapp";
      case "products": return "/products";
      case "payments": return "/settings?tab=boutique#payments";
      case "delivery": return "/settings?tab=boutique#delivery";
      case "subscription": return "/offers";
      default: return "/";
    }
  };

  // Determine card appearance & color theme based on real state
  const getThemeConfig = () => {
    if (isUnderVerification) {
      return {
        cardBg: "bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/40 shadow-amber-500/10",
        badgeBg: "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300",
        badgeText: "Paiement en validation ⏳",
        iconBorder: "border-amber-500/40",
        accentText: "text-amber-600 dark:text-amber-400",
        accentGlow: "shadow-amber-500/10",
        progressColor: "bg-amber-500"
      };
    }
    if (isExpired) {
      return {
        cardBg: "bg-red-50/80 dark:bg-red-500/10 border-red-200 dark:border-red-500/30",
        badgeBg: "bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-300",
        badgeText: "Forfait Vendeur IA Expiré",
        iconBorder: "border-red-500/30",
        accentText: "text-red-600 dark:text-red-400",
        accentGlow: "shadow-red-500/10",
        progressColor: "bg-red-500"
      };
    }
    if (isPaused) {
      return {
        cardBg: "bg-sky-50/80 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 shadow-sky-500/5",
        badgeBg: "bg-sky-500/15 border-sky-500/30 text-sky-700 dark:text-sky-300",
        badgeText: "Mode Pause (WhatsApp Manuel)",
        iconBorder: "border-sky-500/30",
        accentText: "text-sky-600 dark:text-sky-400",
        accentGlow: "shadow-sky-400/10",
        progressColor: "bg-sky-500"
      };
    }
    if (isFullyOperational || score === 100 || !nextStep) {
      return {
        cardBg: "bg-white dark:bg-vendeur-coal/60 border-slate-200 dark:border-white/10 hover:border-emerald-500/30 dark:hover:border-vendeur-emerald/30 shadow-xl dark:shadow-2xl",
        badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-vendeur-emerald",
        badgeText: isPaidActive ? "En Vente 24h/24 (IA Active)" : `Boutique Prête • Essai Gratuit (${trialDaysRemaining}j)`,
        iconBorder: "border-emerald-500/30",
        accentText: "text-emerald-600 dark:text-vendeur-emerald",
        accentGlow: "shadow-emerald-500/10",
        progressColor: "bg-vendeur-emerald"
      };
    }
    return {
      cardBg: "bg-amber-50/80 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 shadow-amber-500/5",
      badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300",
      badgeText: `Configuration (${score}%) • Essai ${trialDaysRemaining}j`,
      iconBorder: "border-amber-500/30",
      accentText: "text-amber-600 dark:text-amber-400",
      accentGlow: "shadow-amber-500/10",
      progressColor: "bg-amber-500"
    };
  };

  const theme = getThemeConfig();

  return (
    <>
      <PackProModal isOpen={isPackProModalOpen} onClose={() => setIsPackProModalOpen(false)} />
      <ResumeConfirmationModal isOpen={isResumeModalOpen} onClose={() => setIsResumeModalOpen(false)} />

      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "relative overflow-hidden border rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-xl dark:shadow-2xl transition-all duration-300 space-y-6",
          theme.cardBg,
          theme.accentGlow
        )}
      >
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start relative z-10 w-full min-w-0">
          
          {/* LEFT SIDE: Dynamic Assistant Voice & Primary Action */}
          <div className="flex-1 space-y-5 w-full min-w-0">
            
            {/* Header Identity & Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 transition-transform duration-300 group-hover:scale-105 flex items-center justify-center">
                  <AssistantIcon size="100%" color="#10B981" withBackground={false} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                    Assistant Vendeur IA
                  </h3>
                  <p className={cn("text-xs sm:text-xs font-bold uppercase tracking-widest truncate mt-0.5", theme.accentText)}>
                    {isFullyOperational ? "Boutique 100% Opérationnelle" : "Guidage & Optimisation"}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={cn(
                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-black uppercase tracking-wider shrink-0 shadow-sm",
                theme.badgeBg
              )}>
                <span className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  isPaidActive && !isPaused ? "bg-vendeur-emerald" :
                  isUnderVerification ? "bg-emerald-400" :
                  isPaused ? "bg-sky-400" :
                  isExpired ? "bg-red-400" : "bg-amber-400"
                )} />
                <span>{theme.badgeText}</span>
              </div>
            </div>

            {/* Contextual Message Box */}
            <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative space-y-4 w-full min-w-0">
              <p className="text-sm sm:text-base md:text-[16px] text-slate-800 dark:text-white/95 leading-relaxed italic break-words font-medium">
                "{isUnderVerification ? (
                  <>
                    Votre règlement de <span className="text-emerald-600 dark:text-emerald-400 font-bold not-italic">{latestPaymentIntent?.amount?.toLocaleString() || "..."} {latestPaymentIntent?.currency || "XOF"}</span> (Réf : <span className="font-mono font-bold text-slate-900 dark:text-white not-italic">{latestPaymentIntent?.reference || "TRX"}</span>) est en cours de validation par notre équipe. Votre Vendeur IA 24h/24 sera activé dès confirmation !
                  </>
                ) : isExpired ? (
                  <>
                    Votre forfait Vendeur IA est arrivé à terme. Votre boutique <span className="text-slate-900 dark:text-white font-bold not-italic">{businessName}</span> est en pause sur WhatsApp. Rechargez votre abonnement pour relancer instantanément les réponses et ventes 24h/24 !
                  </>
                ) : isPaused ? (
                  <>
                    Votre Vendeur IA est actuellement en pause. Votre WhatsApp reste connecté et vous échangez manuellement avec vos clients. Vous pouvez réactiver les ventes automatiques 24h/24 en 1 clic quand vous le souhaitez.
                  </>
                ) : isDiscoveryMode ? (
                  !nextStep || isFullyOperational ? (
                    <>
                      Félicitations <span className="text-amber-600 dark:text-amber-400 font-bold not-italic">{businessName}</span> ! 🏁 Votre boutique est entièrement configurée. Votre Vendeur IA est <strong>ACTIF et vend pour vous 24h/24 en Essai Gratuit 7 Jours</strong> (50 messages offerts) !
                    </>
                  ) : nextStep?.id === "identity" ? (
                    <>
                      Bienvenue chez <span className="text-amber-600 dark:text-amber-400 font-bold not-italic">{businessName}</span> ! 🏪 Configurez l'identité et les réglages de votre boutique (moyens de paiement Mobile Money et frais de livraison) pour activer les ventes automatiques.
                    </>
                  ) : nextStep?.id === "whatsapp" ? (
                    <>
                      Génial ! 🚀 Vous êtes en <strong>Essai Gratuit 7 Jours</strong> : votre Vendeur IA répondra à vos clients sur WhatsApp dès que vous le connecterez. Relions votre numéro WhatsApp !
                    </>
                  ) : nextStep?.id === "products" ? (
                    <>
                      WhatsApp est relié à <span className="text-amber-600 dark:text-amber-400 font-bold not-italic">{businessName}</span> ! 🛍️ Ajoutez vos articles : votre Vendeur IA pourra immédiatement présenter votre catalogue et vendre à vos clients.
                    </>
                  ) : (
                    <>
                      Bienvenue chez <span className="text-amber-600 dark:text-amber-400 font-bold not-italic">{businessName}</span> ! {hasProducts ? `Votre catalogue (${productsCount} article${productsCount > 1 ? 's' : ''}) et votre vitrine sont prêts.` : "Ajoutez vos articles pour activer votre vitrine."} Votre Vendeur IA répondra automatiquement à vos clients sur WhatsApp pendant les 7 jours d'essai gratuit.
                    </>
                  )
                ) : isFullyOperational ? (
                  <>
                    Tout est parfait pour <span className="text-emerald-700 dark:text-vendeur-emerald font-bold not-italic">{businessName}</span> ! 🎯 Votre boutique est entièrement configurée. Je réponds à vos clients, présente vos produits et enregistre vos commandes sur WhatsApp 24h/24.
                  </>
                ) : (
                  nextStep?.id === "identity" ? (
                    <>
                      Bienvenue chez <span className="text-emerald-700 dark:text-vendeur-emerald font-bold not-italic">{businessName}</span> ! Configurez votre identité, vos modes de paiement et vos frais de livraison pour valider vos ventes.
                    </>
                  ) : nextStep?.id === "whatsapp" ? (
                    <>
                      Bienvenue chez <span className="text-emerald-700 dark:text-vendeur-emerald font-bold not-italic">{businessName}</span> ! Connectons votre numéro WhatsApp pour que je prenne le relais de vos ventes 24h/24.
                    </>
                  ) : nextStep?.id === "products" ? (
                    <>
                      Votre ligne est prête ! 🛍️ Ajoutez vos articles et leurs prix pour activer votre vitrine publique et me permettre de vendre à vos clients.
                    </>
                  ) : (
                    <>
                      Bravo, votre boutique <span className="text-emerald-700 dark:text-vendeur-emerald font-bold not-italic">{businessName}</span> est presque prête à tourner à 100% en automatique !
                    </>
                  )
                )}"
              </p>

              {/* Guardrail Trial Usage Gauge */}
              {isDiscoveryMode && (
                <div className="flex items-center gap-3 pt-2.5 border-t border-slate-200/60 dark:border-white/5 mt-2">
                  <div className="flex-1 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        usagePercent > 80 ? "bg-amber-500" : "bg-gradient-to-r from-emerald-500 to-teal-400"
                      )}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-white/50 shrink-0">
                    {messagesUsed}/{maxMessages} msgs ({usagePercent}%)
                  </span>
                </div>
              )}

              {/* SINGLE UNIFIED PRIMARY ACTION BAR */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1 w-full">
                {isUnderVerification ? (
                  <>
                    <Link
                      to="/settings?tab=billing"
                      className="flex-1 min-w-[200px] flex items-center justify-center gap-2.5 min-h-[48px] px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase text-xs sm:text-sm tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
                    >
                      <Clock size={16} className="shrink-0" />
                      <span className="truncate">Suivre mon activation {latestPaymentIntent?.reference ? `(#${latestPaymentIntent.reference.slice(-6)})` : ""}</span>
                      <ArrowRight size={16} className="shrink-0" />
                    </Link>

                    <a
                      href={`https://wa.me/2250505111157?text=${encodeURIComponent(
                        `Bonjour Support Vendeur IA,\nJe souhaite suivre l'activation de mon forfait suite à mon paiement.\nRéférence : ${latestPaymentIntent?.reference || ""}\nMontant : ${latestPaymentIntent?.amount || ""} ${latestPaymentIntent?.currency || "XOF"}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[48px] px-4 py-3 rounded-2xl bg-slate-100 hover:bg-[#25D366]/20 hover:border-[#25D366]/50 dark:bg-white/10 dark:hover:bg-[#25D366]/20 dark:hover:border-[#25D366]/50 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:text-[#25D366] font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <WhatsAppIcon size={16} variant="brand" />
                      <span>Assistance WhatsApp</span>
                    </a>
                  </>
                ) : isExpired ? (
                  <Link
                    to="/settings?tab=billing"
                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2.5 min-h-[48px] px-6 py-3 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black uppercase text-xs sm:text-sm tracking-wider transition-all shadow-lg shadow-red-500/20 active:scale-95 cursor-pointer"
                  >
                    <RefreshCw size={16} />
                    <span>Recharger mon Forfait Vendeur IA</span>
                    <ArrowRight size={16} />
                  </Link>
                ) : isPaused ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsResumeModalOpen(true)}
                      className="flex-1 min-w-[220px] flex items-center justify-center gap-2.5 min-h-[48px] px-6 py-3 rounded-2xl bg-vendeur-emerald hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs sm:text-sm tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
                    >
                      <PlayCircle size={18} className="shrink-0" />
                      <span className="whitespace-nowrap">Reprendre les Ventes 24h/24</span>
                    </button>

                    <button
                      type="button"
                      onClick={onOpenTestIA}
                      className="min-h-[48px] px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      title="Tester les réponses de l'IA"
                    >
                      <Play size={15} fill="currentColor" className="text-emerald-600 dark:text-vendeur-emerald shrink-0" />
                      <span className="whitespace-nowrap">Simulateur & Test IA</span>
                    </button>
                  </>
                ) : (
                  <>
                    {!isFullyOperational && nextStep ? (
                      <>
                        {nextStep.id === "whatsapp" && onConnectWhatsApp ? (
                          <button
                            type="button"
                            onClick={onConnectWhatsApp}
                            className="flex-1 min-w-[180px] flex items-center justify-center gap-2.5 min-h-[48px] px-5 py-3 rounded-2xl bg-vendeur-emerald text-slate-950 font-black uppercase text-xs sm:text-sm tracking-wider hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer group"
                          >
                            <Zap size={16} fill="currentColor" className="shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="whitespace-nowrap">Lier mon WhatsApp</span>
                            <ArrowRight size={16} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                          </button>
                        ) : nextStep.id === "identity" && onOpenStoreSetupModal ? (
                          <button
                            type="button"
                            onClick={onOpenStoreSetupModal}
                            className="flex-1 min-w-[180px] flex items-center justify-center gap-2.5 min-h-[48px] px-5 py-3 rounded-2xl bg-vendeur-emerald text-slate-950 font-black uppercase text-xs sm:text-sm tracking-wider hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer group"
                          >
                            <Zap size={16} fill="currentColor" className="shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="whitespace-nowrap">Configurer ma boutique</span>
                            <ArrowRight size={16} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                          </button>
                        ) : (
                          <Link
                            to={getActionLink(nextStep.id)}
                            className="flex-1 min-w-[180px] flex items-center justify-center gap-2.5 min-h-[48px] px-5 py-3 rounded-2xl bg-vendeur-emerald text-slate-950 font-black uppercase text-xs sm:text-sm tracking-wider hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer group"
                          >
                            <Zap size={16} fill="currentColor" className="shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="whitespace-nowrap">{nextStep.label}</span>
                            <ArrowRight size={16} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        )}

                        <button
                          type="button"
                          onClick={onOpenTestIA}
                          className="min-h-[48px] px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                          title="Tester les réponses de l'IA"
                        >
                          <Play size={15} fill="currentColor" className="text-emerald-600 dark:text-vendeur-emerald shrink-0" />
                          <span className="whitespace-nowrap">Simulateur & Test IA</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={onOpenTestIA}
                          className="flex-1 min-w-[180px] flex items-center justify-center gap-2.5 min-h-[48px] px-5 py-3 rounded-2xl bg-vendeur-emerald text-slate-950 font-black uppercase text-xs sm:text-sm tracking-wider hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                        >
                          <Play size={16} fill="currentColor" className="shrink-0" />
                          <span className="whitespace-nowrap">Simulateur & Test IA</span>
                        </button>

                        {onOpenDailyStatus && (
                          <button
                            type="button"
                            onClick={onOpenDailyStatus}
                            className="min-h-[48px] px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg shadow-amber-500/20"
                          >
                            <Sparkles size={15} className="shrink-0" />
                            <span className="whitespace-nowrap">Statuts du Jour</span>
                          </button>
                        )}

                        {onOpenPauseModal && (
                          <button
                            type="button"
                            onClick={onOpenPauseModal}
                            className="min-h-[48px] px-4 py-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            title="Mettre le Vendeur IA en pause"
                          >
                            <PauseCircle size={15} className="shrink-0" />
                            <span className="whitespace-nowrap">Mettre en pause</span>
                          </button>
                        )}

                        {isDiscoveryMode && (
                          <button
                            type="button"
                            onClick={onOpenOffers || (() => navigate("/offers"))}
                            className="min-h-[48px] px-4 py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                          >
                            <Sparkles size={15} className="shrink-0" />
                            <span className="whitespace-nowrap">Choisir mon Forfait</span>
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* AI Growth Advice Cards (When 100% Operational) */}
              {isFullyOperational && tips.length > 0 && (
                <div className="pt-3 space-y-3 w-full border-t border-slate-200/60 dark:border-white/5 mt-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className={theme.accentText} />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/80">
                      Conseils de Croissance IA du Jour
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {tips.map((tip: any, i: number) => (
                      <Link
                        key={i}
                        to={tip.action || "#"}
                        className="bg-white/80 dark:bg-black/40 backdrop-blur-md border border-slate-200 dark:border-white/5 p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed hover:border-vendeur-emerald/40 hover:bg-white dark:hover:bg-black/60 transition-all active:scale-[0.98] text-slate-800 dark:text-white/90 shadow-sm"
                      >
                        {tip.text || tip}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Progression Bar */}
            {!isFullyOperational && (
              <div className="space-y-2 w-full min-w-0 pt-1">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-black uppercase text-slate-500 dark:text-white/50 tracking-wider">Progression de mise en place</span>
                  <span className={cn("text-base sm:text-lg font-black", theme.accentText)}>{score}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden w-full">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={cn("h-full shadow-[0_0_12px_rgba(255,255,255,0.2)]", theme.progressColor)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE: Compact Step Checklist (Visible when setup is not 100%) */}
          {!isFullyOperational && steps.length > 0 && (
            <div className="w-full md:w-[320px] lg:w-[360px] space-y-2.5 shrink-0 min-w-0">
              {steps.map((step: any) => {
                const isWhatsAppInteractive = step.id === "whatsapp" && !step.completed && Boolean(onConnectWhatsApp);
                const content = (
                  <>
                    <div className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                      step.completed ? "text-emerald-600 dark:text-vendeur-emerald" : step.id === nextStep?.id ? (isDiscoveryMode ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-vendeur-emerald") : "text-slate-400 dark:text-white/20"
                    )}>
                      {step.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </div>
                    <span className={cn(
                      "flex-1 text-xs sm:text-sm font-bold truncate min-w-0 text-left",
                      step.completed ? "text-slate-400 dark:text-white/40 line-through" : step.id === nextStep?.id ? "text-slate-900 dark:text-white font-black" : "text-slate-700 dark:text-white/80"
                    )}>
                      {step.label}
                    </span>
                    
                    {!step.completed && step.id === nextStep?.id && (
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border",
                        isDiscoveryMode
                          ? "text-amber-800 dark:text-amber-300 bg-amber-500/10 border-amber-500/30"
                          : "text-emerald-700 dark:text-vendeur-emerald bg-emerald-500/10 border-emerald-500/30"
                      )}>
                        En cours
                      </span>
                    )}

                    {!step.completed && (
                      <ChevronRight size={16} className="text-slate-400 dark:text-white/30 group-hover:text-slate-900 dark:group-hover:text-white transition-colors shrink-0" />
                    )}
                  </>
                );

                const itemClass = cn(
                  "w-full flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all group min-w-0 min-h-[48px] cursor-pointer",
                  step.completed
                    ? "bg-emerald-500/5 dark:bg-vendeur-emerald/5 border-emerald-500/20 dark:border-vendeur-emerald/20 opacity-70"
                    : step.id === nextStep?.id
                      ? cn("border-opacity-60 shadow-sm", isDiscoveryMode ? "bg-amber-500/10 border-amber-500/40" : "bg-emerald-500/10 border-emerald-500/40")
                      : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20"
                );

                if (isWhatsAppInteractive) {
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={onConnectWhatsApp}
                      className={itemClass}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <Link
                    key={step.id}
                    to={getActionLink(step.id)}
                    className={itemClass}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </motion.section>
    </>
  );
}

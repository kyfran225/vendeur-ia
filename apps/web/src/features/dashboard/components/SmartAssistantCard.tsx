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
  Share2,
  ExternalLink,
  Package
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PackProModal } from "./PackProModal";
import { AssistantIcon } from "@/components/ui/AssistantIcon";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { getMerchantShopPath } from "@/lib/slugify";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SmartAssistantCardProps {
  dashboard: any;
  onOpenTestIA: () => void;
  onOpenShare?: () => void;
}

export function SmartAssistantCard({ dashboard, onOpenTestIA, onOpenShare }: SmartAssistantCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPackProModalOpen, setIsPackProModalOpen] = useState(false);

  const merchant = dashboard?.merchant;
  const setupStatus = dashboard?.setupStatus || { score: 0, steps: [], isFullyOperational: false };
  const subscription = merchant?.subscription;
  const aiSettings = merchant?.aiSettings;
  const businessName = merchant?.businessName || "Votre boutique";

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

  const isExpired = subscription?.status === "past_due" || (isPaidActive && expirationDate !== null && diffDays <= 0);
  const isExpiringSoon = isPaidActive && expirationDate !== null && diffDays > 0 && diffDays <= 5;
  const isDiscoveryMode = !isPaidActive && !isExpired && !isUnderVerification;
  const isPaused = isPaidActive && !isExpired && aiSettings?.autoReply === false;
  const isFully247Active = isPaidActive && !isExpired && aiSettings?.autoReply !== false;

  const { score, steps, isFullyOperational } = setupStatus;
  const nextStep = steps.find((s: any) => !s.completed);
  const firstProduct = dashboard?.products?.[0];
  const productsCount = dashboard?.products?.length || 0;
  const hasProducts = productsCount > 0 || Boolean(steps.find((s: any) => s.id === "products")?.completed);
  const hasPackPro = subscription?.type === "pack_pro" || dashboard?.whatsappConnection?.connectionType === "meta";

  // 1-Click Resume Mutation for Pause Mode
  const resumeSalesMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch("/api/commerce/ai-settings", {
        autoReply: true
      });
    },
    onSuccess: () => {
      toast.success("Vendeur IA réactivé ! Les ventes automatiques 24h/24 reprennent immédiatement. 🚀");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => {
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
        cardBg: "bg-emerald-950/40 border-emerald-500/30 shadow-emerald-500/5",
        badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
        badgeText: "Vérification en cours ⏳",
        iconBorder: "border-emerald-500/30",
        accentText: "text-emerald-400",
        accentGlow: "shadow-emerald-500/10",
        progressColor: "bg-emerald-400"
      };
    }
    if (isExpired) {
      return {
        cardBg: "bg-red-500/10 border-red-500/30",
        badgeBg: "bg-red-500/15 border-red-500/30 text-red-300",
        badgeText: "Forfait Vendeur IA Expiré",
        iconBorder: "border-red-500/30",
        accentText: "text-red-400",
        accentGlow: "shadow-red-500/10",
        progressColor: "bg-red-500"
      };
    }
    if (isPaused) {
      return {
        cardBg: "bg-sky-500/10 border-sky-500/30 shadow-sky-500/5",
        badgeBg: "bg-sky-500/15 border-sky-500/30 text-sky-300",
        badgeText: "Mode Pause (WhatsApp Manuel)",
        iconBorder: "border-sky-500/30",
        accentText: "text-sky-400",
        accentGlow: "shadow-sky-400/10",
        progressColor: "bg-sky-400"
      };
    }
    if (isDiscoveryMode) {
      return {
        cardBg: "bg-amber-500/10 border-amber-500/30 shadow-amber-500/5",
        badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-300",
        badgeText: "Mode Découverte (Gratuit)",
        iconBorder: "border-amber-500/30",
        accentText: "text-amber-400",
        accentGlow: "shadow-amber-500/10",
        progressColor: "bg-amber-400"
      };
    }
    return {
      cardBg: "bg-vendeur-coal/60 border-white/10 hover:border-vendeur-emerald/30",
      badgeBg: "bg-vendeur-emerald/15 border-vendeur-emerald/30 text-vendeur-emerald",
      badgeText: "En Vente 24h/24 (IA Active)",
      iconBorder: "border-vendeur-emerald/30",
      accentText: "text-vendeur-emerald",
      accentGlow: "shadow-vendeur-emerald/10",
      progressColor: "bg-vendeur-emerald"
    };
  };

  const theme = getThemeConfig();

  return (
    <>
      <PackProModal isOpen={isPackProModalOpen} onClose={() => setIsPackProModalOpen(false)} />

      <motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "relative overflow-hidden border rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 shadow-2xl transition-all duration-300 space-y-6",
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
                  <h3 className="text-base sm:text-lg md:text-xl font-black text-white uppercase tracking-tight truncate">
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
            <div className="bg-black/40 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative space-y-4 w-full min-w-0">
              <p className="text-sm sm:text-base md:text-[16px] text-white/95 leading-relaxed italic break-words font-medium">
                "{isUnderVerification ? (
                  <>
                    Votre règlement de <span className="text-emerald-400 font-bold not-italic">{latestPaymentIntent?.amount?.toLocaleString() || "..."} {latestPaymentIntent?.currency || "XOF"}</span> (Réf : <span className="font-mono font-bold text-white not-italic">{latestPaymentIntent?.reference || "TRX"}</span>) est en cours de validation par notre équipe. Votre Vendeur IA 24h/24 sera activé dès confirmation !
                  </>
                ) : isExpired ? (
                  <>
                    Votre forfait Vendeur IA est arrivé à terme. Votre boutique <span className="text-white font-bold not-italic">{businessName}</span> est en pause sur WhatsApp. Rechargez votre abonnement pour relancer instantanément les réponses et ventes 24h/24 !
                  </>
                ) : isPaused ? (
                  <>
                    Votre Vendeur IA est actuellement en pause. Votre WhatsApp reste connecté et vous échangez manuellement avec vos clients. Vous pouvez réactiver les ventes automatiques 24h/24 en 1 clic quand vous le souhaitez.
                  </>
                ) : isDiscoveryMode ? (
                  nextStep?.id === "subscription" ? (
                    <>
                      Félicitations <span className="text-amber-400 font-bold not-italic">{businessName}</span>, votre configuration est terminée ! 🏁 Votre Vendeur IA est en <strong>Mode Découverte (En attente d'activation)</strong>. Activez votre forfait pour qu'il prenne le relais de vos ventes 24h/24.
                    </>
                  ) : nextStep?.id === "whatsapp" ? (
                    <>
                      Bienvenue chez <span className="text-amber-400 font-bold not-italic">{businessName}</span> ! 🚀 Vous êtes en <strong>Mode Découverte Gratuit</strong> : je ne réponds pas encore à vos clients sur WhatsApp afin que vous gardiez 100% le contrôle. Première étape : relions votre WhatsApp !
                    </>
                  ) : nextStep?.id === "products" ? (
                    <>
                      Génial, WhatsApp est relié à <span className="text-amber-400 font-bold not-italic">{businessName}</span> ! 🛍️ Ajoutez vos articles : votre vitrine publique sera automatiquement générée et vous pourrez me tester librement dans le simulateur.
                    </>
                  ) : (
                    <>
                      Bienvenue chez <span className="text-amber-400 font-bold not-italic">{businessName}</span> ! {hasProducts ? `Votre catalogue (${productsCount} article${productsCount > 1 ? 's' : ''}) et votre vitrine sont prêts.` : "Ajoutez vos articles pour activer votre vitrine."} Le Vendeur IA ne répondra pas sur WhatsApp tant que le forfait n'est pas activé.
                    </>
                  )
                ) : isFullyOperational ? (
                  <>
                    Tout est parfait pour <span className="text-vendeur-emerald font-bold not-italic">{businessName}</span> ! 🎯 Votre boutique est entièrement configurée. Je réponds à vos clients, présente vos produits et enregistre vos commandes sur WhatsApp 24h/24.
                  </>
                ) : (
                  nextStep?.id === "whatsapp" ? (
                    <>
                      Bienvenue chez <span className="text-vendeur-emerald font-bold not-italic">{businessName}</span> ! Connectons votre numéro WhatsApp pour que je prenne le relais de vos ventes 24h/24.
                    </>
                  ) : nextStep?.id === "products" ? (
                    <>
                      Votre ligne est prête ! 🛍️ Ajoutez vos articles et leurs prix pour activer votre vitrine publique et me permettre de vendre à vos clients.
                    </>
                  ) : nextStep?.id === "payments" ? (
                    <>
                      Votre catalogue est en place ({productsCount} article{productsCount > 1 ? 's' : ''}) et votre vitrine est active ! 💰 Configurez vos moyens d'encaissement (Wave, Orange Money, MoMo) pour valider les paiements automatiques.
                    </>
                  ) : (
                    <>
                      Bravo, votre boutique <span className="text-vendeur-emerald font-bold not-italic">{businessName}</span> est presque prête à tourner à 100% en automatique !
                    </>
                  )
                )}"
              </p>

              {/* SINGLE UNIFIED PRIMARY ACTION BAR (Generous Heights, No Flattening) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                {isUnderVerification ? (
                  <>
                    <Link
                      to="/settings?tab=billing"
                      className="flex-1 flex items-center justify-center gap-2.5 min-h-[52px] sm:min-h-[56px] px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-vendeur-coal font-black uppercase text-xs sm:text-sm tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer shrink-0 truncate"
                    >
                      <Clock size={17} className="shrink-0" />
                      <span className="truncate">Suivre mon activation {latestPaymentIntent?.reference ? `(Réf : #${latestPaymentIntent.reference.slice(-6)})` : ""}</span>
                      <ArrowRight size={17} className="shrink-0" />
                    </Link>

                    <a
                      href={`https://wa.me/2250505111157?text=${encodeURIComponent(
                        `Bonjour Support Vendeur IA,\nJe souhaite suivre l'activation de mon forfait suite à mon paiement.\nRéférence : ${latestPaymentIntent?.reference || ""}\nMontant : ${latestPaymentIntent?.amount || ""} ${latestPaymentIntent?.currency || "XOF"}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[52px] sm:min-h-[56px] px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-[#25D366]/20 hover:border-[#25D366]/50 border border-white/10 text-white hover:text-[#25D366] font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                    >
                      <WhatsAppIcon size={16} variant="brand" />
                      <span>Assistance WhatsApp</span>
                    </a>
                  </>
                ) : isExpired ? (
                  <Link
                    to="/settings?tab=billing"
                    className="flex-1 flex items-center justify-center gap-2.5 min-h-[52px] sm:min-h-[56px] px-6 py-3.5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black uppercase text-xs sm:text-sm tracking-wider transition-all shadow-lg shadow-red-500/20 active:scale-95 cursor-pointer shrink-0"
                  >
                    <RefreshCw size={17} />
                    <span>Recharger mon Forfait Vendeur IA</span>
                    <ArrowRight size={17} />
                  </Link>
                ) : isPaused ? (
                  <button
                    type="button"
                    onClick={() => resumeSalesMutation.mutate()}
                    disabled={resumeSalesMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2.5 min-h-[52px] sm:min-h-[56px] px-6 py-3.5 rounded-2xl bg-sky-400 hover:bg-sky-300 text-vendeur-coal font-black uppercase text-xs sm:text-sm tracking-wider transition-all shadow-lg shadow-sky-400/20 active:scale-95 cursor-pointer shrink-0"
                  >
                    <PlayCircle size={18} />
                    <span>{resumeSalesMutation.isPending ? "Réactivation..." : "Reprendre les Ventes 24h/24"}</span>
                  </button>
                ) : (
                  <>
                    {!isFullyOperational && nextStep ? (
                      <>
                        <Link
                          to={getActionLink(nextStep.id)}
                          className="flex-1 flex items-center justify-center gap-2.5 min-h-[52px] sm:min-h-[56px] px-5 py-3.5 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase text-xs sm:text-sm tracking-wider hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/20 cursor-pointer shrink-0 truncate group"
                        >
                          <Zap size={17} fill="currentColor" className="shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="truncate">{nextStep.label}</span>
                          <ArrowRight size={17} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <button
                          type="button"
                          onClick={onOpenTestIA}
                          className="min-h-[52px] sm:min-h-[56px] px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                          title="Tester les réponses de l'IA"
                        >
                          <Play size={16} fill="currentColor" className="text-vendeur-emerald shrink-0" />
                          <span>Simulateur & Test IA</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={onOpenTestIA}
                          className="flex-1 flex items-center justify-center gap-2.5 min-h-[52px] sm:min-h-[56px] px-5 py-3.5 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase text-xs sm:text-sm tracking-wider hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/20 cursor-pointer shrink-0 truncate"
                        >
                          <Play size={17} fill="currentColor" className="shrink-0" />
                          <span>Simulateur & Test IA</span>
                        </button>

                        {isDiscoveryMode && (
                          <Link
                            to="/offers"
                            className="min-h-[52px] sm:min-h-[56px] px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                          >
                            <Sparkles size={16} className="text-amber-300" />
                            <span>Activer le Forfait 24h/24</span>
                          </Link>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Progression Bar */}
            {!isFullyOperational && (
              <div className="space-y-2 w-full min-w-0 pt-1">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-black uppercase text-white/50 tracking-wider">Progression de mise en place</span>
                  <span className={cn("text-base sm:text-lg font-black", theme.accentText)}>{score}%</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden w-full">
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
              <p className="text-xs font-black uppercase text-white/50 tracking-widest px-1 mb-2">Étapes de configuration</p>
              {steps.map((step: any) => (
                <Link
                  key={step.id}
                  to={getActionLink(step.id)}
                  className={cn(
                    "flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all group min-w-0 min-h-[48px]",
                    step.completed
                      ? "bg-vendeur-emerald/5 border-vendeur-emerald/20 opacity-60"
                      : step.id === nextStep?.id
                        ? cn("border-opacity-60 shadow-md", isDiscoveryMode ? "bg-amber-500/10 border-amber-500/40" : "bg-vendeur-emerald/10 border-vendeur-emerald/40")
                        : "bg-white/5 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                    step.completed ? "text-vendeur-emerald" : step.id === nextStep?.id ? (isDiscoveryMode ? "text-amber-400" : "text-vendeur-emerald") : "text-white/20"
                  )}>
                    {step.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </div>
                  <span className={cn(
                    "flex-1 text-xs sm:text-sm font-bold truncate min-w-0",
                    step.completed ? "text-white/40 line-through" : step.id === nextStep?.id ? "text-white font-black" : "text-white/80"
                  )}>
                    {step.label}
                  </span>
                  
                  {!step.completed && step.id === nextStep?.id && (
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border",
                      isDiscoveryMode
                        ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
                        : "text-vendeur-emerald bg-vendeur-emerald/10 border-vendeur-emerald/30"
                    )}>
                      En cours
                    </span>
                  )}

                  {!step.completed && (
                    <ChevronRight size={16} className="text-white/30 group-hover:text-white transition-colors shrink-0" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/*
          BLOC VITRINE & CROISSANCE
          Affiché quand la boutique a des articles pour encourager le partage
        */}
        {hasProducts && (
          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 p-4 sm:p-6 rounded-3xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden group/showcase shadow-xl">
              <div className="space-y-2 relative z-10 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                   <div className="h-8 w-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
                    <Package size={16} />
                  </div>
                  <h4 className="text-sm sm:text-base font-black uppercase tracking-tight text-white">
                    Votre Vitrine est en ligne ! 🚀
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-white/70 font-medium leading-relaxed max-w-lg">
                  Attirez vos premiers clients en diffusant votre lien ou vérifiez le rendu de vos articles côté acheteur.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch lg:items-center gap-3 w-full lg:w-auto shrink-0 relative z-10">
                {onOpenShare && (
                  <button
                    type="button"
                    onClick={onOpenShare}
                    className="h-12 sm:h-14 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Share2 size={18} className="text-vendeur-emerald" />
                    <span>Propulser ma Boutique</span>
                  </button>
                )}

                <Link
                  to={getMerchantShopPath(merchant)}
                  target="_blank"
                  className="h-12 sm:h-14 px-6 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
                >
                  <ExternalLink size={18} />
                  <span>Aperçu de ma Vitrine</span>
                </Link>
              </div>

              {/* Decorative background glow */}
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-32 w-32 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none" />
            </div>
          </div>
        )}
      </motion.section>
    </>
  );
}

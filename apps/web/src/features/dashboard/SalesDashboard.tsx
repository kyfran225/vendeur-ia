import React, { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  MessageCircle,
  Banknote,
  Package,
  Bot,
  Sparkles,
  Zap,
  Share2,
  ExternalLink,
  Play,
  PauseCircle,
  Plus,
  Store,
  Globe,
  Copy,
  Check
} from "lucide-react";

import { useSocket } from "@/hooks/useSocket";
import { useQuery as useTanstackQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useFounderRole } from "@/hooks/useFounderRole";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SmartAssistantCard } from "./components/SmartAssistantCard";
import { VendeurIAPlaygroundModal } from "./components/VendeurIAPlaygroundModal";
import { SetupCompletionModal } from "./components/SetupCompletionModal";
import { StepSuccessModal } from "./components/StepSuccessModal";
import { OffersModal } from "@/features/settings/components/OffersModal";
import { PauseConfirmationModal } from "@/components/modals/PauseConfirmationModal";
import { ShareShopModal } from "@/features/shop/components/ShareShopModal";
import { StepMilestoneModal } from "@/components/ui/StepMilestoneModal";
import { DailyStatusModal } from "./components/DailyStatusModal";
import { AssistantIcon } from "@/components/ui/AssistantIcon";
import { getMerchantShopUrl, getMerchantShopPath } from "@/lib/slugify";
import { formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";

import { VendeurIALoader } from "@/components/ui/VendeurIALoader";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0
  }).format(value);
}

export function SalesDashboard() {
  const navigate = useNavigate();
  const { accessToken, user } = useAuthStore();
  const { isFounder } = useFounderRole();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const isTestIAOpen = searchParams.get("test_ia") === "true";
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [confirmedPaymentData, setConfirmedPaymentData] = useState<any>(null);
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
  const [isWhatsAppMilestoneOpen, setIsWhatsAppMilestoneOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Suivi des étapes complétées pour détecter les nouvelles complétion
  const [stepSuccessModal, setStepSuccessModal] = useState<{
    isOpen: boolean;
    completedStepId: string;
    completedStepLabel: string;
    nextStep: { id: string; label: string } | null;
  }>({ isOpen: false, completedStepId: "", completedStepLabel: "", nextStep: null });
  const previousCompletedStepsRef = useRef<Set<string>>(new Set());

  const setIsTestIAOpen = (open: boolean) => {
    if (open) {
      setSearchParams({ test_ia: "true" });
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("test_ia");
      setSearchParams(newParams);
    }
  };

  const { data: dashboard, isLoading } = useTanstackQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard");
      return res.data;
    },
    enabled: !!accessToken
  });

  // Détecte quand une étape passe à "complétée" pour afficher le pop-up de succès intermédiaire
  useEffect(() => {
    const steps: Array<{ id: string; label: string; completed: boolean }> = dashboard?.setupStatus?.steps || [];
    if (!steps.length || !dashboard?.merchant?._id || isFounder) return;

    const isFullyOperational = dashboard?.setupStatus?.isFullyOperational;
    // Ne pas afficher le modal d'étape si la boutique est déjà 100% opérationnelle
    if (isFullyOperational) {
      // Initialiser la ref sans déclencher de modal
      const nowCompleted = new Set<string>(steps.filter((s) => s.completed).map((s) => s.id));
      previousCompletedStepsRef.current = nowCompleted;
      return;
    }

    const nowCompleted = new Set<string>(steps.filter((s) => s.completed).map((s) => s.id));
    const prev = previousCompletedStepsRef.current;

    if (prev.size === 0) {
      // Premier chargement : initialiser la ref sans déclencher de modal
      previousCompletedStepsRef.current = nowCompleted;
      return;
    }

    // Trouver les étapes nouvellement complétées (pas dans prev, dans nowCompleted)
    const newlyCompleted = steps.filter((s) => s.completed && !prev.has(s.id));

    if (newlyCompleted.length > 0) {
      // Prendre la première nouvellement complétée
      const justDone = newlyCompleted[0];
      
      // Si l'étape complétée est 'whatsapp', StepMilestoneModal la prend déjà en charge
      if (justDone.id === "whatsapp") {
        previousCompletedStepsRef.current = nowCompleted;
        return;
      }

      // L'étape suivante non complétée
      const nextPending = steps.find((s) => !s.completed && s.id !== justDone.id) || null;

      setStepSuccessModal({
        isOpen: true,
        completedStepId: justDone.id,
        completedStepLabel: justDone.label,
        nextStep: nextPending ? { id: nextPending.id, label: nextPending.label } : null,
      });
    }

    previousCompletedStepsRef.current = nowCompleted;
  }, [dashboard?.setupStatus?.steps, dashboard?.merchant?._id, dashboard?.setupStatus?.isFullyOperational, isFounder]);


  useEffect(() => {
    if (socket) {
      socket.on("whatsapp:connected", () => {
        toast.success("WhatsApp connecté avec succès !");
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        setIsOffersModalOpen(true);
      });
      socket.on("payment:confirmed", (data: any) => {
        toast.success(`🎉 Paiement validé ! Votre forfait ${data?.planName || "Vendeur IA"} est désormais actif.`);
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        setConfirmedPaymentData(data);
        setIsCompletionModalOpen(true);
      });
      socket.on("payment:update", () => {
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      });
    }
    return () => {
      socket?.off("whatsapp:connected");
      socket?.off("payment:confirmed");
      socket?.off("payment:update");
    };
  }, [socket, queryClient]);

  if (isLoading) {
    return (
      <div className="flex h-[65vh] items-center justify-center">
        <VendeurIALoader size="lg" label="Chargement de votre boutique..." />
      </div>
    );
  }

  const activeWhatsApp = dashboard?.merchant?.whatsappNumber || dashboard?.merchant?.phone || dashboard?.whatsappConnection?.phoneNumber || user?.whatsappNumber || "";
  const isWhatsAppExplicitlyDisconnected =
    !isFounder &&
    (dashboard?.merchant?.whatsappConfig?.status === "disconnected" ||
     dashboard?.whatsappConnection?.status === "DISCONNECTED" ||
     dashboard?.whatsappConnection?.status === "disconnected");

  const isWhatsAppConnected =
    isFounder ||
    (!isWhatsAppExplicitlyDisconnected &&
    (dashboard?.whatsappConnection?.status === "CONNECTED" ||
     dashboard?.whatsappConnection?.status === "connected" ||
     dashboard?.merchant?.whatsappConfig?.status === "connected" ||
     dashboard?.merchant?.whatsappConfig?.provider === "meta" ||
     (dashboard?.merchant?.whatsappConfig?.provider === "meta" &&
      dashboard?.merchant?.whatsappConfig?.status === "connected" &&
      Boolean(dashboard?.merchant?.whatsappConfig?.meta?.phoneNumberId))));
  const isPaidActive = isFounder || dashboard?.merchant?.subscription?.status === "active";
  const productsCount = dashboard?.products?.length || 0;
  const hasProducts = productsCount > 0 || Boolean(dashboard?.setupStatus?.steps?.find((s: any) => s.id === "products")?.completed);
  const isFullyOperational = isFounder || dashboard?.setupStatus?.isFullyOperational;
  const isPaused = isPaidActive && dashboard?.merchant?.aiSettings?.autoReply === false;
  const isExpired = !isFounder && dashboard?.merchant?.subscription?.status === "past_due";
  const showAssistant = !isFounder && (!isFullyOperational || isPaused || isExpired);
  const isEssentialPlan = isPaidActive && (dashboard?.merchant?.subscription?.plan === "essential" || dashboard?.merchant?.subscription?.planId?.toLowerCase().includes("essential"));
  const canUpgradeToPro = isEssentialPlan && !isFounder;

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-10 space-y-8 pb-24 md:pb-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-2">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter uppercase text-white flex items-center gap-3 sm:gap-4">
            <LayoutDashboard className="text-vendeur-emerald shrink-0" size={32} />
            <span>Tableau de Bord</span>
          </h1>
          <p className="text-white/50 text-xs sm:text-sm md:text-base font-medium">Gérez votre croissance et suivez vos performances en direct.</p>
          {activeWhatsApp && (
            <div className="pt-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate("/settings?tab=connexions#whatsapp")}
                className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-3 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-vendeur-emerald/30 text-white transition-all group shadow-sm text-left cursor-pointer"
                title={isFounder ? "Ligne Officielle Meta Cloud API (Fondateur Système)" : "Gérer votre ligne WhatsApp dans les paramètres"}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", isWhatsAppConnected ? "bg-vendeur-emerald animate-pulse" : "bg-amber-400")} />
                  <MessageCircle size={16} className={cn("shrink-0", isWhatsAppConnected ? "text-vendeur-emerald" : "text-amber-400")} />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider hidden sm:inline">Ligne WhatsApp :</span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-white group-hover:text-vendeur-emerald transition-colors truncate">
                      {formatDisplayPhone(activeWhatsApp, dashboard?.merchant?.country || "CI")}
                    </span>
                  </div>
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shrink-0 border",
                  isWhatsAppConnected 
                    ? "bg-vendeur-emerald/15 text-vendeur-emerald border-vendeur-emerald/30" 
                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                )}>
                  {isWhatsAppConnected ? (isFounder ? "Live (Meta)" : "Live") : "Paramètres"}
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {canUpgradeToPro && (
            <button
              onClick={() => setIsOffersModalOpen(true)}
              className="h-12 px-5 rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/30 text-vendeur-emerald text-xs font-black uppercase tracking-wider hover:bg-vendeur-emerald hover:text-vendeur-coal transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
            >
              <Zap size={16} />
              <span>Passer en Pro</span>
            </button>
          )}
        </div>
      </header>

      <HomePanel 
        dashboard={dashboard} 
        hasProducts={hasProducts}
        isFounder={isFounder}
        onOpenTestIA={() => setIsTestIAOpen(true)}
        onOpenOffers={() => setIsOffersModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onConnectWhatsApp={() => navigate("/settings?tab=connexions#whatsapp")}
      />

      <VendeurIAPlaygroundModal
        isOpen={isTestIAOpen}
        onClose={() => setIsTestIAOpen(false)}
        merchant={dashboard?.merchant}
      />

      <SetupCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => {
          setIsCompletionModalOpen(false);
          setConfirmedPaymentData(null);
        }}
        businessName={dashboard?.merchant?.businessName || "Votre boutique"}
        paymentDetails={
          confirmedPaymentData ||
          (isPaidActive
            ? {
                planName: dashboard?.merchant?.subscription?.plan,
                billingInterval: dashboard?.merchant?.subscription?.billingInterval,
                expiresAt: dashboard?.merchant?.subscription?.expiresAt
              }
            : null)
        }
        isPaymentConfirmed={Boolean(confirmedPaymentData || isPaidActive)}
      />

      <StepSuccessModal
        isOpen={stepSuccessModal.isOpen}
        onClose={() => setStepSuccessModal((s) => ({ ...s, isOpen: false }))}
        completedStepId={stepSuccessModal.completedStepId}
        completedStepLabel={stepSuccessModal.completedStepLabel}
        nextStep={stepSuccessModal.nextStep}
        businessName={dashboard?.merchant?.businessName}
      />

      <StepMilestoneModal
        isOpen={isWhatsAppMilestoneOpen}
        onClose={() => setIsWhatsAppMilestoneOpen(false)}
        title="Étape 1 validée : WhatsApp Connecté !"
        subtitle={`Félicitations ${dashboard?.merchant?.businessName || ""}, votre Vendeur IA est désormais relié à votre ligne WhatsApp. Passons à l'étape suivante : ajoutez vos produits !`}
        stepNumber={2}
        totalSteps={5}
        score={40}
        primaryAction={{
          label: "Ajouter mes produits",
          href: "/products",
          isPrimary: true
        }}
        secondaryAction={{
          label: "Tester le simulateur IA",
          onClick: () => setIsTestIAOpen(true)
        }}
        dashboardActionLabel="Voir mon Tableau de Bord"
        onDashboardClick={() => setIsWhatsAppMilestoneOpen(false)}
      />

      <OffersModal
        isOpen={isOffersModalOpen}
        onClose={() => setIsOffersModalOpen(false)}
      />

      <ShareShopModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        merchant={dashboard?.merchant}
        shopUrl={getMerchantShopUrl(dashboard?.merchant)}
      />
    </main>
  );
}

function HomePanel({
  dashboard,
  hasProducts,
  isFounder,
  onOpenTestIA,
  onOpenOffers,
  onOpenShare,
  onConnectWhatsApp
}: {
  dashboard: any;
  hasProducts: boolean;
  isFounder: boolean;
  onOpenTestIA: () => void;
  onOpenOffers: () => void;
  onOpenShare: () => void;
  onConnectWhatsApp?: () => void;
}) {
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isDailyStatusModalOpen, setIsDailyStatusModalOpen] = useState(false);
  const [hasCopiedShopUrl, setHasCopiedShopUrl] = useState(false);
  const tips = dashboard?.aiGrowthAdvice?.tips || [];
  const status = dashboard?.merchant?.whatsappConfig?.status || 'disconnected';
  const isFullyOperational = dashboard?.setupStatus?.isFullyOperational;
  const isPaidActive = dashboard?.merchant?.subscription?.status === "active";
  const isPaused = isPaidActive && dashboard?.merchant?.aiSettings?.autoReply === false;
  const isExpired = dashboard?.merchant?.subscription?.status === "past_due";
  const showAssistant = !isFullyOperational || isPaused || isExpired;
  const isEssentialPlan = isPaidActive && (dashboard?.merchant?.subscription?.plan === "essential" || dashboard?.merchant?.subscription?.planId?.toLowerCase().includes("essential"));
  const canUpgradeToPro = isEssentialPlan && !isFounder;
  const productsCount = dashboard?.products?.length || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* 
        ASSISTANT GUIDAGE EN COURS DE CONFIGURATION OU EN CAS DE PAUSE/EXPIRATION
        Si la boutique est en cours de configuration ou nécessite une action vitale (pause, expiration),
        l'Assistant SmartAssistantCard prend la priorité absolue.
      */}
      {showAssistant && !isFounder && (
        <SmartAssistantCard
          dashboard={dashboard}
          onOpenTestIA={onOpenTestIA}
          onOpenShare={onOpenShare}
          onConnectWhatsApp={onConnectWhatsApp}
        />
      )}

      {/* MOBILE-ONLY UPGRADE BUTTON */}
      {canUpgradeToPro && (
        <div className="md:hidden">
          <button
            onClick={onOpenOffers}
            className="w-full min-h-[52px] h-13 px-4 rounded-2xl bg-vendeur-emerald/15 border border-vendeur-emerald/30 text-vendeur-emerald text-xs font-black uppercase tracking-wider hover:bg-vendeur-emerald hover:text-vendeur-coal transition-all flex items-center justify-center text-center gap-2 active:scale-95 cursor-pointer shadow-sm"
          >
            <Zap size={16} className="shrink-0" />
            <span>Passer en Pro</span>
          </button>
        </div>
      )}

      {/* 
        CONSEILLER DE CROISSANCE IA
        Affiché lorsque la boutique est 100% opérationnelle pour propulser les ventes du quotidien
      */}
      {isFullyOperational && !isPaused && !isExpired && (
        <section className="relative overflow-hidden bg-vendeur-emerald/10 border border-vendeur-emerald/20 p-4 sm:p-6 md:p-7 rounded-3xl sm:rounded-[2.5rem] group shadow-2xl space-y-6">
          <div className="absolute top-0 right-0 p-8 md:p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
             <Sparkles size={160} className="text-vendeur-emerald" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
              <div className="flex items-center gap-3 sm:gap-4 md:gap-5 min-w-0">
                <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center group-hover:rotate-3 transition-transform shrink-0">
                  <AssistantIcon size="100%" color="#10B981" withBackground={false} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight leading-tight truncate">
                    Conseiller de Croissance IA
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={cn("h-2 w-2 md:h-2.5 md:w-2.5 rounded-full", (status === 'connected' && isPaidActive) ? "bg-vendeur-emerald" : "bg-amber-400")} />
                    <p className={cn("text-xs sm:text-xs font-bold uppercase tracking-wider truncate", (status === 'connected' && isPaidActive) ? "text-vendeur-emerald" : "text-amber-400")}>
                      {status === 'connected' ? (isPaidActive ? "IA en ligne & active 24h/24" : "Mode Découverte (Activation requise)") : "IA en attente de connexion"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto">

                <button
                  type="button"
                  onClick={() => setIsPauseModalOpen(true)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[48px] h-11 sm:h-12 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                  title="Mettre le Vendeur IA en pause pour répondre manuellement"
                >
                  <PauseCircle size={15} className="shrink-0" />
                  <span>Mettre en pause</span>
                </button>

                <button
                  onClick={onOpenTestIA}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[48px] h-11 sm:h-12 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <Play size={14} fill="currentColor" className="shrink-0" />
                  <span>Tester</span>
                </button>

                <button
                  onClick={() => setIsDailyStatusModalOpen(true)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[48px] h-11 sm:h-12 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-vendeur-emerald text-vendeur-coal hover:bg-emerald-400 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-vendeur-emerald/20 cursor-pointer active:scale-95 whitespace-nowrap"
                >
                  <Sparkles size={16} className="shrink-0" />
                  <span>Mes Statuts du Jour</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
              {tips.map((tip: any, i: number) => (
                <Link
                  key={i}
                  to={tip.action || "#"}
                  className="bg-black/40 backdrop-blur-md border border-white/5 p-4 sm:p-5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed hover:border-vendeur-emerald/40 hover:bg-black/60 transition-all active:scale-[0.98] text-white/90"
                >
                  {tip.text || tip}
                </Link>
              ))}
              {tips.length === 0 && (
                 <div className="col-span-3 text-white/40 text-xs sm:text-sm italic">Analyse de votre business en cours...</div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 
        BLOC OFFICIEL : VOTRE VITRINE EN LIGNE
        Affiché lorsque la configuration initiale est terminée pour un accès direct permanent
      */}
      {!showAssistant && (
        <section className="relative overflow-hidden bg-vendeur-coal/90 border border-white/10 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] shadow-2xl group space-y-4 sm:space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="h-11 w-11 sm:h-14 sm:w-14 rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 flex items-center justify-center text-vendeur-emerald shrink-0 group-hover:scale-105 transition-transform mt-0.5 sm:mt-0">
                <Store size={22} className="sm:hidden" />
                <Store size={26} className="hidden sm:block" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                  <h2 className="text-base sm:text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                    Votre Vitrine en Ligne
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/30 text-vendeur-emerald text-[10px] font-black uppercase tracking-wider shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-vendeur-emerald animate-pulse" />
                    {hasProducts ? `${productsCount} article${productsCount > 1 ? "s" : ""} en ligne` : "Vitrine active"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/50 font-medium mt-1 leading-snug">
                  Partagez ce lien à vos clients sur WhatsApp, Instagram ou TikTok pour commander en 1 clic.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={onOpenShare}
                className="flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[48px] h-11 sm:h-12 px-3 sm:px-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 group shadow-sm whitespace-nowrap"
                title="Propulser & Obtenir le QR Code"
              >
                <Share2 size={15} className="text-vendeur-emerald group-hover:scale-110 transition-transform shrink-0" />
                <span className="hidden xs:inline sm:inline">Propulser / QR Code</span>
                <span className="xs:hidden sm:hidden">Partager</span>
              </button>

              <Link
                to={getMerchantShopPath(dashboard?.merchant)}
                target="_blank"
                className="flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] sm:min-h-[48px] h-11 sm:h-12 px-3 sm:px-6 rounded-2xl bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-vendeur-emerald/20 cursor-pointer active:scale-95 group hover:scale-[1.02] whitespace-nowrap"
                title="Ouvrir la vitrine publique"
              >
                <span>Voir ma Vitrine</span>
                <ExternalLink size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
              </Link>
            </div>
          </div>

          {/* Storefront Link Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 sm:p-2 bg-black/50 border border-white/10 rounded-2xl">
            <div className="flex-1 flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-0 min-w-0 overflow-hidden">
              <Globe size={14} className="text-vendeur-emerald shrink-0" />
              <span className="text-[11px] sm:text-xs font-mono font-bold text-white/90 truncate select-all">
                {getMerchantShopUrl(dashboard?.merchant)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const url = getMerchantShopUrl(dashboard?.merchant);
                navigator.clipboard.writeText(url);
                setHasCopiedShopUrl(true);
                toast.success("Lien de votre vitrine copié ! 🚀");
                setTimeout(() => setHasCopiedShopUrl(false), 2000);
              }}
              className={cn(
                "min-h-[38px] sm:min-h-[40px] px-4 sm:px-5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95",
                hasCopiedShopUrl
                  ? "bg-vendeur-emerald text-vendeur-coal"
                  : "bg-white/10 hover:bg-white/15 text-white"
              )}
            >
              {hasCopiedShopUrl ? (
                <>
                  <Check size={13} className="shrink-0" />
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <Copy size={13} className="text-vendeur-emerald shrink-0" />
                  <span>Copier le lien</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* Modal de Confirmation de Mise en Pause */}
      <PauseConfirmationModal
        isOpen={isPauseModalOpen}
        onClose={() => setIsPauseModalOpen(false)}
      />

      {/* Modal des Statuts du Jour */}
      <DailyStatusModal
        isOpen={isDailyStatusModalOpen}
        onClose={() => setIsDailyStatusModalOpen(false)}
      />

      <div id="tour-dashboard-stats" className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 md:gap-6">
        <MetricCard
          icon={<Banknote className="text-vendeur-emerald" size={22} />}
          label="Revenu Jour"
          value={formatAmount(dashboard?.metrics?.revenueToday || 0)}
          suffix={dashboard?.merchant?.currency || "XOF"}
        />
        <MetricCard icon={<MessageCircle className="text-blue-400" size={22} />} label="Conversations" value={String(dashboard?.metrics?.conversationsToday || 0)} />
        <MetricCard icon={<Zap className="text-amber-400" size={22} />} label="Commandes" value={String(dashboard?.metrics?.ordersToday || 0)} />
        <MetricCard icon={<TrendingUp className="text-rose-400" size={22} />} label="Conversion" value={`${dashboard?.metrics?.conversionRate || 0}%`} />
      </div>

      <section className="bg-vendeur-coal border border-white/5 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl">
        <h2 className="text-lg sm:text-xl font-black mb-6 uppercase tracking-tight text-white">Pipeline de Vente</h2>
        <div className="space-y-4">
          <PipelineStep label="Discussion WhatsApp" value={dashboard?.metrics?.conversationsToday || 0} max={Math.max(20, dashboard?.metrics?.conversationsToday || 0)} color="bg-blue-400" />
          <PipelineStep label="Paiement Confirmé" value={dashboard?.metrics?.ordersToday || 0} max={Math.max(20, dashboard?.metrics?.conversationsToday || 0)} color="bg-amber-400" />
          <PipelineStep label="Taux de Conversion" value={dashboard?.metrics?.conversionRate || 0} max={100} color="bg-vendeur-emerald" />
        </div>
      </section>

      {/* DYNAMIC AI INSIGHTS SECTION */}
      {dashboard?.merchant?.knowledge?.businessRules?.dynamicInsights?.length > 0 && (
        <section className="bg-vendeur-coal border border-white/5 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="text-amber-400" size={20} />
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">Conseils Rentables de votre Vendeur IA</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboard.merchant.knowledge.businessRules.dynamicInsights.slice(-4).reverse().map((insight: any, i: number) => (
              <div key={i} className="bg-vendeur-bg border border-white/5 p-5 rounded-2xl flex items-start gap-4 hover:border-vendeur-emerald/30 transition-all">
                <div className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                  insight.type === 'product' ? "bg-blue-500/10 text-blue-400" :
                  insight.type === 'customer' ? "bg-purple-500/10 text-purple-400" : "bg-emerald-500/10 text-emerald-400"
                )}>
                  {insight.type === 'product' ? <Package size={18} /> :
                   insight.type === 'customer' ? <AssistantIcon size={20} withBackground={false} /> : <TrendingUp size={18} />}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed text-white/90">{insight.insight}</p>
                  <p className="text-[10px] text-white/30 uppercase font-black mt-2">Appris le {new Date(insight.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: string; suffix?: string }) {
  return (
    <div className="bg-vendeur-coal/50 backdrop-blur-sm border border-white/10 p-4 xs:p-5 md:p-6 rounded-2xl sm:rounded-[2rem] space-y-3 sm:space-y-4 shadow-xl hover:border-white/20 transition-all group">
      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">{icon}</div>
      <div>
        <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-white/40 truncate">{label}</p>
        <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1">
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-white">{value}</p>
          {suffix && <span className="text-[10px] sm:text-xs font-black text-white/30 uppercase">{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

function PipelineStep({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percentage = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="w-36 sm:w-48 text-xs sm:text-sm font-bold text-white/70 truncate">{label}</div>
      <div className="flex-1 h-3.5 bg-white/5 rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-1000", color)} style={{ width: `${percentage}%` }} />
      </div>
      <div className="w-12 text-right font-black text-xs sm:text-sm text-white">{value}</div>
    </div>
  );
}


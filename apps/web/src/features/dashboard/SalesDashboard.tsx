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
  Plus
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
  const { accessToken } = useAuthStore();
  const { isFounder } = useFounderRole();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const isTestIAOpen = searchParams.get("test_ia") === "true";
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
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

  // Check if first-time user to display the welcome Offers modal
  useEffect(() => {
    if (!dashboard?.merchant?._id || isFounder) return;
    const isPaidActive = dashboard.merchant.subscription?.status === "active";
    const latestPaymentIntent = dashboard?.latestPaymentIntent;
    const isUnderVerification = Boolean(
      latestPaymentIntent &&
      (latestPaymentIntent.status === "under_verification" ||
       latestPaymentIntent.status === "pending" ||
       latestPaymentIntent.status === "payment_detected" ||
       latestPaymentIntent.status === "awaiting_payment")
    );
    const storageKey = `vendeur_welcome_offers_seen_${dashboard.merchant._id}`;
    const alreadySeen = localStorage.getItem(storageKey);

    if (!isPaidActive && !isUnderVerification && !alreadySeen) {
      setIsOffersModalOpen(true);
      localStorage.setItem(storageKey, "true");
    }
  }, [dashboard?.merchant?._id, dashboard?.merchant?.subscription?.status, dashboard?.latestPaymentIntent, isFounder]);

  // Check if all setup steps are completed to auto-trigger celebration modal once
  useEffect(() => {
    if (!dashboard?.setupStatus || !dashboard?.merchant?._id || isFounder) return;
    
    const { isFullyOperational } = dashboard.setupStatus;
    const storageKey = `vendeur_ia_setup_celebrated_${dashboard.merchant._id}`;
    const alreadyCelebrated = localStorage.getItem(storageKey);

    if (isFullyOperational && !alreadyCelebrated) {
      setIsCompletionModalOpen(true);
      localStorage.setItem(storageKey, "true");
    }
  }, [dashboard?.setupStatus, dashboard?.merchant?._id, isFounder]);

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
      });
      socket.on("payment:confirmed", (data: any) => {
        toast.success(`🎉 Paiement validé ! Votre forfait ${data?.planName || "Vendeur IA"} est désormais actif.`);
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
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

  const activeWhatsApp = dashboard?.merchant?.whatsappNumber || dashboard?.merchant?.phone || dashboard?.whatsappConnection?.phoneNumber || "";
  const isWhatsAppConnected = dashboard?.whatsappConnection?.status === "CONNECTED" || dashboard?.merchant?.whatsappConfig?.status === "connected" || Boolean(dashboard?.merchant?.whatsappNumber);
  const isPaidActive = dashboard?.merchant?.subscription?.status === "active";
  const productsCount = dashboard?.products?.length || 0;
  const hasProducts = productsCount > 0 || Boolean(dashboard?.setupStatus?.steps?.find((s: any) => s.id === "products")?.completed);
  const isFullyOperational = dashboard?.setupStatus?.isFullyOperational;
  const isPaused = isPaidActive && dashboard?.merchant?.aiSettings?.autoReply === false;
  const isExpired = dashboard?.merchant?.subscription?.status === "past_due";
  const showAssistant = !isFullyOperational || isPaused || isExpired;

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
            <div className="pt-2">
              <Link
                to="/settings?tab=connexions"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-vendeur-emerald/30 text-white/90 transition-all group shadow-sm"
                title="Gérer la ligne WhatsApp"
              >
                <span className={cn("h-2 w-2 rounded-full", isWhatsAppConnected ? "bg-vendeur-emerald" : "bg-amber-400")} />
                <MessageCircle size={14} className="text-vendeur-emerald shrink-0" />
                <span className="text-[11px] text-white/50 font-medium">Ligne WhatsApp :</span>
                <span className="text-xs font-mono font-bold text-white group-hover:text-vendeur-emerald transition-colors">
                  {formatDisplayPhone(activeWhatsApp, dashboard?.merchant?.country || "CI")}
                </span>
              </Link>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {!isPaidActive && !isFounder && (
            <button
              onClick={() => setIsOffersModalOpen(true)}
              className="h-12 px-5 rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/30 text-vendeur-emerald text-xs font-black uppercase tracking-wider hover:bg-vendeur-emerald hover:text-vendeur-coal transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
            >
              <Zap size={16} />
              <span>Passer en Pro</span>
            </button>
          )}

          {hasProducts ? (
            <>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="h-12 px-6 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-wider hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center text-center gap-2 cursor-pointer active:scale-95 group shadow-sm"
                title="Propulser votre boutique (Lien & QR Code)"
              >
                <Share2 size={16} className="text-vendeur-emerald group-hover:scale-110 transition-transform" />
                <span>Propulser ma Boutique</span>
              </button>

              <Link
                to={getMerchantShopPath(dashboard?.merchant)}
                target="_blank"
                className="h-12 px-6 rounded-2xl bg-vendeur-emerald text-vendeur-coal text-xs font-black uppercase tracking-wider hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-center gap-2 shadow-lg shadow-vendeur-emerald/20 cursor-pointer"
                title="Voir l'aperçu public de votre boutique"
              >
                <ExternalLink size={16} />
                <span>Aperçu de ma Vitrine</span>
              </Link>
            </>
          ) : !showAssistant && (
            <Link
              to="/products"
              className="h-12 px-5 rounded-2xl bg-vendeur-emerald/15 hover:bg-vendeur-emerald border border-vendeur-emerald/30 text-vendeur-emerald hover:text-vendeur-coal text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
              title="Ajoutez vos produits pour activer votre boutique"
            >
              <Plus size={16} />
              <span>Ajouter mes articles</span>
            </Link>
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
      />

      <VendeurIAPlaygroundModal
        isOpen={isTestIAOpen}
        onClose={() => setIsTestIAOpen(false)}
        merchant={dashboard?.merchant}
      />

      <SetupCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        businessName={dashboard?.merchant?.businessName || "Votre boutique"}
      />

      <StepSuccessModal
        isOpen={stepSuccessModal.isOpen}
        onClose={() => setStepSuccessModal((s) => ({ ...s, isOpen: false }))}
        completedStepId={stepSuccessModal.completedStepId}
        completedStepLabel={stepSuccessModal.completedStepLabel}
        nextStep={stepSuccessModal.nextStep}
        businessName={dashboard?.merchant?.businessName}
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
  onOpenShare
}: {
  dashboard: any;
  hasProducts: boolean;
  isFounder: boolean;
  onOpenTestIA: () => void;
  onOpenOffers: () => void;
  onOpenShare: () => void;
}) {
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const tips = dashboard?.aiGrowthAdvice?.tips || [];
  const status = dashboard?.merchant?.whatsappConfig?.status || 'disconnected';
  const isFullyOperational = dashboard?.setupStatus?.isFullyOperational;
  const isPaidActive = dashboard?.merchant?.subscription?.status === "active";
  const isPaused = isPaidActive && dashboard?.merchant?.aiSettings?.autoReply === false;
  const isExpired = dashboard?.merchant?.subscription?.status === "past_due";
  const showAssistant = !isFullyOperational || isPaused || isExpired;

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
        />
      )}

      {/* MOBILE-ONLY QUICK ACTION BUTTONS (Generous height, non-squished) */}
      <div className={cn("grid gap-3 md:hidden", (!isPaidActive && !isFounder) ? (hasProducts ? "grid-cols-3" : (showAssistant ? "grid-cols-1" : "grid-cols-2")) : (hasProducts ? "grid-cols-2" : (showAssistant ? "hidden" : "grid-cols-1")))}>
        {!isPaidActive && !isFounder && (
          <button
            onClick={onOpenOffers}
            className="min-h-[52px] h-13 px-2 rounded-2xl bg-vendeur-emerald/15 border border-vendeur-emerald/30 text-vendeur-emerald text-[11px] font-black uppercase tracking-wider hover:bg-vendeur-emerald hover:text-vendeur-coal transition-all flex items-center justify-center text-center gap-1.5 active:scale-95 cursor-pointer shadow-sm shrink-0"
          >
            <Zap size={14} className="shrink-0" />
            <span className="truncate">Pack Pro</span>
          </button>
        )}

        {hasProducts ? (
          <>
            <button
              onClick={onOpenShare}
              className="min-h-[52px] h-13 px-3 rounded-2xl bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase tracking-wider hover:bg-white/10 transition-all flex items-center justify-center text-center gap-1.5 active:scale-95 cursor-pointer shadow-sm shrink-0"
            >
              <Share2 size={14} className="shrink-0 text-vendeur-emerald" />
              <span className="truncate">Propulser</span>
            </button>

            <Link
              to={getMerchantShopPath(dashboard?.merchant)}
              target="_blank"
              className="min-h-[52px] h-13 px-3 rounded-2xl bg-vendeur-emerald text-vendeur-coal text-[11px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-center gap-1.5 shadow-lg shadow-vendeur-emerald/20 cursor-pointer shrink-0"
            >
              <ExternalLink size={14} className="shrink-0" />
              <span className="truncate">Ma Vitrine</span>
            </Link>
          </>
        ) : !showAssistant && (
          <Link
            to="/products"
            className="min-h-[52px] h-13 px-3 rounded-2xl bg-vendeur-emerald/15 border border-vendeur-emerald/30 text-vendeur-emerald text-[11px] font-black uppercase tracking-wider hover:bg-vendeur-emerald hover:text-vendeur-coal transition-all flex items-center justify-center text-center gap-2 active:scale-95 cursor-pointer shadow-sm shrink-0"
          >
            <Plus size={15} />
            <span className="truncate">Ajouter mes articles</span>
          </Link>
        )}
      </div>

      {/* 
        CONSEILLER DE CROISSANCE IA
        Affiché lorsque la boutique est 100% opérationnelle pour propulser les ventes du quotidien
      */}
      {isFullyOperational && !isPaused && !isExpired && (
        <section className="relative overflow-hidden bg-vendeur-emerald/10 border border-vendeur-emerald/20 p-5 sm:p-7 md:p-10 rounded-3xl sm:rounded-[2.5rem] md:rounded-[3.5rem] group shadow-2xl space-y-6">
          <div className="absolute top-0 right-0 p-8 md:p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
             <Sparkles size={160} className="text-vendeur-emerald" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-3.5 md:gap-5">
                <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center group-hover:rotate-3 transition-transform shrink-0">
                  <AssistantIcon size="100%" color="#10B981" withBackground={false} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl md:text-3xl font-black text-white uppercase tracking-tight leading-tight truncate">
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

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto">
                {hasProducts && (
                  <button
                    type="button"
                    onClick={onOpenShare}
                    className="flex items-center justify-center gap-2 min-h-[48px] h-12 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider transition-all w-full sm:w-auto cursor-pointer active:scale-95 shrink-0"
                    title="Propulser votre boutique"
                  >
                    <Share2 size={15} className="text-vendeur-emerald" />
                    <span>Propulser ma Boutique</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsPauseModalOpen(true)}
                  className="flex items-center justify-center gap-2 min-h-[48px] h-12 px-4 py-3 rounded-2xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-black uppercase tracking-wider transition-all w-full sm:w-auto cursor-pointer active:scale-95 shrink-0"
                  title="Mettre le Vendeur IA en pause pour répondre manuellement"
                >
                  <PauseCircle size={15} />
                  <span>Mettre en pause</span>
                </button>

                <button
                  onClick={onOpenTestIA}
                  className="flex items-center justify-center gap-2 min-h-[48px] h-12 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider transition-all w-full sm:w-auto cursor-pointer active:scale-95 shrink-0"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Tester</span>
                </button>

                <button
                  onClick={async () => {
                    try {
                      toast.loading("Génération de vos 3 statuts WhatsApp...");
                      await apiClient.post("/api/commerce/whatsapp-status/send-to-me");
                      toast.dismiss();
                      toast.success("Pack de 3 Statuts WhatsApp envoyé sur votre WhatsApp !");
                    } catch (err: any) {
                      toast.dismiss();
                      toast.error(err.response?.data?.error || "Erreur lors de l'envoi des statuts");
                    }
                  }}
                  className="flex items-center justify-center gap-2.5 min-h-[48px] h-12 px-5 py-3 rounded-2xl bg-vendeur-emerald text-vendeur-coal hover:bg-emerald-400 text-xs font-black uppercase tracking-wider transition-all w-full sm:w-auto shadow-lg shadow-vendeur-emerald/20 cursor-pointer active:scale-95 shrink-0"
                >
                  <Sparkles size={16} />
                  <span>Recevoir mes Statuts du Jour</span>
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

      {/* Modal de Confirmation de Mise en Pause */}
      <PauseConfirmationModal
        isOpen={isPauseModalOpen}
        onClose={() => setIsPauseModalOpen(false)}
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

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

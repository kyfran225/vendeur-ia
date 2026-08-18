import React, { useState, useEffect, useRef } from "react";
import {
  QrCode,
  Zap,
  ChevronRight,
  ShieldCheck,
  Bot,
  Loader2,
  Check,
  MessageSquare,
  Sparkles,
  ArrowRight as ArrowRightIcon
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { StepMilestoneModal } from "@/components/ui/StepMilestoneModal";
import { useSocket } from "@/hooks/useSocket";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WhatsAppConnectionFlowProps {
  qrCode: string | null;
  isConnectingSocket?: boolean;
  onInitBaileys: (force?: boolean) => void;
  onCancelScan: () => void;
}

export function WhatsAppConnectionFlow({ qrCode, isConnectingSocket, onInitBaileys, onCancelScan }: WhatsAppConnectionFlowProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const [searchParams] = useSearchParams();
  const isProParam = searchParams.get("pro") === "true";
  const isExpertParam = searchParams.get("expert") === "true";

  const [loading, setLoading] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [mode, setMode] = useState<"qr" | "pairing">("qr");
  const [pairingPhone, setPairingPhone] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [storeWhatsApp, setStoreWhatsApp] = useState("");
  const [metaForm, setMetaForm] = useState({
    phoneNumberId: "",
    wabaId: "",
    accessToken: ""
  });
  const [savingMeta, setSavingMeta] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const { data: dashboard, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard");
      return res.data;
    }
  });

  const merchant = dashboard?.merchant;
  const whatsapp = dashboard?.whatsappConnection;
  const subscription = dashboard?.subscription;

  useEffect(() => {
    if (merchant?.whatsappNumber || merchant?.phone) {
      setStoreWhatsApp(merchant.whatsappNumber || merchant.phone || "");
    }
  }, [merchant?.whatsappNumber, merchant?.phone]);

  useEffect(() => {
    if (merchant?.whatsappConfig) {
      setMetaForm({
        phoneNumberId: merchant.whatsappConfig.phoneNumberId || "",
        wabaId: merchant.whatsappConfig.wabaId || "",
        accessToken: merchant.whatsappConfig.accessToken || ""
      });
    }
  }, [merchant?.whatsappConfig]);

  const isProPlan = isProParam || subscription?.plan === 'pro' || subscription?.offerId?.slug === 'pro' || whatsapp?.connectionType === 'meta';
  const isPackPro = isExpertParam || subscription?.plan === 'business' || subscription?.type === 'pack_pro' || whatsapp?.connectionType === 'expert' || merchant?.expertSetup?.status === 'pending' || merchant?.expertSetup?.status === 'in_progress' || merchant?.whatsappConfig?.packProAssistance === true;
  const isSubscribed = isProPlan || isPackPro || subscription?.status === 'active' || merchant?.subscription?.status === 'active';
  const isConnected = whatsapp?.status === 'CONNECTED' || merchant?.whatsappConfig?.status === 'connected';

  const wasConnectedRef = useRef(isConnected);

  // Direct socket listener for WhatsApp real-time connection event
  useEffect(() => {
    if (!socket) return;

    const handleConnected = () => {
      setShowMilestoneModal(true);
      toast.success("WhatsApp Connecté avec succès ! 🚀");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    };

    socket.on("whatsapp:connected", handleConnected);
    return () => {
      socket.off("whatsapp:connected", handleConnected);
    };
  }, [socket, refetch, queryClient]);

  // Transition from disconnected to connected triggers milestone
  useEffect(() => {
    if (!wasConnectedRef.current && isConnected) {
      setShowMilestoneModal(true);
    }
    wasConnectedRef.current = isConnected;
  }, [isConnected]);

  // Auto-init WhatsApp session ONLY for Essential plan (Baileys QR code)
  useEffect(() => {
    if (isSubscribed && !isPackPro && !isProPlan && !isConnected && !qrCode && mode === "qr") {
      setIsInitializing(true);
      onInitBaileys(true);
    }
  }, [isSubscribed, isPackPro, isProPlan, isConnected, mode]);

  // Clear initializing state once QR arrives
  useEffect(() => {
    if (qrCode) {
      setIsInitializing(false);
    }
  }, [qrCode]);

  useEffect(() => {
    if (qrCode && qrRef.current) {
      qrRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [qrCode]);

  const handleRequestPairingCode = async () => {
    if (!pairingPhone.trim()) {
      toast.error("Entrez votre numéro WhatsApp");
      return;
    }
    setPairingLoading(true);
    setPairingCode(null);
    try {
      const res = await apiClient.post("/api/whatsapp/pairing-code", {
        phoneNumber: pairingPhone.trim()
      });
      setPairingCode(res.data.code);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Impossible de générer le code");
    } finally {
      setPairingLoading(false);
    }
  };

  const handleActivateSystemFleet = async () => {
    setSavingMeta(true);
    try {
      await apiClient.patch("/api/whatsapp/config", { 
        provider: "meta",
        whatsappNumber: storeWhatsApp 
      });
      toast.success("Vendeur IA Pro activé avec succès ! 🚀");
      setShowMilestoneModal(true);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de l'activation.");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleSaveMetaConfig = async () => {
    if (!metaForm.phoneNumberId || !metaForm.accessToken) {
      toast.error("Veuillez remplir le Phone Number ID et le Jeton d'accès Meta (Access Token).");
      return;
    }
    setSavingMeta(true);
    try {
      await apiClient.post("/api/whatsapp/meta-config", metaForm);
      toast.success("Configuration Meta WhatsApp enregistrée et activée ! 🚀");
      setShowMilestoneModal(true);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de l'enregistrement de la configuration Meta.");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleFacebookLogin = () => {
    const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID || dashboard?.systemSettings?.metaConfig?.globalAppId;

    if (!fbAppId) {
      toast.info("L'Embedded Signup Meta nécessite un ID d'App Facebook. Utilisez la saisie manuelle ci-dessous.");
      const formElement = document.getElementById("meta-manual-form");
      if (formElement) formElement.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setSavingMeta(true);

    const launchFbLogin = () => {
      if ((window as any).FB) {
        (window as any).FB.login((response: any) => {
          if (response.authResponse) {
            toast.success("Connexion Facebook réussie ! Synchronisation de votre compte WhatsApp Business...");
            apiClient.post("/api/whatsapp/meta-oauth", { accessToken: response.authResponse.accessToken })
              .then(() => {
                setShowMilestoneModal(true);
                refetch();
                queryClient.invalidateQueries({ queryKey: ["dashboard"] });
              })
              .catch(() => toast.error("Erreur de synchronisation Facebook Meta."))
              .finally(() => setSavingMeta(false));
          } else {
            toast.error("Connexion Facebook annulée.");
            setSavingMeta(false);
          }
        }, { scope: "whatsapp_business_management,whatsapp_business_messaging" });
      } else {
        toast.info("Veuillez renseigner vos identifiants Meta ci-dessous.");
        setSavingMeta(false);
      }
    };

    if ((window as any).FB) {
      launchFbLogin();
    } else {
      toast.info("Initialisation du module Facebook Meta...");
      const existingScript = document.getElementById("facebook-jssdk");
      if (!existingScript) {
        const js = document.createElement("script");
        js.id = "facebook-jssdk";
        js.src = "https://connect.facebook.net/fr_FR/sdk.js";
        js.onload = () => {
          (window as any).FB.init({
            appId: fbAppId,
            cookie: true,
            xfbml: true,
            version: "v20.0"
          });
          launchFbLogin();
        };
        js.onerror = () => {
          toast.info("Veuillez remplir le formulaire ci-dessous.");
          setSavingMeta(false);
        };
        document.body.appendChild(js);
      } else {
        launchFbLogin();
      }
    }
  };

  const isUsingCustomMeta = !!merchant?.whatsappConfig?.phoneNumberId;

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* 1. PAS D'ABONNEMENT ACTIF */}
      {!isSubscribed ? (
        <div className="bg-vendeur-coal border border-white/5 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 text-center space-y-6 sm:space-y-8 animate-in fade-in duration-500">
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white/5 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-white/20 mx-auto">
            <Zap size={36} />
          </div>
          <div className="space-y-3 max-w-sm mx-auto">
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white">Connexion WhatsApp</h3>
            <p className="text-xs sm:text-sm text-white/50 font-medium leading-relaxed">
              Votre commercial IA autonome répond à vos clients sur WhatsApp 24h/24. Pour commencer, activez votre abonnement.
            </p>
          </div>
          <button
            onClick={() => navigate("/offers")}
            className="w-full max-w-md mx-auto h-12 sm:h-14 bg-vendeur-emerald text-vendeur-coal rounded-xl sm:rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20 cursor-pointer"
          >
            <span>Choisir une offre</span>
            <ChevronRight size={16} />
          </button>
        </div>
      ) : isPackPro && !isConnected ? (
        /* 2. PACK PRO / INSTALLATION EXPERT CLÉ EN MAIN */
        (() => {
          const supportPhone = dashboard?.systemSettings?.supportWhatsApp || "+2250700000000";
          const supportMessage = encodeURIComponent(`Bonjour ! J'ai souscrit au Pack Pro Vendeur IA (${merchant?.storeName || 'Ma boutique'}). Je souhaite planifier l'installation de mon Vendeur IA.`);

          return (
            <div className="bg-vendeur-coal border border-vendeur-emerald/30 p-5 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] text-center space-y-6 sm:space-y-8 animate-in fade-in duration-500 shadow-2xl relative overflow-hidden">
              <div className="h-16 w-16 sm:h-20 sm:w-20 bg-vendeur-emerald/10 border border-vendeur-emerald/30 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-vendeur-emerald mx-auto animate-bounce">
                <Sparkles size={36} />
              </div>

              <div className="space-y-2 sm:space-y-3 max-w-md mx-auto">
                <div className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-vendeur-emerald text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2">
                  Pack Pro Clé en Main Activé
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">Votre Vendeur IA est prêt !</h3>
                <p className="text-xs md:text-sm text-white/60 font-medium leading-relaxed">
                  Vous avez choisi la formule <strong className="text-white">Clé en Main</strong>. Notre équipe technique s'occupe de la configuration complète de votre Vendeur IA et de votre catalogue.
                </p>
              </div>

              <div className="p-4 sm:p-6 bg-white/5 border border-white/5 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4 max-w-md mx-auto text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-vendeur-emerald flex items-center gap-2">
                  <Check size={14} /> Étapes prises en charge par l'expert :
                </p>
                <ul className="space-y-2 text-xs font-bold text-white/70">
                  <li className="flex items-center gap-3">✓ Configuration du serveur WhatsApp Pro</li>
                  <li className="flex items-center gap-3">✓ Importation de vos produits & grille tarifaire</li>
                  <li className="flex items-center gap-3">✓ Entraînement de Vendeur IA aux réponses de votre boutique</li>
                  <li className="flex items-center gap-3">✓ Session d'accompagnement direct (30 min)</li>
                </ul>
              </div>

              <div className="pt-2 max-w-md mx-auto space-y-3">
                <a
                  href={`https://wa.me/${supportPhone.replace(/[^0-9]/g, '')}?text=${supportMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 md:h-14 px-4 bg-vendeur-emerald text-vendeur-coal rounded-xl md:rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20"
                >
                  <MessageSquare size={16} className="shrink-0" />
                  <span>Contacter mon Expert Dédié</span>
                </a>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
                  Notre équipe vous recontacte également sous 2h ouvrées.
                </p>
              </div>
            </div>
          );
        })()
      ) : isProPlan && !isConnected ? (
        /* 3. OFFRE PRO AUTONOME (20 000 XOF) - ACTIVATION DIRECTE SANS IMBRICATION */
        <div className="space-y-6 w-full max-w-lg mx-auto text-left py-2">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/30 text-vendeur-emerald text-[9px] font-black uppercase tracking-widest">
              <Zap size={12} />
              Vendeur IA Pro (20 000 XOF)
            </div>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Activation de votre Vendeur IA
            </h3>
            <p className="text-xs sm:text-sm text-white/60 font-medium max-w-sm mx-auto leading-relaxed">
              Renseignez le numéro WhatsApp de votre boutique pour que votre commercial IA commence à répondre 24h/24.
            </p>
          </div>

          {/* Formulaire principal épuré (Single surface) */}
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-vendeur-emerald block px-1">
                Numéro WhatsApp Boutique
              </label>
              <input
                type="tel"
                placeholder="Ex: +225 07 00 00 00 00"
                value={storeWhatsApp}
                onChange={(e) => setStoreWhatsApp(e.target.value)}
                className="w-full h-12 sm:h-14 bg-black/40 border border-white/10 focus:border-vendeur-emerald rounded-xl sm:rounded-2xl px-4 text-sm font-bold text-white outline-none transition-all font-mono placeholder:text-white/20"
              />
            </div>

            <button
              onClick={handleActivateSystemFleet}
              disabled={savingMeta}
              className="w-full h-12 sm:h-14 bg-vendeur-emerald hover:bg-vendeur-emerald/90 text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20 disabled:opacity-50 cursor-pointer"
            >
              {savingMeta ? <Loader2 className="animate-spin shrink-0" size={16} /> : <Check size={16} className="shrink-0" />}
              <span>Activer mon Vendeur IA</span>
            </button>
          </div>

          {/* Options Avancées (Lien discret sans boîte) */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setShowManualForm(!showManualForm)}
              className="text-[10px] sm:text-xs font-bold text-white/40 hover:text-white transition-colors underline underline-offset-4 cursor-pointer"
            >
              {showManualForm ? "Masquer les options avancées" : "⚙️ Vous possédez un numéro WhatsApp Cloud Meta officiel ?"}
            </button>
          </div>

          {/* Formulaire Meta Déplié */}
          {showManualForm && (
            <div className="space-y-4 pt-3 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
              <button
                onClick={handleFacebookLogin}
                disabled={savingMeta}
                className="w-full h-12 bg-[#1877F2] hover:bg-[#166fe5] text-white font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {savingMeta ? <Loader2 className="animate-spin shrink-0" size={16} /> : <ShieldCheck size={16} className="shrink-0" />}
                <span>Se connecter avec Facebook Meta</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-3 text-[8px] font-black text-white/30 uppercase tracking-widest">OU SAISIE MANUELLE</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Phone Number ID</label>
                  <input
                    type="text"
                    placeholder="Ex: 1048593849502"
                    value={metaForm.phoneNumberId}
                    onChange={(e) => setMetaForm({ ...metaForm, phoneNumberId: e.target.value })}
                    className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-3 text-xs font-mono text-white focus:border-vendeur-emerald outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40">WhatsApp Business Account ID (WABA ID)</label>
                  <input
                    type="text"
                    placeholder="Ex: 2049583920194"
                    value={metaForm.wabaId}
                    onChange={(e) => setMetaForm({ ...metaForm, wabaId: e.target.value })}
                    className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-3 text-xs font-mono text-white focus:border-vendeur-emerald outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Jeton d'accès Permanent (Access Token EAAG)</label>
                  <textarea
                    placeholder="Ex: EAAG..."
                    value={metaForm.accessToken}
                    onChange={(e) => setMetaForm({ ...metaForm, accessToken: e.target.value })}
                    className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] font-mono text-white focus:border-vendeur-emerald outline-none transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleSaveMetaConfig}
                  disabled={savingMeta}
                  className="w-full h-12 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {savingMeta ? <Loader2 className="animate-spin shrink-0" size={16} /> : <Check className="shrink-0" size={16} />}
                  <span>Enregistrer mes clés Meta</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : isConnected ? (
        /* 4. DÉJÀ CONNECTÉ (Seamless flat layout without nested card inside card) */
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-left w-full min-w-0 pt-1">
          {loading ? (
            <div className="flex items-center gap-3 py-3 text-white/80 animate-pulse w-full">
              <Loader2 className="animate-spin text-vendeur-emerald shrink-0" size={20} />
              <div className="space-y-0.5">
                <p className="text-xs font-black uppercase text-white tracking-wider">Déconnexion en cours...</p>
                <p className="text-[10px] text-white/40 font-medium">Fermeture de la session WhatsApp en toute sécurité</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-vendeur-emerald/15 border border-vendeur-emerald/30 flex items-center justify-center text-vendeur-emerald shrink-0 mt-0.5 sm:mt-0">
                  <ShieldCheck size={22} className="sm:w-6 sm:h-6" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-vendeur-emerald/15 border border-vendeur-emerald/30 text-vendeur-emerald text-[9px] font-black uppercase tracking-widest shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-vendeur-emerald animate-pulse" />
                      En ligne 24/7
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                      WhatsApp Connecté
                    </h3>
                  </div>
                  <p className="text-xs text-white/60 font-medium leading-relaxed">
                    Mode actif : <strong className="text-vendeur-emerald font-bold">{isUsingCustomMeta ? "Ligne Dédiée Meta" : "Flotte Vendeur IA"}</strong> • Votre commercial IA répond et vend 24h/24.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                <button
                  onClick={() => navigate("/dashboard?test_ia=true")}
                  className="w-full sm:w-auto h-11 px-5 rounded-xl bg-vendeur-emerald hover:bg-vendeur-emerald/90 text-vendeur-coal font-black uppercase tracking-wider text-xs transition-all shadow-lg shadow-vendeur-emerald/20 shrink-0 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Bot size={15} />
                  <span>Tester mon Vendeur IA</span>
                </button>
                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  disabled={loading}
                  className="w-full sm:w-auto h-11 px-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin" size={15} /> : "Déconnecter"}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* 5. EN COURS DE CONNEXION / SELECTION DU MODE (OFFRE ESSENTIELLE BAILEYS) */
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
            <button
              onClick={() => { setMode("qr"); setIsInitializing(true); onInitBaileys(true); }}
              className={cn(
                "flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all cursor-pointer",
                mode === "qr" ? "bg-white text-vendeur-coal shadow-lg" : "text-white/30 hover:text-white"
              )}
            >
              <QrCode size={14} />
              <span>QR Code</span>
            </button>
            <button
              onClick={() => { setMode("pairing"); setPairingCode(null); }}
              className={cn(
                "flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all cursor-pointer",
                mode === "pairing" ? "bg-white text-vendeur-coal shadow-lg" : "text-white/30 hover:text-white"
              )}
            >
              <Zap size={14} />
              <span>Code à 8 chiffres</span>
            </button>
          </div>

          {mode === "qr" ? (
            <div
              ref={qrRef}
              className="bg-vendeur-coal border border-vendeur-emerald/20 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 flex flex-col items-center gap-6 sm:gap-8 animate-in zoom-in-95 duration-500"
            >
              <div className="text-center space-y-3">
                <div className="inline-flex h-14 w-14 rounded-2xl bg-vendeur-emerald/10 items-center justify-center text-vendeur-emerald">
                  <QrCode size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter italic">Connectons votre WhatsApp</h3>
                  <p className="text-xs text-white/40 max-w-[320px] mx-auto font-medium uppercase tracking-widest leading-relaxed">
                    Scannez le QR Code ci-dessous avec WhatsApp (Appareils connectés)
                  </p>
                </div>
              </div>

              {qrCode ? (
                <div className="relative group">
                  <div className="absolute -inset-6 bg-vendeur-emerald/20 blur-3xl rounded-full opacity-100 transition-opacity duration-500 animate-pulse" />
                  <div className="relative p-4 sm:p-6 bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border-[8px] sm:border-[12px] border-white transition-transform overflow-hidden">
                    <img src={qrCode} alt="WhatsApp QR Code" className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72" />
                    
                    {/* Scanner Line */}
                    <div className="absolute left-4 sm:left-6 right-4 sm:right-6 h-1 bg-vendeur-emerald rounded-full opacity-90 z-10 pointer-events-none shadow-[0_0_12px_#10B981] animate-scan" />

                    {/* Connecting Overlay */}
                    {isConnectingSocket && (
                      <div className="absolute inset-0 bg-vendeur-coal/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-300 z-20">
                        <div className="h-14 w-14 sm:h-16 sm:w-16 bg-vendeur-emerald/20 border border-vendeur-emerald/40 rounded-2xl flex items-center justify-center text-vendeur-emerald shadow-xl animate-pulse">
                          <Loader2 className="animate-spin text-vendeur-emerald" size={28} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-black uppercase text-white tracking-wider">Connexion en cours...</p>
                          <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Synchronisation avec votre téléphone</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-56 w-56 sm:h-64 sm:w-64 md:h-72 md:w-72 bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/10">
                  <Loader2 className="animate-spin text-vendeur-emerald/40" size={40} />
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Génération du QR Code...</p>
                </div>
              )}

              <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                <div className={cn(
                  "flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3.5 rounded-xl w-full justify-center border transition-all",
                  isConnectingSocket
                    ? "bg-vendeur-emerald text-vendeur-coal border-vendeur-emerald shadow-lg shadow-vendeur-emerald/20"
                    : "bg-vendeur-emerald/5 text-vendeur-emerald border-vendeur-emerald/10"
                )}>
                  <Loader2 className="animate-spin" size={14} />
                  <span>{isConnectingSocket ? "Connexion en cours..." : qrCode ? "En attente de scan..." : "Préparation..."}</span>
                </div>

                <button
                  onClick={() => { setIsInitializing(true); onInitBaileys(true); }}
                  className="text-[9px] font-black uppercase tracking-widest text-vendeur-emerald/80 hover:text-vendeur-emerald transition-all py-1 cursor-pointer"
                >
                  Régénérer le QR Code
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-vendeur-coal border border-vendeur-emerald/20 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 flex flex-col gap-6 shadow-2xl">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Code d'association WhatsApp</h3>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">
                  Idéal si vous utilisez WhatsApp sur ce même appareil.
                </p>
              </div>

              <div className="space-y-4">
                <input
                  type="tel"
                  placeholder="Ex: +2250700000000"
                  value={pairingPhone}
                  onChange={(e) => setPairingPhone(e.target.value)}
                  className="w-full h-12 sm:h-14 px-4 sm:px-6 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white font-bold placeholder:text-white/20 focus:border-vendeur-emerald outline-none transition-all text-xs sm:text-sm"
                />

                <button
                  onClick={handleRequestPairingCode}
                  disabled={pairingLoading}
                  className="w-full h-12 sm:h-14 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/20 disabled:opacity-50 cursor-pointer"
                >
                  {pairingLoading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                  <span>Obtenir mon code</span>
                </button>
              </div>

              {pairingCode && (
                <div className="p-5 sm:p-6 bg-vendeur-emerald/10 border border-vendeur-emerald/30 rounded-2xl text-center space-y-3 animate-in zoom-in-95">
                  <p className="text-[10px] font-black uppercase text-vendeur-emerald tracking-widest">Entrez ce code dans WhatsApp :</p>
                  <div className="text-2xl sm:text-3xl font-black text-white tracking-[0.25em] sm:tracking-[0.3em] font-mono select-all bg-black/40 py-3 rounded-xl border border-white/5">
                    {pairingCode}
                  </div>
                  <p className="text-[9px] text-white/40 uppercase tracking-wider">WhatsApp → Appareils connectés → Associer avec un numéro</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDisconnectConfirm}
        onClose={() => setShowDisconnectConfirm(false)}
        onConfirm={async () => {
          setLoading(true);
          try {
            await apiClient.post("/api/whatsapp/disconnect");
            toast.success("WhatsApp déconnecté avec succès.");
            
            // Instant optimistic update so UI transitions immediately without lag
            queryClient.setQueryData(["dashboard"], (old: any) => {
              if (!old) return old;
              return {
                ...old,
                whatsappConnection: { ...old.whatsappConnection, status: "DISCONNECTED" },
                merchant: {
                  ...old.merchant,
                  whatsappConfig: { ...old.merchant?.whatsappConfig, status: "disconnected" }
                }
              };
            });
            setShowDisconnectConfirm(false);
            await refetch();
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          } catch (e: any) {
            toast.error("Erreur lors de la déconnexion.");
          } finally {
            setLoading(false);
          }
        }}
        title="Déconnecter WhatsApp ?"
        message="Votre assistant IA ne pourra plus répondre automatiquement à vos clients sur WhatsApp jusqu'à sa reconnexion."
        confirmLabel="Oui, déconnecter"
        cancelLabel="Conserver la connexion"
        type="warning"
        isLoading={loading}
      />

      {/* WhatsApp Connected Step Milestone Modal (ALWAYS RENDERED) */}
      {(() => {
        const setupSteps = dashboard?.setupStatus?.steps || [];
        const hasProducts = setupSteps.find((s: any) => s.id === 'products')?.completed;
        const hasPayments = setupSteps.find((s: any) => s.id === 'payments')?.completed;
        const hasDelivery = setupSteps.find((s: any) => s.id === 'delivery')?.completed;

        let nextActionConfig = {
          label: "Étape suivante : Ajouter des Articles",
          sublabel: "Enrichissez votre catalogue",
          href: "/products"
        };

        if (!hasProducts) {
          nextActionConfig = {
            label: "Étape suivante : Ajouter des Articles",
            sublabel: "Ajoutez vos articles au catalogue",
            href: "/products"
          };
        } else if (!hasPayments) {
          nextActionConfig = {
            label: "Étape suivante : Moyens de Paiement",
            sublabel: "Activez Wave, OM, MTN...",
            href: "/settings?tab=boutique#payments"
          };
        } else if (!hasDelivery) {
          nextActionConfig = {
            label: "Étape suivante : Tarifs de Livraison",
            sublabel: "Définissez vos zones d'envoi",
            href: "/settings?tab=boutique#delivery"
          };
        } else {
          nextActionConfig = {
            label: "Tester mon Vendeur IA",
            sublabel: "Simulez des ventes en direct",
            href: "/dashboard?test_ia=true"
          };
        }

        return (
          <StepMilestoneModal
            isOpen={showMilestoneModal}
            onClose={() => setShowMilestoneModal(false)}
            title="WhatsApp Connecté ! 🚀"
            subtitle="Votre commercial IA est désormais synchronisé avec votre ligne WhatsApp et prêt à répondre 24h/24."
            score={dashboard?.setupStatus?.score || 60}
            primaryAction={nextActionConfig}
            secondaryAction={{
              label: "Personnaliser le ton de Vendeur IA",
              href: "/settings?tab=personnalite"
            }}
            dashboardActionLabel="Retour au Tableau de Bord"
            autoRedirectSeconds={7}
            autoRedirectTo={nextActionConfig.href}
          />
        );
      })()}
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import {
  QrCode,
  Zap,
  ChevronRight,
  ShieldCheck,
  Bot,
  Loader2,
  Check,
  ArrowLeft,
  AlertCircle,
  MessageSquare,
  HelpCircle,
  ArrowRight as ArrowRightIcon
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { StepMilestoneModal } from "@/components/ui/StepMilestoneModal";

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

  const isProPlan = isProParam || subscription?.plan === 'pro' || whatsapp?.connectionType === 'meta';
  const isPackPro = isExpertParam || subscription?.plan === 'business' || subscription?.type === 'pack_pro' || whatsapp?.connectionType === 'expert';
  const isSubscribed = isProPlan || isPackPro || subscription?.status === 'active' || merchant?.subscription?.status === 'active';
  const isConnected = whatsapp?.status === 'CONNECTED' || merchant?.whatsappConfig?.status === 'connected';

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const wasConnectedRef = useRef(isConnected);

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

  // CAS 1: PAS D'ABONNEMENT ACTIF
  if (!isSubscribed) {
    return (
      <div className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8 md:p-12 text-center space-y-8 animate-in fade-in duration-500">
        <div className="h-20 w-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/20 mx-auto">
          <Zap size={40} />
        </div>
        <div className="space-y-4">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white">WhatsApp</h3>
          <p className="text-sm text-white/40 font-bold uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
            Votre vendeur IA travaille sur WhatsApp. Pour commencer, choisissez une offre.
          </p>
        </div>
        <button
          onClick={() => navigate("/offers")}
          className="w-full h-16 bg-white text-vendeur-coal rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-vendeur-emerald transition-all active:scale-95 shadow-xl"
        >
          Voir les offres
          <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  // CAS 2: PACK PRO / INSTALLATION EXPERT CLE EN MAIN
  if (isPackPro && !isConnected) {
    const supportPhone = dashboard?.systemSettings?.supportWhatsApp || "+2250700000000";
    const supportMessage = encodeURIComponent(`Bonjour ! J'ai souscrit au Pack Pro Vendeur IA (${merchant?.storeName || 'Ma boutique'}). Je souhaite planifier l'installation de mon Vendeur IA.`);

    return (
      <div className="bg-vendeur-coal border border-vendeur-emerald/30 p-5 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[2.5rem] text-center space-y-6 sm:space-y-8 animate-in fade-in duration-500 shadow-2xl relative overflow-hidden">
        <div className="h-16 w-16 sm:h-20 sm:w-20 bg-vendeur-emerald/10 border border-vendeur-emerald/30 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-vendeur-emerald mx-auto animate-bounce">
          <Bot size={36} className="sm:hidden" />
          <Bot size={44} className="hidden sm:block" />
        </div>

        <div className="space-y-2 sm:space-y-3 max-w-md mx-auto">
          <div className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-vendeur-emerald text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2">
            Pack Pro Clé en Main Activé
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">Votre IA est en cours de déploiement !</h3>
          <p className="text-xs md:text-sm text-white/60 font-medium leading-relaxed">
            Vous avez choisi la formule **Clé en Main**. Notre équipe technique s'occupe de la configuration complète de votre Vendeur IA et de votre catalogue.
          </p>
        </div>

        <div className="p-4 sm:p-6 bg-white/5 border border-white/5 rounded-2xl sm:rounded-3xl space-y-3 sm:space-y-4 max-w-md mx-auto text-left">
          <p className="text-[10px] font-black uppercase tracking-widest text-vendeur-emerald flex items-center gap-2">
            <Check size={14} /> Étapes prises en charge par l'expert :
          </p>
          <ul className="space-y-2 text-xs font-bold text-white/70">
            <li className="flex items-center gap-3">✓ Configuration du serveur WhatsApp Pro</li>
            <li className="flex items-center gap-3">✓ Importation de vos produits & grille tarifaire</li>
            <li className="flex items-center gap-3">✓ Entraînement de l'IA aux réponses de votre boutique</li>
            <li className="flex items-center gap-3">✓ Session d'accompagnement direct (30 min)</li>
          </ul>
        </div>

        <div className="pt-2 max-w-md mx-auto space-y-3">
          <a
            href={`https://wa.me/${supportPhone.replace(/[^0-9]/g, '')}?text=${supportMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 md:h-16 px-4 bg-vendeur-emerald text-vendeur-coal rounded-xl md:rounded-2xl font-black uppercase tracking-wider md:tracking-widest text-[11px] md:text-xs flex items-center justify-center gap-2 md:gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20"
          >
            <MessageSquare size={16} className="md:w-5 md:h-5 shrink-0" />
            <span>Contacter mon Expert Dédié</span>
          </a>
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
            Notre équipe vous recontacte également sous 2h ouvrées.
          </p>
        </div>

        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-64 w-64 bg-vendeur-emerald/5 blur-[100px] rounded-full" />
      </div>
    );
  }

  // CAS 3: OFFRE PRO AUTONOME (20 000 XOF) - META CLOUD API (AUCUN QR CODE)
  if (isProPlan && !isConnected) {
    const handleActivateSystemFleet = async () => {
      setSavingMeta(true);
      try {
        await apiClient.patch("/api/whatsapp/config", { 
          provider: "meta",
          whatsappNumber: storeWhatsApp 
        });
        toast.success("Vendeur IA Pro activé avec succès ! 🚀");
        refetch();
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
        refetch();
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
                .then(() => refetch())
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

    return (
      <div className="bg-vendeur-coal border border-vendeur-emerald/30 p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] text-center space-y-6 sm:space-y-8 animate-in fade-in duration-500 shadow-2xl relative overflow-hidden">
        <div className="h-16 w-16 sm:h-20 sm:w-20 bg-vendeur-emerald/10 border border-vendeur-emerald/30 rounded-2xl sm:rounded-[2rem] flex items-center justify-center text-vendeur-emerald mx-auto shrink-0">
          <Zap size={32} className="sm:hidden" />
          <Zap size={40} className="hidden sm:block" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <div className="inline-block px-3 py-1 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-vendeur-emerald text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
            Vendeur IA Pro Active (20 000 XOF)
          </div>
          <h3 className="text-xl sm:text-3xl font-black uppercase tracking-tighter text-white">Activation de votre Vendeur IA</h3>
          <p className="text-xs sm:text-sm text-white/60 font-medium leading-relaxed">
            Votre assistant commercial est prêt. <strong className="text-white">Activez-le dès maintenant pour commencer à vendre !</strong>
          </p>
        </div>

        {/* CHOIX DES OPTIONS DE CONNEXION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left w-full">
          
          {/* OPTION 1: INSTANTANÉE (RECOMMANDÉ) */}
          <div className="bg-vendeur-emerald/10 border-2 border-vendeur-emerald p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-between space-y-4 relative overflow-hidden group hover:scale-[1.01] transition-all">
            <div className="space-y-3">
              <span className="bg-vendeur-emerald text-vendeur-coal text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest inline-block shadow-md">
                Recommandé • Prêt Immédiatement
              </span>
              <h4 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                <Bot className="text-vendeur-emerald shrink-0" size={20} />
                Activation Automatique
              </h4>
              <p className="text-xs text-white/70 font-medium leading-relaxed">
                Renseignez le numéro WhatsApp de votre boutique pour commencer à recevoir vos clients.
              </p>
              
              <div className="space-y-1 pt-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-vendeur-emerald">
                  Numéro WhatsApp Boutique
                </label>
                <input
                  type="tel"
                  placeholder="Ex: +2250700000000"
                  value={storeWhatsApp}
                  onChange={(e) => setStoreWhatsApp(e.target.value)}
                  className="w-full h-11 bg-black/60 border border-vendeur-emerald/40 rounded-xl px-3 text-xs font-bold text-white focus:border-vendeur-emerald outline-none transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleActivateSystemFleet}
              disabled={savingMeta}
              className="w-full h-14 bg-vendeur-emerald hover:bg-vendeur-emerald/90 text-vendeur-coal font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20 disabled:opacity-50 mt-4"
            >
              {savingMeta ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
              Activer mon Vendeur IA
            </button>
          </div>

          {/* OPTION 2: PROPRES IDENTIFIANTS META (OPTIONNEL / AVANCÉ) */}
          <div className="bg-white/5 border border-white/10 p-5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-between space-y-4 relative hover:border-white/20 transition-all">
            <div className="space-y-3">
              <span className="bg-white/10 text-white/60 text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest inline-block">
                Options Avancées
              </span>
              <h4 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                <ShieldCheck className="text-blue-400 shrink-0" size={20} />
                Mon propre numéro d'entreprise
              </h4>
              <p className="text-xs text-white/60 font-medium leading-relaxed">
                Si vous possédez un numéro WhatsApp Business officiel configuré avec votre compte Facebook d'entreprise.
              </p>
            </div>

            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="w-full h-14 bg-white/10 hover:bg-white/15 text-white font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all mt-4 border border-white/10"
            >
              <Zap size={16} />
              {showManualForm ? "Masquer les options" : "Options avancées"}
            </button>
          </div>

        </div>

        {/* SECTION FORMULAIRE META PERSONNALISE (SI DEPLIE) */}
        {showManualForm && (
          <div className="max-w-md mx-auto text-left space-y-4 bg-black/40 border border-white/10 p-5 rounded-2xl sm:rounded-3xl animate-in slide-in-from-top duration-300">
            <h5 className="text-xs font-black uppercase tracking-widest text-vendeur-emerald text-center">
              Configuration de votre numéro d'entreprise
            </h5>
            
            <button
              onClick={handleFacebookLogin}
              disabled={savingMeta}
              className="w-full h-12 bg-[#1877F2] hover:bg-[#166fe5] text-white font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              {savingMeta ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
              Se connecter avec Facebook Meta
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-3 text-[8px] font-black text-white/30 uppercase tracking-widest">OU SAISIE MANUELLE</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <div id="meta-manual-form" className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Phone Number ID</label>
                <input
                  type="text"
                  placeholder="Ex: 1048593849502"
                  value={metaForm.phoneNumberId}
                  onChange={(e) => setMetaForm({ ...metaForm, phoneNumberId: e.target.value })}
                  className="w-full h-11 bg-black/60 border border-white/10 rounded-xl px-3 text-xs font-mono text-white focus:border-vendeur-emerald outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">WhatsApp Business Account ID (WABA ID)</label>
                <input
                  type="text"
                  placeholder="Ex: 2049583920194"
                  value={metaForm.wabaId}
                  onChange={(e) => setMetaForm({ ...metaForm, wabaId: e.target.value })}
                  className="w-full h-11 bg-black/60 border border-white/10 rounded-xl px-3 text-xs font-mono text-white focus:border-vendeur-emerald outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Jeton d'accès Permanent (Access Token EAAG)</label>
                <textarea
                  placeholder="Ex: EAAG..."
                  value={metaForm.accessToken}
                  onChange={(e) => setMetaForm({ ...metaForm, accessToken: e.target.value })}
                  className="w-full h-20 bg-black/60 border border-white/10 rounded-xl p-3 text-[10px] font-mono text-white focus:border-vendeur-emerald outline-none transition-all resize-none"
                />
              </div>

              <button
                onClick={handleSaveMetaConfig}
                disabled={savingMeta}
                className="w-full h-12 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all shadow-md disabled:opacity-50"
              >
                {savingMeta ? <Loader2 className="animate-spin shrink-0" size={16} /> : <Check className="shrink-0" size={16} />}
                Enregistrer mes clés Meta
              </button>
            </div>
          </div>
        )}

        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-64 w-64 bg-vendeur-emerald/5 blur-[100px] rounded-full" />
      </div>
    );
  }

  // CAS 3: DEJA CONNECTE
  if (isConnected) {
    const isUsingCustomMeta = !!merchant?.whatsappConfig?.phoneNumberId;

    return (
      <>
        <ConfirmationModal
          isOpen={showDisconnectConfirm}
          onClose={() => setShowDisconnectConfirm(false)}
          onConfirm={async () => {
            setLoading(true);
            try {
              await apiClient.post("/api/whatsapp/disconnect");
              toast.success("WhatsApp déconnecté avec succès.");
              refetch();
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

        <div className="bg-vendeur-emerald/10 border border-vendeur-emerald/30 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] flex flex-col md:flex-row items-center md:items-center justify-between gap-6 text-center md:text-left shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-vendeur-emerald/20 border border-vendeur-emerald/40 flex items-center justify-center text-vendeur-emerald shrink-0">
              <ShieldCheck size={24} className="md:w-7 md:h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-vendeur-emerald animate-pulse shrink-0" />
                <h3 className="text-base md:text-xl font-black text-white uppercase tracking-tight leading-snug">WhatsApp Connecté & Opérationnel</h3>
              </div>
              <p className="text-xs text-white/60 font-medium max-w-xs md:max-w-none mx-auto">
                Mode actif : <strong className="text-vendeur-emerald">{isUsingCustomMeta ? "Ligne Dédiée Meta Personnelle" : "Flotte Vendeur IA Partagée"}</strong>. Votre assistant IA répond 24/7.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate("/dashboard?test_ia=true")}
              className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-vendeur-emerald hover:bg-vendeur-emerald/90 text-vendeur-coal font-black uppercase tracking-wider text-xs transition-all shadow-lg shadow-vendeur-emerald/20 shrink-0 flex items-center justify-center gap-2"
            >
              <Bot size={16} />
              Tester mon Vendeur IA
            </button>
            <button
              onClick={() => setShowDisconnectConfirm(true)}
              disabled={loading}
              className="w-full sm:w-auto h-12 px-6 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Déconnecter"}
            </button>
          </div>
        </div>
      </>
    );
  }

  // CAS 4: EN COURS DE CONNEXION / SELECTION DU MODE (OFFRE ESSENTIELLE)
  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
        <button
          onClick={() => { setMode("qr"); setIsInitializing(true); onInitBaileys(true); }}
          className={cn(
            "flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all",
            mode === "qr" ? "bg-white text-vendeur-coal shadow-lg" : "text-white/30 hover:text-white"
          )}
        >
          <QrCode size={14} />
          QR Code
        </button>
        <button
          onClick={() => { setMode("pairing"); setPairingCode(null); }}
          className={cn(
            "flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all",
            mode === "pairing" ? "bg-white text-vendeur-coal shadow-lg" : "text-white/30 hover:text-white"
          )}
        >
          <Zap size={14} />
          Code à 8 chiffres (Même tél)
        </button>
      </div>

      {mode === "qr" ? (
        <div
          ref={qrRef}
          className="bg-vendeur-coal border border-vendeur-emerald/20 rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center gap-8 animate-in zoom-in-95 duration-500"
        >
           <div className="text-center space-y-3">
             <div className="inline-flex h-14 w-14 rounded-2xl bg-vendeur-emerald/10 items-center justify-center text-vendeur-emerald">
                <QrCode size={28} />
             </div>
             <div className="space-y-1">
               <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Connectons votre WhatsApp</h3>
               <p className="text-xs text-white/40 max-w-[320px] mx-auto font-medium uppercase tracking-widest leading-relaxed">
                 Scannez le QR Code ci-dessous avec WhatsApp (Appareils connectés)
               </p>
             </div>
           </div>

           {qrCode ? (
             <div className="relative group">
                <div className="absolute -inset-6 bg-vendeur-emerald/20 blur-3xl rounded-full opacity-100 transition-opacity duration-500 animate-pulse" />
                <div className="relative p-6 bg-white rounded-[2.5rem] shadow-2xl border-[12px] border-white transition-transform overflow-hidden">
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-60 h-60 md:w-72 md:h-72" />
                  
                  {/* Lightweight Scanner Line */}
                  <div className="absolute left-6 right-6 h-1 bg-vendeur-emerald rounded-full opacity-90 z-10 pointer-events-none shadow-[0_0_12px_#10B981] animate-scan" />

                  {/* Connecting Overlay */}
                  {isConnectingSocket && (
                    <div className="absolute inset-0 bg-vendeur-coal/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-300 z-20">
                      <div className="h-16 w-16 bg-vendeur-emerald/20 border border-vendeur-emerald/40 rounded-2xl flex items-center justify-center text-vendeur-emerald shadow-xl animate-pulse">
                        <Loader2 className="animate-spin text-vendeur-emerald" size={32} />
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
             <div className="h-60 w-60 md:h-72 md:w-72 bg-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/10">
                <Loader2 className="animate-spin text-vendeur-emerald/40" size={48} />
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Génération du QR Code...</p>
             </div>
           )}

           <div className="flex flex-col items-center gap-4 w-full max-w-sm">
             <div className={cn(
               "flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-2xl w-full justify-center border transition-all",
               isConnectingSocket
                 ? "bg-vendeur-emerald text-vendeur-coal border-vendeur-emerald shadow-lg shadow-vendeur-emerald/20"
                 : "bg-vendeur-emerald/5 text-vendeur-emerald border-vendeur-emerald/10"
             )}>
                <Loader2 className="animate-spin" size={14} />
                {isConnectingSocket ? "Connexion en cours..." : qrCode ? "En attente de scan..." : "Préparation de la connexion..."}
             </div>

             <button
               onClick={() => { setIsInitializing(true); onInitBaileys(true); }}
               className="text-[9px] font-black uppercase tracking-widest text-vendeur-emerald/80 hover:text-vendeur-emerald transition-all py-1"
             >
               Régénérer le QR
             </button>
           </div>
        </div>
      ) : (
        <div className="bg-vendeur-coal border border-vendeur-emerald/20 rounded-[2.5rem] p-8 md:p-12 flex flex-col gap-6 shadow-2xl">
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
              className="w-full h-14 px-6 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-white/20 focus:border-vendeur-emerald outline-none transition-all"
            />

            <button
              onClick={handleRequestPairingCode}
              disabled={pairingLoading}
              className="w-full h-14 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/20 disabled:opacity-50"
            >
              {pairingLoading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
              Obtenir mon code
            </button>
          </div>

          {pairingCode && (
            <div className="p-6 bg-vendeur-emerald/10 border border-vendeur-emerald/30 rounded-2xl text-center space-y-3 animate-in zoom-in-95">
              <p className="text-[10px] font-black uppercase text-vendeur-emerald tracking-widest">Entrez ce code dans WhatsApp :</p>
              <div className="text-3xl font-black text-white tracking-[0.3em] font-mono select-all bg-black/40 py-3 rounded-xl border border-white/5">
                {pairingCode}
              </div>
              <p className="text-[9px] text-white/40 uppercase tracking-wider">WhatsApp → Appareils connectés → Associer avec un numéro</p>
            </div>
          )}
        </div>
      )}

      {/* WhatsApp Connected Step Milestone Modal */}
      {(() => {
        const setupSteps = dashboard?.setupStatus?.steps || [];
        const hasProducts = setupSteps.find((s: any) => s.id === 'products')?.completed;
        const hasPayments = setupSteps.find((s: any) => s.id === 'payments')?.completed;
        const hasDelivery = setupSteps.find((s: any) => s.id === 'delivery')?.completed;

        let nextActionConfig = {
          label: "Étape suivante : Ajouter des Produits",
          sublabel: "Enrichissez votre catalogue",
          href: "/products"
        };

        if (!hasProducts) {
          nextActionConfig = {
            label: "Étape suivante : Ajouter des Produits",
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
            subtitle="Votre ligne WhatsApp Business est désormais synchronisée avec votre commercial IA 24h/24."
            score={dashboard?.setupStatus?.score || 60}
            primaryAction={nextActionConfig}
            secondaryAction={{
              label: "Personnaliser le ton de l'IA",
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

function ArrowRight({ size }: { size: number }) {
  return <ChevronRight size={size} />;
}

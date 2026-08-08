import React, { useState, useEffect, useRef } from "react";
import {
  QrCode,
  Zap,
  HelpCircle,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Bot,
  X,
  Loader2,
  Check,
  LogIn,
  Sparkles,
  Settings,
  ArrowLeft
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";

import { OffersModal } from "./OffersModal";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WhatsAppConnectionFlowProps {
  merchant: any;
  qrCode: string | null;
  onInitBaileys: () => void;
  onRefreshMerchant: () => void;
  onCancelScan: () => void;
}

export function WhatsAppConnectionFlow({ merchant, qrCode, onInitBaileys, onRefreshMerchant, onCancelScan }: WhatsAppConnectionFlowProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [metaConfig, setMetaConfig] = useState({
    phoneNumberId: merchant?.whatsappConfig?.meta?.phoneNumberId || "",
    accessToken: merchant?.whatsappConfig?.meta?.accessToken || ""
  });

  const { user } = useAuthStore();
  const qrRef = useRef<HTMLDivElement>(null);
  const currency = useMerchantCurrency();

  useEffect(() => {
    if (qrCode && qrRef.current) {
      qrRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [qrCode]);

  const handleSaveMetaConfig = async () => {
    setLoading(true);
    try {
      await apiClient.patch("/api/whatsapp/config", {
        provider: "meta",
        meta: metaConfig
      });
      toast.success("Configuration Meta Pro mise à jour !");
      onRefreshMerchant();
      setShowAdvanced(false);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleActivateMeta = async () => {
    if (isMetaActive) {
      toast.info("Le Mode Pro est déjà actif.");
      return;
    }

    // If no custom config, check for contribution/subscription
    const hasCustomConfig = metaConfig.phoneNumberId && metaConfig.accessToken;
    const hasActiveSubscription = merchant?.whatsappConfig?.status === 'connected' || merchant?.subscription?.status === 'active';

    if (!hasCustomConfig && !hasActiveSubscription) {
      setShowOffers(true);
      return;
    }

    setLoading(true);
    try {
      await apiClient.patch("/api/whatsapp/config", {
        provider: "meta",
      });
      toast.success("Mode Pro Activé ! 🚀");
      onRefreshMerchant();
    } catch (error) {
      toast.error("Erreur d'activation");
    } finally {
      setLoading(false);
    }
  };

  const isBaileysActive = merchant?.whatsappConfig?.provider === 'baileys' && merchant?.whatsappConfig?.status === 'connected';
  const isMetaActive = merchant?.whatsappConfig?.provider === 'meta' && merchant?.whatsappConfig?.status === 'connected';
  const isUsingCustomMeta = merchant?.whatsappConfig?.meta?.phoneNumberId && merchant?.whatsappConfig?.meta?.accessToken;

  // A subscription is considered valid if it's 'active' and not expired
  const isSubscriptionActive = merchant?.subscription?.status === 'active' &&
    (!merchant?.subscription?.expiresAt || new Date(merchant.subscription.expiresAt) > new Date());

  const hasPaidContribution = !!merchant?.whatsappConfig?.lastBillingDate && isSubscriptionActive;

  const handlePackProLead = () => {
    const businessName = merchant?.businessName || "ma boutique";
    const supportNumber = merchant?.systemSettings?.supportWhatsApp || "+2250700000000";
    const message = encodeURIComponent(`Bonjour ! Je souhaite activer mon Pack Pro Clé en Main pour ${businessName}. Comment procéder pour le paiement et la configuration ?`);
    const whatsappUrl = `https://wa.me/${supportNumber.replace(/\+/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePaystackPayment = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post("/api/commerce/activate-premium", {
        email: user?.email,
        type: "ram_contribution",
        userId: user?.id
      });

      if (res.data.access_code) {
        const paystack = new (window as any).PaystackPop();
        paystack.checkout({
          accessCode: res.data.access_code,
          onSuccess: (transaction: any) => {
            toast.success("Contribution RAM validée !");
            onRefreshMerchant();
          },
          onCancel: () => {
            toast.info("Paiement annulé");
          }
        });
      } else if (res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
      } else {
        throw new Error("Lien de paiement non reçu");
      }
    } catch (error) {
      toast.error("Erreur lors de l'initialisation du paiement");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpressConnect = () => {
    if (hasPaidContribution) {
      onInitBaileys();
    } else {
      setShowOffers(true);
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {!qrCode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* MODE EXPRESS (QR CODE) */}
          <div className={cn(
            "relative group bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-6 md:p-8 overflow-hidden transition-all hover:border-vendeur-emerald/30",
            isBaileysActive && "ring-2 ring-vendeur-emerald border-transparent"
          )}>
            {isBaileysActive && (
               <div className="absolute top-4 right-4 md:top-6 md:right-6 h-6 px-3 rounded-full bg-vendeur-emerald text-vendeur-coal text-[8px] font-black uppercase flex items-center gap-1">
                 <ShieldCheck size={10} /> <span className="whitespace-nowrap">Connecté</span>
               </div>
            )}

            <div className="space-y-6">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/60 group-hover:bg-vendeur-emerald/10 group-hover:text-vendeur-emerald transition-colors shrink-0">
                <QrCode size={24} className="md:w-7 md:h-7" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-white whitespace-nowrap">Mode Express</h3>
                <p className="text-xs md:text-sm text-white/40 mt-1">Lien direct par QR Code. Simple et immédiat.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase text-vendeur-emerald/60 whitespace-nowrap">
                  <Check size={12} className="shrink-0" /> Zéro configuration Meta
                </div>
                <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase text-vendeur-emerald/60 whitespace-nowrap">
                  <Check size={12} className="shrink-0" /> Utilise ton numéro actuel
                </div>
              </div>

              <button
                onClick={handleExpressConnect}
                disabled={loading || isBaileysActive}
                className={cn(
                  "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all whitespace-nowrap",
                  isBaileysActive
                    ? "bg-vendeur-emerald/10 text-vendeur-emerald border border-vendeur-emerald/20"
                    : "bg-white text-vendeur-coal hover:bg-vendeur-emerald active:scale-95"
                )}
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                {isBaileysActive
                  ? "Session Active"
                  : hasPaidContribution
                    ? "Générer QR Code"
                    : merchant?.subscription?.status === 'past_due'
                      ? "Réactiver (RAM)"
                      : "Connecter (RAM)"}
              </button>
            </div>
          </div>

          {/* MODE PRO (META API) */}
          <div className={cn(
            "relative group bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-6 md:p-8 overflow-hidden transition-all hover:border-blue-500/30",
            isMetaActive && "border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.1)]"
          )}>
            {isMetaActive && (
               <div className="absolute top-4 right-4 md:top-6 md:right-6 h-6 px-3 rounded-full bg-blue-500 text-white text-[8px] font-black uppercase flex items-center gap-1 shadow-lg shadow-blue-500/20">
                 <ShieldCheck size={10} /> <span className="whitespace-nowrap">{isUsingCustomMeta ? "Custom Pro" : "System Pro"}</span>
               </div>
            )}

             <div className="space-y-6">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/60 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors shrink-0">
                <Bot size={24} className="md:w-7 md:h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg md:text-xl font-black text-white whitespace-nowrap">Mode Pro</h3>
                  <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase border border-blue-500/20">100k+</span>
                </div>
                <p className="text-xs md:text-sm text-white/40 mt-1">API Meta Cloud. Stabilité absolue & scalabilité.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase text-blue-400/60 whitespace-nowrap">
                  <Check size={12} className="shrink-0" /> Pas besoin de téléphone allumé
                </div>
                <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase text-blue-400/60 whitespace-nowrap">
                  <Check size={12} className="shrink-0" /> Support client multi-agents
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {!isMetaActive && (
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-6 space-y-4 mb-4">
                    <div className="flex items-center gap-3">
                       <Settings size={18} className="text-blue-400" />
                       <h4 className="text-[10px] font-black uppercase text-white tracking-widest">Configuration API Cloud</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                       <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-white/40 ml-1">Phone Number ID</label>
                          <input
                            className="w-full h-10 bg-black/40 border border-white/5 rounded-xl px-4 text-[10px] text-white focus:border-blue-500 outline-none transition-all font-mono"
                            value={metaConfig.phoneNumberId}
                            onChange={e => setMetaConfig({...metaConfig, phoneNumberId: e.target.value})}
                            placeholder="Ex: 1063..."
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-white/40 ml-1">Access Token</label>
                          <input
                            className="w-full h-10 bg-black/40 border border-white/5 rounded-xl px-4 text-[10px] text-white focus:border-blue-500 outline-none transition-all font-mono"
                            value={metaConfig.accessToken}
                            onChange={e => setMetaConfig({...metaConfig, accessToken: e.target.value})}
                            placeholder="EAAG..."
                          />
                       </div>
                    </div>
                    { (metaConfig.phoneNumberId || metaConfig.accessToken) && (
                       <button
                         onClick={handleSaveMetaConfig}
                         disabled={loading}
                         className="w-full py-2 bg-blue-500/20 text-blue-400 rounded-lg text-[9px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all border border-blue-500/30"
                       >
                         {loading ? <Loader2 className="animate-spin mx-auto" size={12} /> : "Enregistrer les clés"}
                       </button>
                    )}
                    <p className="text-[8px] text-white/20 text-center uppercase font-bold">
                      Laisse vide pour utiliser notre serveur partagé.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleActivateMeta}
                  disabled={loading || isMetaActive}
                  className={cn(
                    "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-lg",
                    isMetaActive
                      ? "bg-blue-500 text-white border-transparent shadow-blue-500/20"
                      : "bg-white text-vendeur-coal hover:bg-blue-500 hover:text-white active:scale-95"
                  )}
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : isMetaActive ? <ShieldCheck size={16} /> : <LogIn size={16} />}
                  {isMetaActive ? "Mode Pro Actif 🚀" : "Activer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* QR CODE DISPLAY (Focus Mode) */
        <div
          ref={qrRef}
          className="bg-vendeur-emerald/5 border border-vendeur-emerald/20 rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center gap-8 animate-in zoom-in-95 duration-500"
        >
           <div className="text-center space-y-2">
             <div className="inline-flex h-12 w-12 rounded-2xl bg-vendeur-emerald/10 items-center justify-center text-vendeur-emerald mb-2">
                <QrCode size={24} />
             </div>
             <h4 className="text-xl md:text-2xl font-black text-vendeur-emerald uppercase tracking-tighter">Scannez pour Activer</h4>
             <p className="text-xs text-white/40 max-w-[280px] mx-auto">
               Ouvrez WhatsApp sur votre téléphone {'>'} Paramètres {'>'} Appareils connectés
             </p>
           </div>

           <div className="relative group">
              <div className="absolute -inset-4 bg-vendeur-emerald/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-6 bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-[12px] border-white">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-56 h-56 md:w-64 md:h-64" />
              </div>
           </div>

           <div className="flex flex-col items-center gap-6 w-full max-w-sm">
             <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-vendeur-emerald bg-vendeur-emerald/10 px-8 py-4 rounded-2xl w-full justify-center">
                <Loader2 className="animate-spin" size={14} /> Synchronisation...
             </div>

             <button
               onClick={onCancelScan}
               className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all py-2"
             >
               <ArrowLeft size={14} /> Annuler et changer de mode
             </button>
           </div>
        </div>
      )}

      {/* HELP DRAWER (Mobile-First) */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowHelp(false)} />

          <div className="relative w-full max-w-lg bg-vendeur-coal rounded-t-[2.5rem] md:rounded-[2.5rem] border border-white/10 p-8 space-y-8 animate-in slide-in-from-bottom duration-500 shadow-2xl">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="space-y-4">
              <div className="h-16 w-16 rounded-[2rem] bg-blue-500/10 flex items-center justify-center text-blue-500">
                <HelpCircle size={32} />
              </div>
              <h3 className="text-2xl font-black text-white leading-tight">Accompagnement Meta Business</h3>
              <p className="text-white/60 text-sm">Meta exige une identité commerciale officielle pour lutter contre le spam. Nous sommes là pour vous aider.</p>
            </div>

            <div className="space-y-3">
              <HelpOption
                icon={<ExternalLink size={18} />}
                title="Créer moi-même"
                desc="Suivre le guide officiel gratuit de Meta."
                onClick={() => window.open('https://www.facebook.com/pages/create', '_blank')}
              />
              <HelpOption
                icon={<Sparkles size={18} className="text-vendeur-coal" />}
                title="Pack Pro Clé en Main"
                desc={`Un expert configure tout pour vous (25.000 ${currency}).`}
                onClick={handlePackProLead}
                highlight
              />
              <HelpOption
                icon={<ArrowRight size={18} />}
                title="Utiliser le Mode Express"
                desc="Commencer sans page Facebook maintenant."
                onClick={() => {
                  setShowHelp(false);
                  handleExpressConnect();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HelpOption({ icon, title, desc, onClick, highlight = false }: { icon: React.ReactNode; title: string; desc: string; onClick?: () => void; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-6 rounded-3xl border flex items-center gap-6 text-left transition-all active:scale-[0.98]",
        highlight
          ? "bg-vendeur-emerald text-vendeur-coal border-vendeur-emerald shadow-lg shadow-vendeur-emerald/20"
          : "bg-white/5 border-white/5 hover:border-white/10 text-white"
      )}
    >
      <div className={cn("shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center", highlight ? "bg-black/10" : "bg-white/5")}>
        {icon}
      </div>
      <div>
        <p className="font-black uppercase text-xs tracking-widest">{title}</p>
        <p className={cn("text-[10px] mt-0.5", highlight ? "text-vendeur-coal/60" : "text-white/40")}>{desc}</p>
      </div>
      <ChevronRight className="ml-auto opacity-20" size={16} />
    </button>
  );
}

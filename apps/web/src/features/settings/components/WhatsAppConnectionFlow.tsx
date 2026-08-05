import React, { useState } from "react";
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
  Settings
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WhatsAppConnectionFlowProps {
  merchant: any;
  qrCode: string | null;
  onInitBaileys: () => void;
  onRefreshMerchant: () => void;
}

export function WhatsAppConnectionFlow({ merchant, qrCode, onRefreshMerchant }: WhatsAppConnectionFlowProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [metaConfig, setMetaConfig] = useState({
    phoneNumberId: merchant?.whatsappConfig?.meta?.phoneNumberId || "",
    accessToken: merchant?.whatsappConfig?.meta?.accessToken || ""
  });

  const { user } = useAuthStore();

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

      if (res.data.authorization_url) {
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

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              onClick={handlePaystackPayment}
              disabled={loading || isBaileysActive}
              className={cn(
                "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all whitespace-nowrap",
                isBaileysActive
                  ? "bg-vendeur-emerald/10 text-vendeur-emerald border border-vendeur-emerald/20"
                  : "bg-white text-vendeur-coal hover:bg-vendeur-emerald active:scale-95"
              )}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
              {isBaileysActive ? "Session Active" : "Connecter (RAM)"}
            </button>
          </div>
        </div>

        {/* MODE PRO (META API) */}
        <div className={cn(
          "relative group bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-6 md:p-8 overflow-hidden transition-all hover:border-blue-500/30",
          isMetaActive && "ring-2 ring-blue-500 border-transparent"
        )}>
          {isMetaActive && (
             <div className="absolute top-4 right-4 md:top-6 md:right-6 h-6 px-3 rounded-full bg-blue-500 text-white text-[8px] font-black uppercase flex items-center gap-1">
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
              <button
                onClick={handleActivateMeta}
                disabled={loading || isMetaActive}
                className={cn(
                  "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all whitespace-nowrap",
                  isMetaActive
                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    : "bg-white text-vendeur-coal hover:bg-blue-500 hover:text-white active:scale-95"
                )}
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
                {isMetaActive ? "Mode Pro Actif" : "Activer"}
              </button>

              <div className="space-y-2">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full text-[10px] font-black uppercase text-white/20 hover:text-white/40 flex items-center justify-center gap-2 transition-colors py-2"
                >
                  <Settings size={14} /> Configuration Personnalisée
                </button>

                {showAdvanced && (
                  <div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-white/40 ml-1">Phone Number ID</label>
                      <input
                        className="w-full h-12 bg-vendeur-coal border border-white/10 rounded-xl px-4 text-xs text-white focus:border-blue-500 outline-none transition-all font-mono"
                        value={metaConfig.phoneNumberId}
                        onChange={e => setMetaConfig({...metaConfig, phoneNumberId: e.target.value})}
                        placeholder="Ex: 1063..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-white/40 ml-1">Access Token</label>
                      <textarea
                        className="w-full h-24 bg-vendeur-coal border border-white/10 rounded-xl p-4 text-[10px] text-white focus:border-blue-500 outline-none transition-all font-mono resize-none"
                        value={metaConfig.accessToken}
                        onChange={e => setMetaConfig({...metaConfig, accessToken: e.target.value})}
                        placeholder="EAAG..."
                      />
                    </div>
                    <button
                      onClick={handleSaveMetaConfig}
                      disabled={loading || !metaConfig.phoneNumberId || !metaConfig.accessToken}
                      className="w-full h-12 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Enregistrer les clés"}
                    </button>
                    <p className="text-[8px] text-white/20 text-center uppercase font-bold px-2">
                      Laisse vide pour utiliser le serveur mutualisé gratuit.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR CODE DISPLAY (If Baileys selected) */}
      {qrCode && (
        <div className="bg-vendeur-emerald/5 border border-vendeur-emerald/20 rounded-[2.5rem] p-8 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
           <div className="text-center">
             <h4 className="text-lg font-black text-vendeur-emerald uppercase tracking-tighter">Scannez pour Activer</h4>
             <p className="text-xs text-vendeur-emerald/60">Ouvrez WhatsApp {'>'} Appareils connectés</p>
           </div>
           <div className="p-6 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-8 border-white">
             <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
           </div>
           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-vendeur-emerald bg-vendeur-emerald/10 px-6 py-3 rounded-full">
              <Loader2 className="animate-spin" size={14} /> Synchronisation...
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
                desc="Un expert configure tout pour vous (25.000 FCFA)."
                onClick={handlePackProLead}
                highlight
              />
              <HelpOption
                icon={<ArrowRight size={18} />}
                title="Utiliser le Mode Express"
                desc="Commencer sans page Facebook maintenant."
                onClick={() => setShowHelp(false)}
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

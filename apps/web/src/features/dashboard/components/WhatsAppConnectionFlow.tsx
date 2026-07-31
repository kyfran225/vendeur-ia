import React, { useState } from "react";
import {
  QrCode,
  Zap,
  HelpCircle,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Info,
  ExternalLink,
  Bot,
  MessageCircle,
  X,
  CreditCard,
  Loader2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";
const PAYSTACK_PUBLIC_KEY = (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY || "";

interface WhatsAppConnectionFlowProps {
  merchant: any;
  qrCode: string | null;
  onInitBaileys: () => void;
  onRefreshMerchant: () => void;
}

export function WhatsAppConnectionFlow({ merchant, qrCode, onInitBaileys, onRefreshMerchant }: WhatsAppConnectionFlowProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { accessToken, user } = useAuthStore();

  const handlePaystackPayment = () => {
    if (!PAYSTACK_PUBLIC_KEY) {
      toast.error("Clé de paiement manquante");
      return;
    }

    // @ts-ignore
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user?.email || "vendeur@vendeur-ia.com",
      amount: 100000, // 1000 XOF in kobo (if it's XOF, it might be different, let's assume 1000 XOF for now)
      currency: "XOF",
      metadata: {
        type: "ram_contribution",
        userId: user?.id
      },
      callback: async function(response: any) {
        setLoading(true);
        try {
          await axios.post(`${API_URL}/api/commerce/verify-payment`, {
            reference: response.reference,
            type: "ram_contribution"
          }, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          toast.success("Contribution RAM validée ! 🚀");
          onRefreshMerchant();
          onInitBaileys();
        } catch (error) {
          toast.error("Erreur de vérification du paiement");
        } finally {
          setLoading(false);
        }
      },
      onClose: function() {
        toast.info("Paiement annulé");
      }
    });
    handler.openIframe();
  };

  const isBaileysActive = merchant?.whatsappConfig?.provider === 'baileys' && merchant?.whatsappConfig?.status === 'connected';
  const isMetaActive = merchant?.whatsappConfig?.provider === 'meta' && merchant?.whatsappConfig?.status === 'connected';

  const handlePackProLead = () => {
    const businessName = merchant?.businessName || "ma boutique";

    // Use support number from merchant dashboard payload if available
    // Note: merchant here is the whole dashboard object passed as prop in some cases,
    // but in SalesDashboard it's dashboard.merchant. Let's be safe.
    const supportNumber = merchant?.systemSettings?.supportWhatsApp || "+2250700000000";

    const message = encodeURIComponent(`Bonjour ! Je souhaite activer mon Pack Pro Clé en Main pour ${businessName}. Comment procéder pour le paiement et la configuration ?`);
    const whatsappUrl = `https://wa.me/${supportNumber.replace(/\+/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MODE EXPRESS (QR CODE) */}
        <div className={cn(
          "relative group bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8 overflow-hidden transition-all hover:border-vendeur-emerald/30",
          isBaileysActive && "ring-2 ring-vendeur-emerald border-transparent"
        )}>
          {isBaileysActive && (
             <div className="absolute top-6 right-6 h-6 px-3 rounded-full bg-vendeur-emerald text-vendeur-coal text-[8px] font-black uppercase flex items-center gap-1">
               <ShieldCheck size={10} /> Connecté
             </div>
          )}

          <div className="space-y-6">
            <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/60 group-hover:bg-vendeur-emerald/10 group-hover:text-vendeur-emerald transition-colors">
              <QrCode size={28} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Mode Express</h3>
              <p className="text-sm text-white/40 mt-1">Lien direct par QR Code. Simple et immédiat.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-vendeur-emerald/60">
                <Check size={12} /> Zéro configuration Meta
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-vendeur-emerald/60">
                <Check size={12} /> Utilise ton numéro actuel
              </div>
            </div>

            <button
              onClick={handlePaystackPayment}
              disabled={loading || isBaileysActive}
              className={cn(
                "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all",
                isBaileysActive
                  ? "bg-vendeur-emerald/10 text-vendeur-emerald border border-vendeur-emerald/20"
                  : "bg-white text-vendeur-coal hover:bg-vendeur-emerald active:scale-95"
              )}
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
              {isBaileysActive ? "Session Active" : "Connecter (Contribution RAM)"}
            </button>
          </div>
        </div>

        {/* MODE PRO (META API) */}
        <div className={cn(
          "relative group bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8 overflow-hidden transition-all hover:border-blue-500/30",
          isMetaActive && "ring-2 ring-blue-500 border-transparent"
        )}>
           <div className="space-y-6">
            <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/60 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
              <Bot size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">Mode Pro</h3>
                <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase border border-blue-500/20">100k+</span>
              </div>
              <p className="text-sm text-white/40 mt-1">API Meta Cloud. Stabilité absolue & scalabilité.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-400/60">
                <Check size={12} /> Pas besoin de téléphone allumé
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-400/60">
                <Check size={12} /> Support client multi-agents
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <button
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white/60 flex items-center justify-center gap-2 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all active:scale-95"
              >
                <LogIn size={16} /> Lier Facebook Business
              </button>

              <button
                onClick={() => setShowHelp(true)}
                className="w-full text-[10px] font-black uppercase text-white/20 hover:text-white/40 flex items-center justify-center gap-2 transition-colors"
              >
                <HelpCircle size={14} /> Pas de Page Facebook ?
              </button>
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

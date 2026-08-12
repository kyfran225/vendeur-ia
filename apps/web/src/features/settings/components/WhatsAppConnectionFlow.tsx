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
import { useNavigate } from "react-router-dom";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WhatsAppConnectionFlowProps {
  qrCode: string | null;
  onInitBaileys: () => void;
  onCancelScan: () => void;
}

export function WhatsAppConnectionFlow({ qrCode, onInitBaileys, onCancelScan }: WhatsAppConnectionFlowProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const { data: dashboard, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard");
      return res.data;
    }
  });

  const whatsapp = dashboard?.whatsappConnection;
  const subscription = dashboard?.subscription;
  const isSubscribed = subscription?.status === 'active';
  const isConnected = whatsapp?.status === 'CONNECTED';
  const isConnecting = whatsapp?.status === 'CONNECTING' || !!qrCode || isInitializing;
  const isError = whatsapp?.status === 'ERROR';

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
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  // CAS 2: CONNECTÉ
  if (isConnected && !qrCode) {
    return (
      <div className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8 md:p-12 space-y-10 animate-in zoom-in-95 duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-vendeur-emerald rounded-[1.5rem] flex items-center justify-center text-vendeur-coal shadow-2xl shadow-vendeur-emerald/20">
              <Bot size={32} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">WhatsApp</h3>
                <span className="px-3 py-1 bg-vendeur-emerald text-vendeur-coal text-[9px] font-black uppercase rounded-full shadow-lg shadow-vendeur-emerald/20">
                   Connecté
                </span>
              </div>
              <p className="text-sm font-black text-white/40 uppercase tracking-widest mt-1">
                {whatsapp?.phoneNumber || "+225 -- -- -- --"}
              </p>
            </div>
          </div>
          <button
            onClick={() => toast.info("Ouverture du test...")}
            className="h-14 px-8 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:bg-white/10 transition-all active:scale-95"
          >
            Tester mon vendeur
            <MessageSquare size={16} />
          </button>
        </div>

        <div className="pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="p-6 bg-white/5 rounded-3xl space-y-2">
             <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Votre Offre</p>
             <p className="text-lg font-black text-white">{subscription?.offerId?.name || "Vendeur IA Essentiel"}</p>
           </div>
           <div className="p-6 bg-white/5 rounded-3xl space-y-2">
             <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Prochaine Échéance</p>
             <p className="text-lg font-black text-white">
               {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "N/A"}
             </p>
           </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => navigate("/offers")}
            className="text-[10px] font-black uppercase text-white/20 hover:text-white transition-all tracking-widest"
          >
            Gérer mon offre
          </button>
        </div>
      </div>
    );
  }

  // CAS 3: EN COURS DE CONNEXION / QR CODE
  if (isConnecting || qrCode) {
    return (
      <div
        ref={qrRef}
        className="bg-vendeur-coal border border-vendeur-emerald/20 rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center gap-10 animate-in zoom-in-95 duration-500"
      >
         <div className="text-center space-y-4">
           <div className="inline-flex h-14 w-14 rounded-2xl bg-vendeur-emerald/10 items-center justify-center text-vendeur-emerald">
              <QrCode size={28} />
           </div>
           <div className="space-y-2">
             <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Connectons votre WhatsApp</h3>
             <p className="text-xs text-white/40 max-w-[280px] mx-auto font-medium uppercase tracking-widest leading-relaxed">
               Scannez le QR Code avec WhatsApp (Appareils connectés)
             </p>
           </div>
         </div>

         {qrCode ? (
           <div className="relative group">
              <div className="absolute -inset-6 bg-vendeur-emerald/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative p-6 bg-white rounded-[2.5rem] shadow-2xl border-[12px] border-white transition-transform group-hover:scale-[1.02]">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-60 h-60 md:w-72 md:h-72" />
              </div>
           </div>
         ) : (
           <div className="h-60 w-60 md:h-72 md:w-72 bg-white/5 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-white/10">
              <Loader2 className="animate-spin text-vendeur-emerald/40" size={48} />
           </div>
         )}

         <div className="flex flex-col items-center gap-6 w-full max-w-sm">
           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-vendeur-emerald bg-vendeur-emerald/5 px-8 py-5 rounded-2xl w-full justify-center border border-vendeur-emerald/10">
              <Loader2 className="animate-spin" size={14} /> En attente de scan...
           </div>

           <button
             onClick={onCancelScan}
             className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all"
           >
             <ArrowLeft size={14} /> Annuler la connexion
           </button>
         </div>
      </div>
    );
  }

  // CAS 4: ERREUR OU ACTION REQUISE
  if (isError) {
    return (
      <div className="bg-rose-500/5 border border-rose-500/10 rounded-[2.5rem] p-8 md:p-12 text-center space-y-8 animate-in shake duration-500">
        <div className="h-20 w-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto">
          <AlertCircle size={40} />
        </div>
        <div className="space-y-4">
          <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Action Requise</h3>
          <p className="text-sm text-white/40 font-bold uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
            Votre connexion WhatsApp nécessite votre attention pour rester opérationnelle.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onInitBaileys}
            className="w-full h-16 bg-white text-vendeur-coal rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-xl"
          >
            Réparer la connexion
            <Zap size={18} />
          </button>
          <button
            onClick={() => toast.info("Support contacté")}
            className="text-[9px] font-black uppercase text-white/20 hover:text-white transition-all tracking-widest py-2"
          >
            Contacter le support
          </button>
        </div>
      </div>
    );
  }

  // CAS PAR DÉFAUT: PAS CONNECTÉ
  return (
    <div className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8 md:p-12 text-center space-y-8">
      <div className="h-20 w-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/20 mx-auto">
        <Bot size={40} />
      </div>
      <div className="space-y-4">
        <h3 className="text-2xl font-black uppercase tracking-tighter text-white">WhatsApp</h3>
        <p className="text-sm text-white/40 font-bold uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
          Votre vendeur IA n'est pas encore connecté à WhatsApp.
        </p>
      </div>
      <button
        onClick={() => { setIsInitializing(true); onInitBaileys(); }}
        disabled={loading || isInitializing}
        className="w-full h-16 bg-white text-vendeur-coal rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-vendeur-emerald transition-all active:scale-95 shadow-xl disabled:opacity-70"
      >
        {isInitializing ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
        {isInitializing ? "Initialisation..." : "Connecter WhatsApp"}
      </button>
    </div>
  );
}

function ArrowRight({ size }: { size: number }) {
  return <ChevronRight size={size} />;
}

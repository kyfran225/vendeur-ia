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
  isConnectingSocket?: boolean;
  onInitBaileys: (force?: boolean) => void;
  onCancelScan: () => void;
}

export function WhatsAppConnectionFlow({ qrCode, isConnectingSocket, onInitBaileys, onCancelScan }: WhatsAppConnectionFlowProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [mode, setMode] = useState<"qr" | "pairing">("qr");
  const [pairingPhone, setPairingPhone] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
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

  // Auto-init WhatsApp session if not connected and no QR code yet
  useEffect(() => {
    if (isSubscribed && !isConnected && !qrCode && mode === "qr") {
      setIsInitializing(true);
      onInitBaileys(true);
    }
  }, [isSubscribed, isConnected, mode]);

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
    return null;
  }

  // CAS 2: DEJA CONNECTE
  if (isConnected) {
    return (
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
            <p className="text-xs text-white/60 font-medium max-w-xs md:max-w-none mx-auto">Votre assistant IA répond automatiquement à vos clients 24/7.</p>
          </div>
        </div>

        <button
          onClick={async () => {
            if (!confirm("Voulez-vous vraiment déconnecter votre compte WhatsApp ?")) return;
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
          disabled={loading}
          className="w-full md:w-auto h-12 px-6 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : "Déconnecter WhatsApp"}
        </button>
      </div>
    );
  }

  // CAS 3: EN COURS DE CONNEXION / SELECTION DU MODE
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
    </div>
  );
}

function ArrowRight({ size }: { size: number }) {
  return <ChevronRight size={size} />;
}

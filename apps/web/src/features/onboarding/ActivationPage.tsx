import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import {
  CheckCircle2,
  Circle,
  QrCode,
  Bot,
  Zap,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Hash,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuthStore } from "@/stores/authStore";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const isMobileDevice = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export function ActivationPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [autoInitializing, setAutoInitializing] = useState(false);
  // "qr" | "pairing" : auto-detect mobile
  const [mode, setMode] = useState<"qr" | "pairing">(() => isMobileDevice() ? "pairing" : "qr");
  const [pairingPhone, setPairingPhone] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const socket = useSocket();

  const { data: dashboard, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard");
      return res.data;
    },
    refetchInterval: (query) => {
      const isConnected = query.state.data?.whatsappConnection?.status === 'CONNECTED';
      const isSubscribed = query.state.data?.subscription?.status === 'active';
      return (isConnected || !isSubscribed) ? false : 10000;
    }
  });

  const subscription = dashboard?.subscription;
  const whatsapp = dashboard?.whatsappConnection;
  const merchant = dashboard?.merchant;
  const isSubscribed = subscription?.status === 'active';
  const isWhatsAppConnected =
    whatsapp?.status === 'CONNECTED' ||
    merchant?.whatsappConfig?.status === 'connected' ||
    dashboard?.setupStatus?.steps?.find((s: any) => s.id === 'whatsapp')?.completed === true;

  // Redirect automatically when connected (give time to read screen)
  useEffect(() => {
    if (isSubscribed && isWhatsAppConnected) {
      toast.success("WhatsApp connecté avec succès !");
      const timer = setTimeout(async () => {
        try {
          await apiClient.post("/api/commerce/merchant", { onboardingCompleted: true });
          useAuthStore.getState().updateUser({ onboardingCompleted: true });
        } catch (err) {
          console.warn("[Activation] Failed to set onboardingCompleted:", err);
        }
        navigate("/dashboard");
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [isSubscribed, isWhatsAppConnected, navigate]);

  const [isConnecting, setIsConnecting] = useState(false);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;
    socket.on("whatsapp:qr", (data: { qrCodeData: string }) => {
      setQrCode(data.qrCodeData);
      setAutoInitializing(false);
      setIsConnecting(false);
    });
    socket.on("whatsapp:connecting", () => {
      setIsConnecting(true);
    });
    socket.on("whatsapp:connected", async () => {
      setQrCode(null);
      setPairingCode(null);
      setIsConnecting(false);
      try {
        await apiClient.post("/api/commerce/merchant", { onboardingCompleted: true });
        useAuthStore.getState().updateUser({ onboardingCompleted: true });
      } catch (err) {
        console.warn("[Activation] Failed to set onboardingCompleted on connect:", err);
      }
      refetch();
    });
    return () => {
      socket.off("whatsapp:qr");
      socket.off("whatsapp:connecting");
      socket.off("whatsapp:connected");
    };
  }, [socket, refetch]);

  const handleInitBaileys = async (silent = true) => {
    try {
      await apiClient.post("/api/whatsapp/connect");
    } catch (err) {
      console.error("Init WhatsApp failed:", err);
      // Silent init: do not trigger user-facing error toasts on auto-connect attempts
    }
  };

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

  // Auto-init QR as soon as subscription is active (only in QR mode)
  const autoInitDoneRef = React.useRef(false);
  useEffect(() => {
    if (isSubscribed && !isWhatsAppConnected && !qrCode && !autoInitDoneRef.current && mode === "qr") {
      autoInitDoneRef.current = true;
      setAutoInitializing(true);
      handleInitBaileys(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubscribed, isWhatsAppConnected, qrCode, mode]);

  // When switching to QR mode, init if not done yet
  const handleSwitchToQr = () => {
    setMode("qr");
    setPairingCode(null);
    if (isSubscribed && !isWhatsAppConnected && !qrCode && !autoInitDoneRef.current) {
      autoInitDoneRef.current = true;
      setAutoInitializing(true);
      handleInitBaileys(false);
    }
  };

  if (isSubscribed && isWhatsAppConnected) {
    // Next step determination (e.g. add products)
    const setupSteps = dashboard?.setupStatus?.steps || [];
    const nextStep = setupSteps.find((s: any) => !s.completed);
    const nextStepPath = nextStep?.id === 'products' ? '/products' :
                         nextStep?.id === 'payments' ? '/settings?tab=boutique' :
                         nextStep?.id === 'identity' ? '/settings?tab=boutique' : '/products';
    const nextStepLabel = nextStep?.id === 'products' ? 'Ajouter mes produits' :
                          nextStep?.id === 'payments' ? 'Configurer mes paiements' : 'Étape suivante : Ajouter mes produits';

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 animate-in zoom-in-95 duration-700">
        <div className="max-w-md w-full bg-vendeur-coal border border-white/10 p-8 md:p-12 rounded-[3.5rem] text-center space-y-6 shadow-2xl">
          <div className="h-24 w-24 bg-vendeur-emerald rounded-[2rem] flex items-center justify-center text-vendeur-coal mx-auto shadow-2xl shadow-vendeur-emerald/20 animate-bounce">
            <Bot size={48} />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic text-white">Prêt à vendre !</h1>
            <p className="text-xs md:text-sm text-white/50 font-bold uppercase tracking-widest leading-relaxed">
              Votre Vendeur IA est désormais actif et opérationnel sur WhatsApp.
            </p>
          </div>

          {/* Visual Progress Countdown */}
          <div className="pt-2">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 7, ease: "linear" }}
                className="h-full bg-vendeur-emerald shadow-[0_0_10px_rgba(16,185,129,0.8)]"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={async () => {
                try {
                  await apiClient.post("/api/commerce/merchant", { onboardingCompleted: true });
                  useAuthStore.getState().updateUser({ onboardingCompleted: true });
                } catch (err) {
                  console.warn("[Activation] Failed to set onboardingCompleted:", err);
                }
                navigate(nextStepPath);
              }}
              className="w-full min-h-[4rem] px-6 bg-vendeur-emerald text-vendeur-coal rounded-3xl font-black uppercase tracking-[0.15em] text-xs flex items-center justify-between gap-3 hover:scale-102 active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Zap size={18} fill="currentColor" className="animate-pulse shrink-0" />
                <span className="truncate">{nextStepLabel}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="bg-black/20 text-vendeur-coal px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider hidden sm:inline-block">
                  Recommandé
                </span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={async () => {
                try {
                  await apiClient.post("/api/commerce/merchant", { onboardingCompleted: true });
                  useAuthStore.getState().updateUser({ onboardingCompleted: true });
                } catch (err) {
                  console.warn("[Activation] Failed to set onboardingCompleted:", err);
                }
                navigate("/dashboard");
              }}
              className="w-full h-14 bg-white/5 border border-white/10 text-white/70 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all active:scale-95"
            >
              Ouvrir mon Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Votre Vendeur IA est presque prêt</h1>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <StepBadge label="Offre activée" completed={isSubscribed} active={!isSubscribed} />
            <div className="hidden md:block h-px w-8 bg-white/10" />
            <StepBadge label="Paiement confirmé" completed={isSubscribed} active={false} />
            <div className="hidden md:block h-px w-8 bg-white/10" />
            <StepBadge label="Connexion WhatsApp" completed={isWhatsAppConnected} active={isSubscribed && !isWhatsAppConnected} />
            <div className="hidden md:block h-px w-8 bg-white/10" />
            <StepBadge label="Vendeur IA prêt" completed={false} active={isWhatsAppConnected} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Main Content */}
          <div className="md:col-span-3 space-y-10">
            {!isSubscribed ? (
              <div className="p-12 bg-white/5 border border-white/5 rounded-[3rem] text-center space-y-6">
                <Loader2 className="animate-spin text-vendeur-emerald mx-auto" size={48} />
                <h3 className="text-xl font-black uppercase tracking-tight">Vérification du paiement...</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">
                  Nous attendons la confirmation de votre paiement Mobile Money ou Carte. Cela peut prendre quelques instants.
                </p>
              </div>
            ) : !isWhatsAppConnected ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic text-vendeur-emerald">Connectons votre WhatsApp</h2>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                    Votre abonnement est actif. Choisissez comment connecter votre numéro.
                  </p>
                </div>

                {/* Mode Toggle */}
                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                  <button
                    onClick={handleSwitchToQr}
                    className={cn(
                      "flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all",
                      mode === "qr"
                        ? "bg-white text-vendeur-coal shadow-lg"
                        : "text-white/30 hover:text-white"
                    )}
                  >
                    <QrCode size={14} />
                    QR Code
                  </button>
                  <button
                    onClick={() => { setMode("pairing"); setQrCode(null); }}
                    className={cn(
                      "flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all",
                      mode === "pairing"
                        ? "bg-white text-vendeur-coal shadow-lg"
                        : "text-white/30 hover:text-white"
                    )}
                  >
                    <Smartphone size={14} />
                    Code - Même tél
                  </button>
                </div>

                {/* QR Mode */}
                {mode === "qr" && (
                  <div className="bg-vendeur-coal border border-vendeur-emerald/20 rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center gap-8 shadow-2xl">
                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        Ouvrez WhatsApp → ⋮ → Appareils connectés → Associer un appareil
                      </p>
                    </div>
                    {qrCode ? (
                      <div className="relative group">
                        <div className="absolute -inset-6 bg-vendeur-emerald/20 blur-3xl rounded-full opacity-100 transition-opacity duration-500 animate-pulse" />
                        <div className="relative p-6 bg-white rounded-[2.5rem] shadow-2xl border-[12px] border-white transition-transform overflow-hidden">
                          <img src={qrCode} alt="WhatsApp QR Code" className="w-60 h-60 md:w-72 md:h-72" />
                          
                          {/* Lightweight Hardware-Accelerated Scanner Line */}
                          <motion.div
                            initial={{ top: "0%" }}
                            animate={{ top: ["5%", "90%", "5%"] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                            className="absolute left-4 right-4 h-1 bg-vendeur-emerald rounded-full opacity-80 z-10 pointer-events-none"
                            style={{ willChange: "top" }}
                          />

                          {/* Connecting Overlay when scanned */}
                          {isConnecting && (
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
                        <Loader2 className="animate-spin text-vendeur-emerald/60" size={48} />
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Génération du QR...</p>
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                      <div className={cn(
                        "flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-2xl w-full justify-center border transition-all",
                        isConnecting
                          ? "bg-vendeur-emerald text-vendeur-coal border-vendeur-emerald shadow-lg shadow-vendeur-emerald/20"
                          : "bg-vendeur-emerald/5 text-vendeur-emerald border-vendeur-emerald/10"
                      )}>
                        <Loader2 className="animate-spin" size={14} />
                        {isConnecting ? "Connexion en cours..." : qrCode ? "En attente de scan..." : "Préparation de la connexion..."}
                      </div>
                      {qrCode && (
                        <button
                          onClick={() => { setQrCode(null); autoInitDoneRef.current = false; setAutoInitializing(true); handleInitBaileys(); }}
                          className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all py-2"
                        >
                          <RefreshCw size={12} /> Régénérer le QR
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Pairing Code Mode */}
                {mode === "pairing" && (
                  <div className="bg-vendeur-coal border border-vendeur-emerald/20 rounded-[2.5rem] p-8 md:p-12 flex flex-col gap-8 shadow-2xl">
                    <div className="space-y-3">
                      <div className="inline-flex h-14 w-14 rounded-2xl bg-vendeur-emerald/10 items-center justify-center text-vendeur-emerald">
                        <Hash size={28} />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-white">Code d'appairage</h3>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                        Entrez votre numéro WhatsApp. Un code à 8 chiffres s'affichera. Tapez-le dans WhatsApp → Appareils connectés → Associer avec un numéro.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="tel"
                          value={pairingPhone}
                          onChange={e => setPairingPhone(e.target.value)}
                          placeholder="Ex: +225 07 00 00 00 00"
                          className="w-full sm:flex-1 h-16 bg-white/5 border border-white/10 rounded-2xl px-5 text-white font-bold text-sm placeholder:text-white/20 focus:outline-none focus:border-vendeur-emerald/50 transition-colors"
                          onKeyDown={e => e.key === 'Enter' && handleRequestPairingCode()}
                        />
                        <button
                          onClick={handleRequestPairingCode}
                          disabled={pairingLoading}
                          className="h-16 px-6 bg-white text-vendeur-coal rounded-2xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-vendeur-emerald transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto shrink-0"
                        >
                          {pairingLoading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                          {pairingLoading ? "Génération..." : "Générer le code"}
                        </button>
                      </div>

                      {pairingCode && (
                        <div className="animate-in zoom-in-95 duration-300 p-6 bg-vendeur-emerald/5 border border-vendeur-emerald/20 rounded-2xl text-center space-y-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-vendeur-emerald/60">Votre code WhatsApp</p>
                          <p className="text-5xl font-black tracking-[0.3em] text-vendeur-emerald font-mono">{pairingCode}</p>
                          <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">
                            Valable quelques minutes · WhatsApp → ⋮ → Appareils connectés → Associer avec un numéro
                          </p>
                          <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-vendeur-emerald">
                            <Loader2 className="animate-spin" size={12} />
                            En attente de validation...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Tips / Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-vendeur-emerald/5 border border-vendeur-emerald/10 p-8 rounded-[2.5rem] space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-vendeur-emerald">Pourquoi connecter ?</h4>
              <ul className="space-y-4">
                <TipItem icon={<Zap size={14} />} text="Réponses 24h/24 sans effort" />
                <TipItem icon={<Bot size={14} />} text="Intelligence artificielle qualifiée" />
                <TipItem icon={<ShieldCheck size={14} />} text="Sécurisé et professionnel" />
              </ul>
            </div>

            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-3">
              <div className="flex items-center gap-3">
                <Smartphone className="text-vendeur-emerald shrink-0" size={18} />
                <p className="text-[9px] font-black uppercase tracking-widest text-vendeur-emerald">Sur mobile ?</p>
              </div>
              <p className="text-[9px] font-bold text-white/40 leading-relaxed">
                Si vous avez payé sur ce téléphone, utilisez le <strong className="text-white/60">Code d'appairage</strong> - pas besoin d'un 2ème appareil pour scanner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBadge({ label, completed, active }: { label: string, completed: boolean, active: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all",
      completed ? "bg-vendeur-emerald text-vendeur-coal border-transparent" :
      active ? "bg-white text-vendeur-coal border-transparent animate-pulse" :
      "bg-white/5 text-white/20 border-white/5"
    )}>
      {completed ? <CheckCircle2 size={12} /> : <Circle size={12} />}
      {label}
    </div>
  );
}

function TipItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <li className="flex items-center gap-3 text-[10px] font-bold text-white/60 uppercase tracking-tight">
      <div className="text-vendeur-emerald">{icon}</div>
      {text}
    </li>
  );
}

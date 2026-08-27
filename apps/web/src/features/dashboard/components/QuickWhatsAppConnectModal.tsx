import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  CheckCircle2,
  QrCode,
  Smartphone,
  Clock,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { parsePhoneNumber } from "@/features/onboarding/components/CountrySelector";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

interface QuickWhatsAppConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: any;
  onSuccess?: () => void;
}

export function QuickWhatsAppConnectModal({
  isOpen,
  onClose,
  merchant,
  onSuccess
}: QuickWhatsAppConnectModalProps) {
  const { user } = useAuthStore();
  const [mode, setMode] = useState<"code" | "qr">("code");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isRequestingPairing, setIsRequestingPairing] = useState(false);
  const [isRequestingQr, setIsRequestingQr] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasTriggeredSuccessRef = useRef(false);
  const activeNumber = merchant?.whatsappNumber || merchant?.phone || "";
  const isExpired = timeLeft <= 0;

  // Handle successful connection cleanly
  const handleSuccess = useCallback(() => {
    if (hasTriggeredSuccessRef.current) return;
    hasTriggeredSuccessRef.current = true;
    setIsConnected(true);
    setIsRequestingPairing(false);
    setIsRequestingQr(false);
    setErrorMessage(null);

    toast.success("🎉 WhatsApp connecté avec succès ! L'IA est prête.");

    // Short graceful delay for celebratory feedback before closing and opening offers
    setTimeout(() => {
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    }, 900);
  }, [onClose, onSuccess]);

  // Reset state on modal open
  useEffect(() => {
    if (isOpen) {
      hasTriggeredSuccessRef.current = false;
      setIsConnected(false);
      setErrorMessage(null);
      setTimeLeft(120);
    }
  }, [isOpen]);

  // Auto-request pairing code on mount if in code mode
  useEffect(() => {
    if (isOpen && activeNumber && !pairingCode && !isConnected && mode === "code" && !isRequestingPairing) {
      handleRequestPairingCode();
    }
  }, [isOpen, activeNumber, mode]);

  // Countdown timer for pairing code (120s)
  useEffect(() => {
    if (!pairingCode || isConnected || isExpired) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pairingCode, isConnected, isExpired]);

  // Realtime Socket listeners + Tab focus recovery + Polling fallback
  useEffect(() => {
    if (!isOpen || isConnected) return;

    const s: Socket = io(API_URL);
    if (user?.id) {
      s.emit("join", user.id);
    }

    s.on("whatsapp:pairing_code", (data: { code: string }) => {
      if (data?.code) {
        setPairingCode(data.code);
        setTimeLeft(120);
        setErrorMessage(null);
        setIsRequestingPairing(false);
      }
    });

    s.on("whatsapp:qr", (data: { qr: string }) => {
      if (data?.qr) {
        setQrCodeData(data.qr);
        setErrorMessage(null);
        setIsRequestingQr(false);
      }
    });

    s.on("whatsapp:connected", () => {
      handleSuccess();
    });

    s.on("whatsapp:disconnected", (data: any) => {
      if (!isConnected && data?.reason === "session_expired") {
        setErrorMessage("La session de liaison a expiré. Veuillez générer un nouveau code.");
      }
    });

    s.on("whatsapp:error", (err: any) => {
      if (!isConnected) {
        setErrorMessage(typeof err === "string" ? err : err?.message || "Erreur de liaison WhatsApp.");
      }
    });

    // Check status function to recover if socket missed event while in background
    const checkConnectionStatus = async () => {
      if (hasTriggeredSuccessRef.current) return;
      try {
        const res = await apiClient.get("/api/whatsapp/status");
        if (res.data?.status === "connected") {
          handleSuccess();
        }
      } catch (err) {
        // silent check
      }
    };

    // Active polling interval while modal is open (every 2.5s)
    const pollInterval = setInterval(checkConnectionStatus, 2500);

    // Event listener when user switches back from WhatsApp app to browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkConnectionStatus();
      }
    };

    const handleWindowFocus = () => {
      checkConnectionStatus();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      s.disconnect();
    };
  }, [isOpen, user?.id, isConnected, handleSuccess]);

  const handleRequestPairingCode = async () => {
    if (!activeNumber || activeNumber.replace(/\D/g, "").length < 6) {
      setErrorMessage("Numéro WhatsApp invalide ou manquant. Vérifiez votre numéro.");
      return;
    }
    const parsed = parsePhoneNumber(activeNumber, merchant?.country || "CI");
    const normalizedPhone = parsed.e164 || activeNumber;

    setIsRequestingPairing(true);
    setErrorMessage(null);
    setPairingCode(null);
    setCopiedCode(false);
    setTimeLeft(120);
    try {
      const res = await apiClient.post("/api/whatsapp/pair-code", { phoneNumber: normalizedPhone });
      if (res.data?.code) {
        setPairingCode(res.data.code);
        setTimeLeft(120);
      }
    } catch (err: any) {
      console.warn("[QuickConnect] Code error:", err);
      setErrorMessage(err?.response?.data?.error || "Impossible de générer le code. Veuillez réessayer.");
    } finally {
      setIsRequestingPairing(false);
    }
  };

  const handleRequestQrCode = async () => {
    setIsRequestingQr(true);
    setErrorMessage(null);
    setQrCodeData(null);
    try {
      const res = await apiClient.post("/api/whatsapp/pair-qr");
      if (res.data?.qr) {
        setQrCodeData(res.data.qr);
      }
    } catch (err: any) {
      console.warn("[QuickConnect] QR error:", err);
      setErrorMessage(err?.response?.data?.error || "Impossible de charger le QR Code.");
    } finally {
      setIsRequestingQr(false);
    }
  };

  const handleCopyCodeAndOpenWhatsApp = () => {
    if (!pairingCode || isExpired) return;
    const cleanCode = pairingCode.replace(/[^A-Za-z0-9]/g, "");
    navigator.clipboard.writeText(cleanCode);
    setCopiedCode(true);
    toast.success("Code copié ! Ouverture de WhatsApp...");
    setTimeout(() => setCopiedCode(false), 3000);

    // Direct WhatsApp app launch
    window.location.href = "whatsapp://";
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            className="relative w-full max-w-md bg-[#16181C] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl text-left z-10 my-auto overflow-hidden box-border"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Success State */}
            {isConnected ? (
              <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
                <div className="h-16 w-16 mx-auto rounded-full bg-vendeur-emerald/20 border border-vendeur-emerald/40 text-vendeur-emerald flex items-center justify-center shadow-lg shadow-vendeur-emerald/20">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-vendeur-emerald/10 text-vendeur-emerald text-[10px] font-black uppercase tracking-wider">
                    <Sparkles size={11} />
                    <span>Liaison Réussie</span>
                  </div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tight">WhatsApp Connecté ! 🎉</h4>
                  <p className="text-xs text-white/60">Votre Vendeur IA est prêt. Redirection vers vos offres...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Header épuré */}
                <div className="flex items-center gap-3 pr-6">
                  <div className="h-10 w-10 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center shrink-0">
                    <WhatsAppIcon size={20} variant="brand" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-vendeur-emerald block">
                      Étape 1 sur 2
                    </span>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight truncate">
                      Lier votre WhatsApp
                    </h3>
                  </div>
                </div>

                {/* Consigne claire & fluide */}
                <p className="text-xs text-white/80 leading-relaxed">
                  Pour que votre Vendeur IA réponde automatiquement à vos clients, ouvrez <strong>WhatsApp</strong> &gt; <strong>Appareils connectés</strong> &gt; <strong>{mode === "code" ? "Lier avec un numéro" : "Connecter un appareil"}</strong> et {mode === "code" ? "entrez ce code :" : "scannez ce code :"}
                </p>

                {/* Message d'erreur éventuel */}
                {errorMessage && (
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5">
                    <AlertTriangle size={16} className="shrink-0 text-red-400 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold">{errorMessage}</p>
                      <button
                        type="button"
                        onClick={mode === "code" ? handleRequestPairingCode : handleRequestQrCode}
                        className="text-[11px] font-black uppercase tracking-wider text-white underline hover:no-underline cursor-pointer"
                      >
                        Réessayer maintenant
                      </button>
                    </div>
                  </div>
                )}

                {/* MODE 1 : CODE DE JUMELAGE (Par défaut sur mobile) */}
                {mode === "code" && (
                  <div className="space-y-4">
                    {/* Bloc Code Épuré */}
                    <div className="py-4 px-3 rounded-2xl bg-black/60 border border-vendeur-emerald/30 text-center space-y-1 shadow-inner relative">
                      {isRequestingPairing ? (
                        <div className="py-3 flex flex-col items-center justify-center gap-2">
                          <Loader2 size={24} className="text-vendeur-emerald animate-spin" />
                          <span className="text-xs text-white/50">Génération du code...</span>
                        </div>
                      ) : pairingCode ? (
                        <>
                          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                            {isExpired ? (
                              <span className="text-amber-400 font-black">⚠️ Code expiré</span>
                            ) : (
                              <span className="text-vendeur-emerald flex items-center gap-1">
                                <Clock size={11} />
                                <span>Expire dans {formatCountdown(timeLeft)}</span>
                              </span>
                            )}
                          </div>

                          <div className={cn(
                            "text-3xl sm:text-4xl font-black font-mono tracking-widest text-white select-all transition-opacity",
                            isExpired && "opacity-40 line-through"
                          )}>
                            {pairingCode}
                          </div>
                        </>
                      ) : (
                        <div className="py-2">
                          <button
                            type="button"
                            onClick={handleRequestPairingCode}
                            className="h-10 px-4 rounded-xl bg-vendeur-emerald text-vendeur-coal font-black text-xs uppercase tracking-wider cursor-pointer"
                          >
                            Générer le code
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bouton d'action unique (56px) : Copier OU Régénérer si expiré */}
                    {isExpired ? (
                      <button
                        type="button"
                        onClick={handleRequestPairingCode}
                        disabled={isRequestingPairing}
                        className="w-full min-h-[56px] h-14 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        {isRequestingPairing ? <Loader2 size={18} className="animate-spin shrink-0" /> : <RefreshCw size={18} className="shrink-0" />}
                        <span>Générer un nouveau code</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCopyCodeAndOpenWhatsApp}
                        disabled={!pairingCode}
                        className="w-full min-h-[56px] h-14 px-6 rounded-2xl bg-vendeur-emerald hover:bg-emerald-400 disabled:opacity-50 text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-vendeur-emerald/20 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        {copiedCode ? (
                          <Check size={18} className="shrink-0" />
                        ) : (
                          <Copy size={18} className="shrink-0" />
                        )}
                        <span>{copiedCode ? "Code copié ! Ouverture..." : "Copier le code & Ouvrir WhatsApp"}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* MODE 2 : SCAN DU QR CODE (Ordinateur / Tablette) */}
                {mode === "qr" && (
                  <div className="space-y-4 text-center">
                    <div className="p-4 bg-white rounded-2xl mx-auto inline-block shadow-xl">
                      {isRequestingQr ? (
                        <div className="h-[160px] w-[160px] flex items-center justify-center">
                          <Loader2 size={24} className="text-vendeur-coal animate-spin" />
                        </div>
                      ) : qrCodeData ? (
                        <QRCodeSVG value={qrCodeData} size={160} level="M" />
                      ) : (
                        <div className="h-[160px] w-[160px] flex flex-col items-center justify-center gap-2 text-vendeur-coal/60">
                          <QrCode size={28} />
                          <span className="text-[11px] font-bold">En attente</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={handleRequestQrCode}
                        disabled={isRequestingQr}
                        className="h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isRequestingQr ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        <span>Actualiser le QR</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Switcher discret en bas */}
                <div className="flex items-center justify-between pt-1 text-xs text-white/50">
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode = mode === "code" ? "qr" : "code";
                      setMode(nextMode);
                      if (nextMode === "qr" && !qrCodeData) handleRequestQrCode();
                      if (nextMode === "code" && !pairingCode) handleRequestPairingCode();
                    }}
                    className="hover:text-vendeur-emerald transition-colors font-medium cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {mode === "code" ? (
                      <>
                        <QrCode size={13} />
                        <span>Scanner plutôt un QR Code</span>
                      </>
                    ) : (
                      <>
                        <Smartphone size={13} />
                        <span>Utiliser le Code de Jumelage</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

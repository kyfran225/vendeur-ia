import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  CheckCircle2,
  QrCode,
  Smartphone
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { parsePhoneNumber, formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";
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

  const activeNumber = merchant?.whatsappNumber || merchant?.phone || "";

  // Auto-request pairing code on mount if in code mode
  useEffect(() => {
    if (isOpen && activeNumber && !pairingCode && !isConnected && mode === "code") {
      handleRequestPairingCode();
    }
  }, [isOpen, activeNumber, mode]);

  // Realtime Socket listeners
  useEffect(() => {
    if (!isOpen) return;

    const s: Socket = io(API_URL);
    if (user?.id) {
      s.emit("join", user.id);
    }

    s.on("whatsapp:pairing_code", (data: { code: string }) => {
      if (data?.code) {
        setPairingCode(data.code);
        setIsRequestingPairing(false);
      }
    });

    s.on("whatsapp:qr", (data: { qr: string }) => {
      if (data?.qr) {
        setQrCodeData(data.qr);
        setIsRequestingQr(false);
      }
    });

    s.on("whatsapp:connected", () => {
      setIsConnected(true);
      setIsRequestingPairing(false);
      setIsRequestingQr(false);
      toast.success("🎉 WhatsApp connecté ! L'IA est prête.");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1800);
    });

    return () => {
      s.disconnect();
    };
  }, [isOpen, user?.id, onSuccess, onClose]);

  const handleRequestPairingCode = async () => {
    if (!activeNumber || activeNumber.replace(/\D/g, "").length < 6) return;
    const parsed = parsePhoneNumber(activeNumber, merchant?.country || "CI");
    const normalizedPhone = parsed.e164 || activeNumber;

    setIsRequestingPairing(true);
    setPairingCode(null);
    try {
      const res = await apiClient.post("/api/whatsapp/pair-code", { phoneNumber: normalizedPhone });
      if (res.data?.code) {
        setPairingCode(res.data.code);
      }
    } catch (err: any) {
      console.warn("[QuickConnect] Code error:", err);
    } finally {
      setIsRequestingPairing(false);
    }
  };

  const handleRequestQrCode = async () => {
    setIsRequestingQr(true);
    setQrCodeData(null);
    try {
      const res = await apiClient.post("/api/whatsapp/pair-qr");
      if (res.data?.qr) {
        setQrCodeData(res.data.qr);
      }
    } catch (err: any) {
      console.warn("[QuickConnect] QR error:", err);
    } finally {
      setIsRequestingQr(false);
    }
  };

  const handleCopyCodeAndOpenWhatsApp = () => {
    if (!pairingCode) return;
    const cleanCode = pairingCode.replace(/[^A-Za-z0-9]/g, "");
    navigator.clipboard.writeText(cleanCode);
    setCopiedCode(true);
    toast.success("Code copié !");
    setTimeout(() => setCopiedCode(false), 3000);

    // Direct WhatsApp app launch
    window.location.href = "whatsapp://";
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
              <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-300">
                <div className="h-16 w-16 mx-auto rounded-full bg-vendeur-emerald/20 border border-vendeur-emerald/40 text-vendeur-emerald flex items-center justify-center">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="text-xl font-black text-white uppercase tracking-tight">WhatsApp Connecté ! 🎉</h4>
                <p className="text-xs text-white/60">Votre Vendeur IA est prêt à répondre à vos clients 24h/24.</p>
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

                {/* MODE 1 : CODE DE JUMELAGE (Par défaut sur mobile) */}
                {mode === "code" && (
                  <div className="space-y-4">
                    {/* Bloc Code Épuré */}
                    <div className="py-4 px-3 rounded-2xl bg-black/60 border border-vendeur-emerald/30 text-center space-y-1 shadow-inner">
                      {isRequestingPairing ? (
                        <div className="py-3 flex flex-col items-center justify-center gap-2">
                          <Loader2 size={24} className="text-vendeur-emerald animate-spin" />
                          <span className="text-xs text-white/50">Génération du code...</span>
                        </div>
                      ) : pairingCode ? (
                        <>
                          <span className="text-[9px] font-black uppercase tracking-widest text-vendeur-emerald">
                            Code de jumelage WhatsApp
                          </span>
                          <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white select-all">
                            {pairingCode}
                          </div>
                          <span className="text-[10px] text-white/40 block">Valide 2 minutes</span>
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

                    {/* Bouton d'action unique (56px, 1 seule icône propre) */}
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

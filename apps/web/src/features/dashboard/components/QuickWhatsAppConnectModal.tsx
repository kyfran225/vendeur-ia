import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Smartphone,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Phone,
  ArrowRight
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { parsePhoneNumber, formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";
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
  const [activeTab, setActiveTab] = useState<"pairing_code" | "qr_code">("pairing_code");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isRequestingPairing, setIsRequestingPairing] = useState(false);
  const [isRequestingQr, setIsRequestingQr] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const activeNumber = merchant?.whatsappNumber || merchant?.phone || "";

  // Auto-request pairing code when modal opens
  useEffect(() => {
    if (isOpen && activeNumber && !pairingCode && !isConnected) {
      handleRequestPairingCode();
    }
  }, [isOpen, activeNumber]);

  // Realtime socket events
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
      toast.success("🎉 WhatsApp connecté en direct !");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    });

    return () => {
      s.disconnect();
    };
  }, [isOpen, user?.id, onSuccess, onClose]);

  const handleRequestPairingCode = async () => {
    if (!activeNumber || activeNumber.replace(/\D/g, "").length < 6) {
      toast.error("Numéro WhatsApp invalide.");
      return;
    }
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
      console.warn("[QuickConnect] Pairing code request error:", err);
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
      console.warn("[QuickConnect] QR code request error:", err);
    } finally {
      setIsRequestingQr(false);
    }
  };

  const handleCopyCodeAndOpenWhatsApp = () => {
    if (!pairingCode) return;
    const cleanCode = pairingCode.replace(/[^A-Za-z0-9]/g, "");
    navigator.clipboard.writeText(cleanCode);
    setCopiedCode(true);
    toast.success("Code copié ! Ouverture de WhatsApp...");
    setTimeout(() => setCopiedCode(false), 3000);

    // Deep link directly into WhatsApp app
    window.location.href = "whatsapp://";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-vendeur-coal border border-white/10 rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl space-y-5 text-left z-10 my-auto overflow-hidden box-border"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 pr-8">
              <div className="h-12 w-12 rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-vendeur-emerald flex items-center justify-center shrink-0">
                <ShieldCheck size={26} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-vendeur-emerald">
                  Connexion Immédiate
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight truncate">
                  Lier votre WhatsApp de Vente
                </h3>
              </div>
            </div>

            {/* Success State */}
            {isConnected ? (
              <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
                <div className="h-16 w-16 mx-auto rounded-full bg-vendeur-emerald/20 border border-vendeur-emerald/40 text-vendeur-emerald flex items-center justify-center">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-white">WhatsApp Connecté ! 🎉</h4>
                  <p className="text-xs text-white/60">Votre Vendeur IA est désormais actif et prêt pour vos clients.</p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-white/60 leading-relaxed">
                  Pour que votre Vendeur IA réponde automatiquement à vos clients, liez votre ligne WhatsApp en 5 secondes.
                </p>

                {/* Tab Switcher (48px) */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/10 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("pairing_code");
                      if (!pairingCode) handleRequestPairingCode();
                    }}
                    className={cn(
                      "h-12 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all cursor-pointer",
                      activeTab === "pairing_code"
                        ? "bg-vendeur-emerald text-vendeur-coal shadow-md"
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    <Smartphone size={16} className="shrink-0" />
                    <span>Sur ce Téléphone (Code)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("qr_code");
                      if (!qrCodeData) handleRequestQrCode();
                    }}
                    className={cn(
                      "h-12 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all cursor-pointer",
                      activeTab === "qr_code"
                        ? "bg-vendeur-emerald text-vendeur-coal shadow-md"
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    <QrCode size={16} className="shrink-0" />
                    <span>Scanner un QR</span>
                  </button>
                </div>

                {/* Content: Pairing Code Mobile */}
                {activeTab === "pairing_code" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {pairingCode ? (
                      <div className="space-y-4">
                        <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-vendeur-emerald/30 text-center space-y-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-vendeur-emerald">
                            Code de Jumelage WhatsApp
                          </span>
                          <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white select-all">
                            {pairingCode}
                          </div>
                          <p className="text-[10px] text-white/40 font-medium">Valide 2 minutes</p>
                        </div>

                        {/* 56px Action Button */}
                        <button
                          type="button"
                          onClick={handleCopyCodeAndOpenWhatsApp}
                          className="w-full min-h-[56px] py-3.5 px-6 rounded-2xl bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-vendeur-emerald/20 transition-all cursor-pointer active:scale-[0.98]"
                        >
                          {copiedCode ? <Check size={18} className="shrink-0" /> : <Copy size={18} className="shrink-0" />}
                          <span>{copiedCode ? "Code Copié ! Ouverture..." : "📋 Copier le code & Ouvrir WhatsApp"}</span>
                        </button>

                        {/* Guide pas-à-pas ultra simple */}
                        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs text-white/80">
                          <p className="text-[10px] font-black uppercase tracking-wider text-vendeur-emerald">
                            👉 Que faire dans WhatsApp ? (en 5 secondes)
                          </p>
                          <div className="space-y-1.5 pl-1">
                            <p className="flex items-start gap-2">
                              <span className="h-4 w-4 rounded-full bg-vendeur-emerald/20 text-vendeur-emerald font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                              <span>Allez dans <strong>Paramètres</strong> (ou <strong className="font-mono">⋮</strong>) &gt; <strong>Appareils connectés</strong></span>
                            </p>
                            <p className="flex items-start gap-2">
                              <span className="h-4 w-4 rounded-full bg-vendeur-emerald/20 text-vendeur-emerald font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                              <span>Touchez <strong>Connecter un appareil</strong> puis en bas : <strong>« Lier avec un numéro »</strong></span>
                            </p>
                            <p className="flex items-start gap-2">
                              <span className="h-4 w-4 rounded-full bg-vendeur-emerald/20 text-vendeur-emerald font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                              <span>Collez le code ci-dessus. <strong>C'est tout ! L'IA est branchée.</strong></span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center space-y-3">
                        {isRequestingPairing ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 size={26} className="text-vendeur-emerald animate-spin" />
                            <span className="text-xs text-white/60">Génération du code de jumelage...</span>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-white/60">
                              Ligne : <strong className="font-mono text-white">{formatDisplayPhone(activeNumber, merchant?.country || "CI")}</strong>
                            </p>
                            <button
                              type="button"
                              onClick={handleRequestPairingCode}
                              className="min-h-[52px] px-6 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs inline-flex items-center justify-center gap-2 shadow-md cursor-pointer"
                            >
                              <Smartphone size={16} />
                              <span>Générer mon Code de Jumelage</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Content: QR Code */}
                {activeTab === "qr_code" && (
                  <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in duration-300">
                    {qrCodeData ? (
                      <div className="p-4 bg-white rounded-2xl shadow-xl">
                        <QRCodeSVG value={qrCodeData} size={180} level="M" />
                      </div>
                    ) : (
                      <div className="h-[180px] w-[180px] rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center gap-2 p-4">
                        {isRequestingQr ? (
                          <>
                            <Loader2 size={24} className="text-vendeur-emerald animate-spin" />
                            <span className="text-xs text-white/60">Génération du QR...</span>
                          </>
                        ) : (
                          <>
                            <QrCode size={28} className="text-white/30" />
                            <span className="text-xs text-white/40">En attente</span>
                          </>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleRequestQrCode}
                      disabled={isRequestingQr}
                      className="h-11 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isRequestingQr ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      <span>Actualiser le QR Code</span>
                    </button>
                  </div>
                )}

                {/* Footer Skip */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs font-bold text-white/40 hover:text-white transition-colors cursor-pointer py-1"
                  >
                    Configurer plus tard &gt;
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

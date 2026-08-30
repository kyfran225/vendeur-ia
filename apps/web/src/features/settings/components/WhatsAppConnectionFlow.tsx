import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Loader2,
  Check,
  Phone,
  Settings2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Zap,
  Copy,
  Smartphone,
  QrCode,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Clock
} from "lucide-react";
import { AssistantIcon } from "@/components/ui/AssistantIcon";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { StepMilestoneModal } from "@/components/ui/StepMilestoneModal";
import { formatDisplayPhone, parsePhoneNumber } from "@/features/onboarding/components/CountrySelector";
import { QRCodeSVG } from "qrcode.react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function WhatsAppConnectionFlow() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"pairing_code" | "qr_code" | "meta">("pairing_code");
  const [storeWhatsApp, setStoreWhatsApp] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  // Pairing Code & QR State
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isRequestingPairing, setIsRequestingPairing] = useState(false);
  const [isRequestingQr, setIsRequestingQr] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(120);

  // Meta Cloud API Form
  const [metaForm, setMetaForm] = useState({
    phoneNumberId: "",
    wabaId: "",
    accessToken: ""
  });
  const [savingMeta, setSavingMeta] = useState(false);
  const [showAdvancedMeta, setShowAdvancedMeta] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  const { data: dashboard, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard");
      return res.data;
    }
  });

  const { data: liveStatusData } = useQuery({
    queryKey: ["whatsapp-status"],
    queryFn: async () => {
      try {
        const res = await apiClient.get("/api/whatsapp/status");
        return res.data;
      } catch {
        return { status: "disconnected" };
      }
    },
    refetchInterval: 5000
  });

  const merchant = dashboard?.merchant;
  const whatsapp = dashboard?.whatsappConnection;
  const activeNumber = merchant?.whatsappNumber || merchant?.phone || whatsapp?.phoneNumber || user?.whatsappNumber || "";

  const isExplicitlyDisconnected =
    liveStatusData?.status === "disconnected" ||
    merchant?.whatsappConfig?.status === "disconnected" ||
    whatsapp?.status === "DISCONNECTED" ||
    whatsapp?.status === "disconnected";

  const isBaileysConnected =
    !isExplicitlyDisconnected &&
    (liveStatusData?.status === "connected" ||
     whatsapp?.status === "CONNECTED" ||
     whatsapp?.status === "connected" ||
     merchant?.whatsappConfig?.status === "connected");

  const isMetaConnected =
    !isExplicitlyDisconnected &&
    merchant?.whatsappConfig?.provider === "meta" &&
    merchant?.whatsappConfig?.status === "connected" &&
    Boolean(merchant?.whatsappConfig?.meta?.phoneNumberId || merchant?.whatsappConfig?.phoneNumberId);

  const isConnectedLive = isBaileysConnected || isMetaConnected;

  const isPaidActive = merchant?.subscription?.status === "active";
  const isPaused = isPaidActive && merchant?.aiSettings?.autoReply === false;
  const isDiscoveryMode = !isPaidActive;

  // Prefill phone on load
  useEffect(() => {
    if (activeNumber && !storeWhatsApp) {
      setStoreWhatsApp(activeNumber);
    }
  }, [activeNumber, storeWhatsApp]);

  // Countdown timer for pairing code (120s)
  useEffect(() => {
    if (!pairingCode || isConnectedLive || timeLeft <= 0) return;

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
  }, [pairingCode, isConnectedLive, timeLeft]);

  // Socket.io Realtime event listeners for live pairing
  useEffect(() => {
    const s: Socket = io(API_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    const joinRoom = () => {
      if (user?.id) {
        s.emit("join", user.id);
      }
    };

    s.on("connect", joinRoom);
    if (s.connected) {
      joinRoom();
    }

    const handlePairingCode = (data: { code: string }) => {
      if (data?.code) {
        setPairingCode(data.code);
        setTimeLeft(120);
        setIsRequestingPairing(false);
      }
    };

    const handleQrCode = (data: { qr: string }) => {
      if (data?.qr) {
        setQrCodeData(data.qr);
        setIsRequestingQr(false);
      }
    };

    const handleConnected = () => {
      setIsRequestingPairing(false);
      setIsRequestingQr(false);
      setPairingCode(null);
      setQrCodeData(null);
      toast.success("🎉 Votre WhatsApp de vente est connecté avec succès ! L'IA est prête.");
      setShowMilestoneModal(true);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    };

    const handleDisconnected = (data: any) => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (data?.reason === "logged_out" || data?.reason === "session_expired") {
        toast.info("Session WhatsApp déconnectée.");
      }
    };

    s.on("whatsapp:pairing_code", handlePairingCode);
    s.on("whatsapp:qr", handleQrCode);
    s.on("whatsapp:connected", handleConnected);
    s.on("whatsapp:disconnected", handleDisconnected);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        refetch();
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      s.off("whatsapp:pairing_code", handlePairingCode);
      s.off("whatsapp:qr", handleQrCode);
      s.off("whatsapp:connected", handleConnected);
      s.off("whatsapp:disconnected", handleDisconnected);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      s.disconnect();
    };
  }, [user?.id, refetch, queryClient]);

  // Fetch pairing data on mount if any active session is pending
  useEffect(() => {
    apiClient.get("/api/whatsapp/pairing-data").then((res) => {
      if (res.data?.pairingCode) {
        setPairingCode(res.data.pairingCode);
      }
      if (res.data?.qr) {
        setQrCodeData(res.data.qr);
      }
    }).catch(() => {});
  }, []);

  // Request Mobile Pairing Code
  const handleRequestPairingCode = async () => {
    const targetPhone = (storeWhatsApp || activeNumber).trim();
    if (!targetPhone || targetPhone.replace(/\D/g, "").length < 6) {
      toast.error("Veuillez renseigner un numéro WhatsApp valide pour générer le code.");
      return;
    }
    const parsed = parsePhoneNumber(targetPhone, merchant?.country || "CI");
    const normalizedPhone = parsed.e164 || targetPhone;

    setIsRequestingPairing(true);
    setPairingCode(null);
    setCopiedCode(false);
    setTimeLeft(120);
    try {
      const res = await apiClient.post("/api/whatsapp/pair-code", { phoneNumber: normalizedPhone });
      if (res.data?.code) {
        setPairingCode(res.data.code);
        setTimeLeft(120);
        toast.success("Code de jumelage généré ! Collez-le dans WhatsApp.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Impossible de générer le code de jumelage. Réessayez.");
    } finally {
      setIsRequestingPairing(false);
    }
  };

  // Request Desktop QR Code
  const handleRequestQrCode = async () => {
    setIsRequestingQr(true);
    setQrCodeData(null);
    try {
      const res = await apiClient.post("/api/whatsapp/pair-qr");
      if (res.data?.qr) {
        setQrCodeData(res.data.qr);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Impossible de générer le QR Code.");
    } finally {
      setIsRequestingQr(false);
    }
  };

  // Disconnect WhatsApp
  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await apiClient.post("/api/whatsapp/disconnect");
      toast.success("WhatsApp déconnecté avec succès.");
      setPairingCode(null);
      setQrCodeData(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] }),
        queryClient.invalidateQueries({ queryKey: ["merchant"] })
      ]);
      await refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de la déconnexion.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Copy pairing code & open WhatsApp
  const handleCopyCodeAndOpenWhatsApp = () => {
    if (!pairingCode) return;
    const cleanCode = pairingCode.replace(/[^A-Za-z0-9]/g, "");
    navigator.clipboard.writeText(cleanCode);
    setCopiedCode(true);
    toast.success("Code copié ! Ouverture de WhatsApp...");
    setTimeout(() => setCopiedCode(false), 3000);

    // Deep link directly to WhatsApp app on mobile
    window.location.href = "whatsapp://";
  };

  // Save Selling Phone Number
  const handleUpdatePhone = async () => {
    const raw = storeWhatsApp.trim();
    if (!raw || raw.replace(/\D/g, "").length < 6) {
      toast.error("Veuillez renseigner un numéro WhatsApp valide.");
      return;
    }
    const parsed = parsePhoneNumber(raw, merchant?.country || "CI");
    const normalizedPhone = parsed.e164 || raw;

    setSavingPhone(true);
    try {
      await apiClient.patch("/api/commerce/merchant", {
        whatsappNumber: normalizedPhone,
        phone: normalizedPhone
      });
      toast.success("Numéro de vente enregistré ! 🚀");
      setIsEditingPhone(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de la mise à jour du numéro.");
    } finally {
      setSavingPhone(false);
    }
  };

  // Save Meta Config
  const handleSaveMetaConfig = async () => {
    if (!metaForm.phoneNumberId || !metaForm.accessToken) {
      toast.error("Veuillez remplir le Phone Number ID et le Jeton d'accès Meta.");
      return;
    }
    setSavingMeta(true);
    try {
      await apiClient.post("/api/whatsapp/meta-config", metaForm);
      toast.success("Configuration Meta Cloud enregistrée avec succès ! 🚀");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de l'enregistrement Meta.");
    } finally {
      setSavingMeta(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden box-border">
      {/* 1. Header Statut WhatsApp */}
      <div id="whatsapp" className="scroll-mt-28 bg-vendeur-coal border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-5 text-left shadow-2xl w-full max-w-full overflow-hidden box-border">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/5 pb-5 w-full">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1 w-full">
            <div className={cn(
              "h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center font-black shrink-0 border",
              isConnectedLive && isPaidActive && !isPaused
                ? "bg-vendeur-emerald/10 border-vendeur-emerald/20 text-vendeur-emerald"
                : isConnectedLive && isPaused
                  ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                  : isConnectedLive
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-white/5 border-white/10 text-white/40"
            )}>
              <ShieldCheck size={26} className="shrink-0" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest",
                  isConnectedLive && isPaidActive && !isPaused
                    ? "bg-vendeur-emerald/15 border-vendeur-emerald/30 text-vendeur-emerald"
                    : isConnectedLive && isPaused
                      ? "bg-sky-500/15 border-sky-500/30 text-sky-300"
                      : isConnectedLive
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                        : "bg-white/5 border-white/10 text-white/50"
                )}>
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    isConnectedLive && isPaidActive && !isPaused
                      ? "bg-vendeur-emerald animate-pulse"
                      : isConnectedLive && isPaused
                        ? "bg-sky-400"
                        : isConnectedLive
                          ? "bg-amber-400"
                          : "bg-white/30"
                  )} />
                  <span>
                    {isConnectedLive
                      ? isPaidActive && !isPaused
                        ? "En Vente 24h/24"
                        : isPaused
                          ? "Mode Pause (Manuel)"
                          : "Ligne Connectée (Mode Découverte)"
                      : "Ligne Non Connectée"}
                  </span>
                </span>
                <h3 className="text-base sm:text-lg md:text-xl font-black text-white uppercase tracking-tight">
                  Ligne WhatsApp de Vente
                </h3>
              </div>

              <p className="text-xs text-white/60 font-medium mt-1 break-words">
                Numéro associé : <strong className="font-bold font-mono text-white">
                  {formatDisplayPhone(activeNumber, merchant?.country || "CI") || "Non configuré"}
                </strong>
                {isConnectedLive ? (
                  <span className="block text-[11px] text-vendeur-emerald font-semibold mt-0.5">
                    ✅ Votre Vendeur IA intercepte et répond aux messages envoyés à ce numéro.
                  </span>
                ) : (
                  <span className="block text-[11px] text-white/40 mt-0.5">
                    Liez votre numéro ci-dessous pour que l'IA commence à répondre à vos clients.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0 pt-1 lg:pt-0">
            {isConnectedLive && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="flex-1 sm:flex-none h-11 min-h-[44px] px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isDisconnecting ? <Loader2 size={14} className="animate-spin shrink-0" /> : <LogOut size={14} className="shrink-0" />}
                <span>Déconnecter</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate("/dashboard?test_ia=true")}
              className="flex-1 sm:flex-none h-11 min-h-[44px] px-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <AssistantIcon size={15} color="#10B981" />
              <span>Simulateur IA</span>
            </button>
          </div>
        </div>

        {/* 2. Onglets de Connexion & Jumelage */}
        {!isConnectedLive ? (
          <div className="space-y-5 pt-2">
            {/* Tab Selector (Ergonomique Mobile-First) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/60 border border-white/10 rounded-2xl w-full">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("pairing_code");
                  if (!pairingCode) handleRequestPairingCode();
                }}
                className={cn(
                  "min-h-[46px] sm:min-h-[48px] px-2.5 sm:px-4 rounded-xl font-black uppercase tracking-wider text-[11px] sm:text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer text-center",
                  activeTab === "pairing_code"
                    ? "bg-vendeur-emerald text-vendeur-coal shadow-lg shadow-emerald-500/20 font-black"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <Smartphone size={15} className="shrink-0" />
                <span className="truncate">Code Mobile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("qr_code");
                  if (!qrCodeData) handleRequestQrCode();
                }}
                className={cn(
                  "min-h-[46px] sm:min-h-[48px] px-2.5 sm:px-4 rounded-xl font-black uppercase tracking-wider text-[11px] sm:text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer text-center",
                  activeTab === "qr_code"
                    ? "bg-vendeur-emerald text-vendeur-coal shadow-lg shadow-emerald-500/20 font-black"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <QrCode size={15} className="shrink-0" />
                <span className="truncate">Scanner QR</span>
              </button>
            </div>

            {/* CONTENU TAB 1 : CODE DE JUMELAGE MOBILE (100% Facile) */}
            {activeTab === "pairing_code" && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-300">
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
                        Lier votre numéro WhatsApp en 5 secondes
                      </h4>
                      <p className="text-xs text-white/50 font-medium mt-0.5">
                        Aucun deuxième écran requis. Générez le code et collez-le directement dans WhatsApp.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRequestPairingCode}
                      disabled={isRequestingPairing}
                      className="h-11 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isRequestingPairing ? <Loader2 size={14} className="animate-spin shrink-0" /> : <RefreshCw size={14} className="shrink-0" />}
                      <span>{pairingCode ? "Régénérer le Code" : "Obtenir le Code"}</span>
                    </button>
                  </div>

                  {/* Modification du numéro si besoin */}
                  <div className="flex items-center justify-between gap-2 border-t border-b border-white/5 py-3">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-vendeur-emerald shrink-0" />
                      <span className="text-xs font-mono font-bold text-white">
                        {storeWhatsApp || activeNumber || "Aucun numéro"}
                      </span>
                    </div>
                    {!isEditingPhone ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingPhone(true)}
                        className="text-[11px] font-black uppercase text-vendeur-emerald hover:underline cursor-pointer"
                      >
                        Modifier le numéro
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="tel"
                          value={storeWhatsApp}
                          onChange={(e) => setStoreWhatsApp(e.target.value)}
                          className="h-9 px-2 bg-black/50 border border-white/20 rounded-lg text-xs font-mono text-white"
                        />
                        <button
                          type="button"
                          onClick={handleUpdatePhone}
                          disabled={savingPhone}
                          className="h-9 px-3 bg-vendeur-emerald text-vendeur-coal font-bold text-xs rounded-lg cursor-pointer"
                        >
                          {savingPhone ? "..." : "OK"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Affichage du Code de Jumelage */}
                  {pairingCode ? (
                    <div className="space-y-4 pt-2">
                      <div className="p-4 sm:p-6 rounded-2xl bg-black/60 border border-vendeur-emerald/30 text-center space-y-2 shadow-inner">
                        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                          {timeLeft <= 0 ? (
                            <span className="text-amber-400 font-black">⚠️ Code expiré</span>
                          ) : (
                            <span className="text-vendeur-emerald flex items-center gap-1">
                              <Clock size={11} />
                              <span>Expire dans {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</span>
                            </span>
                          )}
                        </div>

                        <div className={cn(
                          "text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-widest text-white select-all transition-opacity",
                          timeLeft <= 0 && "opacity-40 line-through"
                        )}>
                          {pairingCode}
                        </div>
                      </div>

                      {/* Gros bouton d'action tactile (56px) : Copier OU Régénérer si expiré */}
                      {timeLeft <= 0 ? (
                        <button
                          type="button"
                          onClick={handleRequestPairingCode}
                          disabled={isRequestingPairing}
                          className="w-full min-h-[56px] py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-vendeur-coal font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-[0.98]"
                        >
                          {isRequestingPairing ? <Loader2 size={18} className="animate-spin shrink-0" /> : <RefreshCw size={18} className="shrink-0" />}
                          <span>Générer un nouveau code</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCopyCodeAndOpenWhatsApp}
                          className="w-full min-h-[56px] py-3.5 px-6 rounded-2xl bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-vendeur-emerald/20 transition-all cursor-pointer active:scale-[0.98]"
                        >
                          {copiedCode ? <Check size={18} className="shrink-0" /> : <Copy size={18} className="shrink-0" />}
                          <span>{copiedCode ? "Code Copié ! Ouverture de WhatsApp..." : "Copier le code & Ouvrir WhatsApp"}</span>
                        </button>
                      )}

                      {/* Instructions pas à pas */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
                        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                          <span className="text-[10px] font-black text-vendeur-emerald uppercase tracking-widest">Étape 1</span>
                          <p className="text-xs text-white/80 font-medium leading-snug">
                            Ouvrez WhatsApp sur votre smartphone.
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                          <span className="text-[10px] font-black text-vendeur-emerald uppercase tracking-widest">Étape 2</span>
                          <p className="text-xs text-white/80 font-medium leading-snug">
                            Allez dans <strong>Réglages / Menu</strong> &gt; <strong>Appareils connectés</strong>.
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                          <span className="text-[10px] font-black text-vendeur-emerald uppercase tracking-widest">Étape 3</span>
                          <p className="text-xs text-white/80 font-medium leading-snug">
                            Appuyez sur <strong>Lier avec un numéro</strong> et collez le code.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-3">
                      <p className="text-xs text-white/60">
                        Numéro de vente : <strong className="text-white font-mono">{activeNumber || "Veuillez renseigner votre numéro"}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={handleRequestPairingCode}
                        disabled={isRequestingPairing}
                        className="min-h-[52px] px-6 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs inline-flex items-center justify-center gap-2 shadow-md hover:bg-emerald-400 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isRequestingPairing ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Smartphone size={16} className="shrink-0" />}
                        <span>Générer mon Code de Jumelage</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CONTENU TAB 2 : SCANNER UN QR CODE (WhatsApp Web) */}
            {activeTab === "qr_code" && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-300">
                <div className="p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center text-center space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
                      Scanner le QR Code avec WhatsApp
                    </h4>
                    <p className="text-xs text-white/50 font-medium">
                      Ouvrez WhatsApp sur votre téléphone &gt; <strong>Appareils connectés</strong> &gt; <strong>Lier un appareil</strong>.
                    </p>
                  </div>

                  {qrCodeData ? (
                    <div className="p-4 bg-white rounded-2xl shadow-2xl">
                      <QRCodeSVG value={qrCodeData} size={220} level="M" />
                    </div>
                  ) : (
                    <div className="h-[220px] w-[220px] rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center gap-3 p-4">
                      {isRequestingQr ? (
                        <>
                          <Loader2 size={28} className="text-vendeur-emerald animate-spin shrink-0" />
                          <span className="text-xs text-white/60">Génération du QR Code...</span>
                        </>
                      ) : (
                        <>
                          <QrCode size={32} className="text-white/30" />
                          <span className="text-xs text-white/40">En attente du flux WhatsApp</span>
                        </>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleRequestQrCode}
                    disabled={isRequestingQr}
                    className="h-11 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isRequestingQr ? <Loader2 size={14} className="animate-spin shrink-0" /> : <RefreshCw size={14} className="shrink-0" />}
                    <span>Actualiser le QR Code</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Statut Connecté avec succès */
          <div className="p-4 sm:p-5 rounded-2xl bg-vendeur-emerald/5 border border-vendeur-emerald/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-vendeur-emerald/20 text-vendeur-emerald flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white tracking-tight">Ligne WhatsApp Live Active</h4>
                <p className="text-xs text-white/60">
                  Votre Vendeur IA répond aux messages entrants sur votre numéro en temps réel.
                </p>
              </div>
            </div>

            {isDiscoveryMode && (
              <button
                type="button"
                onClick={() => navigate("/offers")}
                className="h-12 px-5 rounded-xl bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-md active:scale-95"
              >
                <Zap size={15} fill="currentColor" className="shrink-0" />
                <span>Activer mon Forfait pour les Ventes</span>
              </button>
            )}
          </div>
        )}

        {/* 3. Section Meta Cloud API Développeur (Collapsible Mobile-Optimized) */}
        <div className="border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvancedMeta(!showAdvancedMeta)}
            className={cn(
              "flex items-center justify-between w-full text-left p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer",
              showAdvancedMeta
                ? "bg-black/60 border-white/15 shadow-inner"
                : "bg-white/[0.02] hover:bg-white/[0.04] border-white/5 hover:border-white/10"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Settings2 size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-black text-white tracking-tight">
                    Option Entreprise
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-blue-500/15 border border-blue-500/30 text-[9px] font-black text-blue-300 uppercase tracking-wider">
                    Meta Cloud
                  </span>
                </div>
                <p className="text-[11px] text-white/40 truncate mt-0.5">
                  WhatsApp Business Cloud API (Optionnel)
                </p>
              </div>
            </div>

            <div className={cn(
              "h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center text-white/50 transition-transform duration-200 shrink-0 ml-2",
              showAdvancedMeta && "rotate-180 text-white bg-white/10"
            )}>
              <ChevronDown size={14} />
            </div>
          </button>

          {showAdvancedMeta && (
            <div className="space-y-4 p-3.5 sm:p-5 mt-2 bg-black/40 border border-white/10 rounded-2xl animate-in fade-in duration-300 w-full max-w-full box-border">
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-[11px] text-blue-300/80 leading-relaxed">
                ℹ️ Réservé aux comptes vérifiés sur <strong>Meta Business Suite</strong> avec un accès WhatsApp Cloud API officiel.
              </div>

              {/* Bouton d'activation 1-Click Ligne Officielle Système */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white">Ligne Système Vendeur IA</p>
                  <p className="text-[10px] text-white/40 font-mono">+225 05 05 11 11 57 (Meta PhoneID: 1283754474826620)</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setSavingMeta(true);
                    try {
                      await apiClient.patch("/api/whatsapp/config", {
                        provider: "meta",
                        whatsappNumber: "+2250505111157"
                      });
                      toast.success("Ligne Officielle Meta Cloud activée ! 🚀");
                      await Promise.all([
                        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
                        queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] }),
                        queryClient.invalidateQueries({ queryKey: ["merchant"] })
                      ]);
                      await refetch();
                    } catch (err: any) {
                      toast.error(err.response?.data?.error || "Erreur lors de l'activation Meta.");
                    } finally {
                      setSavingMeta(false);
                    }
                  }}
                  disabled={savingMeta}
                  className="h-10 px-3.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 font-bold uppercase tracking-wider text-[10px] sm:text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {savingMeta ? <Loader2 size={13} className="animate-spin shrink-0" /> : <Zap size={13} fill="currentColor" className="shrink-0" />}
                  <span>Activer la Ligne Officielle</span>
                </button>
              </div>

              {/* Formulaire Clés Personnalisées */}
              <div className="space-y-3 pt-1">
                <p className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
                  Ou saisissez vos propres clés Meta :
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <div className="space-y-1 min-w-0">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-0.5">
                      Phone Number ID
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 1283754474826620"
                      value={metaForm.phoneNumberId}
                      onChange={(e) => setMetaForm({ ...metaForm, phoneNumberId: e.target.value })}
                      className="w-full h-11 sm:h-12 bg-black/60 border border-white/10 rounded-xl px-3.5 text-xs sm:text-sm font-mono text-white placeholder:text-white/20 focus:border-vendeur-emerald outline-none transition-all box-border"
                    />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-0.5">
                      WABA ID
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 2049583920194"
                      value={metaForm.wabaId}
                      onChange={(e) => setMetaForm({ ...metaForm, wabaId: e.target.value })}
                      className="w-full h-11 sm:h-12 bg-black/60 border border-white/10 rounded-xl px-3.5 text-xs sm:text-sm font-mono text-white placeholder:text-white/20 focus:border-vendeur-emerald outline-none transition-all box-border"
                    />
                  </div>
                </div>

                <div className="space-y-1 min-w-0">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-0.5">
                    Access Token Permanent (EAAG...)
                  </label>
                  <textarea
                    placeholder="Collez votre jeton d'accès Meta (EAAG...)"
                    value={metaForm.accessToken}
                    onChange={(e) => setMetaForm({ ...metaForm, accessToken: e.target.value })}
                    className="w-full h-20 sm:h-24 bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-mono text-white placeholder:text-white/20 focus:border-vendeur-emerald outline-none transition-all resize-none box-border"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveMetaConfig}
                  disabled={savingMeta}
                  className="w-full sm:w-auto min-h-[48px] px-6 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-400 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {savingMeta ? <Loader2 className="animate-spin shrink-0" size={16} /> : <Check size={16} className="shrink-0" />}
                  <span>Enregistrer mes clés Meta</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <StepMilestoneModal
        isOpen={showMilestoneModal}
        onClose={() => setShowMilestoneModal(false)}
        title="Ligne WhatsApp Connectée ! 🎉"
        subtitle="Votre WhatsApp de vente est désormais relié à votre Vendeur IA. Vos clients reçoivent des réponses automatiques en direct."
        score={dashboard?.setupStatus?.score || 60}
        primaryAction={{
          label: (dashboard?.products?.length || 0) > 0 ? "Tester dans le Simulateur" : "Ajouter mes Articles & Prix",
          sublabel: (dashboard?.products?.length || 0) > 0 ? "Vérifiez les réponses de l'IA" : "Créez votre catalogue de vente",
          href: (dashboard?.products?.length || 0) > 0 ? "/dashboard?test_ia=true" : "/products"
        }}
        secondaryAction={{
          label: "Voir mon Tableau de Bord",
          href: "/dashboard"
        }}
        dashboardActionLabel="Retour au Tableau de Bord"
        autoRedirectSeconds={7}
        autoRedirectTo="/dashboard"
      />
    </div>
  );
}

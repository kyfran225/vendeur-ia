import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Smartphone,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Logo } from "@/components/ui/Logo";
import { AssistantIcon } from "@/components/ui/AssistantIcon";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import {
  CountrySelector,
  Country,
  parsePhoneNumber,
  formatDisplayPhone
} from "@/features/onboarding/components/CountrySelector";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Simple Google Icon SVG
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const GoogleLoginButton = ({
  onSuccess,
  onLoading,
  disabled
}: {
  onSuccess: (session: any) => void;
  onLoading: (loading: boolean) => void;
  disabled: boolean;
}) => {
  const { setSession } = useAuthStore();
  const [internalLoading, setInternalLoading] = useState(false);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      onLoading(true);
      setInternalLoading(true);
      try {
        const res = await apiClient.post("/api/auth/google", {
          token: tokenResponse.access_token
        });
        setSession(res.data);
        onSuccess(res.data);
      } catch (err: any) {
        console.error("Google Auth Error:", err);
        toast.error(err.response?.data?.error || "Erreur d'authentification Google");
      } finally {
        onLoading(false);
        setInternalLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google Login Failed:", error);
      toast.error("Échec de la connexion Google");
      onLoading(false);
      setInternalLoading(false);
    }
  });

  return (
    <button
      type="button"
      disabled={disabled || internalLoading}
      onClick={() => loginWithGoogle()}
      className="w-full h-13 min-h-[52px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 font-bold text-xs sm:text-sm cursor-pointer shadow-sm shrink-0"
    >
      {internalLoading ? <Loader2 className="animate-spin shrink-0" size={18} /> : <GoogleIcon />}
      <span>Continuer avec Google</span>
    </button>
  );
};

export function AuthSheet({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: (sessionData: any) => void }) {
  const [authMethod, setAuthMethod] = useState<"whatsapp" | "email">("whatsapp");
  const [whatsappStep, setWhatsappStep] = useState<"input" | "pairing" | "otp" | "founder">("input");
  const [pairTab, setPairTab] = useState<"code" | "qr">("code");
  const [pairingCode, setPairingCode] = useState<string>("");
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [authSessionId, setAuthSessionId] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [copied, setCopied] = useState<boolean>(false);
  const [isConnectingLive, setIsConnectingLive] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // OTP State for returning users
  const [otpValue, setOtpValue] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Founder State for System / Meta number
  const [founderPin, setFounderPin] = useState("");
  const [isLoggingFounder, setIsLoggingFounder] = useState(false);
  const [showFounderPin, setShowFounderPin] = useState(false);

  // Email form mode
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { setSession } = useAuthStore();
  const { tempData } = useOnboardingStore();
  const navigate = useNavigate();

  // WhatsApp form pre-filled from landing page if available
  const initialParsed = parsePhoneNumber(tempData?.whatsappNumber || "", tempData?.country || "CI");
  const [selectedCountry, setSelectedCountry] = useState<Country>(initialParsed.country);
  const [localPhone, setLocalPhone] = useState(initialParsed.local);

  // Track single execution of auth completion to prevent duplicate toasts & executions
  const isAuthCompletedRef = useRef(false);
  const authSessionIdRef = useRef(authSessionId);
  useEffect(() => {
    authSessionIdRef.current = authSessionId;
  }, [authSessionId]);

  useEffect(() => {
    if (isOpen) {
      isAuthCompletedRef.current = false;
    }
  }, [isOpen, whatsappStep]);

  // Sync phone & auto-initiate WhatsApp pairing code if opened with pre-filled form
  const autoInitiatedRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      autoInitiatedRef.current = false;
      return;
    }

    if (isOpen && tempData?.whatsappNumber) {
      const p = parsePhoneNumber(tempData.whatsappNumber, tempData?.country || "CI");
      setSelectedCountry(p.country);
      setLocalPhone(p.local);

      // If user filled the store form before clicking create, launch pairing code immediately
      if (tempData?.businessName && !autoInitiatedRef.current && whatsappStep === "input") {
        autoInitiatedRef.current = true;
        const cleanNumber = p.local.replace(/\D/g, "");
        if (cleanNumber.length >= 6) {
          const fullPhoneNumber = p.e164 || `${p.country.dialCode}${cleanNumber}`;
          setLoading(true);
          apiClient.post("/api/auth/whatsapp-init", {
            phoneNumber: fullPhoneNumber,
            storeData: tempData || undefined,
            authSessionId: authSessionId || undefined
          }).then((res) => {
            if (res.data?.authSessionId) {
              setAuthSessionId(res.data.authSessionId);
            }
            if (res.data?.mode === "founder_auth" || res.data?.isFounder) {
              setWhatsappStep("founder");
              toast.info("Numéro Système / Fondateur détecté.");
            } else if (res.data?.mode === "otp") {
              setWhatsappStep("otp");
              toast.info("Un code à 6 chiffres a été envoyé sur votre WhatsApp.");
            } else {
              setPairingCode(res.data?.pairingCode || "");
              if (res.data?.qr) setQrCodeData(res.data.qr);
              setTimeLeft(60);
              setWhatsappStep("pairing");
              setIsConnectingLive(false);
            }
          }).catch((err) => {
            console.warn("[AuthSheet] Auto-initiate WhatsApp failed:", err);
          }).finally(() => {
            setLoading(false);
          });
        }
      }
    }
  }, [isOpen, tempData, whatsappStep, authSessionId]);

  // Timer countdown for pairing code expiration
  useEffect(() => {
    if (whatsappStep !== "pairing" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [whatsappStep, timeLeft]);

  const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

  // Complete login helper
  const completeAuth = useCallback(
    async (sessionData: any) => {
      if (isAuthCompletedRef.current) return;
      isAuthCompletedRef.current = true;

      setSession(sessionData);
      toast.custom(
        () => (
          <div className="flex items-center gap-3 bg-[#0b1410] border border-vendeur-emerald/40 text-white p-3.5 sm:p-4 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.25)] min-w-[300px] animate-in slide-in-from-top-2 duration-300">
            <div className="h-9 w-9 rounded-xl bg-vendeur-emerald/15 border border-vendeur-emerald/30 flex items-center justify-center shrink-0">
              <AssistantIcon size={22} color="#10B981" withBackground={false} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-vendeur-emerald tracking-wider">Vendeur IA</span>
                <span className="text-white/40 text-[10px]">·</span>
                <span className="text-[10px] text-white/50 font-bold uppercase">Connecté</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
                WhatsApp appairé avec succès ! 🎉
              </p>
            </div>
          </div>
        ),
        { id: "auth-toast", duration: 3500 }
      );
      onClose();

      // Custom callback if provided
      if (onSuccess) {
        onSuccess(sessionData);
        return;
      }

      // If user logged in while on checkout page, remain on checkout page to complete payment
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/checkout")) {
        return;
      }

      const loggedUser = sessionData?.user;
      const isFounderUser = 
        loggedUser?.roles?.includes("admin") || 
        loggedUser?.roles?.includes("creator") || 
        (loggedUser?.whatsappNumber && (loggedUser.whatsappNumber.includes("5111157") || loggedUser.whatsappNumber.includes("0505111157"))) ||
        loggedUser?.email?.includes("kyfran") ||
        loggedUser?.email?.includes("franck");

      if (isFounderUser) {
        useAuthStore.getState().updateUser({ onboardingCompleted: true });
        navigate("/admin");
        return;
      }

      // 0. Returning merchant (already completed onboarding previously): GO DIRECTLY TO DASHBOARD!
      if (sessionData?.user?.onboardingCompleted) {
        useAuthStore.getState().updateUser({ onboardingCompleted: true });
        navigate("/dashboard");
        return;
      }

      // 1. Auto-initialize merchant from landing demo form if already filled
      if (tempData?.businessName) {
        try {
          await apiClient.post("/api/commerce/merchant", {
            ...tempData,
            city: tempData.city || "",
            onboardingCompleted: true
          });
          useAuthStore.getState().updateUser({ onboardingCompleted: true });
        } catch (e) {
          console.warn("[Auth] Auto-merchant init:", e);
        }
        navigate("/dashboard");
        return;
      }

      // 2. Check if merchant profile already exists and is configured in DB
      try {
        const res = await apiClient.get("/api/commerce/merchant");
        if (res.data && res.data.businessName && res.data.businessName !== "Votre boutique" && res.data.onboardingCompleted) {
          useAuthStore.getState().updateUser({ onboardingCompleted: true });
          navigate("/dashboard");
          return;
        }
      } catch {
        // New user without merchant profile yet
      }

      // 3. User authenticated via WhatsApp/email but hasn't configured store yet:
      // Stay on landing page form so they can configure their store name & details!
      useAuthStore.getState().updateUser({ onboardingCompleted: false });
      navigate("/");
    },
    [setSession, onClose, navigate, tempData]
  );

  // Real-time socket & polling listener during pairing / OTP
  useEffect(() => {
    if ((whatsappStep !== "pairing" && whatsappStep !== "otp") || !localPhone) return;

    const fullPhoneNumber = `${selectedCountry.dialCode}${localPhone}`.replace(/\D/g, "");
    const localCleanNumber = localPhone.replace(/\D/g, "");

    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin.replace("5173", "3001");
    const socket = io(socketUrl, {
      reconnection: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 1000
    });

    const joinRooms = () => {
      socket.emit("join_auth", fullPhoneNumber);
      socket.emit("join_auth", localCleanNumber);
      if (authSessionIdRef.current) {
        socket.emit("join_auth", authSessionIdRef.current);
        socket.emit("join_session", authSessionIdRef.current);
      }
    };

    socket.on("connect", joinRooms);
    joinRooms();

    socket.on("whatsapp:connecting", () => {
      setIsConnectingLive(true);
    });

    socket.on("whatsapp:qr", (data) => {
      if (data?.qr) {
        setQrCodeData(data.qr);
      }
    });

    socket.on("whatsapp:pairing_code", (data) => {
      if (data?.code) {
        setPairingCode(data.code);
      }
    });

    socket.on("auth:success", (sessionData) => {
      if (isAuthCompletedRef.current) return;
      isCancelled = true;
      completeAuth(sessionData);
    });

    // Resilient HTTP Polling every 1.2s
    let isCancelled = false;
    const checkAuth = async () => {
      if (isCancelled || isAuthCompletedRef.current) return;
      try {
        const res = await apiClient.post("/api/auth/poll-status", {
          authSessionId: authSessionIdRef.current || undefined,
          phoneNumber: fullPhoneNumber
        });
        if (res.data && res.data.status === "authenticated" && res.data.sessionData) {
          if (isAuthCompletedRef.current) return;
          isCancelled = true;
          completeAuth(res.data.sessionData);
        }
      } catch {
        // Silent polling
      }
    };

    checkAuth();
    const pollInterval = setInterval(checkAuth, 1200);

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        checkAuth();
        joinRooms();
      }
    };
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("focus", handleFocus);

    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("focus", handleFocus);
      socket.disconnect();
    };
  }, [whatsappStep, localPhone, selectedCountry, completeAuth]);

  // Request Pairing Code / OTP / Founder initiation
  const handleInitiateWhatsApp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanNumber = localPhone.replace(/\D/g, "");
    if (!cleanNumber || cleanNumber.length < 6) {
      toast.error("Veuillez saisir votre numéro WhatsApp.");
      return;
    }

    const parsed = parsePhoneNumber(`${selectedCountry.dialCode}${cleanNumber}`, selectedCountry.code);
    const fullPhoneNumber = parsed.e164 || `${selectedCountry.dialCode}${cleanNumber}`;

    setLoading(true);
    try {
      const res = await apiClient.post("/api/auth/whatsapp-init", {
        phoneNumber: fullPhoneNumber,
        storeData: tempData || undefined,
        authSessionId: authSessionId || undefined
      });

      if (res.data?.authSessionId) {
        setAuthSessionId(res.data.authSessionId);
      }

      if (res.data?.mode === "founder_auth" || res.data?.isFounder) {
        setWhatsappStep("founder");
        toast.info("Numéro Système / Fondateur détecté.");
      } else if (res.data?.mode === "otp") {
        setWhatsappStep("otp");
        toast.info("Un code à 6 chiffres a été envoyé sur votre WhatsApp.");
      } else {
        setPairingCode(res.data?.pairingCode || "");
        if (res.data?.qr) setQrCodeData(res.data.qr);
        setTimeLeft(60);
        setWhatsappStep("pairing");
        setIsConnectingLive(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de l'initialisation de l'appairage WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  // Founder Direct Login (Meta Cloud API / No WhatsApp scan required)
  const handleFounderLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!founderPin.trim()) {
      toast.error("Veuillez saisir votre code PIN ou mot de passe.");
      return;
    }
    const cleanNumber = localPhone.replace(/\D/g, "");
    const parsed = parsePhoneNumber(`${selectedCountry.dialCode}${cleanNumber}`, selectedCountry.code);
    const fullPhoneNumber = parsed.e164 || `${selectedCountry.dialCode}${cleanNumber}`;

    setIsLoggingFounder(true);
    try {
      const res = await apiClient.post("/api/auth/founder-login", {
        phoneNumber: fullPhoneNumber,
        pinOrPassword: founderPin.trim(),
        authSessionId: authSessionId || undefined
      });
      await completeAuth(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Code PIN ou mot de passe Administrateur incorrect.");
    } finally {
      setIsLoggingFounder(false);
    }
  };

  // Regenerate Pairing Code
  const handleRegenerateCode = async () => {
    const cleanNumber = localPhone.replace(/\D/g, "");
    const parsed = parsePhoneNumber(`${selectedCountry.dialCode}${cleanNumber}`, selectedCountry.code);
    const fullPhoneNumber = parsed.e164 || `${selectedCountry.dialCode}${cleanNumber}`;

    setIsRegenerating(true);
    try {
      const res = await apiClient.post("/api/auth/whatsapp-regenerate-pairing", {
        phoneNumber: fullPhoneNumber,
        storeData: tempData || undefined,
        authSessionId: authSessionId || undefined
      });

      if (res.data?.pairingCode) {
        setPairingCode(res.data.pairingCode);
        if (res.data?.qr) setQrCodeData(res.data.qr);
        setTimeLeft(60);
        setIsConnectingLive(false);
        setWhatsappStep("pairing");
        toast.success("Nouveau code de jumelage généré !");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Impossible de régénérer le code.");
    } finally {
      setIsRegenerating(false);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (!pairingCode) return;
    const cleanCode = pairingCode.replace(/[^A-Za-z0-9]/g, "");
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    toast.success("Code copié dans le presse-papier !");
    setTimeout(() => setCopied(false), 2500);
  };

  // OTP Verification
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpValue.length !== 6) return;

    const fullPhoneNumber = `${selectedCountry.dialCode}${localPhone}`.replace(/\D/g, "");
    setIsVerifyingOtp(true);
    try {
      const res = await apiClient.post("/api/auth/whatsapp-otp-verify", {
        phoneNumber: fullPhoneNumber,
        code: otpValue
      });
      await completeAuth(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Code incorrect ou expiré.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  useEffect(() => {
    if (otpValue.length === 6) {
      handleVerifyOtp();
    }
  }, [otpValue]);

  // Email form state
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: ""
  });

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanForm = {
        ...form,
        email: form.email.trim().toLowerCase(),
        password: form.password
      };

      if (mode === "forgot") {
        await apiClient.post("/api/auth/forgot-password", { email: cleanForm.email });
        toast.success("Lien de réinitialisation envoyé !");
        setMode("login");
        return;
      }

      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await apiClient.post(endpoint, cleanForm);
      await completeAuth(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={cn(
          "relative w-full bg-[#0e1612] border border-white/10 rounded-[1.75rem] p-4 sm:p-6 shadow-2xl overflow-hidden transition-all duration-300",
          whatsappStep === "pairing" ? "max-w-[420px] md:max-w-[680px]" : "max-w-[410px]"
        )}
      >
        {/* Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-vendeur-emerald/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer z-10"
        >
          <X size={15} />
        </button>

        {/* HEADER (For Input & Email modes, or compact for Pairing) */}
        {whatsappStep !== "pairing" && (
          <div className="text-center space-y-1 mb-4">
            <div className="inline-flex p-2 rounded-xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-vendeur-emerald mb-0.5">
              <Logo size={22} />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
              {authMethod === "whatsapp"
                ? whatsappStep === "founder"
                  ? "Accès Fondateur & Système"
                  : whatsappStep === "otp"
                  ? "Code de Sécurité WhatsApp"
                  : "Accès Commerçant"
                : mode === "login"
                ? "Connexion Équipe"
                : mode === "register"
                ? "Nouveau Compte"
                : "Mot de passe"}
            </h2>
            <p className="text-[11px] text-white/50 max-w-xs mx-auto leading-tight">
              {authMethod === "whatsapp"
                ? whatsappStep === "founder"
                  ? "Numéro système configuré sur l'API Meta Cloud."
                  : whatsappStep === "otp"
                  ? "Saisissez le code de sécurité reçu sur votre WhatsApp."
                  : "Activez votre commercial IA sur WhatsApp en quelques secondes."
                : "Espace d'accès par email pour l'équipe."}
            </p>
          </div>
        )}

        {/* WHATSAPP FLOW */}
        {authMethod === "whatsapp" && (
          <>
            {/* STEP 1: PHONE INPUT */}
            {whatsappStep === "input" && (
              loading && tempData?.businessName ? (
                <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-vendeur-emerald/15 border border-vendeur-emerald/30 flex items-center justify-center text-vendeur-emerald shadow-lg">
                    <Loader2 className="animate-spin" size={24} />
                  </div>
                  <p className="text-xs font-black uppercase text-white tracking-widest">
                    Génération du code WhatsApp...
                  </p>
                  <p className="text-[11px] text-white/50 max-w-xs">
                    Préparation de l'appairage direct pour <strong className="text-emerald-400">{tempData.businessName}</strong>
                  </p>
                </div>
              ) : (
              <form onSubmit={handleInitiateWhatsApp} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">
                    Votre Numéro WhatsApp
                  </label>
                  <div className="flex gap-2 items-center w-full">
                    <CountrySelector
                      selected={selectedCountry}
                      onSelect={(c) => setSelectedCountry(c)}
                      dropdownPosition="top"
                      className="h-12 !rounded-xl px-3"
                    />
                    <div className="relative flex-1 min-w-0">
                      <input
                        required
                        type="tel"
                        inputMode="tel"
                        className="w-full h-12 bg-black/50 border border-white/10 focus:border-vendeur-emerald rounded-xl px-3.5 text-white font-mono text-sm placeholder:text-white/20 outline-none transition-all shadow-inner"
                        placeholder="07 00 00 00 00"
                        value={localPhone}
                        onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ""))}
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-vendeur-emerald/25 cursor-pointer mt-1"
                >
                  {loading ? (
                    <Loader2 className="animate-spin shrink-0" size={16} />
                  ) : (
                    <>
                      <WhatsAppIcon size={16} className="shrink-0" />
                      <span>Continuer avec WhatsApp</span>
                      <ChevronRight size={15} className="shrink-0" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/40 pt-0.5">
                  <ShieldCheck size={13} className="text-vendeur-emerald shrink-0" />
                  <span>Appairage direct 100% sécurisé</span>
                </div>

                {/* Google Social Login */}
                {GOOGLE_CLIENT_ID && (
                  <div className="pt-1.5 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-white/5" />
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">ou</span>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <GoogleLoginButton
                      onSuccess={onClose}
                      onLoading={setGoogleLoading}
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Discrete Email Fallback Link */}
                <div className="pt-1 text-center border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setAuthMethod("email")}
                    className="text-[10px] text-white/35 hover:text-white/70 transition-colors font-medium cursor-pointer"
                  >
                    Connexion par Email / Mot de passe →
                  </button>
                </div>
              </form>
            )
          )}

            {/* STEP 2: PAIRING VIEW (RESPONSIVE 2-COLUMNS ON DESKTOP, LARGE QR ON MOBILE) */}
            {whatsappStep === "pairing" && (
              <div className="animate-in zoom-in-95 duration-200">
                <div className="md:grid md:grid-cols-12 md:gap-6 md:items-center">
                  {/* LEFT COLUMN: Controls & Instructions */}
                  <div className="md:col-span-6 space-y-3 text-left">
                    {/* Header */}
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-vendeur-emerald text-[11px] font-black uppercase tracking-wider">
                        <WhatsAppIcon size={14} />
                        <span>Connexion Boutique</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase">
                        Lier votre WhatsApp
                      </h2>
                      <p className="text-[11px] text-white/50 leading-snug">
                        Numéro : <strong className="text-white font-mono">{formatDisplayPhone(`${selectedCountry.dialCode}${localPhone}`, selectedCountry.code)}</strong>
                      </p>
                    </div>

                    {/* Method Switcher Tabs */}
                    <div className="grid grid-cols-2 gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setPairTab("qr")}
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                          pairTab === "qr"
                            ? "bg-vendeur-emerald text-vendeur-coal shadow-md font-black"
                            : "text-white/50 hover:text-white"
                        )}
                      >
                        <QrCode size={13} />
                        <span>Scanner QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPairTab("code")}
                        className={cn(
                          "py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                          pairTab === "code"
                            ? "bg-vendeur-emerald text-vendeur-coal shadow-md font-black"
                            : "text-white/50 hover:text-white"
                        )}
                      >
                        <Smartphone size={13} />
                        <span>Code à 8 chiffres</span>
                      </button>
                    </div>

                    {/* Instructions Box */}
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-xs space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                        {pairTab === "qr" ? "3 étapes pour scanner :" : "3 étapes pour lier :"}
                      </p>
                      <div className="space-y-1.5 text-white/80 text-[11px] leading-tight">
                        <div className="flex items-start gap-2">
                          <span className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                            1
                          </span>
                          <span>Ouvrez WhatsApp sur votre téléphone.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                            2
                          </span>
                          <span>Allez dans <strong>Paramètres</strong> &gt; <strong>Appareils connectés</strong> &gt; <strong>Lier un appareil</strong>.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                            3
                          </span>
                          <span>
                            {pairTab === "qr"
                              ? "Scannez le QR Code affiché à l'écran."
                              : "Cliquez sur « Lier avec un numéro » et collez le code."}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expiration and Regenerate for Mobile/Left */}
                    <div className="flex items-center justify-between px-1 text-xs">
                      {timeLeft > 0 ? (
                        <span className="text-[10px] font-mono text-white/40">
                          Expire dans : <strong className="text-white">{timeLeft}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRegenerateCode}
                          disabled={isRegenerating}
                          className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw size={12} className={isRegenerating ? "animate-spin" : ""} />
                          <span>Régénérer le code</span>
                        </button>
                      )}

                      {/* Live Indicator */}
                      <div className="flex items-center gap-1.5 text-[10px] text-white/50">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            isConnectingLive ? "bg-emerald-400 animate-ping" : "bg-emerald-500/70 animate-pulse"
                          )}
                        />
                        <span className="truncate max-w-[130px]">
                          {isConnectingLive ? "Connexion... 🚀" : "En attente WhatsApp"}
                        </span>
                      </div>
                    </div>

                    {/* Back link */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setWhatsappStep("input");
                          setPairingCode("");
                        }}
                        className="text-[11px] text-white/40 hover:text-white transition-colors font-medium cursor-pointer"
                      >
                        ← Changer de numéro
                      </button>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Big Visual Stage (QR Code or 8-Digit Code) */}
                  <div className="md:col-span-6 mt-4 md:mt-0 flex flex-col items-center justify-center">
                    {pairTab === "qr" ? (
                      /* Big, Crisp, Easy-to-Scan QR Code Card */
                      <div className="w-full bg-black/60 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 text-center relative overflow-hidden shadow-2xl flex flex-col items-center justify-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-1.5">
                          <QrCode size={13} />
                          <span>Scannez avec WhatsApp</span>
                        </div>

                        <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/20 inline-block transition-transform hover:scale-[1.02]">
                          {qrCodeData ? (
                            <QRCodeSVG
                              value={qrCodeData}
                              size={window.innerWidth < 640 ? 190 : 210}
                              level="M"
                              className="mx-auto"
                            />
                          ) : (
                            <div className="w-[190px] h-[190px] sm:w-[210px] sm:h-[210px] flex flex-col items-center justify-center gap-2 text-black/60">
                              <Loader2 className="animate-spin text-vendeur-emerald" size={32} />
                              <span className="text-xs font-bold text-black/80">Génération du QR Code...</span>
                            </div>
                          )}
                        </div>

                        <p className="text-[10px] text-white/40 mt-3 max-w-[200px] leading-tight">
                          Pointez l'appareil photo WhatsApp directement sur le QR Code.
                        </p>
                      </div>
                    ) : (
                      /* 8-Digit Code Big Card */
                      <div className="w-full bg-black/60 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 text-center relative overflow-hidden shadow-2xl flex flex-col items-center justify-center space-y-3.5">
                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                          <Smartphone size={13} />
                          <span>Code de Jumelage</span>
                        </div>

                        <div className="font-mono text-3xl sm:text-4xl font-black text-white tracking-[0.25em] py-1 select-all">
                          {pairingCode || "••••-••••"}
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyCode}
                          className={cn(
                            "w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg",
                            copied
                              ? "bg-emerald-500 text-black font-black shadow-emerald-500/20"
                              : "bg-white/10 hover:bg-white/20 text-white"
                          )}
                        >
                          {copied ? <Check size={15} /> : <Copy size={15} />}
                          <span>{copied ? "Code copié !" : "Copier le code"}</span>
                        </button>

                        <p className="text-[10px] text-white/40 leading-tight">
                          Collez ce code dans <em>« Lier avec un numéro »</em> sur votre WhatsApp.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: RETURNING USER OTP VIEW */}
            {whatsappStep === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10 shadow-inner">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="text-[10px] text-white/40 uppercase font-black tracking-wider leading-none">Code envoyé au numéro</p>
                      <p className="text-xs font-mono font-bold text-white truncate mt-1">
                        {formatDisplayPhone(`${selectedCountry.dialCode}${localPhone}`, selectedCountry.code)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                    WhatsApp Live
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">
                    Code de confirmation (6 chiffres)
                  </label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full h-13 bg-black/50 border border-white/10 focus:border-vendeur-emerald rounded-2xl text-center text-white font-mono text-2xl tracking-[0.35em] placeholder:text-white/20 outline-none transition-all shadow-inner"
                    placeholder="••••••"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpValue.length !== 6}
                  className="w-full h-13 min-h-[52px] bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-vendeur-emerald/25 cursor-pointer"
                >
                  {isVerifyingOtp ? (
                    <Loader2 className="animate-spin shrink-0" size={18} />
                  ) : (
                    <>
                      <span>Confirmer & Accéder</span>
                      <ChevronRight size={16} className="shrink-0" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-white/40 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappStep("input");
                      setOtpValue("");
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    ← Changer de numéro
                  </button>

                  <button
                    type="button"
                    onClick={handleInitiateWhatsApp}
                    className="text-emerald-400 hover:underline transition-colors font-bold cursor-pointer"
                  >
                    Renvoyer le code
                  </button>
                </div>

                <div className="pt-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-2">
                  <p className="text-[11px] text-white/50 leading-tight">
                    Vous souhaitez connecter un autre téléphone ou réinitialiser ?
                  </p>
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <QrCode size={14} />
                    <span>Ré-appairer un appareil (Code / QR)</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: FOUNDER / META CLOUD DIRECT AUTH */}
            {whatsappStep === "founder" && (
              <form onSubmit={handleFounderLogin} className="space-y-4 animate-in zoom-in-95 duration-200">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                    <span>Numéro Système Meta Cloud</span>
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed">
                    Le <strong>{formatDisplayPhone(`${selectedCountry.dialCode}${localPhone}`, selectedCountry.code)}</strong> est géré par l'API Cloud Meta. Aucun scan QR ni code WhatsApp n'est requis.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">
                    Code PIN ou Mot de passe Administrateur
                  </label>
                  <div className="relative">
                    <input
                      required
                      type={showFounderPin ? "text" : "password"}
                      className="w-full h-13 bg-black/50 border border-white/10 focus:border-vendeur-emerald rounded-2xl px-4 pr-12 text-white font-mono text-base placeholder:text-white/20 outline-none transition-all shadow-inner"
                      placeholder="Entrez votre PIN ou mot de passe"
                      value={founderPin}
                      onChange={(e) => setFounderPin(e.target.value)}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowFounderPin(!showFounderPin)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      {showFounderPin ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingFounder || !founderPin.trim()}
                  className="w-full h-13 min-h-[52px] bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-vendeur-emerald/25 cursor-pointer"
                >
                  {isLoggingFounder ? (
                    <Loader2 className="animate-spin shrink-0" size={18} />
                  ) : (
                    <>
                      <ShieldCheck size={16} className="shrink-0" />
                      <span>Accéder à l'Administration</span>
                      <ChevronRight size={16} className="shrink-0" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center text-xs text-white/40 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappStep("input");
                      setFounderPin("");
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    ← Changer de numéro
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* EMAIL FORM (DISCRETE FALLBACK) */}
        {authMethod === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/50 ml-1">
                  Nom Complet
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input
                    required
                    className="w-full h-13 bg-black/50 border border-white/10 focus:border-white rounded-2xl pl-10 pr-3 text-white text-sm outline-none transition-all shadow-inner"
                    placeholder="Jean Dupont"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-white/50 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input
                  required
                  type="email"
                  className="w-full h-13 bg-black/50 border border-white/10 focus:border-white rounded-2xl pl-10 pr-3 text-white text-sm outline-none transition-all shadow-inner"
                  placeholder="admin@vendeur-ia.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/50 ml-1">
                    Mot de passe
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[9px] font-bold text-vendeur-emerald hover:underline cursor-pointer"
                    >
                      Oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    className="w-full h-13 bg-black/50 border border-white/10 focus:border-white rounded-2xl pl-10 pr-10 text-white text-sm outline-none transition-all shadow-inner"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 mt-3 cursor-pointer shadow-lg"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <span>{mode === "login" ? "Se Connecter" : mode === "register" ? "Créer mon compte" : "Envoyer le lien"}</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>

            <div className="pt-2 flex items-center justify-between text-[11px] text-white/40">
              <button
                type="button"
                onClick={() => setAuthMethod("whatsapp")}
                className="text-vendeur-emerald font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                ← Retour à WhatsApp
              </button>

              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                {mode === "login" ? "Créer un compte" : "Se connecter"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


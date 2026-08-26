import React, { useState, useEffect } from "react";
import { X, Mail, Lock, User, ChevronRight, Loader2, ShieldCheck, Sparkles, Phone, ArrowLeft, Eye, EyeOff, QrCode, AlertTriangle, Smartphone, Laptop } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { AssistantIcon } from "@/components/ui/AssistantIcon";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { CountrySelector, COUNTRIES, Country, parsePhoneNumber, formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";
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
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
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
  const navigate = useNavigate();
  const { setSession } = useAuthStore();
  const [internalLoading, setInternalLoading] = useState(false);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      onLoading(true);
      setInternalLoading(true);
      try {
        const res = await apiClient.post("/api/auth/google", {
          token: tokenResponse.access_token,
        });
        setSession(res.data);
        const user = res.data.user;
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
    },
  });

  return (
    <button
      type="button"
      disabled={disabled || internalLoading}
      onClick={() => loginWithGoogle()}
      className="w-full h-14 min-h-[56px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 font-bold text-sm cursor-pointer shadow-sm shrink-0"
    >
      {internalLoading ? <Loader2 className="animate-spin shrink-0" size={18} /> : <GoogleIcon />}
      <span>Continuer avec Google</span>
    </button>
  );
};

export function AuthSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [authMethod, setAuthMethod] = useState<"whatsapp" | "email">("whatsapp");
  const [whatsappStep, setWhatsappStep] = useState<"input" | "waiting">("input");
  const [otpValue, setOtpValue] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
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
  const [whatsappName, setWhatsappName] = useState("");
  const [authSessionId, setAuthSessionId] = useState<string>("");
  const [sessionCode, setSessionCode] = useState<string>("");
  const [systemWhatsAppNumber, setSystemWhatsAppNumber] = useState<string>("22505111157");
  const [isCheckingManual, setIsCheckingManual] = useState(false);
  const [mismatchError, setMismatchError] = useState<string | null>(null);
  const [showMobileQr, setShowMobileQr] = useState(false);

  // Track single execution of auth completion to prevent duplicate toasts & executions
  const isAuthCompletedRef = React.useRef(false);

  useEffect(() => {
    if (isOpen) {
      isAuthCompletedRef.current = false;
    }
  }, [isOpen, whatsappStep]);

  // Sync phone if opened with existing tempData
  useEffect(() => {
    if (isOpen && tempData?.whatsappNumber) {
      const p = parsePhoneNumber(tempData.whatsappNumber, tempData?.country || "CI");
      setSelectedCountry(p.country);
      setLocalPhone(p.local);
    }
  }, [isOpen, tempData?.whatsappNumber, tempData?.country]);

  const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

  // Stable complete login helper — useCallback ensures the socket effect doesn't get a stale closure
  const completeAuth = React.useCallback(async (sessionData: any) => {
    if (isAuthCompletedRef.current) return;
    isAuthCompletedRef.current = true;

    setSession(sessionData);
    toast.custom(
      (t) => (
        <div className="flex items-center gap-3.5 bg-[#0b1410] border border-vendeur-emerald/40 text-white p-4 rounded-2xl shadow-[0_10px_30px_rgba(16,185,129,0.25)] min-w-[320px] animate-in slide-in-from-top-2 duration-300">
          <div className="h-10 w-10 rounded-xl bg-vendeur-emerald/15 border border-vendeur-emerald/30 flex items-center justify-center shrink-0">
            <AssistantIcon size={24} color="#10B981" withBackground={false} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-vendeur-emerald tracking-wider">Vendeur IA</span>
              <span className="text-white/40 text-[10px]">·</span>
              <span className="text-[10px] text-white/50 font-bold uppercase">En Ligne</span>
            </div>
            <p className="text-xs sm:text-sm font-black text-white truncate mt-0.5">
              Connexion réussie ! Bienvenue 🚀
            </p>
          </div>
        </div>
      ),
      { id: "auth-toast", duration: 3500 }
    );
    onClose();

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

    // 2. Check if merchant profile already exists in DB
    try {
      const res = await apiClient.get("/api/commerce/merchant");
      if (res.data && res.data.businessName && res.data.businessName !== "Votre boutique") {
        navigate("/dashboard");
        return;
      }
    } catch {
      // New user without merchant profile yet
    }

    // 3. If brand new user without a configured store: bring them to the Landing Page demo setup form
    if (!sessionData.user?.onboardingCompleted) {
      const userPhone = sessionData.user?.whatsappNumber || "";
      if (userPhone) {
        useOnboardingStore.getState().setTempData({
          ...tempData,
          whatsappNumber: userPhone
        });
      }

      toast.info("Bienvenue ! Renseignez les informations de votre boutique pour initialiser votre Vendeur IA. 🛍️", { id: "onboarding-welcome-toast" });
      const el = document.getElementById("demo-card");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          document.getElementById("business-name-input")?.focus();
        }, 500);
      }
      return;
    }

    navigate("/dashboard");
  }, [setSession, onClose, navigate, tempData]);

  // Use refs so the socket effect and event listeners read latest state without re-creating sockets
  const authSessionIdRef = React.useRef(authSessionId);
  React.useEffect(() => { authSessionIdRef.current = authSessionId; }, [authSessionId]);

  const sessionCodeRef = React.useRef(sessionCode);
  React.useEffect(() => { sessionCodeRef.current = sessionCode; }, [sessionCode]);

  useEffect(() => {
    if (whatsappStep !== "waiting" || !localPhone) return;

    const fullPhoneNumber = `${selectedCountry.dialCode}${localPhone}`.replace(/\D/g, "");
    const localCleanNumber = localPhone.replace(/\D/g, "");
    // Precompute country-code variants for robust room matching on the server
    const phoneWithout225 = fullPhoneNumber.startsWith("225") ? fullPhoneNumber.slice(3) : fullPhoneNumber;
    const phoneWith225 = fullPhoneNumber.startsWith("225") ? fullPhoneNumber : `225${fullPhoneNumber}`;

    // 1. WebSocket Realtime Channel with auto-rejoin
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin.replace("5173", "3001");
    const socket = io(socketUrl, {
      reconnection: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 1000
    });

    const joinRooms = () => {
      socket.emit("join_auth", fullPhoneNumber);
      socket.emit("join_auth", localCleanNumber);
      socket.emit("join_auth", phoneWithout225);
      socket.emit("join_auth", phoneWith225);
      if (fullPhoneNumber.length >= 8) {
        socket.emit("join_auth", fullPhoneNumber.slice(-8));
      }
      if (authSessionIdRef.current) socket.emit("join_auth", authSessionIdRef.current);
      if (sessionCodeRef.current) socket.emit("join_auth", sessionCodeRef.current);
      if (sessionCode) socket.emit("join_auth", sessionCode);
      if (authSessionId) socket.emit("join_auth", authSessionId);
    };

    socket.on("connect", joinRooms);
    joinRooms();

    socket.on("auth:success", (sessionData) => {
      if (isAuthCompletedRef.current) return;
      isCancelled = true;
      completeAuth(sessionData);
    });

    socket.on("auth:mismatch", (data: any) => {
      const msg = data.error || data.message || "Numéro expéditeur WhatsApp différent du numéro saisi.";
      setMismatchError(msg);
      toast.error("Numéro WhatsApp différent !");
    });

    // 2. Resilient HTTP Polling every 1.2s + instant check on tab/app focus
    let isCancelled = false;

    const checkAuth = async () => {
      if (isCancelled || isAuthCompletedRef.current) return;
      try {
        const res = await apiClient.post("/api/auth/poll-status", {
          authSessionId: authSessionIdRef.current || authSessionId || undefined,
          sessionCode: sessionCodeRef.current || sessionCode || undefined,
          phoneNumber: fullPhoneNumber
        });
        if (res.data && res.data.status === "authenticated" && res.data.sessionData) {
          if (isAuthCompletedRef.current) return;
          isCancelled = true;
          completeAuth(res.data.sessionData);
        } else if (res.data && res.data.status === "mismatch") {
          setMismatchError(res.data.message || "Le message a été envoyé depuis un autre numéro WhatsApp.");
        }
      } catch {
        // Silent — background polling
      }
    };

    // Immediate check when entering waiting state
    checkAuth();
    const pollInterval = setInterval(checkAuth, 1200);

    // Instant check when user returns to tab/app after sending message on WhatsApp
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible" || !document.hidden) {
        checkAuth();
        joinRooms();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);
    window.addEventListener("pageshow", handleVisibilityOrFocus);
    window.addEventListener("resume", handleVisibilityOrFocus);

    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      window.removeEventListener("pageshow", handleVisibilityOrFocus);
      window.removeEventListener("resume", handleVisibilityOrFocus);
      socket.disconnect();
    };
  }, [whatsappStep, localPhone, selectedCountry, authSessionId, sessionCode, completeAuth]);

  // Email form
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: ""
  });

  if (!isOpen) return null;

  const handleWhatsAppAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = localPhone.replace(/\D/g, "");
    if (!cleanNumber || cleanNumber.length < 6) {
      toast.error("Veuillez saisir votre numéro WhatsApp.");
      return;
    }

    const parsed = parsePhoneNumber(`${selectedCountry.dialCode}${cleanNumber}`, selectedCountry.code);
    const fullPhoneNumber = parsed.e164 || `${selectedCountry.dialCode}${cleanNumber}`;
    setLoading(true);
    setMismatchError(null);
    try {
      const res = await apiClient.post("/api/auth/whatsapp-magic-link", {
        phoneNumber: fullPhoneNumber,
        clientUrl: window.location.origin
      });

      if (res.data?.authSessionId) {
        setAuthSessionId(res.data.authSessionId);
      }
      if (res.data?.sessionCode) {
        setSessionCode(res.data.sessionCode);
      }
      if (res.data?.systemWhatsAppNumber) {
        setSystemWhatsAppNumber(res.data.systemWhatsAppNumber);
      }
      // Always show the waiting screen — "Send CONNEXION on WhatsApp" is the primary path
      setWhatsappStep("waiting");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de l'initialisation. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    const fullPhoneNumber = `${selectedCountry.dialCode}${localPhone}`.replace(/\D/g, "");
    setIsCheckingManual(true);
    try {
      const res = await apiClient.post("/api/auth/poll-status", {
        authSessionId: authSessionIdRef.current || undefined,
        sessionCode: sessionCodeRef.current || undefined,
        phoneNumber: fullPhoneNumber
      });
      if (res.data && res.data.status === "authenticated" && res.data.sessionData) {
        completeAuth(res.data.sessionData);
      } else if (res.data && res.data.status === "mismatch") {
        setMismatchError(res.data.message || "Le message a été envoyé depuis un autre numéro WhatsApp.");
        toast.error("Numéro WhatsApp différent !");
      } else {
        toast.info("En attente de réception de votre message WhatsApp...");
      }
    } catch {
      toast.error("Vérification en cours... Veuillez patienter.");
    } finally {
      setIsCheckingManual(false);
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e1612] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Glow Background FX */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-vendeur-emerald/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-vendeur-emerald mb-1">
            <Logo size={28} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            {authMethod === "whatsapp"
              ? (whatsappStep === "waiting" ? "Validation WhatsApp" : "Accès Commerçant")
              : (mode === "login" ? "Connexion Équipe" : mode === "register" ? "Nouveau Compte" : "Mot de passe")}
          </h2>
          <p className="text-xs text-white/60 max-w-xs mx-auto">
            {authMethod === "whatsapp"
              ? (whatsappStep === "waiting"
                  ? (showMobileQr
                      ? "Scannez ce QR Code avec l'appareil photo du téléphone où se trouve votre WhatsApp."
                      : `Envoyez "CONNEXION" sur WhatsApp pour vous connecter instantanément.`)
                  : "Numéro personnel ou professionnel pour gérer votre boutique et recevoir vos alertes.")
              : "Espace d'accès sécurisé pour l'équipe."}
          </p>
        </div>

        {/* PURE WHATSAPP HERO FORM */}
        {authMethod === "whatsapp" && (
          whatsappStep === "input" ? (
            <form onSubmit={handleWhatsAppAuth} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">
                  Votre Numéro WhatsApp
                </label>
                <div className="flex gap-2 items-center w-full">
                  <CountrySelector
                    selected={selectedCountry}
                    onSelect={(c) => setSelectedCountry(c)}
                    dropdownPosition="top"
                    className="h-14 !rounded-2xl px-3.5 sm:px-4"
                  />
                  <div className="relative flex-1 min-w-0">
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      className="w-full h-14 bg-black/50 border border-white/10 focus:border-vendeur-emerald rounded-2xl px-4 text-white font-mono text-sm placeholder:text-white/20 outline-none transition-all shadow-inner"
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
                className="w-full h-14 min-h-[56px] bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-vendeur-emerald/25 cursor-pointer mt-2 shrink-0"
              >
                {loading ? (
                  <Loader2 className="animate-spin shrink-0" size={18} />
                ) : (
                  <>
                    <WhatsAppIcon size={20} className="shrink-0" />
                    <span>Accéder à ma Boutique</span>
                    <ChevronRight size={18} className="shrink-0" />
                  </>
                )}
              </button>

              {/* DIRECT HIGH-VISIBILITY SHORTCUT FOR NEW USERS (Above the fold & keyboard) */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    const el = document.getElementById("demo-card");
                    if (el) {
                      el.scrollIntoView({ behavior: "smooth", block: "center" });
                      setTimeout(() => {
                        document.getElementById("business-name-input")?.focus();
                      }, 500);
                    }
                  }}
                  className="text-xs text-vendeur-emerald hover:underline transition-colors font-bold cursor-pointer inline-flex items-center gap-1 py-1"
                >
                  <span>Pas encore inscrit ?</span>
                  <span className="underline font-black">Créer mon Vendeur IA en 1 min →</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/40">
                <ShieldCheck size={14} className="text-vendeur-emerald shrink-0" />
                <span>Connexion instantanée & sécurisée</span>
              </div>

              {/* Google Social Login */}
              {GOOGLE_CLIENT_ID && (
                <div className="pt-1 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">ou</span>
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
              <div className="pt-2 text-center border-t border-white/5 mt-2">
                <button
                  type="button"
                  onClick={() => setAuthMethod("email")}
                  className="text-[11px] text-white/30 hover:text-white/70 transition-colors font-medium cursor-pointer"
                >
                  Connexion par Email / Équipe →
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-center py-1 animate-in zoom-in-95 duration-300">
              {/* If Mismatch Detected: Clear & Helpful Explanatory Alert */}
              {mismatchError ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-[2rem] p-5 sm:p-6 text-left space-y-3 shadow-xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2.5 text-red-400 font-bold text-xs">
                    <AlertTriangle size={18} className="shrink-0 text-red-400 animate-pulse" />
                    <span className="uppercase tracking-wider">Discordance de Numéro WhatsApp</span>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed font-medium">
                    {mismatchError}
                  </p>
                  <div className="bg-black/40 rounded-xl p-3 text-[11px] text-white/70 space-y-1 border border-white/5 font-mono">
                    <div>Numéro attendu : <span className="text-emerald-400 font-bold">{formatDisplayPhone(`${selectedCountry.dialCode}${localPhone}`, selectedCountry.code)}</span></div>
                  </div>
                  <div className="pt-2 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setWhatsappStep("input");
                        setMismatchError(null);
                      }}
                      className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>← Corriger mon numéro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMismatchError(null)}
                      className="w-full h-9 text-[11px] text-white/40 hover:text-white/80 transition-colors font-medium cursor-pointer"
                    >
                      Réessayer avec le même code
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal Waiting Flow: Desktop Direct Link & Mobile 1-Click WhatsApp */
                <div className="bg-[#0c1410]/90 border border-emerald-500/20 rounded-3xl p-4 sm:p-6 text-left space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-vendeur-emerald font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-vendeur-emerald" />
                      <span>Liaison en direct active</span>
                    </div>
                    {sessionCode && (
                      <span className="text-[10px] font-mono text-white/70 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
                        Code : <strong className="text-emerald-400">{sessionCode}</strong>
                      </span>
                    )}
                  </div>

                  {/* DESKTOP VIEW: Dedicated WhatsApp Direct Link */}
                  <div className="hidden sm:flex flex-col items-center justify-center py-6 space-y-4 text-center">
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                        <Smartphone size={14} className="text-vendeur-emerald" />
                        <span>Connectez-vous via votre WhatsApp</span>
                      </p>
                      <p className="text-[11px] text-white/50 max-w-xs">
                        Cliquez sur le bouton ci-dessous pour envoyer votre code de connexion sécurisé.
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/${(systemWhatsAppNumber && !systemWhatsAppNumber.includes("00000000")) ? systemWhatsAppNumber : "22505111157"}?text=${encodeURIComponent(`CONNEXION ${sessionCode || (authSessionId ? authSessionId.slice(0, 6).toUpperCase() : "")}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-13 bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-vendeur-emerald/20 active:scale-[0.98] cursor-pointer whitespace-nowrap px-4"
                    >
                      <WhatsAppIcon size={18} className="shrink-0" />
                      <span>Ouvrir WhatsApp</span>
                      <ChevronRight size={16} className="shrink-0" />
                    </a>

                    <p className="text-[10px] text-white/30 italic">
                      Aucun scan de QR Code requis. Simple et sécurisé.
                    </p>
                  </div>

                  {/* MOBILE VIEW: 1-Click WhatsApp Direct Open */}
                  <div className="sm:hidden space-y-4 pt-2">
                    <div className="space-y-3">
                      <p className="text-xs text-white/80 leading-relaxed font-medium">
                        Appuyez sur le bouton vert ci-dessous puis sur <strong className="text-emerald-400">Envoyer</strong> dans WhatsApp :
                      </p>

                      <a
                        href={`https://wa.me/${(systemWhatsAppNumber && !systemWhatsAppNumber.includes("00000000")) ? systemWhatsAppNumber : "22505111157"}?text=${encodeURIComponent(`CONNEXION ${sessionCode || (authSessionId ? authSessionId.slice(0, 6).toUpperCase() : "")}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-13 bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-vendeur-emerald/20 active:scale-[0.98] cursor-pointer whitespace-nowrap px-4"
                      >
                        <WhatsAppIcon size={18} className="shrink-0" />
                        <span>Envoyer sur WhatsApp</span>
                        <ChevronRight size={16} className="shrink-0" />
                      </a>
                    </div>
                  </div>

                  {/* Instant Check Button */}
                  <button
                    type="button"
                    onClick={handleManualCheck}
                    disabled={isCheckingManual}
                    className="w-full h-13 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-white/10 hover:border-vendeur-emerald/40 cursor-pointer active:scale-[0.98] whitespace-nowrap px-4"
                  >
                    {isCheckingManual ? (
                      <Loader2 className="animate-spin text-vendeur-emerald shrink-0" size={15} />
                    ) : (
                      <Sparkles size={15} className="text-vendeur-emerald shrink-0" />
                    )}
                    <span className="truncate">J'ai envoyé le message → Accéder</span>
                  </button>
                </div>
              )}

              <div className="pt-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setWhatsappStep("input");
                    setOtpValue("");
                    setMismatchError(null);
                    setShowMobileQr(false);
                  }}
                  className="text-xs text-white/40 font-semibold hover:text-white hover:underline transition-all cursor-pointer py-1"
                >
                  ← Modifier mon numéro
                </button>
              </div>
            </div>
          )
        )}

        {/* EMAIL FORM (DISCREET FALLBACK) */}
        {authMethod === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/50 ml-1">Nom Complet</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input
                    required
                    className="w-full h-14 bg-black/50 border border-white/10 focus:border-white rounded-2xl pl-10 pr-3 text-white text-sm outline-none transition-all shadow-inner"
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
                  className="w-full h-14 bg-black/50 border border-white/10 focus:border-white rounded-2xl pl-10 pr-3 text-white text-sm outline-none transition-all shadow-inner"
                  placeholder="admin@vendeur-ia.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/50 ml-1">Mot de passe</label>
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
                    className="w-full h-14 bg-black/50 border border-white/10 focus:border-white rounded-2xl pl-10 pr-10 text-white text-sm outline-none transition-all shadow-inner"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors cursor-pointer"
                    title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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
              className="w-full h-14 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 mt-3 cursor-pointer shadow-lg"
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


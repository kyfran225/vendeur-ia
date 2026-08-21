import React, { useState, useEffect } from "react";
import { X, Mail, Lock, User, ChevronRight, Loader2, ShieldCheck, Sparkles, Phone, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { CountrySelector, COUNTRIES, Country } from "@/features/onboarding/components/CountrySelector";
import { useAuthStore } from "@/stores/authStore";
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
        toast.success(`Bienvenue ${user?.displayName || ''} !`);
        onSuccess(res.data);

        if (user?.onboardingCompleted) {
          navigate("/dashboard");
        } else {
          navigate("/onboarding");
        }
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
      className="w-full h-11 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 font-bold text-sm"
    >
      {internalLoading ? <Loader2 className="animate-spin" size={18} /> : <GoogleIcon />}
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
  const navigate = useNavigate();

  // WhatsApp form
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // CI by default
  const [localPhone, setLocalPhone] = useState("");
  const [whatsappName, setWhatsappName] = useState("");
  const [authSessionId, setAuthSessionId] = useState<string>("");

  const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

  // Stable complete login helper — useCallback ensures the socket effect doesn't get a stale closure
  const completeAuth = React.useCallback((sessionData: any) => {
    setSession(sessionData);
    toast.success(`Connexion réussie ! 🎉`);
    onClose();
    if (sessionData.user?.onboardingCompleted) {
      navigate("/dashboard");
    } else {
      navigate("/onboarding");
    }
  }, [setSession, onClose, navigate]);

  // Use a ref so the socket effect can read the latest authSessionId without
  // being in the dependency array (which would cause socket re-creation on every update)
  const authSessionIdRef = React.useRef(authSessionId);
  React.useEffect(() => { authSessionIdRef.current = authSessionId; }, [authSessionId]);

  useEffect(() => {
    if (whatsappStep !== "waiting" || !localPhone) return;

    const fullPhoneNumber = `${selectedCountry.dialCode}${localPhone}`.replace(/\D/g, "");
    const localCleanNumber = localPhone.replace(/\D/g, "");
    // Precompute both country-code variants for robust room matching on the server
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
      const sid = authSessionIdRef.current;
      if (sid) socket.emit("join_auth", sid);
    };

    socket.on("connect", joinRooms);
    joinRooms();

    socket.on("auth:success", (sessionData) => {
      completeAuth(sessionData);
    });

    // 2. Resilient HTTP Polling every 1.5s + instant check on tab/app focus
    let isCancelled = false;

    const checkAuth = async () => {
      if (isCancelled) return;
      try {
        const res = await apiClient.post("/api/auth/poll-status", {
          authSessionId: authSessionIdRef.current || undefined,
          phoneNumber: fullPhoneNumber
        });
        if (res.data && res.data.status === "authenticated" && res.data.sessionData) {
          isCancelled = true;
          completeAuth(res.data.sessionData);
        }
      } catch {
        // Silent — background polling
      }
    };

    // Immediate check when entering waiting state (catches cases where user is already authenticated)
    checkAuth();
    const pollInterval = setInterval(checkAuth, 1500);

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
    // authSessionId intentionally NOT in deps — read via ref to prevent socket re-creation race
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whatsappStep, localPhone, selectedCountry, completeAuth]);

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

    const fullPhoneNumber = `${selectedCountry.dialCode}${cleanNumber}`;

    setLoading(true);
    try {
      // Register the pending auth session server-side.
      // For first-contact users the WhatsApp magic link may be blocked by Meta (no 24h window yet),
      // but the session is registered in-memory: when they send "CONNEXION" on WhatsApp,
      // authenticateViaIncomingMessage will fire and the socket/poll will catch it immediately.
      const res = await apiClient.post("/api/auth/whatsapp-magic-link", {
        phoneNumber: fullPhoneNumber,
        clientUrl: window.location.origin
      });

      if (res.data?.authSessionId) {
        setAuthSessionId(res.data.authSessionId);
      }
      // Always show the waiting screen — "Send CONNEXION on WhatsApp" is the primary path
      setWhatsappStep("waiting");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de l'initialisation. Veuillez réessayer.");
    } finally {
      setLoading(false);
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

      setSession(res.data);
      toast.success("Connexion réussie !");
      onClose();
      if (res.data.user?.onboardingCompleted) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
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

      setSession(res.data);
      const user = res.data.user;
      toast.success(mode === "login" ? `Bienvenue ${user?.displayName || ''} !` : "Compte créé avec succès !");
      onClose();

      if (user?.onboardingCompleted) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet Container: Ultra Compact & Non-scrolling */}
      <div className="relative w-full max-w-md bg-[#0b120f] border-t sm:border border-white/10 rounded-t-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 text-left overflow-visible">
        
        {/* Mobile Pull Handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3 sm:hidden" />

        <div className="absolute -top-24 -left-24 w-48 h-48 bg-vendeur-emerald/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 sm:right-5 top-4 sm:top-5 p-2 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer z-10"
          title="Fermer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/25 mb-2.5 p-2.5 text-vendeur-emerald shadow-lg shadow-vendeur-emerald/10">
            <Logo size={32} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight leading-snug">
            {authMethod === "whatsapp"
              ? (whatsappStep === "waiting" ? "Connexion WhatsApp" : "Accès Vendeur IA")
              : mode === "login" ? "Connexion Email" : mode === "register" ? "Créer un compte" : "Mot de passe"}
          </h2>
          <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto leading-relaxed">
            {authMethod === "whatsapp"
              ? (whatsappStep === "waiting"
                  ? `Envoyez "CONNEXION" sur WhatsApp pour vous connecter instantanément.`
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
                    className="h-12 rounded-xl"
                  />
                  <div className="relative flex-1 min-w-0">
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      className="w-full h-12 bg-black/50 border border-white/10 focus:border-vendeur-emerald rounded-xl px-4 text-white font-mono text-sm placeholder:text-white/20 outline-none transition-all"
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
                className="w-full h-12 sm:h-13 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-vendeur-emerald/25 cursor-pointer mt-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <WhatsAppIcon size={18} />
                    <span>Accéder à ma Boutique</span>
                    <ChevronRight size={18} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-white/40">
                <ShieldCheck size={13} className="text-vendeur-emerald shrink-0" />
                <span>Connexion instantanée par lien magique</span>
              </div>

              {/* Google Social Login */}
              {GOOGLE_CLIENT_ID && (
                <div className="pt-2 space-y-3">
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
              <div className="pt-2 text-center border-t border-white/5 mt-3">
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
            <div className="space-y-5 text-center py-2 animate-in zoom-in-95 duration-300">
              {/* Primary Action: 1-Click WhatsApp Direct Open */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center gap-2 text-vendeur-emerald font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-vendeur-emerald animate-ping" />
                  <span>Validation WhatsApp en 1 Clic</span>
                </div>
                
                <p className="text-xs text-white/70 leading-relaxed">
                  Cliquez sur le bouton ci-dessous pour ouvrir WhatsApp et envoyer le message de validation. Votre session s'ouvrira automatiquement !
                </p>

                <a
                  href={`https://wa.me/22505111157?text=${encodeURIComponent(`CONNEXION ${authSessionId ? authSessionId.slice(0, 6).toUpperCase() : ""}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-12 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#25D366]/20 cursor-pointer"
                >
                  <WhatsAppIcon size={18} />
                  <span>Envoyer "CONNEXION" sur WhatsApp</span>
                  <ChevronRight size={16} />
                </a>
              </div>

              {/* Alternative: OTP Input */}
              <div className="space-y-2 px-2">
                <p className="text-[11px] text-white/40 font-medium">
                  Ou saisissez le code à 6 chiffres si vous l'avez reçu :
                </p>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="· · · · · ·"
                    className="w-full h-14 bg-black/50 border border-white/10 focus:border-vendeur-emerald rounded-xl text-center text-2xl font-mono tracking-[0.3em] text-vendeur-emerald outline-none transition-all placeholder:text-white/10"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                  {isVerifyingOtp && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                      <Loader2 className="animate-spin text-vendeur-emerald" size={20} />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setWhatsappStep("input");
                    setOtpValue("");
                  }}
                  className="text-[11px] text-white/30 font-medium hover:text-white hover:underline transition-all"
                >
                  ← Modifier mon numéro
                </button>
              </div>
            </div>
          )
        )}

        {/* EMAIL FORM (DISCREET FALLBACK) */}
        {authMethod === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-white/50 ml-1">Nom Complet</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                  <input
                    required
                    className="w-full h-11 bg-black/50 border border-white/10 focus:border-white rounded-xl pl-10 pr-3 text-white text-sm outline-none transition-all"
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
                  className="w-full h-11 bg-black/50 border border-white/10 focus:border-white rounded-xl pl-10 pr-3 text-white text-sm outline-none transition-all"
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
                    className="w-full h-11 bg-black/50 border border-white/10 focus:border-white rounded-xl pl-10 pr-10 text-white text-sm outline-none transition-all"
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
              className="w-full h-11 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50 mt-3 cursor-pointer"
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


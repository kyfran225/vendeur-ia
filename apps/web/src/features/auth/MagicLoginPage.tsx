import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { Logo } from "@/components/ui/Logo";
import { AssistantIcon } from "@/components/ui/AssistantIcon";
import { CheckCircle2, ArrowRight, Smartphone, Globe, ExternalLink } from "lucide-react";

/**
 * Zéro Friction Login Page
 * Handles redirection from WhatsApp Magic Link
 * Automatically detects PWA standalone mode vs browser navigation
 */
export function MagicLoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [destination, setDestination] = useState("/dashboard");

  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://"));

  const hasVerifiedRef = React.useRef(false);

  useEffect(() => {
    const token = searchParams.get("t");
    const phoneNumber = searchParams.get("p");
    const authSessionId = searchParams.get("s");

    if (!token || !phoneNumber) {
      setStatus("error");
      setErrorMessage("Lien de connexion invalide ou incomplet.");
      toast.error("Lien de connexion invalide ou incomplet.", { id: "auth-toast" });
      setTimeout(() => navigate("/"), 2500);
      return;
    }

    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;

    const verifyToken = async () => {
      try {
        const res = await apiClient.post("/api/auth/verify-magic-link", {
          token,
          phoneNumber,
          authSessionId: authSessionId || undefined
        });

        setSession(res.data);
        const target = "/dashboard";
        setDestination(target);
        setStatus("success");
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
                  Authentification réussie ! ✨
                </p>
              </div>
            </div>
          ),
          { id: "auth-toast", duration: 3500 }
        );

        // If directly inside standalone PWA, navigate immediately
        if (isStandalone) {
          navigate(target, { replace: true });
        }
      } catch (err: any) {
        console.error("Magic Link Error:", err);
        setStatus("error");
        setErrorMessage(err.response?.data?.error || "Lien expiré ou déjà utilisé.");
        toast.error(err.response?.data?.error || "Lien expiré ou déjà utilisé.", { id: "auth-toast" });
        setTimeout(() => navigate("/"), 3000);
      }
    };

    verifyToken();
  }, [searchParams, navigate, setSession, isStandalone]);

  const handleOpenApp = () => {
    // Attempt navigation to dashboard / app root
    navigate(destination);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-vendeur-coal flex flex-col items-center justify-center p-4">
        <VendeurIALoader label="Connexion à votre boutique..." />
        <p className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-widest mt-8 font-black">
          Connexion Sécurisée Vendeur IA
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-vendeur-coal flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4 shadow-sm">
          <Logo size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Lien invalide ou expiré</h2>
        <p className="text-sm text-slate-500 dark:text-white/50 max-w-sm mb-6">{errorMessage}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white rounded-xl font-bold text-sm transition-all cursor-pointer"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-vendeur-coal flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md bg-white dark:bg-[#0b120f] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden text-slate-900 dark:text-white">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 dark:bg-vendeur-emerald/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-vendeur-emerald/15 border border-emerald-200 dark:border-vendeur-emerald/30 flex items-center justify-center text-emerald-600 dark:text-vendeur-emerald mb-5 shadow-lg shadow-emerald-500/10 animate-in zoom-in-50 duration-300">
          <CheckCircle2 size={36} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
          Connexion Réussie !
        </h2>
        <p className="text-xs text-slate-500 dark:text-white/60 leading-relaxed mb-6">
          Votre compte Vendeur IA a été vérifié et activé avec succès.
        </p>

        {/* Helpful instructions for PWA users */}
        <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-left mb-6 space-y-2">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-vendeur-emerald font-bold text-xs">
            <Smartphone size={16} />
            <span>Vous utilisez l'application installée ?</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-white/50 leading-relaxed">
            Votre application sur l'écran d'accueil est déjà déverrouillée. Vous pouvez simplement la réouvrir ou cliquer ci-dessous.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleOpenApp}
            className="w-full h-13 sm:h-14 min-h-[52px] sm:min-h-[56px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-emerald-500/25 cursor-pointer shrink-0"
          >
            <span>Accéder à mon espace</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => navigate(destination)}
            className="w-full h-12 min-h-[48px] bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 hover:text-slate-950 dark:text-white/80 dark:hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-200 dark:border-white/5 cursor-pointer shrink-0"
          >
            <Globe size={15} />
            <span>Continuer dans ce navigateur</span>
          </button>
        </div>
      </div>
    </div>
  );
}


import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { Logo } from "@/components/ui/Logo";
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

  useEffect(() => {
    const token = searchParams.get("t");
    const phoneNumber = searchParams.get("p");
    const authSessionId = searchParams.get("s");

    if (!token || !phoneNumber) {
      setStatus("error");
      setErrorMessage("Lien de connexion invalide ou incomplet.");
      toast.error("Lien de connexion invalide ou incomplet.");
      setTimeout(() => navigate("/"), 2500);
      return;
    }

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
        toast.success("Authentification réussie ! ✨");

        // If directly inside standalone PWA, navigate immediately
        if (isStandalone) {
          navigate(target, { replace: true });
        }
      } catch (err: any) {
        console.error("Magic Link Error:", err);
        setStatus("error");
        setErrorMessage(err.response?.data?.error || "Lien expiré ou déjà utilisé.");
        toast.error(err.response?.data?.error || "Lien expiré ou déjà utilisé.");
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
      <div className="min-h-screen bg-vendeur-coal flex flex-col items-center justify-center p-4">
        <VendeurIALoader label="Connexion à votre boutique..." />
        <p className="text-[10px] text-white/30 uppercase tracking-widest mt-8 font-black">
          Connexion Sécurisée Vendeur IA
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-vendeur-coal flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <Logo size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Lien invalide ou expiré</h2>
        <p className="text-sm text-white/50 max-w-sm mb-6">{errorMessage}</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm transition-all"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vendeur-coal flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md bg-[#0b120f] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-vendeur-emerald/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-vendeur-emerald/15 border border-vendeur-emerald/30 flex items-center justify-center text-vendeur-emerald mb-5 shadow-lg shadow-vendeur-emerald/10 animate-in zoom-in-50 duration-300">
          <CheckCircle2 size={36} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
          Connexion Réussie !
        </h2>
        <p className="text-xs text-white/60 leading-relaxed mb-6">
          Votre compte Vendeur IA a été vérifié et activé avec succès.
        </p>

        {/* Helpful instructions for PWA users */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left mb-6 space-y-2">
          <div className="flex items-center gap-2 text-vendeur-emerald font-bold text-xs">
            <Smartphone size={16} />
            <span>Vous utilisez l'application installée ?</span>
          </div>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Votre application sur l'écran d'accueil est déjà déverrouillée. Vous pouvez simplement la réouvrir ou cliquer ci-dessous.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleOpenApp}
            className="w-full h-13 sm:h-14 min-h-[52px] sm:min-h-[56px] bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/25 cursor-pointer shrink-0"
          >
            <span>Accéder à mon espace</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => navigate(destination)}
            className="w-full h-12 min-h-[48px] bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-white/5 cursor-pointer shrink-0"
          >
            <Globe size={15} />
            <span>Continuer dans ce navigateur</span>
          </button>
        </div>
      </div>
    </div>
  );
}


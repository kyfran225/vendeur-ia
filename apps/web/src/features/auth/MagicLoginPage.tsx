import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";

/**
 * Zéro Friction Login Page
 * Handles redirection from WhatsApp Magic Link
 */
export function MagicLoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get("t");
    const phoneNumber = searchParams.get("p");
    const authSessionId = searchParams.get("s");

    if (!token || !phoneNumber) {
      toast.error("Lien de connexion invalide ou incomplet.");
      navigate("/");
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
        const user = res.data.user;
        toast.success(`Authentification réussie ! ✨`);

        if (user?.onboardingCompleted) {
          navigate("/dashboard");
        } else {
          navigate("/onboarding");
        }
      } catch (err: any) {
        console.error("Magic Link Error:", err);
        toast.error(err.response?.data?.error || "Lien expiré ou déjà utilisé.");
        navigate("/");
      }
    };

    verifyToken();
  }, [searchParams, navigate, setSession]);

  return (
    <div className="min-h-screen bg-vendeur-coal flex flex-col items-center justify-center">
      <VendeurIALoader label="Validation de votre lien magique..." />
      <p className="text-[10px] text-white/30 uppercase tracking-widest mt-8 font-black">
        Connexion Sécurisée Vendeur IA
      </p>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";

export function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!reference) {
      navigate(user?.onboardingCompleted ? "/dashboard" : "/offers");
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await apiClient.get(`/api/commerce/verify-transaction/${reference}`);
        if (res.data.status === "success") {
          setStatus("success");
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast.success("Paiement confirmé ! Votre accès est activé. 🚀");

          const plan = res.data.merchant?.subscription?.plan || res.data.data?.metadata?.offerSlug || "essential";
          const type = res.data.data?.metadata?.type;
          const setupOption = res.data.data?.metadata?.setupOption;

          const isPackPro = type === "pack_pro" || setupOption === "EXPERT";
          const isProPlan = plan === "pro";

          setTimeout(() => {
            if (isPackPro) {
              navigate("/settings?tab=connexions&expert=true");
            } else if (isProPlan) {
              navigate("/settings?tab=connexions&pro=true");
            } else {
              navigate("/activation");
            }
          }, 2000);
        } else {
          // Retry if pending, up to 10 times (20 seconds)
          if (attempts < 10) {
            setTimeout(() => setAttempts(a => a + 1), 2000);
          } else {
            setStatus("error");
          }
        }
      } catch (err) {
        if (attempts < 10) {
          setTimeout(() => setAttempts(a => a + 1), 2000);
        } else {
          setStatus("error");
        }
      }
    };

    checkStatus();
  }, [reference, attempts, navigate, queryClient, user]);

  return (
    <div className="min-h-screen bg-vendeur-coal flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="relative">
          {status === "loading" && (
            <div className="flex flex-col items-center space-y-6">
              <div className="h-24 w-24 rounded-full border-4 border-vendeur-emerald/20 border-t-vendeur-emerald animate-spin" />
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Vérification du paiement...</h1>
                <p className="text-white/40 text-sm uppercase font-bold tracking-widest">Nous synchronisons votre compte</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center space-y-6">
              <div className="h-24 w-24 bg-vendeur-emerald rounded-full flex items-center justify-center text-vendeur-coal shadow-2xl shadow-vendeur-emerald/20">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Paiement Validé !</h1>
                <p className="text-vendeur-emerald text-sm uppercase font-black tracking-[0.2em] flex items-center justify-center gap-2">
                  <Sparkles size={16} /> Activation IA en cours...
                </p>
              </div>
              <p className="text-white/40 text-xs">Vous allez être redirigé vers vos réglages dans quelques instants.</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center space-y-6">
              <div className="h-24 w-24 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-rose-500/20">
                <XCircle size={48} />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Oups !</h1>
                <p className="text-rose-500 text-sm uppercase font-bold tracking-widest">Le paiement semble encore en attente</p>
              </div>
              <p className="text-white/40 text-xs leading-relaxed">
                Si vous avez bien été débité, ne vous inquiétez pas. Votre accès sera activé automatiquement sous peu.
                Vérifiez votre boîte mail pour le reçu Paystack.
              </p>
              <button
                onClick={() => navigate("/settings?tab=connexions")}
                className="w-full h-14 bg-white/5 border border-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Retour aux réglages
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

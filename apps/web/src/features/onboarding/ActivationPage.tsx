import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import {
  CheckCircle2,
  Circle,
  QrCode,
  Bot,
  Zap,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { WhatsAppConnectionFlow } from "../settings/components/WhatsAppConnectionFlow";
import { useAuthStore } from "@/stores/authStore";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ActivationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [qrCode, setQrCode] = useState<string | null>(null);

  const reference = searchParams.get("reference");

  const { data: dashboard, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard");
      return res.data;
    },
    refetchInterval: (query) => {
      // Access data from the query state
      const subStatus = query.state.data?.subscription?.status;
      return subStatus === 'active' ? false : 3000;
    }
  });

  // Manual verification if reference is provided
  useEffect(() => {
    if (reference && dashboard?.subscription?.status !== 'active') {
      const verify = async () => {
        try {
          await apiClient.get(`/api/commerce/verify-transaction/${reference}`);
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        } catch (e) {
          console.error("Manual verification failed", e);
        }
      };
      // Short delay to let webhook finish first
      const timer = setTimeout(verify, 2000);
      return () => clearTimeout(timer);
    }
  }, [reference, dashboard?.subscription?.status, queryClient]);

  const subscription = dashboard?.subscription;
  const whatsapp = dashboard?.whatsappConnection;
  const isSubscribed = subscription?.status === 'active';
  const isWhatsAppConnected = whatsapp?.status === 'CONNECTED';

  // Socket logic (simulated for flow)
  useEffect(() => {
    // In a real app, socket.on('whatsapp:qr') would set the QR
  }, []);

  const handleInitBaileys = async () => {
    try {
      await apiClient.post("/api/whatsapp/init");
      // UI will catch QR via socket
    } catch (err) {
      console.error("Init WhatsApp failed");
    }
  };

  if (isSubscribed && isWhatsAppConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 animate-in zoom-in-95 duration-700">
        <div className="max-w-md w-full bg-vendeur-coal border border-white/10 p-12 rounded-[3.5rem] text-center space-y-8 shadow-2xl">
          <div className="h-24 w-24 bg-vendeur-emerald rounded-[2rem] flex items-center justify-center text-vendeur-coal mx-auto shadow-2xl shadow-vendeur-emerald/20 animate-bounce">
            <Bot size={48} />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black uppercase tracking-tighter italic text-white">Prêt à vendre !</h1>
            <p className="text-sm text-white/40 font-bold uppercase tracking-widest leading-relaxed">
              Votre Vendeur IA est désormais actif et opérationnel sur WhatsApp.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full h-20 bg-white text-vendeur-coal rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-vendeur-emerald transition-all active:scale-95 shadow-xl"
          >
            Ouvrir mon Dashboard
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="space-y-4">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Votre Vendeur IA est presque prêt</h1>

          <div className="flex flex-col md:flex-row gap-4 items-center">
            <StepBadge label="Offre activée" completed={isSubscribed} active={!isSubscribed} />
            <div className="hidden md:block h-px w-8 bg-white/10" />
            <StepBadge label="Paiement confirmé" completed={isSubscribed} active={false} />
            <div className="hidden md:block h-px w-8 bg-white/10" />
            <StepBadge label="Connexion WhatsApp" completed={isWhatsAppConnected} active={isSubscribed && !isWhatsAppConnected} />
            <div className="hidden md:block h-px w-8 bg-white/10" />
            <StepBadge label="Vendeur IA prêt" completed={false} active={isWhatsAppConnected} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Main Content */}
          <div className="md:col-span-3 space-y-10">
            {!isSubscribed ? (
              <div className="p-12 bg-white/5 border border-white/5 rounded-[3rem] text-center space-y-6">
                <Loader2 className="animate-spin text-vendeur-emerald mx-auto" size={48} />
                <h3 className="text-xl font-black uppercase tracking-tight">Vérification du paiement...</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">
                  Nous attendons la confirmation de votre paiement Mobile Money ou Carte. Cela peut prendre quelques instants.
                </p>
              </div>
            ) : !isWhatsAppConnected ? (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic text-vendeur-emerald">Connectons votre WhatsApp</h2>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                    Votre abonnement est actif. Scannez le QR Code pour mettre votre vendeur au travail.
                  </p>
                </div>

                <div className="bg-vendeur-coal border border-white/10 rounded-[2.5rem] p-2 overflow-hidden shadow-2xl">
                   <WhatsAppConnectionFlow
                     qrCode={qrCode}
                     onInitBaileys={handleInitBaileys}
                     onCancelScan={() => setQrCode(null)}
                   />
                </div>
              </div>
            ) : null}
          </div>

          {/* Tips / Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-vendeur-emerald/5 border border-vendeur-emerald/10 p-8 rounded-[2.5rem] space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-vendeur-emerald">Pourquoi connecter ?</h4>
              <ul className="space-y-4">
                <TipItem icon={<Zap size={14} />} text="Réponses 24h/24 sans effort" />
                <TipItem icon={<Bot size={14} />} text="Intelligence artificielle qualifiée" />
                <TipItem icon={<ShieldCheck size={14} />} text="Sécurisé et professionnel" />
              </ul>
            </div>

            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center gap-4">
              <Smartphone className="text-white/20" size={20} />
              <p className="text-[9px] font-bold uppercase text-white/40 leading-relaxed">
                Gardez votre téléphone à portée de main pour le scan initial.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBadge({ label, completed, active }: { label: string, completed: boolean, active: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all",
      completed ? "bg-vendeur-emerald text-vendeur-coal border-transparent" :
      active ? "bg-white text-vendeur-coal border-transparent animate-pulse" :
      "bg-white/5 text-white/20 border-white/5"
    )}>
      {completed ? <CheckCircle2 size={12} /> : <Circle size={12} />}
      {label}
    </div>
  );
}

function TipItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <li className="flex items-center gap-3 text-[10px] font-bold text-white/60 uppercase tracking-tight">
      <div className="text-vendeur-emerald">{icon}</div>
      {text}
    </li>
  );
}

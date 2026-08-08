import React, { useEffect } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  MessageCircle,
  Banknote,
  Package,
  Bot,
  Sparkles,
  Zap,
  Share2,
  ExternalLink,
  Brain,
  MessageSquareQuote
} from "lucide-react";

import { useSocket } from "@/hooks/useSocket";
import { useQuery as useTanstackQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SetupGuide } from "./components/SetupGuide";
import { SubscriptionBanner } from "./components/SubscriptionBanner";
import { BriefingRoom } from "./components/BriefingRoom";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0
  }).format(value);
}

export function SalesDashboard() {
  const { accessToken } = useAuthStore();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const isBriefingOpen = searchParams.get("briefing") === "true";

  const setIsBriefingOpen = (open: boolean) => {
    if (open) {
      setSearchParams({ briefing: "true" });
    } else {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("briefing");
      setSearchParams(newParams);
    }
  };

  const { data: dashboard, isLoading } = useTanstackQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard");
      return res.data;
    },
    enabled: !!accessToken
  });

  useEffect(() => {
    if (socket) {
      socket.on("whatsapp:qr", (data: { qrCodeData: string }) => {
        toast.info("Nouveau QR Code WhatsApp généré !");
        queryClient.setQueryData(["whatsapp:qr"], data.qrCodeData);
      });

      socket.on("whatsapp:connected", () => {
        toast.success("WhatsApp connecté avec succès ! 🚀");
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      });
    }
    return () => {
      socket?.off("whatsapp:qr");
      socket?.off("whatsapp:connected");
    };
  }, [socket, queryClient]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Sparkles className="animate-spin text-vendeur-emerald" size={48} />
      </div>
    );
  }

  const handleShareShop = () => {
     const url = `${window.location.origin}/shop/${dashboard?.merchant?._id}`;
     navigator.clipboard.writeText(url);
     toast.success("Lien de votre vitrine copié ! 🚀");
  };

  return (
    <main className="max-w-6xl mx-auto p-4 md:p-10 space-y-8 pb-24 md:pb-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-white flex items-center gap-4">
            <LayoutDashboard className="text-vendeur-emerald" size={36} />
            Tableau de Bord
          </h1>
          <p className="text-white/40 text-sm md:text-lg">Gérez votre croissance et suivez vos performances.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleShareShop}
            className="h-12 px-6 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center text-center gap-2 flex-1 md:flex-none"
          >
            <Share2 size={16} />
            Partager ma vitrine
          </button>

          <Link
            to={`/shop/${dashboard?.merchant?._id}`}
            target="_blank"
            className="h-12 px-6 rounded-2xl bg-vendeur-emerald text-vendeur-coal text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-center gap-2 shadow-lg shadow-vendeur-emerald/20 flex-1 md:flex-none"
          >
            <ExternalLink size={16} />
            Voir ma boutique
          </Link>
        </div>
      </header>

      <HomePanel dashboard={dashboard} onOpenBriefing={() => setIsBriefingOpen(true)} />

      <BriefingRoom
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        businessName={dashboard?.merchant?.businessName || "Votre boutique"}
      />
    </main>
  );
}

function HomePanel({ dashboard, onOpenBriefing }: { dashboard: any, onOpenBriefing: () => void }) {
  const tips = dashboard?.aiGrowthAdvice?.tips || [];
  const status = dashboard?.merchant?.whatsappConfig?.status || 'disconnected';
  const setupStatus = dashboard?.setupStatus;
  const subscription = dashboard?.merchant?.subscription;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* SUBSCRIPTION STATUS BANNER */}
      <SubscriptionBanner
        status={subscription?.status}
        expiresAt={subscription?.expiresAt}
      />

      {/* INTELLIGENT SETUP GUIDE */}
      {setupStatus && !setupStatus.isFullyOperational && (
        <SetupGuide
          setupStatus={setupStatus}
          businessName={dashboard?.merchant?.businessName || "Votre boutique"}
          dashboard={dashboard}
        />
      )}

      {/* AI GROWTH ADVISOR SECTION */}
      <section className="relative overflow-hidden bg-vendeur-emerald/10 border border-vendeur-emerald/20 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] group shadow-2xl">
        <div className="absolute top-0 right-0 p-8 md:p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
           <Sparkles size={160} className="text-vendeur-emerald" />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3 md:gap-5">
              <div className="h-9 w-9 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-vendeur-emerald flex items-center justify-center text-vendeur-coal shadow-2xl shadow-vendeur-emerald/30 group-hover:rotate-6 transition-transform shrink-0">
                <Bot className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base xs:text-lg md:text-3xl font-black text-white uppercase tracking-tighter leading-none truncate">
                  Conseiller de Croissance IA
                </h2>
                <div className="flex items-center gap-2 mt-1 md:mt-2">
                  <div className={cn("h-2 w-2 md:h-2.5 md:w-2.5 rounded-full animate-pulse", status === 'connected' ? "bg-vendeur-emerald" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]")} />
                  <p className="text-[10px] md:text-xs font-black uppercase text-vendeur-emerald/80 tracking-widest truncate">
                    {status === 'connected' ? "IA en ligne & active" : "IA en attente de connexion"}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenBriefing}
              className="flex items-center justify-center gap-3 px-5 py-2.5 rounded-xl bg-vendeur-emerald/10 border border-vendeur-emerald/30 text-vendeur-emerald text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-vendeur-emerald/20 transition-all group/btn w-full md:w-auto mt-2 md:mt-0"
            >
              <MessageSquareQuote size={18} className="group-hover/btn:rotate-12 transition-transform" />
              Briefing Room : Donner des instructions
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tips.map((tip: any, i: number) => (
              <Link
                key={i}
                to={tip.action || "#"}
                className="bg-black/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl text-xs font-medium leading-relaxed hover:border-vendeur-emerald/40 hover:bg-black/60 transition-all active:scale-[0.98]"
              >
                {tip.text || tip}
              </Link>
            ))}
            {tips.length === 0 && (
               <div className="col-span-3 text-white/40 text-xs italic">Analyse de votre business en cours...</div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard icon={<Banknote className="text-vendeur-emerald" />} label="Revenu Jour" value={formatAmount(dashboard?.metrics?.revenueToday || 0)} suffix="F CFA" />
        <MetricCard icon={<MessageCircle className="text-blue-400" />} label="Conversations" value={String(dashboard?.metrics?.conversationsToday || 0)} />
        <MetricCard icon={<Zap className="text-amber-400" />} label="Commandes" value={String(dashboard?.metrics?.ordersToday || 0)} />
        <MetricCard icon={<TrendingUp className="text-rose-400" />} label="Conversion" value={`${dashboard?.metrics?.conversionRate || 0}%`} />
      </div>

      <section className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
        <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Pipeline de Vente</h2>
        <div className="space-y-4">
          <PipelineStep label="Discussion WhatsApp" value={dashboard?.metrics?.conversationsToday || 0} max={Math.max(20, dashboard?.metrics?.conversationsToday || 0)} color="bg-blue-400" />
          <PipelineStep label="Paiement Confirmé" value={dashboard?.metrics?.ordersToday || 0} max={Math.max(20, dashboard?.metrics?.conversationsToday || 0)} color="bg-amber-400" />
          <PipelineStep label="Taux de Conversion" value={dashboard?.metrics?.conversionRate || 0} max={100} color="bg-vendeur-emerald" />
        </div>
      </section>

      {/* DYNAMIC AI INSIGHTS SECTION */}
      {dashboard?.merchant?.knowledge?.businessRules?.dynamicInsights?.length > 0 && (
        <section className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="text-amber-400" size={20} />
            <h2 className="text-xl font-black uppercase tracking-tight">Conseils Rentables de votre IA</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboard.merchant.knowledge.businessRules.dynamicInsights.slice(-4).reverse().map((insight: any, i: number) => (
              <div key={i} className="bg-vendeur-bg border border-white/5 p-5 rounded-2xl flex items-start gap-4 hover:border-vendeur-emerald/30 transition-all">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                  insight.type === 'product' ? "bg-blue-500/10 text-blue-400" :
                  insight.type === 'customer' ? "bg-purple-500/10 text-purple-400" : "bg-emerald-500/10 text-emerald-400"
                )}>
                  {insight.type === 'product' ? <Package size={16} /> :
                   insight.type === 'customer' ? <Bot size={16} /> : <TrendingUp size={16} />}
                </div>
                <div>
                  <p className="text-sm font-medium leading-relaxed">{insight.insight}</p>
                  <p className="text-[10px] text-white/20 uppercase font-black mt-2">Appris le {new Date(insight.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: string; suffix?: string }) {
  return (
    <div className="bg-vendeur-coal/50 backdrop-blur-sm border border-white/10 p-4 xs:p-5 md:p-6 rounded-[2rem] space-y-3 md:space-y-4 shadow-xl hover:border-white/20 transition-all group">
      <div className="h-9 w-9 md:h-12 md:w-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">{icon}</div>
      <div>
        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/30 truncate">{label}</p>
        <div className="flex items-baseline gap-1 mt-0.5 md:mt-1">
          <p className="text-lg md:text-2xl font-black text-white">{value}</p>
          {suffix && <span className="text-[9px] md:text-xs font-black text-white/20 uppercase">{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

function PipelineStep({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percentage = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-4">
      <div className="w-48 text-sm font-bold text-white/60">{label}</div>
      <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-1000", color)} style={{ width: `${percentage}%` }} />
      </div>
      <div className="w-12 text-right font-black">{value}</div>
    </div>
  );
}

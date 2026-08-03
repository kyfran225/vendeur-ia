import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  MessageCircle,
  DollarSign,
  Package,
  Settings,
  Bot,
  Loader2,
  Plus,
  Trash2,
  Check,
  X,
  Save,
  Sparkles,
  Zap,
  Camera,
  QrCode,
  LogIn,
  User,
  LogOut,
  Instagram,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

const TikTokIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

const money = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XOF",
  maximumFractionDigits: 0
});

function formatAmount(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0
  }).format(value);
}

import { Link } from "react-router-dom";
import { SalesInbox } from "../inbox/SalesInbox";
import { WhatsAppConnectionFlow } from "./components/WhatsAppConnectionFlow";
import { PackProModal } from "./components/PackProModal";
import { subscribeToPush } from "@/lib/pushUtils";

export function SalesDashboard() {
  const [tab, setTab] = useState<"home" | "products" | "inbox" | "settings">("home");
  const [isPackProOpen, setIsPackProOpen] = useState(false);

  useEffect(() => {
    (window as any).openPackPro = () => setIsPackProOpen(true);
  }, []);

  const { accessToken, logout, user } = useAuthStore();
  const socket = useSocket();
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading } = useQuery({
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
      <div className="flex h-screen items-center justify-center bg-vendeur-bg">
        <Sparkles className="animate-spin text-vendeur-emerald" size={48} />
      </div>
    );
  }

  const merchant = dashboard?.merchant;

  return (
    <div className="min-h-screen bg-vendeur-bg text-white pb-24 md:pb-8">
      <PackProModal isOpen={isPackProOpen} onClose={() => setIsPackProOpen(false)} />
      <header className="h-14 md:h-20 border-b border-white/5 bg-vendeur-bg/80 backdrop-blur-md flex items-center justify-between px-4 md:px-12 sticky top-0 z-40 w-full gap-4">
        {/* Connection Error Banner */}
        {merchant?.whatsappConfig?.status === 'error' && (
          <div className="absolute top-full left-0 right-0 bg-red-500 py-2 px-4 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-500 shadow-lg">
            <AlertCircle size={14} className="text-white animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white">Attention : Votre WhatsApp est déconnecté !</p>
            <button
              onClick={() => setTab("settings")}
              className="px-3 py-1 bg-white text-red-500 rounded-lg text-[9px] font-black uppercase hover:bg-white/90 transition-all shadow-sm"
            >
              Reconnecter
            </button>
          </div>
        )}
        <div className="flex items-center gap-3 md:gap-5 flex-1 min-w-0">
          <div className="md:hidden h-9 w-9 flex items-center justify-center overflow-hidden bg-white/5 rounded-xl p-1.5 border border-white/10 shrink-0">
            <img src="/apple-touch-icon.png" alt="Logo" className="h-full w-full object-contain" />
          </div>
          <div className="hidden md:flex h-10 w-10 rounded-2xl bg-vendeur-emerald/10 items-center justify-center border border-vendeur-emerald/20 shrink-0">
            <Bot className="text-vendeur-emerald" size={20} />
          </div>
          <div className="text-left min-w-0">
            <p className="text-base md:text-xl font-black text-white uppercase tracking-tight truncate leading-tight">{merchant?.businessName || "Mon Commerce"}</p>
            <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-vendeur-emerald/60 font-black leading-none truncate">AI Sales Machine</p>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-6 shrink-0">
           <Link
             to="/settings"
             className="h-9 w-9 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-white/10 hover:border-vendeur-emerald/30 hover:text-vendeur-emerald transition-all overflow-hidden group shadow-lg"
           >
             {user?.avatarUrl ? (
               <img src={user.avatarUrl} alt="Profil" className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
             ) : (
               <User size={18} />
             )}
           </Link>
           <button
             onClick={logout}
             className="h-9 w-9 md:h-12 md:w-auto md:px-6 rounded-xl md:rounded-2xl border border-white/10 text-white/40 text-[10px] font-black uppercase hover:text-red-400 hover:border-red-400/20 hover:bg-red-400/5 transition-all flex items-center justify-center gap-2 shadow-lg"
             title="Déconnexion"
           >
             <LogOut size={14} className="md:hidden" />
             <span className="hidden md:inline tracking-widest">Déconnexion</span>
           </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-10 space-y-8">
        <nav className="flex gap-2 p-1.5 bg-vendeur-coal/80 backdrop-blur-md rounded-[1.5rem] border border-white/10 w-fit shadow-2xl overflow-x-auto no-scrollbar max-w-full">
          <TabButton active={tab === "home"} onClick={() => setTab("home")} icon={<LayoutDashboard size={18}/>} label="Stats" />
          <TabButton active={tab === "inbox"} onClick={() => setTab("inbox")} icon={<MessageCircle size={18}/>} label="Inbox" />
          <TabButton active={tab === "products"} onClick={() => setTab("products")} icon={<Package size={18}/>} label="Catalogue" />
          <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon={<Settings size={18}/>} label="Réglages" />
        </nav>

        {tab === "home" && <HomePanel dashboard={dashboard} />}
        {tab === "inbox" && <SalesInbox />}
        {tab === "products" && <ProductsPanel dashboard={dashboard} />}
        {tab === "settings" && <SettingsPanel merchant={merchant} systemSettings={dashboard?.systemSettings} />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
        active ? "bg-vendeur-emerald text-vendeur-coal shadow-lg" : "text-white/40 hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function HomePanel({ dashboard }: { dashboard: any }) {
  const tips = dashboard?.aiGrowthAdvice?.tips || [];
  const status = dashboard?.merchant?.whatsappConfig?.status || 'disconnected';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* AI GROWTH ADVISOR SECTION */}
      <section className="relative overflow-hidden bg-vendeur-emerald/10 border border-vendeur-emerald/20 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] group shadow-2xl">
        <div className="absolute top-0 right-0 p-8 md:p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
           <Sparkles size={160} className="text-vendeur-emerald" />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 md:gap-5 max-w-full">
              <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-vendeur-emerald flex items-center justify-center text-vendeur-coal shadow-2xl shadow-vendeur-emerald/30 group-hover:rotate-6 transition-transform shrink-0">
                <Bot size={22} className="md:size-32" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg xs:text-xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none truncate">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tips.map((tip: string, i: number) => (
              <div key={i} className="bg-black/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl text-xs font-medium leading-relaxed hover:border-vendeur-emerald/30 transition-colors">
                {tip}
              </div>
            ))}
            {tips.length === 0 && (
               <div className="col-span-3 text-white/40 text-xs italic">Analyse de votre business en cours...</div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard icon={<DollarSign className="text-vendeur-emerald" />} label="Revenu Jour" value={formatAmount(dashboard?.metrics?.revenueToday || 0)} suffix="F CFA" />
        <MetricCard icon={<MessageCircle className="text-blue-400" />} label="Conversations" value={String(dashboard?.metrics?.conversationsToday || 0)} />
        <MetricCard icon={<Zap className="text-amber-400" />} label="Commandes" value={String(dashboard?.metrics?.ordersToday || 0)} />
        <MetricCard icon={<TrendingUp className="text-rose-400" />} label="Conversion" value={`${dashboard?.metrics?.conversionRate || 0}%`} />
      </div>

      <section className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8">
        <h2 className="text-xl font-black mb-6">Pipeline de Vente</h2>
        <div className="space-y-4">
          <PipelineStep label="Discussion WhatsApp" value={dashboard?.metrics?.conversationsToday || 0} max={Math.max(20, dashboard?.metrics?.conversationsToday || 0)} color="bg-blue-400" />
          <PipelineStep label="Paiement Confirmé" value={dashboard?.metrics?.ordersToday || 0} max={Math.max(20, dashboard?.metrics?.conversationsToday || 0)} color="bg-amber-400" />
          <PipelineStep label="Taux de Conversion" value={dashboard?.metrics?.conversionRate || 0} max={100} color="bg-vendeur-emerald" />
        </div>
      </section>

      {/* DYNAMIC AI INSIGHTS SECTION */}
      {dashboard?.merchant?.knowledge?.businessRules?.dynamicInsights?.length > 0 && (
        <section className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="text-amber-400" size={20} />
            <h2 className="text-xl font-black">Conseils Rentables de votre IA</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboard.merchant.knowledge.businessRules.dynamicInsights.slice(-4).reverse().map((insight: any, i: number) => (
              <div key={i} className="bg-vendeur-bg border border-white/5 p-5 rounded-2xl flex items-start gap-4">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                  insight.type === 'product' ? "bg-blue-500/10 text-blue-400" :
                  insight.type === 'customer' ? "bg-purple-500/10 text-purple-400" : "bg-emerald-500/10 text-emerald-400"
                )}>
                  {insight.type === 'product' ? <Package size={16} /> :
                   insight.type === 'customer' ? <Users size={16} /> : <TrendingUp size={16} />}
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

function ProductsPanel({ dashboard }: { dashboard: any }) {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    price: 0,
    stock: 1,
    availability: "available"
  });

  const visionMutation = useMutation({
    mutationFn: async (file: File) => {
      setAnalyzing(true);
      const formData = new FormData();
      formData.append("image", file);
      const res = await apiClient.post("/api/commerce/products/vision", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      return res.data;
    },
    onSuccess: (data) => {
      setDraft(prev => ({
        ...prev,
        name: data.name || prev.name,
        description: data.description || prev.description,
        price: data.price || prev.price
      }));
      toast.success("Analyse terminée ! Catalogue mis à jour.");
    },
    onError: () => {
      toast.error("Échec de l'analyse de l'image.");
    },
    onSettled: () => {
      setAnalyzing(false);
    }
  });

  const handleVisionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) visionMutation.mutate(file);
  };

  const createMutation = useMutation({
    mutationFn: async (input: any) => {
      const res = await apiClient.post("/api/commerce/products", input);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Produit ajouté ! ✨");
      setDraft({ name: "", description: "", price: 0, stock: 1, availability: "available" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/commerce/products/${id}`);
    },
    onSuccess: () => {
      toast.success("Produit supprimé.");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  return (
    <div className="grid gap-8 lg:grid-cols-2 animate-in fade-in duration-700">
      <section className="bg-vendeur-coal border border-white/10 p-8 rounded-[2.5rem] h-fit space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">{editingId ? "Modifier l'article" : "Ajouter au catalogue"}</h2>
          <label className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-vendeur-emerald text-[10px] font-black uppercase tracking-widest hover:bg-vendeur-emerald/20 transition-all cursor-pointer",
            analyzing && "opacity-50 cursor-wait"
          )}>
             {analyzing ? <Loader2 className="animate-spin" size={14} /> : <Camera size={14} />}
             Vision IA
             <input type="file" accept="image/*" className="hidden" onChange={handleVisionUpload} disabled={analyzing} />
          </label>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nom</label>
            <input className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white focus:border-vendeur-emerald outline-none transition-all" value={draft.name} onChange={e => setDraft({...draft, name: e.target.value})} placeholder="Ex: Robe Rouge Soie" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Description</label>
            <textarea className="w-full min-h-[100px] bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-vendeur-emerald outline-none transition-all" value={draft.description} onChange={e => setDraft({...draft, description: e.target.value})} placeholder="Détails du produit..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Prix (XOF)</label>
               <input type="number" className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white focus:border-vendeur-emerald outline-none" value={draft.price} onChange={e => setDraft({...draft, price: Number(e.target.value)})} />
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Stock</label>
               <input type="number" className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white focus:border-vendeur-emerald outline-none" value={draft.stock} onChange={e => setDraft({...draft, stock: Number(e.target.value)})} />
             </div>
          </div>
          <button
            onClick={() => createMutation.mutate(draft)}
            disabled={createMutation.isPending || !draft.name}
            className="w-full h-14 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50"
          >
             {createMutation.isPending ? <Sparkles className="animate-spin" size={20} /> : <Plus size={20} />}
             {editingId ? "Enregistrer" : "Ajouter Produit"}
          </button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-black">Votre Catalogue</h2>
        <div className="grid gap-4">
          {(dashboard?.products || []).length === 0 ? (
            <div className="bg-white/5 border border-dashed border-white/10 p-12 rounded-[2rem] text-center opacity-40">
               <Package size={48} className="mx-auto mb-4" />
               <p>Votre catalogue est vide.</p>
            </div>
          ) : (
            dashboard.products.map((p: any) => (
              <div key={p._id} className="bg-vendeur-coal border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:border-vendeur-emerald/30 transition-all">
                <div>
                  <h4 className="font-black text-lg">{p.name}</h4>
                  <p className="text-sm text-white/40">{formatAmount(p.price)} • Stock: {p.stock}</p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(p._id)}
                  className="p-3 bg-white/5 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SettingsPanel({ merchant, systemSettings }: { merchant: any; systemSettings: any }) {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const qrCode = queryClient.getQueryData<string>(["whatsapp:qr"]);

  const [localMerchant, setLocalMerchant] = useState(merchant);

  useEffect(() => {
    if (merchant) setLocalMerchant(merchant);
  }, [merchant]);

  const updateMerchantMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.patch("/api/commerce/merchant", data);
    },
    onSuccess: () => {
      toast.success("Profil mis à jour !");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post("/api/whatsapp/connect", {});
    },
    onSuccess: () => {
      toast.info("Initialisation de WhatsApp...");
    }
  });

  const updateAiMutation = useMutation({
    mutationFn: async (personality: string) => {
      await apiClient.patch("/api/commerce/ai-settings", { personality });
    },
    onSuccess: () => {
      toast.success("Personnalité mise à jour !");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const handleSaveProfile = () => {
    updateMerchantMutation.mutate({
      businessName: localMerchant.businessName,
      category: localMerchant.category,
      whatsappNumber: localMerchant.whatsappNumber,
      address: localMerchant.address
    });
  };

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-700">
      {/* SECTION : PROFIL BOUTIQUE */}
      <section className="bg-vendeur-coal border border-white/10 p-8 rounded-[2.5rem] space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">Profil de la Boutique</h2>
          <button
            onClick={handleSaveProfile}
            disabled={updateMerchantMutation.isPending}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-vendeur-emerald px-4 text-[10px] font-black uppercase text-vendeur-coal shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {updateMerchantMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
            Enregistrer
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nom du commerce</span>
            <input
              className="h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-white focus:border-vendeur-emerald outline-none transition-all"
              value={localMerchant?.businessName || ""}
              onChange={e => setLocalMerchant({...localMerchant, businessName: e.target.value})}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">WhatsApp Business</span>
            <input
              className="h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-white focus:border-vendeur-emerald outline-none transition-all"
              value={localMerchant?.whatsappNumber || ""}
              onChange={e => setLocalMerchant({...localMerchant, whatsappNumber: e.target.value})}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Catégorie</span>
            <select
              className="h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-white focus:border-vendeur-emerald outline-none transition-all"
              value={localMerchant?.category || ""}
              onChange={e => setLocalMerchant({...localMerchant, category: e.target.value})}
            >
              <option value="fashion">👗 Mode & Beauté</option>
              <option value="food">🍔 Restauration & Food</option>
              <option value="beauty">💄 Soins & Cosmétiques</option>
              <option value="electronics">📱 Électronique & High-Tech</option>
              <option value="artisan">🛠️ Artisanat & Fait Main</option>
              <option value="services">💼 Prestations de Services</option>
              <option value="digital">📚 Produits Digitaux & Formations</option>
              <option value="home">🏠 Maison & Décoration</option>
              <option value="grocery">🛒 Épicerie & Supérette</option>
              <option value="health">💊 Santé & Bien-être</option>
              <option value="auto">🚗 Auto-Moto & Pièces</option>
              <option value="other">📦 Autre Commerce</option>
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Adresse</span>
            <input
              className="h-12 rounded-xl bg-black/40 border border-white/10 px-4 text-white focus:border-vendeur-emerald outline-none transition-all"
              value={localMerchant?.address || ""}
              onChange={e => setLocalMerchant({...localMerchant, address: e.target.value})}
            />
          </label>
        </div>
      </section>

      <section className="bg-vendeur-coal border border-white/10 p-8 rounded-[2.5rem] space-y-6">
        <h2 className="text-xl font-black">Configuration de l'IA</h2>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-vendeur-emerald">Personnalité</h3>
            <div className="flex gap-4">
               {["friendly", "professional", "premium"].map(p => (
                 <button
                   key={p}
                   onClick={() => updateAiMutation.mutate(p)}
                   disabled={updateAiMutation.isPending}
                   className={cn("px-6 py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all",
                   merchant?.aiSettings?.personality === p ? "bg-vendeur-emerald border-vendeur-emerald text-vendeur-coal" : "border-white/10 text-white/40 hover:border-white/20")}>
                   {p}
                 </button>
               ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-vendeur-emerald">Connexions Multi-Canal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <InstagramConfig merchant={merchant} />
               <TikTokConfig merchant={merchant} />
            </div>

            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-vendeur-emerald mt-8">Connexion WhatsApp</h3>
            <WhatsAppConnectionFlow
              merchant={{ ...merchant, systemSettings }}
              qrCode={qrCode || null}
              onInitBaileys={() => connectMutation.mutate()}
              onRefreshMerchant={() => queryClient.invalidateQueries({ queryKey: ["dashboard"] })}
            />
          </div>
        </div>
      </section>

      {/* SECTION : NOTIFICATIONS */}
      <section className="bg-vendeur-coal border border-white/10 p-8 rounded-[2.5rem] space-y-6">
        <div className="flex items-center gap-3">
           <Zap className="text-amber-400" size={24} />
           <h2 className="text-xl font-black">Alertes Mobile</h2>
        </div>
        <p className="text-sm text-white/40 leading-relaxed">
          Recevez une notification instantanée dès qu'un client paie ou demande une assistance humaine.
        </p>
        <button
          onClick={async () => {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              await subscribeToPush(accessToken || "");
              toast.success("Alertes activées ! 🔔");
            } else {
              toast.error("Permission refusée.");
            }
          }}
          className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-8 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
        >
          <Bot size={18} /> Activer les Notifications Push
        </button>
      </section>

      <section className="bg-vendeur-emerald/10 border border-vendeur-emerald/20 p-8 rounded-[2.5rem] flex items-center justify-between">
        <div>
           <h3 className="text-xl font-black text-vendeur-emerald">Pack Pro Clé en Main</h3>
           <p className="text-sm text-vendeur-emerald/60 mt-1">Vous n'avez pas le temps ? Un expert configure tout pour vous.</p>
        </div>
        <button
          onClick={() => (window as any).openPackPro()}
          className="h-12 px-8 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          Découvrir
        </button>
      </section>
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

function InstagramConfig({ merchant }: { merchant: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    pageId: merchant?.instagramConfig?.pageId || "",
    accessToken: merchant?.instagramConfig?.accessToken || ""
  });
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.patch("/api/commerce/merchant", { instagramConfig: data });
    },
    onSuccess: () => {
      toast.success("Instagram configuré ! 📸");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const isConnected = !!merchant?.instagramConfig?.pageId;

  return (
    <div className="p-6 bg-vendeur-bg border border-white/5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/20 text-pink-500">
            <Instagram size={20} />
          </div>
          <div>
            <p className="font-bold text-sm">Instagram</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">{isConnected ? "Connecté" : "DMs & Commentaires"}</p>
          </div>
        </div>
        {isConnected && <CheckCircle2 className="text-vendeur-emerald" size={16} />}
      </div>

      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-full py-3 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all",
            isConnected ? "bg-white/5 text-white/40 hover:bg-white/10" : "bg-pink-500 text-white hover:bg-pink-600"
          )}
        >
          {isConnected ? "Modifier la connexion" : "Lier Instagram Business"}
        </button>
      ) : (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
          <input
            className="w-full h-10 bg-vendeur-coal border border-white/10 rounded-lg px-3 text-xs text-white"
            placeholder="Page ID"
            value={config.pageId}
            onChange={e => setConfig({...config, pageId: e.target.value})}
          />
          <input
            className="w-full h-10 bg-vendeur-coal border border-white/10 rounded-lg px-3 text-xs text-white"
            placeholder="Access Token"
            value={config.accessToken}
            onChange={e => setConfig({...config, accessToken: e.target.value})}
          />
          <div className="flex gap-2">
            <button onClick={() => updateMutation.mutate(config)} className="flex-1 py-2 bg-vendeur-emerald text-vendeur-coal font-black text-[10px] uppercase rounded-lg">Sauver</button>
            <button onClick={() => setIsOpen(false)} className="px-4 py-2 bg-white/5 text-white/40 font-black text-[10px] uppercase rounded-lg">X</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TikTokConfig({ merchant }: { merchant: any }) {
  const isConnected = !!merchant?.tiktokConfig?.accessToken;

  return (
    <div className="p-6 bg-vendeur-bg border border-white/5 rounded-2xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
          <TikTokIcon size={20} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-sm">TikTok</p>
          <p className="text-[10px] text-white/40 uppercase tracking-widest">{isConnected ? "Connecté" : "DMs TikTok Shop"}</p>
        </div>
      </div>
      <button
        disabled
        className="w-full py-3 bg-white/5 text-white/20 font-black text-[10px] uppercase tracking-widest rounded-xl cursor-not-allowed"
      >
        Arrive bientôt 🚀
      </button>
    </div>
  );
}

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
  LogOut
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import axios from "axios";
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
  return money.format(value);
}

import { SalesInbox } from "../inbox/SalesInbox";

export function SalesDashboard() {
  const [tab, setTab] = useState<"home" | "products" | "inbox" | "settings">("home");
  const { accessToken, logout } = useAuthStore();
  const socket = useSocket();
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/commerce/dashboard`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
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
    <div className="min-h-screen bg-vendeur-bg text-white pb-24">
      <header className="h-16 md:h-20 border-b border-white/5 bg-vendeur-bg/80 backdrop-blur-md flex items-center justify-between px-4 md:px-12 sticky top-0 z-40 w-full gap-4">
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-vendeur-emerald/10 flex items-center justify-center border border-vendeur-emerald/20 shrink-0">
            <Bot className="text-vendeur-emerald" size={20} />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm md:text-base font-black text-white uppercase tracking-tight truncate">{merchant?.businessName || "Mon Commerce"}</p>
            <p className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-vendeur-emerald/60 font-black leading-none truncate">AI Sales Machine</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
           <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
             <User size={18} />
           </div>
           <button
             onClick={logout}
             className="h-9 w-9 md:w-auto md:px-4 rounded-xl border border-white/10 text-white/40 text-[10px] font-black uppercase hover:text-red-400 hover:border-red-400/20 transition-all flex items-center justify-center gap-2"
             title="Déconnexion"
           >
             <LogOut size={16} className="md:hidden" />
             <span className="hidden md:inline">Déconnexion</span>
           </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 pt-8 md:pt-12 space-y-8">
        <nav className="flex gap-2 p-1 bg-vendeur-coal rounded-2xl border border-white/5 w-fit">
          <TabButton active={tab === "home"} onClick={() => setTab("home")} icon={<LayoutDashboard size={18}/>} label="Stats" />
          <TabButton active={tab === "inbox"} onClick={() => setTab("inbox")} icon={<MessageCircle size={18}/>} label="Inbox" />
          <TabButton active={tab === "products"} onClick={() => setTab("products")} icon={<Package size={18}/>} label="Catalogue" />
          <TabButton active={tab === "settings"} onClick={() => setTab("settings")} icon={<Settings size={18}/>} label="Réglages" />
        </nav>

        {tab === "home" && <HomePanel dashboard={dashboard} />}
        {tab === "inbox" && <SalesInbox />}
        {tab === "products" && <ProductsPanel dashboard={dashboard} />}
        {tab === "settings" && <SettingsPanel merchant={merchant} />}
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
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={<DollarSign className="text-vendeur-emerald" />} label="Revenu Jour" value={formatAmount(dashboard?.metrics?.revenueToday || 0)} />
        <MetricCard icon={<MessageCircle className="text-blue-400" />} label="Conversations" value={String(dashboard?.metrics?.conversationsToday || 0)} />
        <MetricCard icon={<Zap className="text-amber-400" />} label="Leads Chauds" value={String(dashboard?.metrics?.hotLeads || 0)} />
        <MetricCard icon={<TrendingUp className="text-rose-400" />} label="Conversion" value="0%" />
      </div>

      <section className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8">
        <h2 className="text-xl font-black mb-6">Pipeline de Vente</h2>
        <div className="space-y-4">
          <PipelineStep label="Discussion WhatsApp" value={dashboard?.metrics?.conversationsToday || 0} max={20} color="bg-blue-400" />
          <PipelineStep label="Paiement Initié" value={0} max={20} color="bg-amber-400" />
          <PipelineStep label="Commandes Validées" value={0} max={20} color="bg-vendeur-emerald" />
        </div>
      </section>
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
      const res = await axios.post(`${API_URL}/api/commerce/products/vision`, formData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
      const res = await axios.post(`${API_URL}/api/commerce/products`, input, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
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
      await axios.delete(`${API_URL}/api/commerce/products/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
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

function SettingsPanel({ merchant }: { merchant: any }) {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const qrCode = queryClient.getQueryData<string>(["whatsapp:qr"]);

  const connectMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`${API_URL}/api/whatsapp/connect`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    },
    onSuccess: () => {
      toast.info("Initialisation de WhatsApp...");
    }
  });

  const updateAiMutation = useMutation({
    mutationFn: async (personality: string) => {
      await axios.patch(`${API_URL}/api/commerce/ai-settings`, { personality }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    },
    onSuccess: () => {
      toast.success("Personnalité mise à jour !");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-700">
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
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-vendeur-emerald">Connexion WhatsApp</h3>
            <div className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 flex items-center justify-center">
                      <MessageCircle className="text-vendeur-emerald" />
                   </div>
                   <div>
                      <p className="font-black">Lien direct QR Code</p>
                      <p className="text-xs text-white/40">Connectez votre téléphone en 5 secondes.</p>
                   </div>
                </div>
                <button
                  onClick={() => connectMutation.mutate()}
                  className="h-10 px-6 rounded-xl bg-white text-vendeur-coal text-[10px] font-black uppercase tracking-[0.15em] hover:bg-vendeur-emerald transition-all"
                >
                  Lancer
                </button>
              </div>

              {qrCode && (
                <div className="flex flex-col items-center gap-4 py-4 animate-in zoom-in-95 duration-500">
                  <div className="p-4 bg-white rounded-2xl shadow-2xl">
                    <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-xs text-white/40 flex items-center gap-2">
                    <QrCode size={14} /> Scannez ce code avec votre WhatsApp
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-vendeur-emerald/10 border border-vendeur-emerald/20 p-8 rounded-[2.5rem] flex items-center justify-between">
        <div>
           <h3 className="text-xl font-black text-vendeur-emerald">Studio IA Premium</h3>
           <p className="text-sm text-vendeur-emerald/60 mt-1">Abonnement actif jusqu'au 30/08/2026.</p>
        </div>
        <button className="h-12 px-8 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all">Gérer</button>
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-vendeur-coal border border-white/10 p-6 rounded-3xl space-y-4">
      <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</p>
        <p className="text-2xl font-black">{value}</p>
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

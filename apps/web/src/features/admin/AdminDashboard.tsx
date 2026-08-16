import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  Banknote,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Smartphone,
  AlertTriangle,
  Save,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Bot,
  ShoppingBag,
  Activity,
  Zap,
  Clock,
  AlertCircle,
  Download,
  FileSpreadsheet,
  Globe,
  Plus,
  Trash2
} from "lucide-react";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/apiClient";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { AIControlCenter } from "./components/AIControlCenter";
import { FounderTicketsInbox } from "./components/FounderTicketsInbox";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "merchants" | "tickets" | "settings" | "ai" | "billing">("overview");
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  // 0. Fetch Unread Tickets Count
  const { data: unreadTicketsData } = useQuery({
    queryKey: ["admin:copilot:tickets:unreadCount"],
    queryFn: async () => {
      const res = await apiClient.get("/api/copilot/admin/tickets?status=unread");
      return res.data;
    },
    enabled: !!accessToken,
    refetchInterval: 15000
  });
  const unreadTicketsCount = unreadTicketsData?.tickets?.length || 0;

  // 1. Fetch Admin Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin:stats"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/stats");
      return res.data;
    },
    enabled: !!accessToken,
    retry: 1,
    refetchInterval: 15000 // Refresh every 15s
  });

  // 1b. Fetch Billing Stats
  const { data: billingStats, isLoading: billingLoading } = useQuery({
    queryKey: ["admin:billing"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/billing/stats");
      return res.data;
    },
    enabled: !!accessToken && activeTab === "billing",
    retry: 1
  });

  const { data: failedJobs } = useQuery({
    queryKey: ["admin:queue:failed"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/queue/failed");
      return res.data;
    },
    enabled: !!accessToken && activeTab === "overview",
    retry: 1
  });

  // 2. Fetch All Merchants
  const { data: merchants, isLoading: merchantsLoading } = useQuery({
    queryKey: ["admin:merchants"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/merchants");
      return res.data;
    },
    enabled: !!accessToken
  });

  // 3. Fetch Global Settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin:settings"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/settings");
      return res.data;
    },
    enabled: !!accessToken
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const res = await apiClient.patch("/api/admin/settings", newSettings);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Paramètres mis à jour avec succès !");
      queryClient.invalidateQueries({ queryKey: ["admin:settings"] });
    }
  });

  if (statsLoading || settingsLoading) {
    return (
      <VendeurIALoader fullscreen size="xl" label="Chargement de l'administration..." />
    );
  }

  return (
    <div className="min-h-screen bg-vendeur-bg text-white pb-24">
      {/* Admin Header / Navigation */}
      <header className="h-16 md:h-20 border-b border-white/5 bg-vendeur-bg/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
        <div className="flex-1 max-w-2xl">
          <nav className="flex gap-1.5 md:gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 w-full md:w-fit overflow-x-auto scrollbar-hide">
            <AdminTabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<LayoutDashboard size={18}/>} label="Overview" />
            <AdminTabButton active={activeTab === "merchants"} onClick={() => setActiveTab("merchants")} icon={<Users size={18}/>} label="Merchants" />
            <AdminTabButton active={activeTab === "tickets"} onClick={() => setActiveTab("tickets")} icon={<MessageSquare size={18}/>} label="Tickets" badge={unreadTicketsCount > 0 ? unreadTicketsCount : undefined} />
            <AdminTabButton active={activeTab === "billing"} onClick={() => setActiveTab("billing")} icon={<Banknote size={18}/>} label="Finance" />
            <AdminTabButton active={activeTab === "ai"} onClick={() => setActiveTab("ai")} icon={<Bot size={18}/>} label="AI Brain" />
            <AdminTabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<Settings size={18}/>} label="System" />
          </nav>
        </div>

        <div className="hidden lg:flex items-center gap-4 ml-4">
            <div className="px-4 py-1.5 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-[10px] font-black uppercase tracking-widest text-vendeur-emerald whitespace-nowrap">
                MASTER CONTROL
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Vue d'ensemble</h2>
            <OverviewPanel stats={stats} failedJobs={failedJobs} statsLoading={statsLoading} />
          </div>
        )}
        {activeTab === "merchants" && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Marchands</h2>
            <MerchantsPanel merchants={merchants} loading={merchantsLoading} />
          </div>
        )}
        {activeTab === "tickets" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Boîte de Réception Fondateur & Tickets</h2>
              <p className="text-xs text-white/50 mt-1">Messages directs, suggestions, signalements de bugs et demandes reçus des commerçants.</p>
            </div>
            <FounderTicketsInbox />
          </div>
        )}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Système</h2>
            <SettingsPanel settings={settings} onUpdate={(data) => updateSettingsMutation.mutate(data)} isUpdating={updateSettingsMutation.isPending} />
          </div>
        )}
        {activeTab === "ai" && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">IA & Cerveau</h2>
            <AIControlCenter />
          </div>
        )}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Finance & Abonnements</h2>
            <BillingPanel data={billingStats} loading={billingLoading} />
          </div>
        )}
      </main>
    </div>
  );
}

function AdminTabButton({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-6 py-2 md:py-3 rounded-xl transition-all whitespace-nowrap",
        active ? "bg-vendeur-emerald text-vendeur-coal shadow-lg shadow-vendeur-emerald/20" : "text-white/40 hover:bg-white/5 hover:text-white"
      )}
    >
      <div className="shrink-0">{icon}</div>
      <span className="text-[7px] md:text-xs font-black uppercase tracking-[0.05em] md:tracking-widest leading-none">
        {label}
      </span>
      {badge !== undefined && (
        <span className={cn(
          "px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none",
          active ? "bg-black text-white" : "bg-emerald-500 text-black animate-pulse"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

function OverviewPanel({ stats, failedJobs, statsLoading }: { stats: any; failedJobs: any; statsLoading: boolean }) {
  const transactions = stats?.recentTransactions || [];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Marchands" value={stats?.totalMerchants || 0} icon={<Users className="text-vendeur-emerald" />} />
        <StatCard label="Sessions Actives" value={stats?.activeSessions || 0} icon={<Smartphone className="text-vendeur-emerald" />} />
        <StatCard label="Abonnements" value={`${(stats?.totalRevenue || 0).toLocaleString()} XOF`} icon={<Banknote className="text-vendeur-emerald" />} />
        <StatCard label="GMV (Ventes)" value={`${(stats?.totalGMV || 0).toLocaleString()} XOF`} icon={<ShoppingBag className="text-vendeur-emerald" />} />
        <StatCard label="Messages IA" value={stats?.totalConversations || 0} icon={<MessageSquare className="text-vendeur-emerald" />} />
        <StatCard label="Coûts IA" value={`$${(stats?.totalAiCost || 0).toFixed(2)}`} icon={<Bot className="text-vendeur-emerald" />} />
      </div>

      {/* --- QUEUE MONITORING SECTION --- */}
      <section className="bg-vendeur-coal border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
                <Activity className="text-vendeur-emerald w-5 h-5 md:w-6 md:h-6" />
                Files BullMQ
            </h2>
            <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/40">
                <RefreshCw className={cn("animate-spin w-2.5 h-2.5 md:w-3 md:h-3", statsLoading && "opacity-100")} /> Live
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            <QueueStat label="Attente" value={stats?.queue?.waiting} icon={<Clock size={12}/>} color="emerald" />
            <QueueStat label="Actifs" value={stats?.queue?.active} icon={<Zap size={12}/>} color="emerald" />
            <QueueStat label="Terminés" value={stats?.queue?.completed} icon={<CheckCircle2 size={12}/>} color="emerald" />
            <QueueStat label="Échecs" value={stats?.queue?.failed} icon={<XCircle size={12}/>} color="rose" />
            <QueueStat label="Différés" value={stats?.queue?.delayed} icon={<ExternalLink size={12}/>} color="emerald" />
          </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-vendeur-coal border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8">
            <h2 className="text-lg md:text-xl font-black mb-6 uppercase tracking-tighter">Paiements</h2>
            <div className="space-y-3">
                {transactions.length === 0 ? (
                    <div className="text-center py-8 text-white/20 uppercase text-[10px] font-black tracking-widest">Aucune transaction</div>
                ) : transactions.map((t: any) => (
                    <div key={t._id} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-vendeur-emerald/10 flex items-center justify-center">
                                <Banknote size={18} className="text-vendeur-emerald" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-tight">{t.merchantId?.businessName || 'Marchand Inconnu'}</p>
                                <p className="text-[10px] text-white/40 uppercase font-bold">{t.type?.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-vendeur-emerald">{t.amount?.toLocaleString()} {t.currency}</p>
                            <p className="text-[9px] text-white/20 uppercase font-bold">{new Date(t.paidAt || t.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8">
            <h2 className="text-xl font-black mb-6 uppercase tracking-tighter flex items-center gap-2">
                <AlertCircle className="text-rose-500" size={24} />
                Logs d'Erreurs IA
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-white/20">
                        <tr>
                            <th className="pb-4">Job</th>
                            <th className="pb-4">Erreur</th>
                            <th className="pb-4">Heure</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs">
                        {failedJobs?.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="py-8 text-center text-white/20 italic font-bold">Système sain. ✨</td>
                            </tr>
                        ) : failedJobs?.map((job: any) => (
                            <tr key={job.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="py-4 font-black">{job.name}</td>
                                <td className="py-4 text-rose-400 font-medium">{job.failedReason}</td>
                                <td className="py-4 text-white/40">{new Date(job.timestamp).toLocaleTimeString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}

function MerchantsPanel({ merchants, loading }: { merchants: any[], loading: boolean }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMerchants = merchants?.filter(m =>
    m.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.ownerId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-vendeur-coal border border-white/5 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden animate-in fade-in duration-700">
      <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter">Marchands</h2>
        <div className="flex gap-2 md:gap-4 w-full md:w-full lg:w-auto">
            <div className="relative flex-1 md:w-full lg:w-[500px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:border-vendeur-emerald outline-none transition-all"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button className="p-2.5 bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors">
                <Filter size={18} />
            </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-black/20 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              <th className="px-8 py-4">Marchand</th>
              <th className="px-8 py-4">Mode</th>
              <th className="px-8 py-4">Statut</th>
              <th className="px-8 py-4">Date Inscription</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-white/20 uppercase font-black tracking-widest">Chargement...</td></tr>
            ) : filteredMerchants?.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-white/20 uppercase font-black tracking-widest">Aucun marchand trouvé</td></tr>
            ) : filteredMerchants?.map((m) => (
              <tr key={m._id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-vendeur-emerald/10 flex items-center justify-center font-black text-vendeur-emerald uppercase">
                      {m.businessName?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-tight">{m.businessName}</p>
                      <p className="text-[10px] text-white/40 tracking-wider font-medium">{m.ownerId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase border",
                    m.whatsappConfig?.provider === 'meta' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-vendeur-emerald/10 text-vendeur-emerald border-vendeur-emerald/20"
                  )}>
                    {m.whatsappConfig?.provider || 'baileys'}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    {m.whatsappConfig?.status === 'connected' ? (
                      <><CheckCircle2 size={12} className="text-vendeur-emerald" /> <span className="text-[10px] font-black uppercase text-vendeur-emerald">Actif</span></>
                    ) : m.whatsappConfig?.status === 'error' ? (
                      <><AlertTriangle size={12} className="text-vendeur-emerald animate-pulse" /> <span className="text-[10px] font-black uppercase text-vendeur-emerald">Erreur</span></>
                    ) : (
                      <><XCircle size={12} className="text-red-500" /> <span className="text-[10px] font-black uppercase text-red-500">Inactif</span></>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-xs text-white/40 font-medium">
                  {new Date(m.createdAt).toLocaleDateString()}
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="p-2 bg-white/5 rounded-lg text-white/20 hover:text-white hover:bg-white/10 transition-all">
                    <ExternalLink size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsPanel({ settings, onUpdate, isUpdating }: { settings: any, onUpdate: (data: any) => void, isUpdating: boolean }) {
  const [formData, setFormData] = useState({
    supportWhatsApp: settings?.supportWhatsApp || "",
    "pricing.ramContributionFee": settings?.pricing?.ramContributionFee || 5000,
    "pricing.packProFee": settings?.pricing?.packProFee || 25000,
    "pricing.premiumSubscriptionMonthly": settings?.pricing?.premiumSubscriptionMonthly || 5000,
    "pricing.regional": settings?.pricing?.regional || [],
    "metaConfig.whatsappDefaults.phoneNumberId": settings?.metaConfig?.whatsappDefaults?.phoneNumberId || "",
    "metaConfig.whatsappDefaults.accessToken": settings?.metaConfig?.whatsappDefaults?.accessToken || ""
  });

  const addRegionalPricing = () => {
    const newRegional = [...formData["pricing.regional"], { currency: "GHS", premiumMonthly: 100, businessMonthly: 500, packPro: 500, ramFee: 100 }];
    setFormData({ ...formData, "pricing.regional": newRegional });
  };

  const removeRegionalPricing = (index: number) => {
    const newRegional = formData["pricing.regional"].filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, "pricing.regional": newRegional });
  };

  const updateRegionalField = (index: number, field: string, value: any) => {
    const newRegional = [...formData["pricing.regional"]];
    newRegional[index] = { ...newRegional[index], [field]: value };
    setFormData({ ...formData, "pricing.regional": newRegional });
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-700 pb-12">
      <section className="bg-vendeur-coal border border-white/5 p-8 rounded-[2.5rem] space-y-8">
        <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Settings size={24} className="text-vendeur-emerald" />
            Paramètres Plateforme
        </h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Numéro WhatsApp Support (Pack Pro)</label>
            <input
              className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-white focus:border-vendeur-emerald outline-none transition-all font-bold"
              value={formData.supportWhatsApp}
              onChange={e => setFormData({...formData, supportWhatsApp: e.target.value})}
              placeholder="+2250700000000"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Premium (Base XOF)</label>
                <input
                    type="number"
                    className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-white focus:border-vendeur-emerald outline-none font-bold"
                    value={formData["pricing.premiumSubscriptionMonthly"]}
                    onChange={e => setFormData({...formData, "pricing.premiumSubscriptionMonthly": Number(e.target.value)})}
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Frais RAM (Baileys)</label>
                <input
                    type="number"
                    className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-white focus:border-vendeur-emerald outline-none font-bold"
                    value={formData["pricing.ramContributionFee"]}
                    onChange={e => setFormData({...formData, "pricing.ramContributionFee": Number(e.target.value)})}
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Prix Pack Pro</label>
                <input
                    type="number"
                    className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-white focus:border-vendeur-emerald outline-none font-bold"
                    value={formData["pricing.packProFee"]}
                    onChange={e => setFormData({...formData, "pricing.packProFee": Number(e.target.value)})}
                />
            </div>
          </div>

          {/* REGIONAL PRICING */}
          <div className="pt-6 border-t border-white/5 space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                    <Globe size={14} className="text-vendeur-emerald" />
                    Tarification Régionale (Multi-Devises)
                </h3>
                <button
                    onClick={addRegionalPricing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-vendeur-emerald/10 text-vendeur-emerald rounded-lg text-[9px] font-black uppercase border border-vendeur-emerald/20 hover:bg-vendeur-emerald hover:text-vendeur-coal transition-all"
                >
                    <Plus size={12} /> Ajouter
                </button>
             </div>

             <div className="space-y-4">
                {formData["pricing.regional"].map((reg: any, idx: number) => (
                    <div key={idx} className="p-6 bg-black/40 border border-white/5 rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-4 relative group">
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-white/20 uppercase">Devise</label>
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-vendeur-emerald outline-none"
                                value={reg.currency}
                                onChange={e => updateRegionalField(idx, 'currency', e.target.value.toUpperCase())}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-white/20 uppercase">Premium</label>
                            <input
                                type="number"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none"
                                value={reg.premiumMonthly}
                                onChange={e => updateRegionalField(idx, 'premiumMonthly', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-white/20 uppercase">Business</label>
                            <input
                                type="number"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none"
                                value={reg.businessMonthly}
                                onChange={e => updateRegionalField(idx, 'businessMonthly', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-white/20 uppercase">Pack Pro</label>
                            <input
                                type="number"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none"
                                value={reg.packPro}
                                onChange={e => updateRegionalField(idx, 'packPro', Number(e.target.value))}
                            />
                        </div>
                        <div className="flex items-end pb-1">
                            <button
                                onClick={() => removeRegionalPricing(idx)}
                                className="p-2 text-white/20 hover:text-rose-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {formData["pricing.regional"].length === 0 && (
                    <div className="text-center py-6 text-white/10 text-[10px] font-black uppercase tracking-widest border border-dashed border-white/5 rounded-2xl">
                        Aucune règle régionale définie
                    </div>
                )}
             </div>
          </div>

          {/* WhatsApp Cloud Defaults */}
          <div className="pt-6 border-t border-white/5 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                <MessageSquare size={14} className="text-blue-400" />
                WhatsApp Cloud (Défauts Système)
            </h3>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Default Phone Number ID</label>
                <input
                    className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-white focus:border-vendeur-emerald outline-none transition-all font-mono text-[10px]"
                    value={formData["metaConfig.whatsappDefaults.phoneNumberId"]}
                    onChange={e => setFormData({...formData, "metaConfig.whatsappDefaults.phoneNumberId": e.target.value})}
                    placeholder="Ex: 106345..."
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Default System Access Token</label>
                <textarea
                    className="w-full min-h-[100px] bg-black/40 border border-white/10 rounded-2xl p-6 text-white focus:border-vendeur-emerald outline-none transition-all font-mono text-[10px] resize-none"
                    value={formData["metaConfig.whatsappDefaults.accessToken"]}
                    onChange={e => setFormData({...formData, "metaConfig.whatsappDefaults.accessToken": e.target.value})}
                    placeholder="EAAG..."
                />
                <p className="text-[9px] text-white/20 ml-1 uppercase font-bold tracking-wider italic">Utilisé par les marchands en Mode Pro sans clé personnalisée.</p>
            </div>
          </div>

          <button
            onClick={() => onUpdate(formData)}
            disabled={isUpdating}
            className="w-full h-16 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest rounded-[2rem] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50 shadow-xl shadow-vendeur-emerald/20"
          >
            {isUpdating ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
            Enregistrer les Modifications
          </button>
        </div>
      </section>

      <div className="bg-vendeur-emerald/5 border border-vendeur-emerald/20 p-6 rounded-[2rem] flex items-center gap-4">
        <Bot className="text-vendeur-emerald shrink-0" size={24} />
        <p className="text-[10px] text-vendeur-emerald/60 font-bold leading-relaxed uppercase tracking-wider">
            Attention : Toute modification ici impacte immédiatement l'ensemble des commerçants et la rentabilité de la plateforme.
        </p>
      </div>
    </div>
  );
}

function QueueStat({ label, value, icon, color }: any) {
  const colors: any = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    amber: "text-vendeur-emerald bg-vendeur-emerald/10 border-vendeur-emerald/20",
    rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    vendeur: "text-vendeur-emerald bg-vendeur-emerald/10 border-vendeur-emerald/20",
  };
  return (
    <div className={cn("p-4 rounded-2xl border text-center space-y-1", color === 'emerald' ? colors.vendeur : colors[color])}>
       <div className="flex justify-center opacity-40">{icon}</div>
       <p className="text-xl font-black leading-none">{value || 0}</p>
       <p className="text-[8px] font-black uppercase tracking-tighter opacity-60">{label}</p>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-vendeur-coal border border-white/10 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] space-y-3 md:space-y-4 group hover:border-white/20 transition-all">
      <div className="h-10 w-10 md:h-14 md:w-14 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">{icon}</div>
      <div>
        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{label}</p>
        <p className="text-2xl md:text-4xl font-black mt-1 break-words">{value}</p>
      </div>
    </div>
  );
}

function HealthItem({ label, status }: { label: string; status: "operational" | "degraded" | "down" }) {
    return (
        <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
            <span className="text-xs font-black uppercase tracking-widest text-white/60">{label}</span>
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-vendeur-emerald animate-pulse" />
                <span className="text-[9px] font-black uppercase text-vendeur-emerald tracking-[0.1em]">Opérationnel</span>
            </div>
        </div>
    );
}

function BillingPanel({ data, loading }: { data: any, loading: boolean }) {
  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Chargement des données financières...</div>;

  const handleExport = async () => {
    try {
        const res = await apiClient.get("/api/admin/billing/export", { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'transactions-vendeur-ia.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success("Export CSV lancé !");
    } catch (err) {
        toast.error("Erreur lors de l'export.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-end">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white/60 hover:text-white"
          >
              <FileSpreadsheet size={16} className="text-vendeur-emerald" />
              Exporter (CSV)
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Estimated MRR" value={`${(data?.estimatedMRR || 0).toLocaleString()} F`} icon={<TrendingUp className="text-vendeur-emerald" />} />
        <StatCard label="Abonnés Actifs" value={(data?.planStats?.premium || 0) + (data?.planStats?.business || 0)} icon={<Zap className="text-amber-400" />} />
        <StatCard label="Churn (En retard)" value={data?.planStats?.pastDue || 0} icon={<AlertTriangle className="text-rose-500" />} />
        <StatCard label="Reconquête IA" value={data?.planStats?.reconquestReady || 0} icon={<RefreshCw className="text-sky-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8">
          <h3 className="text-xl font-black mb-6 uppercase tracking-tight flex items-center gap-2">
            <Activity size={20} className="text-vendeur-emerald" />
            Revenus Mensuels (6 derniers mois)
          </h3>
          <div className="space-y-4">
            {data?.revenueByMonth?.map((m: any) => (
              <div key={m._id} className="flex items-center gap-4">
                <div className="w-24 text-[10px] font-black uppercase text-white/40">{m._id}</div>
                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-vendeur-emerald transition-all duration-1000"
                    style={{ width: `${Math.min(100, (m.total / (data.estimatedMRR || 1)) * 100)}%` }}
                  />
                </div>
                <div className="w-32 text-right font-black text-sm">{m.total.toLocaleString()} F</div>
              </div>
            ))}
            {(!data?.revenueByMonth || data.revenueByMonth.length === 0) && (
              <div className="text-center py-8 text-white/20 italic font-bold">Données insuffisantes pour l'historique</div>
            )}
          </div>
        </div>

        <div className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8">
          <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Répartition Plans</h3>
          <div className="space-y-6">
            <PlanRatio label="Starter / Trial" value={data?.planStats?.starter + data?.planStats?.trial} total={data?.planStats?.starter + data?.planStats?.trial + data?.planStats?.premium + data?.planStats?.business} color="bg-white/10" />
            <PlanRatio label="Premium" value={data?.planStats?.premium} total={data?.planStats?.starter + data?.planStats?.trial + data?.planStats?.premium + data?.planStats?.business} color="bg-amber-400" />
            <PlanRatio label="Business" value={data?.planStats?.business} total={data?.planStats?.starter + data?.planStats?.trial + data?.planStats?.premium + data?.planStats?.business} color="bg-blue-400" />
          </div>
        </div>
      </div>

      <div className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8">
        <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Historique Transactions Récent</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-white/20">
                <th className="pb-4">Marchand</th>
                <th className="pb-4">Type</th>
                <th className="pb-4">Montant</th>
                <th className="pb-4">Statut</th>
                <th className="pb-4">Date</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {data?.recentTransactions?.map((t: any) => (
                <tr key={t._id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-4 font-black uppercase">{t.merchantId?.businessName || "Inconnu"}</td>
                  <td className="py-4 opacity-60 uppercase font-bold">{t.type}</td>
                  <td className="py-4 font-black text-vendeur-emerald">{t.amount.toLocaleString()} {t.currency}</td>
                  <td className="py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase",
                      t.status === 'success' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-4 text-white/20">{new Date(t.paidAt || t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PlanRatio({ label, value, total, color }: any) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span>{label}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-1000", color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

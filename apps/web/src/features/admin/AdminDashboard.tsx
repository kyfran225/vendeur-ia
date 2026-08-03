import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  Banknote,
  MessageSquare,
  ShieldCheck,
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
  AlertCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/apiClient";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "merchants" | "settings">("overview");
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  // 1. Fetch Admin Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin:stats"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/stats");
      return res.data;
    },
    enabled: !!accessToken,
    refetchInterval: 10000 // Refresh every 10s
  });

  const { data: failedJobs } = useQuery({
    queryKey: ["admin:queue:failed"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/queue/failed");
      return res.data;
    },
    enabled: !!accessToken && activeTab === "overview"
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
      <div className="flex h-screen items-center justify-center bg-vendeur-bg">
        <Loader2 className="animate-spin text-vendeur-emerald" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vendeur-bg text-white pb-24">
      {/* Admin Header */}
      <header className="h-16 border-b border-white/5 bg-vendeur-bg/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <ShieldCheck className="text-amber-500" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tighter">Master Control</h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-black leading-none">Vendeur IA Platform Governance</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40">
                Mode Cofondateur
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Admin Navigation */}
        <nav className="flex gap-2 p-1 bg-vendeur-coal rounded-2xl border border-white/5 w-fit">
          <AdminTabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={<LayoutDashboard size={18}/>} label="Vue d'ensemble" />
          <AdminTabButton active={activeTab === "merchants"} onClick={() => setActiveTab("merchants")} icon={<Users size={18}/>} label="Marchands" />
          <AdminTabButton active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<Settings size={18}/>} label="Système" />
        </nav>

        {activeTab === "overview" && <OverviewPanel stats={stats} failedJobs={failedJobs} statsLoading={statsLoading} />}
        {activeTab === "merchants" && <MerchantsPanel merchants={merchants} loading={merchantsLoading} />}
        {activeTab === "settings" && <SettingsPanel settings={settings} onUpdate={(data) => updateSettingsMutation.mutate(data)} isUpdating={updateSettingsMutation.isPending} />}
      </main>
    </div>
  );
}

function AdminTabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
        active ? "bg-amber-500 text-vendeur-coal shadow-lg shadow-amber-500/20" : "text-white/40 hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function OverviewPanel({ stats, failedJobs, statsLoading }: { stats: any; failedJobs: any; statsLoading: boolean }) {
  const transactions = stats?.recentTransactions || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Marchands" value={stats?.totalMerchants || 0} icon={<Users className="text-amber-500" />} />
        <StatCard label="Sessions Actives" value={stats?.activeSessions || 0} icon={<Smartphone className="text-vendeur-emerald" />} />
        <StatCard label="Abonnements (CA)" value={`${(stats?.totalRevenue || 0).toLocaleString()} XOF`} icon={<Banknote className="text-amber-500" />} />
        <StatCard label="GMV (Ventes IA)" value={`${(stats?.totalGMV || 0).toLocaleString()} XOF`} icon={<ShoppingBag className="text-emerald-400" />} />
        <StatCard label="Messages IA" value={stats?.totalConversations || 0} icon={<MessageSquare className="text-blue-400" />} />
        <StatCard label="Coûts IA (Est.)" value={`$${(stats?.totalAiCost || 0).toFixed(2)}`} icon={<Bot className="text-rose-400" />} />
      </div>

      {/* --- QUEUE MONITORING SECTION --- */}
      <section className="bg-vendeur-coal border border-white/10 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black flex items-center gap-2">
                <Activity className="text-vendeur-emerald" size={24} />
                Santé des Files d'Attente (BullMQ)
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
                <RefreshCw className={cn("animate-spin", statsLoading && "opacity-100")} size={12} /> Temps Réel
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <QueueStat label="En Attente" value={stats?.queue?.waiting} icon={<Clock size={14}/>} color="amber" />
            <QueueStat label="Actifs" value={stats?.queue?.active} icon={<Zap size={14}/>} color="sky" />
            <QueueStat label="Terminés" value={stats?.queue?.completed} icon={<CheckCircle2 size={14}/>} color="emerald" />
            <QueueStat label="Échecs" value={stats?.queue?.failed} icon={<XCircle size={14}/>} color="rose" />
            <QueueStat label="Différés" value={stats?.queue?.delayed} icon={<ExternalLink size={14}/>} color="purple" />
          </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8">
            <h2 className="text-xl font-black mb-6 uppercase tracking-tighter">Derniers Paiements</h2>
            <div className="space-y-4">
                {transactions.length === 0 ? (
                    <div className="text-center py-8 text-white/20 uppercase text-[10px] font-black tracking-widest">Aucune transaction</div>
                ) : transactions.map((t: any) => (
                    <div key={t._id} className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Banknote size={18} className="text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-tight">{t.merchantId?.businessName || 'Marchand Inconnu'}</p>
                                <p className="text-[10px] text-white/40 uppercase font-bold">{t.type?.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-amber-500">{t.amount?.toLocaleString()} {t.currency}</p>
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
  return (
    <div className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] overflow-hidden animate-in fade-in duration-700">
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-xl font-black uppercase tracking-tighter">Gestion des Marchands</h2>
        <div className="flex gap-4">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input className="bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:border-amber-500 outline-none w-64" placeholder="Rechercher un marchand..." />
            </div>
            <button className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors">
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
            ) : merchants?.map((m) => (
              <tr key={m._id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center font-black text-amber-500 uppercase">
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
                      <><AlertTriangle size={12} className="text-amber-500 animate-pulse" /> <span className="text-[10px] font-black uppercase text-amber-500">Erreur</span></>
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
    "metaConfig.whatsappDefaults.phoneNumberId": settings?.metaConfig?.whatsappDefaults?.phoneNumberId || "",
    "metaConfig.whatsappDefaults.accessToken": settings?.metaConfig?.whatsappDefaults?.accessToken || ""
  });

  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in duration-700 pb-12">
      <section className="bg-vendeur-coal border border-white/5 p-8 rounded-[2.5rem] space-y-8">
        <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Settings size={24} className="text-amber-500" />
            Paramètres Plateforme
        </h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Numéro WhatsApp Support (Pack Pro)</label>
            <input
              className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-white focus:border-amber-500 outline-none transition-all font-bold"
              value={formData.supportWhatsApp}
              onChange={e => setFormData({...formData, supportWhatsApp: e.target.value})}
              placeholder="+2250700000000"
            />
            <p className="text-[9px] text-white/20 ml-1 uppercase font-bold tracking-wider italic">Ce numéro recevra les leads "Pack Pro Clé en Main".</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Frais RAM (Baileys)</label>
                <div className="relative">
                    <input
                        type="number"
                        className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl pl-6 pr-12 text-white focus:border-amber-500 outline-none font-bold"
                        value={formData["pricing.ramContributionFee"]}
                        onChange={e => setFormData({...formData, "pricing.ramContributionFee": Number(e.target.value)})}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20">XOF</span>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Prix Pack Pro</label>
                <div className="relative">
                    <input
                        type="number"
                        className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl pl-6 pr-12 text-white focus:border-amber-500 outline-none font-bold"
                        value={formData["pricing.packProFee"]}
                        onChange={e => setFormData({...formData, "pricing.packProFee": Number(e.target.value)})}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20">XOF</span>
                </div>
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
                    className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-white focus:border-amber-500 outline-none transition-all font-mono text-[10px]"
                    value={formData["metaConfig.whatsappDefaults.phoneNumberId"]}
                    onChange={e => setFormData({...formData, "metaConfig.whatsappDefaults.phoneNumberId": e.target.value})}
                    placeholder="Ex: 106345..."
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Default System Access Token</label>
                <textarea
                    className="w-full min-h-[100px] bg-black/40 border border-white/10 rounded-2xl p-6 text-white focus:border-amber-500 outline-none transition-all font-mono text-[10px] resize-none"
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
            className="w-full h-16 bg-amber-500 text-vendeur-coal font-black uppercase tracking-widest rounded-[2rem] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50 shadow-xl shadow-amber-500/20"
          >
            {isUpdating ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
            Enregistrer les Modifications
          </button>
        </div>
      </section>

      <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-[2rem] flex items-center gap-4">
        <Bot className="text-amber-500 shrink-0" size={24} />
        <p className="text-[10px] text-amber-500/60 font-bold leading-relaxed uppercase tracking-wider">
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
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };
  return (
    <div className={cn("p-4 rounded-2xl border text-center space-y-1", colors[color])}>
       <div className="flex justify-center opacity-40">{icon}</div>
       <p className="text-xl font-black leading-none">{value || 0}</p>
       <p className="text-[8px] font-black uppercase tracking-tighter opacity-60">{label}</p>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-vendeur-coal border border-white/10 p-8 rounded-[2.5rem] space-y-4 group hover:border-white/20 transition-all">
      <div className="h-14 w-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{label}</p>
        <p className="text-4xl font-black mt-1">{value}</p>
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

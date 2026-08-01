import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  DollarSign,
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
  Bot
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/apiClient";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

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
    }
  });

  // 2. Fetch All Merchants
  const { data: merchants, isLoading: merchantsLoading } = useQuery({
    queryKey: ["admin:merchants"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/merchants");
      return res.data;
    }
  });

  // 3. Fetch Global Settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin:settings"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/settings");
      return res.data;
    }
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

        {activeTab === "overview" && <OverviewPanel stats={stats} />}
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

function OverviewPanel({ stats }: { stats: any }) {
  const transactions = stats?.recentTransactions || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Marchands" value={stats?.totalMerchants || 0} icon={<Users className="text-amber-500" />} />
        <StatCard label="Sessions Actives" value={stats?.activeSessions || 0} icon={<Smartphone className="text-vendeur-emerald" />} />
        <StatCard label="Revenu Plateforme" value={`${(stats?.totalRevenue || 0).toLocaleString()} XOF`} icon={<DollarSign className="text-amber-500" />} />
        <StatCard label="Messages IA" value={stats?.totalConversations || 0} icon={<MessageSquare className="text-blue-400" />} />
      </div>

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
                                <DollarSign size={18} className="text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-tight">{t.merchantId?.businessName || 'Marchand Inconnu'}</p>
                                <p className="text-[10px] text-white/40 uppercase font-bold">{t.type.replace('_', ' ')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-amber-500">{t.amount.toLocaleString()} {t.currency}</p>
                            <p className="text-[9px] text-white/20 uppercase font-bold">{new Date(t.paidAt || t.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8">
            <h2 className="text-xl font-black mb-6 uppercase tracking-tighter">Santé de la Plateforme</h2>
            <div className="space-y-4">
                <HealthItem label="API Cloud Meta" status="operational" />
                <HealthItem label="Moteur AI (Gemini/Groq)" status="operational" />
                <HealthItem label="Paiements Paystack" status="operational" />
            </div>
            <div className="mt-8 bg-amber-500/5 rounded-3xl p-6 border border-amber-500/10 flex flex-col justify-center items-center text-center space-y-4">
                <ShieldCheck size={32} className="text-amber-500/40" />
                <p className="text-[10px] text-amber-500/60 font-black uppercase tracking-widest max-w-xs leading-relaxed">
                    Plateforme sécurisée. Toutes les transactions sont vérifiées par signature HMAC.
                </p>
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
    "pricing.packProFee": settings?.pricing?.packProFee || 25000
  });

  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in duration-700">
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

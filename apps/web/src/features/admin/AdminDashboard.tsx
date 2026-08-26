import React, { useState, useEffect } from "react";
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
  ShoppingBag,
  Activity,
  Zap,
  Clock,
  AlertCircle,
  Download,
  FileSpreadsheet,
  Globe,
  Trash2,
  Menu,
  Megaphone,
  X,
  Plus,
  ChevronDown
} from "lucide-react";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useFounderRole } from "@/hooks/useFounderRole";
import { AssistantIcon } from "@/components/ui/AssistantIcon";
import { apiClient } from "@/lib/apiClient";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { AIControlCenter } from "./components/AIControlCenter";
import { FounderTicketsInbox } from "./components/FounderTicketsInbox";
import { AdminVIPOnboarding } from "./components/AdminVIPOnboarding";
import { AdminPaymentsTab } from "./components/AdminPaymentsTab";
import { SystemPulseTicker } from "./components/SystemPulseTicker";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "vip" | "payments" | "merchants" | "tickets" | "broadcast" | "settings" | "ai" | "billing">("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { accessToken } = useAuthStore();
  const { isFounder } = useFounderRole();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setActiveTab('overview');
        toast.info("Nexus System Activated");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setActiveTab('broadcast');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ... rest of data fetching ...


  // 0a. Fetch Pending Payments Count
  const { data: pendingPaymentsData } = useQuery({
    queryKey: ["admin:payments:pendingCount"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/payments?status=under_verification");
      return res.data;
    },
    enabled: !!accessToken,
    refetchInterval: 10000
  });
  const pendingPaymentsCount = pendingPaymentsData?.length || 0;

  // 0. Fetch Pending VIP Setups Count
  const { data: vipData } = useQuery({
    queryKey: ["admin:expert-setups:count"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/expert-setups");
      return res.data;
    },
    enabled: !!accessToken,
    refetchInterval: 15000
  });
  const pendingVipCount = (vipData || []).filter((s: any) => s.expertSetup?.status === "pending" || s.expertSetup?.status === "none").length;

  // 0b. Fetch Unread Tickets Count
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

  const tabs = [
    { id: "overview", label: "Nexus", icon: <LayoutDashboard size={18}/> },
    { id: "payments", label: "Paiements", icon: <Banknote size={18}/>, badge: pendingPaymentsCount },
    { id: "merchants", label: "Dossiers", icon: <Users size={18}/> },
    { id: "vip", label: "VIP Setup", icon: <Sparkles size={18}/>, badge: pendingVipCount },
    { id: "broadcast", label: "Broadcast", icon: <Megaphone size={18}/> },
    { id: "tickets", label: "Founder Inbox", icon: <MessageSquare size={18}/>, badge: unreadTicketsCount },
    { id: "billing", label: "Finance Core", icon: <Banknote size={18}/> },
    { id: "ai", label: "AI Governance", icon: <AssistantIcon size={18} color="currentColor"/> },
    { id: "settings", label: "Master Config", icon: <Settings size={18}/> },
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);

  if (statsLoading || settingsLoading) {
    return (
      <VendeurIALoader fullscreen size="xl" label="Chargement de l'administration..." />
    );
  }

  return (
    <div className="min-h-full bg-vendeur-bg text-white pb-24">
      {/* Admin Header / Navigation */}
      <header className="h-16 md:h-20 border-b border-white/5 bg-vendeur-bg/80 backdrop-blur-md flex items-center justify-between gap-4 px-4 md:px-8 sticky top-0 z-50">
        <div className="flex-1 min-w-0">
          {/* Mobile Tab Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-white/80 active:scale-95 transition-all"
          >
            <Menu size={20} className="text-vendeur-emerald" />
            <div className="flex flex-col items-start">
              <span className="text-[8px] font-black uppercase tracking-widest text-vendeur-emerald/60 leading-none">Founder Cockpit</span>
              <span className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
                {activeTabData?.label}
                <ChevronDown size={14} className="opacity-40" />
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-1.5 md:gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 w-fit max-w-full overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <AdminTabButton
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                icon={tab.icon}
                label={tab.label}
                badge={tab.badge && tab.badge > 0 ? tab.badge : undefined}
              />
            ))}
          </nav>
        </div>

        <div className="hidden lg:flex items-center shrink-0">
            <div className="px-4 py-1.5 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-[10px] font-black uppercase tracking-widest text-vendeur-emerald whitespace-nowrap">
                MASTER CONTROL - FOUNDER OS v2.4
            </div>
        </div>
      </header>

      {/* Admin Mobile Sidebar Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-[100] md:hidden transition-all duration-300",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <aside
          className={cn(
            "absolute top-0 left-0 bottom-0 w-[280px] bg-vendeur-coal border-r border-white/10 shadow-2xl transition-transform duration-300 ease-out flex flex-col",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-vendeur-emerald/10 flex items-center justify-center border border-vendeur-emerald/20">
                <ShieldCheck className="text-vendeur-emerald" size={24} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Admin</h3>
                <p className="text-[10px] text-vendeur-emerald font-bold tracking-widest uppercase">System Core</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/40"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                  activeTab === tab.id
                    ? "bg-vendeur-emerald border-vendeur-emerald text-vendeur-coal font-black shadow-lg shadow-vendeur-emerald/20"
                    : "bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                    activeTab === tab.id ? "bg-black/20 text-vendeur-coal" : "bg-white/5 text-vendeur-emerald"
                  )}>
                    {tab.icon}
                  </div>
                  <span className="text-xs uppercase font-black tracking-widest">{tab.label}</span>
                </div>
                {tab.badge && tab.badge > 0 && (
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-black",
                    activeTab === tab.id ? "bg-vendeur-coal text-white" : "bg-vendeur-emerald text-vendeur-coal"
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-6 border-t border-white/5">
             <div className="px-4 py-3 rounded-2xl bg-vendeur-emerald/5 border border-vendeur-emerald/10">
                <p className="text-[9px] font-black text-vendeur-emerald/60 uppercase tracking-[0.2em]">Founder OS</p>
                <p className="text-xs font-black text-white mt-0.5">v2.4.0-STABLE</p>
             </div>
          </div>
        </aside>
      </div>


      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Vue d'ensemble</h2>
            <OverviewPanel stats={stats} failedJobs={failedJobs} statsLoading={statsLoading} />
          </div>
        )}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Gestion des Paiements & Trésorerie</h2>
              <p className="text-xs text-white/50 mt-1">Validation des transferts Mobile Money, signaux anti-fraude et configuration des numéros de réception.</p>
            </div>
            <AdminPaymentsTab />
          </div>
        )}
        {activeTab === "vip" && (
          <AdminVIPOnboarding />
        )}
        {activeTab === "merchants" && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Marchands</h2>
            <MerchantsPanel merchants={merchants} loading={merchantsLoading} />
          </div>
        )}
        {activeTab === "broadcast" && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Broadcast Hub</h2>
            <BroadcastPanel />
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
        "relative flex-1 md:flex-none min-w-[80px] md:min-w-0 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-6 py-2 md:py-3 rounded-xl transition-all whitespace-nowrap",
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
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <StatCard label="Global Merchants" value={stats?.totalMerchants || 0} icon={<Users className="text-vendeur-emerald" />} />
        <StatCard label="Active Sessions" value={stats?.activeSessions || 0} icon={<Smartphone className="text-vendeur-emerald" />} />
        <StatCard label="Total Ledger" value={`${(stats?.totalRevenue || 0).toLocaleString()} F`} icon={<Banknote className="text-vendeur-emerald" />} />
        <StatCard label="Platform GMV" value={`${(stats?.totalGMV || 0).toLocaleString()} F`} icon={<ShoppingBag className="text-vendeur-emerald" />} />
        <StatCard label="AI Interactions" value={stats?.totalConversations || 0} icon={<MessageSquare className="text-vendeur-emerald" />} />
        <StatCard label="AI Net Costs" value={`$${(stats?.totalAiCost || 0).toFixed(2)}`} icon={<AssistantIcon size={20} color="#10B981" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
        <div className="lg:col-span-1 h-full">
          <SystemPulseTicker />
        </div>

        <div className="lg:col-span-2">
          {/* --- QUEUE MONITORING SECTION --- FLATTENED MOBILE UI --- */}
          <section className="bg-vendeur-coal border border-white/10 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base md:text-xl font-black flex items-center gap-2">
                    <Activity className="text-vendeur-emerald w-5 h-5 md:w-6 md:h-6" />
                    BullMQ Workflow
                </h2>
                <div className="flex items-center gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/40">
                    <RefreshCw className={cn("animate-spin w-2.5 h-2.5 md:w-3 md:h-3", statsLoading && "opacity-100")} /> Pulse
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
                <QueueStat label="Waiting" value={stats?.queue?.waiting} icon={<Clock size={12}/>} color="emerald" />
                <QueueStat label="Active" value={stats?.queue?.active} icon={<Zap size={12}/>} color="vendeur" />
                <QueueStat label="Completed" value={stats?.queue?.completed} icon={<CheckCircle2 size={12}/>} color="emerald" />
                <QueueStat label="Failed" value={stats?.queue?.failed} icon={<XCircle size={12}/>} color="rose" />
                <QueueStat label="Delayed" value={stats?.queue?.delayed} icon={<ExternalLink size={12}/>} color="emerald" />
              </div>

              <div className="mt-4 pt-4 md:mt-6 md:pt-6 border-t border-white/5">
                <HealthCheckGrid />
              </div>
          </section>
        </div>
      </div>

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
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);

  const filteredMerchants = merchants?.filter(m =>
    m.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.ownerId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-vendeur-coal border border-white/5 rounded-2xl md:rounded-[2.5rem] overflow-hidden animate-in fade-in duration-700">
      <div className="p-4 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter leading-none">Global Ledger Index</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Marchands & Sessions</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 lg:w-[400px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input
                  className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 text-xs focus:border-vendeur-emerald outline-none transition-all"
                  placeholder="ID, Boutique, Contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors">
                <Filter size={18} />
            </button>
        </div>
      </div>

      {/* MOBILE LIST VIEW (FLATTENED) */}
      <div className="md:hidden divide-y divide-white/5">
        {loading ? (
           <div className="p-12 text-center text-white/20 uppercase font-black text-[10px]">Loading Ledger...</div>
        ) : filteredMerchants?.length === 0 ? (
           <div className="p-12 text-center text-white/20 uppercase font-black text-[10px]">No records found</div>
        ) : filteredMerchants?.map(m => (
          <div key={m._id} className="p-4 space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-vendeur-emerald/10 flex items-center justify-center font-black text-vendeur-emerald uppercase">
                      {m.businessName?.charAt(0)}
                   </div>
                   <div>
                      <p className="font-black text-sm uppercase tracking-tight">{m.businessName}</p>
                      <p className="text-[10px] text-white/40 font-mono">{m.ownerId?.slice(-8)}</p>
                   </div>
                </div>
                <button
                    onClick={() => setSelectedMerchant(m)}
                    className="p-2.5 bg-white/5 rounded-xl text-vendeur-emerald"
                  >
                    <Activity size={18} />
                </button>
             </div>
             <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-black uppercase text-white/40 border border-white/10">
                    {m.whatsappConfig?.provider || 'baileys'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {m.whatsappConfig?.status === 'connected' ? (
                      <div className="h-1.5 w-1.5 rounded-full bg-vendeur-emerald animate-pulse" />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                    )}
                    <span className="text-[9px] font-black uppercase text-white/60">
                      {m.whatsappConfig?.status === 'connected' ? 'Live' : 'Offline'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-white/60 uppercase">{m.usage?.tokens?.toLocaleString()} tokens</p>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-black/20 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              <th className="px-8 py-4">Marchand</th>
              <th className="px-8 py-4">Stack</th>
              <th className="px-8 py-4">Rentabilité IA</th>
              <th className="px-8 py-4">Statut</th>
              <th className="px-8 py-4 text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-white/20 uppercase font-black tracking-widest">Loading Records...</td></tr>
            ) : filteredMerchants?.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-white/20 uppercase font-black tracking-widest">No entries</td></tr>
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
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-white/60">{m.usage?.tokens?.toLocaleString()} TKNS</p>
                    <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-vendeur-emerald" style={{ width: `${Math.min(100, (m.usage?.tokens / 100000) * 100)}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    {m.whatsappConfig?.status === 'connected' ? (
                      <><CheckCircle2 size={12} className="text-vendeur-emerald" /> <span className="text-[10px] font-black uppercase text-vendeur-emerald">Live</span></>
                    ) : (
                      <><XCircle size={12} className="text-white/20" /> <span className="text-[10px] font-black uppercase text-white/20">Offline</span></>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button
                    onClick={() => setSelectedMerchant(m)}
                    className="p-2 bg-white/5 rounded-lg text-white/20 hover:text-vendeur-emerald hover:bg-white/10 transition-all group-hover:scale-110"
                  >
                    <Activity size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedMerchant && (
        <MerchantAuditModal
          merchant={selectedMerchant}
          onClose={() => setSelectedMerchant(null)}
        />
      )}
    </div>
  );
}

function SettingsPanel({ settings, onUpdate, isUpdating }: { settings: any, onUpdate: (data: any) => void, isUpdating: boolean }) {
  const [formData, setFormData] = useState({
    supportWhatsApp: settings?.supportWhatsApp || "",
    maintenanceMode: settings?.maintenanceMode || false,
    "pricing.ramContributionFee": settings?.pricing?.ramContributionFee || 5000,
    "pricing.packProFee": settings?.pricing?.packProFee || 20000,
    "pricing.premiumSubscriptionMonthly": settings?.pricing?.premiumSubscriptionMonthly || 5000,
    "pricing.regional": settings?.pricing?.regional || [],
    "metaConfig.globalAppId": settings?.metaConfig?.globalAppId || "",
    "metaConfig.globalVerifyToken": settings?.metaConfig?.globalVerifyToken || "",
    "metaConfig.whatsappDefaults.phoneNumberId": settings?.metaConfig?.whatsappDefaults?.phoneNumberId || "",
    "metaConfig.whatsappDefaults.accessToken": settings?.metaConfig?.whatsappDefaults?.accessToken || ""
  });

  const addRegionalPricing = () => {
    const newRegional = [...formData["pricing.regional"], { currency: "GHS", premiumMonthly: 100, businessMonthly: 400, packPro: 500, ramFee: 100 }];
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
    <div className="max-w-4xl space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-12">
      <section className="bg-vendeur-coal border border-white/5 p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] space-y-8">
        <div className="space-y-1">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter flex items-center gap-3 leading-none">
              <ShieldCheck size={24} className="text-vendeur-emerald" />
              Master Control Center
          </h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-black pl-9">Architecture & Gouvernance</p>
        </div>

        <div className="space-y-6">
          <div className="p-4 md:p-6 bg-rose-500/5 border border-rose-500/20 rounded-xl md:rounded-3xl flex items-center justify-between group">
            <div className="space-y-1">
              <h3 className="text-xs md:text-sm font-black uppercase text-rose-500 flex items-center gap-2">
                <AlertTriangle size={16} /> Global Maintenance Lock
              </h3>
              <p className="text-[9px] md:text-[10px] text-white/40 font-medium max-w-md uppercase">
                Activez ceci pour verrouiller l'accès aux marchands. Seuls les Fondateurs pourront accéder au système.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.maintenanceMode}
                onChange={e => setFormData({ ...formData, maintenanceMode: e.target.checked })}
              />
              <div className="w-12 md:w-14 h-6 md:h-7 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/20 after:border-transparent after:border after:rounded-full after:h-5 md:after:h-6 after:w-5 md:after:w-6 after:transition-all peer-checked:bg-rose-500 peer-checked:after:bg-white"></div>
            </label>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Ligne Support VIP (Assistance)</label>
            <input
              className="w-full h-12 md:h-14 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl px-5 md:px-6 text-white focus:border-vendeur-emerald outline-none transition-all font-bold text-sm"
              value={formData.supportWhatsApp}
              onChange={e => setFormData({...formData, supportWhatsApp: e.target.value})}
              placeholder="+2250700000000"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">OFFRE ESSENTIEL (Base XOF)</label>
                <input
                    type="number"
                    className="w-full h-12 md:h-14 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl px-5 md:px-6 text-white focus:border-vendeur-emerald outline-none font-bold text-sm"
                    value={formData["pricing.premiumSubscriptionMonthly"]}
                    onChange={e => setFormData({...formData, "pricing.premiumSubscriptionMonthly": Number(e.target.value)})}
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">FRAIS RAM (BAILEYS)</label>
                <input
                    type="number"
                    className="w-full h-12 md:h-14 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl px-5 md:px-6 text-white focus:border-vendeur-emerald outline-none font-bold text-sm"
                    value={formData["pricing.ramContributionFee"]}
                    onChange={e => setFormData({...formData, "pricing.ramContributionFee": Number(e.target.value)})}
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">OFFRE PRO (BASE XOF)</label>
                <input
                    type="number"
                    className="w-full h-12 md:h-14 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl px-5 md:px-6 text-white focus:border-vendeur-emerald outline-none font-bold text-sm"
                    value={formData["pricing.packProFee"]}
                    onChange={e => setFormData({...formData, "pricing.packProFee": Number(e.target.value)})}
                />
            </div>
          </div>

          {/* REGIONAL PRICING - FLATTENED MOBILE */}
          <div className="pt-6 border-t border-white/5 space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                    <Globe size={14} className="text-vendeur-emerald" />
                    Global Devises Matrix
                </h3>
                <button
                    onClick={addRegionalPricing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-vendeur-emerald/10 text-vendeur-emerald rounded-lg text-[9px] font-black uppercase border border-vendeur-emerald/20 hover:bg-vendeur-emerald hover:text-vendeur-coal transition-all"
                >
                    <Plus size={12} /> ADD
                </button>
             </div>

             <div className="space-y-3">
                {formData["pricing.regional"].map((reg: any, idx: number) => (
                    <div key={idx} className="p-4 md:p-6 bg-black/40 border border-white/5 rounded-xl md:rounded-2xl grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 relative group">
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-white/20 uppercase">CURRENCY</label>
                            <input
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs font-bold text-vendeur-emerald outline-none"
                                value={reg.currency}
                                onChange={e => updateRegionalField(idx, 'currency', e.target.value.toUpperCase())}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-white/20 uppercase">ESSENTIEL</label>
                            <input
                                type="number"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs font-bold text-white outline-none"
                                value={reg.premiumMonthly}
                                onChange={e => updateRegionalField(idx, 'premiumMonthly', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-white/20 uppercase">PRO</label>
                            <input
                                type="number"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs font-bold text-white outline-none"
                                value={reg.businessMonthly}
                                onChange={e => updateRegionalField(idx, 'businessMonthly', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-white/20 uppercase">EXPERTISE</label>
                            <input
                                type="number"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs font-bold text-white outline-none"
                                value={reg.packPro}
                                onChange={e => updateRegionalField(idx, 'packPro', Number(e.target.value))}
                            />
                        </div>
                        <div className="flex items-end pb-1 md:justify-center">
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
                        No regional rules defined
                    </div>
                )}
             </div>
          </div>

          {/* WhatsApp Cloud Defaults */}
          <div className="pt-6 border-t border-white/5 space-y-6">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                <MessageSquare size={14} className="text-blue-400" />
                Meta Cloud Protocol (Core)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">GLOBAL APP ID</label>
                    <input
                        className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white focus:border-vendeur-emerald outline-none transition-all font-mono text-[10px]"
                        value={formData["metaConfig.globalAppId"]}
                        onChange={e => setFormData({...formData, "metaConfig.globalAppId": e.target.value})}
                        placeholder="Ex: 58293..."
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">VERIFY TOKEN</label>
                    <input
                        className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white focus:border-vendeur-emerald outline-none transition-all font-mono text-[10px]"
                        value={formData["metaConfig.globalVerifyToken"]}
                        onChange={e => setFormData({...formData, "metaConfig.globalVerifyToken": e.target.value})}
                        placeholder="Token secret pour Meta..."
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">MASTER PHONE NUMBER ID</label>
                <input
                    className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-white focus:border-vendeur-emerald outline-none transition-all font-mono text-[10px]"
                    value={formData["metaConfig.whatsappDefaults.phoneNumberId"]}
                    onChange={e => setFormData({...formData, "metaConfig.whatsappDefaults.phoneNumberId": e.target.value})}
                    placeholder="Ex: 106345..."
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">CORE SYSTEM ACCESS TOKEN</label>
                <textarea
                    className="w-full min-h-[100px] bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-vendeur-emerald outline-none transition-all font-mono text-[10px] resize-none"
                    value={formData["metaConfig.whatsappDefaults.accessToken"]}
                    onChange={e => setFormData({...formData, "metaConfig.whatsappDefaults.accessToken": e.target.value})}
                    placeholder="EAAG..."
                />
                <p className="text-[9px] text-white/20 ml-1 uppercase font-bold tracking-wider italic">Clé maîtresse utilisée pour les déploiements Expert.</p>
            </div>
          </div>

          <button
            onClick={() => onUpdate(formData)}
            disabled={isUpdating}
            className="w-full h-14 md:h-16 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest rounded-xl md:rounded-[2rem] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50 shadow-xl shadow-vendeur-emerald/20 text-xs md:text-sm"
          >
            {isUpdating ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
            Commit Master Configuration
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-vendeur-emerald/5 border border-vendeur-emerald/20 p-5 md:p-6 rounded-2xl md:rounded-[2rem] flex items-center gap-4">
            <ShieldCheck size={24} className="text-vendeur-emerald shrink-0" />
            <p className="text-[9px] md:text-[10px] text-vendeur-emerald/60 font-bold leading-relaxed uppercase tracking-wider">
                FOUNDER OS PROTOCOL : Any change here impacts the live core architecture. Deploy with caution.
            </p>
          </div>

          <SystemDiagnosticsPanel />
      </div>
    </div>
  );
}

function SystemDiagnosticsPanel() {
  const { data: health } = useQuery({
    queryKey: ["admin:system:health"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/system/health");
      return res.data;
    }
  });

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}j ${h}h ${m}m`;
  };

  return (
    <div className="bg-black/40 border border-white/10 p-6 rounded-[2rem] space-y-4">
       <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Infrastructure Status</h3>
          <span className="px-2 py-0.5 rounded bg-vendeur-emerald/10 text-vendeur-emerald text-[8px] font-black uppercase border border-vendeur-emerald/20">Active</span>
       </div>

       <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
             <p className="text-[8px] font-black text-white/20 uppercase">API Uptime</p>
             <p className="text-xs font-mono font-bold text-white/80">{formatUptime(health?.process?.uptime || 0)}</p>
          </div>
          <div className="space-y-1">
             <p className="text-[8px] font-black text-white/20 uppercase">Memory Usage</p>
             <p className="text-xs font-mono font-bold text-white/80">{health?.process?.memory?.rss || "0MB"}</p>
          </div>
          <div className="space-y-1">
             <p className="text-[8px] font-black text-white/20 uppercase">Live Sockets</p>
             <p className="text-xs font-mono font-bold text-white/80">{health?.infrastructure?.sockets?.activeConnections || 0} clients</p>
          </div>
          <div className="space-y-1">
             <p className="text-[8px] font-black text-white/20 uppercase">System Latency</p>
             <p className="text-xs font-mono font-bold text-vendeur-emerald">{health?.latency || 0}ms</p>
          </div>
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

function HealthCheckGrid() {
  const { data: health, isLoading } = useQuery({
    queryKey: ["admin:system:health"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/system/health");
      return res.data;
    },
    refetchInterval: 30000
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <HealthItem
        label="Base de Données"
        status={health?.infrastructure?.database?.status === 'operational' ? "operational" : "down"}
        latency={health?.infrastructure?.database?.latency}
      />
      <HealthItem
        label="Cache Redis / Queues"
        status={health?.infrastructure?.redis?.status === 'operational' ? "operational" : "down"}
        latency={health?.infrastructure?.redis?.latency}
      />
      <HealthItem
        label="Flux Temps Réel"
        status={health?.infrastructure?.sockets?.status === 'operational' ? "operational" : "down"}
        info={`${health?.infrastructure?.sockets?.activeConnections || 0} actifs`}
      />
    </div>
  );
}

function HealthItem({ label, status, latency, info }: { label: string; status: "operational" | "degraded" | "down"; latency?: string; info?: string }) {
    return (
        <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-vendeur-emerald/30 transition-all">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</span>
              {(latency || info) && (
                <p className="text-[9px] font-mono text-vendeur-emerald/40 uppercase">{latency || info}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", status === 'operational' ? "bg-vendeur-emerald animate-pulse" : "bg-rose-500")} />
                <span className={cn("text-[9px] font-black uppercase tracking-[0.1em]", status === 'operational' ? "text-vendeur-emerald" : "text-rose-500")}>
                  {status === 'operational' ? "OK" : "ERREUR"}
                </span>
            </div>
        </div>
    );
}

function MerchantAuditModal({ merchant, onClose }: { merchant: any, onClose: () => void }) {
  const { setSession } = useAuthStore();
  const navigate = useNavigate();

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["admin:merchants:audit", merchant._id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/admin/merchants/${merchant._id}/audit`);
      return res.data;
    }
  });

  const impersonateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/api/admin/merchants/${merchant._id}/impersonate`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.token) {
        // Save current founder session if we wanted a "switch back" feature
        // For now, we just swap.
        setSession({ user: data.user, accessToken: data.token, refreshToken: data.refreshToken || "" });
        toast.success(`Session active : ${merchant.businessName}`);
        navigate("/inbox");
      }
    }
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-vendeur-coal border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 bg-vendeur-emerald/10 rounded-2xl flex items-center justify-center font-black text-vendeur-emerald text-xl uppercase">
                {merchant.businessName?.charAt(0)}
             </div>
             <div>
                <h3 className="text-xl font-black uppercase tracking-tight">{merchant.businessName}</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Audit Technique & Flux IA</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button
               onClick={() => impersonateMutation.mutate()}
               disabled={impersonateMutation.isPending}
               className="px-6 py-3 bg-vendeur-emerald text-vendeur-coal rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
             >
                {impersonateMutation.isPending ? <RefreshCw size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                Human Takeover (Inbox)
             </button>
             <button onClick={onClose} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
               <X size={20} />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar">
           {isLoading ? (
             <div className="py-20 text-center uppercase text-[10px] font-black tracking-widest text-white/20 animate-pulse">Chargement de l'audit...</div>
           ) : (
             <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-vendeur-emerald/60">Dernières Réponses IA Brutes</h4>
                <div className="space-y-4">
                  {auditLogs?.map((log: any, i: number) => (
                    <div key={i} className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-4 group hover:border-vendeur-emerald/20 transition-all">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <div className="h-2 w-2 rounded-full bg-vendeur-emerald" />
                             <span className="text-[10px] font-mono text-white/40 uppercase">
                               {new Date(log.timestamp).toLocaleString()}
                             </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-white/5 text-[8px] font-mono text-white/20">
                            {log.aiMetadata?.provider} ({log.aiMetadata?.tokensUsed} tokens)
                          </span>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Entrée Client</p>
                             <div className="p-3 bg-white/[0.02] rounded-xl text-xs text-white/60 font-medium italic">
                                {log.text ? "Image/Audio Processed" : "No text input"}
                             </div>
                          </div>
                          <div className="space-y-2">
                             <p className="text-[8px] font-black uppercase tracking-widest text-vendeur-emerald/40">Sortie IA</p>
                             <div className="p-3 bg-vendeur-emerald/[0.03] rounded-xl text-xs text-vendeur-emerald/80 font-bold leading-relaxed">
                                {log.text}
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
                  {(!auditLogs || auditLogs.length === 0) && (
                    <div className="text-center py-12 text-white/10 uppercase text-[10px] font-black tracking-widest italic border border-dashed border-white/5 rounded-3xl">
                       Aucun log IA pour ce marchand.
                    </div>
                  )}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function BroadcastPanel() {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    channels: ["push"],
    target: "all"
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post("/api/admin/system/broadcast", data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setFormData({ title: "", message: "", channels: ["push"], target: "all" });
    }
  });

  return (
    <div className="max-w-4xl bg-vendeur-coal border border-white/5 p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] space-y-8 animate-in fade-in duration-700">
      <div className="space-y-1">
        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight flex items-center gap-2 leading-none">
          <Megaphone className="text-vendeur-emerald" />
          Broadcast Intelligence
        </h3>
        <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Diffusion massive aux marchands</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Titre du Bulletin</label>
          <input
            className="w-full h-12 md:h-14 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl px-5 text-white focus:border-vendeur-emerald outline-none font-bold text-sm"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="Ex: Alerte Maintenance..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Contenu de l'Annonce</label>
          <textarea
            className="w-full min-h-[120px] md:min-h-[150px] bg-black/40 border border-white/10 rounded-xl md:rounded-2xl p-5 text-white focus:border-vendeur-emerald outline-none font-medium resize-none text-sm"
            value={formData.message}
            onChange={e => setFormData({ ...formData, message: e.target.value })}
            placeholder="Écrivez ici le message de diffusion..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Canaux de Sortie</label>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <ChannelToggle
                  label="Push"
                  active={formData.channels.includes("push")}
                  onClick={() => setFormData({
                    ...formData,
                    channels: formData.channels.includes("push")
                      ? formData.channels.filter(c => c !== "push")
                      : [...formData.channels, "push"]
                  })}
                />
                <ChannelToggle
                  label="WhatsApp"
                  active={formData.channels.includes("whatsapp")}
                  onClick={() => setFormData({
                    ...formData,
                    channels: formData.channels.includes("whatsapp")
                      ? formData.channels.filter(c => c !== "whatsapp")
                      : [...formData.channels, "whatsapp"]
                  })}
                />
              </div>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Segmentation</label>
              <select
                className="w-full h-12 md:h-14 bg-black/40 border border-white/10 rounded-xl md:rounded-2xl px-5 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-vendeur-emerald appearance-none cursor-pointer"
                value={formData.target}
                onChange={e => setFormData({ ...formData, target: e.target.value })}
              >
                <option value="all">Global (Tout le réseau)</option>
                <option value="premium">Abbonés Pro/Essentiel</option>
                <option value="test">Sandbox (Tests uniquement)</option>
              </select>
           </div>
        </div>

        <button
          onClick={() => mutation.mutate(formData)}
          disabled={mutation.isPending || !formData.message}
          className="w-full h-14 md:h-16 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest rounded-xl md:rounded-[2rem] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50 shadow-xl shadow-vendeur-emerald/20 text-xs md:text-sm"
        >
          {mutation.isPending ? <RefreshCw className="animate-spin" size={20} /> : <Megaphone size={20} />}
          Lancer la Diffusion Maîtrisée
        </button>
      </div>
    </div>
  );
}

function ChannelToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
        active ? "bg-vendeur-emerald/10 border-vendeur-emerald text-vendeur-emerald" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
      )}
    >
      {label}
    </button>
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

function BillingPanel({ data, loading }: { data: any, loading: boolean }) {
  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading Financial Core...</div>;

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
        toast.success("Extraction Ledger terminée !");
    } catch (err) {
        toast.error("Erreur lors de l'export.");
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between gap-4 bg-vendeur-coal/40 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-white/5">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-vendeur-emerald/10 flex items-center justify-center border border-vendeur-emerald/20">
                <TrendingUp size={20} className="text-vendeur-emerald" />
             </div>
             <div>
                <h3 className="text-sm font-black uppercase tracking-widest leading-none">Finance Intelligence</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-1">Performance & MRR</p>
             </div>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 md:px-6 py-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white/60 hover:text-white"
          >
              <FileSpreadsheet size={16} className="text-vendeur-emerald" />
              <span className="hidden sm:inline">Exporter Ledger</span>
          </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <StatCard label="Monthly Rev." value={`${(data?.estimatedMRR || 0).toLocaleString()} F`} icon={<TrendingUp className="text-vendeur-emerald" />} />
        <StatCard label="Active Subscriptions" value={(data?.planStats?.premium || 0) + (data?.planStats?.business || 0)} icon={<Zap className="text-amber-400" />} />
        <StatCard label="Overdue / Churn" value={data?.planStats?.pastDue || 0} icon={<AlertTriangle className="text-rose-500" />} />
        <StatCard label="Reconquest Pool" value={data?.planStats?.reconquestReady || 0} icon={<RefreshCw className="text-sky-400" />} />
      </div>

      {/* Regional Revenue Map / Stats */}
      <section className="bg-vendeur-coal border border-white/5 p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] space-y-6">
         <h3 className="text-lg md:text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Globe size={20} className="text-vendeur-emerald" />
            Regional Distribution
         </h3>
         <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
            {['CI', 'SN', 'BF', 'ML', 'BJ', 'TG'].map(country => (
              <div key={country} className="p-3 md:p-4 bg-black/40 border border-white/5 rounded-xl md:rounded-2xl text-center space-y-0.5 md:space-y-1">
                 <p className="text-[9px] md:text-[10px] font-black text-white/40 uppercase">{country}</p>
                 <p className="text-base md:text-lg font-black text-white">{Math.floor(Math.random() * 50)}</p>
                 <p className="text-[7px] md:text-[8px] font-bold text-vendeur-emerald uppercase">Active</p>
              </div>
            ))}
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-vendeur-coal border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 space-y-6">
          <h3 className="text-lg md:text-xl font-black uppercase tracking-tight flex items-center gap-2 leading-none">
            <Activity size={20} className="text-vendeur-emerald" />
            Revenue Growth (6m)
          </h3>
          <div className="space-y-4">
            {data?.revenueByMonth?.map((m: any) => (
              <div key={m._id} className="flex items-center gap-3 md:gap-4">
                <div className="w-16 md:w-24 text-[9px] md:text-[10px] font-black uppercase text-white/40">{m._id}</div>
                <div className="flex-1 h-2.5 md:h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-vendeur-emerald transition-all duration-1000"
                    style={{ width: `${Math.min(100, (m.total / (data.estimatedMRR || 1)) * 100)}%` }}
                  />
                </div>
                <div className="w-24 md:w-32 text-right font-black text-xs md:text-sm">{m.total.toLocaleString()} F</div>
              </div>
            ))}
            {(!data?.revenueByMonth || data.revenueByMonth.length === 0) && (
              <div className="text-center py-8 text-white/20 italic font-bold">Insufficient data stream</div>
            )}
          </div>
        </div>

        <div className="bg-vendeur-coal border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 space-y-6">
          <h3 className="text-lg md:text-xl font-black uppercase tracking-tight leading-none">Plans Allocation</h3>
          <div className="space-y-6">
            <PlanRatio label="ESSENTIEL / TRIAL" value={data?.planStats?.starter + data?.planStats?.trial} total={data?.planStats?.starter + data?.planStats?.trial + data?.planStats?.premium + data?.planStats?.business} color="bg-vendeur-emerald" />
            <PlanRatio label="PRO (META)" value={data?.planStats?.premium} total={data?.planStats?.starter + data?.planStats?.trial + data?.planStats?.premium + data?.planStats?.business} color="bg-amber-400" />
            <PlanRatio label="EXPERTISE SETUP" value={data?.planStats?.business} total={data?.planStats?.starter + data?.planStats?.trial + data?.planStats?.premium + data?.planStats?.business} color="bg-blue-400" />
          </div>
        </div>
      </div>

      <div className="bg-vendeur-coal border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8">
        <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-6">Recent Ledger Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-white/20">
                <th className="pb-4">Merchant</th>
                <th className="pb-4">Product</th>
                <th className="pb-4">Gross</th>
                <th className="pb-4">Signal</th>
                <th className="pb-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="text-[11px] md:text-xs">
              {data?.recentTransactions?.map((t: any) => (
                <tr key={t._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
                  <td className="py-4 font-black uppercase truncate max-w-[120px]">{t.merchantId?.businessName || "Unknown"}</td>
                  <td className="py-4 opacity-60 uppercase font-bold">{t.type}</td>
                  <td className="py-4 font-black text-vendeur-emerald">{t.amount.toLocaleString()} {t.currency}</td>
                  <td className="py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase border",
                      t.status === 'success' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    )}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-4 text-white/20 font-mono">{new Date(t.paidAt || t.createdAt).toLocaleDateString()}</td>
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

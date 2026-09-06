import React, { useState } from "react";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import {
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  Phone,
  MessageCircle,
  Save,
  Loader2,
  RefreshCw,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  Settings2,
  X,
  Copy,
  Check,
  ShieldCheck,
  Key,
  SendHorizontal
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";
import { useAuthStore } from "@/stores/authStore";
import { useFounderRole } from "@/hooks/useFounderRole";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ExpertSetupItem {
  _id: string;
  businessName: string;
  slug: string;
  whatsappNumber?: string;
  userEmail?: string;
  userName?: string;
  expertSetup: {
    status: "none" | "pending" | "in_progress" | "completed";
    orderedAt?: string;
    completedAt?: string;
    assignedTo?: string;
    notes?: string;
    lastFollowUpAt?: string;
    followUpCount?: number;
  };
  transaction?: {
    reference?: string;
    amount?: number;
    currency?: string;
    paidAt?: string;
  } | null;
  whatsappStatus?: string;
  provider?: string;
  metaConfig?: {
    phoneNumberId?: string;
    accessToken?: string;
    wabaId?: string;
  };
}

function KPICard({ label, value, icon, color }: any) {
  const colors: any = {
    amber: "border-amber-500/30 text-amber-600 dark:text-amber-400",
    blue: "border-blue-500/30 text-blue-600 dark:text-blue-400",
    emerald: "border-emerald-500/30 text-emerald-600 dark:text-vendeur-emerald",
    rose: "border-rose-500/30 text-rose-600 dark:text-rose-400",
    default: "border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40"
  };
  return (
    <div className={cn("p-4 rounded-2xl bg-white dark:bg-vendeur-coal/80 border space-y-1 shadow-sm hover:shadow-md dark:shadow-xl transition-all", colors[color] || colors.default)}>
       <div className="flex items-center justify-between opacity-70">
          <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
          {icon}
       </div>
       <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export function AdminVIPOnboarding() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const { isFounder } = useFounderRole();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [assignedEdits, setAssignedEdits] = useState<Record<string, string>>({});
  const [notesEdits, setNotesEdits] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Selected merchant for Meta Cloud Configuration Modal
  const [metaModalItem, setMetaModalItem] = useState<ExpertSetupItem | null>(null);
  const [metaForm, setMetaForm] = useState({
    phoneNumberId: "",
    accessToken: "",
    wabaId: ""
  });

  // 1. Fetch all VIP Onboarding dossiers
  const { data: setups = [], isLoading, refetch, isRefetching } = useQuery<ExpertSetupItem[]>({
    queryKey: ["admin:expert-setups"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/expert-setups");
      return res.data;
    },
    enabled: !!accessToken && isFounder,
    refetchInterval: 15000
  });

  // 2. Fetch System Settings for Support/Alert Number
  const { data: settings } = useQuery({
    queryKey: ["admin:settings"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/settings");
      return res.data;
    },
    enabled: !!accessToken && isFounder
  });

  // 3. Mutation to update status, technician, notes, or meta credentials
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await apiClient.patch(`/api/admin/expert-setups/${id}`, payload);
      return res.data;
    },
    onSuccess: (data, variables) => {
      if (variables.payload.status === "completed") {
        toast.success("Installation VIP clôturée ! Le commerçant a été notifié par WhatsApp et Push.");
      } else if (variables.payload.status === "in_progress") {
        toast.info("Dossier passé En cours de traitement.");
      } else if (variables.payload.metaConfig) {
        toast.success("Identifiants Meta Cloud enregistrés et validés !");
        setMetaModalItem(null);
      } else {
        toast.success("Mise à jour enregistrée avec succès.");
      }
      queryClient.invalidateQueries({ queryKey: ["admin:expert-setups"] });
      queryClient.invalidateQueries({ queryKey: ["admin:expert-setups:count"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Erreur lors de la mise à jour du dossier.");
    }
  });

  // 4. Mutation to send automated smart reminder to merchant
  const remindMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/api/admin/expert-setups/${id}/remind`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Relance bienveillante envoyée au marchand !");
      queryClient.invalidateQueries({ queryKey: ["admin:expert-setups"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || "Erreur lors de l'envoi de la relance.");
    }
  });

  // Computed Stats
  const totalOrders = setups.length;
  const pendingCount = setups.filter((s) => s.expertSetup?.status === "pending" || s.expertSetup?.status === "none").length;
  const inProgressCount = setups.filter((s) => s.expertSetup?.status === "in_progress").length;
  const completedCount = setups.filter((s) => s.expertSetup?.status === "completed").length;
  const totalRevenue = setups.reduce((acc, curr) => acc + (curr.transaction?.amount || 25000), 0);

  // Filtered List
  const filteredSetups = setups.filter((item) => {
    const status = item.expertSetup?.status || "pending";
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "pending" && (status === "pending" || status === "none")) ||
      (filterStatus === "in_progress" && status === "in_progress") ||
      (filterStatus === "completed" && status === "completed");

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.businessName?.toLowerCase().includes(query) ||
      item.userName?.toLowerCase().includes(query) ||
      item.userEmail?.toLowerCase().includes(query) ||
      item.whatsappNumber?.toLowerCase().includes(query) ||
      item.expertSetup?.assignedTo?.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const handleUpdate = (id: string, payload: any) => {
    updateMutation.mutate({ id, payload });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copié dans le presse-papiers !");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openMetaModal = (item: ExpertSetupItem) => {
    setMetaModalItem(item);
    setMetaForm({
      phoneNumberId: item.metaConfig?.phoneNumberId || "",
      accessToken: item.metaConfig?.accessToken || "",
      wabaId: item.metaConfig?.wabaId || ""
    });
  };

  const openWhatsAppChat = (item: ExpertSetupItem) => {
    const rawNumber = item.whatsappNumber || "";
    const cleanNumber = rawNumber.replace(/[^0-9]/g, "");
    const technicianName = assignedEdits[item._id] || item.expertSetup?.assignedTo || "l'équipe technique";
    const message = encodeURIComponent(
      `Bonjour ${item.userName || item.businessName} ! 👋\n\nJe suis ${technicianName} de l'équipe Vendeur IA.\nJe prends en charge votre installation VIP Pack Pro pour configurer votre API WhatsApp Meta officielle.\n\nÊtes-vous disponible pour que nous commencions la configuration ensemble ?`
    );
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Header & Quick stats - Flattened */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-amber-400/10 text-amber-500 dark:text-amber-400 border border-amber-400/20">
            <Sparkles size={20} />
          </span>
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
              Expertise Setup Protocol
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-white/40 font-black uppercase tracking-widest mt-1">
              Installation Expert & Meta Cloud Deployment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={cn("text-vendeur-emerald", (isLoading || isRefetching) && "animate-spin")} />
            Sync Pulse
          </button>
        </div>
      </div>

      {/* KPI Stats Grid - Flattened */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard label="Total Assets" value={totalOrders} icon={<Building2 size={14}/>} />
        <KPICard label="Awaiting" value={pendingCount} icon={<Clock size={14}/>} color="amber" />
        <KPICard label="Active Ops" value={inProgressCount} icon={<RefreshCw size={14}/>} color="blue" />
        <KPICard label="Deployed" value={completedCount} icon={<CheckCircle2 size={14}/>} color="emerald" />
        <KPICard label="Expertise Gross" value={`${totalRevenue.toLocaleString()} F`} icon={<DollarSign size={14}/>} color="emerald" />
      </div>

      {/* Filter and Search Bar - Flattened */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-vendeur-coal/80 p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md dark:shadow-xl transition-all">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: "Awaiting" },
            { id: "in_progress", label: "Ops" },
            { id: "completed", label: "Ready" }
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setFilterStatus(s.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                filterStatus === s.id ? "bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-white/30 hover:text-slate-800 dark:hover:text-white"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" />
          <input
            type="text"
            placeholder="Search Target records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:border-vendeur-emerald outline-none"
          />
        </div>
      </div>

      {/* Main List - Flattened for mobile */}
      {isLoading ? (
        <div className="py-24 flex items-center justify-center">
          <VendeurIALoader size="lg" label="Chargement des installations VIP..." />
        </div>
      ) : filteredSetups.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-vendeur-coal/80 border border-slate-200 dark:border-white/10 rounded-2xl md:rounded-3xl p-8 shadow-sm hover:shadow-md dark:shadow-xl transition-all">
          <AlertCircle size={32} className="text-slate-300 dark:text-white/10 mx-auto mb-2" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">Empty Protocol Buffer</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSetups.map((item) => {
            const currentStatus = item.expertSetup?.status || "pending";
            const currentAssigned =
              assignedEdits[item._id] !== undefined
                ? assignedEdits[item._id]
                : item.expertSetup?.assignedTo || "";
            const hasMetaConfig = Boolean(item.metaConfig?.phoneNumberId && item.metaConfig?.accessToken);

            return (
              <div
                key={item._id}
                className={cn(
                  "bg-white dark:bg-vendeur-coal/90 border rounded-2xl md:rounded-3xl p-4 md:p-6 transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-xl text-slate-900 dark:text-white",
                  (currentStatus === "pending" || currentStatus === "none")
                    ? "border-amber-500/40 dark:border-amber-500/30"
                    : currentStatus === "in_progress"
                    ? "border-blue-500/40 dark:border-blue-500/30"
                    : "border-slate-200 dark:border-white/10 opacity-90"
                )}
              >
                <div className="flex flex-col lg:flex-row gap-5">
                  {/* Left: Merchant Info - No nested card */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center font-black text-amber-500 dark:text-amber-400 text-lg uppercase">
                        {item.businessName?.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {item.businessName}
                          </h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[8px] font-black uppercase tracking-widest text-slate-600 dark:text-white/40",
                            currentStatus === "in_progress" && "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/5",
                            currentStatus === "completed" && "text-emerald-600 dark:text-vendeur-emerald border-emerald-500/30 bg-emerald-500/5"
                          )}>
                            {currentStatus}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-white/40 font-bold uppercase tracking-wider truncate max-w-[200px]">
                          {item.userName} • {item.userEmail}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase text-slate-600 dark:text-white/60">
                      <div className="flex items-center gap-1.5 font-mono text-emerald-700 dark:text-vendeur-emerald bg-emerald-50 dark:bg-black/40 px-2 py-1 rounded-lg border border-emerald-200/50 dark:border-transparent">
                        <Phone size={12} />
                        <span>{item.whatsappNumber}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 dark:text-white/40">
                        <Calendar size={12} />
                        <span>{new Date(item.expertSetup?.orderedAt || '').toLocaleDateString()}</span>
                      </div>
                      {hasMetaConfig && (
                         <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[8px] font-black border border-blue-500/20">META READY</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Technical Ops - Flattened for mobile */}
                  <div className="lg:w-[450px] space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Assign Technician..."
                          value={currentAssigned}
                          onChange={(e) => setAssignedEdits({ ...assignedEdits, [item._id]: e.target.value })}
                          className="h-10 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs text-slate-900 dark:text-white focus:border-vendeur-emerald outline-none font-bold"
                        />
                        <div className="flex gap-2">
                           <button
                             onClick={() => handleUpdate(item._id, { assignedTo: currentAssigned })}
                             className="flex-1 h-10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/5 transition-all cursor-pointer"
                           >
                             Save
                           </button>
                           <button
                             onClick={() => openMetaModal(item)}
                             className="w-10 h-10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/5 cursor-pointer"
                           >
                             <Settings2 size={16} />
                           </button>
                        </div>
                     </div>

                     <div className="flex items-center gap-2">
                        <button
                          onClick={() => openWhatsAppChat(item)}
                          className="flex-1 h-10 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-700 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-500/20 cursor-pointer"
                        >
                          Direct Connect
                        </button>
                        {currentStatus !== "completed" ? (
                           <button
                             onClick={() => handleUpdate(item._id, { status: "completed" })}
                             className="flex-1 h-10 bg-vendeur-emerald text-vendeur-coal rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/20 cursor-pointer"
                           >
                             Close Dossier
                           </button>
                        ) : (
                           <button
                             onClick={() => handleUpdate(item._id, { status: "in_progress" })}
                             className="flex-1 h-10 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/40 hover:text-slate-900 dark:hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer"
                           >
                             Reopen
                           </button>
                        )}
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Meta Credentials Modal */}
      {metaModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-vendeur-coal border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    Identifiants Meta Cloud
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-white/40 font-medium">
                    {metaModalItem.businessName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMetaModalItem(null)}
                className="p-2 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                  Phone Number ID (Meta)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 108472918239102"
                  value={metaForm.phoneNumberId}
                  onChange={(e) => setMetaForm({ ...metaForm, phoneNumberId: e.target.value })}
                  className="w-full h-12 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs font-mono text-slate-900 dark:text-white focus:border-vendeur-emerald outline-none font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                  WhatsApp Business Account ID (WABA ID)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 382910492810394"
                  value={metaForm.wabaId}
                  onChange={(e) => setMetaForm({ ...metaForm, wabaId: e.target.value })}
                  className="w-full h-12 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs font-mono text-slate-900 dark:text-white focus:border-vendeur-emerald outline-none font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                  Permanent System Access Token (EAAG...)
                </label>
                <textarea
                  placeholder="EAAG..."
                  rows={3}
                  value={metaForm.accessToken}
                  onChange={(e) => setMetaForm({ ...metaForm, accessToken: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-xs font-mono text-slate-900 dark:text-white focus:border-vendeur-emerald outline-none font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMetaModalItem(null)}
                className="flex-1 h-12 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white/60 hover:text-slate-900 dark:hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdate(metaModalItem._id, {
                    metaConfig: metaForm
                  })
                }
                disabled={updateMutation.isPending}
                className="flex-1 h-12 rounded-xl bg-vendeur-emerald text-vendeur-coal text-xs font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/20 flex items-center justify-center gap-2 font-bold cursor-pointer"
              >
                {updateMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShieldCheck size={16} />
                )}
                <span>Valider & Enregistrer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

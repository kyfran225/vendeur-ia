import React, { useState } from "react";
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

export function AdminVIPOnboarding() {
  const queryClient = useQueryClient();
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
    refetchInterval: 15000
  });

  // 2. Fetch System Settings for Support/Alert Number
  const { data: settings } = useQuery({
    queryKey: ["admin:settings"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/settings");
      return res.data;
    }
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Quick stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 shadow-lg shadow-amber-400/5">
              <Sparkles size={22} />
            </span>
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">
                Onboarding VIP • Pack Pro
              </h2>
              <p className="text-xs text-white/50 font-medium mt-0.5">
                Assistance dédiée, assignation des techniciens, configuration Meta Cloud et activation officielle.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-white/60">
            <Phone size={14} className="text-vendeur-emerald" />
            <span>Alerte Admin :</span>
            <span className="font-mono font-bold text-white">
              {settings?.supportWhatsApp || "+225 07 00 00 00 00"}
            </span>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95"
          >
            <RefreshCw size={14} className={cn("text-vendeur-emerald", (isLoading || isRefetching) && "animate-spin")} />
            Actualiser
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-vendeur-coal border border-white/10 p-5 rounded-[2rem] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Dossiers</span>
            <Building2 size={16} className="text-white/40" />
          </div>
          <p className="text-3xl font-black text-white">{totalOrders}</p>
          <p className="text-[10px] text-white/40 font-semibold">Commandes Pack Pro</p>
        </div>

        <div className="bg-vendeur-coal border border-amber-500/20 p-5 rounded-[2rem] space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">En Attente</span>
            <span className="flex h-2.5 w-2.5 relative">
              {pendingCount > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              )}
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
          </div>
          <p className="text-3xl font-black text-amber-400">{pendingCount}</p>
          <p className="text-[10px] text-amber-400/60 font-semibold">À assigner en priorité</p>
        </div>

        <div className="bg-vendeur-coal border border-blue-500/20 p-5 rounded-[2rem] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">En Cours</span>
            <Clock size={16} className="text-blue-400" />
          </div>
          <p className="text-3xl font-black text-blue-400">{inProgressCount}</p>
          <p className="text-[10px] text-blue-400/60 font-semibold">Technicien en contact</p>
        </div>

        <div className="bg-vendeur-coal border border-vendeur-emerald/20 p-5 rounded-[2rem] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-vendeur-emerald">Clôturés</span>
            <CheckCircle2 size={16} className="text-vendeur-emerald" />
          </div>
          <p className="text-3xl font-black text-vendeur-emerald">{completedCount}</p>
          <p className="text-[10px] text-vendeur-emerald/60 font-semibold">Installations actives</p>
        </div>

        <div className="bg-vendeur-coal border border-white/10 p-5 rounded-[2rem] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Revenus VIP</span>
            <DollarSign size={16} className="text-vendeur-emerald" />
          </div>
          <p className="text-2xl font-black text-white">{totalRevenue.toLocaleString()} F</p>
          <p className="text-[10px] text-vendeur-emerald font-semibold">Frais d'installation Pack Pro</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-vendeur-coal border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterStatus("all")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
              filterStatus === "all" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
            )}
          >
            Tous ({setups.length})
          </button>
          <button
            onClick={() => setFilterStatus("pending")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
              filterStatus === "pending" ? "bg-amber-400 text-black font-bold" : "text-white/40 hover:text-white"
            )}
          >
            En Attente ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus("in_progress")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
              filterStatus === "in_progress" ? "bg-blue-500 text-white" : "text-white/40 hover:text-white"
            )}
          >
            En Cours ({inProgressCount})
          </button>
          <button
            onClick={() => setFilterStatus("completed")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
              filterStatus === "completed" ? "bg-vendeur-emerald text-black font-bold" : "text-white/40 hover:text-white"
            )}
          >
            Terminés ({completedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Rechercher boutique, nom, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 text-xs text-white placeholder:text-white/30 focus:border-vendeur-emerald outline-none transition-all"
          />
        </div>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="py-24 text-center space-y-4">
          <Loader2 size={36} className="animate-spin text-vendeur-emerald mx-auto" />
          <p className="text-xs font-black uppercase tracking-widest text-white/40">
            Chargement des commandes VIP...
          </p>
        </div>
      ) : filteredSetups.length === 0 ? (
        <div className="py-20 text-center bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8 space-y-3">
          <AlertCircle size={32} className="text-white/20 mx-auto" />
          <p className="text-sm font-bold text-white/60">Aucun dossier trouvé pour cette sélection.</p>
          <p className="text-xs text-white/30">Les nouvelles commandes Pack Pro apparaîtront automatiquement ici.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSetups.map((item) => {
            const currentStatus = item.expertSetup?.status || "pending";
            const currentAssigned =
              assignedEdits[item._id] !== undefined
                ? assignedEdits[item._id]
                : item.expertSetup?.assignedTo || "";
            const currentNotes =
              notesEdits[item._id] !== undefined
                ? notesEdits[item._id]
                : item.expertSetup?.notes || "";
            const hasMetaConfig = Boolean(item.metaConfig?.phoneNumberId && item.metaConfig?.accessToken);

            return (
              <div
                key={item._id}
                className={cn(
                  "bg-vendeur-coal border rounded-[2rem] p-6 transition-all duration-300",
                  currentStatus === "pending" || currentStatus === "none"
                    ? "border-amber-500/30 shadow-lg shadow-amber-500/5"
                    : currentStatus === "in_progress"
                    ? "border-blue-500/30"
                    : "border-white/5 opacity-90"
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Merchant Info */}
                  <div className="space-y-3 flex-1 min-w-[280px]">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center font-black text-amber-400 text-lg uppercase shrink-0">
                        {item.businessName?.charAt(0) || "B"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-black text-white uppercase tracking-tight">
                            {item.businessName}
                          </h3>
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                              currentStatus === "pending" || currentStatus === "none"
                                ? "bg-amber-400/10 text-amber-400 border border-amber-400/30"
                                : currentStatus === "in_progress"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                                : "bg-vendeur-emerald/10 text-vendeur-emerald border border-vendeur-emerald/30"
                            )}
                          >
                            {currentStatus === "in_progress"
                              ? "En Cours"
                              : currentStatus === "completed"
                              ? "Terminé"
                              : "En Attente"}
                          </span>
                          {hasMetaConfig && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase">
                              Meta Configuré
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50 font-medium">
                          {item.userName || "Commerçant"} • {item.userEmail || "Pas d'email"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/60 font-medium">
                      {item.whatsappNumber && (
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone size={13} className="text-vendeur-emerald" />
                          <span>{item.whatsappNumber}</span>
                          <button
                            onClick={() => handleCopy(item.whatsappNumber || "", `phone-${item._id}`)}
                            className="p-1 hover:text-white transition-colors text-white/30"
                            title="Copier le numéro"
                          >
                            {copiedId === `phone-${item._id}` ? (
                              <Check size={12} className="text-vendeur-emerald" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      )}
                      {item.transaction?.paidAt && (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-white/40" />
                          <span>Payé le {new Date(item.transaction.paidAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      {item.transaction?.amount && (
                        <div className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-black text-vendeur-emerald">
                          {item.transaction.amount.toLocaleString()} {item.transaction.currency || "XOF"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center: Technician & Notes inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1">
                        <UserCheck size={11} className="text-vendeur-emerald" /> Technicien Assigné
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Ex: Franck, Support #1..."
                          value={currentAssigned}
                          onChange={(e) =>
                            setAssignedEdits({ ...assignedEdits, [item._id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdate(item._id, { assignedTo: currentAssigned });
                            }
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:border-vendeur-emerald outline-none font-bold"
                        />
                        {assignedEdits[item._id] !== undefined && (
                          <button
                            onClick={() =>
                              handleUpdate(item._id, { assignedTo: assignedEdits[item._id] })
                            }
                            disabled={updateMutation.isPending}
                            className="p-2 bg-vendeur-emerald text-black rounded-xl hover:scale-105 active:scale-95 transition-all shrink-0"
                            title="Sauvegarder technicien"
                          >
                            <Save size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/40">
                        Notes Internes
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Ex: RDV Meta à 16h..."
                          value={currentNotes}
                          onChange={(e) =>
                            setNotesEdits({ ...notesEdits, [item._id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdate(item._id, { notes: currentNotes });
                            }
                          }}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/20 focus:border-vendeur-emerald outline-none font-medium"
                        />
                        {notesEdits[item._id] !== undefined && (
                          <button
                            onClick={() =>
                              handleUpdate(item._id, { notes: notesEdits[item._id] })
                            }
                            disabled={updateMutation.isPending}
                            className="p-2 bg-vendeur-emerald text-black rounded-xl hover:scale-105 active:scale-95 transition-all shrink-0"
                            title="Sauvegarder notes"
                          >
                            <Save size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Actions */}
                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                    {/* Meta Cloud Config Button */}
                    <button
                      onClick={() => openMetaModal(item)}
                      className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-xl transition-all"
                      title="Configurer Meta Cloud Token & IDs"
                    >
                      <Settings2 size={16} />
                    </button>

                    {/* 1-Click WhatsApp Button */}
                    <button
                      onClick={() => openWhatsAppChat(item)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                      title="Ouvrir WhatsApp avec message pré-rempli"
                    >
                      <MessageCircle size={15} />
                      <span>WhatsApp</span>
                    </button>

                    {/* 1-Click Smart AI Reminder */}
                    {currentStatus !== "completed" && (
                      <button
                        onClick={() => remindMutation.mutate(item._id)}
                        disabled={remindMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-2.5 bg-amber-400/10 hover:bg-amber-400 hover:text-black border border-amber-400/30 text-amber-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                        title={
                          item.expertSetup?.lastFollowUpAt
                            ? `Dernière relance: ${new Date(item.expertSetup.lastFollowUpAt).toLocaleDateString()}`
                            : "Envoyer un rappel automatique bienveillant au commerçant"
                        }
                      >
                        {remindMutation.isPending ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <SendHorizontal size={14} />
                        )}
                        <span>Relancer IA</span>
                      </button>
                    )}

                    {/* Status Toggle / Progression Buttons */}
                    {currentStatus !== "in_progress" && currentStatus !== "completed" && (
                      <button
                        onClick={() => handleUpdate(item._id, { status: "in_progress" })}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                      >
                        <Clock size={14} />
                        <span>Prendre en charge</span>
                      </button>
                    )}

                    {currentStatus !== "completed" ? (
                      <button
                        onClick={() => handleUpdate(item._id, { status: "completed" })}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-vendeur-emerald text-vendeur-coal rounded-xl text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/20 font-bold"
                      >
                        <CheckCircle2 size={15} />
                        <span>Terminer</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdate(item._id, { status: "in_progress" })}
                        disabled={updateMutation.isPending}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                      >
                        Rouvrir
                      </button>
                    )}
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
          <div className="bg-vendeur-coal border border-white/10 rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    Identifiants Meta Cloud
                  </h3>
                  <p className="text-xs text-white/40 font-medium">
                    {metaModalItem.businessName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMetaModalItem(null)}
                className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Phone Number ID (Meta)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 108472918239102"
                  value={metaForm.phoneNumberId}
                  onChange={(e) => setMetaForm({ ...metaForm, phoneNumberId: e.target.value })}
                  className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-xs font-mono text-white focus:border-vendeur-emerald outline-none font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  WhatsApp Business Account ID (WABA ID)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 382910492810394"
                  value={metaForm.wabaId}
                  onChange={(e) => setMetaForm({ ...metaForm, wabaId: e.target.value })}
                  className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-xs font-mono text-white focus:border-vendeur-emerald outline-none font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Permanent System Access Token (EAAG...)
                </label>
                <textarea
                  placeholder="EAAG..."
                  rows={3}
                  value={metaForm.accessToken}
                  onChange={(e) => setMetaForm({ ...metaForm, accessToken: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-mono text-white focus:border-vendeur-emerald outline-none font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMetaModalItem(null)}
                className="flex-1 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-black uppercase tracking-wider transition-all"
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
                className="flex-1 h-12 rounded-xl bg-vendeur-emerald text-vendeur-coal text-xs font-black uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-vendeur-emerald/20 flex items-center justify-center gap-2 font-bold"
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

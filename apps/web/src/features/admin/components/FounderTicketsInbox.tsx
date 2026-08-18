import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { apiClient } from "@/lib/apiClient";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  AlertCircle, 
  Lightbulb, 
  Bug, 
  Handshake, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  Archive, 
  Trash2, 
  Save, 
  ExternalLink, 
  Smartphone, 
  Mail, 
  Send, 
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Compass
} from "lucide-react";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ICopilotTicket {
  _id: string;
  merchantId: string;
  merchantName: string;
  userEmail: string;
  userPhone: string;
  subject: string;
  message: string;
  category: "suggestion" | "bug" | "founder_message" | "help" | "partnership" | "general";
  priority: "low" | "normal" | "high" | "urgent";
  status: "unread" | "in_progress" | "resolved" | "archived";
  pageRoute?: string;
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  founder_message: { label: "Message Fondateur", icon: MessageSquare, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  suggestion: { label: "Idée & Suggestion", icon: Lightbulb, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  bug: { label: "Bug / Dysfonctionnement", icon: Bug, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  partnership: { label: "Partenariat", icon: Handshake, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" },
  help: { label: "Aide & Support", icon: HelpCircle, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  general: { label: "Général", icon: MessageSquare, color: "text-white/60 bg-white/5 border-white/10" },
};

const PRIORITY_META: Record<string, { label: string; color: string; badge: string }> = {
  urgent: { label: "Urgent", color: "text-rose-400", badge: "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse" },
  high: { label: "Élevé", color: "text-amber-400", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  normal: { label: "Normal", color: "text-white/70", badge: "bg-white/10 text-white/70 border-white/10" },
  low: { label: "Faible", color: "text-white/40", badge: "bg-white/5 text-white/40 border-white/5" },
};

export function FounderTicketsInbox() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  // Active editing notes state: { [ticketId]: noteText }
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  // 1. Fetch All Tickets
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin:copilot:tickets", statusFilter],
    queryFn: async () => {
      const res = await apiClient.get(`/api/copilot/admin/tickets${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`);
      return res.data;
    },
    refetchInterval: 15000 // Polling every 15s for live tickets
  });

  const tickets: ICopilotTicket[] = data?.tickets || [];

  // 2. Mutations
  const updateMutation = useMutation({
    mutationFn: async ({ ticketId, status, adminNotes }: { ticketId: string; status?: string; adminNotes?: string }) => {
      const res = await apiClient.patch(`/api/copilot/admin/tickets/${ticketId}`, { status, adminNotes });
      return res.data;
    },
    onSuccess: (data, vars) => {
      toast.success("Ticket mis à jour avec succès ! ✨");
      queryClient.invalidateQueries({ queryKey: ["admin:copilot:tickets"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur de mise à jour");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const res = await apiClient.delete(`/api/copilot/admin/tickets/${ticketId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Ticket supprimé");
      queryClient.invalidateQueries({ queryKey: ["admin:copilot:tickets"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur lors de la suppression");
    }
  });

  // KPI Calculations
  const totalCount = tickets.length;
  const unreadCount = tickets.filter(t => t.status === "unread").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;
  const urgentCount = tickets.filter(t => t.priority === "urgent" && t.status !== "resolved").length;

  // Filtered List
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Search
      const matchSearch = 
        !search.trim() ||
        ticket.merchantName.toLowerCase().includes(search.toLowerCase()) ||
        ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
        ticket.message.toLowerCase().includes(search.toLowerCase()) ||
        ticket.userPhone.includes(search) ||
        ticket.userEmail.toLowerCase().includes(search.toLowerCase());

      // Category
      const matchCategory = categoryFilter === "all" || ticket.category === categoryFilter;

      // Priority
      const matchPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

      return matchSearch && matchCategory && matchPriority;
    });
  }, [tickets, search, categoryFilter, priorityFilter]);

  const handleNotesChange = (ticketId: string, value: string) => {
    setEditingNotes(prev => ({ ...prev, [ticketId]: value }));
  };

  const handleSaveNotes = (ticketId: string) => {
    const note = editingNotes[ticketId];
    if (note !== undefined) {
      updateMutation.mutate({ ticketId, adminNotes: note });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Quick KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        
        <div className="p-4 rounded-2xl bg-vendeur-coal/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/40">Total Tickets</span>
            <MessageSquare size={14} className="text-white/40" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{totalCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Non Lus</span>
            <span className={cn(
              "w-2.5 h-2.5 rounded-full bg-emerald-400",
              unreadCount > 0 && "animate-ping"
            )} />
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400">{unreadCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">En cours</span>
            <Clock size={14} className="text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-400">{inProgressCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/[0.04] border border-blue-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">Résolus</span>
            <CheckCircle2 size={14} className="text-blue-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-400">{resolvedCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Urgents</span>
            <AlertTriangle size={14} className="text-rose-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-400">{urgentCount}</p>
        </div>

      </div>

      {/* 2. Filters & Search Bar */}
      <div className="p-4 rounded-2xl bg-vendeur-coal/40 border border-white/5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 shrink-0" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par commerçant, téléphone, sujet, message..."
              className="w-full h-11 bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 text-xs text-white outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Quick Refresh */}
          <button
            onClick={() => refetch()}
            className="h-11 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold flex items-center justify-center gap-2 border border-white/5 transition-all shrink-0"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>

        {/* Filter Badges & Selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          
          {/* Status Selector */}
          <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "Tous les statuts" },
              { id: "unread", label: "Non lu" },
              { id: "in_progress", label: "En cours" },
              { id: "resolved", label: "Résolu" },
              { id: "archived", label: "Archivé" }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                  statusFilter === s.id
                    ? "bg-emerald-500 text-black shadow"
                    : "text-white/40 hover:text-white"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 bg-black/30 border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-emerald-500"
          >
            <option value="all">Toutes Catégories</option>
            <option value="founder_message">Message Fondateur</option>
            <option value="suggestion">Idée & Suggestion</option>
            <option value="bug">Bug / Problème</option>
            <option value="partnership">Partenariat</option>
            <option value="help">Aide & Support</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 bg-black/30 border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-emerald-500"
          >
            <option value="all">Toutes Priorités</option>
            <option value="urgent">Urgent</option>
            <option value="high">Élevé</option>
            <option value="normal">Normal</option>
            <option value="low">Faible</option>
          </select>

          <span className="text-[11px] text-white/40 ml-auto">
            {filteredTickets.length} ticket{filteredTickets.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* 3. Ticket Cards List */}
      {isLoading ? (
        <div className="py-20">
          <VendeurIALoader size="lg" label="Boîte de réception Fondateur..." />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-vendeur-coal/30 border border-white/5 space-y-3">
          <MessageSquare size={40} className="mx-auto text-white/20" />
          <p className="text-sm font-bold text-white">Aucun ticket correspondant aux filtres</p>
          <p className="text-xs text-white/40 max-w-sm mx-auto">
            Les messages envoyés par les commerçants via la ligne directe du Copilote apparaîtront instantanément ici.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map(ticket => {
            const cat = CATEGORY_META[ticket.category] || CATEGORY_META.general;
            const CatIcon = cat.icon;
            const prio = PRIORITY_META[ticket.priority] || PRIORITY_META.normal;

            const isUnread = ticket.status === "unread";
            const isResolved = ticket.status === "resolved";
            const isInProgress = ticket.status === "in_progress";

            const phoneClean = ticket.userPhone?.replace(/[^0-9]/g, "");
            const currentNotes = editingNotes[ticket._id] !== undefined ? editingNotes[ticket._id] : (ticket.adminNotes || "");

            return (
              <div
                key={ticket._id}
                className={cn(
                  "p-5 sm:p-6 rounded-3xl border transition-all space-y-4 shadow-lg",
                  isUnread
                    ? "bg-emerald-500/[0.02] border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                    : isResolved
                    ? "bg-vendeur-coal/30 border-white/5 opacity-80"
                    : "bg-vendeur-coal/60 border-white/10"
                )}
              >
                {/* Card Top Row: Merchant, Badges & Date */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                  
                  {/* Left Merchant Info */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm sm:text-base text-white truncate">
                        {ticket.merchantName}
                      </span>

                      {/* Category Badge */}
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border", cat.color)}>
                        <CatIcon size={11} className="shrink-0" />
                        <span>{cat.label}</span>
                      </span>

                      {/* Priority Badge */}
                      <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border", prio.badge)}>
                        {prio.label}
                      </span>

                      {/* Status Indicator */}
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[9px] font-black uppercase",
                        isUnread ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                        isInProgress ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                        isResolved ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                        "bg-white/10 text-white/50"
                      )}>
                        {ticket.status}
                      </span>
                    </div>

                    {/* Metadata: Phone, Email, Page */}
                    <div className="flex items-center gap-3 text-xs text-white/50 flex-wrap pt-0.5">
                      {ticket.userPhone && (
                        <span className="flex items-center gap-1 font-mono text-[11px] text-white/70">
                          <Smartphone size={12} className="text-emerald-400" />
                          {ticket.userPhone}
                        </span>
                      )}

                      {ticket.userEmail && (
                        <span className="flex items-center gap-1 text-[11px] text-white/50">
                          <Mail size={12} />
                          {ticket.userEmail}
                        </span>
                      )}

                      {ticket.pageRoute && (
                        <span className="flex items-center gap-1 text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/40">
                          <Compass size={11} />
                          {ticket.pageRoute}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Date & Direct WhatsApp Action */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-[10px] text-white/40">
                      {new Date(ticket.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </span>

                    {phoneClean && (
                      <a
                        href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(`Bonjour ${ticket.merchantName} ! Équipe Dirigeante de Vendeur IA ici concernant votre message : "${ticket.subject}".`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-[10px] tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                        title="Ouvrir WhatsApp pour répondre directement au commerçant"
                      >
                        <Send size={12} className="shrink-0" />
                        <span>Répondre WhatsApp</span>
                      </a>
                    )}
                  </div>

                </div>

                {/* Card Subject & Message Body */}
                <div className="space-y-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                  <h4 className="font-black text-sm text-white flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-400 shrink-0" />
                    {ticket.subject}
                  </h4>
                  <p className="text-xs sm:text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                    {ticket.message}
                  </p>
                </div>

                {/* Admin Status Workflow & Notes Section */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
                  
                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/30 mr-1">Statut :</span>
                    
                    <button
                      onClick={() => updateMutation.mutate({ ticketId: ticket._id, status: "unread" })}
                      disabled={updateMutation.isPending}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                        ticket.status === "unread" ? "bg-white/20 text-white font-black" : "bg-white/5 text-white/40 hover:text-white"
                      )}
                    >
                      Non Lu
                    </button>

                    <button
                      onClick={() => updateMutation.mutate({ ticketId: ticket._id, status: "in_progress" })}
                      disabled={updateMutation.isPending}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                        ticket.status === "in_progress" ? "bg-amber-500/30 text-amber-300 font-black border border-amber-500/40" : "bg-white/5 text-white/40 hover:text-white"
                      )}
                    >
                      En cours
                    </button>

                    <button
                      onClick={() => updateMutation.mutate({ ticketId: ticket._id, status: "resolved" })}
                      disabled={updateMutation.isPending}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                        ticket.status === "resolved" ? "bg-emerald-500/30 text-emerald-300 font-black border border-emerald-500/40" : "bg-white/5 text-white/40 hover:text-white"
                      )}
                    >
                      Résolu ✓
                    </button>

                    <button
                      onClick={() => updateMutation.mutate({ ticketId: ticket._id, status: "archived" })}
                      disabled={updateMutation.isPending}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                        ticket.status === "archived" ? "bg-purple-500/30 text-purple-300 font-black border border-purple-500/40" : "bg-white/5 text-white/40 hover:text-white"
                      )}
                    >
                      Archivé
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (window.confirm("Êtes-vous sûr de vouloir supprimer ce ticket ?")) {
                        deleteMutation.mutate(ticket._id);
                      }
                    }}
                    className="p-2 rounded-xl text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors self-end sm:self-auto"
                    title="Supprimer le ticket"
                  >
                    <Trash2 size={16} />
                  </button>

                </div>

                {/* Internal Admin Notes */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={currentNotes}
                    onChange={(e) => handleNotesChange(ticket._id, e.target.value)}
                    placeholder="Ajouter une note interne entre fondateurs (ex: bug corrigé dans la v1.4, commerçant contacté)..."
                    className="flex-1 h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-xs text-white placeholder-white/25 outline-none focus:border-emerald-500/50"
                  />
                  <button
                    onClick={() => handleSaveNotes(ticket._id)}
                    disabled={updateMutation.isPending}
                    className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
                    title="Enregistrer la note interne"
                  >
                    <Save size={13} />
                    <span className="hidden sm:inline">Enregistrer</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

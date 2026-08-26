import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/authStore";
import { useFounderRole } from "@/hooks/useFounderRole";
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
  const { accessToken } = useAuthStore();
  const { isFounder } = useFounderRole();
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
    enabled: !!accessToken && isFounder,
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
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header & Quick KPIs - Flattened */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        
        <div className="p-4 rounded-2xl bg-vendeur-coal/60 border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-white/30">Registry</span>
            <MessageSquare size={14} className="text-white/20" />
          </div>
          <p className="text-xl font-black text-white">{totalCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Unread</span>
          </div>
          <p className="text-xl font-black text-emerald-400">{unreadCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-400">Ops</span>
            <Clock size={14} className="text-amber-400" />
          </div>
          <p className="text-xl font-black text-amber-400">{inProgressCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/[0.04] border border-blue-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-blue-400">Solved</span>
          </div>
          <p className="text-xl font-black text-blue-400">{resolvedCount}</p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-rose-400">Urgent</span>
            <AlertTriangle size={14} className="text-rose-400" />
          </div>
          <p className="text-xl font-black text-rose-400">{urgentCount}</p>
        </div>

      </div>

      {/* 2. Filters & Search Bar - Flattened */}
      <div className="p-3 md:p-4 rounded-2xl bg-vendeur-coal/40 border border-white/5 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Subject, Merchant, Phone..."
              className="w-full h-11 bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 text-xs text-white focus:border-emerald-500/50 outline-none"
            />
          </div>

          <button
            onClick={() => refetch()}
            className="h-11 px-4 rounded-xl bg-white/5 text-white/70 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-white/5 transition-all"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span className="hidden md:inline">Sync Pulse</span>
          </button>
        </div>

        {/* Filter Badges & Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
            {[{ id: "all", label: "All" }, { id: "unread", label: "Unread" }, { id: "in_progress", label: "Ops" }, { id: "resolved", label: "Solved" }].map(s => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  statusFilter === s.id ? "bg-emerald-500 text-black" : "text-white/40"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 bg-black/40 border border-white/10 rounded-xl px-3 text-[10px] font-black uppercase text-white outline-none focus:border-emerald-500"
          >
            <option value="all">Category: All</option>
            <option value="founder_message">Founder Direct</option>
            <option value="bug">Bug Protocol</option>
            <option value="suggestion">Insight</option>
          </select>
        </div>
      </div>

      {/* 3. Ticket Cards List - Flattened */}
      {isLoading ? (
        <div className="py-20 text-center uppercase font-black text-white/20 text-[10px]">Scanning Foundation Signals...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-vendeur-coal/30 border border-white/5 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">No active signals detected</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map(ticket => {
            const cat = CATEGORY_META[ticket.category] || CATEGORY_META.general;
            const CatIcon = cat.icon;
            const prio = PRIORITY_META[ticket.priority] || PRIORITY_META.normal;
            const isUnread = ticket.status === "unread";
            const phoneClean = ticket.userPhone?.replace(/[^0-9]/g, "");
            const currentNotes = editingNotes[ticket._id] !== undefined ? editingNotes[ticket._id] : (ticket.adminNotes || "");

            return (
              <div
                key={ticket._id}
                className={cn(
                  "p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all space-y-4 shadow-lg",
                  isUnread ? "bg-emerald-500/[0.02] border-emerald-500/30" : "bg-vendeur-coal/60 border-white/5 opacity-90"
                )}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm uppercase tracking-tight text-white">{ticket.merchantName}</span>
                      <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border", cat.color)}>
                        <CatIcon size={10} className="shrink-0" /> {cat.label}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border", prio.badge)}>
                        {prio.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                       <span className="flex items-center gap-1 font-mono text-emerald-400/60"><Smartphone size={10}/> {ticket.userPhone}</span>
                       <span className="truncate max-w-[150px]">{ticket.userEmail}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-center">
                    {phoneClean && (
                      <a
                        href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(`Founder Connect Protocol: Re: ${ticket.subject}`)}`}
                        target="_blank"
                        className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-emerald-500/10"
                      >
                        <Send size={14} /> CONNECT
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-2 bg-black/40 p-4 rounded-xl border border-white/5">
                  <h4 className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-emerald-400" /> {ticket.subject}
                  </h4>
                  <p className="text-[13px] text-white/70 whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
                </div>

                <div className="pt-2 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                   <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={currentNotes}
                        onChange={(e) => handleNotesChange(ticket._id, e.target.value)}
                        placeholder="INTERNAL FOUNDER NOTES..."
                        className="flex-1 h-10 bg-black/40 border border-white/10 rounded-xl px-4 text-[11px] font-bold text-white outline-none focus:border-emerald-500/50"
                      />
                      <button onClick={() => handleSaveNotes(ticket._id)} className="h-10 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"><Save size={16}/></button>
                   </div>
                   <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                      {["unread", "in_progress", "resolved"].map(st => (
                        <button
                          key={st}
                          onClick={() => updateMutation.mutate({ ticketId: ticket._id, status: st })}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                            ticket.status === st ? "bg-white/10 text-white" : "text-white/20"
                          )}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                      <button onClick={() => { if(window.confirm('Delete signal?')) deleteMutation.mutate(ticket._id); }} className="p-2 text-rose-500/40 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

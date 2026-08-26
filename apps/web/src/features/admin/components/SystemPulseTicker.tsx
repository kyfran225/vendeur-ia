import React, { useEffect, useState, useRef } from "react";
import { Activity, Zap, Shield, AlertTriangle, MessageSquare, Banknote, User } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { cn } from "@/lib/utils";

interface AuditLog {
  _id: string;
  action: string;
  entity: string;
  severity: string;
  timestamp: string;
  metadata?: any;
  merchantId?: { businessName: string };
  userId?: { displayName: string; email: string };
}

export function SystemPulseTicker() {
  const socket = useSocket();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: initialLogs } = useQuery({
    queryKey: ["admin:pulse:initial"],
    queryFn: async () => {
      const res = await apiClient.get("/api/admin/pulse");
      return res.data;
    }
  });

  useEffect(() => {
    if (initialLogs) setLogs(initialLogs);
  }, [initialLogs]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("join_founder_pulse");

    const handlePulse = (log: AuditLog) => {
      setLogs(prev => [log, ...prev].slice(0, 50));
    };

    socket.on("system:pulse", handlePulse);
    return () => {
      socket.off("system:pulse", handlePulse);
    };
  }, [socket]);

  return (
    <div className="bg-vendeur-coal border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-[400px]">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
          <Activity size={16} className="text-vendeur-emerald animate-pulse" />
          Live System Pulse
        </h3>
        <span className="text-[10px] font-black text-vendeur-emerald/60 uppercase">Real-time Stream</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar"
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/10 text-[10px] font-black uppercase tracking-widest italic">
            Waiting for system events...
          </div>
        ) : logs.map((log) => (
          <PulseItem key={log._id} log={log} />
        ))}
      </div>
    </div>
  );
}

function PulseItem({ log }: { log: AuditLog }) {
  const icons: any = {
    merchant: <StoreIcon size={12} />,
    payment: <Banknote size={12} />,
    system: <Shield size={12} />,
    ai: <Zap size={12} />,
    user: <User size={12} />,
    order: <ShoppingCartIcon size={12} />
  };

  const colors: any = {
    info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    error: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    critical: "text-white bg-rose-600 border-rose-700 animate-bounce"
  };

  const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-xl border transition-all animate-in slide-in-from-left duration-300",
      colors[log.severity] || colors.info
    )}>
      <div className="mt-0.5 shrink-0 opacity-80">{icons[log.entity] || <Activity size={12} />}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">
            {log.action.replace(/_/g, ' ')}
          </span>
          <span className="text-[8px] font-mono opacity-40">{time}</span>
        </div>
        <p className="text-[10px] font-bold leading-tight mt-0.5 truncate">
          {log.merchantId?.businessName || log.userId?.displayName || "System"}
          <span className="opacity-60 font-medium ml-1">
            {log.metadata?.reference || log.metadata?.reason || ""}
          </span>
        </p>
      </div>
    </div>
  );
}

function StoreIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
  );
}

function ShoppingCartIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
  );
}

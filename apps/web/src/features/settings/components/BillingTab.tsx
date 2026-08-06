import React from "react";
import {
  Banknote,
  Calendar,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function BillingTab({ merchant }: { merchant: any }) {
  const { data: billingHistory } = useQuery({
    queryKey: ["billing-history"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard"); // Reusing dashboard for history
      return res.data.recentTransactions || [];
    }
  });

  const sub = merchant?.subscription;
  const isExpired = sub?.status === "past_due";
  const nextDate = sub?.nextPaymentDate || sub?.expiresAt;
  const isMobileMoney = sub?.paymentMethod === 'mobile_money';

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      {/* Plan Actuel */}
      <section className="bg-vendeur-coal border border-white/10 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-vendeur-emerald/10 rounded-2xl flex items-center justify-center text-vendeur-emerald border border-vendeur-emerald/20">
                {sub?.plan === 'business' ? <ShieldCheck size={28} /> : <Zap size={28} />}
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
                  Plan {sub?.plan || 'Starter'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                    sub?.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                  )}>
                    {sub?.status === 'active' ? "Actif" : "Suspendu"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-2">
                  <Calendar size={12} />
                  {isExpired ? "Expiré le" : "Prochaine échéance"}
                </p>
                <p className="text-lg font-black text-white">
                  {nextDate ? new Date(nextDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-2">
                  {isMobileMoney ? <Smartphone size={12} /> : <CreditCard size={12} />}
                  Mode de Paiement
                </p>
                <p className="text-lg font-black text-white capitalize">
                  {isMobileMoney ? "Mobile Money" : "Carte Bancaire"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4 min-w-[240px]">
            {isExpired ? (
              <button className="w-full h-16 bg-rose-500 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-rose-500/20">
                Réactiver mon IA
                <ArrowRight size={20} />
              </button>
            ) : isMobileMoney ? (
              <button className="w-full h-16 bg-white text-vendeur-coal font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/10">
                Renouveler ({merchant.currency || 'XOF'})
                <Zap size={20} className="text-vendeur-emerald" />
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-vendeur-emerald" />
                <p className="text-[10px] font-bold text-white/60 uppercase leading-tight">
                  Prélèvement automatique configuré
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Background Accent */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-64 w-64 bg-vendeur-emerald/5 blur-[100px] rounded-full" />
      </section>

      {/* Historique */}
      <section className="bg-vendeur-coal border border-white/10 p-6 md:p-8 rounded-[2.5rem] shadow-2xl">
        <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
          <Clock size={20} className="text-white/40" />
          Dernières Transactions
        </h3>

        <div className="space-y-3">
          {billingHistory?.map((t: any) => (
            <div key={t._id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                  <Banknote size={18} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-white tracking-tight">{t.type?.replace('_', ' ')}</p>
                  <p className="text-[10px] text-white/20 uppercase font-bold">{new Date(t.paidAt || t.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-vendeur-emerald">+{t.amount.toLocaleString()} {t.currency}</p>
                <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">{t.paymentMethod || 'Paystack'}</p>
              </div>
            </div>
          ))}
          {(!billingHistory || billingHistory.length === 0) && (
            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
              <AlertCircle size={32} className="mx-auto text-white/10 mb-2" />
              <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Aucun historique de paiement</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

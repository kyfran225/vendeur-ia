import React, { useState } from "react";
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
  AlertCircle,
  Loader2,
  XCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function BillingTab({ merchant }: { merchant: any }) {
  const queryClient = useQueryClient();
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const { data: billingHistory } = useQuery({
    queryKey: ["billing-history"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard"); // Reusing dashboard for history
      return res.data.recentTransactions || [];
    }
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/api/commerce/subscription/cancel");
      return res.data;
    },
    onSuccess: () => {
      toast.success("Votre abonnement ne sera pas renouvelé.");
      queryClient.invalidateQueries({ queryKey: ["merchant:profile"] });
      setIsCancelConfirmOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Une erreur est survenue.");
    }
  });

  const sub = merchant?.subscription;
  const isExpired = sub?.status === "past_due";
  const nextDate = sub?.nextPaymentDate || sub?.expiresAt;

  // Real data logic (no mocks)
  const isMobileMoney = sub?.paymentMethod === 'mobile_money';
  const isCard = sub?.paymentMethod === 'card';
  const hasRecurring = !!sub?.subscriptionCode;

  // Determine actual payment method label from real data
  let paymentMethodLabel = "Non défini";
  if (isMobileMoney) paymentMethodLabel = "Mobile Money";
  else if (isCard) paymentMethodLabel = "Carte Bancaire";

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
                    sub?.status === 'active' || sub?.status === 'trial' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                  )}>
                    {sub?.status === 'active' || sub?.status === 'trial' ? "Actif" : "Suspendu"}
                  </span>
                  {hasRecurring && (
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border bg-blue-500/10 text-blue-400 border-blue-500/20">
                      Auto-Renouvellement
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-2">
                  <Calendar size={12} />
                  {isExpired ? "Expiré le" : (hasRecurring ? "Prochain prélèvement" : "Prochaine échéance")}
                </p>
                <p className="text-lg font-black text-white">
                  {nextDate ? new Date(nextDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest flex items-center gap-2">
                  {isMobileMoney ? <Smartphone size={12} /> : (isCard ? <CreditCard size={12} /> : <Banknote size={12} />)}
                  Canal de paiement
                </p>
                <p className="text-lg font-black text-white">
                  {paymentMethodLabel}
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
            ) : (sub?.status === 'trial' || sub?.paymentMethod === 'unknown') ? (
              <button className="w-full h-16 bg-white text-vendeur-coal font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/10">
                S'abonner maintenant
                <Zap size={20} className="text-vendeur-emerald" />
              </button>
            ) : isMobileMoney ? (
              <button className="w-full h-16 bg-white text-vendeur-coal font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/10">
                Renouveler ({merchant.billingCurrency || merchant.currency || 'XOF'})
                <Zap size={20} className="text-vendeur-emerald" />
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-vendeur-emerald" />
                  <p className="text-[10px] font-bold text-white/60 uppercase leading-tight">
                    {hasRecurring ? "Prélèvement automatique actif" : "Plan actif"}
                  </p>
                </div>
                {hasRecurring && (
                  <button
                    onClick={() => setIsCancelConfirmOpen(true)}
                    className="w-full text-[10px] font-black uppercase text-white/20 hover:text-rose-500 transition-colors py-2"
                  >
                    Désactiver le renouvellement
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Confirmation d'annulation */}
        {isCancelConfirmOpen && (
          <div className="absolute inset-0 z-50 bg-vendeur-coal/95 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-6 max-w-sm">
              <div className="h-16 w-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Arrêter l'IA ?</h3>
                <p className="text-[10px] font-medium text-white/40 uppercase leading-relaxed">
                  Votre service restera actif jusqu'au {nextDate ? new Date(nextDate).toLocaleDateString() : 'prochain terme'}.
                  Ensuite, votre IA s'arrêtera et vos clients ne recevront plus de réponses.
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsCancelConfirmOpen(false)}
                  className="flex-1 h-12 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all"
                >
                  Garder
                </button>
                <button
                  onClick={() => cancelSubscriptionMutation.mutate()}
                  disabled={cancelSubscriptionMutation.isPending}
                  className="flex-1 h-12 bg-rose-500 hover:bg-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2"
                >
                  {cancelSubscriptionMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

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

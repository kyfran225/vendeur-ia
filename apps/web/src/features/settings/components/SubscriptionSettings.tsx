import React, { useState } from "react";
import { Zap, ShieldCheck, Clock, XCircle, CreditCard, Calendar, Crown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function SubscriptionSettings({ merchant }: { merchant: any }) {
  const queryClient = useQueryClient();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const sub = merchant?.subscription;

  const cancelMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post("/api/commerce/subscription/cancel");
    },
    onSuccess: () => {
      toast.success("Abonnement annulé. Vous resterez premium jusqu'à la fin de la période en cours.");
      queryClient.invalidateQueries({ queryKey: ["merchant"] });
      setShowCancelConfirm(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur lors de l'annulation");
      setShowCancelConfirm(false);
    }
  });

  const isRecurring = !!sub?.subscriptionCode;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <ConfirmationModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Annuler le renouvellement ?"
        message="Êtes-vous sûr de vouloir annuler le renouvellement automatique ? Vous garderez vos accès premium jusqu'à la fin de votre période de facturation actuelle."
        confirmLabel="Oui, annuler"
        cancelLabel="Garder mon abonnement"
        type="warning"
        isLoading={cancelMutation.isPending}
      />
      <div className="bg-white dark:bg-vendeur-coal border border-slate-200 dark:border-white/10 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] space-y-8 shadow-sm hover:shadow-md dark:shadow-xl transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={cn(
              "h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl transition-transform hover:rotate-6 shrink-0",
              sub?.plan === 'business' ? "bg-blue-500 text-white" :
              sub?.plan === 'premium' ? "bg-amber-500 text-slate-950" : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/40"
            )}>
              {sub?.plan === 'business' ? <ShieldCheck size={32} /> :
               sub?.plan === 'premium' ? <Zap size={32} /> : <Clock size={32} />}
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Plan {sub?.plan === 'premium' ? 'Premium' : sub?.plan === 'business' ? 'Business' : 'Gratuit'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className={cn(
                  "h-2 w-2 rounded-full animate-pulse",
                  sub?.status === 'active' ? "bg-vendeur-emerald" : "bg-red-500"
                )} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                  Statut : {sub?.status === 'active' ? 'Actif' : 'Suspendu / Expiré'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 md:flex items-center gap-3">
             <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 px-6 py-3 rounded-xl">
                <p className="text-[8px] font-black uppercase text-slate-400 dark:text-white/20 tracking-widest mb-1">Expiration</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {sub?.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : 'N/A'}
                </p>
             </div>
             {isRecurring && sub?.nextPaymentDate && (
               <div className="bg-emerald-50 dark:bg-vendeur-emerald/5 border border-emerald-200 dark:border-vendeur-emerald/10 px-6 py-3 rounded-xl">
                  <p className="text-[8px] font-black uppercase text-emerald-600 dark:text-vendeur-emerald/40 tracking-widest mb-1">Prochain prélèvement</p>
                  <p className="text-sm font-black text-emerald-600 dark:text-vendeur-emerald">
                    {new Date(sub.nextPaymentDate).toLocaleDateString()}
                  </p>
               </div>
             )}
          </div>
        </div>

        {isRecurring ? (
          <div className="pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-slate-500 dark:text-white/40 italic text-xs font-medium">
              <CreditCard size={18} />
              Prélèvement automatique activé via Paystack
            </div>
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={cancelMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all text-xs font-black uppercase tracking-widest border border-red-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {cancelMutation.isPending ? "Annulation..." : "Annuler l'abonnement"}
              <XCircle size={14} />
            </button>
          </div>
        ) : sub?.plan !== 'starter' && (
          <div className="pt-8 border-t border-slate-200 dark:border-white/5">
             <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl flex items-start gap-4">
                <Calendar className="text-amber-500 dark:text-amber-400 shrink-0" size={20} />
                <p className="text-xs text-amber-700 dark:text-amber-200/60 font-medium leading-relaxed">
                  Votre abonnement actuel a été payé manuellement. Pour activer le prélèvement automatique et ne plus vous soucier des coupures, choisissez un plan lors de votre prochain renouvellement.
                </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

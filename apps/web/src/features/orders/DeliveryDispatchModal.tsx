import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Truck, Send, Phone, User, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

interface DeliveryDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export function DeliveryDispatchModal({ isOpen, onClose, order }: DeliveryDispatchModalProps) {
  const [deliveryGuyName, setDeliveryGuyName] = useState(order?.deliveryGuyName || "");
  const [deliveryGuyPhone, setDeliveryGuyPhone] = useState(order?.deliveryGuyPhone || "");
  const [deliveryNotes, setDeliveryNotes] = useState(order?.deliveryNotes || "");
  const queryClient = useQueryClient();

  const dispatchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch(`/api/commerce/orders/${order._id}`, {
        deliveryGuyName: deliveryGuyName.trim(),
        deliveryGuyPhone: deliveryGuyPhone.trim(),
        deliveryNotes: deliveryNotes.trim(),
        notifyDeliveryGuy: true
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Course envoyée au livreur sur WhatsApp ! 🛵✨");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur lors de l'envoi au livreur.");
    }
  });

  if (!isOpen || !order) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-vendeur-coal border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        <header className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Assigner un Livreur</h2>
              <p className="text-xs text-white/40 font-medium">Commande #{order._id.toString().slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-4">
          {/* Order Summary Reminder */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-white/40 font-medium">Client :</span>
              <span className="text-white font-bold">{order.customerId?.phone || "Client"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 font-medium">Lieu :</span>
              <span className="text-emerald-400 font-bold">{order.shippingAddress || "Non spécifié"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 font-medium">À encaisser :</span>
              <span className="text-white font-black">
                {order.status === "paid" ? "0 FCFA (Déjà Payé ✅)" : `${order.totalAmount.toLocaleString()} ${order.currency || "XOF"}`}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5 mb-1.5">
                <User size={12} className="text-purple-400" />
                Nom du coursier (optionnel)
              </label>
              <input
                type="text"
                value={deliveryGuyName}
                onChange={(e) => setDeliveryGuyName(e.target.value)}
                placeholder="Ex: Moussa Express"
                className="w-full bg-vendeur-bg border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5 mb-1.5">
                <Phone size={12} className="text-purple-400" />
                Numéro WhatsApp du Livreur *
              </label>
              <input
                type="text"
                value={deliveryGuyPhone}
                onChange={(e) => setDeliveryGuyPhone(e.target.value)}
                placeholder="Ex: +2250700000000"
                className="w-full bg-vendeur-bg border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5 mb-1.5">
                <MapPin size={12} className="text-purple-400" />
                Instructions / Remarques pour la course
              </label>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Ex: Appeler avant d'arriver au carrefour..."
                rows={2}
                className="w-full bg-vendeur-bg border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>

          <button
            disabled={!deliveryGuyPhone.trim() || dispatchMutation.isPending}
            onClick={() => dispatchMutation.mutate()}
            className="w-full h-12 bg-purple-500 hover:bg-purple-600 text-white font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-20 mt-2"
          >
            {dispatchMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={16} />}
            Envoyer les détails sur WhatsApp
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

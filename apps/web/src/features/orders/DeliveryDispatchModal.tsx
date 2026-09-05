import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Truck, Send, Phone, User, MapPin, Loader2, ExternalLink, Sparkles, Clock, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { CustomerAvatar } from "@/features/inbox/components/CustomerAvatar";
import { formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";

interface DeliveryDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

interface SavedCourier {
  name: string;
  phone: string;
}

export function DeliveryDispatchModal({ isOpen, onClose, order }: DeliveryDispatchModalProps) {
  const [deliveryGuyName, setDeliveryGuyName] = useState(order?.deliveryGuyName || "");
  const [deliveryGuyPhone, setDeliveryGuyPhone] = useState(order?.deliveryGuyPhone || "");
  const [deliveryNotes, setDeliveryNotes] = useState(order?.deliveryNotes || "");
  const [savedCouriers, setSavedCouriers] = useState<SavedCourier[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("vendeur_recent_couriers");
      if (stored) {
        setSavedCouriers(JSON.parse(stored));
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  const saveCourierToHistory = (name: string, phone: string) => {
    if (!phone) return;
    try {
      const current = savedCouriers.filter(c => c.phone !== phone);
      const updated = [{ name: name || "Livreur", phone }, ...current].slice(0, 4);
      setSavedCouriers(updated);
      localStorage.setItem("vendeur_recent_couriers", JSON.stringify(updated));
    } catch (e) {
      // Ignore
    }
  };

  const getCleanPhone = (num: string) => {
    let clean = num.replace(/[^0-9]/g, "");
    if (clean.startsWith("0") && clean.length === 10) {
      clean = "225" + clean;
    }
    return clean;
  };

  const cleanPhone = getCleanPhone(deliveryGuyPhone);

  const getDispatchMessage = () => {
    const customer = order.customerId;
    const cleanCustomerPhone = (customer?.phone || "").replace(/@s\.whatsapp\.net|@c\.us/g, "");
    const itemsList = (order.items || []).map((i: any) => `• ${i.quantity}x ${i.name}`).join("\n");
    return `🛵 *NOUVELLE COURSE*\n\n` +
      `📦 *Commande:* #${order._id.toString().slice(-6).toUpperCase()}\n` +
      `👤 *Client à livrer:* ${cleanCustomerPhone ? formatDisplayPhone(cleanCustomerPhone, "CI") : "Client"}\n` +
      `📍 *Adresse / Quartier:* ${order.shippingAddress || customer?.location || "À convenir avec le client"}\n\n` +
      `📦 *Articles :*\n${itemsList}\n\n` +
      `💰 *Montant à encaisser :* ${order.status === "paid" ? "0 (Déjà payé ✅)" : `${order.totalAmount.toLocaleString()} ${order.currency || "XOF"} (À encaisser)`}\n` +
      (deliveryNotes ? `📝 *Note :* ${deliveryNotes}\n` : "") +
      `\nMerci d'assurer la livraison dès que possible ! 🚀`;
  };

  const dispatchMutation = useMutation({
    mutationFn: async () => {
      saveCourierToHistory(deliveryGuyName.trim(), cleanPhone);
      const res = await apiClient.patch(`/api/commerce/orders/${order._id}`, {
        deliveryGuyName: deliveryGuyName.trim() || "Livreur",
        deliveryGuyPhone: cleanPhone,
        deliveryNotes: deliveryNotes.trim(),
        status: order.status === "pending" || order.status === "confirmed" ? "dispatched" : order.status,
        notifyDeliveryGuy: true
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Course enregistrée et envoyée au livreur ! 🛵✨");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur lors de l'enregistrement de la course.");
    }
  });

  const handleOpenWhatsAppDirect = () => {
    if (!cleanPhone) {
      toast.error("Veuillez renseigner le numéro du livreur.");
      return;
    }
    saveCourierToHistory(deliveryGuyName.trim(), cleanPhone);
    const msg = encodeURIComponent(getDispatchMessage());
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");

    // Also update order status in background
    apiClient.patch(`/api/commerce/orders/${order._id}`, {
      deliveryGuyName: deliveryGuyName.trim() || "Livreur",
      deliveryGuyPhone: cleanPhone,
      deliveryNotes: deliveryNotes.trim(),
      status: order.status === "pending" || order.status === "confirmed" ? "dispatched" : order.status,
      notifyDeliveryGuy: false
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }).catch(() => {});

    toast.success("WhatsApp ouvert avec les détails de la course ! 🚀");
    onClose();
  };

  if (!isOpen || !order) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#0B1512] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col text-slate-900 dark:text-white">
        <header className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/30 text-purple-600 dark:text-purple-400">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Assigner un Livreur</h2>
              <p className="text-xs text-slate-500 dark:text-white/40 font-medium">Commande #{order._id.toString().slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-4">
          {/* Order Summary Reminder */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-white/5">
              <CustomerAvatar
                name={order.customerId?.name}
                phone={order.customerId?.phone}
                avatarUrl={order.customerId?.avatarUrl}
                platform={order.customerId?.platform || "whatsapp"}
                size="sm"
                showPlatformBadge={false}
              />
              <div className="min-w-0 flex-1">
                <div className="text-slate-900 dark:text-white font-bold truncate">
                  {order.customerId?.name || formatDisplayPhone(order.customerId?.phone, "CI") || "Client"}
                </div>
                {order.customerId?.phone && (
                  <div className="text-[10px] text-slate-500 dark:text-white/50 font-mono">
                    {formatDisplayPhone(order.customerId?.phone, "CI")}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-white/40 font-medium">Lieu de livraison :</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{order.shippingAddress || "Non spécifié"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-white/40 font-medium">Montant à encaisser :</span>
              <span className="text-slate-900 dark:text-white font-black">
                {order.status === "paid" ? "0 FCFA (Déjà Payé ✅)" : `${order.totalAmount.toLocaleString()} ${order.currency || "XOF"}`}
              </span>
            </div>
          </div>

          {/* Quick select saved couriers */}
          {savedCouriers.length > 0 && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 flex items-center gap-1.5 mb-1.5">
                <Clock size={11} className="text-purple-600 dark:text-purple-400" />
                Livreurs récents
              </label>
              <div className="flex flex-wrap gap-1.5">
                {savedCouriers.map((courier, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDeliveryGuyName(courier.name);
                      setDeliveryGuyPhone(courier.phone);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                      cleanPhone === courier.phone
                        ? "bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300"
                        : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                  >
                    <span>{courier.name}</span>
                    <span className="text-slate-400 dark:text-white/30 font-mono text-[9px]">({courier.phone.slice(-4)})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 flex items-center gap-1.5 mb-1.5">
                <User size={12} className="text-purple-600 dark:text-purple-400" />
                Nom du coursier (optionnel)
              </label>
              <input
                type="text"
                value={deliveryGuyName}
                onChange={(e) => setDeliveryGuyName(e.target.value)}
                placeholder="Ex: Moussa Express"
                className="w-full bg-slate-50 dark:bg-vendeur-bg border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 flex items-center gap-1.5 mb-1.5">
                <Phone size={12} className="text-purple-600 dark:text-purple-400" />
                Numéro WhatsApp du Livreur *
              </label>
              <input
                type="text"
                value={deliveryGuyPhone}
                onChange={(e) => setDeliveryGuyPhone(e.target.value)}
                placeholder="Ex: +225 07 00 00 00 00 ou 0700000000"
                className="w-full bg-slate-50 dark:bg-vendeur-bg border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 flex items-center gap-1.5 mb-1.5">
                <MapPin size={12} className="text-purple-600 dark:text-purple-400" />
                Instructions / Remarques pour la course
              </label>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Ex: Appeler avant d'arriver au carrefour..."
                rows={2}
                className="w-full bg-slate-50 dark:bg-vendeur-bg border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {/* Direct WhatsApp Button */}
            <button
              type="button"
              disabled={!deliveryGuyPhone.trim()}
              onClick={handleOpenWhatsAppDirect}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white dark:text-black font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-20"
            >
              <ExternalLink size={16} />
              Ouvrir & Envoyer sur WhatsApp
            </button>

            {/* Server Automated Dispatch */}
            <button
              type="button"
              disabled={!deliveryGuyPhone.trim() || dispatchMutation.isPending}
              onClick={() => dispatchMutation.mutate()}
              className="w-full h-10 bg-purple-500/10 dark:bg-purple-500/15 hover:bg-purple-500/20 dark:hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-bold uppercase tracking-wider text-[11px] rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-20"
            >
              {dispatchMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={14} />}
              Envoi automatique en arrière-plan
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

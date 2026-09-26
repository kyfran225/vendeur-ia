import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Truck, Send, Phone, User, MapPin, Loader2, ExternalLink, Sparkles, Clock, Check, Landmark, Star } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  // Fetch Merchant data to get default delivery guy
  const { data: merchantData } = useQuery({
    queryKey: ["merchant-profile"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/merchant");
      return res.data;
    },
    enabled: isOpen
  });

  const defaultCourier = merchantData?.defaultDeliveryGuy;

  const [deliveryGuyName, setDeliveryGuyName] = useState(order?.deliveryGuyName || defaultCourier?.name || "");
  const [deliveryGuyPhone, setDeliveryGuyPhone] = useState(order?.deliveryGuyPhone || defaultCourier?.phone || "");
  const [shippingLandmark, setShippingLandmark] = useState(order?.shippingLandmark || "");
  const [deliveryNotes, setDeliveryNotes] = useState(order?.deliveryNotes || "");
  const [savedCouriers, setSavedCouriers] = useState<SavedCourier[]>([]);

  // Update fields when order or default courier loads
  useEffect(() => {
    if (order) {
      setDeliveryGuyName(order.deliveryGuyName || defaultCourier?.name || "");
      setDeliveryGuyPhone(order.deliveryGuyPhone || defaultCourier?.phone || "");
      setShippingLandmark(order.shippingLandmark || "");
      setDeliveryNotes(order.deliveryNotes || "");
    }
  }, [order, defaultCourier]);

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
    let clean = (num || "").replace(/[^0-9]/g, "");
    if (clean.startsWith("0") && clean.length === 10) {
      clean = "225" + clean;
    }
    return clean;
  };

  const cleanPhone = getCleanPhone(deliveryGuyPhone);

  const getDispatchMessage = () => {
    const customer = order?.customerId;
    const cleanCustomerPhone = (customer?.phone || "").replace(/@s\.whatsapp\.net|@c\.us/g, "").replace(/\D/g, "");
    const customerPhoneDisplay = customer?.phone ? formatDisplayPhone(customer.phone, "CI") : "Non renseigné";
    const customerName = customer?.name || "Client";
    const itemsList = (order?.items || []).map((i: any) => `• ${i.quantity || 1}x ${i.name || "Article"} (${((i.price || 0) * (i.quantity || 1)).toLocaleString()} ${order.currency || "XOF"})`).join("\n");
    const isPaid = order?.status === "paid" || !!order?.paidAt;
    const amountToCollect = isPaid
      ? "0 FCFA (DÉJÀ PAYÉ EN LIGNE ✅ - NE RIEN ENCAISSER)"
      : `${(order?.totalAmount || 0).toLocaleString()} ${order?.currency || "XOF"} (À ENCAISSER EN ESPÈCES 💵)`;

    const businessName = merchantData?.businessName || "La Boutique";
    const address = order?.shippingAddress || customer?.location || "À convenir avec le client";
    const landmark = shippingLandmark || order?.shippingLandmark || "À préciser par le client / Appeler à l'arrivée";

    return `🛵 *BON DE LIVRAISON - ${businessName.toUpperCase()}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *COMMANDE :* #${order._id.toString().slice(-6).toUpperCase()}\n` +
      `📅 *DATE :* ${new Date(order.createdAt || Date.now()).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}\n\n` +
      `👤 *CLIENT :* ${customerName}\n` +
      `📞 *TÉLÉPHONE :* ${customerPhoneDisplay}\n` +
      `📍 *ADRESSE :* ${address}\n` +
      `🏢 *POINT DE REPÈRE :* ${landmark}\n\n` +
      `🛒 *ARTICLES À LIVRER :*\n${itemsList}\n\n` +
      `💰 *MONTANT À ENCAISSER :* *${amountToCollect}*\n` +
      (deliveryNotes ? `📝 *INSTRUCTIONS MARCHAND :* ${deliveryNotes}\n` : "") +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      (cleanCustomerPhone ? `👉 *WhatsApp direct client :* https://wa.me/${cleanCustomerPhone}\n` : "") +
      `🚀 *Merci d'assurer la livraison et de confirmer dès que le colis est remis !*`;
  };

  const dispatchMutation = useMutation({
    mutationFn: async () => {
      saveCourierToHistory(deliveryGuyName.trim(), cleanPhone);
      
      // Update shippingLandmark if modified
      if (shippingLandmark !== order.shippingLandmark) {
        await apiClient.patch(`/api/commerce/orders/${order._id}`, {
          shippingLandmark: shippingLandmark.trim()
        }).catch(() => {});
      }

      const res = await apiClient.post(`/api/commerce/orders/${order._id}/dispatch`, {
        deliveryGuyName: deliveryGuyName.trim() || defaultCourier?.name || "Livreur",
        deliveryGuyPhone: cleanPhone,
        deliveryNotes: deliveryNotes.trim()
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Bon de livraison envoyé au livreur sur WhatsApp ! 🛵✨");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Erreur lors de l'envoi du bon de livraison.");
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

    // Also update order status and landmark in background
    apiClient.patch(`/api/commerce/orders/${order._id}`, {
      deliveryGuyName: deliveryGuyName.trim() || defaultCourier?.name || "Livreur",
      deliveryGuyPhone: cleanPhone,
      deliveryNotes: deliveryNotes.trim(),
      shippingLandmark: shippingLandmark.trim(),
      status: order.status === "pending" || order.status === "confirmed" ? "dispatched" : order.status,
      notifyDeliveryGuy: false
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }).catch(() => {});

    toast.success("WhatsApp ouvert avec le bon de livraison pré-rempli ! 🚀");
    onClose();
  };

  if (!isOpen || !order) return null;

  const isUsingDefaultCourier = defaultCourier?.phone && getCleanPhone(defaultCourier.phone) === cleanPhone;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-50 dark:bg-[#0c1612] border-0 sm:border border-slate-200/90 dark:border-white/10 w-full h-full sm:h-auto max-w-lg rounded-none sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col text-slate-900 dark:text-white supports-[height:100dvh]:h-[100dvh] sm:supports-[height:100dvh]:h-auto max-h-[92vh]">
        <header className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/30 text-purple-600 dark:text-purple-400">
              <Truck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">Partage Logistique Livreur</h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-600 text-white !text-white shadow-sm shrink-0 whitespace-nowrap">
                  Bon de livraison
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-white/40 font-medium">Commande #{order._id.toString().slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Bon de Livraison - 5 Key Fields Visual Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2.5 text-xs shadow-sm">
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-white/5">
              <CustomerAvatar
                name={order.customerId?.name}
                phone={order.customerId?.phone}
                avatarUrl={order.customerId?.avatarUrl}
                platform={order.customerId?.platform || "whatsapp"}
                size="sm"
                showPlatformBadge={false}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-900 dark:text-white font-bold text-sm truncate">
                    {order.customerId?.name || formatDisplayPhone(order.customerId?.phone, "CI") || "Client"}
                  </span>
                  <span className="text-[10px] font-mono text-white !text-white font-bold bg-purple-600 px-2.5 py-0.5 rounded-full shadow-sm">
                    #{order._id.toString().slice(-6).toUpperCase()}
                  </span>
                </div>
                {order.customerId?.phone && (
                  <div className="text-xs text-slate-500 dark:text-white/50 font-mono">
                    {formatDisplayPhone(order.customerId?.phone, "CI")}
                  </div>
                )}
              </div>
            </div>

            {/* 5 required elements checklist */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-white/40 font-medium flex items-center gap-1.5">
                  <User size={12} className="text-emerald-500" /> Nom Client :
                </span>
                <span className="text-slate-900 dark:text-white font-bold">{order.customerId?.name || "Client"}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-white/40 font-medium flex items-center gap-1.5">
                  <Phone size={12} className="text-emerald-500" /> Téléphone :
                </span>
                <span className="text-slate-900 dark:text-white font-mono font-bold">{formatDisplayPhone(order.customerId?.phone, "CI") || "Non renseigné"}</span>
              </div>

              <div className="flex justify-between items-start text-xs gap-2">
                <span className="text-slate-500 dark:text-white/40 font-medium flex items-center gap-1.5 shrink-0">
                  <MapPin size={12} className="text-emerald-500" /> Adresse :
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-right truncate max-w-[240px]">{order.shippingAddress || order.customerId?.location || "Non spécifié"}</span>
              </div>

              <div className="flex justify-between items-start text-xs gap-2">
                <span className="text-slate-500 dark:text-white/40 font-medium flex items-center gap-1.5 shrink-0">
                  <Landmark size={12} className="text-amber-500" /> Point de repère :
                </span>
                <span className="text-amber-700 dark:text-amber-300 font-bold text-right truncate max-w-[240px]">{shippingLandmark || order.shippingLandmark || "À préciser par le client"}</span>
              </div>

              <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-100 dark:border-white/5">
                <span className="text-slate-500 dark:text-white/40 font-bold">Montant à encaisser :</span>
                <span className="text-slate-900 dark:text-white font-black text-sm">
                  {order.status === "paid" ? "0 FCFA (Déjà Payé ✅)" : `${(order.totalAmount || 0).toLocaleString()} ${order.currency || "XOF"}`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Select Default & Recent Couriers */}
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/40 flex items-center gap-1.5">
              <Clock size={13} className="text-purple-600 dark:text-purple-400" />
              Livreurs disponibles
            </label>
            <div className="flex flex-wrap gap-1.5">
              {defaultCourier?.phone && (
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryGuyName(defaultCourier.name || "Livreur Habituel");
                    setDeliveryGuyPhone(defaultCourier.phone);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isUsingDefaultCourier
                      ? "bg-purple-600 text-white !text-white border-purple-600 shadow-md shadow-purple-600/30"
                      : "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-white border-slate-200 dark:border-white/10 hover:bg-purple-600 hover:text-white hover:!text-white hover:border-purple-600"
                  }`}
                >
                  <Star size={12} className={isUsingDefaultCourier ? "fill-white text-white" : "text-amber-500"} />
                  <span className={isUsingDefaultCourier ? "text-white !text-white" : "text-slate-800 dark:text-white"}>
                    {defaultCourier.name || "Livreur Habituel"} (Marchand)
                  </span>
                </button>
              )}

              {savedCouriers.map((courier, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDeliveryGuyName(courier.name);
                    setDeliveryGuyPhone(courier.phone);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                    cleanPhone === courier.phone && !isUsingDefaultCourier
                      ? "bg-purple-600 text-white !text-white border-purple-600 shadow-sm"
                      : "bg-slate-100 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white/80 hover:bg-purple-600 hover:text-white hover:!text-white hover:border-purple-600"
                  }`}
                >
                  <span className={cleanPhone === courier.phone && !isUsingDefaultCourier ? "text-white !text-white font-bold" : "text-slate-800 dark:text-white/90"}>{courier.name}</span>
                  <span className={cleanPhone === courier.phone && !isUsingDefaultCourier ? "text-white/90 !text-white/90 font-mono text-[11px]" : "text-slate-500 dark:text-white/40 font-mono text-[11px]"}>
                    ({courier.phone.slice(-4)})
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/40 flex items-center gap-1.5 mb-1">
                  <User size={12} className="text-purple-600 dark:text-purple-400" />
                  Nom du livreur
                </label>
                <input
                  type="text"
                  value={deliveryGuyName}
                  onChange={(e) => setDeliveryGuyName(e.target.value)}
                  placeholder="Ex: Moussa Express"
                  className="w-full bg-slate-50 dark:bg-vendeur-bg border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white font-bold outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/40 flex items-center gap-1.5 mb-1">
                  <Phone size={12} className="text-purple-600 dark:text-purple-400" />
                  Numéro WhatsApp du Livreur *
                </label>
                <input
                  type="tel"
                  value={deliveryGuyPhone}
                  onChange={(e) => setDeliveryGuyPhone(e.target.value)}
                  placeholder="Ex: +225 07 00 00 00 00"
                  className="w-full bg-slate-50 dark:bg-vendeur-bg border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/40 flex items-center gap-1.5 mb-1">
                <Landmark size={12} className="text-amber-500" />
                Point de repère précis (carrefour, pharmacie...)
              </label>
              <input
                type="text"
                value={shippingLandmark}
                onChange={(e) => setShippingLandmark(e.target.value)}
                placeholder="Ex: Pharmacie des Grâces, face carrefour Pétroci..."
                className="w-full bg-slate-50 dark:bg-vendeur-bg border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/40 flex items-center gap-1.5 mb-1">
                <MapPin size={12} className="text-purple-600 dark:text-purple-400" />
                Instructions supplémentaires pour la course
              </label>
              <textarea
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Ex: Appeler avant d'arriver au carrefour, colis fragile..."
                rows={2}
                className="w-full bg-slate-50 dark:bg-vendeur-bg border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 shrink-0">
            {/* Direct WhatsApp Button */}
            <button
              type="button"
              disabled={!deliveryGuyPhone.trim()}
              onClick={handleOpenWhatsAppDirect}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-20 cursor-pointer"
            >
              <ExternalLink size={16} className="text-white" />
              Envoyer le bon sur WhatsApp
            </button>

            {/* Server Automated Dispatch */}
            <button
              type="button"
              disabled={!deliveryGuyPhone.trim() || dispatchMutation.isPending}
              onClick={() => dispatchMutation.mutate()}
              className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white !text-white border border-purple-600 font-black uppercase tracking-wider text-xs rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 transition-all shadow-md shadow-purple-600/20 disabled:opacity-30 cursor-pointer"
            >
              {dispatchMutation.isPending ? <Loader2 className="animate-spin text-white" size={16} /> : <Send size={14} className="text-white" />}
              <span className="text-white !text-white">Envoi automatique (arrière-plan)</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

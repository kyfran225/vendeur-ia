import React, { useState } from "react";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Phone,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  Banknote,
  CreditCard,
  QrCode
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { getShopTheme, type ShopTheme } from "../lib/theme";
import { cn } from "@/lib/utils";

export interface CartItem {
  product: any;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  merchant: any;
  theme?: ShopTheme;
}

const DELIVERY_ZONES: Record<string, { label: string; fee: number; eta: string }> = {
  cocody: { label: "Cocody / Deux-Plateaux / Angré / Riviera", fee: 1500, eta: "2h à 4h" },
  yopougon: { label: "Yopougon / Niangon / Maroc", fee: 2000, eta: "3h à 5h" },
  plateau: { label: "Plateau / Adjamé / Treichville", fee: 1500, eta: "2h à 4h" },
  marcory: { label: "Marcory / Zone 4 / Koumassi", fee: 1500, eta: "2h à 4h" },
  portbouet: { label: "Port-Bouët / Vridi / Gonzagueville", fee: 2500, eta: "3h à 6h" },
  abobo: { label: "Abobo / Anyama", fee: 2500, eta: "3h à 6h" },
  bingerville: { label: "Bingerville / Grand-Bassam", fee: 3000, eta: "Même jour" },
  interieur: { label: "Intérieur du pays (Expédition UTB / Poste)", fee: 3500, eta: "24h à 48h" },
  custom: { label: "Autre adresse / Livraison sur mesure", fee: 2000, eta: "À convenir" }
};

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  merchant,
  theme: customTheme
}: CartDrawerProps) {
  const theme = customTheme || getShopTheme(merchant?.branding?.accentColor);
  const [step, setStep] = useState<"cart" | "checkout" | "confirmed">("cart");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("cocody");
  const [customAddress, setCustomAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash_on_delivery" | "mobile_money">("cash_on_delivery");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  const subtotal = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const deliveryInfo = DELIVERY_ZONES[selectedZone] || DELIVERY_ZONES.custom;
  const deliveryFee = items.length > 0 ? deliveryInfo.fee : 0;
  const total = subtotal + deliveryFee;
  const currency = merchant.currency || "XOF";

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim()) {
      toast.error("Veuillez renseigner votre numéro de téléphone pour la livraison.");
      return;
    }
    if (items.length === 0) {
      toast.error("Votre panier est vide.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName: customerName.trim() || "Client Boutique",
        customerPhone: customerPhone.trim(),
        deliveryAddress: customAddress.trim() || deliveryInfo.label,
        deliveryZone: deliveryInfo.label,
        deliveryFee,
        items: items.map(it => ({
          productId: it.product._id,
          quantity: it.quantity
        })),
        paymentMethod,
        deliveryNotes: deliveryNotes.trim(),
        totalAmount: total
      };

      const res = await apiClient.post(`/api/commerce/public/shop/${merchant._id}/order`, payload);
      setCreatedOrder(res.data.order);
      setStep("confirmed");
      toast.success("Commande enregistrée avec succès !");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de l'enregistrement de la commande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateWhatsAppOrderText = () => {
    const lines = [
      `🛒 *NOUVELLE COMMANDE - ${merchant.businessName}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Client* : ${customerName || "Client Web"} (${customerPhone})`,
      `📍 *Livraison* : ${deliveryInfo.label}`,
      customAddress ? `🏠 *Détails adresse* : ${customAddress}` : "",
      `⏱ *Délai estimé* : ${deliveryInfo.eta}`,
      `💳 *Mode de paiement* : ${paymentMethod === "cash_on_delivery" ? "Espèces à la livraison" : "Mobile Money / Transfert direct (Wave, OM, MoMo, Sendwave, TapTap Send)"}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📦 *ARTICLES COMMANDÉS* :`
    ].filter(Boolean);

    items.forEach((item, idx) => {
      lines.push(`${idx + 1}. *${item.product.name}* x${item.quantity} — ${(item.product.price * item.quantity).toLocaleString()} ${currency}`);
    });

    lines.push(
      `━━━━━━━━━━━━━━━━━━━━`,
      `💵 *Sous-total* : ${subtotal.toLocaleString()} ${currency}`,
      `🛵 *Frais de livraison* : ${deliveryFee.toLocaleString()} ${currency}`,
      `🔥 *TOTAL À PAYER* : *${total.toLocaleString()} ${currency}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      deliveryNotes ? `📝 *Note client* : ${deliveryNotes}\n` : "",
      `✨ Merci de me confirmer la prise en compte et le départ du livreur !`
    );

    return lines.join("\n");
  };

  const handleOpenWhatsApp = () => {
    const message = generateWhatsAppOrderText();
    const cleanNumber = merchant.whatsappNumber?.replace(/\+/g, "").replace(/\s/g, "");
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-vendeur-coal h-full flex flex-col justify-between border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-vendeur-emerald/20 text-vendeur-emerald flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Mon Panier</h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                {items.reduce((a, b) => a + b.quantity, 0)} article(s) &bull; {merchant.businessName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {items.length === 0 ? (
            <div className="py-24 text-center space-y-4">
              <div className="h-20 w-20 mx-auto rounded-3xl bg-white/5 flex items-center justify-center text-white/20">
                <ShoppingBag size={36} />
              </div>
              <p className="text-sm font-bold text-white/60">Votre panier est actuellement vide.</p>
              <p className="text-xs text-white/30 max-w-xs mx-auto">Ajoutez des articles depuis la vitrine pour passer commande en 1 clic.</p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-3 bg-vendeur-emerald text-vendeur-coal font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
              >
                Découvrir le catalogue
              </button>
            </div>
          ) : step === "cart" ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {items.map(({ product, quantity }) => (
                  <div
                    key={product._id}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4 hover:border-white/10 transition-all"
                  >
                    <div className="h-16 w-16 rounded-xl bg-black/40 overflow-hidden shrink-0">
                      {product.images?.[0] || product.imageUrl ? (
                        <img
                          src={product.images?.[0] || product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <ShoppingBag size={20} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black uppercase tracking-tight truncate">{product.name}</h4>
                      <p className={cn("text-xs font-bold mt-0.5", theme.textClass)}>
                        {product.price.toLocaleString()} {currency}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-white/10 rounded-lg bg-black/20">
                          <button
                            onClick={() => onUpdateQuantity(product._id, -1)}
                            className="h-7 w-7 flex items-center justify-center text-white/60 hover:text-white"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-xs font-black">{quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(product._id, 1)}
                            className="h-7 w-7 flex items-center justify-center text-white/60 hover:text-white"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() => onRemoveItem(product._id)}
                          className="text-white/30 hover:text-rose-400 text-xs transition-colors p-1"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black">
                        {(product.price * quantity).toLocaleString()} {currency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Zone Pre-selector */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white/70">
                  <MapPin size={14} className={theme.textClass} />
                  <span>Zone de livraison</span>
                </div>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-white/30 transition-all"
                >
                  {Object.entries(DELIVERY_ZONES).map(([key, zone]) => (
                    <option key={key} value={key} className="bg-vendeur-coal text-white">
                      {zone.label} (+{zone.fee.toLocaleString()} {currency} &bull; {zone.eta})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : step === "checkout" ? (
            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-black uppercase tracking-tight">Coordonnées de livraison</h3>
                <p className="text-xs text-white/40 font-medium">Renseignez vos infos pour valider la commande immédiatement.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">
                    Votre Nom complet
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input
                      type="text"
                      placeholder="Ex: Kouamé Jean"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 text-xs text-white outline-none focus:border-white/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">
                    Numéro WhatsApp / Téléphone <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input
                      type="tel"
                      required
                      placeholder="Ex: +225 07 00 00 00 00"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-10 pr-3 text-xs text-white outline-none focus:border-white/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">
                    Adresse ou repère précis
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Cocody Angré 8ème tranche, Pharmacie des Grâces"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white outline-none focus:border-white/30 transition-all"
                  />
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-1.5">
                    Mode de Règlement
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash_on_delivery")}
                      className={cn(
                        "p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all",
                        paymentMethod === "cash_on_delivery"
                          ? cn(theme.badgeBgClass, theme.badgeBorderClass, "text-white")
                          : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                      )}
                    >
                      <Banknote size={16} className={paymentMethod === "cash_on_delivery" ? theme.textClass : ""} />
                      <div>
                        <p className="text-[10px] font-black uppercase">À la livraison</p>
                        <p className="text-[8px] text-white/40 font-bold">Espèces au livreur</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("mobile_money")}
                      className={cn(
                        "p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all",
                        paymentMethod === "mobile_money"
                          ? cn(theme.badgeBgClass, theme.badgeBorderClass, "text-white")
                          : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                      )}
                    >
                      <CreditCard size={16} className={paymentMethod === "mobile_money" ? theme.textClass : ""} />
                      <div>
                        <p className="text-[10px] font-black uppercase">Mobile Money / Envois</p>
                        <p className="text-[8px] text-white/40 font-bold">Wave, OM, MoMo / Diaspora</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">
                    Instructions spécifiques (optionnel)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Livrer avant 14h, appeler à l'arrivée..."
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-white/30 transition-all resize-none"
                  />
                </div>
              </div>
            </form>
          ) : (
            /* Step Confirmed */
            <div className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className={cn("h-20 w-20 mx-auto rounded-3xl flex items-center justify-center shadow-xl", theme.badgeBgClass, theme.textClass, theme.shadowClass)}>
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Commande Enregistrée !</h3>
                <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
                  Votre commande a été transmise en direct au vendeur. Finalisez la confirmation en ouvrant WhatsApp.
                </p>
              </div>

              {/* Order Summary Box */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-left space-y-2 text-xs">
                <div className="flex justify-between text-white/60">
                  <span>Numéro commande</span>
                  <span className="font-mono font-bold text-white">#{createdOrder?._id?.substring(0, 8)}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Articles ({items.length})</span>
                  <span>{subtotal.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Livraison ({deliveryInfo.label.split("/")[0]})</span>
                  <span>{deliveryFee.toLocaleString()} {currency}</span>
                </div>
                <div className={cn("pt-2 border-t border-white/10 flex justify-between font-black text-sm", theme.textClass)}>
                  <span>Total</span>
                  <span>{total.toLocaleString()} {currency}</span>
                </div>
              </div>

              {paymentMethod === "mobile_money" && (
                <div className={cn("p-4 rounded-2xl border text-left space-y-2", theme.badgeBgClass, theme.badgeBorderClass)}>
                  <div className={cn("flex items-center gap-2 text-xs font-black uppercase", theme.textClass)}>
                    <QrCode size={16} />
                    <span>Paiement Mobile Money Direct</span>
                  </div>
                  <p className="text-[11px] text-white/70">
                    Vous recevrez les instructions ou le lien de paiement direct Wave / Orange Money dès l&apos;ouverture du chat WhatsApp.
                  </p>
                </div>
              )}

              <button
                onClick={handleOpenWhatsApp}
                className={cn("w-full h-14 text-vendeur-coal font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl", theme.bgClass, theme.hoverBgClass, theme.shadowClass)}
              >
                <MessageCircle size={18} />
                <span>Ouvrir WhatsApp pour confirmer</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Area */}
        {items.length > 0 && step !== "confirmed" && (
          <div className="p-5 md:p-6 border-t border-white/10 bg-white/[0.02] space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/40 font-bold">
                <span>Sous-total</span>
                <span>{subtotal.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-xs text-white/40 font-bold">
                <span>Frais de livraison estimés</span>
                <span>{deliveryFee.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-base font-black pt-2 border-t border-white/5">
                <span className="uppercase tracking-tight">Total</span>
                <span className={theme.textClass}>{total.toLocaleString()} {currency}</span>
              </div>
            </div>

            {step === "cart" ? (
              <button
                onClick={() => setStep("checkout")}
                className={cn("w-full h-14 text-vendeur-coal font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl", theme.bgClass, theme.hoverBgClass, theme.shadowClass)}
              >
                <span>Passer à la livraison</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStep("cart")}
                  className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 font-black uppercase text-[10px] tracking-widest"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutSubmit}
                  disabled={isSubmitting}
                  className={cn("col-span-2 h-14 text-vendeur-coal font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50", theme.bgClass, theme.hoverBgClass, theme.shadowClass)}
                >
                  {isSubmitting ? (
                    <Sparkles className="animate-spin" size={16} />
                  ) : (
                    <>
                      <span>Confirmer &amp; Envoyer</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/30">
              <ShieldCheck size={12} className={theme.textClass} />
              <span>Commande sécurisée &bull; Vendeur certifié Vendeur IA</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

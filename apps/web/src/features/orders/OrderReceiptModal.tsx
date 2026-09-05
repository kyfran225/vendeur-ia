import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { X, Printer, Download, Share2, ShoppingBag, MapPin, Calendar, CheckCircle2, User, Phone } from "lucide-react";
import { toast } from "sonner";
import { formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";

interface OrderReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  merchant: any;
}

export function OrderReceiptModal({ isOpen, onClose, order, merchant }: OrderReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const orderNumber = order._id?.toString().slice(-6).toUpperCase() || "000000";
  const formattedDate = new Date(order.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const currency = order.currency || merchant?.currency || "XOF";

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const itemsList = order.items.map((i: any) => `• ${i.quantity}x ${i.name} - ${(i.price * i.quantity).toLocaleString()} ${currency}`).join("\n");
    const text = `*BON DE COMMANDE / FACTURE - ${merchant?.businessName || "Vendeur IA"}*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Commande:* #${orderNumber}\n` +
      `*Date:* ${formattedDate}\n` +
      `*Client:* ${formatDisplayPhone(order.customerId?.phone) || "Client"}\n` +
      (order.shippingAddress ? `*Livraison:* ${order.shippingAddress}\n` : "") +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Articles :*\n${itemsList}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*TOTAL : ${order.totalAmount.toLocaleString()} ${currency}*\n` +
      `*Statut :* ${order.status === "paid" ? "Payé" : order.status === "delivered" ? "Livré" : "En attente"}\n\n` +
      `Merci pour votre confiance !`;

    const phone = order.customerId?.phone?.replace(/[^0-9]/g, "");
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    toast.success("Bordereau prêt pour WhatsApp !");
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-vendeur-coal border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
        {/* Header Actions */}
        <header className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
            >
              <Printer size={14} />
              <span>Imprimer</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:text-black transition-all"
            >
              <Share2 size={14} />
              <span>WhatsApp</span>
            </button>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <X size={20} />
          </button>
        </header>

        {/* Printable Ticket Receipt Area */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white text-black font-sans print:p-0" ref={receiptRef}>
          <div className="text-center space-y-2 pb-6 border-b-2 border-dashed border-neutral-300">
            <div className="h-12 w-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mx-auto shadow-md">
              <ShoppingBag size={24} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">{merchant?.businessName || "Vendeur IA"}</h2>
            <p className="text-xs text-neutral-500 font-medium">{merchant?.city || "Boutique Officielle"}, {merchant?.country || "CI"}</p>
            {merchant?.whatsappNumber && (
              <p className="text-[11px] font-bold text-neutral-600">Contact: {formatDisplayPhone(merchant.whatsappNumber, merchant?.country || "CI")}</p>
            )}
          </div>

          <div className="py-4 border-b border-neutral-200 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-500">N° Commande :</span>
              <span className="font-mono font-black text-neutral-900">#{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Date :</span>
              <span className="font-semibold text-neutral-800">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Client :</span>
              <span className="font-bold text-neutral-900">{formatDisplayPhone(order.customerId?.phone) || "Client Direct"}</span>
            </div>
            {order.shippingAddress && (
              <div className="flex justify-between">
                <span className="text-neutral-500">Lieu de livraison :</span>
                <span className="font-bold text-neutral-900 text-right max-w-[200px]">{order.shippingAddress}</span>
              </div>
            )}
            {order.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-neutral-500">Paiement :</span>
                <span className="font-bold text-neutral-900 uppercase">{order.paymentMethod}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-4 border-b-2 border-dashed border-neutral-300">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-neutral-400 border-b border-neutral-100 uppercase text-[10px] tracking-wider">
                  <th className="text-left pb-2 font-bold">Article</th>
                  <th className="text-center pb-2 font-bold">Qté</th>
                  <th className="text-right pb-2 font-bold">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {order.items.map((item: any, idx: number) => (
                  <tr key={idx} className="py-2">
                    <td className="py-2.5 font-bold text-neutral-800 pr-2">{item.name}</td>
                    <td className="py-2.5 text-center text-neutral-600 font-medium">x{item.quantity}</td>
                    <td className="py-2.5 text-right font-black text-neutral-900 whitespace-nowrap">
                      {(item.price * item.quantity).toLocaleString()} {currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="pt-4 pb-6 space-y-2">
            <div className="flex justify-between items-center text-sm font-bold text-neutral-600">
              <span>Sous-total</span>
              <span>{order.totalAmount.toLocaleString()} {currency}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-black text-neutral-900 pt-2 border-t border-neutral-200">
              <span className="uppercase tracking-wider text-xs">Total Net</span>
              <span className="text-2xl font-black text-emerald-600">{order.totalAmount.toLocaleString()} {currency}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold pt-1">
              <span className="text-neutral-500">Statut :</span>
              <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 font-black uppercase text-[10px]">
                {order.status === "paid" ? "Payé" : order.status === "delivered" ? "Livré" : "En attente"}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-dashed border-neutral-300 space-y-1">
            <p className="text-[11px] font-bold text-neutral-800">Merci de votre fidélité !</p>
            <p className="text-[9px] text-neutral-400">Généré via Vendeur IA OS</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

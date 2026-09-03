import React, { useState } from "react";
import { X, QrCode, Copy, Check, Share2, MessageCircle, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface ShareShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: any;
  shopUrl: string;
}

export function ShareShopModal({ isOpen, onClose, merchant, shopUrl }: ShareShopModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shopUrl)}&bgcolor=111827&color=10b981&margin=10`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    toast.success("Lien de la boutique copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🛍️ Découvrez la boutique officielle de *${merchant.businessName}* !\n\nConsultez tous nos articles et commandez directement en 1 clic ici :\n${shopUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleDownloadQr = () => {
    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `qrcode-${merchant.businessName.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.target = "_blank";
    link.click();
    toast.success("QR Code téléchargé !");
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0d1f18] text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-9 w-9 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-950 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/40 dark:hover:text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="space-y-2">
          <div className="h-12 w-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Share2 size={24} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Partager la boutique</h3>
          <p className="text-xs text-slate-600 dark:text-white/40 font-medium">Partagez votre boutique avec vos clients ou téléchargez le QR Code pour votre magasin.</p>
        </div>

        {/* QR Code Frame */}
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/5 inline-block mx-auto shadow-inner">
          <img
            src={qrImageUrl}
            alt={`QR Code ${merchant.businessName}`}
            className="w-48 h-48 rounded-xl object-contain mx-auto"
          />
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-2">
            Scanner pour commander
          </p>
        </div>

        {/* Link Copy Bar */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <input
            type="text"
            readOnly
            value={shopUrl}
            className="flex-1 bg-transparent px-3 text-xs text-slate-700 dark:text-white/70 outline-none truncate font-mono"
          />
          <button
            onClick={handleCopy}
            className="h-9 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-600 dark:text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? "Copié" : "Copier"}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleShareWhatsApp}
            className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <MessageCircle size={18} />
            <span>Statut WhatsApp</span>
          </button>

          <button
            onClick={handleDownloadQr}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download size={18} />
            <span>Enregistrer QR</span>
          </button>
        </div>
      </div>
    </div>
  );
}

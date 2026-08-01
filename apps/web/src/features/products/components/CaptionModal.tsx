import React from "react";
import { X, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface CaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  caption: string;
  productName: string;
}

export function CaptionModal({ isOpen, onClose, caption, productName }: CaptionModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    toast.success("Légende copiée !");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0c0f0d] border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-500/20 rounded-lg">
              <Sparkles size={20} className="text-sky-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Légende IA</h2>
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold">{productName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-vendeur-coal border border-white/10 rounded-2xl p-6 min-h-[200px] whitespace-pre-wrap text-sm leading-relaxed text-white/90">
            {caption}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleCopy}
            className="w-full h-14 bg-sky-400 text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? "Copié !" : "Copier la légende"}
          </button>
          <p className="text-center text-[10px] text-white/30 font-medium italic">
            Collez ce texte sur TikTok ou Instagram avec votre photo/vidéo.
          </p>
        </div>
      </div>
    </div>
  );
}

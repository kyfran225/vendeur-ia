import React from "react";
import { X, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  caption: any; // Can be string (fallback) or object with viral/professional/urgent
  productName: string;
}

export function CaptionModal({ isOpen, onClose, caption, productName }: CaptionModalProps) {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [activeStyle, setActiveStyle] = React.useState<string>("viral");

  const captionsMap = React.useMemo(() => {
    if (!caption) return { viral: "Légende en cours...", professional: "Légende en cours...", urgent: "Légende en cours..." };
    if (typeof caption === 'string') return { viral: caption, professional: caption, urgent: caption };
    return {
      viral: caption.viral || "Légende non disponible",
      professional: caption.professional || "Légende non disponible",
      urgent: caption.urgent || "Légende non disponible"
    };
  }, [caption]);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Légende copiée !");
    setTimeout(() => setCopied(null), 2000);
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

        <div className="flex gap-2">
          {["viral", "professional", "urgent"].map(style => (
            <button
              key={style}
              onClick={() => setActiveStyle(style)}
              className={cn(
                "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                activeStyle === style
                  ? "bg-sky-500/10 border-sky-500 text-sky-400"
                  : "bg-white/5 border-white/5 text-white/40 hover:border-white/20"
              )}
            >
              {style === 'viral' ? '🚀 Viral' : style === 'professional' ? '👔 Pro' : '🔥 Flash'}
            </button>
          ))}
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-vendeur-coal border border-white/10 rounded-2xl p-6 min-h-[200px] whitespace-pre-wrap text-sm leading-relaxed text-white/90">
            {captionsMap[activeStyle]}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleCopy(captionsMap[activeStyle], activeStyle)}
            className="w-full h-14 bg-sky-400 text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {copied === activeStyle ? <Check size={18} /> : <Copy size={18} />}
            {copied === activeStyle ? "Copié !" : "Copier la légende"}
          </button>
          <p className="text-center text-[10px] text-white/30 font-medium italic">
            Collez ce texte sur TikTok ou Instagram avec votre photo/vidéo.
          </p>
        </div>
      </div>
    </div>
  );
}

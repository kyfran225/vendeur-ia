import React, { useRef, useState, useEffect } from "react";
import { Download, Share2, ChevronLeft, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface PosterGeneratorProps {
  productData: {
    name: string;
    price: number;
    category: string;
    image: string;
    currency?: string;
  };
  boutiqueName: string;
  businessCategory: string;
  currency?: string;
  logoUrl?: string;
  onBack: () => void;
  onSave: (finalImage: string) => void;
}

const CATEGORY_CONFIGS: Record<string, any> = {
  fashion: { defaultColor: "#10b981", slogan: "L'élégance à votre portée.", font: "serif" },
  food: { defaultColor: "#f59e0b", slogan: "Savourez l'instant présent.", font: "sans-serif" },
  services: { defaultColor: "#0ea5e9", slogan: "L'expertise qui fait la différence.", font: "sans-serif" },
  digital: { defaultColor: "#a855f7", slogan: "Le futur est entre vos mains.", font: "mono" },
  artisan: { defaultColor: "#f97316", slogan: "L'art du fait main, chez vous.", font: "serif" },
  beauty: { defaultColor: "#ec4899", slogan: "Révélez votre beauté naturelle.", font: "serif" },
  electronics: { defaultColor: "#3b82f6", slogan: "La technologie au service de demain.", font: "mono" },
  home: { defaultColor: "#6366f1", slogan: "Votre foyer, votre style.", font: "serif" },
  grocery: { defaultColor: "#84cc16", slogan: "Le goût de la fraîcheur.", font: "sans-serif" },
  health: { defaultColor: "#ef4444", slogan: "Prenez soin de vous.", font: "sans-serif" },
  auto: { defaultColor: "#64748b", slogan: "La route en toute confiance.", font: "mono" },
  other: { defaultColor: "#71717a", slogan: "La qualité au meilleur prix.", font: "sans-serif" }
};

export function PosterGenerator({
  productData,
  boutiqueName,
  businessCategory,
  currency = productData.currency || "XOF",
  onBack,
  onSave
}: PosterGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState(productData.name || "Produit");
  const [price, setPrice] = useState(productData.price ? productData.price.toString() : "0");
  const [slogan, setSlogan] = useState(CATEGORY_CONFIGS[businessCategory]?.slogan || "Ne manquez pas cette offre !");
  const [themeColor, setThemeColor] = useState(CATEGORY_CONFIGS[businessCategory]?.defaultColor || "#10b981");
  const [template, setTemplate] = useState<"modern" | "minimal" | "bold">("modern");

  const config = CATEGORY_CONFIGS[businessCategory] || CATEGORY_CONFIGS.other;

  const renderPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1350;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = productData.image;

    img.onload = () => {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const scale = Math.max(canvas.width / img.width, (canvas.height * 0.75) / img.height);
      const x = (canvas.width - img.width * scale) / 2;
      const y = 0;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      const gradient = ctx.createLinearGradient(0, canvas.height * 0.4, 0, canvas.height);
      const isDark = template !== "minimal";
      if (isDark) {
        gradient.addColorStop(0, "transparent");
        gradient.addColorStop(0.6, "rgba(0,0,0,0.85)");
        gradient.addColorStop(1, "#000000");
      } else {
        gradient.addColorStop(0, "transparent");
        gradient.addColorStop(0.6, "rgba(255,255,255,0.85)");
        gradient.addColorStop(1, "#ffffff");
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = themeColor;
      ctx.beginPath();
      ctx.roundRect(80, 80, 400, 80, 20);
      ctx.fill();

      ctx.fillStyle = "#000000";
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(boutiqueName.toUpperCase(), 280, 130);

      ctx.fillStyle = isDark ? "#ffffff" : "#000000";
      ctx.font = `black 90px ${config.font}`;
      ctx.fillText(name, canvas.width / 2, canvas.height - 280);

      const priceText = `${parseInt(price).toLocaleString()} ${currency}`;
      if (businessCategory === "food") {
         ctx.fillStyle = "#ffffff";
         const priceWidth = ctx.measureText(priceText).width + 100;
         ctx.beginPath();
         ctx.roundRect((canvas.width - priceWidth) / 2, canvas.height - 220, priceWidth, 120, 20);
         ctx.fillStyle = themeColor;
         ctx.fill();
         ctx.fillStyle = "#ffffff";
         ctx.font = "bold 70px sans-serif";
         ctx.fillText(priceText, canvas.width / 2, canvas.height - 135);
      } else {
         ctx.fillStyle = themeColor;
         ctx.font = `bold 100px ${config.font}`;
         ctx.fillText(priceText, canvas.width / 2, canvas.height - 160);
      }

      ctx.fillStyle = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
      ctx.font = "bold 25px sans-serif";
      ctx.fillText("COMMANDEZ SUR WHATSAPP", canvas.width / 2, canvas.height - 70);
    };
  };

  useEffect(() => {
    renderPoster();
  }, [name, price, slogan, themeColor, template, productData.image, currency]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement("a");
      link.download = `affiche-${name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const handleFinalSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL("image/jpeg", 0.8));
    }
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;
      const file = new File([blob], `affiche-${name}.png`, { type: "image/png" });
      const text = `Découvrez ${name} chez ${boutiqueName} ! 🛍️\n\nPrix: ${parseInt(price).toLocaleString()} ${currency}\n\nCommandez sur mon WhatsApp !`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: name, text });
      } else {
        handleDownload();
      }
    } catch (err) {
      console.error("Share failed:", err);
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300 overflow-hidden">
      <div className="p-4 bg-black/40 backdrop-blur-xl border-b border-white/10 flex justify-between items-center z-50">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white font-bold text-xs uppercase tracking-widest"
        >
          <ChevronLeft size={20} /> Retour
        </button>
        <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles size={14} /> Studio Affiche IA
        </span>
        <button
          onClick={handleFinalSave}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Check size={16} /> Enregistrer
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 gap-6 overflow-y-auto">
        <div className="relative max-w-sm w-full aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
        </div>

        <div className="w-full max-w-sm space-y-4 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Titre du Produit</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Prix Final ({currency})</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-emerald-400 font-black text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 space-y-3">
            <button
              onClick={handleShare}
              className="w-full h-12 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Share2 size={16} /> Partager WhatsApp
            </button>
            <button
              onClick={handleDownload}
              className="w-full h-12 rounded-xl bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Download size={16} /> Télécharger Image HD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

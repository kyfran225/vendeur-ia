import React, { useRef, useState, useEffect, useMemo } from "react";
import { Download, Share2, Palette, Type, ShoppingBag, ChevronLeft, Check, Sparkles, Image as ImageIcon, Utensils, Zap, Laptop, Hammer, Heart, Monitor, Home, ShoppingCart, Activity, Car, Box } from "lucide-react";
import { toast } from "sonner";

interface PosterGeneratorProps {
  productData: {
    name: string;
    price: number;
    category: string;
    image: string;
  };
  boutiqueName: string;
  businessCategory: string;
  logoUrl?: string;
  onBack: () => void;
  onSave: (finalImage: string) => void;
}

const CATEGORY_CONFIGS: Record<string, any> = {
  fashion: {
    defaultColor: "#10b981",
    slogan: "L'élégance à votre portée.",
    icon: <ShoppingBag size={24} />,
    font: "serif"
  },
  food: {
    defaultColor: "#f59e0b",
    slogan: "Savourez l'instant présent.",
    icon: <Utensils size={24} />,
    font: "sans-serif"
  },
  services: {
    defaultColor: "#0ea5e9",
    slogan: "L'expertise qui fait la différence.",
    icon: <Zap size={24} />,
    font: "sans-serif"
  },
  digital: {
    defaultColor: "#a855f7",
    slogan: "Le futur est entre vos mains.",
    icon: <Laptop size={24} />,
    font: "mono"
  },
  artisan: {
    defaultColor: "#f97316",
    slogan: "L'art du fait main, chez vous.",
    icon: <Hammer size={24} />,
    font: "serif"
  },
  beauty: {
    defaultColor: "#ec4899",
    slogan: "Révélez votre beauté naturelle.",
    icon: <Heart size={24} />,
    font: "serif",
    label: "Beauté"
  },
  electronics: {
    defaultColor: "#3b82f6",
    slogan: "La technologie au service de demain.",
    icon: <Monitor size={24} />,
    font: "mono",
    label: "High-Tech"
  },
  home: {
    defaultColor: "#6366f1",
    slogan: "Votre foyer, votre style.",
    icon: <Home size={24} />,
    font: "serif",
    label: "Maison"
  },
  grocery: {
    defaultColor: "#84cc16",
    slogan: "Le goût de la fraîcheur.",
    icon: <ShoppingCart size={24} />,
    font: "sans-serif",
    label: "Épicerie"
  },
  health: {
    defaultColor: "#ef4444",
    slogan: "Prenez soin de vous.",
    icon: <Activity size={24} />,
    font: "sans-serif",
    label: "Santé"
  },
  auto: {
    defaultColor: "#64748b",
    slogan: "La route en toute confiance.",
    icon: <Car size={24} />,
    font: "mono",
    label: "Auto-Moto"
  },
  other: {
    defaultColor: "#71717a",
    slogan: "La qualité au meilleur prix.",
    icon: <Box size={24} />,
    font: "sans-serif",
    label: "Boutique"
  }
};

const CATEGORY_LABELS: Record<string, string> = {
  fashion: "Mode",
  food: "Restauration",
  services: "Services",
  digital: "Digital",
  artisan: "Artisanat",
  beauty: "Beauté",
  electronics: "High-Tech",
  home: "Maison",
  grocery: "Épicerie",
  health: "Santé",
  auto: "Auto-Moto",
  other: "Boutique"
};

export function PosterGenerator({ productData, boutiqueName, businessCategory, logoUrl, onBack, onSave }: PosterGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = CATEGORY_CONFIGS[businessCategory] || CATEGORY_CONFIGS.fashion;

  const [name, setName] = useState(productData.name);
  const [price, setPrice] = useState(productData.price.toString());
  const [slogan, setSlogan] = useState(config.slogan);
  const [themeColor, setThemeColor] = useState(config.defaultColor);
  const [template, setTemplate] = useState<"luxe" | "modern" | "impact">("modern");

  const renderPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 1000;

    // 1. Background Logic based on Template
    if (template === "luxe") {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#0c0f0d");
      grad.addColorStop(1, "#050706");
      ctx.fillStyle = grad;
    } else if (template === "modern") {
      ctx.fillStyle = "#ffffff";
    } else {
      ctx.fillStyle = themeColor;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Artistic Elements
    if (template === "modern") {
      ctx.fillStyle = themeColor + "11";
      ctx.beginPath();
      ctx.arc(canvas.width, 0, 800, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Load Image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = productData.image;
    img.onload = () => {
      // Product Shadow
      ctx.shadowBlur = 40;
      ctx.shadowColor = "rgba(0,0,0,0.15)";

      const scale = 0.75;
      const imgWidth = canvas.width * scale;
      const imgHeight = (img.height / img.width) * imgWidth;
      const x = (canvas.width - imgWidth) / 2;
      const y = (canvas.height - imgHeight) / 2 - 80;

      ctx.drawImage(img, x, y, imgWidth, imgHeight);
      ctx.shadowBlur = 0;

      // 4. Texts
      const isDark = template === "luxe" || template === "impact";
      ctx.fillStyle = isDark ? "#ffffff" : "#000000";
      ctx.textAlign = "center";

      // Boutique Info
      ctx.font = `bold 40px ${config.font}`;
      ctx.fillText(boutiqueName.toUpperCase(), canvas.width / 2, 100);

      // Slogan
      ctx.font = `italic 30px ${config.font}`;
      ctx.globalAlpha = 0.6;
      ctx.fillText(slogan, canvas.width / 2, 150);
      ctx.globalAlpha = 1;

      // Product Info
      ctx.font = `black 90px ${config.font}`;
      ctx.fillText(name, canvas.width / 2, canvas.height - 280);

      // Price Tag (Styled differently for Food)
      if (businessCategory === "food") {
         ctx.fillStyle = "#ffffff";
         const priceWidth = ctx.measureText(`${parseInt(price).toLocaleString()} FCFA`).width + 100;
         ctx.beginPath();
         ctx.roundRect((canvas.width - priceWidth) / 2, canvas.height - 220, priceWidth, 120, 20);
         ctx.fillStyle = themeColor;
         ctx.fill();
         ctx.fillStyle = "#ffffff";
         ctx.font = "bold 70px sans-serif";
         ctx.fillText(`${parseInt(price).toLocaleString()} FCFA`, canvas.width / 2, canvas.height - 135);
      } else {
         ctx.fillStyle = themeColor;
         ctx.font = `bold 100px ${config.font}`;
         ctx.fillText(`${parseInt(price).toLocaleString()} FCFA`, canvas.width / 2, canvas.height - 160);
      }

      // Footer
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";
      ctx.font = "bold 25px sans-serif";
      ctx.fillText("COMMANDEZ SUR WHATSAPP", canvas.width / 2, canvas.height - 70);
    };
  };

  useEffect(() => {
    renderPoster();
  }, [name, price, slogan, themeColor, template, productData.image]);

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
      const text = `Découvrez ${name} chez ${boutiqueName} ! 🛍️\n\nPrix: ${parseInt(price).toLocaleString()} FCFA\n\nCommandez sur mon WhatsApp !`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: name, text });
      } else {
        handleDownload();
        toast.info("Image téléchargée ! Vous pouvez maintenant la partager.");
      }
    } catch (e) { toast.error("Erreur lors du partage"); }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#07100d] flex flex-col lg:flex-row overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-6 bg-black/40 relative">
        <div className="relative w-full max-w-[420px] aspect-[4/5] bg-white rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full z-10 border border-white/10">
            <div className="text-emerald-400 scale-90">{config.icon}</div>
            <span className="text-[8px] font-black text-white uppercase tracking-widest">{CATEGORY_LABELS[businessCategory] || "Boutique"}</span>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[480px] bg-[#0c0f0d] border-l border-white/5 p-8 flex flex-col gap-8 overflow-y-auto">
        <header className="flex justify-between items-center">
          <button onClick={onBack} className="text-white/40 hover:text-white flex items-center gap-2 font-black uppercase tracking-widest text-[10px]">
            <ChevronLeft size={16} /> Annuler
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Sparkles size={20} />
          </div>
        </header>

        <section className="space-y-6">
          <div>
            <h2 className="text-3xl font-black text-white leading-tight">Studio IA Intelligente</h2>
            <p className="text-white/40 text-sm">Votre affiche s'est adaptée à votre métier de {businessCategory}.</p>
          </div>

          <div className="space-y-4">
            <label className="grid gap-2">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Nom de l'article</span>
              <input value={name} onChange={e => setName(e.target.value)} className="h-14 rounded-2xl bg-white/5 border border-white/10 px-4 text-white outline-none focus:border-emerald-300 transition-all" />
            </label>
            <label className="grid gap-2">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Slogan IA (Modifiable)</span>
              <input value={slogan} onChange={e => setSlogan(e.target.value)} className="h-14 rounded-2xl bg-white/5 border border-white/10 px-4 text-white/60 italic outline-none focus:border-emerald-300 transition-all" />
            </label>
            <label className="grid gap-2">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Prix Final (FCFA)</span>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="h-14 rounded-2xl bg-white/5 border border-white/10 px-4 text-emerald-400 font-bold outline-none focus:border-emerald-300 transition-all" />
            </label>
          </div>

          <div className="space-y-4">
             <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Templates Adaptatifs</span>
             <div className="flex gap-2">
                {["luxe", "modern", "impact"].map(t => (
                  <button key={t} onClick={() => setTemplate(t as any)} className={`flex-1 py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${template === t ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/40"}`}>
                    {t}
                  </button>
                ))}
             </div>
          </div>
        </section>

        <footer className="mt-auto pt-8 flex flex-col gap-4">
           <button onClick={handleFinalSave} className="h-16 rounded-[2rem] bg-emerald-400 text-black font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
             <Check size={20} /> Valider et Ajouter
           </button>
           <button onClick={handleShare} className="h-14 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#25D366]/20 transition-all">
             <Share2 size={20} /> Partager WhatsApp
           </button>
           <button onClick={handleDownload} className="h-12 rounded-xl border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
             Enregistrer Image HD
           </button>
        </footer>
      </div>
    </div>
  );
}

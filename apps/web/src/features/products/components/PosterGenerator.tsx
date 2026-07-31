import React, { useRef, useState, useEffect } from "react";
import { Download, Share2, Palette, Type, ShoppingBag, ChevronLeft, Check, Sparkles, Image as ImageIcon } from "lucide-react";

interface PosterGeneratorProps {
  productData: {
    name: string;
    price: number;
    category: string;
    image: string; // This should be the background-removed image
  };
  boutiqueName: string;
  logoUrl?: string;
  onBack: () => void;
  onSave: (finalImage: string) => void;
}

export function PosterGenerator({ productData, boutiqueName, logoUrl, onBack, onSave }: PosterGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState(productData.name);
  const [price, setPrice] = useState(productData.price.toString());
  const [themeColor, setThemeColor] = useState("#10b981"); // Emerald default
  const [template, setTemplate] = useState<"luxe" | "minimal" | "promo">("luxe");

  const renderPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high resolution for export
    canvas.width = 1080;
    canvas.height = 1350; // 4:5 aspect ratio for social media

    // 1. Draw Background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (template === "luxe") {
      gradient.addColorStop(0, "#0c0f0d");
      gradient.addColorStop(1, "#050706");
    } else if (template === "minimal") {
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(1, "#f3f4f6");
    } else {
      gradient.addColorStop(0, themeColor);
      gradient.addColorStop(1, "#000000");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Decorative Elements (Shadow/Glow)
    ctx.shadowBlur = 100;
    ctx.shadowColor = themeColor + "44";
    ctx.fillStyle = themeColor + "22";
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 400, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. Load and Draw Product Image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = productData.image;
    img.onload = () => {
      // Draw product with a nice shadow
      ctx.shadowBlur = 50;
      ctx.shadowColor = "rgba(0,0,0,0.5)";

      const scale = 0.7;
      const imgWidth = canvas.width * scale;
      const imgHeight = (img.height / img.width) * imgWidth;
      const x = (canvas.width - imgWidth) / 2;
      const y = (canvas.height - imgHeight) / 2 - 50;

      ctx.drawImage(img, x, y, imgWidth, imgHeight);
      ctx.shadowBlur = 0;

      // 4. Draw Branding & Info
      ctx.fillStyle = template === "minimal" ? "#000000" : "#ffffff";
      ctx.textAlign = "center";

      // Boutique Name / Logo
      ctx.font = "bold 40px sans-serif";
      ctx.textBaseline = "top";
      ctx.fillText(boutiqueName.toUpperCase(), canvas.width / 2, 80);

      // Product Name
      ctx.font = "black 80px sans-serif";
      ctx.fillText(name, canvas.width / 2, canvas.height - 250);

      // Price Tag
      ctx.font = "bold 100px sans-serif";
      ctx.fillStyle = themeColor;
      ctx.fillText(`${parseInt(price).toLocaleString()} FCFA`, canvas.width / 2, canvas.height - 140);

      // Call to action
      ctx.font = "500 30px sans-serif";
      ctx.fillStyle = template === "minimal" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)";
      ctx.fillText("DISPONIBLE SUR WHATSAPP", canvas.width / 2, canvas.height - 60);
    };
  };

  useEffect(() => {
    renderPoster();
  }, [name, price, themeColor, template, productData.image]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement("a");
      link.download = `poster-${name}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const handleShare = async (platform?: "whatsapp" | "all") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;

      const file = new File([blob], `affiche-${name}.png`, { type: "image/png" });
      const shareText = `Découvrez ${name} chez ${boutiqueName} ! 🛍️\n\nPrix: ${parseInt(price).toLocaleString()} FCFA\n\nCommandez directement sur mon catalogue WhatsApp !`;

      if (platform === "whatsapp") {
        // WhatsApp specific: if mobile sharing is available, use it, otherwise fallback to wa.me
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: name,
            text: shareText,
          });
        } else {
          const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
          window.open(url, "_blank");
        }
      } else {
        // General share for Instagram, Facebook, TikTok etc.
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: name,
            text: shareText,
          });
        } else {
          handleDownload();
          toast.info("Le partage direct n'est pas disponible sur ce navigateur. L'image a été téléchargée pour que vous puissiez la publier manuellement.");
        }
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Erreur lors du partage.");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#07100d] flex flex-col lg:flex-row overflow-hidden">
      {/* Left: Preview */}
      <div className="flex-1 flex items-center justify-center p-6 bg-black/20 overflow-y-auto">
        <div className="relative w-full max-w-[400px] aspect-[4/5] bg-black rounded-[2rem] overflow-hidden shadow-2xl border border-white/5">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
          <div className="absolute top-4 right-4 bg-emerald-500 text-black px-3 py-1 rounded-full flex items-center gap-1 text-[10px] font-black uppercase tracking-widest shadow-lg">
            <Sparkles size={12} /> Studio IA
          </div>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="w-full lg:w-[450px] bg-[#0c0f0d] border-l border-white/5 p-8 flex flex-col gap-8 overflow-y-auto">
        <header className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest">
            <ChevronLeft size={18} /> Retour
          </button>
          <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
            <ShoppingBag size={20} className="text-emerald-300" />
          </div>
        </header>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-white mb-1">Studio Publicitaire</h2>
            <p className="text-sm text-white/40">Personnalisez votre affiche pour attirer plus de clients.</p>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                <Type size={12} /> Nom du produit
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none focus:border-emerald-300 transition-all"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                <ImageIcon size={12} /> Prix (FCFA)
              </span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-12 rounded-xl border border-white/10 bg-black/40 px-4 text-white outline-none focus:border-emerald-300 transition-all font-mono"
              />
            </label>
          </div>

          <div className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
              <Palette size={12} /> Style & Thème
            </span>
            <div className="flex gap-3">
              {(["luxe", "minimal", "promo"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                    template === t ? "bg-emerald-300 text-black border-emerald-300 shadow-lg shadow-emerald-500/20" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              {["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7"].map(c => (
                <button
                  key={c}
                  onClick={() => setThemeColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition-all ${themeColor === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-auto pt-8 border-t border-white/5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleDownload}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
            >
              <Download size={16} /> HD
            </button>
            <button
              onClick={() => handleShare("all")}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
            >
              <Share2 size={16} /> Réseaux
            </button>
          </div>

          <button
            onClick={() => handleShare("whatsapp")}
            className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-[#25D366]/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
            Partager sur WhatsApp
          </button>
        </footer>
      </div>
    </div>
  );
}

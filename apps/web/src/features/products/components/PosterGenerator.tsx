import React, { useRef, useState, useEffect } from "react";
import {
  Download,
  Share2,
  ChevronLeft,
  Check,
  Sparkles,
  Flame,
  QrCode,
  Tag,
  Palette,
  Smartphone,
  Square,
  FileText,
  Copy,
  MessageCircle,
  Zap,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { slugify } from "@/lib/slugify";

interface PosterGeneratorProps {
  productData: {
    _id?: string;
    name: string;
    price: number;
    category?: string;
    image?: string;
    imageUrl?: string;
    images?: string[];
    currency?: string;
  };
  boutiqueName: string;
  businessCategory: string;
  currency?: string;
  whatsappNumber?: string;
  merchantId?: string;
  onBack: () => void;
  onSave?: (finalImage: string) => void;
}

const STICKER_PRESETS = [
  { id: "flash", label: "🔥 PROMO FLASH", color: "#ef4444" },
  { id: "discount20", label: "⚡ -20% RÉDUCTION", color: "#f59e0b" },
  { id: "discount30", label: "💥 -30% AUJOURD'HUI", color: "#f97316" },
  { id: "discount50", label: "🚨 -50% DÉSTOCKAGE", color: "#dc2626" },
  { id: "new", label: "✨ NOUVEL ARRIVAGE", color: "#10b981" },
  { id: "bestseller", label: "⭐ TOP VENTE", color: "#8b5cf6" },
  { id: "free_delivery", label: "🛵 LIVRAISON OFFERTE", color: "#06b6d4" },
  { id: "none", label: "Aucun sticker", color: "#71717a" }
];

const THEME_PALETTES = [
  { id: "emerald", name: "Émeraude", primary: "#10b981", bgOverlay: "rgba(6, 78, 59, 0.4)", accent: "#34d399" },
  { id: "gold", name: "Or & Luxe", primary: "#f59e0b", bgOverlay: "rgba(120, 53, 15, 0.4)", accent: "#fbbf24" },
  { id: "ruby", name: "Rouge Flash", primary: "#ef4444", bgOverlay: "rgba(153, 27, 27, 0.4)", accent: "#f87171" },
  { id: "cyber", name: "Cyber Violet", primary: "#a855f7", bgOverlay: "rgba(88, 28, 135, 0.4)", accent: "#c084fc" },
  { id: "sky", name: "Bleu Tech", primary: "#0ea5e9", bgOverlay: "rgba(12, 74, 110, 0.4)", accent: "#38bdf8" }
];

const FORMAT_PRESETS = {
  story: { label: "Story (9:16)", width: 1080, height: 1920, icon: <Smartphone size={14} /> },
  post: { label: "Post Carré (1:1)", width: 1080, height: 1080, icon: <Square size={14} /> },
  flyer: { label: "Flyer (4:5)", width: 1080, height: 1350, icon: <FileText size={14} /> }
};

export function PosterGenerator({
  productData,
  boutiqueName,
  businessCategory,
  currency = productData.currency || "XOF",
  whatsappNumber = "",
  merchantId = "",
  onBack,
  onSave
}: PosterGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState(productData.name || "Article Spécial");
  const [price, setPrice] = useState(productData.price ? productData.price.toString() : "0");
  const [originalPrice, setOriginalPrice] = useState("");
  const [selectedSticker, setSelectedSticker] = useState<string>("flash");
  const [selectedTheme, setSelectedTheme] = useState<string>("emerald");
  const [format, setFormat] = useState<"story" | "post" | "flyer">("story");
  const [hookText, setHookText] = useState("Commandez sur WhatsApp & recevez chez vous !");
  const [includeQrCode, setIncludeQrCode] = useState(true);
  const [isRendering, setIsRendering] = useState(false);

  const activeTheme = THEME_PALETTES.find((t) => t.id === selectedTheme) || THEME_PALETTES[0];
  const activeFormat = FORMAT_PRESETS[format];
  const activeSticker = STICKER_PRESETS.find((s) => s.id === selectedSticker);

  const productImage =
    productData.image ||
    productData.imageUrl ||
    (productData.images && productData.images[0]) ||
    "";

  // Shop URL for QR Code (uses clean normalized slug)
  const shopUrl = boutiqueName
    ? `${window.location.origin}/shop/${slugify(boutiqueName)}`
    : merchantId
    ? `${window.location.origin}/shop/${merchantId}`
    : window.location.origin;

  const renderPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsRendering(true);

    canvas.width = activeFormat.width;
    canvas.height = activeFormat.height;

    // 1. Solid Dark Background
    ctx.fillStyle = "#090a0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const finishCanvas = () => {
      // 2. Gradient Overlay for readability
      const gradient = ctx.createLinearGradient(0, canvas.height * 0.25, 0, canvas.height);
      gradient.addColorStop(0, "rgba(9, 10, 15, 0)");
      gradient.addColorStop(0.5, "rgba(9, 10, 15, 0.8)");
      gradient.addColorStop(0.85, "#090a0f");
      gradient.addColorStop(1, "#090a0f");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Top Header Bar (Boutique Name Badge)
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.strokeStyle = activeTheme.primary;
      ctx.lineWidth = 4;
      ctx.beginPath();
      const badgeY = format === "story" ? 100 : 60;
      ctx.roundRect(70, badgeY, canvas.width - 140, 90, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 36px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`🛍️ ${boutiqueName.toUpperCase()}`, 110, badgeY + 58);

      ctx.fillStyle = activeTheme.accent;
      ctx.font = "900 24px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("BOUTIQUE OFFICIELLE", canvas.width - 110, badgeY + 56);
      ctx.restore();

      // 4. Promo Sticker Badge
      if (activeSticker && activeSticker.id !== "none") {
        ctx.save();
        const stickerY = format === "story" ? 230 : 180;
        ctx.fillStyle = activeSticker.color;
        ctx.shadowColor = activeSticker.color;
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.roundRect(70, stickerY, 460, 80, 20);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "900 34px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(activeSticker.label, 300, stickerY + 54);
        ctx.restore();
      }

      // 5. Product Title
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.font = format === "story" ? "900 76px sans-serif" : "900 64px sans-serif";
      ctx.textAlign = "left";
      const titleY = format === "story" ? canvas.height - 580 : canvas.height - 400;

      // Wrap text if needed
      const maxTitleWidth = canvas.width - 140;
      const words = name.split(" ");
      let line = "";
      let currentY = titleY;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTitleWidth && n > 0) {
          ctx.fillText(line.trim(), 70, currentY);
          line = words[n] + " ";
          currentY += 80;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), 70, currentY);
      ctx.restore();

      // 6. Price & Crossed Original Price
      const priceY = currentY + 110;
      const numPrice = parseInt(price, 10) || 0;
      const formattedPrice = `${numPrice.toLocaleString()} ${currency}`;

      ctx.save();
      ctx.fillStyle = activeTheme.primary;
      ctx.font = "900 88px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(formattedPrice, 70, priceY);

      // Crossed original price
      if (originalPrice && parseInt(originalPrice, 10) > numPrice) {
        const origNum = parseInt(originalPrice, 10);
        const origText = `${origNum.toLocaleString()} ${currency}`;
        const priceWidth = ctx.measureText(formattedPrice).width;

        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "700 48px sans-serif";
        const origX = 70 + priceWidth + 40;
        ctx.fillText(origText, origX, priceY - 10);

        // Strike-through line
        const origWidth = ctx.measureText(origText).width;
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(origX - 10, priceY - 26);
        ctx.lineTo(origX + origWidth + 10, priceY - 26);
        ctx.stroke();
      }
      ctx.restore();

      // 7. Slogan / Hook
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "700 32px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`✨ ${hookText}`, 70, priceY + 70);
      ctx.restore();

      // 8. Footer CTA & QR Code
      const footerY = canvas.height - (format === "story" ? 180 : 120);

      // CTA Box
      ctx.save();
      ctx.fillStyle = "#25D366"; // WhatsApp Green
      ctx.shadowColor = "#25D366";
      ctx.shadowBlur = 25;
      ctx.beginPath();
      const ctaWidth = includeQrCode ? canvas.width - 340 : canvas.width - 140;
      ctx.roundRect(70, footerY - 40, ctaWidth, 110, 28);
      ctx.fill();

      ctx.fillStyle = "#000000";
      ctx.font = "900 34px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        whatsappNumber ? `📲 COMMANDER : ${whatsappNumber}` : "📲 COMMANDER SUR WHATSAPP",
        70 + ctaWidth / 2,
        footerY + 28
      );
      ctx.restore();

      // Draw QR Code in bottom right if requested
      if (includeQrCode) {
        const qrImg = new Image();
        qrImg.crossOrigin = "anonymous";
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shopUrl)}&bgcolor=090a0f&color=10b981&margin=4`;

        qrImg.onload = () => {
          ctx.drawImage(qrImg, canvas.width - 230, footerY - 50, 160, 160);
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          ctx.font = "900 16px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("SCANNEZ ICI", canvas.width - 150, footerY + 130);
          setIsRendering(false);
        };
        qrImg.onerror = () => {
          setIsRendering(false);
        };
      } else {
        setIsRendering(false);
      }
    };

    // Draw background product image
    if (productImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = productImage;
      img.onload = () => {
        const scale = Math.max(canvas.width / img.width, (canvas.height * 0.72) / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = 0;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        finishCanvas();
      };
      img.onerror = () => {
        finishCanvas();
      };
    } else {
      finishCanvas();
    }
  };

  useEffect(() => {
    renderPoster();
  }, [
    name,
    price,
    originalPrice,
    selectedSticker,
    selectedTheme,
    format,
    hookText,
    includeQrCode,
    productImage,
    currency
  ]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement("a");
      link.download = `affiche-${name.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
      toast.success("Affiche HD téléchargée !");
    }
  };

  const handleFinalSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      if (onSave) {
        onSave(dataUrl);
      }
      toast.success("Affiche enregistrée dans votre galerie produit !");
    }
  };

  const handleShareWhatsApp = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 1.0)
      );
      if (!blob) return;

      const file = new File([blob], `promo-${name}.png`, { type: "image/png" });
      const captionText = `🔥 *OFFRE SPÉCIALE CHEZ ${boutiqueName.toUpperCase()}* 🔥\n\n*${name}*\n💰 Prix : *${parseInt(price, 10).toLocaleString()} ${currency}* ${originalPrice ? `~(au lieu de ${parseInt(originalPrice, 10).toLocaleString()} ${currency})~` : ""}\n\n👉 Commandez directement sur WhatsApp ou sur notre boutique en ligne :\n${shopUrl}`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Promo ${name}`,
          text: captionText
        });
      } else {
        navigator.clipboard.writeText(captionText);
        handleDownload();
        toast.info("Texte copié ! L'affiche a été téléchargée pour votre statut.");
      }
    } catch (err: any) {
      console.warn("Share failed:", err);
      handleDownload();
    }
  };

  const generateQuickAiHook = () => {
    const hooks = [
      "Offre exclusive valable uniquement ce week-end !",
      "Qualité premium garantie, stock très limité !",
      "Commandez maintenant & payez à la livraison !",
      "Le coup de cœur de nos clients cette semaine !",
      "Arrivage direct d'usine au meilleur prix d'Abidjan !"
    ];
    const random = hooks[Math.floor(Math.random() * hooks.length)];
    setHookText(random);
    toast.success("Nouvelle accroche IA générée !");
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col animate-in fade-in duration-200 overflow-hidden text-white">
      {/* Top Navbar */}
      <div className="p-4 bg-vendeur-coal/80 backdrop-blur-xl border-b border-white/10 flex justify-between items-center z-50">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
        >
          <ChevronLeft size={18} />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-vendeur-emerald animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-vendeur-emerald flex items-center gap-1.5">
            <Sparkles size={14} /> Instant Studio V2
          </span>
        </div>

        <button
          onClick={handleFinalSave}
          className="bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal font-black px-4 py-2 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-vendeur-emerald/20 active:scale-95 transition-all"
        >
          <Check size={16} />
          <span>Enregistrer</span>
        </button>
      </div>

      {/* Main Workspace: Canvas Preview + Control Panel */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 md:p-8 gap-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Canvas Visualizer */}
        <div className="relative w-full max-w-sm lg:max-w-md h-[460px] md:h-[620px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black flex items-center justify-center shrink-0">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
          {isRendering && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="animate-spin text-vendeur-emerald" size={32} />
            </div>
          )}
        </div>

        {/* Studio Control Deck */}
        <div className="w-full max-w-xl space-y-5 bg-vendeur-coal/60 border border-white/10 p-6 md:p-8 rounded-3xl backdrop-blur-xl overflow-y-auto max-h-[80vh]">
          
          {/* Format Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">
              Format de l&apos;Affiche
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(FORMAT_PRESETS) as Array<keyof typeof FORMAT_PRESETS>).map((fmtKey) => (
                <button
                  key={fmtKey}
                  onClick={() => setFormat(fmtKey)}
                  className={`h-11 rounded-xl border font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    format === fmtKey
                      ? "bg-white text-vendeur-coal border-white shadow-lg"
                      : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                  }`}
                >
                  {FORMAT_PRESETS[fmtKey].icon}
                  <span>{FORMAT_PRESETS[fmtKey].label.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Palette Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">
              Ambiance &amp; Couleurs
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {THEME_PALETTES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all ${
                    selectedTheme === theme.id
                      ? "border-white bg-white/10 text-white shadow-md"
                      : "border-white/5 bg-white/5 text-white/40 hover:text-white"
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Promo Sticker Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">
              Sticker Promotionnel
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {STICKER_PRESETS.map((stk) => (
                <button
                  key={stk.id}
                  onClick={() => setSelectedSticker(stk.id)}
                  className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${
                    selectedSticker === stk.id
                      ? "border-white bg-white/10 text-white shadow-md"
                      : "border-white/5 bg-white/5 text-white/40 hover:text-white"
                  }`}
                >
                  {stk.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Title & Prices */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <div>
              <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">
                Titre du Produit
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none focus:border-vendeur-emerald transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-vendeur-emerald uppercase tracking-widest mb-1">
                  Prix Promo ({currency})
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-black text-vendeur-emerald outline-none focus:border-vendeur-emerald transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
                  Ancien Prix Barré (optionnel)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 35000"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white/60 outline-none focus:border-white/30 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                  Accroche Commerciale
                </label>
                <button
                  type="button"
                  onClick={generateQuickAiHook}
                  className="text-[9px] font-black text-sky-400 uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  <Zap size={10} /> Idée IA
                </button>
              </div>
              <input
                type="text"
                value={hookText}
                onChange={(e) => setHookText(e.target.value)}
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white/80 outline-none focus:border-vendeur-emerald transition-all"
              />
            </div>

            {/* QR Code Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-vendeur-emerald" />
                <span className="text-xs font-bold text-white">Inclure le QR Code Boutique</span>
              </div>
              <input
                type="checkbox"
                checked={includeQrCode}
                onChange={(e) => setIncludeQrCode(e.target.checked)}
                className="h-4 w-4 rounded accent-vendeur-emerald cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons: 1-Tap Share & Download */}
          <div className="pt-4 grid grid-cols-2 gap-3">
            <button
              onClick={handleShareWhatsApp}
              className="h-13 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20"
            >
              <Share2 size={16} />
              <span>Statut WhatsApp</span>
            </button>

            <button
              onClick={handleDownload}
              className="h-13 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all"
            >
              <Download size={16} />
              <span>Télécharger HD</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useRef, useState, useEffect } from "react";
import {
  Download,
  Share2,
  ChevronLeft,
  Check,
  Sparkles,
  QrCode,
  Smartphone,
  Square,
  FileText,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { slugify } from "@/lib/slugify";
import { formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";

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
  const [stickerPosition, setStickerPosition] = useState<"above_title" | "top_right">("above_title");
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

    const isStory = format === "story";
    const hasSticker = activeSticker && activeSticker.id !== "none";
    const hasHook = Boolean(hookText && hookText.trim());

    // Dynamic Bottom-Up Layout Calculations to prevent any overlap
    const bottomMargin = isStory ? 70 : 45;
    const ctaHeight = isStory ? 106 : 90;
    const ctaY = canvas.height - bottomMargin - ctaHeight;
    const qrSize = isStory ? 144 : 120;
    const ctaWidth = includeQrCode ? canvas.width - 140 - qrSize - 24 : canvas.width - 140;

    const hookGap = hasHook ? 24 : 0;
    const hookY = ctaY - hookGap - (hasHook ? 10 : 0);

    const priceGap = 28;
    const priceBaseY = (hasHook ? hookY - 38 : ctaY) - priceGap;
    const priceY = priceBaseY;

    // Product Title Wrap & Font Scaling
    const maxTitleWidth = canvas.width - 140;
    let titleFontSize = isStory ? 60 : 48;
    let titleLineHeight = titleFontSize + 14;
    if (name.length > 55) {
      titleFontSize = isStory ? 44 : 36;
      titleLineHeight = titleFontSize + 10;
    } else if (name.length > 30) {
      titleFontSize = isStory ? 52 : 42;
      titleLineHeight = titleFontSize + 12;
    }
    ctx.font = `900 ${titleFontSize}px sans-serif`;

    const words = name.split(" ");
    const lines: string[] = [];
    let curLine = "";
    for (const w of words) {
      const testLine = curLine ? `${curLine} ${w}` : w;
      if (ctx.measureText(testLine).width > maxTitleWidth && curLine) {
        lines.push(curLine);
        curLine = w;
      } else {
        curLine = testLine;
      }
    }
    if (curLine) lines.push(curLine);

    // Limit to 3 lines maximum
    const displayLines = lines.slice(0, 3);
    if (lines.length > 3) {
      displayLines[2] = displayLines[2].replace(/\s+$/, "") + "...";
    }

    const titleGap = 24;
    const titleBaseY = priceY - (isStory ? 74 : 58) - titleGap;
    const titleStartY = titleBaseY - (displayLines.length - 1) * titleLineHeight;

    // Sticker Badge Height & Y Position
    const stickerHeight = isStory ? 58 : 50;
    const stickerGap = 20;
    const stickerAboveTitleY = titleStartY - stickerHeight - stickerGap;

    // Gradient starts cleanly above the text block (or above the badge)
    const gradientStartY =
      hasSticker && stickerPosition === "above_title"
        ? stickerAboveTitleY - 140
        : titleStartY - 140;

    const finishCanvas = () => {
      // 2. Gradient Overlay for Perfect Legibility
      const gradient = ctx.createLinearGradient(0, Math.max(0, gradientStartY), 0, canvas.height);
      gradient.addColorStop(0, "rgba(9, 10, 15, 0)");
      gradient.addColorStop(0.25, "rgba(9, 10, 15, 0.78)");
      gradient.addColorStop(0.55, "rgba(9, 10, 15, 0.95)");
      gradient.addColorStop(1, "#090a0f");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Top Header: Boutique Name Glass Pill Badge
      const headerY = isStory ? 75 : 45;
      const headerHeight = isStory ? 64 : 54;
      ctx.save();
      ctx.fillStyle = "rgba(9, 10, 15, 0.72)";
      ctx.strokeStyle = activeTheme.primary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const boutiqueLabel = `🛍️ ${boutiqueName.toUpperCase()}`;
      ctx.font = `900 ${isStory ? 28 : 24}px sans-serif`;
      const boutiqueWidth = ctx.measureText(boutiqueLabel).width;
      const pillWidth = Math.min(
        boutiqueWidth + 50,
        canvas.width - (hasSticker && stickerPosition === "top_right" ? 420 : 140)
      );
      ctx.roundRect(70, headerY, pillWidth, headerHeight, 32);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText(boutiqueLabel, 95, headerY + (isStory ? 42 : 36));
      ctx.restore();

      // 4. Promo Sticker Badge
      if (hasSticker && activeSticker) {
        ctx.save();
        ctx.fillStyle = activeSticker.color;
        ctx.shadowColor = activeSticker.color;
        ctx.shadowBlur = 24;

        if (stickerPosition === "top_right") {
          // Top-right pill aligned horizontally with the boutique header
          ctx.font = `900 ${isStory ? 26 : 22}px sans-serif`;
          const stkTextWidth = ctx.measureText(activeSticker.label).width;
          const stkW = stkTextWidth + 46;
          const stkH = headerHeight;
          const stkX = canvas.width - 70 - stkW;

          ctx.beginPath();
          ctx.roundRect(stkX, headerY, stkW, stkH, 24);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.fillText(activeSticker.label, stkX + stkW / 2, headerY + (isStory ? 42 : 36));
        } else {
          // Above title inside the contrast-safe dark zone
          ctx.font = `900 ${isStory ? 28 : 24}px sans-serif`;
          const stkTextWidth = ctx.measureText(activeSticker.label).width;
          const stkW = stkTextWidth + 48;
          const stkH = stickerHeight;

          ctx.beginPath();
          ctx.roundRect(70, stickerAboveTitleY, stkW, stkH, 20);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.fillText(activeSticker.label, 70 + stkW / 2, stickerAboveTitleY + (isStory ? 39 : 34));
        }
        ctx.restore();
      }

      // 5. Product Title (Wrapped Lines)
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${titleFontSize}px sans-serif`;
      ctx.textAlign = "left";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 16;

      for (let i = 0; i < displayLines.length; i++) {
        ctx.fillText(displayLines[i], 70, titleStartY + i * titleLineHeight);
      }
      ctx.restore();

      // 6. Price & Crossed Original Price
      const numPrice = parseInt(price, 10) || 0;
      const formattedPrice = `${numPrice.toLocaleString()} ${currency}`;

      ctx.save();
      ctx.fillStyle = activeTheme.primary;
      ctx.font = `900 ${isStory ? 80 : 66}px sans-serif`;
      ctx.textAlign = "left";
      ctx.shadowColor = activeTheme.primary;
      ctx.shadowBlur = 12;
      ctx.fillText(formattedPrice, 70, priceY);

      // Crossed original price
      if (originalPrice && parseInt(originalPrice, 10) > numPrice) {
        const origNum = parseInt(originalPrice, 10);
        const origText = `${origNum.toLocaleString()} ${currency}`;
        const priceWidth = ctx.measureText(formattedPrice).width;

        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.font = `700 ${isStory ? 44 : 36}px sans-serif`;
        ctx.shadowBlur = 0;
        const origX = 70 + priceWidth + 32;
        ctx.fillText(origText, origX, priceY - 6);

        // Strike-through line
        const origWidth = ctx.measureText(origText).width;
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(origX - 8, priceY - 20);
        ctx.lineTo(origX + origWidth + 8, priceY - 20);
        ctx.stroke();
      }
      ctx.restore();

      // 7. Slogan / Hook
      if (hasHook) {
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = `700 ${isStory ? 30 : 25}px sans-serif`;
        ctx.textAlign = "left";
        ctx.fillText(`✨ ${hookText}`, 70, hookY);
        ctx.restore();
      }

      // 8. Footer CTA Button
      ctx.save();
      ctx.fillStyle = "#25D366"; // WhatsApp Green
      ctx.shadowColor = "#25D366";
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.roundRect(70, ctaY, ctaWidth, ctaHeight, 26);
      ctx.fill();

      ctx.fillStyle = "#000000";
      ctx.font = `900 ${isStory ? 32 : 26}px sans-serif`;
      ctx.textAlign = "center";
      const ctaText = whatsappNumber
        ? `📲 COMMANDER : ${formatDisplayPhone(whatsappNumber)}`
        : "📲 COMMANDER SUR WHATSAPP";
      ctx.fillText(ctaText, 70 + ctaWidth / 2, ctaY + (isStory ? 64 : 54));
      ctx.restore();

      // 9. QR Code in bottom right
      if (includeQrCode) {
        const qrImg = new Image();
        qrImg.crossOrigin = "anonymous";
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
          shopUrl
        )}&bgcolor=090a0f&color=10b981&margin=4`;

        qrImg.onload = () => {
          const qrX = canvas.width - 70 - qrSize;
          ctx.drawImage(qrImg, qrX, ctaY, qrSize, qrSize);
          ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
          ctx.font = "900 14px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("SCANNEZ ICI", qrX + qrSize / 2, ctaY + qrSize + 22);
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
        const targetHeight = isStory
          ? canvas.height * 0.75
          : format === "flyer"
          ? canvas.height * 0.70
          : canvas.height * 0.65;
        const scale = Math.max(canvas.width / img.width, targetHeight / img.height);
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
    stickerPosition,
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
      const captionText = `🔥 *OFFRE SPÉCIALE CHEZ ${boutiqueName.toUpperCase()}* 🔥\n\n*${name}*\n💰 Prix : *${parseInt(
        price,
        10
      ).toLocaleString()} ${currency}* ${
        originalPrice ? `~(au lieu de ${parseInt(originalPrice, 10).toLocaleString()} ${currency})~` : ""
      }\n\n👉 Commandez directement sur WhatsApp ou sur notre boutique en ligne :\n${shopUrl}`;

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
    <div className="fixed inset-0 z-[110] bg-slate-100 dark:bg-slate-950 flex flex-col animate-in fade-in duration-200 overflow-hidden text-slate-900 dark:text-white">
      {/* Top Navbar */}
      <div className="p-3.5 sm:p-4 bg-white/95 dark:bg-[#12141a]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 flex justify-between items-center z-50 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-vendeur-emerald animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-vendeur-emerald flex items-center gap-1.5">
            <Sparkles size={14} /> Instant Studio V2
          </span>
        </div>

        <button
          onClick={handleFinalSave}
          className="bg-vendeur-emerald hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-vendeur-emerald/20 active:scale-95 transition-all cursor-pointer"
        >
          <Check size={16} />
          <span>Enregistrer</span>
        </button>
      </div>

      {/* Main Workspace: Canvas Preview + Control Panel */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 md:p-8 gap-6 md:gap-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Canvas Visualizer */}
        <div className="relative w-full max-w-sm lg:max-w-md h-[460px] sm:h-[540px] md:h-[620px] rounded-3xl overflow-hidden border-2 border-slate-300 dark:border-white/15 shadow-2xl bg-[#090a0f] flex items-center justify-center shrink-0 p-1">
          <canvas ref={canvasRef} className="w-full h-full object-contain rounded-2xl" />
          {isRendering && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <Sparkles className="animate-spin text-vendeur-emerald" size={32} />
            </div>
          )}
        </div>

        {/* Studio Control Deck */}
        <div className="w-full max-w-xl space-y-5 bg-white dark:bg-[#12141a] border border-slate-200 dark:border-white/10 p-5 sm:p-7 md:p-8 rounded-3xl shadow-xl dark:shadow-2xl overflow-y-auto max-h-[85vh]">
          {/* Format Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 dark:text-white/50 uppercase tracking-widest">
              Format de l&apos;Affiche
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(FORMAT_PRESETS) as Array<keyof typeof FORMAT_PRESETS>).map((fmtKey) => (
                <button
                  key={fmtKey}
                  type="button"
                  onClick={() => setFormat(fmtKey)}
                  className={`h-11 rounded-xl border font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    format === fmtKey
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md font-black"
                      : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10"
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
            <label className="text-[10px] font-black text-slate-500 dark:text-white/50 uppercase tracking-widest">
              Ambiance &amp; Couleurs
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {THEME_PALETTES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                    selectedTheme === theme.id
                      ? "border-slate-900 dark:border-white bg-slate-900/10 dark:bg-white/15 text-slate-900 dark:text-white shadow-sm font-black"
                      : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10"
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Promo Sticker Selector & Position Toggle */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-500 dark:text-white/50 uppercase tracking-widest">
                Sticker Promotionnel
              </label>
              {activeSticker && activeSticker.id !== "none" && (
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 p-0.5 bg-slate-100 dark:bg-white/5 text-[9px] font-bold">
                  <button
                    type="button"
                    onClick={() => setStickerPosition("above_title")}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      stickerPosition === "above_title"
                        ? "bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-xs font-black"
                        : "text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Au-dessus du titre
                  </button>
                  <button
                    type="button"
                    onClick={() => setStickerPosition("top_right")}
                    className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                      stickerPosition === "top_right"
                        ? "bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-xs font-black"
                        : "text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    En haut à droite
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {STICKER_PRESETS.map((stk) => (
                <button
                  key={stk.id}
                  type="button"
                  onClick={() => setSelectedSticker(stk.id)}
                  className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                    selectedSticker === stk.id
                      ? "border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md font-black"
                      : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10"
                  }`}
                >
                  {stk.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Title & Prices */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-white/50 uppercase tracking-widest mb-1">
                Titre du Produit
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-vendeur-emerald focus:bg-white dark:focus:bg-white/10 transition-all shadow-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-emerald-600 dark:text-vendeur-emerald uppercase tracking-widest mb-1">
                  Prix Promo ({currency})
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full h-11 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs font-black text-emerald-600 dark:text-vendeur-emerald outline-none focus:border-vendeur-emerald focus:bg-white dark:focus:bg-white/10 transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest mb-1">
                  Ancien Prix Barré (optionnel)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 35000"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full h-11 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs text-slate-600 dark:text-white/60 outline-none focus:border-slate-400 dark:focus:border-white/30 focus:bg-white dark:focus:bg-white/10 transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-white/50 uppercase tracking-widest">
                  Accroche Commerciale
                </label>
                <button
                  type="button"
                  onClick={generateQuickAiHook}
                  className="text-[9px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Zap size={10} /> Idée IA
                </button>
              </div>
              <input
                type="text"
                value={hookText}
                onChange={(e) => setHookText(e.target.value)}
                className="w-full h-11 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs text-slate-700 dark:text-white/80 outline-none focus:border-vendeur-emerald focus:bg-white dark:focus:bg-white/10 transition-all shadow-xs"
              />
            </div>

            {/* QR Code Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs">
              <div className="flex items-center gap-2.5">
                <QrCode size={18} className="text-emerald-600 dark:text-vendeur-emerald" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Inclure le QR Code Boutique</span>
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
          <div className="pt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="h-12 sm:h-14 rounded-2xl bg-vendeur-emerald hover:bg-emerald-400 text-slate-950 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20 cursor-pointer"
            >
              <Share2 size={16} />
              <span>Statut WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="h-12 sm:h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
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

import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Zap,
  Palette,
  Maximize2,
  Minimize2,
  Tag,
  Eye,
  SlidersHorizontal
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

type PosterFormatKey = "story" | "post" | "flyer" | "auto";

export function PosterGenerator({
  productData,
  boutiqueName,
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
  const [format, setFormat] = useState<PosterFormatKey>("story");
  const [imageFit, setImageFit] = useState<"contain" | "cover">("contain");
  const [hookText, setHookText] = useState("Commandez sur WhatsApp & recevez chez vous !");
  const [includeQrCode, setIncludeQrCode] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [activeTab, setActiveTab] = useState<"style" | "content">("style");
  const [mobileView, setMobileView] = useState<"preview" | "settings">("preview");
  const [imgNaturalRatio, setImgNaturalRatio] = useState<number | null>(null);

  const activeTheme = THEME_PALETTES.find((t) => t.id === selectedTheme) || THEME_PALETTES[0];
  const activeSticker = STICKER_PRESETS.find((s) => s.id === selectedSticker);

  const productImage =
    productData.image ||
    productData.imageUrl ||
    (productData.images && productData.images[0]) ||
    "";


  // Inspect image dimensions and adapt default format to the base photo
  useEffect(() => {
    if (!productImage) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      setImgNaturalRatio(ratio);
      // Auto-adapt format to the base image aspect ratio
      if (ratio >= 0.88 && ratio <= 1.15) {
        setFormat("post"); // Square image -> 1:1
      } else if (ratio < 0.65) {
        setFormat("story"); // Vertical image -> 9:16
      } else if (ratio >= 0.65 && ratio < 0.88) {
        setFormat("flyer"); // Portrait 4:5 image -> 4:5
      }
    };
    img.src = productImage;
  }, [productImage]);

  // Shop URL for QR Code (uses clean normalized slug)
  const shopUrl = boutiqueName
    ? `${window.location.origin}/shop/${slugify(boutiqueName)}`
    : merchantId
    ? `${window.location.origin}/shop/${merchantId}`
    : window.location.origin;

  // Compute canvas dimensions according to chosen format
  const getCanvasDimensions = (): { width: number; height: number; key: PosterFormatKey } => {
    if (format === "post") {
      return { width: 1080, height: 1080, key: "post" };
    }
    if (format === "flyer") {
      return { width: 1080, height: 1350, key: "flyer" };
    }
    if (format === "auto" && imgNaturalRatio) {
      const computedHeight = Math.round(1080 / imgNaturalRatio);
      // Clamp between square and story limits for aesthetic consistency
      const clampedHeight = Math.min(Math.max(computedHeight, 1080), 1920);
      return { width: 1080, height: clampedHeight, key: "auto" };
    }
    // Default: 9:16 Story
    return { width: 1080, height: 1920, key: "story" };
  };

  const renderPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsRendering(true);

    const dims = getCanvasDimensions();
    canvas.width = dims.width;
    canvas.height = dims.height;

    // 1. Solid Dark Background
    ctx.fillStyle = "#090a0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const isStory = canvas.height >= 1700;
    const isSquare = canvas.height <= 1150;
    const hasSticker = activeSticker && activeSticker.id !== "none";
    const hasHook = Boolean(hookText && hookText.trim());

    // Proportional layout tuning per format
    const bottomMargin = isSquare ? 36 : isStory ? 70 : 48;
    const ctaHeight = isSquare ? 76 : isStory ? 104 : 88;
    const ctaY = canvas.height - bottomMargin - ctaHeight;
    const qrSize = isSquare ? 96 : isStory ? 138 : 116;
    const horizontalMargin = isSquare ? 50 : 70;
    const ctaWidth = includeQrCode
      ? canvas.width - horizontalMargin * 2 - qrSize - 20
      : canvas.width - horizontalMargin * 2;

    const hookGap = hasHook ? (isSquare ? 16 : 24) : 0;
    const hookY = ctaY - hookGap - (hasHook ? (isSquare ? 6 : 10) : 0);

    const priceGap = isSquare ? 18 : 28;
    const priceBaseY = (hasHook ? hookY - (isSquare ? 24 : 36) : ctaY) - priceGap;
    const priceY = priceBaseY;

    // Product Title Wrap & Font Scaling
    const maxTitleWidth = canvas.width - horizontalMargin * 2;
    let titleFontSize = isSquare ? 38 : isStory ? 58 : 46;
    let titleLineHeight = titleFontSize + (isSquare ? 10 : 14);
    if (name.length > 55) {
      titleFontSize = isSquare ? 30 : isStory ? 42 : 36;
      titleLineHeight = titleFontSize + 8;
    } else if (name.length > 30) {
      titleFontSize = isSquare ? 34 : isStory ? 50 : 42;
      titleLineHeight = titleFontSize + 10;
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

    // Limit to 2 lines in square format, 3 lines in story/flyer
    const maxAllowedLines = isSquare ? 2 : 3;
    const displayLines = lines.slice(0, maxAllowedLines);
    if (lines.length > maxAllowedLines) {
      displayLines[maxAllowedLines - 1] =
        displayLines[maxAllowedLines - 1].replace(/\s+$/, "") + "...";
    }

    const titleGap = isSquare ? 16 : 24;
    const titleBaseY = priceY - (isSquare ? 48 : isStory ? 74 : 60) - titleGap;
    const titleStartY = titleBaseY - (displayLines.length - 1) * titleLineHeight;

    // Sticker Badge Height & Y Position
    const stickerHeight = isSquare ? 44 : isStory ? 58 : 50;
    const stickerGap = isSquare ? 14 : 20;
    const stickerAboveTitleY = titleStartY - stickerHeight - stickerGap;

    // Gradient starts cleanly above the text block (or above the badge)
    const gradientStartY =
      hasSticker && stickerPosition === "above_title"
        ? stickerAboveTitleY - (isSquare ? 70 : 130)
        : titleStartY - (isSquare ? 70 : 130);

    // Top Header Dimensions
    const headerY = isSquare ? 40 : isStory ? 75 : 52;
    const headerHeight = isSquare ? 48 : isStory ? 64 : 54;

    const finishCanvas = () => {
      // 2. Gradient Overlay for Perfect Legibility
      const gradient = ctx.createLinearGradient(0, Math.max(0, gradientStartY), 0, canvas.height);
      gradient.addColorStop(0, "rgba(9, 10, 15, 0)");
      gradient.addColorStop(0.25, "rgba(9, 10, 15, 0.82)");
      gradient.addColorStop(0.55, "rgba(9, 10, 15, 0.96)");
      gradient.addColorStop(1, "#090a0f");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 3. Top Header: Boutique Name Glass Pill Badge
      ctx.save();
      ctx.fillStyle = "rgba(9, 10, 15, 0.78)";
      ctx.strokeStyle = activeTheme.primary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const boutiqueLabel = `🛍️ ${boutiqueName.toUpperCase()}`;
      ctx.font = `900 ${isSquare ? 20 : isStory ? 28 : 24}px sans-serif`;
      const boutiqueWidth = ctx.measureText(boutiqueLabel).width;
      const pillWidth = Math.min(
        boutiqueWidth + 44,
        canvas.width - (hasSticker && stickerPosition === "top_right" ? 400 : horizontalMargin * 2)
      );
      ctx.roundRect(horizontalMargin, headerY, pillWidth, headerHeight, 32);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText(
        boutiqueLabel,
        horizontalMargin + 22,
        headerY + (isSquare ? 31 : isStory ? 42 : 36)
      );
      ctx.restore();

      // 4. Promo Sticker Badge
      if (hasSticker && activeSticker) {
        ctx.save();
        ctx.fillStyle = activeSticker.color;
        ctx.shadowColor = activeSticker.color;
        ctx.shadowBlur = 22;

        if (stickerPosition === "top_right") {
          // Top-right pill aligned horizontally with the boutique header
          ctx.font = `900 ${isSquare ? 19 : isStory ? 26 : 22}px sans-serif`;
          const stkTextWidth = ctx.measureText(activeSticker.label).width;
          const stkW = stkTextWidth + 40;
          const stkH = headerHeight;
          const stkX = canvas.width - horizontalMargin - stkW;

          ctx.beginPath();
          ctx.roundRect(stkX, headerY, stkW, stkH, 24);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.fillText(
            activeSticker.label,
            stkX + stkW / 2,
            headerY + (isSquare ? 31 : isStory ? 42 : 36)
          );
        } else {
          // Above title inside the contrast-safe dark zone
          ctx.font = `900 ${isSquare ? 20 : isStory ? 28 : 24}px sans-serif`;
          const stkTextWidth = ctx.measureText(activeSticker.label).width;
          const stkW = stkTextWidth + 44;
          const stkH = stickerHeight;

          ctx.beginPath();
          ctx.roundRect(horizontalMargin, stickerAboveTitleY, stkW, stkH, 20);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.fillText(
            activeSticker.label,
            horizontalMargin + stkW / 2,
            stickerAboveTitleY + (isSquare ? 29 : isStory ? 39 : 34)
          );
        }
        ctx.restore();
      }

      // 5. Product Title (Wrapped Lines)
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 ${titleFontSize}px sans-serif`;
      ctx.textAlign = "left";
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 18;

      for (let i = 0; i < displayLines.length; i++) {
        ctx.fillText(displayLines[i], horizontalMargin, titleStartY + i * titleLineHeight);
      }
      ctx.restore();

      // 6. Price & Crossed Original Price
      const numPrice = parseInt(price, 10) || 0;
      const formattedPrice = `${numPrice.toLocaleString()} ${currency}`;

      ctx.save();
      ctx.fillStyle = activeTheme.primary;
      ctx.font = `900 ${isSquare ? 54 : isStory ? 80 : 66}px sans-serif`;
      ctx.textAlign = "left";
      ctx.shadowColor = activeTheme.primary;
      ctx.shadowBlur = 12;
      ctx.fillText(formattedPrice, horizontalMargin, priceY);

      // Crossed original price
      if (originalPrice && parseInt(originalPrice, 10) > numPrice) {
        const origNum = parseInt(originalPrice, 10);
        const origText = `${origNum.toLocaleString()} ${currency}`;
        const priceWidth = ctx.measureText(formattedPrice).width;

        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.font = `700 ${isSquare ? 30 : isStory ? 44 : 36}px sans-serif`;
        ctx.shadowBlur = 0;
        const origX = horizontalMargin + priceWidth + (isSquare ? 20 : 28);
        ctx.fillText(origText, origX, priceY - 4);

        // Strike-through line
        const origWidth = ctx.measureText(origText).width;
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = isSquare ? 3.5 : 5;
        ctx.beginPath();
        ctx.moveTo(origX - 6, priceY - (isSquare ? 12 : 18));
        ctx.lineTo(origX + origWidth + 6, priceY - (isSquare ? 12 : 18));
        ctx.stroke();
      }
      ctx.restore();

      // 7. Slogan / Hook
      if (hasHook) {
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
        ctx.font = `700 ${isSquare ? 20 : isStory ? 30 : 25}px sans-serif`;
        ctx.textAlign = "left";
        ctx.fillText(`✨ ${hookText}`, horizontalMargin, hookY);
        ctx.restore();
      }

      // 8. Footer CTA Button
      ctx.save();
      ctx.fillStyle = "#25D366"; // WhatsApp Green
      ctx.shadowColor = "#25D366";
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.roundRect(horizontalMargin, ctaY, ctaWidth, ctaHeight, 24);
      ctx.fill();

      ctx.fillStyle = "#000000";
      ctx.font = `900 ${isSquare ? 22 : isStory ? 32 : 26}px sans-serif`;
      ctx.textAlign = "center";
      const ctaText = whatsappNumber
        ? `📲 COMMANDER : ${formatDisplayPhone(whatsappNumber)}`
        : "📲 COMMANDER SUR WHATSAPP";
      ctx.fillText(
        ctaText,
        horizontalMargin + ctaWidth / 2,
        ctaY + (isSquare ? 47 : isStory ? 64 : 54)
      );
      ctx.restore();

      // 9. QR Code in bottom right
      if (includeQrCode) {
        const qrImg = new Image();
        qrImg.crossOrigin = "anonymous";
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
          shopUrl
        )}&bgcolor=090a0f&color=10b981&margin=4`;

        qrImg.onload = () => {
          const qrX = canvas.width - horizontalMargin - qrSize;
          ctx.drawImage(qrImg, qrX, ctaY, qrSize, qrSize);
          ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
          ctx.font = "900 13px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("SCANNEZ ICI", qrX + qrSize / 2, ctaY + qrSize + 18);
          setIsRendering(false);
        };
        qrImg.onerror = () => {
          setIsRendering(false);
        };
      } else {
        setIsRendering(false);
      }
    };

    // Draw background product image with smart fit & ambient backdrop
    if (productImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = productImage;
      img.onload = () => {
        const visualZoneHeight = gradientStartY > 0 ? gradientStartY + (isSquare ? 40 : 100) : canvas.height * 0.65;

        if (imageFit === "contain") {
          // 1. Ambient Blurred Backdrop so there are no empty gaps
          ctx.save();
          try {
            ctx.filter = "blur(32px) brightness(0.45)";
          } catch {
            // Fallback if filter not supported
          }
          const bgScale = Math.max(canvas.width / img.width, visualZoneHeight / img.height);
          const bgW = img.width * bgScale;
          const bgH = img.height * bgScale;
          const bgX = (canvas.width - bgW) / 2;
          const bgY = (visualZoneHeight - bgH) / 2;
          ctx.drawImage(img, bgX, bgY, bgW, bgH);
          ctx.restore();

          // 2. Foreground Clean Uncropped Product Image
          const availableTop = headerY + headerHeight + 16;
          const availableBottom = gradientStartY + 40;
          const availableHeight = Math.max(200, availableBottom - availableTop);
          const availableWidth = canvas.width - horizontalMargin * 2;

          const fitScale = Math.min(
            availableWidth / img.width,
            availableHeight / img.height,
            1.1
          );
          const fgW = img.width * fitScale;
          const fgH = img.height * fitScale;
          const fgX = (canvas.width - fgW) / 2;
          const fgY = availableTop + (availableHeight - fgH) / 2;

          ctx.save();
          ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
          ctx.shadowBlur = 36;
          ctx.beginPath();
          ctx.roundRect(fgX, fgY, fgW, fgH, 24);
          ctx.clip();
          ctx.drawImage(img, fgX, fgY, fgW, fgH);
          ctx.restore();

          // Subtle elegant border around the foreground card
          ctx.save();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(fgX, fgY, fgW, fgH, 24);
          ctx.stroke();
          ctx.restore();
        } else {
          // Cover Mode: fills the visual area
          const targetHeight = visualZoneHeight;
          const scale = Math.max(canvas.width / img.width, targetHeight / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (canvas.width - w) / 2;
          const y = (targetHeight - h) / 2;
          ctx.drawImage(img, x, y, w, h);
        }

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
    imageFit,
    hookText,
    includeQrCode,
    productImage,
    currency
  ]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `affiche-${slugify(name || "produit")}-${format}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Affiche HD téléchargée !");
  };

  const handleFinalSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const finalImage = canvas.toDataURL("image/png");
    if (onSave) {
      onSave(finalImage);
    } else {
      toast.success("Affiche enregistrée pour votre boutique !");
    }
  };

  const handleShareWhatsApp = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const numPrice = parseInt(price, 10) || 0;
    const captionText = `🔥 *${name.toUpperCase()}*\n💰 Prix Promo : *${numPrice.toLocaleString()} ${currency}*${
      originalPrice ? ` ~${parseInt(originalPrice, 10).toLocaleString()} ${currency}~` : ""
    }\n\n${hookText}\n\n👉 Commandez ici : ${shopUrl}`;

    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 0.95)
      );

      if (
        blob &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [new File([blob], "promo.png", { type: "image/png" })] })
      ) {
        const file = new File([blob], `promo-${slugify(name)}.png`, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: `Promo ${name}`,
          text: captionText
        });
      } else {
        navigator.clipboard.writeText(captionText);
        handleDownload();
        toast.info("Texte copié ! L'affiche a été téléchargée pour votre statut WhatsApp.");
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

  const modalContent = (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[99999] w-screen h-screen h-[100dvh] bg-slate-900/98 dark:bg-slate-950 flex flex-col overflow-y-auto md:overflow-hidden text-slate-900 dark:text-white select-none">
      {/* Top Navbar: Compact 52px height */}
      <header className="h-[52px] px-3 sm:px-5 bg-white dark:bg-[#12141a] border-b border-slate-200 dark:border-white/10 flex justify-between items-center z-50 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <ChevronLeft size={16} />
            <span>Retour</span>
          </button>
          <div className="h-4 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />
          <div className="hidden md:flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-vendeur-emerald animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1">
              <Sparkles size={13} className="text-vendeur-emerald" /> Instant Studio V2
            </span>
          </div>
        </div>

        {/* Center: Mobile Segmented Switcher (Affiche vs Paramètres) */}
        <div className="flex md:hidden items-center bg-slate-100 dark:bg-white/10 p-0.5 rounded-xl border border-slate-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => setMobileView("preview")}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              mobileView === "preview"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-white/60"
            }`}
          >
            <Eye size={13} />
            <span>Affiche</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView("settings")}
            className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              mobileView === "settings"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                : "text-slate-600 dark:text-white/60"
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>Modifier</span>
          </button>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="hidden sm:flex bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Share2 size={14} />
            <span>Statut WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={handleFinalSave}
            className="bg-vendeur-emerald hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-vendeur-emerald/20 active:scale-95 transition-all cursor-pointer"
          >
            <Check size={15} />
            <span>Enregistrer</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body: Side-by-side on desktop, Fullscreen mode switch on mobile */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
        {/* Left / Center: Dynamic Canvas Stage */}
        <div
          className={`flex-1 min-h-0 min-w-0 p-3 sm:p-5 flex-col items-center justify-center bg-slate-950/95 relative overflow-auto ${
            mobileView === "preview" ? "flex" : "hidden md:flex"
          }`}
        >
          <div className="relative max-h-full max-w-full flex-1 flex items-center justify-center w-full">
            <canvas
              ref={canvasRef}
              className="max-h-[calc(100dvh-9.5rem)] md:max-h-[calc(100dvh-5rem)] max-w-full w-auto h-auto object-contain rounded-2xl shadow-2xl border border-white/10 ring-1 ring-white/5"
            />
            {isRendering && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center rounded-2xl">
                <Sparkles className="animate-spin text-vendeur-emerald" size={32} />
              </div>
            )}
          </div>

          {/* Mobile Bottom Dock when viewing poster */}
          <div className="w-full max-w-md pt-3 flex md:hidden items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileView("settings")}
              className="flex-1 h-11 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <SlidersHorizontal size={14} />
              <span>Modifier</span>
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-2 h-11 rounded-xl bg-vendeur-emerald hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-vendeur-emerald/20 active:scale-95 transition-all cursor-pointer"
            >
              <Share2 size={15} />
              <span>Statut WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="h-11 w-11 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0"
              title="Télécharger HD"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Right: Studio Control Sidebar */}
        <div
          className={`w-full md:w-[390px] lg:w-[420px] shrink-0 h-full flex flex-col bg-white dark:bg-[#12141a] border-l border-slate-200 dark:border-white/10 shadow-2xl z-20 overflow-hidden ${
            mobileView === "settings" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Tabs Selector: Style & Format vs Contenu & Tarifs + Mobile Affiche button */}
          <div className="p-2 border-b border-slate-200 dark:border-white/10 flex items-center gap-1 bg-slate-50 dark:bg-white/[0.02] shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("style")}
              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "style"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                  : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Palette size={14} />
              <span>Format &amp; Style</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("content")}
              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "content"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                  : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Tag size={14} />
              <span>Textes &amp; Tarifs</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileView("preview")}
              className="md:hidden py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer shrink-0"
              title="Voir l'affiche"
            >
              <Eye size={14} />
              <span>Affiche</span>
            </button>
          </div>

          {/* Tab Content Body: Compact, tight, zero scroll on desktop */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5">
            {activeTab === "style" ? (
              <>
                {/* 1. Format Selector (Story 9:16, Carré 1:1, Flyer 4:5, Auto) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 dark:text-white/50 uppercase tracking-widest">
                      Format de l&apos;Affiche
                    </label>
                    {imgNaturalRatio && (
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-vendeur-emerald">
                        Photo {imgNaturalRatio >= 0.9 && imgNaturalRatio <= 1.1 ? "Carrée (1:1)" : imgNaturalRatio < 0.7 ? "Verticale (9:16)" : "Portrait"}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormat("story")}
                      className={`h-9 rounded-xl border text-[11px] font-black flex flex-col items-center justify-center transition-all cursor-pointer ${
                        format === "story"
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xs"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Smartphone size={12} />
                        <span>9:16</span>
                      </div>
                      <span className="text-[8px] font-bold opacity-75">Statut</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormat("post")}
                      className={`h-9 rounded-xl border text-[11px] font-black flex flex-col items-center justify-center transition-all cursor-pointer ${
                        format === "post"
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xs"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Square size={12} />
                        <span>1:1</span>
                      </div>
                      <span className="text-[8px] font-bold opacity-75">Carré</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormat("flyer")}
                      className={`h-9 rounded-xl border text-[11px] font-black flex flex-col items-center justify-center transition-all cursor-pointer ${
                        format === "flyer"
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xs"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <FileText size={12} />
                        <span>4:5</span>
                      </div>
                      <span className="text-[8px] font-bold opacity-75">Flyer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormat("auto")}
                      className={`h-9 rounded-xl border text-[11px] font-black flex flex-col items-center justify-center transition-all cursor-pointer ${
                        format === "auto"
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xs"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Sparkles size={12} />
                        <span>Auto</span>
                      </div>
                      <span className="text-[8px] font-bold opacity-75">Photo</span>
                    </button>
                  </div>
                </div>

                {/* 2. Cadrage Photo (Ajuster sans couper vs Remplir tout l'espace) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 dark:text-white/50 uppercase tracking-widest">
                    Cadrage du Produit
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImageFit("contain")}
                      className={`h-9 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        imageFit === "contain"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-black shadow-xs"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-100"
                      }`}
                    >
                      <Minimize2 size={13} />
                      <span>Produit Entier (Sans couper)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImageFit("cover")}
                      className={`h-9 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        imageFit === "cover"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-black shadow-xs"
                          : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-100"
                      }`}
                    >
                      <Maximize2 size={13} />
                      <span>Plein Écran (Cover)</span>
                    </button>
                  </div>
                </div>

                {/* 3. Theme Palette Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 dark:text-white/50 uppercase tracking-widest">
                    Ambiance &amp; Couleurs
                  </label>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                    {THEME_PALETTES.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                          selectedTheme === theme.id
                            ? "border-slate-900 dark:border-white bg-slate-900/10 dark:bg-white/15 text-slate-900 dark:text-white shadow-xs font-black"
                            : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-100"
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <span>{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Promo Sticker Selector & Position Toggle */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 dark:text-white/50 uppercase tracking-widest">
                      Sticker Promo
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
                          Sur Titre
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
                          Coin Droit
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto no-scrollbar p-0.5">
                    {STICKER_PRESETS.map((stk) => (
                      <button
                        key={stk.id}
                        type="button"
                        onClick={() => setSelectedSticker(stk.id)}
                        className={`px-2 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider text-left truncate transition-all cursor-pointer ${
                          selectedSticker === stk.id
                            ? "border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs font-black"
                            : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-100"
                        }`}
                      >
                        {stk.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Product Title */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-500 dark:text-white/50 uppercase tracking-widest">
                    Titre du Produit
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-vendeur-emerald focus:bg-white dark:focus:bg-white/10 transition-all shadow-xs"
                  />
                </div>

                {/* Prices Side-by-side */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-emerald-600 dark:text-vendeur-emerald uppercase tracking-widest">
                      Prix ({currency})
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full h-9 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 text-xs font-black text-emerald-600 dark:text-vendeur-emerald outline-none focus:border-vendeur-emerald focus:bg-white dark:focus:bg-white/10 transition-all shadow-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">
                      Ancien Prix Barré
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 35000"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className="w-full h-9 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 text-xs text-slate-600 dark:text-white/60 outline-none focus:border-slate-400 dark:focus:border-white/30 focus:bg-white dark:focus:bg-white/10 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Hook / Slogan with Quick AI Idea */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
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
                    className="w-full h-9 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 text-xs text-slate-700 dark:text-white/80 outline-none focus:border-vendeur-emerald focus:bg-white dark:focus:bg-white/10 transition-all shadow-xs"
                  />
                </div>

                {/* QR Code Toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs">
                  <div className="flex items-center gap-2">
                    <QrCode size={16} className="text-emerald-600 dark:text-vendeur-emerald" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">QR Code Boutique</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeQrCode}
                    onChange={(e) => setIncludeQrCode(e.target.checked)}
                    className="h-4 w-4 rounded accent-vendeur-emerald cursor-pointer"
                  />
                </div>
              </>
            )}
          </div>

          {/* Action Footer: Always visible, pinned at bottom */}
          <div className="p-3 bg-slate-50/80 dark:bg-white/[0.03] border-t border-slate-200 dark:border-white/10 grid grid-cols-2 gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="h-10 rounded-xl bg-vendeur-emerald hover:bg-emerald-400 text-slate-950 font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-vendeur-emerald/20 cursor-pointer"
            >
              <Share2 size={14} />
              <span>Statut WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="h-10 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download size={14} />
              <span>Télécharger HD</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

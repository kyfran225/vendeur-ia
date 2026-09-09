import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Sparkles,
  ShoppingBag,
  ArrowUpRight
} from "lucide-react";
import { getShopTheme, type ShopTheme } from "../lib/theme";
import { cn } from "@/lib/utils";

interface HeroProductShowcaseProps {
  products: any[];
  currency?: string;
  merchant: any;
  theme?: ShopTheme;
  onSelectProduct: (product: any) => void;
  onAddToCart: (product: any) => void;
}

export function HeroProductShowcase({
  products,
  currency = "XOF",
  merchant,
  theme: customTheme,
  onSelectProduct,
  onAddToCart
}: HeroProductShowcaseProps) {
  const theme = customTheme || getShopTheme(merchant?.branding?.accentColor);

  // Filter products that have images first, prioritizing manually pinned 'isFeatured' articles
  const displayProducts = [...(products || [])]
    .filter((p) => p.images?.[0] || p.imageUrl || p.image)
    .sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

  const activeList = displayProducts.length > 0 ? displayProducts : [...(products || [])].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const autoPlayTimerRef = useRef<any>(null);

  // Auto-play cycle every 4.5 seconds when not paused and when we have multiple items
  useEffect(() => {
    if (activeList.length <= 1 || isPaused) return;

    autoPlayTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeList.length);
    }, 4500);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [activeList.length, isPaused]);

  if (activeList.length === 0) {
    return (
      <div className="relative w-full md:w-[440px] lg:w-[480px] h-[340px] md:h-[440px] bg-slate-50 dark:bg-white/[0.03] rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-200/80 dark:border-white/10 flex flex-col items-center justify-center p-6 text-center overflow-hidden shrink-0 shadow-xl">
        <div className={cn("h-20 w-20 rounded-3xl border flex items-center justify-center mb-4 animate-pulse", theme.badgeBgClass, theme.badgeBorderClass, theme.textClass)}>
          <ShoppingBag size={40} />
        </div>
        <p className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Vitrine en Direct</p>
        <p className="text-xs text-slate-500 dark:text-white/40 mt-1 max-w-xs">
          Les articles de {merchant.businessName} apparaîtront ici.
        </p>
      </div>
    );
  }

  const currentProduct = activeList[currentIndex];
  const imageUrl =
    currentProduct?.images?.[0] ||
    currentProduct?.imageUrl ||
    currentProduct?.image ||
    "";

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? activeList.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeList.length);
  };

  // Touch Drag Handlers for Mobile Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    setTouchDeltaX(currentX - touchStartX);
  };

  const handleTouchEnd = () => {
    if (touchStartX !== null) {
      if (touchDeltaX > 40) {
        handlePrev();
      } else if (touchDeltaX < -40) {
        handleNext();
      }
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
    setTimeout(() => setIsPaused(false), 2500);
  };

  return (
    <div
      className="relative w-full md:w-[440px] lg:w-[480px] h-[380px] sm:h-[420px] md:h-[450px] rounded-[2.5rem] md:rounded-[3.5rem] bg-slate-100 dark:bg-[#07100d] border border-slate-200/90 dark:border-white/10 overflow-hidden shrink-0 shadow-2xl group select-none cursor-pointer transition-colors"
      onClick={() => onSelectProduct(currentProduct)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Full-bleed Product Image */}
      {imageUrl ? (
        <img
          key={currentProduct._id || currentIndex}
          src={imageUrl}
          alt={currentProduct.name}
          className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-700 animate-in fade-in zoom-in-95 duration-500"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-white/20 bg-slate-200/50 dark:bg-black/40">
          <ShoppingBag size={80} />
        </div>
      )}

      {/* Dynamic Top & Bottom Vignettes */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 dark:from-black/85 dark:via-black/20 dark:to-black/50 pointer-events-none" />

      {/* Top Floating Badges */}
      <div className="absolute top-4 sm:top-5 left-4 sm:left-5 right-4 sm:right-5 flex items-center justify-between pointer-events-none z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-md border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest shadow-xl">
          <Sparkles size={13} className={cn("animate-pulse", theme.textClass)} />
          <span>En Vedette</span>
        </div>

        {activeList.length > 1 && (
          <div className="px-3 py-1 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-md border border-slate-200/80 dark:border-white/15 text-slate-900 dark:text-white/90 font-black text-[10px] tracking-widest shadow-xl">
            {currentIndex + 1} / {activeList.length}
          </div>
        )}
      </div>

      {/* Bottom Compact & Discreet Glass Card */}
      <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 right-2.5 sm:right-3 z-10">
        <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white/85 dark:bg-black/65 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-lg flex items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate leading-tight">
              {currentProduct.name}
            </h4>
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-950 dark:text-white mt-0.5">
              <span>{currentProduct.price?.toLocaleString()}</span>
              <span className={cn("text-[10px] font-bold", theme.textClass)}>
                {currentProduct.currency || currency}
              </span>
              {currentProduct.category && (
                <>
                  <span className="text-slate-300 dark:text-white/20">&bull;</span>
                  <span className="text-[9px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider truncate max-w-[100px]">
                    {currentProduct.category}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 1-Tap Quick Action Buttons (Compact & Sleek) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(currentProduct);
              }}
              className={cn("h-8 w-8 sm:h-9 sm:w-9 rounded-xl text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer", theme.bgClass, theme.hoverBgClass, theme.shadowClass)}
              title="Ajouter au panier"
            >
              <ShoppingCart size={14} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectProduct(currentProduct);
              }}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm"
              title="Voir les détails"
            >
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {activeList.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/90 hover:bg-white dark:bg-black/60 dark:hover:bg-black/80 backdrop-blur-md border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-xl z-20 active:scale-95 cursor-pointer"
            aria-label="Article précédent"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/90 hover:bg-white dark:bg-black/60 dark:hover:bg-black/80 backdrop-blur-md border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-xl z-20 active:scale-95 cursor-pointer"
            aria-label="Article suivant"
          >
            <ChevronRight size={18} />
          </button>

          {/* Bottom Progress Indicator Dots */}
          <div className="absolute bottom-1 left-0 right-0 flex items-center justify-center gap-1.5 pb-0.5 pointer-events-none z-20">
            {activeList.slice(0, 8).map((_, idx) => (
              <div
                key={idx}
                className={cn("h-1 rounded-full transition-all duration-300", currentIndex === idx ? cn("w-6", theme.bgClass) : "w-1.5 bg-slate-300/80 dark:bg-white/30")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

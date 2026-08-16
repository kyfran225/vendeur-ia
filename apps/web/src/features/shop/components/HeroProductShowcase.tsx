import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Sparkles,
  ShoppingBag,
  ArrowUpRight
} from "lucide-react";

interface HeroProductShowcaseProps {
  products: any[];
  currency?: string;
  merchant: any;
  onSelectProduct: (product: any) => void;
  onAddToCart: (product: any) => void;
}

export function HeroProductShowcase({
  products,
  currency = "XOF",
  merchant,
  onSelectProduct,
  onAddToCart
}: HeroProductShowcaseProps) {
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
      <div className="relative w-full md:w-[440px] lg:w-[480px] h-[340px] md:h-[440px] bg-white/[0.03] rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 flex flex-col items-center justify-center p-6 text-center overflow-hidden shrink-0 shadow-2xl">
        <div className="h-20 w-20 rounded-3xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 flex items-center justify-center text-vendeur-emerald mb-4 animate-pulse">
          <ShoppingBag size={40} />
        </div>
        <p className="text-sm font-black uppercase tracking-wider text-white">Vitrine en Direct</p>
        <p className="text-xs text-white/40 mt-1 max-w-xs">
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
      className="relative w-full md:w-[440px] lg:w-[480px] h-[380px] sm:h-[420px] md:h-[450px] rounded-[2.5rem] md:rounded-[3.5rem] bg-vendeur-coal border border-white/15 overflow-hidden shrink-0 shadow-2xl group select-none cursor-pointer"
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
        <div className="w-full h-full flex flex-col items-center justify-center text-white/20 bg-black/40">
          <ShoppingBag size={80} />
        </div>
      )}

      {/* Subtle Top & Bottom Vignettes (Transparent middle so 90% of photo is crystal clear) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />

      {/* Top Floating Badges */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between pointer-events-none z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-vendeur-coal/80 backdrop-blur-md border border-white/10 text-vendeur-emerald font-black text-[10px] uppercase tracking-widest shadow-xl">
          <Sparkles size={13} className="animate-pulse" />
          <span>En Vedette</span>
        </div>

        {activeList.length > 1 && (
          <div className="px-3 py-1 rounded-full bg-vendeur-coal/80 backdrop-blur-md border border-white/10 text-white/90 font-black text-[10px] tracking-widest shadow-xl">
            {currentIndex + 1} / {activeList.length}
          </div>
        )}
      </div>

      {/* Bottom Ultra-Sleek Info Bar (Direct overlay, airy & uncluttered) */}
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 z-10">
        <div className="min-w-0 flex-1 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-vendeur-emerald block drop-shadow-md">
            {currentProduct.category || merchant.category || "Catalogue"}
          </span>
          <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight line-clamp-1 leading-tight drop-shadow-md">
            {currentProduct.name}
          </h4>
          <div className="inline-flex items-center gap-1 text-base md:text-lg font-black text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 shadow-lg">
            <span>{currentProduct.price?.toLocaleString()}</span>
            <span className="text-xs text-vendeur-emerald font-bold ml-1">
              {currentProduct.currency || currency}
            </span>
          </div>
        </div>

        {/* 1-Tap Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(currentProduct);
            }}
            className="h-12 w-12 rounded-2xl bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal flex items-center justify-center shadow-2xl shadow-vendeur-emerald/40 hover:scale-110 active:scale-95 transition-all"
            title="Ajouter au panier"
          >
            <ShoppingCart size={20} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(currentProduct);
            }}
            className="h-12 w-12 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            title="Voir les détails"
          >
            <ArrowUpRight size={20} />
          </button>
        </div>
      </div>

      {/* Navigation Arrows (Subtle circular hover buttons) */}
      {activeList.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-vendeur-emerald hover:text-vendeur-coal transition-all opacity-0 group-hover:opacity-100 shadow-2xl z-20"
            aria-label="Article précédent"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:bg-vendeur-emerald hover:text-vendeur-coal transition-all opacity-0 group-hover:opacity-100 shadow-2xl z-20"
            aria-label="Article suivant"
          >
            <ChevronRight size={20} />
          </button>

          {/* Bottom Progress Indicator Dots */}
          <div className="absolute bottom-1 left-0 right-0 flex items-center justify-center gap-1.5 pb-1 pointer-events-none z-10">
            {activeList.slice(0, 8).map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${
                  currentIndex === idx
                    ? "w-6 bg-vendeur-emerald"
                    : "w-1.5 bg-white/30"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

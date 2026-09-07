import React, { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  MessageCircle,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  ArrowRight
} from "lucide-react";

interface StoryItem {
  id: string;
  title: string;
  tag: string;
  product: any;
  highlightText: string;
  badgeColor?: string;
}

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StoryItem[];
  initialIndex?: number;
  onAddToCart: (product: any) => void;
  onDirectWhatsApp: (product: any) => void;
  merchant: any;
  themeClasses?: {
    primaryBgClass?: string;
    textClass?: string;
    accentGlow?: string;
  };
}

export function StoryViewerModal({
  isOpen,
  onClose,
  stories,
  initialIndex = 0,
  onAddToCart,
  onDirectWhatsApp,
  merchant,
  themeClasses
}: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen || stories.length === 0 || isPaused) return;

    const interval = 50; // 50ms tick
    const duration = 5000; // 5 seconds per story
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((c) => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, currentIndex, stories.length, isPaused, onClose]);

  if (!isOpen || stories.length === 0) return null;

  const currentStory = stories[currentIndex] || stories[0];
  const product = currentStory.product;
  const currency = product?.currency || merchant?.currency || "XOF";
  const primaryBg = themeClasses?.primaryBgClass || "bg-emerald-500 hover:bg-emerald-400";

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
      setProgress(0);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((c) => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-950/90 dark:bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 md:p-6 select-none animate-in fade-in duration-200"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="relative w-full max-w-md h-full md:h-[88vh] md:max-h-[820px] bg-slate-900 dark:bg-[#07100d] md:rounded-[2.5rem] overflow-hidden flex flex-col justify-between border border-white/15 shadow-2xl">
        
        {/* Progress Bar Container */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5">
          {stories.map((story, idx) => (
            <div
              key={story.id}
              className="h-1.5 flex-1 bg-white/25 rounded-full overflow-hidden shadow-sm"
            >
              <div
                className={`h-full ${primaryBg.split(" ")[0]} transition-all duration-75 ease-linear`}
                style={{
                  width:
                    idx < currentIndex
                      ? "100%"
                      : idx === currentIndex
                      ? `${progress}%`
                      : "0%"
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Header Bar */}
        <div className="absolute top-6 left-4 right-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/20 dark:bg-emerald-500/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-white tracking-tight leading-none drop-shadow-md">
                {merchant.businessName}
              </p>
              <span className="text-[9px] font-extrabold text-emerald-300 dark:text-emerald-400 uppercase tracking-widest drop-shadow-sm">
                {currentStory.tag || "Offre Flash"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="h-9 w-9 rounded-full bg-black/50 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="h-9 w-9 rounded-full bg-black/50 text-white/90 hover:text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Story Background / Media */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
          {product.images?.[0] || product.imageUrl ? (
            <img
              src={product.images?.[0] || product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center">
              <Sparkles size={64} className="text-emerald-400/40 animate-pulse" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/70 pointer-events-none" />

          {/* Left / Right Click Nav Zones */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-16 bottom-32 w-1/3 z-10 opacity-0 cursor-pointer"
            aria-label="Story précédente"
          />
          <button
            onClick={handleNext}
            className="absolute right-0 top-16 bottom-32 w-1/3 z-10 opacity-0 cursor-pointer"
            aria-label="Story suivante"
          />

          {/* Floating Tag */}
          <div className="absolute top-20 left-4 z-20">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/30">
              <Flame size={12} />
              <span>{currentStory.highlightText || "Tendance de la semaine"}</span>
            </div>
          </div>
        </div>

        {/* Bottom Interactive Product Card & CTA */}
        <div className="relative z-30 p-4 md:p-5 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent space-y-3">
          <div className="p-4 rounded-2xl bg-white/10 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/15 flex items-center justify-between gap-4 shadow-2xl">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300 dark:text-emerald-400">
                {product.category || "Sélection"}
              </p>
              <h3 className="text-base font-black uppercase text-white truncate tracking-tight">
                {product.name}
              </h3>
              <p className="text-lg font-black text-white mt-0.5">
                {product.price.toLocaleString()} <span className="text-xs text-white/70 font-bold">{currency}</span>
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className={`h-11 px-4 rounded-xl ${primaryBg} text-slate-950 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shrink-0 shadow-lg cursor-pointer`}
            >
              <ShoppingCart size={15} />
              <span>+ Panier</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDirectWhatsApp(product);
              }}
              className="h-12 bg-white/10 hover:bg-white/15 dark:bg-white/5 dark:hover:bg-white/10 border border-white/15 text-white rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <MessageCircle size={17} className="text-emerald-400" />
              <span>WhatsApp Direct</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
                onClose();
              }}
              className={`h-12 ${primaryBg} text-slate-950 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl cursor-pointer`}
            >
              <span>Acheter vite</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

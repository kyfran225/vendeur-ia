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
}

export function StoryViewerModal({
  isOpen,
  onClose,
  stories,
  initialIndex = 0,
  onAddToCart,
  onDirectWhatsApp,
  merchant
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
      className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 md:p-6 select-none animate-in fade-in duration-200"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="relative w-full max-w-md h-full md:h-[88vh] md:max-h-[820px] bg-vendeur-coal md:rounded-[2.5rem] overflow-hidden flex flex-col justify-between border border-white/10 shadow-2xl">
        
        {/* Progress Bar Container */}
        <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5">
          {stories.map((story, idx) => (
            <div
              key={story.id}
              className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-vendeur-emerald transition-all duration-75 ease-linear"
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
            <div className="h-9 w-9 rounded-full bg-vendeur-emerald/20 border border-vendeur-emerald/40 flex items-center justify-center text-vendeur-emerald">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-white tracking-tight leading-none">
                {merchant.businessName}
              </p>
              <span className="text-[9px] font-bold text-vendeur-emerald uppercase tracking-widest">
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
              className="h-9 w-9 rounded-full bg-black/40 text-white/60 hover:text-white flex items-center justify-center backdrop-blur-md"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="h-9 w-9 rounded-full bg-black/40 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Story Background / Media */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {product.images?.[0] || product.imageUrl ? (
            <img
              src={product.images?.[0] || product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-vendeur-coal to-zinc-900 flex items-center justify-center">
              <Sparkles size={64} className="text-vendeur-emerald/40 animate-pulse" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60 pointer-events-none" />

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
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/30">
              <Flame size={12} />
              <span>{currentStory.highlightText || "Tendance de la semaine"}</span>
            </div>
          </div>
        </div>

        {/* Bottom Interactive Product Card & CTA */}
        <div className="relative z-30 p-5 bg-gradient-to-t from-black via-black/90 to-transparent space-y-4">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-between gap-4 shadow-xl">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest text-vendeur-emerald">
                {product.category || "Sélection"}
              </p>
              <h3 className="text-base font-black uppercase text-white truncate tracking-tight">
                {product.name}
              </h3>
              <p className="text-lg font-black text-white mt-0.5">
                {product.price.toLocaleString()} <span className="text-xs text-white/60 font-bold">{currency}</span>
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="h-12 px-4 rounded-xl bg-vendeur-emerald text-vendeur-coal font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shrink-0 shadow-lg shadow-vendeur-emerald/20"
            >
              <ShoppingCart size={16} />
              <span>+ Panier</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDirectWhatsApp(product);
              }}
              className="h-14 bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle size={18} className="text-vendeur-emerald" />
              <span>WhatsApp Direct</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
                onClose();
              }}
              className="h-14 bg-vendeur-emerald hover:bg-emerald-400 text-vendeur-coal rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20"
            >
              <span>Acheter vite</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

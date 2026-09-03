import { useState, useEffect } from "react";
import { X, Download, ZoomIn, ZoomOut, RotateCw, Share2, ExternalLink } from "lucide-react";

interface MediaLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  caption?: string;
  senderName?: string;
  timestamp?: string | Date;
}

export function MediaLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  caption,
  senderName,
  timestamp
}: MediaLightboxModalProps) {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
    }
  }, [isOpen, imageUrl]);

  // Handle keyboard escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `vendeur-ia-media-${Date.now()}.jpg`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      className="fixed inset-0 z-[1000] flex flex-col bg-black/95 backdrop-blur-lg select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div 
        className="w-full h-16 px-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-white z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold">{senderName || "Média WhatsApp"}</div>
          {timestamp && (
            <div className="text-xs text-white/50">
              {new Date(timestamp).toLocaleDateString([], {
                hour: "2-digit",
                minute: "2-digit",
                day: "numeric",
                month: "short"
              })}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Zoom Avant"
          >
            <ZoomIn size={18} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Zoom Arrière"
          >
            <ZoomOut size={18} />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className="p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Pivoter"
          >
            <RotateCw size={18} />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Télécharger l'image"
          >
            <Download size={18} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors ml-2"
            title="Fermer (Échap)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div 
        className="flex-1 flex items-center justify-center p-4 overflow-hidden"
        onClick={onClose}
      >
        <div 
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageUrl}
            alt={caption || "Média plein écran"}
            className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      </div>

      {/* Bottom Caption Bar */}
      {caption && (
        <div 
          className="w-full p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-center z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="max-w-2xl text-center text-sm text-white/90 bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
            {caption}
          </p>
        </div>
      )}
    </div>
  );
}

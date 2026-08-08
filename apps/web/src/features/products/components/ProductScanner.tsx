import React, { useRef, useState, useEffect, useCallback } from "react";
import { X, Camera, Sparkles, RefreshCw, Check, Loader2, Zap, ShieldCheck, Layers } from "lucide-react";
import { toast } from "sonner";
import { PosterGenerator } from "./PosterGenerator";
import { BatchReviewModal } from "./BatchReviewModal";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { compressImage } from "@/lib/imageUtils";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) console.warn("VITE_API_URL is not defined! Check your .env file.");

interface ProductScannerProps {
  onClose: () => void;
  onScanComplete: (data: any) => void;
  boutiqueName: string;
}

export function ProductScanner({ onClose, onScanComplete, boutiqueName }: ProductScannerProps) {
  const { accessToken } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(false);
  const activeRequestRef = useRef(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanStep, setScanStep] = useState<"idle" | "capturing" | "processing" | "analyzing" | "batch_review" | "studio" | "complete">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detectedData, setDetectedData] = useState<any>(null);
  const [batchItems, setBatchItems] = useState<any[]>([]);

  // Filter values for "Auto-Enhance"
  const filters = "saturate(1.2) brightness(1.1) contrast(1.05)";

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  const startCamera = useCallback(async () => {
    const requestId = ++activeRequestRef.current;
    try {
      // Stop any existing stream before starting a new one
      stopCamera();

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1080 }, height: { ideal: 1080 } },
        audio: false,
      });

      // RACE CONDITION CHECK:
      if (!isMountedRef.current || requestId !== activeRequestRef.current) {
        mediaStream.getTracks().forEach(track => track.stop());
        return;
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      if (isMountedRef.current && requestId === activeRequestRef.current) {
        console.error("Error accessing camera:", err);
        toast.error("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    isMountedRef.current = true;
    startCamera();
    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setScanStep("processing");
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 1. Draw frame to canvas
    context.filter = filters; // Apply enhancement filters directly to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setPreviewUrl(imageData);

    // Stop stream to save battery
    stopCamera();

    // 2. Real AI Analysis call with Compression
    setScanStep("analyzing");

    try {
      // Production Hardening: Compress image before upload
      const compressedBlob = await compressImage(imageData, 1080, 0.7);

      const formData = new FormData();
      formData.append("image", compressedBlob, "product.jpg");

      const response = await axios.post(`${API_URL}/api/commerce/products/vision`, formData, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data"
        },
        timeout: 30000 // 30s timeout for AI analysis in prod
      });

      const resData = response.data;
      const items = resData.items && Array.isArray(resData.items) ? resData.items : [resData];

      setBatchItems(items);
      setDetectedData({
        ...items[0],
        image: imageData
      });
      setScanStep("batch_review");
    } catch (error) {
      console.error("Vision API Error:", error);
      toast.error("L'IA n'a pas pu analyser l'image. Utilisation du mode manuel.");
      const fallbackItem = {
        name: "Produit sans nom",
        price: 0,
        category: "fashion",
        description: "Description produit",
        image: imageData
      };
      setBatchItems([fallbackItem]);
      setDetectedData(fallbackItem);
      setScanStep("batch_review");
    }
  };

  if (scanStep === "batch_review" && previewUrl) {
    return (
      <BatchReviewModal
        image={previewUrl}
        rawItems={batchItems}
        boutiqueName={boutiqueName}
        onCancel={() => {
          setScanStep("idle");
          setPreviewUrl(null);
          startCamera();
        }}
        onConfirm={(confirmedItems) => {
          onScanComplete({ items: confirmedItems, isBatch: true });
          handleClose();
        }}
      />
    );
  }

  if (scanStep === "studio" && detectedData) {
    return (
      <PosterGenerator
        productData={detectedData}
        boutiqueName={boutiqueName}
        businessCategory={useOnboardingStore.getState().tempData?.category || "fashion"}
        onBack={() => {
          setScanStep("idle");
          setPreviewUrl(null);
          startCamera();
        }}
        onSave={(img) => {
          onScanComplete({ ...detectedData, finalPoster: img });
          handleClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <button
          onClick={handleClose}
          className="h-12 w-12 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
        >
          <X size={24} />
        </button>
        <div className="bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
          <Zap size={16} className="text-emerald-400 fill-emerald-400" />
          <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Scanner IA v2</span>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {scanStep === "idle" && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              style={{ filter: filters }}
            />
            {/* Camera Guides */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square border-2 border-emerald-500/30 rounded-[3rem]">
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
              </div>
            </div>
          </>
        )}

        {previewUrl && (
          <img src={previewUrl} className="w-full h-full object-cover animate-in zoom-in-95 duration-500" alt="Preview" />
        )}

        {/* Scan Animation Overlay */}
        {(scanStep === "processing" || scanStep === "analyzing") && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="relative w-full overflow-hidden h-1 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
              <div className="absolute inset-0 bg-emerald-500 animate-[scan_2s_infinite]" />
            </div>
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <p className="text-emerald-400 font-black uppercase tracking-[0.2em] text-sm animate-pulse">
                {scanStep === "processing" ? "Embellissement..." : "Intelligence IA..."}
              </p>
            </div>
          </div>
        )}

        {scanStep === "complete" && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-emerald-500/90 backdrop-blur-md p-8 text-center animate-in fade-in zoom-in duration-300">
             <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-2xl">
                <Check size={48} className="text-emerald-500" strokeWidth={4} />
             </div>
             <h2 className="text-4xl font-black text-white mb-2">PRODUIT DÉTECTÉ</h2>
             <p className="text-white/80 font-medium">L'IA a généré votre fiche automatiquement.</p>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-10 bg-black flex justify-center items-center relative">
        <canvas ref={canvasRef} className="hidden" />

        {scanStep === "idle" && (
          <button
            onClick={capturePhoto}
            className="group relative h-24 w-24 rounded-full bg-white p-1 shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-90 transition-all"
          >
            <div className="h-full w-full rounded-full border-4 border-black/5 flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-black/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles size={32} className="text-black" />
              </div>
            </div>
            {/* Hint */}
            <p className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">
              Cliquez pour Scanner
            </p>
          </button>
        )}

        {scanStep === "complete" && (
          <button
            onClick={handleClose}
            className="h-16 px-12 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all"
          >
            Voir la fiche
          </button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { transform: translateY(-100vh); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}} />
    </div>
  );
}

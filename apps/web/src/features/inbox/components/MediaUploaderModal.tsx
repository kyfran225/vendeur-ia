import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send, Image as ImageIcon, FileText, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { playMessageSentPop } from "@/lib/sound";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo max pour les images
const MAX_MEDIA_SIZE_BYTES = 15 * 1024 * 1024; // 15 Mo max pour les documents

interface MediaUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  conversationId: string;
  quotedMessageId?: string;
  onMediaSent: () => void;
}

export function MediaUploaderModal({
  isOpen,
  onClose,
  file,
  conversationId,
  quotedMessageId,
  onMediaSent
}: MediaUploaderModalProps) {
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (file) {
      if (file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|heic)$/i.test(file.name || "")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } else {
        setPreviewUrl(null);
      }
    }
  }, [file]);

  if (!isOpen || !file || typeof document === "undefined") return null;

  const isImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|heic)$/i.test(file.name || "");
  const maxBytes = isImage ? MAX_IMAGE_SIZE_BYTES : MAX_MEDIA_SIZE_BYTES;
  const maxLabel = isImage ? "5 Mo" : "15 Mo";
  const fileSizeMb = (file.size / 1024 / 1024).toFixed(2);
  const isTooLarge = file.size > maxBytes;

  const handleSend = async () => {
    if (isTooLarge) {
      toast.error(
        isImage
          ? `Image trop volumineuse (${fileSizeMb} Mo). La taille maximale autorisée est de 5 Mo.`
          : `Fichier trop volumineux (${fileSizeMb} Mo). La taille maximale autorisée est de 15 Mo.`
      );
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (caption.trim()) formData.append("caption", caption.trim());
      if (quotedMessageId) formData.append("quotedMessageId", quotedMessageId);

      const res = await apiClient.post(`/api/commerce/conversations/${conversationId}/media`, formData);

      if (res.data?.deliveryError) {
        toast.error(`⚠️ Non remis sur WhatsApp : ${res.data.deliveryError}`);
      } else {
        playMessageSentPop();
        toast.success(isImage ? "Photo envoyée avec succès !" : "Média envoyé avec succès !");
      }
      onMediaSent();
      onClose();
      setCaption("");
    } catch (err: any) {
      console.error("[Media Upload Error]:", err);
      toast.error(err.response?.data?.error || "Échec de l'envoi du média.");
    } finally {
      setIsUploading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#111b21] border border-slate-200 dark:border-[#222e35] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-[#e9edef] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#202c33] border-b border-slate-100 dark:border-[#2a3942] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isImage ? (
              <ImageIcon size={18} className="text-emerald-600 dark:text-[#00a884]" />
            ) : (
              <FileText size={18} className="text-emerald-600 dark:text-[#00a884]" />
            )}
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isImage ? "Envoyer une photo" : "Envoyer un document"}
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-[#00a884] border border-emerald-500/20">
              Max {maxLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-[#8696a0] hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview Stage */}
        <div className="p-6 flex flex-col items-center justify-center gap-3 bg-slate-100 dark:bg-[#0b141a]">
          {isImage && previewUrl ? (
            <>
              <div className="max-h-72 max-w-full rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-[#222e35] bg-white dark:bg-black">
                <img src={previewUrl} alt="Aperçu" className="max-h-72 w-auto object-contain" />
              </div>
              <div className="text-xs text-slate-500 dark:text-[#8696a0] flex items-center gap-2">
                <span className="truncate max-w-[220px] font-medium text-slate-700 dark:text-white/80">{file.name}</span>
                <span>•</span>
                <span className={isTooLarge ? "text-rose-500 font-bold" : ""}>{fileSizeMb} Mo / {maxLabel}</span>
              </div>
            </>
          ) : (
            <div className="w-full p-6 rounded-xl bg-white dark:bg-[#202c33] border border-slate-200 dark:border-[#2a3942] flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 dark:bg-[#00a884]/20 text-emerald-600 dark:text-[#00a884] flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{file.name}</div>
                <div className="text-xs text-slate-500 dark:text-[#8696a0]">
                  <span className={isTooLarge ? "text-rose-500 font-bold" : ""}>{fileSizeMb} Mo / {maxLabel}</span> • {file.type || "Fichier"}
                </div>
              </div>
            </div>
          )}

          {isTooLarge && (
            <div className="w-full px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>
                Ce fichier dépasse la taille maximale autorisée ({maxLabel}). Veuillez choisir un fichier plus léger.
              </span>
            </div>
          )}
        </div>

        {/* Caption Input */}
        <div className="p-4 bg-slate-50 dark:bg-[#202c33] border-t border-slate-100 dark:border-[#2a3942] space-y-3">
          <div className="relative">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ajouter une légende (optionnel)..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isTooLarge) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              autoFocus
              className="w-full px-4 py-3 bg-white dark:bg-[#111b21] border border-slate-200 dark:border-[#2a3942] rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#8696a0] text-sm focus:outline-none focus:border-emerald-500 dark:focus:border-[#00a884]"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2a3942] text-xs font-semibold text-slate-600 dark:text-[#8696a0] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-transparent transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isUploading || isTooLarge}
              onClick={handleSend}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-[#00a884] dark:hover:bg-[#00a884]/90 active:scale-95 disabled:opacity-50 text-xs font-bold text-white dark:text-[#111b21] flex items-center gap-2 shadow-md transition-all"
            >
              {isUploading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Envoyer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

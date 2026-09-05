import { useState, useEffect } from "react";
import { X, Send, Image as ImageIcon, FileText, Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";

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
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } else {
        setPreviewUrl(null);
      }
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const handleSend = async () => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (caption.trim()) formData.append("caption", caption.trim());
      if (quotedMessageId) formData.append("quotedMessageId", quotedMessageId);

      await apiClient.post(`/api/commerce/conversations/${conversationId}/media`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Média envoyé avec succès !");
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

  const isImage = file.type.startsWith("image/");

  return (
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
        <div className="p-6 flex flex-col items-center justify-center bg-slate-100 dark:bg-[#0b141a]">
          {isImage && previewUrl ? (
            <div className="max-h-72 max-w-full rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-[#222e35] bg-white dark:bg-black">
              <img src={previewUrl} alt="Aperçu" className="max-h-72 w-auto object-contain" />
            </div>
          ) : (
            <div className="w-full p-6 rounded-xl bg-white dark:bg-[#202c33] border border-slate-200 dark:border-[#2a3942] flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 dark:bg-[#00a884]/20 text-emerald-600 dark:text-[#00a884] flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{file.name}</div>
                <div className="text-xs text-slate-500 dark:text-[#8696a0]">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || "Fichier"}
                </div>
              </div>
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
                if (e.key === "Enter" && !e.shiftKey) {
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
              disabled={isUploading}
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
    </div>
  );
}

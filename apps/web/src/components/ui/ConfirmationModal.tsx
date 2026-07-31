import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, AlertCircle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "danger" | "warning" | "info";
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  type = "danger"
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0c0f0d] p-8 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-white/20 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Icon */}
            <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${
              type === "danger" ? "bg-rose-500/10 text-rose-500" :
              type === "warning" ? "bg-amber-500/10 text-amber-500" :
              "bg-sky-500/10 text-sky-500"
            }`}>
              {type === "danger" ? <Trash2 size={32} /> :
               type === "warning" ? <AlertTriangle size={32} /> :
               <AlertCircle size={32} />}
            </div>

            {/* Text */}
            <div className="mb-8">
              <h3 className="mb-2 text-2xl font-black text-white leading-tight">{title}</h3>
              <p className="text-sm font-medium leading-relaxed text-white/50">{message}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex h-14 items-center justify-center rounded-2xl text-sm font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 ${
                  type === "danger" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" :
                  type === "warning" ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" :
                  "bg-emerald-300 text-black shadow-lg shadow-emerald-500/20"
                }`}
              >
                {confirmLabel}
              </button>
              <button
                onClick={onClose}
                className="flex h-14 items-center justify-center rounded-2xl border border-white/5 bg-white/5 text-sm font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all"
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

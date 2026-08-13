import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, AlertCircle, LogOut, Loader2 } from "lucide-react";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "danger" | "warning" | "info" | "logout";
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  type = "danger",
  icon,
  isLoading = false
}: ConfirmationModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  const getIcon = () => {
    if (icon) return icon;
    if (type === "logout") return <LogOut size={28} />;
    if (type === "danger") return <Trash2 size={28} />;
    if (type === "warning") return <AlertTriangle size={28} />;
    return <AlertCircle size={28} />;
  };

  const getBadgeStyle = () => {
    if (type === "danger" || type === "logout") return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    return "bg-vendeur-emerald/10 text-vendeur-emerald border-vendeur-emerald/20";
  };

  const getConfirmButtonStyle = () => {
    if (type === "danger" || type === "logout") {
      return "bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600";
    }
    return "bg-vendeur-emerald text-vendeur-coal shadow-lg shadow-vendeur-emerald/20 hover:bg-vendeur-emerald/90";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md overflow-hidden rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-white/10 bg-vendeur-coal p-6 sm:p-8 shadow-2xl z-10"
          >
            {/* Mobile Drag Indicator Pill */}
            <div className="sm:hidden w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />

            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute right-5 top-5 sm:right-6 sm:top-6 text-white/30 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5 disabled:opacity-30"
            >
              <X size={20} />
            </button>

            {/* Icon Header */}
            <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border ${getBadgeStyle()}`}>
              {getIcon()}
            </div>

            {/* Text */}
            <div className="mb-8 space-y-2 text-left">
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight uppercase tracking-tight">
                {title}
              </h3>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-white/60">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row-reverse gap-3">
              <button
                disabled={isLoading}
                onClick={handleConfirm}
                className={`flex h-14 w-full sm:flex-1 items-center justify-center gap-2 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 shrink-0 ${getConfirmButtonStyle()}`}
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : confirmLabel}
              </button>
              <button
                disabled={isLoading}
                onClick={onClose}
                className="flex h-14 w-full sm:flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xs sm:text-sm font-black uppercase tracking-wider text-white/70 hover:bg-white/10 hover:text-white transition-all active:scale-95 disabled:opacity-50 shrink-0"
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



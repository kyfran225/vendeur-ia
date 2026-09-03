import React, { useState, useEffect } from "react";
import { WifiOff as WifiOffIcon, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function WifiOff() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-3 sm:top-6 inset-x-0 mx-auto px-3 z-[200] w-full max-w-md pointer-events-auto"
        >
          <div className="bg-[#1a0c0f]/95 backdrop-blur-2xl border border-red-500/40 p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-2.5 sm:gap-3 shadow-2xl shadow-red-500/20 w-full overflow-hidden">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl sm:rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <WifiOffIcon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-black uppercase tracking-wider text-[10px] sm:text-xs truncate">
                  Connexion Interrompue
                </p>
                <p className="text-white/60 text-[9px] sm:text-[10px] truncate">
                  Vérifiez votre réseau internet.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="h-8 sm:h-9 px-3 sm:px-4 bg-red-500 hover:bg-red-400 active:scale-95 text-white rounded-xl transition-all flex items-center gap-1.5 text-[10px] sm:text-xs font-bold shrink-0 shadow-md shadow-red-500/25 cursor-pointer"
            >
              <RefreshCw size={13} className="shrink-0 animate-spin-slow" />
              <span>Actualiser</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

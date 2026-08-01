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
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md"
        >
          <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 p-4 rounded-2xl flex items-center justify-between shadow-2xl shadow-red-500/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                <WifiOffIcon size={20} />
              </div>
              <div>
                <p className="text-white font-black uppercase tracking-widest text-[10px]">Connexion Interrompue</p>
                <p className="text-white/40 text-[10px]">Certaines fonctionnalités sont limitées.</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="h-10 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors flex items-center gap-2 text-[10px] font-bold"
            >
              <RefreshCw size={14} />
              Actualiser
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ShellHeader } from "./ShellHeader";
import { WifiOff } from "../ui/WifiOff";
import { CopilotWidget } from "../copilot/CopilotWidget";

export function AppLayout() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollTop = useRef(0);
  const location = useLocation();

  // Re-show header whenever navigating to a new page
  useEffect(() => {
    setIsHeaderVisible(true);
    lastScrollTop.current = 0;
  }, [location.pathname]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    const delta = currentScrollTop - lastScrollTop.current;

    // Toujours visible près du haut de page
    if (currentScrollTop <= 30) {
      setIsHeaderVisible(true);
    } else if (delta > 8) {
      // Défilement vers le bas : on masque le header pour maximiser l'espace d'affichage
      setIsHeaderVisible(false);
    } else if (delta < -8) {
      // Défilement vers le haut : on fait réapparaître le header instantanément
      setIsHeaderVisible(true);
    }

    lastScrollTop.current = currentScrollTop;
  };

  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row bg-vendeur-bg relative">
      <WifiOff />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ShellHeader isVisible={isHeaderVisible} />
        <main
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto pb-16 md:pb-0 scroll-smooth"
        >
          <div className="max-w-[1600px] mx-auto w-full min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
      <CopilotWidget />
    </div>
  );
}

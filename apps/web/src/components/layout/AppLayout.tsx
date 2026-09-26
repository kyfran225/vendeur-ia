import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ShellHeader } from "./ShellHeader";
import { WifiOff } from "../ui/WifiOff";
import { CopilotWidget } from "../copilot/CopilotWidget";
import { useGlobalNotifications } from "@/hooks";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AppLayout() {
  useGlobalNotifications();
  const location = useLocation();
  const isInbox = location.pathname.startsWith("/inbox");

  const mainRef = React.useRef<HTMLElement>(null);
  const [isHeaderHidden, setIsHeaderHidden] = React.useState(false);
  const lastScrollTopRef = React.useRef(0);

  // Scroll to top and restore header on route change
  React.useEffect(() => {
    setIsHeaderHidden(false);
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Auto-hide header when scrolling DOWN, reveal when scrolling UP
  const handleScroll = () => {
    if (isInbox || !mainRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
    const diff = scrollTop - lastScrollTopRef.current;

    // Prevent auto-hide if near top OR near bottom (where overscroll/bounce causes flickering)
    const isNearTop = scrollTop <= 40;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 80;

    if (isNearTop || isNearBottom) {
      setIsHeaderHidden(false);
      lastScrollTopRef.current = scrollTop;
      return;
    }

    if (Math.abs(diff) > 10) {
      if (diff > 0 && scrollTop > 60) {
        // Scrolling DOWN -> Hide header
        setIsHeaderHidden(true);
      } else if (diff < 0) {
        // Scrolling UP -> Show header
        setIsHeaderHidden(false);
      }
      lastScrollTopRef.current = scrollTop;
    }
  };

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden flex-col md:flex-row bg-slate-50 dark:bg-vendeur-bg text-slate-900 dark:text-white relative overscroll-none transition-colors">
      <WifiOff />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {!isInbox && (
          <div
            className={cn(
              "sticky top-0 w-full z-40 transition-transform duration-300 ease-in-out shrink-0",
              isHeaderHidden ? "-translate-y-full" : "translate-y-0"
            )}
          >
            <ShellHeader />
          </div>
        )}
        <main
          ref={mainRef}
          onScroll={handleScroll}
          className={cn(
            "flex-1 overscroll-contain min-h-0 overflow-x-hidden",
            isInbox
              ? "overflow-hidden h-full flex flex-col pb-16 md:pb-0"
              : "overflow-y-auto pb-16 md:pb-0"
          )}
        >
          <div
            className={cn(
              "w-full",
              isInbox
                ? "flex-1 flex flex-col h-full min-h-0 p-0 overflow-hidden"
                : "max-w-[1600px] mx-auto min-h-full"
            )}
          >
            <Outlet />
          </div>
        </main>
      </div>
      <CopilotWidget />
    </div>
  );
}

import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ShellHeader } from "./ShellHeader";
import { WifiOff } from "../ui/WifiOff";
import { CopilotWidget } from "../copilot/CopilotWidget";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function AppLayout() {
  const location = useLocation();
  const isInbox = location.pathname.startsWith("/inbox");

  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row bg-vendeur-bg relative overscroll-none">
      <WifiOff />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <ShellHeader />
        <main
          className={cn(
            "flex-1 overscroll-contain",
            isInbox
              ? "overflow-hidden h-full flex flex-col pb-16 md:pb-0"
              : "overflow-y-auto pb-16 md:pb-0"
          )}
        >
          <div
            className={cn(
              "max-w-[1600px] mx-auto w-full",
              isInbox
                ? "flex-1 flex flex-col h-full min-h-0 p-1 md:p-3 overflow-hidden"
                : "min-h-full"
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

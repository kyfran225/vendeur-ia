import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { WifiOff } from "../ui/WifiOff";

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row">
      <WifiOff />
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar bg-vendeur-bg pb-16 md:pb-0 scroll-smooth">
        <div className="max-w-[1600px] mx-auto w-full min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

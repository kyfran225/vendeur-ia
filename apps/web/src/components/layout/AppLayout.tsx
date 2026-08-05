import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ShellHeader } from "./ShellHeader";
import { WifiOff } from "../ui/WifiOff";

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden flex-col md:flex-row bg-vendeur-bg">
      <WifiOff />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ShellHeader />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0 scroll-smooth">
          <div className="max-w-[1600px] mx-auto w-full min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

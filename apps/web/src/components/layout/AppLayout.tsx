import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { WifiOff } from "../ui/WifiOff";

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <WifiOff />
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar bg-vendeur-bg">
        <Outlet />
      </main>
    </div>
  );
}

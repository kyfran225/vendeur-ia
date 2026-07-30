import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, MessageCircle, Brain, Settings, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const links = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Stats" },
    { to: "/products", icon: Package, label: "Stock" },
    { to: "/inbox", icon: MessageCircle, label: "Messages" },
    { to: "/knowledge", icon: Brain, label: "Cerveau IA" },
    { to: "/settings", icon: Settings, label: "Réglages" },
  ];

  return (
    <aside className="w-24 bg-vendeur-coal border-r border-white/5 flex flex-col items-center py-8 space-y-12">
      <div className="h-12 w-12 bg-vendeur-emerald/10 rounded-2xl flex items-center justify-center border border-vendeur-emerald/20">
        <Bot className="text-vendeur-emerald" size={24} />
      </div>

      <nav className="flex-1 w-full flex flex-col items-center gap-6">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 group transition-all",
              isActive ? "text-vendeur-emerald" : "text-white/30 hover:text-white"
            )}
          >
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
              "group-hover:bg-white/5"
            )}>
              <link.icon size={20} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

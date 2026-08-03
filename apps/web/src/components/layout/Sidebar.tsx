import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, MessageCircle, Brain, Settings, Megaphone, ShoppingCart, MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Stats" },
    { to: "/products", icon: Package, label: "Catalogue" },
    { to: "/orders", icon: ShoppingCart, label: "Commandes" },
    { to: "/inbox", icon: MessageCircle, label: "Messages" },
    { to: "/marketing", icon: Megaphone, label: "Marketing" },
    { to: "/settings", icon: Settings, label: "Réglages" },
  ];

  const bottomLinks = links.slice(0, 4);
  const isMoreActive = links.slice(4).some((link) => location.pathname.startsWith(link.to));

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-28 bg-vendeur-coal border-r border-white/5 flex-col items-center py-10 space-y-12 shrink-0">
        <div className="h-16 w-16 flex items-center justify-center overflow-hidden bg-white/5 rounded-2xl p-2 border border-white/10 shadow-2xl">
          <img src="/apple-touch-icon.png" alt="Logo" className="h-full w-full object-contain filter drop-shadow-lg" />
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

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-vendeur-coal/95 backdrop-blur-lg border-t border-white/5 z-50 flex items-center justify-around px-2 pb-safe">
        {bottomLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 transition-all flex-1 py-1 text-center",
              isActive ? "text-vendeur-emerald" : "text-white/30"
            )}
          >
            <link.icon size={18} />
            <span className="text-[8px] font-black uppercase tracking-tight truncate max-w-full block">{link.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1 transition-all flex-1 py-1 text-center outline-none",
            isMoreActive ? "text-vendeur-emerald" : "text-white/30 hover:text-white"
          )}
        >
          <MoreHorizontal size={18} />
          <span className="text-[8px] font-black uppercase tracking-tight truncate max-w-full block">Plus</span>
        </button>
      </nav>

      {/* Sliding Right Drawer for Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-all duration-300 ease-in-out",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop overlay */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-32 bg-[#17201c] border-l border-white/10 py-6 px-4 flex flex-col items-center gap-8 shadow-2xl transition-transform duration-300 ease-out pb-safe",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/40 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all outline-none"
          >
            <X size={20} />
          </button>

          {/* Vertical layout similar to desktop sidebar but slightly smaller */}
          <nav className="flex-1 w-full flex flex-col items-center gap-6 overflow-y-auto no-scrollbar">
            {links.slice(4).map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => cn(
                  "flex flex-col items-center gap-1 group transition-all w-full",
                  isActive ? "text-vendeur-emerald" : "text-white/30 hover:text-white"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center transition-all",
                  "group-hover:bg-white/5"
                )}>
                  <link.icon size={20} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-center truncate w-full block">{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}


import React, { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  MessageCircle, 
  Settings, 
  Megaphone, 
  ShoppingCart, 
  MoreHorizontal, 
  X, 
  Shield,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  HelpCircle,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useFounderRole } from "@/hooks/useFounderRole";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface SidebarProps {
  hideDesktop?: boolean;
}

export function Sidebar({ hideDesktop = false }: SidebarProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isFounder } = useFounderRole();

  const links = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    ...(isFounder ? [{ to: "/admin", icon: ShieldCheck, label: "Founder", desc: "Master Control Cockpit" }] : []),
    { to: "/inbox", icon: MessageCircle, label: "Inbox" },
    { to: "/orders", icon: ShoppingCart, label: "Commandes" },
    { to: "/products", icon: Package, label: "Catalogue", desc: "Gestion des stocks & articles" },
    { to: "/marketing", icon: Megaphone, label: "Marketing", desc: "Affiches & Campagnes" },
    { to: "/settings", icon: Settings, label: "Réglages", desc: "Boutique, Savoir IA & Canaux" },
    { to: "/help", icon: HelpCircle, label: "Aide", desc: "FAQ & Base de connaissances" },
  ];

  const bottomLinks = isFounder
    ? [
        { to: "/dashboard", icon: LayoutDashboard, label: "Nexus" },
        { to: "/admin", icon: ShieldCheck, label: "Founder" },
        { to: "/inbox", icon: MessageCircle, label: "Live" },
        { to: "/orders", icon: ShoppingCart, label: "Flux" },
      ]
    : [
        { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { to: "/inbox", icon: MessageCircle, label: "Messages" },
        { to: "/orders", icon: ShoppingCart, label: "Commandes" },
        { to: "/products", icon: Package, label: "Catalogue" },
      ];

  const bottomLinkPaths = bottomLinks.map(l => l.to);
  const moreLinks = links.filter(l => !bottomLinkPaths.includes(l.to));
  const isMoreActive = moreLinks.some((link) => location.pathname.startsWith(link.to));

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex w-28 bg-vendeur-coal border-r border-white/5 flex-col items-center py-10 space-y-8 shrink-0",
        hideDesktop && "md:hidden"
      )}>
        <div className="h-16 w-16 flex items-center justify-center overflow-hidden bg-white/5 rounded-2xl p-3 border border-white/10 shadow-2xl shrink-0 text-vendeur-emerald hover:text-white transition-colors">
          <Logo size={36} />
        </div>

        <nav className="flex-1 w-full flex flex-col items-center gap-6">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 group transition-all",
                  isActive ? "text-vendeur-emerald" : "text-white/30 hover:text-white"
                )
              }
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

        {/* Desktop Logout Button */}
        <div className="w-full px-4 pt-4 border-t border-white/5">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex flex-col items-center gap-1 group text-white/30 hover:text-red-400 transition-all active:scale-95 py-2"
            title="Se déconnecter"
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center group-hover:bg-red-500/10 transition-all">
              <LogOut size={20} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Sortie</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0f1714]/95 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-around px-2 pb-safe shadow-[0_-4px_25px_rgba(0,0,0,0.4)]">
        {bottomLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 transition-all flex-1 py-1 text-center",
                isActive ? "text-vendeur-emerald scale-105 font-bold" : "text-white/40 hover:text-white/70"
              )
            }
          >
            <link.icon size={19} />
            <span className="text-[9px] font-black uppercase tracking-tight truncate max-w-full block">{link.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className={cn(
            "flex flex-col items-center gap-1 transition-all flex-1 py-1 text-center outline-none relative",
            isMoreActive || isOpen ? "text-vendeur-emerald font-bold" : "text-white/40 hover:text-white/70"
          )}
        >
          <MoreHorizontal size={19} />
          <span className="text-[9px] font-black uppercase tracking-tight truncate max-w-full block">Plus</span>
        </button>
      </nav>

      {/* Modern Thumb-Friendly Mobile Bottom Sheet */}
      <div
        className={cn(
          "fixed inset-0 z-[80] md:hidden transition-all duration-300 ease-out",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />

        {/* Bottom Sheet Modal Container positioned right in the Thumb Zone */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-[#121c18] border-t border-white/10 rounded-t-[2.5rem] p-6 pb-20 shadow-[0_-15px_50px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-out max-h-[80vh] overflow-y-auto",
            isOpen ? "translate-y-0" : "translate-y-full"
          )}
        >
          {/* Top Drag Handle Indicator */}
          <div className="flex flex-col items-center justify-center mb-5 cursor-pointer" onClick={() => setIsOpen(false)}>
            <div className="w-12 h-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-5 px-1">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 flex items-center justify-center text-vendeur-emerald">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Menu & Outils</h3>
                <p className="text-[10px] text-white/40 font-medium">Accès rapide aux fonctionnalités</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Thumb-friendly Grid Cards */}
          <div className="grid grid-cols-1 gap-2.5">
            {moreLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98]",
                    isActive
                      ? "bg-vendeur-emerald/15 border-vendeur-emerald/40 text-white shadow-lg shadow-vendeur-emerald/10"
                      : "bg-white/[0.03] border-white/5 text-white/80 hover:bg-white/[0.07] hover:border-white/10"
                  )
                }
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={cn(
                      "h-11 w-11 rounded-xl flex items-center justify-center transition-all",
                      location.pathname.startsWith(link.to)
                        ? "bg-vendeur-emerald text-vendeur-coal shadow-md shadow-vendeur-emerald/20 font-bold"
                        : "bg-white/5 text-vendeur-emerald border border-white/5"
                    )}
                  >
                    <link.icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-white">{link.label}</p>
                    {link.desc && (
                      <p className="text-[10px] text-white/40 font-medium mt-0.5">{link.desc}</p>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/20" />
              </NavLink>
            ))}

            {/* Mobile Logout Button in More Menu */}
            <button
              onClick={() => {
                setIsOpen(false);
                setShowLogoutModal(true);
              }}
              className="flex items-center justify-between p-4 rounded-2xl border border-red-500/10 bg-red-500/5 text-red-400 transition-all active:scale-[0.98] mt-2"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500">
                  <LogOut size={20} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-white">Déconnexion</p>
                  <p className="text-[10px] text-red-400/60 font-medium mt-0.5">Fermer votre session</p>
                </div>
              </div>
              <ChevronRight size={18} className="opacity-40" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Se déconnecter ?"
        message="Êtes-vous sûr de vouloir fermer votre session ? Vous pourrez vous reconnecter à tout moment."
        confirmLabel="Déconnexion"
        cancelLabel="Annuler"
        type="logout"
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
        }}
        onClose={() => setShowLogoutModal(false)}
      />
    </>
  );
}


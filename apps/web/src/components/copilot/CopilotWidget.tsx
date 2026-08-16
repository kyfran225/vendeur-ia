import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  MessageSquarePlus,
  ArrowRight,
  Package,
  ShoppingCart,
  MessageCircle,
  Settings,
  Zap,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  Store,
  Layers,
  Crown,
  Compass
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useCopilotStore, SuggestedAction } from "@/stores/copilotStore";
import { FounderContactModal } from "./FounderContactModal";
import { StoreAuditModal } from "./StoreAuditModal";
import { SpotlightTourOverlay } from "./SpotlightTourOverlay";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Resolve precise route for settings tabs and general routes
export function resolveTargetRoute(rawUrl: string, contextText?: string): string {
  let url = (rawUrl || "").trim();
  if (!url) return "/dashboard";

  const text = (contextText || "").toLowerCase();

  // If already has tab and section query parameter, return as is
  if (url.includes("?tab=") && url.includes("&section=")) return url;

  if (url.startsWith("/settings")) {
    if (text.includes("whatsapp") || text.includes("qr") || text.includes("connect") || text.includes("meta")) {
      return "/settings?tab=connexions&section=whatsapp";
    }
    if (text.includes("logo") || text.includes("uploader mon logo")) {
      return "/settings?tab=apparence&section=logo";
    }
    if (text.includes("couleur") || text.includes("palette") || text.includes("thème")) {
      return "/settings?tab=apparence&section=theme";
    }
    if (text.includes("bannière") || text.includes("promo") || text.includes("annonce")) {
      return "/settings?tab=apparence&section=announcement";
    }
    if (text.includes("réseaux") || text.includes("instagram") || text.includes("tiktok") || text.includes("social")) {
      return "/settings?tab=apparence&section=socials";
    }
    if (text.includes("vitrine") || text.includes("apparence")) {
      return "/settings?tab=apparence&section=logo";
    }
    if (text.includes("personnalité") || text.includes("attitude") || text.includes("ton") || text.includes("ia") || text.includes("caractère")) {
      return "/settings?tab=personnalite&section=personality";
    }
    if (text.includes("savoir") || text.includes("faq") || text.includes("connaissance") || text.includes("règle") || text.includes("question")) {
      return "/settings?tab=savoir&section=faq";
    }
    if (text.includes("croissance") || text.includes("growth") || text.includes("facebook") || text.includes("marketplace")) {
      return "/settings?tab=growth&section=facebook";
    }
    if (text.includes("abonnement") || text.includes("formule") || text.includes("factur") || text.includes("billing") || text.includes("pro")) {
      return "/settings?tab=billing";
    }
    if (text.includes("parrainage") || text.includes("referral") || text.includes("invit")) {
      return "/settings?tab=referral";
    }
    if (text.includes("profil") || text.includes("compte") || text.includes("coordonn") || text.includes("sécurité")) {
      return "/settings?tab=compte&section=identity";
    }
    if (text.includes("paiement") || text.includes("wave") || text.includes("orange") || text.includes("momo") || text.includes("canal")) {
      return "/settings?tab=boutique&section=payments";
    }
    if (text.includes("livraison") || text.includes("tarif") || text.includes("zone") || text.includes("frais")) {
      return "/settings?tab=boutique&section=delivery";
    }
    if (url.includes("?tab=")) return url;
    return "/settings?tab=boutique";
  }
  return url;
}

// Icon resolver helper for quick suggestions & action tags
function getIconForSuggestion(iconName: string) {
  switch (iconName) {
    case "compass":
    case "tour":
      return <Compass size={14} className="text-cyan-400 shrink-0" />;
    case "audit":
    case "camera":
    case "sparkles":
      return <Sparkles size={14} className="text-vendeur-emerald shrink-0" />;
    case "package":
      return <Package size={14} className="text-amber-400 shrink-0" />;
    case "truck":
    case "receipt":
      return <ShoppingCart size={14} className="text-sky-400 shrink-0" />;
    case "banknote":
    case "mic":
      return <MessageCircle size={14} className="text-emerald-400 shrink-0" />;
    case "zap":
    case "crown":
      return <Zap size={14} className="text-purple-400 shrink-0" />;
    case "palette":
    case "map-pin":
      return <Settings size={14} className="text-rose-400 shrink-0" />;
    case "activity":
    case "trending-up":
      return <TrendingUp size={14} className="text-vendeur-emerald shrink-0" />;
    default:
      return <HelpCircle size={14} className="text-white/60 shrink-0" />;
  }
}

// Format message text with bold and clickable markdown links
function FormattedMessageContent({ text, onNavigate }: { text: string; onNavigate: (url: string, label?: string) => void }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);

  return (
    <div className="whitespace-pre-wrap space-y-1.5 min-w-0 break-words [overflow-wrap:anywhere]">
      {parts.map((part, idx) => {
        // Match [Label](URL)
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          const label = linkMatch[1];
          const rawUrl = linkMatch[2];
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onNavigate(rawUrl, label)}
              className="inline-flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer text-left"
            >
              <span>{label}</span>
              <ExternalLink size={11} className="inline shrink-0 opacity-70" />
            </button>
          );
        }

        // Match **Bold**
        const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
        if (boldMatch) {
          return (
            <strong key={idx} className="font-black text-white">
              {boldMatch[1]}
            </strong>
          );
        }

        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </div>
  );
}

export function CopilotWidget() {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isOpen,
    isMinimized,
    messages,
    suggestions,
    storeHealth,
    isLoading,
    isSpeaking,
    openCopilot,
    closeCopilot,
    toggleCopilot,
    setMinimized,
    setFounderModalOpen,
    runStoreAudit,
    startTour,
    fetchSuggestions,
    fetchHistory,
    sendMessage,
    clearHistory,
    speakText,
    stopSpeaking
  } = useCopilotStore();

  const [inputPrompt, setInputPrompt] = useState("");
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Initialize history and suggestions on location change
  useEffect(() => {
    fetchSuggestions(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    fetchHistory();
  }, []);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "fr-FR";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputPrompt(transcript);
          sendMessage(transcript, location.pathname);
          setIsVoiceInputActive(false);
        }
      };

      recognition.onerror = () => {
        setIsVoiceInputActive(false);
      };

      recognition.onend = () => {
        setIsVoiceInputActive(false);
      };

      setRecognitionInstance(recognition);
    }
  }, [location.pathname]);

  const toggleVoiceRecording = () => {
    if (!recognitionInstance) {
      alert("La reconnaissance vocale n'est pas supportée sur votre navigateur.");
      return;
    }

    if (isVoiceInputActive) {
      recognitionInstance.stop();
      setIsVoiceInputActive(false);
    } else {
      stopSpeaking();
      recognitionInstance.start();
      setIsVoiceInputActive(true);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;
    const text = inputPrompt;
    setInputPrompt("");

    // Quick command triggers
    if (text.toLowerCase().includes("audit") || text.toLowerCase().includes("score")) {
      runStoreAudit();
      return;
    }
    if (text.toLowerCase().includes("visite") || text.toLowerCase().includes("tour") || text.toLowerCase().includes("guider")) {
      startTour();
      return;
    }

    sendMessage(text, location.pathname);
  };

  const handleActionClick = (action: SuggestedAction) => {
    if (action.type === "navigate") {
      const targetUrl = resolveTargetRoute(action.payload, action.label);
      navigate(targetUrl);
      closeCopilot();
    } else if (action.type === "modal") {
      if (action.payload === "dispatch_founder") {
        setFounderModalOpen(true);
      } else if (action.payload === "audit") {
        runStoreAudit();
      } else if (action.payload === "tour") {
        closeCopilot();
        startTour();
      } else if (action.payload === "pack_pro") {
        closeCopilot();
        if ((window as any).openPackPro) {
          (window as any).openPackPro();
        } else {
          navigate("/offers");
        }
      } else if (action.payload === "scanner") {
        closeCopilot();
        navigate("/products?scanner=open");
      }
    }
  };

  // --- Draggable Floating Orb Button (Rock-solid transform-based drag & drop) ---
  const [orbPos, setOrbPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem("vendeur_copilot_orb_coords");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          return parsed;
        }
      }
    } catch (_) {}
    // Default initial position (bottom-right)
    return {
      x: typeof window !== "undefined" ? window.innerWidth - 72 : 300,
      y: typeof window !== "undefined" ? window.innerHeight - 84 : 500,
    };
  });

  const [isDraggingOrb, setIsDraggingOrb] = useState(false);
  const dragInfoRef = useRef({
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    hasMoved: false,
  });

  // Re-adjust if window resizes
  useEffect(() => {
    const handleResize = () => {
      setOrbPos((prev) => {
        const btnSize = 56;
        const padding = 16;
        const boundedX = Math.min(Math.max(padding, prev.x), window.innerWidth - btnSize - padding);
        const boundedY = Math.min(Math.max(padding, prev.y), window.innerHeight - btnSize - padding);
        return { x: boundedX, y: boundedY };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onOrbPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.currentTarget as HTMLElement;
    
    dragInfoRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: orbPos.x,
      originY: orbPos.y,
      hasMoved: false,
    };
    setIsDraggingOrb(true);
    target.setPointerCapture(e.pointerId);
  };

  const onOrbPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingOrb) return;
    const dx = e.clientX - dragInfoRef.current.startX;
    const dy = e.clientY - dragInfoRef.current.startY;

    if (Math.hypot(dx, dy) > 5) {
      dragInfoRef.current.hasMoved = true;
    }

    const btnSize = 56;
    const padding = 12;
    const newX = Math.min(Math.max(padding, dragInfoRef.current.originX + dx), window.innerWidth - btnSize - padding);
    const newY = Math.min(Math.max(padding, dragInfoRef.current.originY + dy), window.innerHeight - btnSize - padding);

    setOrbPos({ x: newX, y: newY });
  };

  const onOrbPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingOrb) return;
    setIsDraggingOrb(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

    if (dragInfoRef.current.hasMoved) {
      // Snap to closest edge (left or right)
      const btnSize = 56;
      const padding = 16;
      const snapRight = orbPos.x + btnSize / 2 > window.innerWidth / 2;
      const snappedX = snapRight ? window.innerWidth - btnSize - padding : padding;
      const finalCoords = { x: snappedX, y: orbPos.y };
      setOrbPos(finalCoords);
      try {
        localStorage.setItem("vendeur_copilot_orb_coords", JSON.stringify(finalCoords));
      } catch (_) {}
    }
  };

  const onOrbClick = (e: React.MouseEvent) => {
    // If user dragged, do not trigger opening
    if (dragInfoRef.current.hasMoved) {
      e.stopPropagation();
      return;
    }
    openCopilot();
  };

  const isDockedOnRight = orbPos.x + 28 > (typeof window !== "undefined" ? window.innerWidth / 2 : 400);

  return (
    <>
      <FounderContactModal />
      <StoreAuditModal />
      <SpotlightTourOverlay />

      {/* Floating Trigger Orb: Circular, Clean, 100% Precise Drag */}
      {!isOpen && (
        <div
          onPointerDown={onOrbPointerDown}
          onPointerMove={onOrbPointerMove}
          onPointerUp={onOrbPointerUp}
          onClick={onOrbClick}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            transform: `translate3d(${orbPos.x}px, ${orbPos.y}px, 0)`,
            touchAction: "none",
          }}
          className={cn(
            "fixed z-[60] select-none cursor-grab active:cursor-grabbing group",
            isDraggingOrb ? "transition-none scale-105 shadow-2xl" : "transition-transform duration-300 ease-out"
          )}
          title="Copilote Vendeur IA (Cliquez pour ouvrir, glissez pour déplacer)"
        >
          {/* Main Round Orb Button */}
          <div className="relative w-14 h-14 rounded-full bg-vendeur-coal/90 hover:bg-vendeur-coal/98 border border-white/10 hover:border-vendeur-emerald/60 text-white flex items-center justify-center shadow-[0_6px_24px_rgba(0,0,0,0.45)] hover:shadow-[0_0_26px_rgba(16,185,129,0.45)] backdrop-blur-xl transition-all duration-300">
            {/* Green Online Dot */}
            <span className="absolute top-1 right-1 w-3 h-3 bg-vendeur-emerald rounded-full ring-2 ring-vendeur-coal animate-pulse pointer-events-none" />

            {/* Logo Heartbeat Sphere */}
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-2 animate-orb-beat group-hover:bg-vendeur-emerald/10 group-hover:scale-105 transition-all duration-300 pointer-events-none">
              <Logo
                size={22}
                leftBranchColor="#ffffff"
                rightBranchColor="#10b981"
                className="animate-pulse drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300"
              />
            </div>

            {/* Smart Non-disruptive Tooltip on Hover (Always faces inward) */}
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out z-50 whitespace-nowrap bg-vendeur-coal/95 border border-white/10 text-white px-3 py-1.5 rounded-xl shadow-xl backdrop-blur-md flex flex-col",
                isDockedOnRight ? "right-[calc(100%+10px)] items-end" : "left-[calc(100%+10px)] items-start"
              )}
            >
              <span className="text-[11px] font-black uppercase tracking-wider text-vendeur-emerald flex items-center gap-1 leading-tight">
                Copilote IA <span className="text-[9px] text-white/40 font-normal">v1.0</span>
              </span>
              <span className="text-[10px] text-white/70 font-medium leading-tight">
                Cliquez pour ouvrir • Glissez
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Drawer Container */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div 
            onClick={closeCopilot}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] sm:hidden animate-in fade-in duration-200"
          />

          <div
            className={cn(
              "fixed z-[70] transition-all duration-300 ease-out flex flex-col bg-vendeur-coal/98 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden",
              isMinimized
                ? "bottom-20 right-4 sm:bottom-6 sm:right-6 w-[calc(100%-2rem)] sm:w-96 h-14 sm:h-16 rounded-2xl sm:rounded-3xl"
                : "bottom-0 left-0 right-0 sm:left-auto sm:bottom-6 sm:right-6 w-full sm:w-[450px] md:w-[480px] h-[88vh] sm:h-[680px] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl border-b-0 sm:border-b"
            )}
          >
            {/* Mobile Sheet Handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

            {/* Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 border-b border-white/10 bg-vendeur-slate/90 backdrop-blur-md select-none gap-3">
              {/* Identity & Live indicator */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-vendeur-emerald/25 to-vendeur-emerald/5 border border-vendeur-emerald/40 flex items-center justify-center p-1.5 text-vendeur-emerald shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <Logo size={20} leftBranchColor="#ffffff" rightBranchColor="#10b981" className="animate-pulse" />
                  {/* Glowing Live Dot */}
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-vendeur-coal border border-white/40"></span>
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-xs sm:text-sm tracking-wide uppercase truncate">
                      Copilote Vendeur IA
                    </h3>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                      Live
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-white/50 truncate font-medium">
                    Votre guide intelligent & proactif
                  </p>
                </div>
              </div>

              {/* Window Management Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={clearHistory}
                  title="Effacer la discussion"
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 border border-white/5 hover:border-red-500/30 flex items-center justify-center transition-all duration-200"
                >
                  <Trash2 size={14} />
                </button>

                <button
                  onClick={() => setMinimized(!isMinimized)}
                  title={isMinimized ? "Agrandir" : "Réduire"}
                  className="hidden sm:flex w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 flex items-center justify-center transition-all duration-200"
                >
                  {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>

                <button
                  onClick={closeCopilot}
                  title="Fermer"
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/5 flex items-center justify-center transition-all duration-200 active:scale-95"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Premium Quick Actions Bar */}
                <div className="px-3.5 py-2 bg-black/40 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => runStoreAudit()}
                    title="Lancer l'Audit IA et Score de Conversion"
                    className="shrink-0 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-emerald-500/30 transition-all active:scale-95 shadow-sm"
                  >
                    <Sparkles size={13} className="text-emerald-400" />
                    <span>Audit IA</span>
                  </button>

                  <button
                    onClick={() => startTour()}
                    title="Lancer la Visite Guidée 30s"
                    className="shrink-0 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-cyan-500/30 transition-all active:scale-95 shadow-sm"
                  >
                    <Compass size={13} className="text-cyan-400" />
                    <span>Visite 30s</span>
                  </button>

                  <button
                    onClick={() => setFounderModalOpen(true)}
                    title="Envoyer un message au Fondateur"
                    className="shrink-0 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 border border-amber-500/30 transition-all active:scale-95 shadow-sm"
                  >
                    <Crown size={13} className="text-amber-400" />
                    <span>Fondateur</span>
                  </button>
                </div>

                {/* Store Health Live Pill */}
                {storeHealth && (
                  <div className="px-4 py-1.5 bg-black/20 border-b border-white/5 flex items-center justify-between text-[11px] text-white/70 overflow-x-auto gap-2">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Store size={12} className="text-vendeur-emerald" />
                      <span className="font-bold text-white truncate max-w-[130px]">
                        {storeHealth.businessName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider",
                        storeHealth.whatsappStatus === "connected"
                          ? "bg-vendeur-emerald/20 text-vendeur-emerald border border-vendeur-emerald/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      )}>
                        {storeHealth.whatsappStatus === "connected" ? "WhatsApp Prêt" : "WhatsApp Off"}
                      </span>
                      <span className="text-[10px] text-white/40">
                        • {storeHealth.productCount || 0} art. • {storeHealth.pendingOrdersCount || 0} cmd(s)
                      </span>
                    </div>
                  </div>
                )}

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 scroll-smooth min-w-0">
                {messages.map((msg) => {
                  const isAssistant = msg.role === "assistant";
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2.5 sm:gap-3 max-w-[95%] sm:max-w-[92%] min-w-0",
                        isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-xs font-bold p-1",
                        isAssistant
                          ? "bg-vendeur-emerald/20 border border-vendeur-emerald/40 text-vendeur-emerald"
                          : "bg-white/10 border border-white/20 text-white"
                      )}>
                        {isAssistant ? <Logo size={16} leftBranchColor="#ffffff" rightBranchColor="#10b981" /> : "M"}
                      </div>

                      {/* Bubble with Comfortable, Highly Readable Typography */}
                      <div className={cn(
                        "rounded-2xl p-3.5 sm:p-4 text-sm sm:text-[14.5px] leading-relaxed relative group min-w-0 break-words [overflow-wrap:anywhere]",
                        isAssistant
                          ? "bg-vendeur-slate/90 border border-white/10 text-white/95 shadow-md"
                          : "bg-vendeur-emerald text-vendeur-coal font-medium shadow-md"
                      )}>
                        {/* Text Content */}
                        <FormattedMessageContent
                          text={msg.content}
                          onNavigate={(url, label) => {
                            const targetUrl = resolveTargetRoute(url, label);
                            navigate(targetUrl);
                            closeCopilot();
                          }}
                        />

                        {/* Speech output button for assistant */}
                        {isAssistant && (
                          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[11px] text-white/40">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.content)}
                              className="text-xs font-bold text-white/60 hover:text-vendeur-emerald flex items-center gap-1.5 transition-colors py-0.5 px-2 rounded-lg hover:bg-white/5"
                              title="Écouter la réponse"
                            >
                              {isSpeaking ? (
                                <>
                                  <VolumeX size={14} className="text-rose-400 animate-pulse" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 size={14} />
                                  <span>Écouter</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Interactive Suggested Action Buttons */}
                        {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                          <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                            {msg.suggestedActions.map((action, aIdx) => (
                              <button
                                key={aIdx}
                                onClick={() => handleActionClick(action)}
                                className="px-3 py-2 rounded-xl bg-vendeur-emerald/15 hover:bg-vendeur-emerald border border-vendeur-emerald/30 hover:border-vendeur-emerald text-vendeur-emerald hover:text-vendeur-coal text-xs sm:text-[13px] font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95 shrink-0 max-w-full truncate"
                              >
                                <span className="truncate">{action.label}</span>
                                <ArrowRight size={13} className="shrink-0" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex items-center gap-3 mr-auto max-w-[85%] min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-vendeur-emerald/20 border border-vendeur-emerald/40 flex items-center justify-center p-1 text-vendeur-emerald shrink-0">
                      <Logo size={16} leftBranchColor="#ffffff" rightBranchColor="#10b981" className="animate-spin" />
                    </div>
                    <div className="bg-vendeur-slate/90 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white/80 flex items-center gap-2.5 min-w-0">
                      <div className="flex gap-1.5 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-vendeur-emerald animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-vendeur-emerald animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-vendeur-emerald animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-xs sm:text-[13px] text-white/60 truncate">Le Copilote analyse votre boutique...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Bar */}
              {suggestions.length > 0 && (
                <div className="px-4 py-2.5 border-t border-white/5 bg-vendeur-slate/40 min-w-0">
                  <div className="flex items-center gap-1.5 mb-2">
                    <HelpCircle size={13} className="text-vendeur-emerald" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Suggestions 1-Clic
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => {
                          sendMessage(sug.text, location.pathname);
                        }}
                        disabled={isLoading}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-vendeur-emerald/20 border border-white/10 hover:border-vendeur-emerald/40 text-xs sm:text-[12.5px] text-white/90 hover:text-white shrink-0 flex items-center gap-2 transition-all text-left max-w-[300px] truncate"
                      >
                        {getIconForSuggestion(sug.icon)}
                        <span className="truncate">{sug.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-3.5 border-t border-white/10 bg-vendeur-slate/80 flex items-center gap-2.5 min-w-0"
              >
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  title={isVoiceInputActive ? "Arrêter l'enregistrement" : "Dicter votre question au micro"}
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all border",
                    isVoiceInputActive
                      ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                      : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  {isVoiceInputActive ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder={
                    isVoiceInputActive
                      ? "Écoute en cours, parlez..."
                      : "Posez votre question ou demandez une action..."
                  }
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm sm:text-[15px] text-white placeholder-white/40 focus:outline-none focus:border-vendeur-emerald transition-colors"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isLoading || !inputPrompt.trim()}
                  className="w-11 h-11 rounded-xl bg-vendeur-emerald text-vendeur-coal flex items-center justify-center shrink-0 hover:bg-vendeur-emerald/90 disabled:opacity-40 transition-all shadow-md shadow-vendeur-emerald/20 active:scale-95"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
        </>
      )}
    </>
  );
}

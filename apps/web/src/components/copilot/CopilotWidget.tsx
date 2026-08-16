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
      navigate(action.payload);
      // On mobile we might minimize or keep open
    } else if (action.type === "modal") {
      if (action.payload === "dispatch_founder") {
        setFounderModalOpen(true);
      } else if (action.payload === "audit") {
        runStoreAudit();
      } else if (action.payload === "tour") {
        startTour();
      } else if (action.payload === "pack_pro") {
        if ((window as any).openPackPro) {
          (window as any).openPackPro();
        } else {
          navigate("/offers");
        }
      } else if (action.payload === "scanner") {
        navigate("/products?scanner=open");
      }
    }
  };

  return (
    <>
      <FounderContactModal />
      <StoreAuditModal />
      <SpotlightTourOverlay />

      {/* Floating Trigger Orb / Button */}
      {!isOpen && (
        <button
          onClick={openCopilot}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[60] group flex items-center gap-3 bg-vendeur-coal/95 border border-vendeur-emerald/40 text-white p-2 sm:px-4 sm:py-2.5 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_28px_rgba(16,185,129,0.45)] hover:border-vendeur-emerald transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 backdrop-blur-md"
          title="Ouvrir le Copilote Vendeur IA"
        >
          <div className="relative flex items-center justify-center">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-2.5 animate-orb-beat group-hover:scale-105 transition-all duration-300">
              <Logo
                size={22}
                leftBranchColor="#ffffff"
                rightBranchColor="#10b981"
                className="animate-pulse drop-shadow-[0_0_3px_rgba(16,185,129,0.35)] group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </div>

          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-black uppercase tracking-wider text-vendeur-emerald flex items-center gap-1">
              Copilote IA <span className="text-[10px] text-white/50 font-normal">v1.0</span>
            </span>
            <span className="text-[11px] text-white/80 font-medium truncate max-w-[140px]">
              Besoin d'aide ou d'un conseil ?
            </span>
          </div>
        </button>
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
            <div className="flex items-center justify-between px-4 py-3 sm:py-3.5 border-b border-white/10 bg-vendeur-slate/80 select-none">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-vendeur-emerald/20 border border-vendeur-emerald/40 flex items-center justify-center p-1.5 text-vendeur-emerald shrink-0 shadow-inner">
                  <Logo size={18} leftBranchColor="#ffffff" rightBranchColor="#10b981" className="animate-pulse" />
                </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-xs sm:text-sm tracking-wide uppercase">
                    Copilote Vendeur IA
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-vendeur-emerald/20 text-vendeur-emerald font-bold border border-vendeur-emerald/30">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-white/50 truncate">
                  Votre guide intelligent & sans formation
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => runStoreAudit()}
                title="Lancer l'Audit IA et Score de Conversion"
                className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-500/30 transition-colors"
              >
                <Sparkles size={12} />
                <span className="hidden sm:inline">Audit</span>
              </button>

              <button
                onClick={() => startTour()}
                title="Lancer la Visite Guidée 30s"
                className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-cyan-500/30 transition-colors"
              >
                <Compass size={12} />
                <span className="hidden sm:inline">Tour</span>
              </button>

              <button
                onClick={() => setFounderModalOpen(true)}
                title="Envoyer un message au Fondateur"
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[10px] font-bold flex items-center gap-1 border border-white/5 transition-colors"
              >
                <Crown size={12} className="text-amber-400" />
                <span className="hidden sm:inline">Fondateur</span>
              </button>

              <button
                onClick={clearHistory}
                title="Effacer la discussion"
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors"
              >
                <Trash2 size={15} />
              </button>

              <button
                onClick={() => setMinimized(!isMinimized)}
                title={isMinimized ? "Agrandir" : "Réduire"}
                className="hidden sm:flex p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors items-center justify-center"
              >
                {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>

              <button
                onClick={closeCopilot}
                title="Fermer"
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Store Health Live Pill */}
              {storeHealth && (
                <div className="px-4 py-2 bg-black/40 border-b border-white/5 flex items-center justify-between text-[11px] text-white/70 overflow-x-auto gap-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Store size={12} className="text-vendeur-emerald" />
                    <span className="font-bold text-white truncate max-w-[120px]">
                      {storeHealth.businessName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                      storeHealth.whatsappStatus === "connected"
                        ? "bg-vendeur-emerald/20 text-vendeur-emerald"
                        : "bg-amber-500/20 text-amber-300"
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {messages.map((msg) => {
                  const isAssistant = msg.role === "assistant";
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-3 max-w-[92%]",
                        isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-xs font-bold p-1",
                        isAssistant
                          ? "bg-vendeur-emerald/20 border border-vendeur-emerald/40 text-vendeur-emerald"
                          : "bg-white/10 border border-white/20 text-white"
                      )}>
                        {isAssistant ? <Logo size={14} leftBranchColor="#ffffff" rightBranchColor="#10b981" /> : "M"}
                      </div>

                      {/* Bubble */}
                      <div className={cn(
                        "rounded-2xl p-3.5 text-xs sm:text-[13px] leading-relaxed relative group",
                        isAssistant
                          ? "bg-vendeur-slate/90 border border-white/10 text-white/90 shadow-md"
                          : "bg-vendeur-emerald text-vendeur-coal font-medium shadow-md"
                      )}>
                        {/* Text Content */}
                        <div className="whitespace-pre-wrap space-y-2">
                          {msg.content}
                        </div>

                        {/* Speech output button for assistant */}
                        {isAssistant && (
                          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] text-white/40">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.content)}
                              className="text-[10px] font-bold text-white/50 hover:text-vendeur-emerald flex items-center gap-1 transition-colors"
                              title="Écouter la réponse"
                            >
                              {isSpeaking ? (
                                <>
                                  <VolumeX size={12} className="text-rose-400 animate-pulse" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 size={12} />
                                  <span>Écouter</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Interactive Suggested Action Buttons */}
                        {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap gap-1.5">
                            {msg.suggestedActions.map((action, aIdx) => (
                              <button
                                key={aIdx}
                                onClick={() => handleActionClick(action)}
                                className="px-2.5 py-1.5 rounded-xl bg-vendeur-emerald/15 hover:bg-vendeur-emerald border border-vendeur-emerald/30 hover:border-vendeur-emerald text-vendeur-emerald hover:text-vendeur-coal text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                              >
                                <span>{action.label}</span>
                                <ArrowRight size={11} />
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
                  <div className="flex items-center gap-3 mr-auto max-w-[80%]">
                    <div className="w-7 h-7 rounded-xl bg-vendeur-emerald/20 border border-vendeur-emerald/40 flex items-center justify-center p-1 text-vendeur-emerald shrink-0">
                      <Logo size={14} leftBranchColor="#ffffff" rightBranchColor="#10b981" className="animate-spin" />
                    </div>
                    <div className="bg-vendeur-slate/90 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white/70 flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-vendeur-emerald animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-vendeur-emerald animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-vendeur-emerald animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-[11px] text-white/50">Le Copilote analyse votre boutique...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions Bar */}
              {suggestions.length > 0 && (
                <div className="px-4 py-2 border-t border-white/5 bg-vendeur-slate/40">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <HelpCircle size={12} className="text-vendeur-emerald" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
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
                        className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-vendeur-emerald/20 border border-white/10 hover:border-vendeur-emerald/40 text-[11px] text-white/80 hover:text-white shrink-0 flex items-center gap-1.5 transition-all text-left max-w-[280px] truncate"
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
                className="p-3 border-t border-white/10 bg-vendeur-slate/80 flex items-center gap-2"
              >
                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  title={isVoiceInputActive ? "Arrêter l'enregistrement" : "Dicter votre question au micro"}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all border",
                    isVoiceInputActive
                      ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                      : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  {isVoiceInputActive ? <MicOff size={18} /> : <Mic size={18} />}
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
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:border-vendeur-emerald transition-colors"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isLoading || !inputPrompt.trim()}
                  className="w-10 h-10 rounded-xl bg-vendeur-emerald text-vendeur-coal flex items-center justify-center shrink-0 hover:bg-vendeur-emerald/90 disabled:opacity-40 transition-all shadow-md shadow-vendeur-emerald/20 active:scale-95"
                >
                  <Send size={16} />
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

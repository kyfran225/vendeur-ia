import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  ChevronRight,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Zap,
  Globe
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { io, Socket } from "socket.io-client";
import { stripActionTags } from "@/lib/utils";
import { WhatsAppTypingIndicator } from "@/components/ui/WhatsAppTypingIndicator";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

interface Message {
  id: string;
  role: "customer" | "ai";
  text: string;
  timestamp: Date;
}

export function WebChatWidget({ merchant }: { merchant: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Session ID (Anonymous Tracking)
  useEffect(() => {
    let id = localStorage.getItem(`vendeur_session_${merchant._id}`);
    if (!id) {
      id = Math.random().toString(36).substring(7);
      localStorage.setItem(`vendeur_session_${merchant._id}`, id);
    }
    setSessionId(id);

    // Socket Connection
    if (!socketRef.current) {
      socketRef.current = io(API_URL);
      socketRef.current.emit("join_session", id);

      socketRef.current.on("message:new", (data: any) => {
        setMessages(prev => {
          // Prevent duplicates if API also returns the same message
          const exists = prev.find(m => m.text === data.text && Math.abs(new Date(m.timestamp).getTime() - new Date(data.timestamp).getTime()) < 1000);
          if (exists) return prev;

          return [...prev, {
            ...data,
            timestamp: new Date(data.timestamp)
          }];
        });
      });
    }

    // Initial Welcome Message
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "ai",
        text: `Bonjour ! Je suis l'assistant IA de **${merchant.businessName}**. Comment puis-je vous aider aujourd'hui ? ✨`,
        timestamp: new Date()
      }]);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [merchant._id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const chatMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiClient.post(`/api/commerce/web-chat/process`, {
        merchantId: merchant._id,
        sessionId,
        message: text,
        history: messages.map(m => ({ role: m.role, text: m.text }))
      });
      return res.data;
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "ai",
        text: data.reply,
        timestamp: new Date()
      }]);
    }
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "customer",
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    chatMutation.mutate(input);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-8 right-8 z-[200] h-16 w-16 bg-vendeur-emerald text-vendeur-coal rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all animate-bounce"
        >
          <div className="relative">
             <MessageCircle size={32} />
             <span className="absolute -top-1 -right-1 flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
             </span>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "fixed z-[200] bg-vendeur-coal flex flex-col overflow-hidden transition-all animate-in slide-in-from-bottom-8 duration-500",
          // Mobile: Full screen
          "inset-0 w-full h-full rounded-none",
          // Desktop: Floating bubble
          "md:inset-auto md:bottom-8 md:right-8 md:w-[400px] md:h-[600px] md:max-h-[80vh] md:rounded-[2.5rem] md:border md:border-white/10 md:shadow-2xl",
          isMinimized && "h-20 md:h-20"
        )}>
           {/* Header */}
           <header className="p-3 md:p-5 bg-vendeur-bg/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 flex items-center justify-center text-vendeur-emerald">
                    <Bot size={22} />
                 </div>
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-white">Assistant ${merchant.businessName}</h3>
                    <div className="flex items-center gap-1.5">
                       <div className="h-1.5 w-1.5 rounded-full bg-vendeur-emerald animate-pulse" />
                       <p className="text-[9px] font-black uppercase text-vendeur-emerald tracking-widest">IA en ligne</p>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-1">
                 <button
                   onClick={() => setIsMinimized(!isMinimized)}
                   className="hidden md:block p-2 text-white/20 hover:text-white transition-colors"
                 >
                    {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                 </button>
                 <button
                   onClick={toggleChat}
                   className="p-2 text-white/20 hover:text-rose-500 transition-colors"
                 >
                    <X size={18} />
                 </button>
              </div>
           </header>

           {!isMinimized && (
             <>
               {/* Messages Area */}
               <div
                 ref={scrollRef}
                 className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-6 scrollbar-hide bg-black/20"
               >
                   {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col max-w-[90%] md:max-w-[85%] animate-in slide-in-from-bottom-2 duration-300",
                        msg.role === 'customer' ? "ml-auto items-end" : "items-start"
                      )}
                    >
                       <div className={cn(
                         "px-3 py-2 md:p-4 rounded-2xl md:rounded-3xl text-sm font-medium leading-relaxed",
                         msg.role === 'customer'
                           ? "bg-vendeur-emerald text-vendeur-coal rounded-tr-none"
                           : "bg-white/5 border border-white/10 text-white rounded-tl-none"
                       )}>
                          {stripActionTags(msg.text)}
                       </div>

                       {/* Action CTA for AI responses */}
                       {msg.role === 'ai' && merchant.whatsappNumber && (
                         <div className="mt-2 flex flex-wrap gap-2">
                           <button
                             onClick={() => {
                               const cleanPhone = merchant.whatsappNumber.replace(/[^0-9]/g, "");
                               const text = encodeURIComponent(`Bonjour ${merchant.businessName}, je discute sur votre boutique en ligne et j'aimerais commander !`);
                               window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
                             }}
                             className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                           >
                             <MessageCircle size={13} className="text-emerald-400" />
                             Ouvrir WhatsApp direct
                           </button>
                         </div>
                       )}

                       <span className="text-[8px] font-black uppercase text-white/20 mt-1 tracking-widest">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <WhatsAppTypingIndicator variant="storefront" />
                  )}
               </div>

               {/* Footer / Input */}
               <footer className="p-3 md:p-6 bg-vendeur-bg/80 border-t border-white/5 space-y-3 md:space-y-4">
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 h-12 md:h-14 focus-within:border-vendeur-emerald transition-all shadow-inner">
                     <input
                       className="flex-1 bg-transparent outline-none text-sm text-white"
                       placeholder="Posez votre question..."
                       value={input}
                       onChange={e => setInput(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && handleSend()}
                     />
                     <button
                       onClick={handleSend}
                       disabled={!input.trim() || chatMutation.isPending}
                       className="h-9 w-9 md:h-10 md:w-10 bg-vendeur-emerald text-vendeur-coal rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-20 transition-all shadow-lg"
                     >
                        <Send size={18} />
                     </button>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase text-white/20 tracking-widest">
                     <ShieldCheck size={10} /> Propulsé par Vendeur IA Omnicanal
                  </div>
               </footer>
             </>
           )}
        </div>
      )}
    </>
  );
}

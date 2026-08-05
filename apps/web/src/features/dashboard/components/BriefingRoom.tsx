import React, { useState, useEffect, useRef } from "react";
import {
  Bot, Send, X, Mic, Smile, Paperclip, Check, MoreVertical,
  Camera, ChevronLeft, Sparkles, User, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as Portal from "@radix-ui/react-portal";
import { apiClient } from "@/lib/apiClient";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: "customer" | "ai";
  text: string;
  time: string;
}

export function BriefingRoom({ isOpen, onClose, businessName }: { isOpen: boolean; onClose: () => void; businessName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: "ai",
        text: `Bonjour Patron ! ✨ Je suis prêt pour mon briefing. Comment souhaitez-vous que je vende vos produits aujourd'hui ?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      role: "customer",
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    try {
      const res = await apiClient.post("/api/commerce/briefing", {
        message: currentInput,
        history: messages.slice(-5)
      });

      setMessages(prev => [...prev, {
        role: "ai",
        text: res.data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "ai",
        text: "Désolé Patron, j'ai eu un petit bug de connexion. Pouvez-vous répéter ?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal.Root>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-8 bg-[#07100d]/95 backdrop-blur-xl animate-in fade-in duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-[#0b141a] w-full max-w-[420px] h-full md:h-[85vh] md:rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden border border-white/10 ring-1 ring-white/5"
        >
          {/* Header - Simulated WhatsApp Mobile */}
          <header className="bg-[#202c33] px-4 py-4 flex items-center justify-between border-b border-white/5 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="md:hidden text-white/40 hover:text-white">
              <ChevronLeft size={24} />
            </button>
            <div className="h-11 w-11 rounded-full bg-vendeur-emerald/20 flex items-center justify-center text-vendeur-emerald border border-vendeur-emerald/30 shadow-inner">
               <Bot size={26} />
            </div>
            <div>
              <p className="text-[15px] font-bold text-white leading-tight">Mon Vendeur IA ({businessName})</p>
              <p className={cn(
                "text-[11px] font-medium transition-all duration-300",
                isTyping ? "text-vendeur-emerald italic animate-pulse" : "text-vendeur-emerald"
              )}>
                {isTyping ? "en train d'écrire..." : "en ligne (Mode Briefing)"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[#aebac1]">
            <button onClick={onClose} className="hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </header>

        {/* Info Banner */}
        <div className="bg-vendeur-emerald/10 border-b border-vendeur-emerald/20 px-4 py-2 flex items-center gap-3">
          <ShieldCheck size={14} className="text-vendeur-emerald" />
          <p className="text-[10px] font-black uppercase tracking-widest text-vendeur-emerald">Espace de formation : Instructions réelles</p>
        </div>

        {/* Chat Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a] bg-repeat no-scrollbar scroll-smooth relative"
          style={{ backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669ae5qee.png')", backgroundSize: "400px" }}
        >
          <div className="flex justify-center mb-6">
            <span className="bg-[#182229] text-[#8696a0] text-[10px] px-3 py-1.5 rounded-lg uppercase font-bold tracking-widest shadow-sm border border-white/5">Session de Briefing</span>
          </div>

          {messages.map((msg, i) => (
            <div key={i} className={cn("flex w-full", msg.role === "ai" ? "justify-start" : "justify-end")}>
              <div className={cn(
                "max-w-[85%] p-3 rounded-xl shadow-md relative",
                msg.role === "ai"
                  ? "bg-[#202c33] text-white rounded-tl-none border border-white/5"
                  : "bg-[#005c4b] text-white rounded-tr-none font-medium"
              )}>
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1 opacity-50">
                  <span className="text-[9px]">{msg.time}</span>
                  {msg.role !== "ai" && <Check size={12} className="text-[#53bdeb]" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <footer className="bg-[#202c33] p-3 flex items-center gap-2 z-20 shrink-0">
           <div className="flex items-center gap-3 text-[#aebac1] px-2">
             <Smile size={24} className="cursor-pointer hover:text-white transition-colors" />
             <Paperclip size={24} className="cursor-pointer hover:text-white transition-colors" />
           </div>
           <div className="flex-1 relative">
             <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={isTyping}
                placeholder="Donnez vos consignes..."
                className="w-full bg-[#2a3942] text-white text-[15px] rounded-xl px-4 py-3 outline-none placeholder:text-[#8696a0] shadow-inner disabled:opacity-50"
             />
           </div>
           <button
             onClick={handleSend}
             disabled={!input.trim() || isTyping}
             className={cn(
               "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl transition-all",
               input.trim() ? "bg-[#00a884] scale-110" : "bg-white/5 text-white/20"
             )}
           >
             <Send size={20} />
           </button>
        </footer>
      </motion.div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { Bot, Send, User, ChevronLeft, ShieldCheck, Sparkles } from "lucide-react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "ai";
  content: string;
  time: string;
}

export function WhatsAppSimulator({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) {
  const { draft } = useOnboardingStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getTime = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    // Initial welcome message
    setMessages([
      {
        role: "ai",
        content: `Bonjour ! Bienvenue chez ${draft.businessName}. Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?`,
        time: getTime()
      }
    ]);
  }, [draft.businessName]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Mock AI Response logic
    setTimeout(() => {
      let aiContent = "D'accord, je prépare cela pour vous.";
      const lowInput = input.toLowerCase();

      if (lowInput.includes("prix") || lowInput.includes("combien")) {
        aiContent = `Nos articles commencent à partir de 5.000 FCFA. Souhaitez-vous voir le catalogue ?`;
      } else if (lowInput.includes("payer") || lowInput.includes("commande")) {
        const channels = draft.paymentChannels.map(c => `${c.label}: ${c.number}`).join("\n");
        aiContent = `Parfait ! Vous pouvez régler via :\n${channels || "Nos canaux habituels"}\n\nEnvoyez-moi la capture du transfert une fois fait !`;
      }

      setMessages(prev => [...prev, { role: "ai", content: aiContent, time: getTime() }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="max-w-md mx-auto h-[600px] bg-[#0b141a] rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col shadow-2xl relative">
      {/* Header */}
      <div className="bg-[#202c33] p-4 flex items-center gap-3 border-b border-white/5">
        <button onClick={onBack} className="text-white/50 hover:text-white"><ChevronLeft size={20} /></button>
        <div className="h-10 w-10 rounded-full bg-vendeur-emerald/20 flex items-center justify-center border border-vendeur-emerald/30">
          <Bot size={22} className="text-vendeur-emerald" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{draft.businessName}</p>
          <p className="text-[10px] text-vendeur-emerald font-bold">Assistant IA actif</p>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[url('/assets/whatsapp-bg.png')] bg-repeat bg-[length:400px]">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] px-3 py-2 rounded-xl text-sm shadow-md",
              m.role === "user" ? "bg-[#005c4b] text-white rounded-tr-none" : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
            )}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              <p className="text-[9px] text-white/40 text-right mt-1">{m.time}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#202c33] text-vendeur-emerald text-[10px] px-3 py-1 rounded-full font-bold animate-pulse">
              En train d'écrire...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-[#202c33] p-3 flex items-center gap-2">
        <input
          className="flex-1 bg-[#2a3942] text-white rounded-xl px-4 py-2.5 text-sm outline-none placeholder:text-white/20"
          placeholder="Écrivez un message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="h-10 w-10 rounded-full bg-vendeur-emerald flex items-center justify-center text-vendeur-coal shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <Send size={18} />
        </button>
      </div>

      {/* Activation Overlay */}
      <div className="absolute bottom-20 left-4 right-4 p-6 bg-vendeur-coal/90 backdrop-blur-xl rounded-3xl border border-vendeur-emerald/30 shadow-2xl text-center z-20 animate-in zoom-in-95 duration-500">
        <Sparkles className="text-vendeur-emerald mx-auto mb-3" size={24} />
        <p className="text-sm font-bold text-white mb-1">Convaincu par votre IA ?</p>
        <p className="text-xs text-white/40 mb-6 uppercase tracking-widest font-black">Passez à la version réelle</p>
        <button
          onClick={onComplete}
          className="w-full h-12 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest rounded-xl shadow-lg shadow-vendeur-emerald/20 flex items-center justify-center gap-2"
        >
          Activer ma machine <ShieldCheck size={18} />
        </button>
      </div>
    </div>
  );
}

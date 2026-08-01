import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Search, MoreVertical, CheckCheck, ShieldCheck, Send, User, Bot, Loader2, Sparkles, X, Instagram } from "lucide-react";

// Add TikTok Icon (Lucide doesn't have it natively sometimes, using a custom or placeholder)
const TikTokIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

export function SalesInbox() {
  const { accessToken } = useAuthStore();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [typingChats, setTypingChats] = useState<Record<string, boolean>>({});
  const [manualMessage, setManualMessage] = useState("");
  const [followupData, setFollowupData] = useState<{ text: string; isOpen: boolean }>({ text: "", isOpen: false });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Conversations
  const { data: conversations, isLoading: loadingChats } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/commerce/conversations`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return res.data;
    },
    enabled: !!accessToken
  });

  // Fetch Messages for Selected Chat
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", selectedChat],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/api/commerce/conversations/${selectedChat}/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return res.data;
    },
    enabled: !!selectedChat
  });

  // Socket listener for updates
  useEffect(() => {
    if (socket) {
      socket.on("conversation:update", (data: any) => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        if (data.conversationId === selectedChat) {
          queryClient.invalidateQueries({ queryKey: ["messages", selectedChat] });
        }
      });

      socket.on("ai:typing", (data: { conversationId: string; isTyping: boolean }) => {
        setTypingChats(prev => ({ ...prev, [data.conversationId]: data.isTyping }));
      });
    }
    return () => {
      socket?.off("conversation:update");
      socket?.off("ai:typing");
    };
  }, [socket, selectedChat, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await axios.patch(`${API_URL}/api/commerce/conversations/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Statut de la conversation mis à jour.");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du statut.");
    }
  });

  const activeChatData = conversations?.find((c: any) => c._id === selectedChat);

  const toggleTakeover = () => {
    if (!selectedChat || !activeChatData) return;
    const newStatus = activeChatData.status === "needs_human" ? "active" : "needs_human";
    updateStatusMutation.mutate({ id: selectedChat, status: newStatus });
  };

  const generateFollowupMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.post(`${API_URL}/api/commerce/conversations/${id}/generate-followup`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return res.data;
    },
    onSuccess: (data) => {
      setFollowupData({ text: data.followup, isOpen: true });
    },
    onError: () => {
      toast.error("Impossible de générer la relance.");
    }
  });

  const sendManualMessageMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const res = await axios.post(`${API_URL}/api/commerce/conversations/${id}/messages`, { content: text }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return res.data;
    },
    onSuccess: () => {
      setManualMessage("");
      setFollowupData({ text: "", isOpen: false });
      toast.success("Message envoyé !");
      queryClient.invalidateQueries({ queryKey: ["messages", selectedChat] });
    },
    onError: () => {
      toast.error("Échec de l'envoi du message.");
    }
  });

  return (
    <div className="flex h-[calc(100vh-160px)] bg-vendeur-bg rounded-[2.5rem] overflow-hidden border border-white/5 animate-in fade-in duration-700">
      {/* Sidebar List */}
      <aside className="w-96 border-r border-white/5 flex flex-col bg-vendeur-coal/30">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Messages</h2>
            <div className="px-3 py-1 bg-vendeur-emerald/10 border border-vendeur-emerald/20 rounded-full">
              <span className="text-[10px] font-black text-vendeur-emerald uppercase tracking-widest">Live</span>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input className="w-full bg-vendeur-coal border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-vendeur-emerald transition-all" placeholder="Rechercher..." />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-white/20" /></div>
          ) : (
            conversations?.map((chat: any) => (
              <ChatListItem
                key={chat._id}
                name={chat.customerId?.phone || "Client"}
                lastMsg={chat.status}
                platform={chat.platform || 'whatsapp'}
                time={new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                active={selectedChat === chat._id}
                onClick={() => setSelectedChat(chat._id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-vendeur-bg">
        {selectedChat ? (
          <>
            <header className="p-6 border-b border-white/5 flex items-center justify-between bg-vendeur-bg/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-vendeur-emerald/10 flex items-center justify-center border border-vendeur-emerald/20">
                  <User className="text-vendeur-emerald" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{activeChatData?.customerId?.phone}</p>
                    {activeChatData?.customerId?.loyaltyPoints > 0 && (
                      <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        <Sparkles size={10} className="text-amber-500" />
                        <span className="text-[9px] font-black text-amber-500 uppercase">{activeChatData.customerId.loyaltyPoints} pts</span>
                      </div>
                    )}
                    {activeChatData?.customerId?.loyaltyPoints >= 50 && (
                      <span className="text-[9px] font-black bg-vendeur-emerald text-vendeur-coal px-1.5 rounded uppercase tracking-tighter">VIP</span>
                    )}
                  </div>
                  <p className="text-[10px] text-vendeur-emerald font-black uppercase tracking-widest flex items-center gap-1">
                    {activeChatData?.platform === 'instagram' && <Instagram size={10} />}
                    {activeChatData?.platform === 'tiktok' && <TikTokIcon size={10} />}
                    {(!activeChatData?.platform || activeChatData?.platform === 'whatsapp') && <MessageCircle size={10} />}
                    {activeChatData?.platform || 'WhatsApp'} • En ligne
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => selectedChat && generateFollowupMutation.mutate(selectedChat)}
                  disabled={generateFollowupMutation.isPending}
                  className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 text-sky-400 px-4 py-1.5 rounded-full hover:bg-sky-500/20 transition-all group"
                >
                  {generateFollowupMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest">Relancer IA</span>
                </button>
                <button
                  onClick={toggleTakeover}
                  disabled={updateStatusMutation.isPending}
                  className={cn(
                    "px-4 py-1.5 rounded-full flex items-center gap-2 border transition-all hover:scale-105 active:scale-95",
                    activeChatData?.status === "needs_human"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      : "bg-vendeur-emerald/10 border-vendeur-emerald/30 text-vendeur-emerald"
                  )}
                >
                  {activeChatData?.status === "needs_human" ? (
                    <>
                      <User size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Main Humaine</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">IA Active</span>
                    </>
                  )}
                </button>
                <button className="text-white/40 hover:text-white transition-colors"><MoreVertical size={20} /></button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 p-8 space-y-6 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              {loadingMessages ? (
                <div className="flex justify-center"><Loader2 className="animate-spin text-white/10" /></div>
              ) : (
                messages?.map((msg: any) => (
                  <ChatBubble
                    key={msg._id}
                    role={msg.sender}
                    text={msg.content}
                    type={msg.type}
                    mediaUrl={msg.mediaUrl}
                    time={new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  />
                ))
              )}

              {typingChats[selectedChat] && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="bg-vendeur-coal/50 border border-white/5 px-4 py-2 rounded-2xl flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-vendeur-emerald" />
                    <span className="text-[10px] font-black text-vendeur-emerald uppercase tracking-widest">L'IA prépare une réponse...</span>
                  </div>
                </div>
              )}
            </div>

            <footer className="p-6 bg-vendeur-coal/50 border-t border-white/5 relative">
              {followupData.isOpen && (
                <div className="absolute bottom-full left-6 right-6 mb-4 bg-[#0c0f0d] border border-sky-500/30 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 z-20">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={12} /> Relance IA générée
                    </span>
                    <button onClick={() => setFollowupData({ ...followupData, isOpen: false })} className="text-white/20 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-sky-500 transition-all resize-none"
                    rows={3}
                    value={followupData.text}
                    onChange={(e) => setFollowupData({ ...followupData, text: e.target.value })}
                  />
                  <div className="flex justify-end mt-3 gap-2">
                    <button
                      onClick={() => setFollowupData({ ...followupData, isOpen: false })}
                      className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => selectedChat && sendManualMessageMutation.mutate({ id: selectedChat, text: followupData.text })}
                      className="bg-sky-500 text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                    >
                      Envoyer la relance
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 bg-vendeur-coal border border-white/10 rounded-[2rem] px-6 py-4 focus-within:border-vendeur-emerald transition-all shadow-xl">
                <input
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="Répondre manuellement..."
                  value={manualMessage}
                  onChange={(e) => setManualMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && selectedChat && sendManualMessageMutation.mutate({ id: selectedChat, text: manualMessage })}
                />
                <button
                  onClick={() => selectedChat && sendManualMessageMutation.mutate({ id: selectedChat, text: manualMessage })}
                  disabled={!manualMessage}
                  className="flex items-center gap-2 text-vendeur-emerald font-black text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-20"
                >
                  <Send size={16} />
                  <span>Envoyer</span>
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-20">
            <MessageCircle size={64} className="mb-4" />
            <h3 className="text-xl font-black uppercase tracking-widest">Sélectionnez une vente</h3>
            <p className="text-sm mt-2">Cliquez sur une conversation pour commencer à vendre.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function ChatListItem({ name, lastMsg, time, unread, active, platform, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-6 flex items-center gap-4 cursor-pointer transition-all border-l-4",
        active ? "bg-vendeur-emerald/10 border-vendeur-emerald" : "hover:bg-white/[0.02] border-transparent"
      )}
    >
      <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 relative">
        <User className="text-white/20" size={20} />
        <div className="absolute -bottom-1 -right-1 bg-vendeur-bg rounded-full p-1 border border-white/10">
           {platform === 'instagram' && <Instagram size={10} className="text-pink-500" />}
           {platform === 'tiktok' && <TikTokIcon size={10} className="text-white" />}
           {(!platform || platform === 'whatsapp') && <MessageCircle size={10} className="text-vendeur-emerald" />}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-bold text-sm truncate">{name}</p>
          <p className="text-[10px] text-white/30">{time}</p>
        </div>
        <p className="text-xs text-white/40 truncate flex items-center gap-2">
          {lastMsg === "active" && <span className="h-1.5 w-1.5 rounded-full bg-vendeur-emerald animate-pulse" />}
          {lastMsg}
        </p>
      </div>
      {unread && <div className="h-5 w-5 rounded-full bg-vendeur-emerald flex items-center justify-center text-[10px] font-black text-vendeur-coal">{unread}</div>}
    </div>
  );
}

function ChatBubble({ role, text, time, type, mediaUrl }: any) {
  const isCustomer = role === "customer";
  return (
    <div className={cn("flex w-full animate-in slide-in-from-bottom-2 duration-300", isCustomer ? "justify-start" : "justify-end")}>
      <div className={cn(
        "max-w-[80%] p-4 rounded-3xl shadow-lg relative",
        isCustomer
          ? "bg-vendeur-coal border border-white/10 rounded-tl-none text-white"
          : "bg-vendeur-emerald text-vendeur-coal rounded-tr-none font-bold"
      )}>
        <div className="flex items-center gap-2 mb-1 opacity-40">
           {role === "ai" ? <Bot size={12}/> : <User size={12}/>}
           <span className="text-[9px] font-black uppercase tracking-widest">{role}</span>
        </div>

        {type === "audio" && mediaUrl ? (
          <div className="space-y-2">
            <audio src={mediaUrl} controls className="h-8 max-w-full brightness-90 contrast-125" />
            <p className="text-[10px] italic opacity-60 line-clamp-2">{text}</p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{text}</p>
        )}

        <div className="flex items-center justify-end gap-1 mt-2 opacity-50">
          <span className="text-[9px] font-bold">{time}</span>
          {!isCustomer && <CheckCheck size={12} />}
        </div>
      </div>
    </div>
  );
}

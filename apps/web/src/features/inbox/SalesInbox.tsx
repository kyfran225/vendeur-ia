import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle, Search, MoreVertical, CheckCheck, ShieldCheck,
  Send, User, Bot, Loader2, Sparkles, X, Instagram, Facebook,
  ShoppingCart, Plus, Minus, Package, ChevronLeft, Globe
} from "lucide-react";

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
import { apiClient } from "@/lib/apiClient";
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
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [typingChats, setTypingChats] = useState<Record<string, boolean>>({});
  const [manualMessage, setManualMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [followupData, setFollowupData] = useState<{ text: string; isOpen: boolean }>({ text: "", isOpen: false });
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Conversations
  const { data: conversations, isLoading: loadingChats } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/conversations");
      return res.data;
    },
    enabled: !!accessToken
  });

  // Fetch Messages for Selected Chat
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", selectedChat],
    queryFn: async () => {
      const res = await apiClient.get(`/api/commerce/conversations/${selectedChat}/messages`);
      return res.data;
    },
    enabled: !!selectedChat
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/products");
      return res.data;
    },
    enabled: isOrderModalOpen
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

      socket.on("payment:detected", (data: any) => {
        toast.success(`💰 Paiement détecté pour ${data.platform} (${data.amount} XOF) !`);
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        if (data.conversationId === selectedChat) {
          queryClient.invalidateQueries({ queryKey: ["messages", selectedChat] });
          if (data.linkResult?.matched) {
             toast.success("Commande validée automatiquement ! ✨");
          }
        }
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
      const res = await apiClient.patch(`/api/commerce/conversations/${id}/status`, { status });
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

  const filteredConversations = conversations?.filter((c: any) => {
    if (!searchQuery) return true;
    const phone = c.customerId?.phone?.toLowerCase() || "";
    return phone.includes(searchQuery.toLowerCase());
  });

  const toggleTakeover = () => {
    if (!selectedChat || !activeChatData) return;
    const newStatus = activeChatData.status === "needs_human" ? "active" : "needs_human";
    updateStatusMutation.mutate({ id: selectedChat, status: newStatus });
  };

  const generateFollowupMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/api/commerce/conversations/${id}/generate-followup`, {});
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
      const res = await apiClient.post(`/api/commerce/conversations/${id}/messages`, { content: text });
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

  const handleChatSelect = (id: string) => {
    setSelectedChat(id);
    setShowMobileChat(true);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-160px)] md:max-h-[1000px] bg-vendeur-bg md:rounded-[3rem] overflow-hidden border-0 md:border md:border-white/10 shadow-2xl animate-in fade-in duration-700 md:my-8">
      {/* Sidebar List */}
      <aside className={cn(
        "w-full md:w-96 border-r border-white/5 flex flex-col bg-vendeur-coal/30 transition-all",
        showMobileChat ? "hidden md:flex" : "flex"
      )}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Messages</h2>
            <div className="px-3 py-1 bg-vendeur-emerald/10 border border-vendeur-emerald/20 rounded-full">
              <span className="text-[10px] font-black text-vendeur-emerald uppercase tracking-widest">Live</span>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input
              className="w-full bg-vendeur-coal border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-vendeur-emerald transition-all"
              placeholder="Rechercher par numéro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-white/20" /></div>
          ) : (
            filteredConversations?.map((chat: any) => (
              <ChatListItem
                key={chat._id}
                name={chat.customerId?.phone || "Client"}
                lastMsg={chat.status}
                platform={chat.platform || 'whatsapp'}
                time={new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                active={selectedChat === chat._id}
                onClick={() => handleChatSelect(chat._id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={cn(
        "flex-1 flex flex-col relative bg-vendeur-bg transition-all",
        !showMobileChat ? "hidden md:flex" : "flex"
      )}>
        {selectedChat ? (
          <div className="flex-1 flex flex-col h-full max-w-[500px] mx-auto w-full border-x border-white/5 bg-[#0b141a] relative">
            <header className="p-4 md:p-4 border-b border-white/5 flex items-center justify-between bg-[#202c33] sticky top-0 z-30">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-2 -ml-2 text-white/40 hover:text-white"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="h-10 w-10 rounded-full bg-vendeur-emerald/10 flex items-center justify-center border border-vendeur-emerald/20 shrink-0">
                  <User className="text-vendeur-emerald" size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate">{activeChatData?.customerId?.phone}</p>
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
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-all duration-300",
                    typingChats[selectedChat] ? "text-white/40 italic animate-pulse" : "text-vendeur-emerald"
                  )}>
                    {typingChats[selectedChat] ? (
                      <>L'IA est en train d'écrire...</>
                    ) : (
                      <>
                        {activeChatData?.platform === 'instagram' && <Instagram size={10} />}
                        {activeChatData?.platform === 'facebook' && <Facebook size={10} className="text-blue-500" />}
                        {activeChatData?.platform === 'tiktok' && <TikTokIcon size={10} />}
                        {activeChatData?.platform === 'web' && <Globe size={10} className="text-sky-400" />}
                        {(!activeChatData?.platform || activeChatData?.platform === 'whatsapp') && <MessageCircle size={10} />}
                        {activeChatData?.platform || 'WhatsApp'} • En ligne
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <button
                  onClick={() => selectedChat && generateFollowupMutation.mutate(selectedChat)}
                  disabled={generateFollowupMutation.isPending}
                  className="flex items-center justify-center h-10 w-10 md:h-auto md:w-auto md:px-4 md:py-1.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-full hover:bg-sky-500/20 transition-all group"
                  title="Relancer IA"
                >
                  {generateFollowupMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
                  )}
                  <span className="hidden md:inline ml-2 text-[10px] font-black uppercase tracking-widest">Relancer IA</span>
                </button>
                <button
                  onClick={() => setIsOrderModalOpen(true)}
                  className="flex items-center justify-center h-10 w-10 md:h-auto md:w-auto md:px-4 md:py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full hover:bg-emerald-500/20 transition-all group"
                  title="Valider Commande"
                >
                  <ShoppingCart size={14} className="group-hover:scale-110 transition-transform" />
                  <span className="hidden md:inline ml-2 text-[10px] font-black uppercase tracking-widest">Vendre</span>
                </button>
                <button
                  onClick={toggleTakeover}
                  disabled={updateStatusMutation.isPending}
                  className={cn(
                    "flex items-center justify-center h-10 w-10 md:h-auto md:w-auto md:px-4 md:py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95",
                    activeChatData?.status === "needs_human"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      : "bg-vendeur-emerald/10 border-vendeur-emerald/30 text-vendeur-emerald"
                  )}
                  title={activeChatData?.status === "needs_human" ? "Main Humaine" : "IA Active"}
                >
                  {activeChatData?.status === "needs_human" ? (
                    <>
                      <User size={14} />
                      <span className="hidden md:inline ml-2 text-[10px] font-black uppercase tracking-widest">Main</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span className="hidden md:inline ml-2 text-[10px] font-black uppercase tracking-widest">IA</span>
                    </>
                  )}
                </button>
              </div>
            </header>

            <div
              ref={scrollRef}
              className="flex-1 p-4 md:p-4 space-y-4 overflow-y-auto bg-repeat opacity-95"
              style={{ backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669ae5qee.png')", backgroundSize: "400px" }}
            >
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

            <footer className="p-4 md:p-6 bg-vendeur-coal/50 border-t border-white/5 relative">
              {followupData.isOpen && (
                <div className="absolute bottom-full left-4 right-4 md:left-6 md:right-6 mb-4 bg-[#0c0f0d] border border-sky-500/30 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 z-40">
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
              <div className="flex items-center gap-3 md:gap-4 bg-vendeur-coal border border-white/10 rounded-2xl md:rounded-[2rem] px-4 py-3 md:px-6 md:py-4 focus-within:border-vendeur-emerald transition-all shadow-xl">
                <input
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="Répondre..."
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
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-20">
            <MessageCircle size={64} className="mb-4" />
            <h3 className="text-xl font-black uppercase tracking-widest">Sélectionnez une vente</h3>
            <p className="text-sm mt-2">Cliquez sur une conversation pour commencer à vendre.</p>
          </div>
        )}
      </main>

      {isOrderModalOpen && (
        <OrderCreationModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          products={products}
          customerId={activeChatData?.customerId?._id}
          conversationId={selectedChat || ""}
        />
      )}
    </div>
  );
}

function OrderCreationModal({ isOpen, onClose, products, customerId, conversationId }: any) {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const queryClient = useQueryClient();

  const totalAmount = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiClient.post("/api/commerce/orders", orderData);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Commande validée ! ✨");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      onClose();
    },
    onError: () => toast.error("Échec de la validation")
  });

  const handleAddItem = (product: any) => {
    const existing = selectedItems.find(i => i.productId === product._id);
    if (existing) {
      setSelectedItems(selectedItems.map(i =>
        i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setSelectedItems([...selectedItems, {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1
      }]);
    }
  };

  const handleRemoveItem = (productId: string) => {
    const existing = selectedItems.find(i => i.productId === productId);
    if (existing?.quantity === 1) {
      setSelectedItems(selectedItems.filter(i => i.productId !== productId));
    } else {
      setSelectedItems(selectedItems.map(i =>
        i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
      ));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-vendeur-coal border border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <header className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <ShoppingCart size={24} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Créer une Commande</h2>
              <p className="text-xs text-white/40 font-medium">Sélectionnez les produits pour conclure la vente.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 h-[500px]">
          {/* Product List */}
          <div className="p-6 border-r border-white/5 overflow-y-auto space-y-4 bg-black/20">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Catalogue</h3>
            {products.map((p: any) => (
              <button
                key={p._id}
                onClick={() => handleAddItem(p)}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/50 hover:bg-white/[0.08] transition-all text-left flex items-center gap-4 group"
              >
                {p.images?.[0] ? (
                  <img src={p.images[0]} className="h-12 w-12 rounded-xl object-cover" alt="" />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center"><Package className="text-white/20" size={20} /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate text-white group-hover:text-emerald-400">{p.name}</p>
                  <p className="text-xs font-black text-white/40">{p.price.toLocaleString()} XOF</p>
                </div>
                <Plus size={16} className="text-white/20 group-hover:text-emerald-400" />
              </button>
            ))}
          </div>

          {/* Cart & Total */}
          <div className="p-6 flex flex-col bg-vendeur-coal">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Panier</h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {selectedItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <ShoppingCart size={48} className="mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">Panier vide</p>
                </div>
              ) : (
                selectedItems.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-white/40">{item.price.toLocaleString()} XOF</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleRemoveItem(item.productId)} className="text-white/20 hover:text-rose-400"><Minus size={14} /></button>
                      <span className="text-xs font-black text-emerald-400">{item.quantity}</span>
                      <button onClick={() => handleAddItem({ _id: item.productId, name: item.name, price: item.price })} className="text-white/20 hover:text-emerald-400"><Plus size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-6 border-t border-white/10 mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total à payer</span>
                <span className="text-2xl font-black text-emerald-400">{totalAmount.toLocaleString()} XOF</span>
              </div>
              <button
                disabled={selectedItems.length === 0 || createOrderMutation.isPending}
                onClick={() => createOrderMutation.mutate({
                  customerId,
                  conversationId,
                  items: selectedItems,
                  totalAmount,
                  status: "pending"
                })}
                className="w-full h-14 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-20"
              >
                {createOrderMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <CheckCheck size={20} />}
                Valider la Vente
              </button>
            </div>
          </div>
        </div>
      </div>
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
           {platform === 'facebook' && <Facebook size={10} className="text-blue-500" />}
           {platform === 'tiktok' && <TikTokIcon size={10} className="text-white" />}
           {platform === 'web' && <Globe size={10} className="text-sky-400" />}
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
  const isPaymentDetected = text?.includes("[PREUVE DE PAIEMENT DÉTECTÉE]");

  return (
    <div className={cn("flex w-full animate-in slide-in-from-bottom-2 duration-300", isCustomer ? "justify-start" : "justify-end")}>
      <div className={cn(
        "max-w-[85%] p-3 rounded-xl shadow-md relative",
        isCustomer
          ? "bg-[#202c33] border border-white/5 rounded-tl-none text-white"
          : "bg-[#005c4b] text-white rounded-tr-none font-medium",
        isPaymentDetected && "ring-4 ring-amber-500/50 border-amber-500 bg-amber-900/20"
      )}>
        {isPaymentDetected && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-amber-500 text-black rounded-lg text-[10px] font-black uppercase">
            <ShieldCheck size={12} /> Paiement à valider
          </div>
        )}

        {type === "audio" && mediaUrl ? (
          <div className="space-y-2">
            <audio src={mediaUrl} controls className="h-8 max-w-full brightness-90 contrast-125" />
            <p className="text-[10px] italic opacity-60 line-clamp-2">{text}</p>
          </div>
        ) : (
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{text}</p>
        )}

        <div className="flex items-center justify-end gap-1 mt-1 opacity-50">
          <span className="text-[9px] font-bold">{time}</span>
          {!isCustomer && (
            <div className="flex -space-x-1">
              <CheckCheck size={12} className="text-[#53bdeb]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

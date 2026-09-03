import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  MessageCircle, Search, MoreVertical, CheckCheck, ShieldCheck,
  Send, User, Bot, Loader2, Sparkles, X, Instagram, Facebook,
  ShoppingCart, Plus, Minus, Package, ChevronLeft, Globe, CreditCard,
  PauseCircle, PlayCircle, Volume2, VolumeX, Bell, BellOff,
  Copy, Check, Phone, RefreshCw, Zap, Image as ImageIcon,
  Mic, Paperclip, Clock, AlertTriangle, ArrowDown, ArrowLeft,
  Smile, FileText, Reply
} from "lucide-react";

// TikTok Icon component
const TikTokIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useSocket } from "@/hooks/useSocket";
import { useMerchantCurrency } from "@/hooks/useMerchantCurrency";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { stripActionTags } from "@/lib/utils";

import { useMerchant } from "@/hooks/useMerchant";
import { VendeurIALoader } from "@/components/ui/VendeurIALoader";
import { WhatsAppTypingIndicator } from "@/components/ui/WhatsAppTypingIndicator";
import { OrderCreationModal } from "@/features/orders/OrderCreationModal";
import { FastPayModal } from "./FastPayModal";
import { VoiceRecorder } from "./components/VoiceRecorder";
import { CustomerAvatar } from "./components/CustomerAvatar";
import { CustomerProfileModal } from "./components/CustomerProfileModal";
import { PauseConfirmationModal } from "@/components/modals/PauseConfirmationModal";
import { NewChatModal } from "./components/NewChatModal";
import { EmojiPickerPopover } from "./components/EmojiPickerPopover";
import { MediaUploaderModal } from "./components/MediaUploaderModal";
import { MediaLightboxModal } from "./components/MediaLightboxModal";
import { AudioVoicePlayer } from "./components/AudioVoicePlayer";
import { formatDisplayPhone } from "@/features/onboarding/components/CountrySelector";
import {
  playWhatsAppIncomingChime,
  playMessageSentPop,
  requestDesktopNotificationPermission,
  sendDesktopNotification,
  getSoundPreference,
  setSoundPreference
} from "@/lib/sound";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatCustomerDisplayName(
  customer?: { name?: string; phone?: string },
  merchantName?: string,
  userDisplayName?: string
): string {
  if (!customer) return "Client";

  const rawName = customer.name?.trim() || "";
  const phone = customer.phone || "";

  // Check if name is a numeric fragment like "25", "2", "225" or was mistakenly set to merchant's / user's name
  const isNumericFragment = /^\d{1,4}$/.test(rawName);
  const isCorrupted = rawName && (
    isNumericFragment ||
    (merchantName && rawName.toLowerCase() === merchantName.trim().toLowerCase()) ||
    (userDisplayName && rawName.toLowerCase() === userDisplayName.trim().toLowerCase()) ||
    rawName.includes("Co-Fondateur") ||
    (rawName.toLowerCase().includes("franck") && !phone.includes("5111157")) ||
    rawName.toLowerCase() === "vendeur ia"
  );

  if (rawName && !isCorrupted) return rawName;

  if (phone.includes("@lid")) {
    const rawDigits = phone.replace(/@lid/g, "").replace(/\D/g, "");
    const shortId = rawDigits.length > 6 ? rawDigits.slice(-6) : rawDigits;
    return `Client #${shortId}`;
  }

  // Format international African phone numbers nicely with automatic CI 8-to-10 digit operator restoration (01/05/07)
  const formatted = formatDisplayPhone(phone, "CI");
  return formatted || "Client";
}

function formatMessageTime(dateStr?: string | Date): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (isYesterday) {
    return "Hier";
  }
  return d.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
}

export function SalesInbox() {
  const { accessToken, user } = useAuthStore();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatFromUrl = searchParams.get("chat");
  const [selectedChat, setSelectedChat] = useState<string | null>(chatFromUrl || null);
  const [showMobileChat, setShowMobileChat] = useState(Boolean(chatFromUrl));
  const [manualMessage, setManualMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "ai" | "human">("all");
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(getSoundPreference());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const [followupData, setFollowupData] = useState<{ text: string; isOpen: boolean }>({ text: "", isOpen: false });
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isFastPayModalOpen, setIsFastPayModalOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<File | null>(null);
  const [isMediaUploaderOpen, setIsMediaUploaderOpen] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; caption?: string; senderName?: string; timestamp?: string | Date } | null>(null);
  const [quotedMessage, setQuotedMessage] = useState<{ id: string; content: string; sender: string; type?: string; mediaUrl?: string } | null>(null);
  const [unreadCountBelow, setUnreadCountBelow] = useState<number>(0);
  const [isNearBottom, setIsNearBottom] = useState<boolean>(true);
  const [onlineSessions, setOnlineSessions] = useState<Set<string>>(new Set());
  const [hasCopiedPhone, setHasCopiedPhone] = useState(false);
  const [typingMap, setTypingMap] = useState<Record<string, { isTyping: boolean; participant: "customer" | "ai" | "human"; lastUpdated: number }>>({});
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-cleanup stale typing presence indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingMap(prev => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (next[key].isTyping && now - next[key].lastUpdated > 5000) {
            next[key] = { ...next[key], isTyping: false };
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Conversations
  const { data: conversations, isLoading: loadingChats, refetch: refetchConvs } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/conversations");
      return res.data;
    },
    enabled: !!accessToken,
    refetchInterval: 15000 // Regular fallback poll
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

  const merchant = useMerchant();
  const merchantCurrency = useMerchantCurrency();
  const vipThreshold = merchant?.loyaltySettings?.threshold || 50;

  // Toggle Sound Preference
  const handleToggleSound = () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    setSoundPreference(next);
    if (next) {
      playWhatsAppIncomingChime();
      toast.success("Sonnerie WhatsApp activée 🔔");
    } else {
      toast.info("Sonnerie désactivée 🔕");
    }
  };

  // Request Desktop Notification
  const handleEnableNotifications = async () => {
    const perm = await requestDesktopNotificationPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      toast.success("Notifications de bureau autorisées ! Vous recevrez des alertes pour chaque message.");
      sendDesktopNotification({
        title: "✅ Vendeur IA Notifications Activées",
        body: "Vous serez alerté en direct pour chaque message client comme sur WhatsApp !",
        tag: "vendeur-ia-welcome"
      });
    } else {
      toast.error("Notifications bloquées par le navigateur. Veuillez les autoriser dans les paramètres du site.");
    }
  };

  // Synchronize URL search params with active chat
  useEffect(() => {
    if (chatFromUrl && chatFromUrl !== selectedChat) {
      setSelectedChat(chatFromUrl);
      setShowMobileChat(true);
      markReadMutation.mutate(chatFromUrl);
    }
  }, [chatFromUrl]);

  // Handle messages from Service Worker for instant navigation
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "NAVIGATE_TO" && event.data.url) {
        try {
          const parsed = new URL(event.data.url, window.location.origin);
          const chatId = parsed.searchParams.get("chat");
          if (chatId) {
            handleChatSelect(chatId);
          }
        } catch (err) {
          console.warn("[Inbox] SW navigation URL parse failed:", err);
        }
      }
    };
    navigator.serviceWorker.addEventListener("message", handleSwMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleSwMessage);
    };
  }, []);

  // Real-time socket events
  useEffect(() => {
    if (!socket) return;

    // Incoming conversation update (customer or outbound message)
    const handleConvUpdate = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      if (data.conversationId === selectedChat) {
        queryClient.invalidateQueries({ queryKey: ["messages", selectedChat] });
      }

      // If message is from customer, alert the admin with the WhatsApp incoming sound chime
      if (data.message?.sender === "customer") {
        playWhatsAppIncomingChime();
      }
    };

    // Generic notification event (ignoring duplicate conversation messages)
    const handleNotificationNew = (data: any) => {
      // If this is a conversation message, skip duplicate alert since handleConvUpdate already handled it
      if (data.data?.conversationId) return;

      playWhatsAppIncomingChime();
      if (data.title && typeof document !== "undefined" && document.hidden) {
        sendDesktopNotification({
          title: data.title,
          body: data.body || "",
          tag: data.data?.reference ? `payment-${data.data.reference}` : "vendeur-ia-system",
          onClick: () => {
            window.focus();
            if (data.data?.url) {
              window.location.href = data.data.url;
            }
          }
        });
      }
    };

    const handlePaymentDetected = (data: any) => {
      playWhatsAppIncomingChime();
      toast.success(`💰 Paiement détecté (${data.amount} ${data.currency || merchantCurrency}) !`);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (data.conversationId === selectedChat) {
        queryClient.invalidateQueries({ queryKey: ["messages", selectedChat] });
      }
    };

    const handleSessionStatus = (data: { sessionId: string; status: "online" | "offline" }) => {
      setOnlineSessions(prev => {
        const next = new Set(prev);
        if (data.status === "online") next.add(data.sessionId);
        else next.delete(data.sessionId);
        return next;
      });
    };

    // Real-time typing presence listener
    const handleTypingStatus = (data: { conversationId: string; isTyping: boolean; participant?: "customer" | "ai" | "human" }) => {
      if (!data?.conversationId) return;
      setTypingMap(prev => ({
        ...prev,
        [data.conversationId]: {
          isTyping: data.isTyping,
          participant: data.participant || "customer",
          lastUpdated: Date.now()
        }
      }));
    };

    // Real-time message status updates (sent / delivered / read)
    const handleMessageStatusUpdate = (data: {
      messageId?: string;
      conversationId: string;
      whatsappMessageId?: string;
      status: "pending" | "sent" | "delivered" | "read";
      deliveredAt?: Date;
      readAt?: Date;
    }) => {
      if (data.conversationId === selectedChat) {
        queryClient.setQueryData(["messages", selectedChat], (old: any[] | undefined) => {
          if (!old) return old;
          return old.map(m => {
            if ((data.messageId && m._id === data.messageId) || (data.whatsappMessageId && m.whatsappMessageId === data.whatsappMessageId)) {
              return { ...m, status: data.status, deliveredAt: data.deliveredAt || m.deliveredAt, readAt: data.readAt || m.readAt };
            }
            return m;
          });
        });
      }
    };

    // Real-time conversation read synchronization
    const handleConversationRead = (data: { conversationId: string; unreadCount: number }) => {
      queryClient.setQueryData(["conversations"], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map(c => c._id === data.conversationId ? { ...c, unreadCount: 0 } : c);
      });
    };

    socket.on("conversation:update", handleConvUpdate);
    socket.on("notification:new", handleNotificationNew);
    socket.on("payment:detected", handlePaymentDetected);
    socket.on("session:status", handleSessionStatus);
    socket.on("conversation:typing", handleTypingStatus);
    socket.on("message:status_update", handleMessageStatusUpdate);
    socket.on("conversation:read", handleConversationRead);

    return () => {
      socket.off("conversation:update", handleConvUpdate);
      socket.off("notification:new", handleNotificationNew);
      socket.off("payment:detected", handlePaymentDetected);
      socket.off("session:status", handleSessionStatus);
      socket.off("conversation:typing", handleTypingStatus);
      socket.off("message:status_update", handleMessageStatusUpdate);
      socket.off("conversation:read", handleConversationRead);
    };
  }, [socket, selectedChat, queryClient, merchantCurrency]);

  // Calculate unread totals & sync dynamic tab title
  const totalUnreadCount = useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return 0;
    return conversations.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (totalUnreadCount > 0) {
      document.title = `(${totalUnreadCount}) 💬 Vendeur IA • WhatsApp Pro`;
    } else {
      document.title = "Vendeur IA • WhatsApp Admin";
    }
  }, [totalUnreadCount]);

  // Smart Scroll Engine & distance calculation
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceToBottom < 100;
    setIsNearBottom(nearBottom);
    if (nearBottom) {
      setUnreadCountBelow(0);
    }
  };

  const scrollToBottom = (smooth = true) => {
    if (scrollRef.current) {
      if (smooth) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      } else {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      setIsNearBottom(true);
      setUnreadCountBelow(0);
    }
  };

  // Auto-scroll when messages update based on scroll position
  useEffect(() => {
    if (!scrollRef.current) return;
    if (isNearBottom) {
      scrollToBottom(false);
    } else {
      setUnreadCountBelow(prev => prev + 1);
    }
  }, [messages]);

  // Reset scroll and unread count on chat change
  useEffect(() => {
    if (selectedChat) {
      setIsNearBottom(true);
      setUnreadCountBelow(0);
      setQuotedMessage(null);
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [selectedChat]);

  // Mark conversation read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/api/commerce/conversations/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.patch(`/api/commerce/conversations/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Mode de conversation mis à jour.");
    },
    onError: () => {
      toast.error("Erreur lors du changement de mode.");
    }
  });

  const resumeGlobalSalesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch("/api/commerce/ai-settings", { autoReply: true });
      return res.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["dashboard"] });
      const previousDashboard = queryClient.getQueryData(["dashboard"]);
      queryClient.setQueryData(["dashboard"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          merchant: {
            ...old.merchant,
            aiSettings: {
              ...old.merchant?.aiSettings,
              autoReply: true
            }
          }
        };
      });
      return { previousDashboard };
    },
    onSuccess: (data) => {
      toast.success("Vendeur IA réactivé ! Ventes 24h/24 en cours. 🚀");
      queryClient.setQueryData(["dashboard"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          merchant: {
            ...old.merchant,
            ...(data || {}),
            aiSettings: {
              ...old.merchant?.aiSettings,
              ...(data?.aiSettings || {}),
              autoReply: true
            }
          }
        };
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (_err, _variables, context) => {
      if (context?.previousDashboard) {
        queryClient.setQueryData(["dashboard"], context.previousDashboard);
      }
      toast.error("Échec de la réactivation de l'IA.");
    }
  });

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
    mutationFn: async ({ id, text, quotedMessageId }: { id: string; text: string; quotedMessageId?: string }) => {
      const res = await apiClient.post(`/api/commerce/conversations/${id}/messages`, {
        content: text,
        quotedMessageId
      });
      return res.data;
    },
    onSuccess: (data: any) => {
      if (data?.deliveryError) {
        toast.error(`⚠️ Non remis sur WhatsApp : ${data.deliveryError}`);
      } else {
        playMessageSentPop();
      }
      setManualMessage("");
      setQuotedMessage(null);
      setFollowupData({ text: "", isOpen: false });
      queryClient.invalidateQueries({ queryKey: ["messages", selectedChat] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      scrollToBottom(true);
    },
    onError: () => {
      toast.error("Échec de l'envoi du message.");
    }
  });

  const handleChatSelect = (id: string) => {
    setSelectedChat(id);
    setShowMobileChat(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("chat", id);
      return next;
    }, { replace: true });
    markReadMutation.mutate(id);
  };

  const handleCopyPhone = (phone?: string) => {
    if (!phone) return;
    const clean = phone.replace(/@s\.whatsapp\.net/, "").replace(/\D/g, "");
    navigator.clipboard.writeText(clean);
    setHasCopiedPhone(true);
    toast.success(`Numéro ${clean} copié !`);
    setTimeout(() => setHasCopiedPhone(false), 2000);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setManualMessage(e.target.value);
    if (!socket || !selectedChat) return;

    if (!typingTimeoutRef.current) {
      socket.emit("typing:start", { conversationId: selectedChat, participant: "human" });
    } else {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socket && selectedChat) {
        socket.emit("typing:stop", { conversationId: selectedChat, participant: "human" });
      }
      typingTimeoutRef.current = null;
    }, 2500);
  };

  const handleSendMessage = () => {
    if (!selectedChat || !manualMessage.trim()) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (socket && selectedChat) {
      socket.emit("typing:stop", { conversationId: selectedChat, participant: "human" });
    }
    sendManualMessageMutation.mutate({
      id: selectedChat,
      text: manualMessage.trim(),
      quotedMessageId: quotedMessage?.id
    });
  };

  const handleSelectEmoji = (emoji: string) => {
    setManualMessage((prev) => prev + emoji);
    setIsEmojiPickerOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFileForUpload(e.target.files[0]);
      setIsMediaUploaderOpen(true);
      e.target.value = "";
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith("image/") || file.type.startsWith("application/pdf")) {
        e.preventDefault();
        setSelectedFileForUpload(file);
        setIsMediaUploaderOpen(true);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFileForUpload(e.dataTransfer.files[0]);
      setIsMediaUploaderOpen(true);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!selectedChat) return;
    try {
      await apiClient.post(`/api/commerce/conversations/${selectedChat}/reactions`, {
        messageId,
        emoji
      });
      queryClient.invalidateQueries({ queryKey: ["messages", selectedChat] });
    } catch (err) {
      console.warn("[Reaction Error]:", err);
    }
  };

  const activeChatData = conversations?.find((c: any) => c._id === selectedChat);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];
    return conversations.filter((c: any) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const phone = (c.customerId?.phone || "").toLowerCase();
        const name = (c.customerId?.name || "").toLowerCase();
        const lastMsg = (c.lastMessage?.content || "").toLowerCase();
        const matches = phone.includes(q) || name.includes(q) || lastMsg.includes(q);
        if (!matches) return false;
      }

      // 2. Filter Tab
      if (filterTab === "unread") return (c.unreadCount || 0) > 0;
      if (filterTab === "ai") return c.status !== "needs_human";
      if (filterTab === "human") return c.status === "needs_human";

      return true;
    });
  }, [conversations, searchQuery, filterTab]);

  const toggleTakeover = () => {
    if (!selectedChat || !activeChatData) return;
    const newStatus = activeChatData.status === "needs_human" ? "active" : "needs_human";
    updateStatusMutation.mutate({ id: selectedChat, status: newStatus });
  };

  return (
    <div
      id="tour-inbox-channels"
      className={cn(
        "flex bg-[#111b21] transition-all duration-300 animate-in fade-in h-full w-full min-h-0 flex-1 overflow-hidden",
        showMobileChat
          ? "fixed inset-0 z-[60] h-[100dvh] w-full rounded-none border-0 m-0 overflow-hidden md:relative md:inset-auto md:z-auto md:h-full md:rounded-2xl md:border md:border-white/10 md:shadow-2xl"
          : "rounded-2xl border border-white/10 shadow-2xl"
      )}
    >
      {/* ========================================================================= */}
      {/* SIDEBAR: CONVERSATIONS LIST (WhatsApp Web Pro Style) */}
      {/* ========================================================================= */}
      <aside className={cn(
        "w-full md:w-[380px] lg:w-[420px] border-r border-white/10 flex flex-col bg-[#111b21] transition-all shrink-0 h-full min-h-0 overflow-hidden",
        showMobileChat ? "hidden md:flex" : "flex"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 bg-[#202c33] border-b border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/dashboard"
                className="hidden md:flex p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all items-center justify-center shrink-0"
                title="Quitter le plein écran et retourner au Tableau de bord"
              >
                <ArrowLeft size={16} />
              </Link>
              <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-full bg-vendeur-emerald/20 border border-vendeur-emerald/40 flex items-center justify-center font-black text-vendeur-emerald">
                  {merchant?.businessName ? merchant.businessName.charAt(0).toUpperCase() : "V"}
                </div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#202c33]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-black text-white truncate">{merchant?.businessName || "WhatsApp Pro"}</h2>
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase rounded">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-white/50 truncate flex items-center gap-1">
                  <Phone size={10} className="text-emerald-400" />
                  <span>{merchant?.whatsappNumber || "Système Vendeur IA"}</span>
                </p>
              </div>
            </div>

            {/* Header Controls: Sound, Desktop Notif, Refresh */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleSound}
                className={cn(
                  "p-2 rounded-xl border transition-all cursor-pointer",
                  isSoundEnabled
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                )}
                title={isSoundEnabled ? "Sonnerie WhatsApp active (Cliquer pour couper)" : "Sonnerie coupée (Cliquer pour activer)"}
              >
                {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {notifPermission !== "granted" && (
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 transition-all cursor-pointer animate-pulse"
                  title="Autoriser les notifications de bureau"
                >
                  <Bell size={16} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(true)}
                className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 hover:text-white transition-all cursor-pointer shadow-sm"
                title="Nouvelle discussion (Démarrer avec un numéro WhatsApp)"
              >
                <Plus size={16} />
              </button>

              <button
                type="button"
                onClick={() => refetchConvs()}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="Actualiser les messages"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              className="w-full bg-[#111b21] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-white/30 outline-none focus:border-emerald-500 transition-all"
              placeholder="Rechercher nom, numéro ou mot-clé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setFilterTab("all")}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer shrink-0",
                filterTab === "all"
                  ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              Tous ({conversations?.length || 0})
            </button>

            <button
              onClick={() => setFilterTab("unread")}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
                filterTab === "unread"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <span>Non lus</span>
              {totalUnreadCount > 0 && (
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                  filterTab === "unread" ? "bg-white text-rose-600" : "bg-rose-500 text-white"
                )}>
                  {totalUnreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterTab("ai")}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1",
                filterTab === "ai"
                  ? "bg-vendeur-emerald text-black"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <Bot size={12} />
              <span>IA 24/7</span>
            </button>

            <button
              onClick={() => setFilterTab("human")}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1",
                filterTab === "human"
                  ? "bg-sky-500 text-black"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <User size={12} />
              <span>Manuel</span>
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {loadingChats ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <VendeurIALoader size="md" label="Chargement de vos échanges WhatsApp..." />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-white/40 space-y-2">
              <MessageCircle size={36} className="opacity-30" />
              <p className="text-xs font-bold">Aucune conversation trouvée</p>
              <p className="text-[11px] text-white/30">
                {filterTab === "unread" ? "Toutes vos conversations ont été lues !" : "Les messages WhatsApp apparaîtront ici dès réception."}
              </p>
            </div>
          ) : (
            filteredConversations.map((chat: any) => {
              const displayName = formatCustomerDisplayName(chat.customerId, merchant?.businessName, user?.displayName);
              const isActive = selectedChat === chat._id;
              const hasUnread = (chat.unreadCount || 0) > 0;
              const isHumanTakeover = chat.status === "needs_human";
              const lastSnippet = chat.lastMessage?.content || (chat.status === "needs_human" ? "Contrôle manuel" : "Discussion active");

              return (
                <div
                  key={chat._id}
                  onClick={() => handleChatSelect(chat._id)}
                  className={cn(
                    "p-3.5 flex items-center gap-3 cursor-pointer transition-all border-l-4 relative group",
                    isActive
                      ? "bg-[#2a3942] border-emerald-500"
                      : hasUnread
                      ? "bg-[#182229] border-emerald-400 hover:bg-[#202c33]"
                      : "border-transparent hover:bg-[#202c33]/70"
                  )}
                >
                  {/* Contact Avatar with WhatsApp Profile Picture */}
                  <CustomerAvatar
                    name={displayName}
                    phone={chat.customerId?.phone}
                    avatarUrl={chat.customerId?.avatarUrl}
                    platform={chat.platform || "whatsapp"}
                    size="lg"
                    showPlatformBadge={true}
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className={cn(
                          "text-xs truncate",
                          hasUnread ? "font-black text-white" : "font-bold text-white/90"
                        )}>
                          {displayName}
                        </p>
                        {chat.customerId?.loyaltyPoints >= vipThreshold && (
                          <span className="text-[8px] font-black bg-emerald-500 text-black px-1 rounded uppercase tracking-tighter shrink-0">
                            VIP
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-[10px] shrink-0",
                        hasUnread ? "text-emerald-400 font-bold" : "text-white/40"
                      )}>
                        {formatMessageTime(chat.lastMessageAt || chat.updatedAt)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {typingMap[chat._id]?.isTyping ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold animate-pulse truncate min-w-0">
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                            <span className="italic text-[11px] font-semibold">
                              {typingMap[chat._id]?.participant === "ai" ? "Vendeur IA répond..." : "En train d'écrire..."}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-white/60 truncate min-w-0">
                          {chat.lastMessage?.sender === "human" && (
                            <span className="text-sky-400 font-bold shrink-0">Admin: </span>
                          )}
                          {chat.lastMessage?.sender === "ai" && (
                            <span className="text-emerald-400 font-bold shrink-0">IA: </span>
                          )}
                          {chat.lastMessage?.type === "audio" && <Mic size={11} className="text-sky-400 shrink-0" />}
                          {chat.lastMessage?.type === "image" && <ImageIcon size={11} className="text-amber-400 shrink-0" />}
                          <span className="truncate">{stripActionTags(lastSnippet)}</span>
                        </div>
                      )}

                      {/* Unread badge or Takeover Pill */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isHumanTakeover && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[9px] font-bold uppercase">
                            Manuel
                          </span>
                        )}
                        {hasUnread && (
                          <span className="h-5 min-w-5 px-1.5 rounded-full bg-emerald-500 text-black text-[10px] font-black flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CHAT AREA (WhatsApp Web Pro Admin Chat) */}
      {/* ========================================================================= */}
      <main className={cn(
        "flex-1 flex flex-col relative bg-[#0b141a] transition-all min-w-0 overflow-x-hidden",
        !showMobileChat ? "hidden md:flex" : "flex"
      )}>
        {selectedChat ? (
          <div className="flex-1 flex flex-col h-full w-full bg-[#0b141a] relative min-w-0 overflow-x-hidden">
            {/* WhatsApp Chat Header: Tier 1 - Customer Info & Live Mode Indicator */}
            <header className="px-3 py-2.5 sm:px-5 sm:py-3 bg-[#202c33] border-b border-white/10 flex items-center justify-between sticky top-0 z-30 gap-3 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] md:pt-3">
              {/* Left Column: Back Button + Avatar + Customer Name & Phone */}
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="md:hidden p-1.5 -ml-1 text-white/70 hover:text-white shrink-0 cursor-pointer rounded-lg hover:bg-white/5 active:scale-95 transition-all"
                  aria-label="Retour"
                >
                  <ChevronLeft size={22} />
                </button>

                <CustomerAvatar
                  name={formatCustomerDisplayName(activeChatData?.customerId, merchant?.businessName, user?.displayName)}
                  phone={activeChatData?.customerId?.phone}
                  avatarUrl={activeChatData?.customerId?.avatarUrl}
                  platform={activeChatData?.platform || "whatsapp"}
                  size="md"
                  showPlatformBadge={false}
                  onClick={() => setIsProfileModalOpen(true)}
                  className="cursor-pointer shadow-inner hover:ring-2 hover:ring-emerald-400/50 rounded-full transition-all"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-bold sm:font-black text-sm sm:text-base text-white truncate">
                      {formatCustomerDisplayName(activeChatData?.customerId, merchant?.businessName, user?.displayName)}
                    </p>
                    {activeChatData?.customerId?.loyaltyPoints >= vipThreshold && (
                      <span className="text-[8px] sm:text-[9px] font-black bg-emerald-500 text-black px-1.5 py-0.5 rounded uppercase shrink-0">
                        VIP
                      </span>
                    )}
                  </div>

                  {selectedChat && typingMap[selectedChat]?.isTyping ? (
                    <WhatsAppTypingIndicator
                      variant="header"
                      label={
                        typingMap[selectedChat]?.participant === "ai"
                          ? "Vendeur IA prépare sa réponse..."
                          : `${formatCustomerDisplayName(activeChatData?.customerId, merchant?.businessName, user?.displayName)} est en train d'écrire`
                      }
                      className="mt-0.5"
                    />
                  ) : (
                    <div className="text-[11px] sm:text-xs text-white/60 flex items-center gap-1.5 font-medium mt-0.5">
                      <Phone size={11} className="text-emerald-400 shrink-0" />
                      <span className="truncate">{formatDisplayPhone(activeChatData?.customerId?.phone, "CI") || "WhatsApp Direct"}</span>
                      {activeChatData?.customerId?.phone && (
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(activeChatData.customerId.phone)}
                          className="text-white/40 hover:text-emerald-400 p-0.5 rounded hover:bg-white/5 transition-colors shrink-0"
                          title="Copier le numéro"
                        >
                          {hasCopiedPhone ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Active Status Badge Indicator */}
              <div className="shrink-0 flex items-center gap-2">
                <div className={cn(
                  "px-2.5 py-1 rounded-full border flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold tracking-tight shadow-sm",
                  activeChatData?.status === "needs_human"
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                    : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                )}>
                  <span className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    activeChatData?.status === "needs_human" ? "bg-rose-400 animate-pulse" : "bg-emerald-400 animate-pulse"
                  )} />
                  <span className="hidden xs:inline">
                    {activeChatData?.status === "needs_human" ? "Mode Manuel" : "IA 24/7 Active"}
                  </span>
                  <span className="xs:hidden">
                    {activeChatData?.status === "needs_human" ? "Manuel" : "IA 24/7"}
                  </span>
                </div>
              </div>
            </header>

            {/* Chat Action Toolbar: Tier 2 - Action Buttons Sub-bar */}
            <div className="bg-[#182229] border-b border-white/10 px-3 py-2 sm:px-4 sm:py-2 flex items-center justify-between sm:justify-start gap-2 overflow-x-auto no-scrollbar sticky top-[57px] sm:top-[65px] z-20">
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* AI Follow-up Relance */}
                <button
                  type="button"
                  onClick={() => selectedChat && generateFollowupMutation.mutate(selectedChat)}
                  disabled={generateFollowupMutation.isPending}
                  className="flex items-center justify-center h-8 sm:h-8.5 px-2.5 sm:px-3 bg-sky-500/15 border border-sky-500/30 text-sky-300 rounded-xl hover:bg-sky-500/25 hover:text-white transition-all active:scale-95 cursor-pointer font-bold text-[11px] sm:text-xs shrink-0"
                  title="Générer une relance intelligente par l'IA"
                >
                  {generateFollowupMutation.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  <span className="ml-1.5">Relance IA</span>
                </button>

                {/* Fast Pay Payment Link */}
                <button
                  type="button"
                  onClick={() => setIsFastPayModalOpen(true)}
                  className="flex items-center justify-center h-8 sm:h-8.5 px-2.5 sm:px-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-xl hover:bg-amber-500/25 hover:text-white transition-all active:scale-95 cursor-pointer font-bold text-[11px] sm:text-xs shrink-0"
                  title="Générer et envoyer un lien de paiement Mobile Money"
                >
                  <CreditCard size={13} />
                  <span className="ml-1.5">Fast Pay</span>
                </button>

                {/* Create Order */}
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(true)}
                  className="flex items-center justify-center h-8 sm:h-8.5 px-3 sm:px-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl transition-all active:scale-95 cursor-pointer text-[11px] sm:text-xs shadow-md shadow-emerald-500/20 shrink-0"
                  title="Créer une commande pour ce client"
                >
                  <ShoppingCart size={13} />
                  <span className="ml-1.5">Vendre</span>
                </button>
              </div>

              {/* IA vs Human Takeover Button */}
              <button
                type="button"
                onClick={toggleTakeover}
                disabled={updateStatusMutation.isPending}
                className={cn(
                  "flex items-center justify-center h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-xl border font-bold text-[11px] sm:text-xs transition-all active:scale-95 cursor-pointer shrink-0 ml-auto sm:ml-auto",
                  activeChatData?.status === "needs_human"
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                )}
                title={activeChatData?.status === "needs_human" ? "Mode Manuel actif (Cliquer pour réactiver l'IA)" : "IA 24/7 active (Cliquer pour prendre la main manuellement)"}
              >
                {activeChatData?.status === "needs_human" ? (
                  <>
                    <User size={13} />
                    <span className="ml-1.5">Réactiver IA</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={13} />
                    <span className="ml-1.5">Prendre la main</span>
                  </>
                )}
              </button>
            </div>

            {/* Global Pause Notification Banner */}
            {merchant?.aiSettings?.autoReply === false && (
              <div className="bg-sky-500/15 border-b border-sky-500/30 px-4 py-2 flex items-center justify-between text-xs text-sky-200 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <PauseCircle size={15} className="text-sky-400 shrink-0" />
                  <span className="text-xs font-semibold">
                    Vendeur IA en pause générale (Toutes vos ventes WhatsApp sont gérées manuellement).
                  </span>
                </div>
                <button
                  onClick={() => resumeGlobalSalesMutation.mutate()}
                  disabled={resumeGlobalSalesMutation.isPending}
                  className="text-[10px] font-black uppercase text-black bg-sky-400 hover:bg-sky-300 px-3 py-1 rounded-lg transition-all active:scale-95 cursor-pointer shrink-0 ml-2"
                >
                  {resumeGlobalSalesMutation.isPending ? "..." : "Reprendre 24/7"}
                </button>
              </div>
            )}

            {/* Chat Messages Body with WhatsApp Wallpaper & Smart Scroll */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex-1 p-3 md:p-6 space-y-4 overflow-y-auto bg-[#0b141a] bg-repeat opacity-95 relative"
              style={{
                backgroundImage: "url('https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669ae5qee.png')",
                backgroundSize: "420px"
              }}
            >
              {loadingMessages ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <VendeurIALoader size="md" label="Chargement des échanges..." />
                </div>
              ) : messages?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-white/40 space-y-2">
                  <MessageCircle size={48} className="opacity-30" />
                  <p className="text-sm font-bold">Aucun message pour l'instant</p>
                  <p className="text-xs text-white/30">Envoyez le premier message à ce client ou déposez un fichier.</p>
                </div>
              ) : (
                <>
                  {messages?.map((msg: any) => (
                    <WhatsAppBubble
                      key={msg._id}
                      msg={msg}
                      onImageClick={(url, caption) => setLightboxMedia({
                        url,
                        caption,
                        senderName: msg.sender === "customer" ? formatCustomerDisplayName(activeChatData?.customerId, merchant?.businessName, user?.displayName) : "Boutique",
                        timestamp: msg.timestamp
                      })}
                      onReplyClick={(m) => {
                        setQuotedMessage({
                          id: m._id,
                          content: m.content,
                          sender: m.sender,
                          type: m.type,
                          mediaUrl: m.mediaUrl
                        });
                        if (inputRef.current) inputRef.current.focus();
                      }}
                      onReaction={(emoji) => handleReaction(msg._id, emoji)}
                    />
                  ))}

                  {/* Real-time Dynamic Typing Bubble */}
                  {selectedChat && typingMap[selectedChat]?.isTyping && (
                    <WhatsAppTypingIndicator
                      variant="bubble"
                      label={
                        typingMap[selectedChat]?.participant === "ai"
                          ? "Le Vendeur IA compose sa réponse..."
                          : undefined
                      }
                    />
                  )}
                </>
              )}
            </div>

            {/* Smart Scroll Floating Pill Button (Nouveaux messages) */}
            {(!isNearBottom || unreadCountBelow > 0) && (
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-24 right-6 z-20 px-3.5 py-2 rounded-full bg-[#202c33] border border-[#00a884]/40 text-white text-xs font-bold shadow-2xl flex items-center gap-2 hover:bg-[#2a3942] active:scale-95 transition-all animate-in fade-in slide-in-from-bottom-2 cursor-pointer"
              >
                <ArrowDown size={14} className="text-[#00a884] animate-bounce" />
                <span>
                  {unreadCountBelow > 0
                    ? `${unreadCountBelow} nouveau${unreadCountBelow > 1 ? "x" : ""} message${unreadCountBelow > 1 ? "s" : ""}`
                    : "Descendre"}
                </span>
                {unreadCountBelow > 0 && (
                  <span className="h-5 min-w-5 px-1.5 rounded-full bg-[#00a884] text-[#111b21] text-[10px] font-black flex items-center justify-center">
                    {unreadCountBelow}
                  </span>
                )}
              </button>
            )}

            {/* AI Follow-up Preview Box */}
            {followupData.isOpen && (
              <div className="p-3 bg-[#182229] border-t border-sky-500/30 animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5">
                    <Sparkles size={13} />
                    Proposition de relance IA :
                  </span>
                  <button onClick={() => setFollowupData({ ...followupData, isOpen: false })} className="text-white/40 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
                <textarea
                  className="w-full bg-[#111b21] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-sky-500 transition-all resize-none"
                  rows={2}
                  value={followupData.text}
                  onChange={(e) => setFollowupData({ ...followupData, text: e.target.value })}
                />
                <div className="flex justify-end mt-2 gap-2">
                  <button
                    onClick={() => setFollowupData({ ...followupData, isOpen: false })}
                    className="px-3 py-1.5 text-xs font-bold text-white/40 hover:text-white"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => selectedChat && sendManualMessageMutation.mutate({ id: selectedChat, text: followupData.text, quotedMessageId: quotedMessage?.id })}
                    disabled={sendManualMessageMutation.isPending}
                    className="bg-sky-500 text-black px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-sky-400 active:scale-95 transition-all cursor-pointer"
                  >
                    {sendManualMessageMutation.isPending ? "Envoi..." : "Envoyer cette relance"}
                  </button>
                </div>
              </div>
            )}

            {/* Quoted Message Preview Banner (WhatsApp Style) */}
            {quotedMessage && (
              <div className="px-4 py-2 bg-[#202c33] border-t border-[#2a3942] flex items-center justify-between animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-1 self-stretch rounded-full bg-[#00a884]" />
                  <div className="text-xs overflow-hidden">
                    <div className="font-bold text-[#00a884] flex items-center gap-1">
                      <Reply size={12} />
                      <span>{quotedMessage.sender === "customer" ? "Répondre au client" : "Répondre à soi-même"}</span>
                    </div>
                    <div className="text-[#8696a0] truncate max-w-md">
                      {stripActionTags(quotedMessage.content)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuotedMessage(null)}
                  className="p-1 rounded-full text-[#8696a0] hover:text-white hover:bg-white/10"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* WhatsApp Chat Footer Input */}
            <footer className="p-2.5 md:p-3.5 bg-[#202c33] border-t border-white/10 space-y-2 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:pb-3.5 relative">
              {/* Quick Template Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                <button
                  type="button"
                  onClick={() => setIsFastPayModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-300 flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <CreditCard size={11} />
                  <span>💰 FastPay Wave/OM</span>
                </button>
                <button
                  type="button"
                  onClick={() => setManualMessage("Bonjour ! Merci de nous préciser votre commune ou quartier de livraison pour lancer l'expédition.")}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white/70 hover:text-white shrink-0 cursor-pointer"
                >
                  📍 Demander Adresse
                </button>
                <button
                  type="button"
                  onClick={() => setManualMessage("Votre commande a bien été enregistrée et transmise à notre livreur. Vous serez contacté sous peu ! ✨")}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white/70 hover:text-white shrink-0 cursor-pointer"
                >
                  📦 Confirmation Commande
                </button>
              </div>

              {/* Input Row */}
              <div className="flex items-center gap-2 relative">
                {/* Emoji Picker Button */}
                <button
                  type="button"
                  onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                  className={cn(
                    "p-2 rounded-xl border transition-all cursor-pointer shrink-0",
                    isEmojiPickerOpen
                      ? "bg-[#00a884]/20 border-[#00a884] text-[#00a884]"
                      : "bg-[#2a3942] border-white/5 text-[#8696a0] hover:text-white"
                  )}
                  title="Insérer un émoji"
                >
                  <Smile size={18} />
                </button>

                {/* Emoji Popover */}
                <EmojiPickerPopover
                  isOpen={isEmojiPickerOpen}
                  onClose={() => setIsEmojiPickerOpen(false)}
                  onSelectEmoji={handleSelectEmoji}
                />

                {/* File Attachment Button (Hidden file input) */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl bg-[#2a3942] border border-white/5 text-[#8696a0] hover:text-white transition-all cursor-pointer shrink-0"
                  title="Envoyer une photo ou document"
                >
                  <Paperclip size={18} />
                </button>

                {/* Voice Recorder button */}
                {selectedChat && (
                  <VoiceRecorder conversationId={selectedChat} />
                )}

                {/* Textarea Input */}
                <div className="flex-1 bg-[#2a3942] rounded-2xl px-3 py-2 border border-white/5 focus-within:border-[#00a884] transition-all flex items-center min-h-[42px]">
                  <textarea
                    ref={inputRef}
                    className="w-full bg-transparent outline-none text-xs sm:text-sm text-white resize-none max-h-24 no-scrollbar placeholder:text-white/40 leading-relaxed"
                    placeholder="Écrivez votre message WhatsApp (Entrée pour envoyer, Maj+Entrée nouvelle ligne)..."
                    rows={1}
                    value={manualMessage}
                    onChange={handleTextareaChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!manualMessage.trim() || sendManualMessageMutation.isPending}
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer",
                    manualMessage.trim()
                      ? "bg-[#00a884] text-[#111b21] hover:scale-105 active:scale-95 shadow-lg shadow-[#00a884]/25 font-bold"
                      : "bg-white/5 text-white/20 cursor-not-allowed"
                  )}
                  title="Envoyer le message"
                >
                  {sendManualMessageMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} className="ml-0.5" />
                  )}
                </button>
              </div>
            </footer>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="h-20 w-20 rounded-full bg-[#00a884]/10 border border-[#00a884]/20 flex items-center justify-center text-[#00a884]">
              <MessageCircle size={40} />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-black text-white">WhatsApp Vendeur IA • Inbox Pro</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Sélectionnez une discussion à gauche ou cliquez sur <span className="text-[#00a884] font-bold">+</span> pour démarrer une nouvelle conversation directe avec un numéro WhatsApp.
              </p>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(true)}
                className="mt-2 px-4 py-2 rounded-xl bg-[#00a884] text-[#111b21] font-bold text-xs hover:bg-[#00a884]/90 transition-all inline-flex items-center gap-1.5 shadow-lg shadow-[#00a884]/20"
              >
                <Plus size={15} />
                <span>Nouvelle discussion</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* New Direct Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onChatCreated={(newChatId) => {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          handleChatSelect(newChatId);
        }}
      />

      {/* Media Uploader Modal */}
      {selectedFileForUpload && selectedChat && (
        <MediaUploaderModal
          isOpen={isMediaUploaderOpen}
          onClose={() => {
            setIsMediaUploaderOpen(false);
            setSelectedFileForUpload(null);
          }}
          file={selectedFileForUpload}
          conversationId={selectedChat}
          quotedMessageId={quotedMessage?.id}
          onMediaSent={() => {
            queryClient.invalidateQueries({ queryKey: ["messages", selectedChat] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            scrollToBottom(true);
          }}
        />
      )}

      {/* Media HD Lightbox Modal */}
      <MediaLightboxModal
        isOpen={Boolean(lightboxMedia)}
        onClose={() => setLightboxMedia(null)}
        imageUrl={lightboxMedia?.url || null}
        caption={lightboxMedia?.caption}
        senderName={lightboxMedia?.senderName}
        timestamp={lightboxMedia?.timestamp}
      />

      {/* Order Creation Modal */}
      {isOrderModalOpen && (
        <OrderCreationModal
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          customerId={activeChatData?.customerId?._id}
          customerPhone={activeChatData?.customerId?.phone}
          initialDeliveryAddress={activeChatData?.customerId?.location || ""}
          conversationId={selectedChat || ""}
        />
      )}

      {/* FastPay Modal */}
      {isFastPayModalOpen && selectedChat && (
        <FastPayModal
          isOpen={isFastPayModalOpen}
          onClose={() => setIsFastPayModalOpen(false)}
          conversationId={selectedChat}
          customerName={formatCustomerDisplayName(activeChatData?.customerId, merchant?.businessName, user?.displayName)}
          customerPhone={activeChatData?.customerId?.phone}
          customerAvatarUrl={activeChatData?.customerId?.avatarUrl}
          customerPlatform={activeChatData?.platform || "whatsapp"}
        />
      )}

      {/* Pause Mode Modal */}
      <PauseConfirmationModal
        isOpen={isPauseModalOpen}
        onClose={() => setIsPauseModalOpen(false)}
      />

      {/* Customer Profile & Avatar Lightbox Modal */}
      <CustomerProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        conversationId={selectedChat || undefined}
        customer={activeChatData?.customerId}
        merchantName={merchant?.businessName}
        onOpenOrderModal={() => setIsOrderModalOpen(true)}
        onOpenFastPayModal={() => setIsFastPayModalOpen(true)}
        onTriggerFollowup={() => selectedChat && generateFollowupMutation.mutate(selectedChat)}
      />
    </div>
  );
}

// =========================================================================
// WHATSAPP BUBBLE COMPONENT (With Quotes, Media, Vocals & Reactions)
// =========================================================================
function WhatsAppBubble({
  msg,
  onImageClick,
  onReplyClick,
  onReaction
}: {
  msg: any;
  onImageClick?: (url: string, caption?: string) => void;
  onReplyClick?: (msg: any) => void;
  onReaction?: (emoji: string) => void;
}) {
  const isCustomer = msg.sender === "customer";
  const isHuman = msg.sender === "human";
  const isAI = msg.sender === "ai";

  const isPaymentValidated = msg.content?.includes("[PAIEMENT VALIDÉ AUTOMATIQUEMENT") || msg.content?.includes("[PAIEMENT SHIELD VALIDÉ");
  const isPaymentFlagged = msg.content?.includes("[PREUVE SUSPECTE") || msg.content?.includes("[PREUVE DE PAIEMENT DÉTECTÉE]");
  const isFraudAlert = msg.content?.includes("[ALERTE SHIELD FRAUDE");
  const isVoiceMessage = msg.type === "audio" || msg.content?.includes("[Message Vocal]");
  const isDocument = msg.type === "document" || msg.type === "file";
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const [copied, setCopied] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(stripActionTags(msg.content));
    setCopied(true);
    toast.success("Message copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥"];

  return (
    <div className={cn(
      "flex w-full animate-in slide-in-from-bottom-2 duration-200 group relative select-text",
      isCustomer ? "justify-start" : "justify-end"
    )}>
      {/* Mini Hover Reactions Toolbar */}
      <div className={cn(
        "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-10 bg-[#202c33] border border-[#2a3942] rounded-full px-2 py-1 shadow-lg",
        isCustomer ? "left-full ml-2" : "right-full mr-2"
      )}>
        {REACTION_EMOJIS.map((em) => (
          <button
            key={em}
            type="button"
            onClick={() => onReaction?.(em)}
            className="hover:scale-125 transition-transform text-sm p-0.5 cursor-pointer"
          >
            {em}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onReplyClick?.(msg)}
          className="text-[#8696a0] hover:text-white p-1 hover:bg-white/5 rounded-full ml-1"
          title="Citer / Répondre"
        >
          <Reply size={13} />
        </button>
      </div>

      <div className={cn(
        "max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl shadow-md relative break-words overflow-hidden min-w-[120px]",
        isCustomer
          ? "bg-[#202c33] text-white rounded-tl-none border border-white/5"
          : isHuman
          ? "bg-[#005c4b] text-white rounded-tr-none font-medium border border-emerald-500/20"
          : "bg-[#005c4b] text-white rounded-tr-none font-medium border border-emerald-400/30",
        isPaymentValidated && "ring-2 ring-emerald-400 border-emerald-400 bg-emerald-950/80",
        isPaymentFlagged && "ring-2 ring-amber-400 border-amber-400 bg-amber-950/80",
        isFraudAlert && "ring-2 ring-rose-500 border-rose-500 bg-rose-950/90"
      )}>
        {/* Sender Role Badge */}
        {!isCustomer && (
          <div className="flex items-center justify-between gap-2 mb-1 opacity-80 text-[10px]">
            <span className={cn(
              "font-black uppercase tracking-wider flex items-center gap-1",
              isHuman ? "text-sky-300" : "text-emerald-300"
            )}>
              {isHuman ? <User size={10} /> : <Bot size={10} />}
              {isHuman ? "Admin (Manuel)" : "Vendeur IA"}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onReplyClick?.(msg)}
                className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity cursor-pointer"
                title="Citer"
              >
                <Reply size={11} />
              </button>
              <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity cursor-pointer"
                title="Copier le texte"
              >
                {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              </button>
            </div>
          </div>
        )}

        {/* Quoted Message Display Inside Bubble */}
        {msg.quotedMessage && (
          <div className="mb-2 p-2 rounded-xl bg-black/30 border-l-4 border-[#00a884] text-xs space-y-0.5">
            <div className="font-bold text-[#00a884] text-[11px]">
              {msg.quotedMessage.sender === "customer" ? "Client" : "Boutique"}
            </div>
            <div className="text-white/70 line-clamp-2 text-[11px]">
              {stripActionTags(msg.quotedMessage.content)}
            </div>
          </div>
        )}

        {/* Shield OCR Payment Result Card */}
        {isPaymentValidated && (
          <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 bg-emerald-500 text-black rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg">
            <CheckCheck size={14} />
            <span>Paiement Validé par Shield OCR 💰</span>
          </div>
        )}

        {isPaymentFlagged && (
          <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 bg-amber-500 text-black rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg">
            <ShieldCheck size={14} />
            <span>Preuve Suspecte à Vérifier ⚠️</span>
          </div>
        )}

        {isFraudAlert && (
          <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg">
            <AlertTriangle size={14} />
            <span>Alerte Fausse Preuve / Fraude 🚨</span>
          </div>
        )}

        {/* Audio / Voice Note Player */}
        {isVoiceMessage && (
          <div className="mb-1.5">
            <AudioVoicePlayer
              audioUrl={msg.mediaUrl}
              isSender={!isCustomer}
            />
          </div>
        )}

        {/* Image Attachment with Lightbox */}
        {msg.type === "image" && msg.mediaUrl && (
          <div
            className="mb-2 rounded-xl overflow-hidden cursor-pointer group/img relative"
            onClick={() => onImageClick?.(msg.mediaUrl, msg.content !== "[Image]" ? msg.content : undefined)}
          >
            <img
              src={msg.mediaUrl}
              alt="Photo"
              className="max-h-64 rounded-xl object-cover hover:scale-105 transition-transform"
            />
          </div>
        )}

        {/* Document / PDF Attachment */}
        {isDocument && msg.mediaUrl && (
          <a
            href={msg.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 p-3 rounded-xl bg-black/30 border border-white/10 flex items-center gap-3 hover:bg-black/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[#00a884]/20 text-[#00a884] flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {msg.mediaMetadata?.fileName || "Document PDF"}
              </div>
              <div className="text-[10px] text-white/50">
                {msg.mediaMetadata?.fileSize ? `${(msg.mediaMetadata.fileSize / 1024).toFixed(1)} KB` : "Télécharger"}
              </div>
            </div>
          </a>
        )}

        {/* Text Message Content */}
        {msg.content && msg.content !== "[Image]" && (
          <p className="text-[13px] sm:text-[14px] leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere select-text">
            {isVoiceMessage
              ? msg.content?.replace(/^\[Message Vocal\]:\s*/, "")
              : stripActionTags(msg.content)}
          </p>
        )}

        {/* Message Reactions Badges */}
        {msg.reactions && msg.reactions.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {msg.reactions.map((r: any, idx: number) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-xs flex items-center gap-1 shadow-sm"
              >
                <span>{r.emoji}</span>
              </span>
            ))}
          </div>
        )}

        {/* Bubble Timestamp & Read Receipt Status Coche */}
        <div className="flex items-center justify-end gap-1 mt-1 opacity-75 select-none">
          <span className="text-[10px] font-medium text-white/70">{time}</span>
          {!isCustomer && (
            <span
              className="inline-flex items-center ml-0.5"
              title={
                msg.status === "read"
                  ? `Lu par le destinataire ${msg.readAt ? `(${new Date(msg.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : '✓✓'}`
                  : msg.status === "delivered"
                  ? "Distribué sur l'appareil du destinataire ✓✓"
                  : msg.status === "pending"
                  ? "En cours d'envoi... ⏳"
                  : "Envoyé aux serveurs ✓"
              }
            >
              {msg.status === "pending" ? (
                <Clock size={11} className="text-white/40 animate-pulse" />
              ) : msg.status === "delivered" ? (
                <CheckCheck size={13} className="text-white/50" />
              ) : msg.status === "read" ? (
                <CheckCheck size={13} className="text-[#53bdeb] drop-shadow-[0_0_4px_rgba(83,189,235,0.6)]" />
              ) : (
                <Check size={13} className="text-white/50" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

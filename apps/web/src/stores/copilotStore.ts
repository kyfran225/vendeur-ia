import { create } from "zustand";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

export interface SuggestedAction {
  type: "navigate" | "modal" | "action" | "founder_alert";
  label: string;
  payload: string;
}

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  suggestedActions?: SuggestedAction[];
  pageRoute?: string;
  createdAt: string;
}

export interface SuggestionChip {
  text: string;
  category: string;
  icon: string;
}

export interface StoreHealthSummary {
  businessName: string;
  whatsappStatus: string;
  productCount: number;
  pendingOrdersCount: number;
  plan: string;
}

export interface StoreAuditResult {
  score: number;
  grade: string;
  summaryTitle: string;
  badgeColor: "emerald" | "amber" | "rose" | "blue";
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  tipCount: number;
  issues: Array<{
    id: string;
    category: "catalog" | "payment" | "delivery" | "branding" | "whatsapp";
    severity: "critical" | "warning" | "tip";
    title: string;
    description: string;
    impact: string;
    actionType: "navigate" | "fix" | "modal";
    actionPayload: string;
    actionLabel: string;
    pointsLost: number;
  }>;
  storeStats: {
    productsCount: number;
    ordersCount: number;
    isWhatsAppConnected: boolean;
    paymentChannelsCount: number;
    deliveryFeesCount: number;
  };
  auditedAt: string;
}

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  route: string;
  icon: string;
}

interface CopilotState {
  isOpen: boolean;
  isMinimized: boolean;
  isFounderModalOpen: boolean;
  isAuditModalOpen: boolean;
  auditData: StoreAuditResult | null;
  isAuditLoading: boolean;

  // Spotlight Tour
  isTourActive: boolean;
  tourStepIndex: number;

  messages: CopilotMessage[];
  suggestions: SuggestionChip[];
  storeHealth: StoreHealthSummary | null;
  isLoading: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  currentSpeechText: string | null;

  // Actions
  openCopilot: () => void;
  closeCopilot: () => void;
  toggleCopilot: () => void;
  setMinimized: (minimized: boolean) => void;
  setFounderModalOpen: (open: boolean) => void;
  setAuditModalOpen: (open: boolean) => void;
  runStoreAudit: () => Promise<StoreAuditResult | null>;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: () => void;

  fetchSuggestions: (pageRoute?: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
  sendMessage: (text: string, pageRoute?: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  dispatchToFounder: (data: {
    subject: string;
    message: string;
    category?: string;
    priority?: string;
    pageRoute?: string;
  }) => Promise<boolean>;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
}

export const useCopilotStore = create<CopilotState>((set, get) => ({
  isOpen: false,
  isMinimized: false,
  isFounderModalOpen: false,
  isAuditModalOpen: false,
  auditData: null,
  isAuditLoading: false,

  isTourActive: false,
  tourStepIndex: 0,

  messages: [
    {
      id: "welcome-1",
      role: "assistant",
      content: "Bonjour et bienvenue sur **Vendeur IA** ! 🚀\n\nJe suis votre **Copilote IA dédié**. Mon rôle est de vous guider à chaque instant pour piloter votre boutique, encaisser vos clients et automatiser vos ventes sur WhatsApp & Réseaux Sociaux, **sans aucun besoin de formation**.\n\nComment puis-je vous aider aujourd'hui ?",
      createdAt: new Date().toISOString(),
      suggestedActions: [
        { type: "navigate", label: "📸 Voir le Catalogue", payload: "/products" },
        { type: "navigate", label: "📦 Suivre les Commandes", payload: "/orders" },
        { type: "navigate", label: "💬 Boîte de Réception", payload: "/inbox" }
      ]
    }
  ],
  suggestions: [],
  storeHealth: null,
  isLoading: false,
  isListening: false,
  isSpeaking: false,
  currentSpeechText: null,

  openCopilot: () => {
    set({ isOpen: true, isMinimized: false });
  },

  closeCopilot: () => {
    get().stopSpeaking();
    set({ isOpen: false });
  },

  toggleCopilot: () => {
    const nextState = !get().isOpen;
    if (!nextState) get().stopSpeaking();
    set({ isOpen: nextState, isMinimized: false });
  },

  setMinimized: (isMinimized) => set({ isMinimized }),

  setFounderModalOpen: (isFounderModalOpen) => set({ isFounderModalOpen }),
  setAuditModalOpen: (isAuditModalOpen) => set({ isAuditModalOpen }),

  runStoreAudit: async () => {
    set({ isAuditLoading: true });
    try {
      const res = await apiClient.get("/api/copilot/audit");
      const audit: StoreAuditResult = res.data;
      set({ auditData: audit, isAuditModalOpen: true });
      return audit;
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de l'audit de la boutique");
      return null;
    } finally {
      set({ isAuditLoading: false });
    }
  },

  startTour: () => {
    set({ isTourActive: true, tourStepIndex: 0, isOpen: false });
  },

  nextTourStep: () => {
    set((state) => ({ tourStepIndex: state.tourStepIndex + 1 }));
  },

  prevTourStep: () => {
    set((state) => ({ tourStepIndex: Math.max(0, state.tourStepIndex - 1) }));
  },

  endTour: () => {
    set({ isTourActive: false, tourStepIndex: 0 });
    toast.success("Visite guidée terminée avec succès ! 🌟");
  },

  fetchSuggestions: async (pageRoute = window.location.pathname) => {
    try {
      const res = await apiClient.get(`/api/copilot/suggestions?pageRoute=${encodeURIComponent(pageRoute)}`);
      if (res.data?.suggestions) {
        set({ 
          suggestions: res.data.suggestions,
          storeHealth: res.data.storeHealth || null
        });
      }
    } catch (err) {
      console.warn("[Copilot] Suggestions fetch error:", err);
    }
  },

  fetchHistory: async () => {
    try {
      const res = await apiClient.get("/api/copilot/history?limit=25");
      if (res.data?.history && Array.isArray(res.data.history) && res.data.history.length > 0) {
        const mappedMessages: CopilotMessage[] = res.data.history.map((m: any, idx: number) => ({
          id: m._id || `hist-${idx}`,
          role: m.role,
          content: m.content,
          suggestedActions: m.suggestedActions || [],
          pageRoute: m.pageRoute,
          createdAt: m.createdAt || new Date().toISOString()
        }));
        set({ messages: mappedMessages });
      }
    } catch (err) {
      console.warn("[Copilot] History fetch error:", err);
    }
  },

  sendMessage: async (text: string, pageRoute = window.location.pathname) => {
    if (!text.trim() || get().isLoading) return;

    const userMessage: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      pageRoute,
      createdAt: new Date().toISOString()
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true
    }));

    try {
      const res = await apiClient.post("/api/copilot/chat", {
        message: text.trim(),
        pageRoute
      });

      const assistantMessage: CopilotMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.data.message || "Je suis à votre disposition !",
        suggestedActions: res.data.actions || [],
        pageRoute,
        createdAt: new Date().toISOString()
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
        storeHealth: res.data.storeHealthSummary || state.storeHealth
      }));

      if (res.data.founderAlertSent) {
        toast.success("Votre note a été transmise directement aux fondateurs !", { duration: 5000 });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || "Désolé, une erreur est survenue lors de l'échange.";
      const errorBubble: CopilotMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ ${errMsg}\n\nVous pouvez réessayer ou cliquer ci-dessous pour transmettre un message direct aux fondateurs.`,
        suggestedActions: [
          { type: "modal", label: "📨 Écrire aux Fondateurs", payload: "dispatch_founder" }
        ],
        pageRoute,
        createdAt: new Date().toISOString()
      };

      set((state) => ({
        messages: [...state.messages, errorBubble],
        isLoading: false
      }));
    }
  },

  clearHistory: async () => {
    try {
      await apiClient.delete("/api/copilot/history");
      set({
        messages: [
          {
            id: `welcome-${Date.now()}`,
            role: "assistant",
            content: "Conversation réinitialisée ✨ ! Comment puis-je vous guider sur votre boutique Vendeur IA ?",
            createdAt: new Date().toISOString()
          }
        ]
      });
      toast.success("Historique du Copilote réinitialisé");
    } catch (err: any) {
      toast.error("Impossible d'effacer l'historique");
    }
  },

  dispatchToFounder: async (data) => {
    try {
      await apiClient.post("/api/copilot/dispatch-founder", {
        ...data,
        pageRoute: data.pageRoute || window.location.pathname
      });
      toast.success("Message transmis avec succès au Lead & Fondateurs ! ✅");
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Erreur lors de la transmission aux fondateurs");
      return false;
    }
  },

  speakText: (text: string) => {
    if (!("speechSynthesis" in window)) {
      toast.info("La synthèse vocale n'est pas supportée sur ce navigateur.");
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown characters for pleasant speech
    const cleanSpeech = text
      .replace(/\[\[.*?\]\]/g, "")
      .replace(/[#*`_~]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .trim();

    if (!cleanSpeech) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = "fr-FR";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => set({ isSpeaking: true, currentSpeechText: cleanSpeech });
    utterance.onend = () => set({ isSpeaking: false, currentSpeechText: null });
    utterance.onerror = () => set({ isSpeaking: false, currentSpeechText: null });

    window.speechSynthesis.speak(utterance);
  },

  stopSpeaking: () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    set({ isSpeaking: false, currentSpeechText: null });
  }
}));

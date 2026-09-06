import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "./useSocket";
import { playWhatsAppIncomingChime, sendDesktopNotification } from "@/lib/sound";
import { playPaymentNotificationChime } from "@/lib/audioUtils";
import { toast } from "sonner";

export function useGlobalNotifications() {
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // Listen to Service Worker messages (e.g. user clicked a push notification in background)
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "NAVIGATE_TO" && event.data.url) {
        try {
          const parsed = new URL(event.data.url, window.location.origin);
          const routePath = parsed.pathname + parsed.search + parsed.hash;
          navigate(routePath);
        } catch {
          navigate(event.data.url);
        }
      }
    };

    navigator.serviceWorker.addEventListener("message", handleSwMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleSwMessage);
    };
  }, [navigate]);

  // Global socket listener for real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data: any) => {
      const notifData = data?.data || {};
      const conversationId = notifData.conversationId;
      const messageId = notifData.messageId;

      const targetUrl = notifData.url || (conversationId
        ? (messageId ? `/inbox?chat=${conversationId}&messageId=${messageId}` : `/inbox?chat=${conversationId}`)
        : "/inbox");

      const isInbox = location.pathname.startsWith("/inbox");
      const currentSearchParams = new URLSearchParams(location.search);
      const currentChatId = currentSearchParams.get("chat");
      const isCurrentActiveChat = isInbox && currentChatId === conversationId;

      // Play sound chime for all incoming messages/notifications
      playWhatsAppIncomingChime();

      // If document is hidden / tab in background, show Desktop Notification
      if (typeof document !== "undefined" && document.hidden) {
        sendDesktopNotification({
          title: data.title || "💬 Nouveau message WhatsApp",
          body: data.body || "Vous avez reçu un nouveau message.",
          tag: conversationId ? `chat-${conversationId}` : "vendeur-ia-chat",
          onClick: () => {
            window.focus();
            navigate(targetUrl);
          }
        });
      }

      // If user is currently looking at this exact chat in foreground, don't show toast banner
      if (isCurrentActiveChat && typeof document !== "undefined" && !document.hidden) {
        return;
      }

      // Show clickable toast notification if on other pages or looking at different chat
      toast(data.title || "💬 Nouveau message WhatsApp", {
        description: data.body,
        duration: 6000,
        action: {
          label: "💬 Ouvrir",
          onClick: () => {
            navigate(targetUrl);
          }
        }
      });
    };

    const handleIncomingAdminPayment = (data: any) => {
      const targetIntentId = data?.intentId || data?.data?.intentId || "";
      const targetReference = data?.reference || data?.data?.reference || "";
      const targetUrl = `/admin?tab=payments${targetIntentId ? `&intentId=${targetIntentId}` : (targetReference ? `&reference=${targetReference}` : "")}`;

      const amountFormatted = data?.amount ? `${Number(data.amount).toLocaleString("fr-FR")} ${data.currency || "XOF"}` : "";
      const intervalLabel = data?.billingInterval === "yearly" ? "Annuel (-17%)" : "Mensuel";
      const merchantLabel = data?.merchantName || data?.senderPhone || "Un marchand";
      const title = `💰 Nouveau Paiement Reçu${amountFormatted ? ` • ${amountFormatted}` : ""}`;
      const desc = `${merchantLabel} (${data?.planName || "Formule"} • ${intervalLabel})`;

      playPaymentNotificationChime(0.7);

      if (typeof document !== "undefined" && document.hidden) {
        sendDesktopNotification({
          title,
          body: `${desc}\n👉 Cliquez pour inspecter & valider le reçu.`,
          tag: targetIntentId ? `payment-${targetIntentId}` : "admin-payment",
          onClick: () => {
            window.focus();
            navigate(targetUrl);
          }
        });
      }

      toast.success(title, {
        description: `${desc} — Cliquez pour ouvrir le dossier et valider`,
        duration: 8000,
        action: {
          label: "⚡ Inspecter & Valider",
          onClick: () => {
            navigate(targetUrl);
          }
        }
      });
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("admin:payment_incoming", handleIncomingAdminPayment);
    socket.on("payment:pending_review", handleIncomingAdminPayment);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("admin:payment_incoming", handleIncomingAdminPayment);
      socket.off("payment:pending_review", handleIncomingAdminPayment);
    };
  }, [socket, navigate, location.pathname, location.search]);
}

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "./useSocket";
import { playWhatsAppIncomingChime, sendDesktopNotification } from "@/lib/sound";
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

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [socket, navigate, location.pathname, location.search]);
}

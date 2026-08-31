/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Web Push Notification Event Handler
self.addEventListener('push', (event: PushEvent) => {
  const showPush = async () => {
    try {
      if (!event.data) {
        return await self.registration.showNotification("Vendeur IA OS 🚀", {
          body: "Nouveau message reçu sur votre boutique.",
          icon: "/android-chrome-192x192.png",
          badge: "/favicon-32x32.png",
          data: { url: "/inbox" },
          tag: "vendeur-ia-chat"
        });
      }

      let payload: any = {};
      try {
        payload = event.data.json();
      } catch {
        payload = { title: "Vendeur IA OS 🚀", body: event.data.text() };
      }

      const title = payload.title || "Vendeur IA OS 🚀";
      const targetUrl = payload.data?.url || (payload.data?.conversationId ? `/inbox?chat=${payload.data.conversationId}` : '/inbox');

      let actions: Array<{ action: string; title: string }> = [];
      if (payload.actions && Array.isArray(payload.actions)) {
        actions = payload.actions;
      } else if (payload.data?.conversationId) {
        actions = [
          { action: "open_chat", title: "💬 Ouvrir la discussion" }
        ];
      }

      const tag = payload.tag || (payload.data?.conversationId ? `chat-${payload.data.conversationId}` : 'vendeur-ia-chat');

      const options: any = {
        body: payload.body || "Nouveau message client reçu sur WhatsApp.",
        icon: payload.icon || "/android-chrome-192x192.png",
        badge: "/favicon-32x32.png",
        data: {
          ...(payload.data || {}),
          url: targetUrl
        },
        vibrate: [200, 100, 200],
        tag,
        renotify: true,
        actions
      };

      await self.registration.showNotification(title, options);
    } catch (err) {
      console.warn("[SW Push Error]", err);
      await self.registration.showNotification("Vendeur IA OS", {
        body: "Nouveau message client reçu.",
        icon: "/android-chrome-192x192.png",
        badge: "/favicon-32x32.png",
        data: { url: "/inbox" },
        tag: "vendeur-ia-chat"
      });
    }
  };

  event.waitUntil(showPush());
});

// Notification Click Event Handler
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  let targetUrl = notifData.url || '/inbox';

  if (event.action === 'inspect' && notifData.reference) {
    targetUrl = notifData.url || '/admin';
  } else if (event.action === 'open_chat' && notifData.conversationId) {
    targetUrl = `/inbox?chat=${notifData.conversationId}`;
  }

  const origin = self.location.origin;
  const fullTargetUrl = new URL(targetUrl, origin).href;

  event.waitUntil(
    (async () => {
      try {
        const clientList = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });

        // Check if an existing tab on the same origin is open
        for (const client of clientList) {
          if (client.url && client.url.startsWith(origin) && 'focus' in client) {
            // Send message to client for immediate in-app SPA routing
            client.postMessage({
              type: 'NAVIGATE_TO',
              url: targetUrl,
              data: notifData
            });

            // If the client is not already on the full target URL, navigate safely
            if ('navigate' in client && client.url !== fullTargetUrl) {
              try {
                await client.navigate(fullTargetUrl);
              } catch (navErr) {
                console.warn('[SW] client.navigate fallback:', navErr);
              }
            }

            return await client.focus();
          }
        }

        // If no window is currently open, open a new window
        if (self.clients.openWindow) {
          return await self.clients.openWindow(fullTargetUrl);
        }
      } catch (err) {
        console.error('[SW] Notification click handler error:', err);
        if (self.clients.openWindow) {
          return await self.clients.openWindow(fullTargetUrl);
        }
      }
    })()
  );
});

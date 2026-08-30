/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Web Push Notification Event Handler
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || "Vendeur IA OS";
    
    // Determine accurate destination URL
    const targetUrl = payload.data?.url || (payload.data?.conversationId ? `/inbox?chat=${payload.data.conversationId}` : '/inbox');
    
    // Contextual Actions based on payload type
    let actions: Array<{ action: string; title: string }> = [];
    if (payload.actions && Array.isArray(payload.actions)) {
      actions = payload.actions;
    } else if (payload.data?.conversationId) {
      actions = [
        { action: "open_chat", title: "💬 Ouvrir la discussion" }
      ];
    } else if (payload.data?.reference) {
      actions = [
        { action: "inspect", title: "🔍 Inspecter" },
        { action: "open", title: "⚡ Ouvrir Admin" }
      ];
    }

    const options: any = {
      body: payload.body || "Nouvelle notification reçue sur Vendeur IA.",
      icon: payload.icon || "/android-chrome-192x192.png",
      badge: "/favicon-32x32.png",
      data: {
        ...(payload.data || {}),
        url: targetUrl
      },
      vibrate: [250, 100, 250, 100, 400],
      tag: payload.tag || (payload.data?.conversationId ? `chat-${payload.data.conversationId}` : (payload.data?.reference ? `payment-${payload.data.reference}` : 'vendeur-ia-general')),
      renotify: true,
      requireInteraction: true,
      actions
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const rawText = event.data.text();
    event.waitUntil(
      self.registration.showNotification("Vendeur IA OS", {
        body: rawText,
        icon: "/android-chrome-192x192.png",
        badge: "/favicon-32x32.png",
        data: { url: "/inbox" },
        tag: "vendeur-ia-fallback"
      })
    );
  }
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

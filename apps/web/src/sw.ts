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
    const title = payload.title || "💰 Nouveau Paiement Reçu";
    const options: any = {
      body: payload.body || "Un paiement est en attente de vérification sur Vendeur IA.",
      icon: payload.icon || "/android-chrome-192x192.png",
      badge: "/favicon-32x32.png",
      data: payload.data || { url: "/admin" },
      vibrate: [250, 100, 250, 100, 400],
      tag: payload.data?.reference || "vendeur-ia-payment",
      renotify: true,
      requireInteraction: true,
      actions: payload.actions || [
        { action: "inspect", title: "🔍 Inspecter" },
        { action: "open", title: "⚡ Ouvrir Admin" }
      ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const rawText = event.data.text();
    event.waitUntil(
      self.registration.showNotification("Vendeur IA OS", {
        body: rawText,
        icon: "/android-chrome-192x192.png",
        badge: "/favicon-32x32.png"
      })
    );
  }
});

// Notification Click Event Handler
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/admin';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(targetUrl) || client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

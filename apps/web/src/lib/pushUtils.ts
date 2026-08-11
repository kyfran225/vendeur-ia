import { apiClient } from './apiClient';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(accessToken: string) {
  const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!publicVapidKey) {
    console.warn("[Push] VAPID public key missing.");
    return;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn("[Push] Service Workers or Push not supported.");
    return;
  }

  // Check current permission
  if (Notification.permission === 'denied') {
    console.warn("[Push] Permission explicitly denied by user.");
    return;
  }

  // Request permission if default
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn("[Push] Permission not granted after request.");
      return;
    }
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    console.log("[Push] Service Worker ready.");

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    console.log("[Push] Subscription created:", subscription.endpoint);
    await apiClient.post("/api/commerce/push/subscribe", subscription);

    console.log("[Push] Subscribed successfully on server.");
    return true;
  } catch (err) {
    console.error("[Push] Subscription failed:", err);
    throw err;
  }
}

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

export async function fetchVapidPublicKey(): Promise<string | null> {
  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (envKey && envKey.trim().length > 10) {
    return envKey.trim();
  }

  try {
    const res = await apiClient.get("/api/commerce/push/vapid-public-key");
    if (res.data?.publicKey) {
      return res.data.publicKey;
    }
  } catch (err: any) {
    console.warn("[Push] Could not fetch VAPID public key from backend:", err.message);
  }
  return null;
}

export function getPushPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

export async function subscribeToPush(accessToken?: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn("[Push] Service Workers or Push not supported.");
    return false;
  }

  const publicVapidKey = await fetchVapidPublicKey();
  if (!publicVapidKey) {
    console.warn("[Push] VAPID public key missing or unavailable.");
    return false;
  }

  // Check current permission
  if (Notification.permission === 'denied') {
    console.warn("[Push] Permission explicitly denied by user.");
    return false;
  }

  // Request permission if default
  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn("[Push] Permission not granted after request.");
      return false;
    }
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    console.log("[Push] Service Worker ready.");

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    }

    console.log("[Push] Subscription active:", subscription.endpoint);
    await apiClient.post("/api/commerce/push/subscribe", subscription);

    console.log("[Push] Subscribed successfully on server. ✅");
    return true;
  } catch (err) {
    console.error("[Push] Subscription failed:", err);
    return false;
  }
}


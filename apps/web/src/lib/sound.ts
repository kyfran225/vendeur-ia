// Web Audio API synthesized chimes and Desktop Notification helper for Vendeur IA Admin WhatsApp Inbox

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (err) {
    console.warn("[Sound System] Could not initialize Web Audio Context:", err);
    return null;
  }
}

/**
 * Plays a clean, crisp, WhatsApp-like incoming message bell chime.
 * Synthesized using Web Audio API harmonic oscillators with soft bell envelope.
 */
export function playWhatsAppIncomingChime(): void {
  try {
    const isSoundEnabled = localStorage.getItem("vendeur_inbox_sound_enabled") !== "false";
    if (!isSoundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic frequencies for a bright, pleasant notification chime
    const notes = [
      { freq: 880.0, timeOffset: 0.0, duration: 0.28, gain: 0.25 },   // A5
      { freq: 1174.66, timeOffset: 0.06, duration: 0.32, gain: 0.3 }, // D6
      { freq: 1760.0, timeOffset: 0.12, duration: 0.45, gain: 0.35 }  // A6
    ];

    notes.forEach(({ freq, timeOffset, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + timeOffset);

      // Envelope: Instant attack -> exponential smooth decay
      gainNode.gain.setValueAtTime(0.001, now + timeOffset);
      gainNode.gain.exponentialRampToValueAtTime(gain, now + timeOffset + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + duration);
    });
  } catch (err) {
    console.warn("[Sound System] Error playing incoming chime:", err);
  }
}

/**
 * Plays a subtle pop sound when an admin message is sent.
 */
export function playMessageSentPop(): void {
  try {
    const isSoundEnabled = localStorage.getItem("vendeur_inbox_sound_enabled") !== "false";
    if (!isSoundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch (err) {
    console.warn("[Sound System] Error playing sent pop:", err);
  }
}

/**
 * Requests browser permission for Desktop Notifications.
 */
export async function requestDesktopNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn("[Notification] Permission request failed:", err);
    return "denied";
  }
}

/**
 * Sends a native browser desktop notification with click callback.
 */
export function sendDesktopNotification(options: {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      const notif = new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/favicon.ico",
        tag: options.tag || "vendeur-ia-chat",
        silent: true // We play our custom audio chime separately
      });

      notif.onclick = () => {
        window.focus();
        options.onClick?.();
        notif.close();
      };
    } catch (err) {
      console.warn("[Notification] Error displaying desktop notification:", err);
    }
  }
}

/**
 * Get or set sound preference
 */
export function getSoundPreference(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("vendeur_inbox_sound_enabled") !== "false";
}

export function setSoundPreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("vendeur_inbox_sound_enabled", enabled ? "true" : "false");
}

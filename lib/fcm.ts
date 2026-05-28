import { getToken, onMessage } from "firebase/messaging";
import { toast } from "sonner";
import {
  registerFcmToken,
  removeFcmToken
} from "@/external-api/functions/auth.api";
import { getMessagingIfSupported } from "./firebase";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;
const TOKEN_STORAGE_KEY = "fcm_web_token";

let foregroundUnsubscribe: (() => void) | null = null;

const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  const existing = await navigator.serviceWorker.getRegistration(
    "/firebase-messaging-sw.js"
  );
  if (existing) return existing;
  return navigator.serviceWorker.register("/firebase-messaging-sw.js", {
    scope: "/"
  });
};

/**
 * Ask for permission, fetch the FCM web token, and POST it to the backend.
 * Safe to call repeatedly — the backend uses $addToSet so duplicates are no-ops.
 */
export const initWebPush = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator))
    return null;

  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;

  if (permission !== "granted") return null;

  const swRegistration = await registerServiceWorker();

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swRegistration
  });

  if (!token) return null;

  if (localStorage.getItem(TOKEN_STORAGE_KEY) !== token) {
    await registerFcmToken(token);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  // Foreground messages: the browser suppresses notifications when the tab is
  // focused, so we show an in-app toast instead.
  if (foregroundUnsubscribe) foregroundUnsubscribe();
  foregroundUnsubscribe = onMessage(messaging, (payload) => {
    const data = payload.data || {};
    const title = data.chatName || "New message";
    const body =
      data.isGroup === "true" && data.senderName
        ? `${data.senderName}: ${data.body || ""}`
        : data.body || "";
    toast(title, { description: body });
  });

  return token;
};

/**
 * Remove the locally-stored token from the backend (called on logout).
 * Cleans up the foreground listener too.
 */
export const teardownWebPush = async (): Promise<void> => {
  if (foregroundUnsubscribe) {
    foregroundUnsubscribe();
    foregroundUnsubscribe = null;
  }

  if (typeof window === "undefined") return;
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) return;

  try {
    await removeFcmToken(token);
  } finally {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

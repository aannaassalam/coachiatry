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
  if (existing) {
    // Ensure it's actually active before we ask Firebase for a token —
    // getToken() against a not-yet-activated SW can fail intermittently.
    await navigator.serviceWorker.ready;
    return existing;
  }
  const reg = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
    { scope: "/" }
  );
  await navigator.serviceWorker.ready;
  return reg;
};

// How often to re-confirm the token with the backend while a tab stays open.
// Firebase can rotate the token, and the backend may have pruned it after a
// transient send error — re-registering on a cadence self-heals both.
const RESYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
let resyncTimer: ReturnType<typeof setInterval> | null = null;
let visibilityHandler: (() => void) | null = null;
let lastSyncedAt = 0;

/**
 * Ask for permission, fetch the FCM web token, and POST it to the backend.
 * Safe to call repeatedly — the backend uses $addToSet so duplicates are no-ops.
 */
export const initWebPush = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator))
    return null;

  if (!VAPID_KEY) {
    console.error("[fcm] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set");
    return null;
  }

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

  // ALWAYS register with the backend, even if the token is unchanged locally.
  // The previous "only if changed" gate meant that once the backend pruned a
  // token (e.g. after a transient FCM error), the browser — still holding the
  // same cached token — would never re-add it, and that device went silent
  // forever. Re-POSTing every init is cheap ($addToSet) and self-heals it.
  try {
    await registerFcmToken(token);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    lastSyncedAt = Date.now();
  } catch (err) {
    console.warn("[fcm] failed to register token with backend:", err);
  }

  // FCM fires onMessage (not the SW's onBackgroundMessage) whenever ANY tab of
  // the app is open — even if that tab is unfocused or the browser is in the
  // background. So we branch on whether the app is genuinely in front:
  //   - app in front → in-app toast (the user is looking at the app)
  //   - otherwise    → render a real OS notification ourselves via the SW,
  //                    exactly like the background path.
  //
  // IMPORTANT: `visibilityState` alone is NOT enough. When the user switches to
  // another application, the browser window loses OS focus but the tab stays
  // `visible` (it's still the active tab of its window). Relying only on
  // visibility would then show an invisible in-app toast and the user would see
  // nothing. `document.hasFocus()` goes false when the browser window isn't the
  // foreground app, so we require BOTH to treat the app as "in front".
  if (foregroundUnsubscribe) foregroundUnsubscribe();
  foregroundUnsubscribe = onMessage(messaging, (payload) => {
    const data = payload.data || {};
    const title = data.chatName || "New message";
    const body =
      data.isGroup === "true" && data.senderName
        ? `${data.senderName}: ${data.body || ""}`
        : data.body || "";

    const isInForeground =
      document.visibilityState === "visible" && document.hasFocus();

    if (isInForeground) {
      toast(title, { description: body });
      return;
    }

    // App isn't in front (hidden tab, other tab active, or browser in the
    // background) — show a system notification through the SW.
    swRegistration
      .showNotification(title, {
        body,
        icon: "/android-chrome-192x192.png",
        tag: data.messageId || `${data.chatId || "chat"}-${Date.now()}`,
        data: {
          chatId: data.chatId,
          type: data.type,
          url: data.chatId ? `/chat?room=${data.chatId}` : "/chat"
        }
      })
      .catch((err) =>
        console.warn("[fcm] foreground showNotification failed:", err)
      );
  });

  // Periodic + on-focus re-sync so long-lived tabs stay registered.
  if (!resyncTimer) {
    resyncTimer = setInterval(() => {
      resyncToken().catch(() => {});
    }, RESYNC_INTERVAL_MS);
  }
  if (!visibilityHandler) {
    visibilityHandler = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastSyncedAt > RESYNC_INTERVAL_MS
      ) {
        resyncToken().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", visibilityHandler);
  }

  return token;
};

/**
 * Re-fetch the current token and push it to the backend again. Used by the
 * periodic timer and the visibility handler. Re-registering an unchanged token
 * is a no-op server-side but repairs a token the backend may have dropped.
 */
const resyncToken = async (): Promise<void> => {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;

  const messaging = await getMessagingIfSupported();
  if (!messaging) return;

  const swRegistration = await registerServiceWorker();
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swRegistration
  });
  if (!token) return;

  try {
    await registerFcmToken(token);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    lastSyncedAt = Date.now();
  } catch (err) {
    console.warn("[fcm] token resync failed:", err);
  }
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

  if (resyncTimer) {
    clearInterval(resyncTimer);
    resyncTimer = null;
  }
  if (visibilityHandler && typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", visibilityHandler);
    visibilityHandler = null;
  }
  lastSyncedAt = 0;

  if (typeof window === "undefined") return;
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) return;

  try {
    await removeFcmToken(token);
  } finally {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

// Service workers run outside the Next.js bundle and cannot read process.env,
// so the Firebase web config is inlined here. These values are public — they
// already ship in the client JS bundle.
// Keep this SDK version in sync with the `firebase` package in package.json.
// A large skew between the page SDK (which mints the token) and the SW SDK
// (which handles background messages) can make web push silently misbehave.
importScripts(
  "https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBEWf8zn3LD6hZ9GBfBr7EmLfR7UURj1ug",
  authDomain: "coachiatry-2bc9f.firebaseapp.com",
  projectId: "coachiatry-2bc9f",
  storageBucket: "coachiatry-2bc9f.firebasestorage.app",
  messagingSenderId: "715036103584",
  appId: "1:715036103584:web:6eb42d4dcb5fbd92b5cac5"
});

const messaging = firebase.messaging();

// Activate a new SW version immediately instead of waiting for all tabs to
// close, and take control of open pages. Without this, a deployed SW update
// can sit in "waiting" while the old one keeps handling (or mishandling) push.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim())
);

// Backend sends a data-only message for Android compatibility, and we mirror
// that for web. The SW must render the notification itself.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.chatName || "New message";
  const body =
    data.isGroup === "true" && data.senderName
      ? `${data.senderName}: ${data.body || ""}`
      : data.body || "";

  // Return the promise so the SW stays alive until the notification renders.
  // Skip the senderImage as icon — remote images sometimes fail silently
  // (CORS / auth) and the whole showNotification call then rejects.
  return self.registration.showNotification(title, {
    body,
    icon: "/android-chrome-192x192.png",
    // Tag PER MESSAGE (not per chat) so each message keeps its own entry in the
    // tray instead of replacing the previous one. messageId is unique; fall
    // back to a chat+time key if it's ever missing.
    tag: data.messageId || `${data.chatId || "chat"}-${Date.now()}`,
    data: {
      chatId: data.chatId,
      type: data.type,
      url: data.chatId ? `/chat?room=${data.chatId}` : "/chat"
    }
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/chat";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          const url = new URL(client.url);
          if (url.origin === self.location.origin && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

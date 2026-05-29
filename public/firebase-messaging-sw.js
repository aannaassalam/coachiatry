// Service workers run outside the Next.js bundle and cannot read process.env,
// so the Firebase web config is inlined here. These values are public — they
// already ship in the client JS bundle.
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
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

console.log("[fcm-sw] loaded");

// Raw push listener for debugging: fires for EVERY push, even if Firebase's
// onBackgroundMessage doesn't pick it up. Helps us tell "no push arrived" from
// "push arrived but Firebase didn't dispatch".
self.addEventListener("push", (event) => {
  let parsed = null;
  try {
    parsed = event.data ? event.data.json() : null;
  } catch (e) {
    parsed = event.data ? event.data.text() : null;
  }
  console.log("[fcm-sw] raw push event:", parsed);
});

// Backend sends a data-only message for Android compatibility, and we mirror
// that for web. The SW must render the notification itself.
messaging.onBackgroundMessage((payload) => {
  console.log("[fcm-sw] onBackgroundMessage:", payload);

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
    tag: data.chatId || "chat",
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

importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

// Extract dynamic config passed from client registration query params
const urlParams = new URL(location.href).searchParams;
const firebaseConfig = {
  apiKey: urlParams.get("apiKey"),
  authDomain: urlParams.get("authDomain"),
  projectId: urlParams.get("projectId"),
  storageBucket: urlParams.get("storageBucket"),
  messagingSenderId: urlParams.get("messagingSenderId"),
  appId: urlParams.get("appId"),
};

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Background message listener
  messaging.onBackgroundMessage((payload) => {
    console.log("[ServiceWorker] Received background message: ", payload);

    const title = payload.data?.title || payload.notification?.title || "Loopra";
    const body = payload.data?.body || payload.data?.message || payload.notification?.body || "";
    const image = payload.data?.image || null;
    const deepLink = payload.data?.deepLink || "/dashboard";

    const notificationOptions = {
      body,
      icon: "/icons/logo-96.png",
      badge: "/icons/badge-72.png",
      image: image || undefined,
      data: { deepLink },
      tag: payload.data?.notificationId || "loopra-alert",
      renotify: true,
    };

    self.registration.showNotification(title, notificationOptions);
  });
}

// Notification Tap Interaction - Focus Loopra Tab & Navigate
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.deepLink || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Find active client matching origin
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus().then((focusedClient) => {
            return focusedClient.navigate(targetUrl);
          });
        }
      }
      // If no window clients are open, spawn a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

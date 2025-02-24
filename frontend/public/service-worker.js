const CACHE_NAME = "campus-eats-cache-v1";
const urlsToCache = ["/", "/index.html", "/static/js/bundle.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

self.addEventListener('push', event => {
    const data = event.data.json();
    const options = {
        body: data.body || "New notification!",
        icon: '/test/campus-eats-logo.png',
        badge: '/test/campus-eats-logo.png',
        sound: '/test/notification.wav', // Custom sound path (may vary based on browser support)
        vibrate: [200, 100, 200],
        actions: [
            { action: "open", title: "View Orders" },
            { action: "close", title: "Dismiss" },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || "Campus Eats", options)
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    
    if (event.action === "open") {
      clients.openWindow("/orders"); // Open order page
    }
  
    const audio = new Audio("/test/notification.wav");
    audio.play();
});

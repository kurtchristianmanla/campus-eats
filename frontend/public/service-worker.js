const CACHE_NAME = "campus-eats-cache-v1";
const urlsToCache = [
    "/",
  "/index.html",
  // Don't use /static/js/bundle.js - this path is for development
  // Instead, use patterns that match your production files
  "/static/js/main.*.js",
  "/static/css/main.*.css",
  // Add other important assets
  "/test/campus-eats-logo.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          // Try to cache each URL, but don't fail if some can't be cached
          return Promise.allSettled(
            urlsToCache.map(url => 
              cache.add(url).catch(err => {
                console.warn(`Failed to cache ${url}: ${err.message}`);
                return null;
              })
            )
          );
        })
    );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

self.addEventListener('push', event => {
    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: "Campus Eats",
            body: "New notification!"
        };
    }
    
    const options = {
        body: data.body || "New notification!",
        icon: '/test/campus-eats-logo.png',
        badge: '/test/campus-eats-logo.png',
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
  
    // const audio = new Audio("/test/notification.wav");
    // audio.play();
});

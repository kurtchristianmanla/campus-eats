const CACHE_NAME = "campus-eats-cache-v1.72";

// Use a runtime caching strategy instead of a predefined list
self.addEventListener("install", (event) => {
    self.skipWaiting(); // Activate immediately
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll([
          '/',
          '/index.html',
        //   '/manifest.json',
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
          // Add only critical assets that you're sure exist
          '/test/campus-eats-logo.png'
        ]);
      }).catch(err => {
        console.error('Cache installation failed:', err);
      })
    );
});

// Cache assets as they're requested
self.addEventListener("fetch", (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
  
        // Clone the request - request can only be used once
        const fetchRequest = event.request.clone();
  
        // Make the network request
        return fetch(fetchRequest).then((response) => {
          // Don't cache if not a valid response or not from same origin
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
  
          // Clone the response - response can only be used once
          const responseToCache = response.clone();
  
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
  
          return response;
        });
      })
    );
});

// Add this to handle updates and remove old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              // Delete old caches
              return caches.delete(cacheName);
            }
          })
        );
      }).then(() => {
        // Claim clients to take control immediately
        self.clients.claim();
      })
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

    let urlOrders = "/customer/orders"; // Default to customer orders
    if (event.notification.data?.userType === "seller") {
        urlOrders = "/seller/orders";
    }
    
    if (event.action === "open") {
      clients.openWindow(urlOrders); // Open order page
    } else if (event.action === "view") {
      clients.openWindow("/"); // Open your app
    } else if (event.action === "dismiss") {
      console.log("Notification dismissed");
    }
    // const audio = new Audio("/test/notification.wav");
    // audio.play();

    event.waitUntil(clients.openWindow(urlOrders));
});

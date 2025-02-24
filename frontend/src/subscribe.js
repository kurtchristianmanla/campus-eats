import api from "./components/api/interceptor";

export function subscribeUser() {
    if (!("serviceWorker" in navigator)) {
        console.error("Service workers are not supported in this browser.");
        return;
    }

    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager
        .subscribe({
            userVisibleOnly: true,
            applicationServerKey: "BEStfNvXPWzeQaUIY-g5lLoEf7WlIemaHqNv_3zinelWE441m04K9peJ1odXqbhK_DGxk5bVIGCTmrGWXaaxPYI", // Replace with real VAPID key
        })
        .then((subscription) => {
            console.log("User is subscribed:", subscription);
            
            // Send subscription data to your backend using Axios
            api.post("/push/subscribe", subscription, {
                headers: { "Content-Type": "application/json" },
            })
                .then((response) => {
                console.log("Subscription saved:", response.data);
            })
                .catch((error) => {
                console.error("Subscription error:", error);
            });
        })
        .catch((error) => {
            console.error("Failed to subscribe user:", error);
        });
    });
  }
  
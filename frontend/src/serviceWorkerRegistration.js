export function register() {
  if ('serviceWorker' in navigator) {
    return new Promise((resolve, reject) => {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js', { scope: '/' })
          .then(registration => {
            console.log('Service Worker registered:', registration);
            resolve(registration);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
            reject(error);
          });
      });
    });
  }
  return Promise.resolve();
}
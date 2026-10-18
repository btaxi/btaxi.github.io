/* BTAXI notification worker - separate scope; no application fetch/cache logic. */
self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const target = event.notification && event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : self.registration.scope;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
    for (const client of clientList) {
      if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
        if ('navigate' in client && client.url !== target) {
          return client.navigate(target).then(function(navigated) { return navigated ? navigated.focus() : client.focus(); });
        }
        return client.focus();
      }
    }
    return self.clients.openWindow(target);
  }));
});

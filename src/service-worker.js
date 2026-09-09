self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(self.registration.showNotification(data.title || "Should I Work Out Today?", {
    body: data.body || "Your daily reason to move is here.",
    icon: data.icon || "/assets/images/icon-192.png",
    badge: data.badge || "/assets/images/icon-192.png",
    data: { url: data.url || "/" },
    tag: "daily-workout-motivation",
    renotify: true
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => client.url === target);
    return existing ? existing.focus() : clients.openWindow(target);
  }));
});

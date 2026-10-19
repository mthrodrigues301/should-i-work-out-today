self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(self.registration.showNotification(data.title || "YES. TIME TO WORK OUT.", {
    body: data.body || "Your daily reason to move is here.",
    icon: data.icon || "/assets/images/icon-192.png",
    badge: data.badge || "/assets/images/icon-192.png",
    data: { url: data.url || "/" },
    tag: data.tag || "daily-workout-motivation",
    renotify: true
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requested = new URL(event.notification.data?.url || "/", self.location.origin);
  const target = requested.origin === self.location.origin ? requested.href : self.location.origin;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => client.url === target);
    return existing ? existing.focus() : clients.openWindow(target);
  }));
});

const TRAINING_CACHE='siwt-training-v9';
const TRAINING_ASSETS=['/my-workout/','/my-workout/index.html','/my-workout/style.css','/my-workout/design.css','/my-workout/theme.js','/assets/fonts/anton-latin-400-normal.woff2','/my-workout/app.js','/my-workout/history.js','/my-workout/history-store.js','/my-workout/history.html','/my-workout/training.js','/my-workout/validity.js','/my-workout/expiry-push.js','/my-workout/rest-push.js','/my-workout/sound.js','/workout-history.js','/my-workout/icon-192.png','/my-workout/icon-512.png','/my-workout/manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(TRAINING_CACHE).then(cache=>cache.addAll(TRAINING_ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('siwt-training-')&&key!==TRAINING_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!(url.pathname.startsWith('/my-workout')||url.pathname==='/workout-history.js'))return;event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(TRAINING_CACHE).then(cache=>cache.put(event.request,copy)))}return response}).catch(()=>caches.match(event.request).then(response=>response||(event.request.mode==='navigate'?caches.match(url.pathname==='/my-workout/history'?'/my-workout/history.html':'/my-workout/'):Response.error()))))});

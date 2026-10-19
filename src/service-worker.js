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
const TRAINING_ASSETS=['/treino/','/treino/index.html','/treino/style.css','/treino/design.css','/treino/theme.js','/assets/fonts/anton-latin-400-normal.woff2','/treino/app.js','/treino/history.js','/treino/history-store.js','/treino/history.html','/treino/training.js','/treino/validity.js','/treino/expiry-push.js','/treino/rest-push.js','/treino/sound.js','/workout-history.js','/treino/icon-192.png','/treino/icon-512.png','/treino/manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(TRAINING_CACHE).then(cache=>cache.addAll(TRAINING_ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('siwt-training-')&&key!==TRAINING_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!(url.pathname.startsWith('/treino')||url.pathname==='/workout-history.js'))return;event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(TRAINING_CACHE).then(cache=>cache.put(event.request,copy)))}return response}).catch(()=>caches.match(event.request).then(response=>response||(event.request.mode==='navigate'?caches.match(url.pathname==='/treino/history'?'/treino/history.html':'/treino/'):Response.error()))))});

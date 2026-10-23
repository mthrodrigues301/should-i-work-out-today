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

const TRAINING_CACHE='siwt-training-v14';
const TRAINING_CORE_ASSETS=['/my-workout/','/my-workout/index.html','/my-workout/style.css','/my-workout/design.css','/my-workout/theme.js','/my-workout/icons.js','/my-workout/text.js','/my-workout/workout-plan.js','/my-workout/app.js','/my-workout/history.js','/my-workout/history-store.js','/my-workout/profile-store.js','/my-workout/history.html','/my-workout/training.js','/my-workout/validity.js','/my-workout/expiry-push.js','/my-workout/rest-push.js','/my-workout/sound.js','/workout-history.js'];
const TRAINING_OPTIONAL_ASSETS=['/assets/fonts/anton-latin-400-normal.woff2','/assets/images/favicon.svg','/my-workout/icon-192.png','/my-workout/icon-512.png','/my-workout/manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(TRAINING_CACHE);await cache.addAll(TRAINING_CORE_ASSETS);await Promise.all(TRAINING_OPTIONAL_ASSETS.map(asset=>cache.add(asset).catch(()=>{})));await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('siwt-training-')&&key!==TRAINING_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||!(url.pathname.startsWith('/my-workout')||url.pathname==='/workout-history.js'))return;
  event.respondWith((async()=>{
    const cache=await caches.open(TRAINING_CACHE);
    const isNavigation=request.mode==='navigate';
    const fallbackPath=url.pathname==='/my-workout/history'?'/my-workout/history.html':'/my-workout/';
    const cached=await cache.match(request)||(isNavigation?await cache.match(fallbackPath):null);
    const refresh=fetch(request).then(response=>{
      if(response.ok)return cache.put(request,response.clone()).then(()=>response);
      return response;
    }).catch(()=>null);
    if(cached){event.waitUntil(refresh.then(()=>{}));return cached}
    const response=await refresh;
    if(response)return response;
    if(isNavigation)return await cache.match(fallbackPath)||Response.error();
    return Response.error();
  })().catch(()=>fetch(request)));
});
